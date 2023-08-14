import _ from 'lodash';
import mongoose, { modelNames } from 'mongoose';
import response from '../../utilities/response';
import { find, findOne } from '../../utilities/query';
import { uploadTheFile } from '../../services/fileUpload';
import Settings from '../../models/settingsModel';
import User from '../../models/userModel';
import { authenticator } from '../../middlewares/authentication';
import { NextFunction, Request, Response } from 'express';
import { validForm } from '../../middlewares/validators';
import fs from 'fs';
import thePermission from '../../utilities/permission';
import path from 'path';
import {
  mongooseDocsJSON,
  mongooseDocsOutputHTML,
} from '../../mongoose-docs/src';
import app from '../..';
import axios from 'axios';
import { FileModel } from '../../models';
let models: any = {};

export async function importAllModels(
  importPath: string = path.resolve(__dirname, '../../models'),
) {
  try {
    const allFiles = fs.readdirSync(importPath);

    const mappedFiles = allFiles
      .filter((fileName) => fileName.match(/\.ts$/))
      .map((fileName) => {
        return import(path.join(importPath, fileName));
      });

    // wait for all element in mappedFiles to fulfill then assign the module name to models
    for (let i = 0; i < mappedFiles.length; i += 1) {
      const module = await mappedFiles[i];
      if (module.default) {
        models[module.default.modelName] = module.default;
      }
    }

    // const settings = await Settings.findOne();
    // if (settings.showDocs !== true) {
    //   return;
    // }

    const schemaJSON = mongooseDocsJSON(mongoose);

    mongooseDocsOutputHTML(schemaJSON, __dirname + '../../../../public/docs');
    return models;
  } catch (err) {
    console.log(err, 'error in generating docs');
  }
}

modelNames().forEach((modelName) => {
  models[modelName] = mongoose.model(modelName);
});

try {
} catch (err) {
  console.log(err, 'error in generating docs');
}

const allUserTypes = (User.schema.path('type') as any).enumValues;
const dataTypes: any = Settings.schema.path('dataTypes');

let typeList = [...(dataTypes?.defaultValue() || [])];

const schemaStrict = true;

const defaultSchema = new mongoose.Schema(
  {},
  {
    timestamps: true,
    _id: true,
    strict: false,
  },
);
const schemas: any = {
  data: new mongoose.Schema({}, {}),
};
const createModel = async () => {
  try {
    let modelsNames = [];

    const settings = await Settings.findOne();

    modelsNames = [...typeList, ...(settings?.dataTypes || [])];

    // const thePromises = [];
    modelsNames.forEach((model) => {
      // check if model already exists
      if (mongoose.models[model]) {
        return;
      }
      mongoose.model(model, schemas[model] || defaultSchema);

      // thePromises.push(themodel);
    });

    const allModelNameThatStartsWithSmallCase = modelNames().filter(
      (model: any) => model.charAt(0) === model.charAt(0).toLowerCase(),
    );

    typeList = [...typeList, ...allModelNameThatStartsWithSmallCase];
    modelNames().forEach((modelName) => {
      models[modelName] = mongoose.model(modelName);
    });

    // Pass in the Mongoose instance with the models implemented.
    // const schemaJSON = mongooseDocsJSON(mongoose);

    // Output documentation into HTML files
    // mongooseDocsOutputHTML(schemaJSON, __dirname + '/docs');
  } catch (error) {
    console.log(error, 'error');
  }
};
//TODO: call in index.ts
// createModel();
const defaultRule = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  onlyForCreator: false,
  singleDocument: false,
};
// NOTE: if onlyForCreator is true, can read, create, update, delete must be an array of user types
const dataValidations: any = {};

type Validate =
  | Response<any, Record<string, any>>
  | {
      _type: string;
      authorization: any;
      authMessage: string;
      typeMessage: string;
      success: boolean;
      model: any;
      otherQuery: any;
    };

