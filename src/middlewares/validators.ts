// const validate = require('../middlewares/validate');
import mongoose, { Model } from 'mongoose';
import pkg, {
  validationResult,
  matchedData,
  checkSchema,
} from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ObjectId, ObjectIdLike } from 'bson';
import { Schema, InferSchemaType, PassportLocalDocument } from 'mongoose';

// const { validationResult, matchedData, checkSchema } = pkg;

export const validForm = <DT>(
  model: Model<DT>,
  formA: any,
  validate: boolean = false,
  additionalData: any = {},
): InferSchemaType<typeof model.schema> & {
  [x: string]: any;
} => {
  const schema = model.schema.paths;
  let form: DT & any = {};
  const assignReq = (key: string, source: string) => {
    // check if key is in a including 0, "", false, null, undefined, NaN
    if (source === 'body') {
      if (Object.keys(formA).includes(key)) {
        form[key] = formA[key];
      }
      // for objects nested in body
      else if (key.includes('.')) {
        const keys = key.split('.');
        if (Object.keys(formA).includes(keys[0])) {
          form[keys[0]] = formA[keys[0]];
        }
      }
    }
  };
  Object.keys(schema).forEach((key) => {
    const schemaKey: any = schema[key];
    // console.log(key, schemaKey);
    if (schemaKey?.options?.source) {
      assignReq(key, schemaKey.options.source);
    } else if (schemaKey?.caster?.options?.source) {
      // For array
      assignReq(key, schemaKey.caster.options.source);
    } else {
      // console.info('No source found for', key, schemaKey);
    }
  });
  form = { ...form, ...additionalData };
  //TODO: Validate only the field with mongoose validation
  if (validate) {
    const newModel = new model(form);
    const invalid = newModel.validateSync();
    console.log(invalid, 'valid');
    if (invalid) {
      throw invalid;
    }
    // return newModel;
  }
  return form;
};

export const matched = (
  req:
    | Request
    | Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  useEV?: string[] | undefined,
  opts?: Partial<pkg.MatchedDataOptions> | undefined,
) => {
  if (Array.isArray(useEV)) {
    // Picks only the fields in the array from req.body, req.query, req.params
    const main: {
      [x: string]: any;
    } = {};
    useEV.forEach((field: string) => {
      if (Object.keys(req.body).includes(field)) {
        main[field] = req.body[field];
      } else if (Object.keys(req.query).includes(field)) {
        main[field] = req.query[field];
      } else if (Object.keys(req.params).includes(field)) {
        main[field] = req.params[field];
      }
    });
    return main;
  }
  // check if req is not a type of express reques
  const matched = matchedData(req, {
    includeOptionals: true,
    ...opts,
  });
  // req.body = matched;
  return matched;
};

export const pickFromModel = (
  model: { schema: { paths: any } },
  from: (arg0: string) => {
    (): any;
    new (): any;
    optional: { (): any; new (): any };
  },
) => {
  // get Model
  // const model = mongoose.model(modelName);
  const validations: any[] = [];
  const schema = model.schema.paths;
  Object.keys(schema).forEach((key) => {
    validations.push(from(key).optional());
    // if (schemaKey.options.required) {
    //   validations.push(body(key).exists());
    // } else if (schemaKey.options.required === false) {
    //   validations.push(eval('from')(key).optional().w);
    // }
  });
  return validations;
};

export const mapMulterErrorToValidationError = async (
  error: { field: any; message: any },
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (error instanceof multer.MulterError) {
    await checkSchema({
      [error.field]: {
        custom: {
          errorMessage: error.message,
        },
      },
    }).run(request);
    next();
  } else {
    next(error);
  }
};

export const arrayOfObjectIds = async (value: any[], { req }: any) => {
  // remove duplicates
  // check if all the to values are valid ObjectIds
  const isValid = value.every(
    (id: string | number | ObjectId | ObjectIdLike | Buffer | Uint8Array) =>
      mongoose.Types.ObjectId.isValid(id),
  );
  if (!isValid) {
    throw new Error('All to values must be valid ObjectIds');
  }
  return true;
};

export default {
  matched,
  pickFromModel,
  mapMulterErrorToValidationError,
  arrayOfObjectIds,
};
