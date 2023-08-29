import { Response, Request, NextFunction } from 'express';
import pkg, { validationResult, matchedData } from 'express-validator';
import response from '../utilities/response';
import {
  ValidationError,
  ValidatorOptions,
  validateSync,
} from 'class-validator';

export const validateEV = (
  req: Request,
  res: Response<any, Record<string, any>>,
  next: () => void,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error: any = {};
    errors.array().forEach((err) => (error[err.type] = err.msg));
    const firstErrorMessage = errors.array()[0].msg;

    return response(res, 400, firstErrorMessage, error);
  }

  next();
};
type data = Record<string, any>;

export const validateDTO = <D extends data, C extends { new (): D }>(
  classTemplate: C,
  data: D,
  validatorOptions: ValidatorOptions = {
    // whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    // always: true,
    // validationError: {
    //   target: false,
    //   value: false,
    // },
    // skipMissingProperties: false,
    whitelist: true,
  },
): D => {
  const instanceClass = new classTemplate();
  Object.keys(data).forEach((key: keyof D) => {
    instanceClass[key] = data[key];
  });
  // delete all undefined properties
  Object.keys(instanceClass).forEach((key: keyof D) => {
    if (instanceClass[key] === undefined) {
      delete instanceClass[key];
    }
  });
  console.log(
    classTemplate,
    'classTemplate',
    data,
    'data',
    instanceClass,
    'instanceClass',
  );
  // return !validateSync(instanceClass).length;
  const errors = validateSync(instanceClass, validatorOptions);
  // Convert to array of strings the errors
  console.log(errors, 'errors', instanceClass);
  if (errors.length) {
    //construct the error message
    const error = errors[0];
    const errObj: ValidationError & {
      message: string;
      name: string;
      errors: ValidationError[];
    } = {
      ...error,
      name: 'DTOValidationError',
      message: '',
      target: undefined,
      errors,
    };
    const constraints = error.constraints;
    if (constraints) {
      const message = Object.keys(constraints)
        .map((key) => constraints[key])
        .join(', ');
      // throw new Error(message);
      errObj.message = message;
      throw errObj;
    } else {
      errObj.message = 'Validation error';
      throw errObj;
    }
  }
  return instanceClass;
};