const validateType: any = async (
  req: any,
  res: Response<any, Record<string, any>>,
): Promise<Validate> => {
  const settings = await Settings.findOne();
  typeList = [...typeList, ...(settings?.dataTypes || [])];
  let _type = _.camelCase(req.params._type);
  const camelTypeList = typeList.map((type) => _.camelCase(type));

  if (!camelTypeList?.includes(_type)) {
    return response(
      res,
      404,
      `Route not found`,
      `Invalid type. Must be one of ${typeList?.join(', ')}`,
    );
  }

  modelNames().forEach((modelName) => {
    if (modelName.toLowerCase() === _type?.toLowerCase()) {
      _type = modelName;
    }
  });

  Object.keys(dataValidations).forEach((key) => {
    const value = dataValidations[key];
    delete dataValidations[key];
    dataValidations[key.toLowerCase()] = value;
  });

  let authorization = dataValidations[_type?.toLowerCase()] || {};
  let authMessage;
  authorization = { ...defaultRule, ...authorization };
  const authenticated = await authenticator(req, [
    process.env.USER_JWT_SECRET,
    process.env.ADMIN_JWT_SECRET,
  ]);
  if (authenticated?.success === false) {
    authMessage = authenticated?.message;
  }
  let otherQuery = {};
  const requestMethod = req.method.toLowerCase();

  await Promise.all(
    Object.keys(authorization)?.map(async (key) => {
      if (key === 'canRead' && requestMethod !== 'get') {
        return;
      }
      if (key === 'canCreate' && requestMethod !== 'post') {
        return;
      }
      if (key === 'canUpdate' && requestMethod !== 'put') {
        return;
      }
      if (key === 'canDelete' && requestMethod !== 'delete') {
        return;
      }
      if (!authenticated?.user) {
        authorization[key] = false;
        return;
      }
      if (Array.isArray(authorization[key])) {
        authorization[key] = authorization[key]?.includes(
          authenticated?.user?.type,
        );
      } else if (typeof authorization[key] === 'function') {
        try {
          const callPerm = await authorization[key](req);
          authorization[key] = callPerm.auth;
          otherQuery = {
            ...otherQuery,
            ...callPerm.query,
          };
          authMessage = callPerm.message;
        } catch (error) {
          authorization[key] = false;
        }
      } else if (typeof authorization[key] !== 'boolean') {
        authorization[key] = false;
      }
    }),
  );

  if (authenticated?.user?.isAdmin) {
    authorization.canRead = true;
  }

  if (req.user?.isAdmin) {
    otherQuery = {};
  } else if (authorization?.onlyForCreator) {
    otherQuery = {
      ...otherQuery,
      createdBy: req.user?._id,
    };
  }

  const typeMessage = _.startCase(
    _type?.split('_')?.concat()?.pop() || _type?.split('_')[0],
  );
  const model = mongoose.models[_type];
  return {
    _type,
    typeMessage,
    success: true,
    model,
    authorization,
    otherQuery,
    authMessage,
  };
};
const validator = async (
  req: any,
  res: Response<any, Record<string, any>>,
): Promise<any | Validate> => {
  const validateTypeResult = await validateType(req, res);
  const { typeMessage, _type, model } = validateTypeResult;
  let thebody: any = {};

  if (!validateTypeResult?.success) {
    return validateTypeResult;
  }

  const isStrict = model.schema.options.strict;
  if (isStrict) {
    req.body = validForm(model, req.body);
  }

  // if req.body and req.files is empty
  if (
    Object.keys(req.body || {})?.length === 0 &&
    Object.keys(req.files || {})?.length === 0
  ) {
    return response(res, 400, `Please provide ${typeMessage} details`);
  }
  // if (_.isEmpty(req.body)) {
  //   return response(res, 400, `Please provide data values for ${typeMessage}`);
  // }
  // check req.body object if any key contains date it must be a valid date
  // Object.keys(req.body).forEach((keyC) => {
  // use for loop to map Object.keys

  thebody = req.body;
  const toUploadFiles = (req.files || []) as any[];
  // check if any of the fieldname is in req.body
  const fileFields = toUploadFiles.map(
    (file: { fieldname: any }) => file.fieldname,
  );
  const bodyFields = Object.keys(req.body);
  // fileFields should not be in bodyFields
  const commonFields = _.intersection(fileFields, bodyFields);
  if (commonFields.length > 0) {
    return response(
      res,
      400,
      `${commonFields.join(', ')} key cannot exist in both body and file`,
    );
  }

  return {
    ...validateTypeResult,
    typeMessage,
    success: true,
    thebody,
  };
};

