import { ReturnModelType, getModelForClass } from '@typegoose/typegoose';
import {
  AnyParamConstructor,
  BeAnObject,
  IObjectWithTypegooseFunction,
  ModelType,
} from '@typegoose/typegoose/lib/types';
import _ from 'lodash';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { Document } from 'mongoose';
import { FindOneReturnType } from './templates/types';

const skippedArrayFields = ['$or'];
const processOperators = (queryA: {
  [x: string]: any;
  _select?: string | string[] | undefined;
  _order?: 'asc' | 'desc' | undefined;
  _orderBy?: string | undefined;
  _populate?: string | string[] | undefined;
  _limit?: string | undefined;
  _offset?: string | undefined;
  _page?: string | undefined;
  _searchBy?: string | string[] | undefined;
  _keyword?: string | undefined;
  _filterOnPopulate?: boolean | undefined;
}) => {
  const query = queryA;
  const operators = ['lt', 'lte', 'gt', 'gte', 'in', 'nin', 'ne', 'eq'];
  operators.forEach((operator) => {
    if (query[operator]) {
      query[`$${operator}`] = query[operator];
    }
  });
  Object.keys(query).forEach((value) => {
    if (query[value]) {
      if (query[value] === 'true') {
        query[value] = true;
      } else if (query[value] === 'false') {
        query[value] = false;
      }
      if (typeof query[value] === 'string') {
        if (query[value].split('<=').length > 1) {
          query[value] = { $lte: query[value].split('<=')[1] };
        } else if (query[value].split('>=').length > 1) {
          query[value] = { $gte: query[value].split('>=')[1] };
        } else if (query[value].split('!=').length > 1) {
          query[value] = { $ne: query[value].split('!=')[1] };
        } else if (query[value].split('<').length > 1) {
          query[value] = { $lt: query[value].split('<')[1] };
        } else if (query[value].split('>').length > 1) {
          query[value] = { $gt: query[value].split('>')[1] };
        } else if (query[value].split('#').length > 1) {
          query[value] = new RegExp(query[value].split('#')[1], 'i');
        } else if (query[value].split('%').length > 1) {
          query[value] = { $size: query[value].split('%')[1] };
        } else if (query[value].split('==').length > 1) {
          query[value] = { $in: query[value].split('==')[1].split(',') };
        }
      }
    }
  });
  return query;
};

const processPopulate = (query: string) => {
  const paths = query.split('.');
  let currentPopulate;
  while (paths.length) {
    const path = paths.pop();
    const populate = { path };
    if (currentPopulate) {
      currentPopulate = { path, populate: currentPopulate };
    } else {
      currentPopulate = populate;
    }
  }

  return currentPopulate;
};

export type QueryReturn<DT> = {
  docs: DT[];
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  totalDocs: number;
  totalPages: number;
};

export type FindQuery<T = any> = FilterQuery<T> & {
  _select?: string | Array<string>;
  _order?: 'asc' | 'desc';
  _orderBy?: string;
  _populate?: string | Array<string>;
  _limit?: string;
  _offset?: string;
  _page?: string;
  _searchBy?: string | Array<string>;
  _keyword?: string;
  _filterOnPopulate?: boolean;
};

