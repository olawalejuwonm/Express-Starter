import { Response, Request, NextFunction } from 'express';
import pkg, { validationResult, matchedData } from 'express-validator';
import response from '../utilities/response';
import {
  ValidationError,
  ValidationOptions,
  ValidatorOptions,
  validateSync,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import { plainToClass } from 'class-transformer';

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

export const validateDTO = <D extends data, C extends { new (): any }>(
  classTemplate: C,
  data: InstanceType<C> | any,
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
): InstanceType<C> => {
  const instanceClass = new classTemplate();
  Object.keys(data).forEach((key) => {
    (instanceClass as any)[key] = data[key];
  });
  // delete all undefined properties
  Object.keys(instanceClass).forEach((key) => {
    if (instanceClass[key] === undefined) {
      delete instanceClass[key];
    }
  });
  const errors = validateSync(instanceClass, validatorOptions);
  // Convert to array of strings the errors
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
      errObj.message = message;
      throw errObj;
    } else {
      errObj.message = 'Validation error';
      throw errObj;
    }
  }
  return instanceClass;
};

/**
 * @decorator
 * @description A custom decorator to validate a validation-schema within a validation schema upload N levels
 * @param schema The validation Class
 */
export function ValidateNestedProp(
  schema: new () => any,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'ValidateNested',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (Array.isArray(value)) {
            for (let i = 0; i < (<Array<any>>value).length; i++) {
              if (validateSync(plainToClass(schema, value[i])).length) {
                return false;
              }
            }
            return true;
          } else {
            return validateSync(plainToClass(schema, value)).length
              ? false
              : true;
          }
        },
        // @ts-ignore
        defaultMessage(args) {
          if (args) {
            if (Array.isArray(args.value)) {
              for (let i = 0; i < (<Array<any>>args.value).length; i++) {
                return (
                  `${args.property} ${i + 1} -> ` +
                  validateSync(plainToClass(schema, args.value[i]))
                    .map((e) => e.constraints)
                    // @ts-ignore
                    .reduce((acc, next) => acc.concat(Object.values(next)), [])
                ).toString();
              }
            } else {
              return (
                `${args?.property}: ` +
                validateSync(plainToClass(schema, args?.value))
                  .map((e) => e.constraints)
                  // @ts-ignore
                  .reduce((acc, next) => acc.concat(Object.values(next)), [])
              ).toString();
            }
          }
        },
      },
    });
  };
}