const fileUpload = async (
  req: any,
  body: any,
  model: mongoose.Model<any>,
  refId: string,
) => {
  if (req.files?.length > 0) {
    const uploadedFiles = await uploadTheFile(req);
    const fileObject = uploadedFiles?.fileObject || {};
    // extract out the model field that has file as their ref
    const fileFields: any = model.schema.obj;
    const fileRefFields: any = Object.keys(fileFields).filter(
      (key) => fileFields[key].ref === 'File',
    );
    // check if any of the fileRefFields is in fileObject
    const commonFields = _.intersection(fileRefFields, Object.keys(fileObject));
    // create File for the commonFields
    if (commonFields.length > 0) {
      const filePromises: any = commonFields.map(async (key) => {
        let file = fileObject[key];
        if (!Array.isArray(file)) {
          file = [file];
        }
        // If file is an array, then create a file for each file
        if (Array.isArray(file)) {
          const fileModel = file.map(async (file) => {
            const fileModel = new FileModel({
              ...file,
              ref: refId,
              refType: model.modelName,
              uploadedBy: req?.user?._id,
            });
            const savedFile = await fileModel.save();
            return savedFile;
          });
          const savedFiles = await Promise.all(fileModel);
          return savedFiles;
        }
        // Can be made to be object for single file
      });
      const savedFiles = await Promise.all(filePromises);
      // replace the fileObject with the savedFiles
      savedFiles.forEach((fileA) => {
        let file = fileA;
        if (!Array.isArray(file)) {
          fileObject[file?.fieldname] = file._id;
        } else {
          fileObject[file[0]?.fieldname] = file.map((file) => file._id);
        }
      });
    }

    // preeceede each key in fileObject with req.params._type
    // fileObject = _.mapKeys(fileObject, (value, key) => `${req.params._type}_${key}`);
    const thebody = { ...body, ...fileObject };
    return thebody;
  }
  return body;
};
const updateOne = async (
  req: any,
  res: Response<any, Record<string, any>>,
  next: (arg0: unknown) => any,
) => {
  try {
    const valResult = await validator(req, res);
    const { overwrite } = req.query;

    if (valResult?.success !== true) {
      return valResult;
    }
    const {
      typeMessage,
      _type,
      model,
      authorization,
      otherQuery,
      authMessage,
    } = valResult;
    if (!authorization?.canUpdate) {
      return response(
        res,
        403,
        authMessage ?? `You are not allowed to update ${typeMessage}`,
      );
    }
    let { thebody } = valResult;
    let data = await findOne(model, {
      _id: req.params.id,
      ...otherQuery,
    });

    if (!data) {
      return response(
        res,
        404,
        `${typeMessage} not found or you are not allowed to update it`,
      );
    }
    thebody = await fileUpload(req, thebody, model, req.params?.id);
    // thebody = {
    //   ...(overwrite === 'true' ? {} : data?.toObject()),
    //   ...thebody,
    // };
    const isAdmin = req.user?.isAdmin;
    data = await model.findByIdAndUpdate(
      req.params.id,
      {
        ...thebody,
      },
      {
        new: true,
        runValidators: schemaStrict,
        // strict: schemaStrict ? !!isAdmin : false, // use only if schema has strict: true
      },
    );
    return response(res, 200, `${typeMessage} updated successfully`, data);
  } catch (error) {
    return next(error);
  }
};
const create = async (
  req: Request,
  res: Response<any, Record<string, any>>,
  next: NextFunction,
) => {
  try {
    const valResult = await validator(req, res);

    if (valResult?.success !== true) {
      return valResult;
    }

    const {
      typeMessage,
      _type,
      model,
      authorization,
      otherQuery,
      authMessage,
    } = valResult;
    if (!authorization?.canCreate) {
      return response(
        res,
        403,
        authMessage ?? `You are not allowed to create ${typeMessage}`,
      );
    }
    let { thebody } = valResult;
    if (authorization?.singleDocument) {
      const existingDocument = await model.findOne({
        createdBy: req.user?._id,
      });
      if (existingDocument) {
        req.params.id = existingDocument?._id;
        return updateOne(req, res, next);
      }
    }
    const propertiesExist = await model.findOne({
      ...otherQuery,
      // only match key and value in req.body not necessarily all keys and values in properties
      $and: Object.keys(req.body).map((key) => ({
        [`${key}`]: req.body[key],
      })),
    });

    if (propertiesExist) {
      return response(res, 400, `${typeMessage} already exists`);
    }

    thebody = await fileUpload(req, thebody, model, propertiesExist?._id);
    const data = await model.create({
      ...thebody,
      ...otherQuery,
      createdBy: req?.user?._id,
    });
    return response(res, 201, `${valResult?.typeMessage} created`, data);
  } catch (error) {
    return next(error);
  }
};
const fetchMany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('in fetch many ');
    const validateTypeResult = await validateType(req, res);
    if (validateTypeResult?.success !== true) {
      return validateTypeResult;
    }
    const {
      typeMessage,
      _type,
      model,
      authorization,
      otherQuery,
      authMessage,
    } = validateTypeResult;
    if (!authorization?.canRead) {
      return response(
        res,
        403,
        authMessage || `You are not allowed to perform fetch action`,
      );
    }
    console.log(req.query, 'req.query');
    const data = await find(model, req.query, {
      // _type,
      ...otherQuery,
    });
    return response(res, 200, `${typeMessage} fetched successfully`, data);
  } catch (error) {
    return next(error);
  }
};
const fetchOne = async (
  req: { query: any; params: { id: any } },
  res: Response<any, Record<string, any>>,
  next: (arg0: unknown) => any,
) => {
  try {
    const validateTypeResult = await validateType(req, res);
    if (validateTypeResult?.success !== true) {
      return validateTypeResult;
    }
    const {
      typeMessage,
      _type,
      model,
      authorization,
      otherQuery,
      authMessage,
    } = validateTypeResult;
    if (!authorization?.canRead) {
      return response(
        res,
        403,
        authMessage || `You are not allowed to perform fetch action`,
      );
    }
    const data = await findOne(model, req.query, {
      _id: req.params.id,
      // _type,
      ...otherQuery,
    });
    if (!data) {
      return response(res, 404, `${typeMessage} not found`);
    }
    return response(res, 200, `${typeMessage} fetched successfully`, data);
  } catch (error) {
    return next(error);
  }
};