// merge
// _populate: [ 'createdBy', 'createdBy.colleges', 'createdBy.profile' ]
// _populate job
export const mergeQueries = (
  queryA: any,
  queryB: { [key: string]: string | Array<string> },
) => {
  const query = queryA;
  Object.keys(queryB).forEach((field) => {
    if (query[field]) {
      if (Array.isArray(query[field])) {
        query[field] = [
          ...query[field],
          ...(Array.isArray(queryB[field]) ? queryB[field] : [queryB[field]]),
        ];
      } else {
        query[field] = [
          query[field],
          ...(Array.isArray(queryB[field]) ? queryB[field] : [queryB[field]]),
        ];
      }
      //else turn q
      // query[field] = { ...query[field], ...queryB[field] };
    } else {
      query[field] = queryB[field];
    }
  });
  return query;
};
const get = async <DT extends AnyParamConstructor<any>>(
  model: ReturnModelType<DT, BeAnObject>,
  queryA: FindQuery,
  conditionsA: FindQuery = {},
  multiple = true,
) => {
  try {
    let query = queryA;
    let conditions = conditionsA;
    const populate = query._populate || conditions._populate;
    const select = query._select || conditions._select;
    const limit = parseInt(query._limit || conditions._limit || '10', 10);
    const page = parseInt(query._page || conditions._page || '1', 10);
    const orderBy = query._orderBy || conditions._orderBy || 'createdAt';
    const order = query._order || conditions._order || 'desc';
    const searchBy = query._searchBy || conditions._searchBy;
    const keyword = query._keyword || conditions._keyword;
    const skip = (page - 1) * limit;

    // omit any field in query that's not in the model

    query = _.omit(query, [
      '_select',
      '_order',
      '_orderBy',
      '_populate',
      '_limit',
      '_offset',
      '_page',
    ]);
    conditions = _.omit(conditions, [
      '_select', // To select a particular field
      '_order', // Ascending or Descending. asc / desc
      '_orderBy', // the field to order
      '_populate',
      '_limit',
      '_offset', // The number of records to skip
      '_page',
    ]);

    // deep copy required conditions
    const requiredConditions = _.cloneDeep(conditions);

    console.log(query, 'conditions', conditions);
    if (!_.isEmpty(query)) {
      processOperators(query);
      Object.keys(query).forEach((field: any) => {
        conditions[field] = query[field];
      });
    }

    conditions = _.omit(conditions, ['_searchBy', '_keyword']);

    // get all key item that have value as array
    const arrayFields = _.pickBy(conditions, (value) => Array.isArray(value));
    console.log('arrayFields', arrayFields);

    const andQueries: any[] = [];
    // process operator for each arrayFields
    Object.keys(arrayFields).forEach((field) => {
      //field e.g updatedAt
      // console.log('field', field)
      // skip if field is in skippedArrayFields
      if (skippedArrayFields.includes(field)) {
        return;
      }
      const arrayField = arrayFields[field];
      // const arrayFieldQuery = {};
      if (Array.isArray(arrayField)) {
        arrayField.forEach((value) => {
          const processedOp = processOperators({
            [field]: value,
          });
          console.log('processedOp', processedOp);
          andQueries.push(processedOp);
        });
      }

      // andQueries.push({ [field]: arrayFieldQuery });
    });

    // delete all array fields from conditions
    Object.keys(arrayFields).forEach((field) => {
      delete conditions[field];
    });

    conditions = {
      ...conditions,
      $and: [...andQueries, requiredConditions],
    };
    if (searchBy || keyword) {
      if (Array.isArray(searchBy)) {
        const searchQuery: { [x: number]: any }[] = [];
        searchBy.forEach((field) => {
          // searchQuery[field] = _keyword;
          if (keyword) searchQuery.push({ [field]: new RegExp(keyword, 'i') });
        });
        conditions = {
          ...conditions,
          $or: searchQuery,
        };
      }

      // else if (_searchBy) {
      //   searchQuery[_searchBy] = new RegExp(_keyword, 'i');
      //   Object.keys(searchQuery).forEach((field) => {
      //     conditions[field] = searchQuery[field];
      //     // use or instead of and
      //   });
      // }
      // remove the _searchBy and _keyword from the conditions
      conditions = _.omit(conditions, ['_searchBy', '_keyword']);
      // add the searchQuery to the conditions
    }

    console.log('conditions before filtering', conditions);

    const fields = Object.keys(model.schema.paths);
    // const filteredQuery = _.pick(conditions, fields);
    // filter query without removing those that start with $
    // check if the model is set to strict or not
    const schema: any = model?.schema || {};
    const { strict } = (schema?.options || {}) as { strict: boolean };
    console.log('strict', strict);
    let _filterOnPopulate = false;
    if (conditions._filterOnPopulate) {
      const models: any = {};

      mongoose.modelNames().forEach((modelName) => {
        models[modelName?.toLowerCase()] = mongoose.model(modelName);
        //TODO: Do a work around for refPath
      });

      const mainModel = model;
      // console.info(models, 'models', model.schema.paths.contacts?.caster?.options?.ref);
      for (const field of Object.keys(conditions || {})) {
        const fieldParts = field.split('.');
        const docName =
          (mainModel.schema?.paths[fieldParts[0]] as any)?.caster?.options
            ?.ref ||
          (mainModel.schema?.paths[fieldParts[0]] as any)?.options?.ref ||
          '';
        // console.info(docName, 'docName', models);
        // const model = models[fieldParts[0]?.toLowerCase()];
        const model: Model<any> = models[docName?.toLowerCase()];
        // console.info(model, 'model');
        if (model) {
          // const modelFields = Object.keys(model.schema.paths);
          // search by the other parts of fieldParts
          console.info(fieldParts, 'fieldParts');
          const modelFields = fieldParts.slice(1);
          console.info(modelFields, 'modelFields');
          const filteredQuery: any = {};
          modelFields.forEach((modelField) => {
            const theField = fieldParts[0].concat('.', modelField);
            filteredQuery[modelField] = conditions[theField];
          });
          // if filtered query is not empty
          if (!_.isEmpty(filteredQuery)) {
            const ids = await model.find(filteredQuery, '_id');
            console.info(filteredQuery, 'filteredQuery', ids, 'ids');
            if (!conditions[fieldParts[0]]) {
              conditions[fieldParts[0]] = { $in: ids };
            }
          }
          delete conditions[field];
          console.info(conditions, 'conditions', conditions[fieldParts[0]]);
        }
      }
      _filterOnPopulate = true;
      delete conditions._filterOnPopulate;
    } else if (strict) {
      const filteredQuery = _.pickBy(conditions, (value, key) => {
        if (key.startsWith('$')) {
          return true;
        }
        return fields.includes(key);
      });
      conditions = filteredQuery;
      console.log('conditions after filtering', conditions);
    }

    console.log('final condition before query', conditions);

    // let q = model[multiple ? 'find' : 'findOne'](conditions);
    // let q: mongoose.Query<DT, DT>;
    let q:
      | mongoose.QueryWithHelpers<
          mongoose.IfAny<
            InstanceType<DT>,
            any,
            mongoose.Document<unknown, BeAnObject, InstanceType<DT>> &
              Omit<mongoose.Require_id<InstanceType<DT>>, 'typegooseName'> &
              IObjectWithTypegooseFunction
          >[],
          mongoose.IfAny<
            InstanceType<DT>,
            any,
            mongoose.Document<unknown, BeAnObject, InstanceType<DT>> &
              Omit<mongoose.Require_id<InstanceType<DT>>, 'typegooseName'> &
              IObjectWithTypegooseFunction
          >,
          BeAnObject,
          InstanceType<DT>,
          'find'
        >
      | mongoose.QueryWithHelpers<
          mongoose.IfAny<
            InstanceType<DT>,
            any,
            mongoose.Document<unknown, BeAnObject, InstanceType<DT>> &
              Omit<mongoose.Require_id<InstanceType<DT>>, 'typegooseName'> &
              IObjectWithTypegooseFunction
          > | null,
          mongoose.IfAny<
            InstanceType<DT>,
            any,
            mongoose.Document<unknown, BeAnObject, InstanceType<DT>> &
              Omit<mongoose.Require_id<InstanceType<DT>>, 'typegooseName'> &
              IObjectWithTypegooseFunction
          >,
          BeAnObject,
          InstanceType<DT>,
          'findOne'
        >;

    if (multiple) {
      q = model.find(conditions);
    } else {
      q = model.findOne(conditions) as any;
    }

    console.log('final Populate: ', populate);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((field) => {
          q = (q as any).populate(processPopulate(field));
        });
      } else {
        q = (q as any).populate(processPopulate(populate));
      }
    }
    if (select) {
      if (Array.isArray(select) && select.length) {
        q = q.select(select.join(' '));
      } else {
        q = q.select(select);
      }
    }
    if (multiple) {
      const total = await model.countDocuments(conditions);
      q = q
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order });
      const docs = await q.skip(skip).limit(limit);
      console.log('final condition', conditions);
      return {
        docs,
        page,
        hasNextPage: total > page * limit,
        hasPreviousPage: page > 1,
        nextPage: page + 1 > total ? null : page + 1,
        previousPage: page - 1 < 1 ? null : page - 1,
        limit,
        totalDocs: total,
        totalPages: Math.ceil(total / limit) > 0 ? Math.ceil(total / limit) : 1,
      };
    }
    return q;
  } catch (e) {
    console.log(e);
    throw new Error('An error occured with your query');
  }
};

// <DT extends AnyParamConstructor<any>>
export const find = async <DT extends AnyParamConstructor<any>>(
  model: ReturnModelType<DT, BeAnObject>,
  query: FindQuery,
  conditions?: FindQuery,
): Promise<QueryReturn<InstanceType<DT>>> =>
  get(model, query, conditions) as unknown as QueryReturn<InstanceType<DT>>;

export const findOne = async <DT extends AnyParamConstructor<any>>(
  model: ReturnModelType<DT, BeAnObject>,
  query: FindQuery,
  conditions?: FindQuery,
): Promise<FindOneReturnType<InstanceType<DT>> | null> =>
  get(model, query, conditions, false) as unknown as FindOneReturnType<
    InstanceType<DT>
  >;

export default {
  find,
  findOne,
};