const deleteOne = async (
  req: Request,
  res: Response<any, Record<string, any>>,
  next: (arg0: unknown) => any,
) => {
  try {
    const validateTypeResult = await validateType(req, res);
    if (validateTypeResult?.success !== true) {
      return validateTypeResult;
    }
    const { typeMessage, model, authorization, otherQuery, authMessage } =
      validateTypeResult;
    if (!authorization?.canDelete) {
      return response(
        res,
        403,
        authMessage || `You are not allowed to delete ${typeMessage}`,
      );
    }
    console.log(req.params.id, 'req.params.id');
    const data = await model.findOne({ _id: req.params.id, ...otherQuery });
    if (!data) {
      return response(res, 404, `${typeMessage} not found`);
    }
    await model.findByIdAndDelete(req.params.id);
    return response(res, 200, `${typeMessage} deleted successfully`, data);
  } catch (error) {
    return next(error);
  }
};

const deleteMany = async (
  req: { body: { ids: any } },
  res: Response<any, Record<string, any>>,
  next: (arg0: unknown) => any,
) => {
  try {
    const validateTypeResult = await validateType(req, res);
    if (validateTypeResult?.success !== true) {
      return validateTypeResult;
    }
    const {
      typeMessage,
      _type,
      model,
      authorization,
      otherQuery,
      authMessage,
    } = validateTypeResult;
    if (!authorization?.canDelete) {
      return response(
        res,
        403,
        authMessage || `You are not allowed to delete ${typeMessage}`,
      );
    }

    const data = await model.deleteMany({
      // _type,
      ...otherQuery,
      // id is in req.body.ids
      _id: { $in: req.body.ids },
    });
    return response(res, 200, `${typeMessage} deleted successfully`, data);
  } catch (error) {
    return next(error);
  }
};

const dataValidate = async (dataId: any, type: any) => {
  const modelNames: any = mongoose.modelNames();
  const model = mongoose.model(modelNames['data.model']);
  const data = await model.findOne({
    _id: dataId,
  });
  if (!data) {
    throw new Error(`Invalid ${type}`);
  }
  return data;
};

const getSingle = async (
  req: { params: { model: string; id: any }; query: any },
  res: Response<any, Record<string, any>>,
  next: (arg0: unknown) => any,
) => {
  try {
    let nameOfModel: string = req.params.model;
    const themodelNames = mongoose.modelNames();
    themodelNames.forEach((modelName: string) => {
      if (modelName.toLowerCase() === nameOfModel.toLowerCase()) {
        nameOfModel = modelName;
      }
    });
    const model = mongoose.models[nameOfModel];
    if (!model) {
      return response(
        res,
        404,
        ` 
        ${req.params.model} is not a valid path.
        `,
        {
          path: req.params.model,
          validPaths: mongoose.modelNames(),
        },
      );
    }
    const data = await findOne(model, req.query, { _id: req.params.id });
    if (!data) {
      return response(res, 404, 'Data not found');
    }
    return response(res, 200, `${nameOfModel} fetched successfully`, data);
  } catch (error) {
    return next(error);
  }
};

async function ValidateRefs(self: any) {
  // if (!self.ref) {
  //   return;
  // }
  const models = mongoose.modelNames();
  // check if self.refType is part of the model names without case sensitivity
  let Model: any;
  models.forEach((model) => {
    if (model?.toLowerCase() === self.refType?.toLowerCase()) {
      Model = mongoose.model(model);
    }
  });
  if (!Model) {
    throw new Error('Invalid reference type');
  }
  const reference = await Model.findById(self.ref);
  console.log(reference);
  if (!reference) {
    throw new Error('Reference does not exist');
  }

  // get all fields with type of objectid and check if they exist
  // can be removed in prod
  const fields: any = Object.keys(self.schema.paths).filter(
    (field) =>
      self?.schema?.paths[field]?.instance === 'ObjectID' &&
      self?.schema?.paths[field]?.options.ref,
  );
  console.log(fields);
  for (const field of fields) {
    if (self[field]) {
      const refModel = mongoose.model(self?.schema?.paths[field]?.options?.ref);
      const ref = await refModel?.findById(self[field]);
      if (!ref) {
        throw new Error(` The ${field} does not exist`);
      }
    }
  }

  return;
}

const batch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const urlWithoutBatch = req.url.split('/batch')[1] + '/';
    //url before batch
    const urlBeforeBatch = req.url.split('/batch')[0];
    const fullUrl = req.protocol + '://' + req.get('host') + urlBeforeBatch;
    console.log(fullUrl, 'fullUrl', req.baseUrl, req.url, req.originalUrl);
    req.url = req.baseUrl + '/' + urlWithoutBatch;
    const originalUrl = fullUrl + req.baseUrl + '/' + urlWithoutBatch;

    console.log(originalUrl, 'originalUrl');
    // req.params must be an array of array
    const { params } = req.body;
    const { body } = req.body;
    // if (!Array.isArray(body)) {
    //   return response(res, 400, 'Body must be an array of object');
    // }
    if (params && !Array.isArray(params)) {
      return response(res, 400, 'Params must be an array of array');
    }

    // for (let i = 0; i < params.length; i++) {
    const bodyItem = req.body.data;

    console.log(bodyItem, 'bodyItem');
    // if (bodyItem && typeof bodyItem !== 'object') {
    //   return response(res, 400, 'Body must be an array of object');
    // } else if (bodyItem) {
    //   req.body = bodyItem;
    // }

    // check if params is an array of array
    for (const param of params) {
      if (!Array.isArray(param)) {
        return response(res, 400, 'Params must be an array of array');
      } else {
        // Add all the elements of each array to req.originalUrl and req.url
        req.originalUrl = originalUrl + param.join('/');
        // req.url += param.join('/');
        console.log(req.url, 'req.url in batch', req.originalUrl);
        // create a new response object
        // const resp = new Response();
        // console.log(req.headers, 'req.headers');
        const theresp = await axios({
          method: req.method,
          url: req.originalUrl,
          data: bodyItem,
          headers: {
            Authorization: req.headers.authorization,
          },
        });
        console.log(theresp.data, 'theresp');
      }
    }

    return response(res, 200, `${params.length} request(s) made successfully`);
    // }
  } catch (error) {
    return next(error);
  }
};

export default {
  create,
  fetchMany,
  fetchOne,
  updateOne,
  deleteOne,
  deleteMany,
  dataValidate,
  getSingle,
  importAllModels,
  ValidateRefs,
  batch,
};
