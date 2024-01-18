import pkg from 'lodash';
import pluralize from 'pluralize';
import mongooseErrorHandler from 'mongoose-validation-error-message-handler';
import response from '../utilities/response';
import { NextFunction, Request } from 'express';
import axios, { AxiosError } from 'axios';

const { startCase, upperFirst } = pkg;
export default function errorHandler(
  err: any,
  req: Request,
  res: any,
  next: NextFunction,
) {
  console.log('In Error Handler');
  if (err.data && err.data?.message) {
    console.log('Error Data');
    err = err.data;
  }
  if (axios.isAxiosError(err)) {
    console.log('Axios Error');
    const aerr: AxiosError = err;
    return response(
      res,
      aerr.response?.status || 400,
      (aerr.response?.data as any)?.message || aerr.message,
      aerr.response?.data,
    );
  }
  console.error(
    'errorHandler starts',
    err.name,
    { err },
    err?.data,
    'errorHandler ends',

  );
  if (err.name === 'DocumentNotFoundError') {
    let match = err.message.match(/model \"(\w+)\"/);
    let profile = match ? match[1] : null;
    return response(res, 404, `${profile || 'Document'} not found`);
  }
  // check if error is mongoose VersionError
  if (err.name === 'VersionError') {
    return response(res, 400, 'Multiple updates detected. Please try again');
  }
  if (err.name === 'DTOValidationError') {
    return response(res, 400, err.message, err);
  }
  let error = mongooseErrorHandler(err);
  let enumValues: any = {};
  let errData: any = {};
  if (error.name === 'MongooseValidatorError') {
    const error = mongooseErrorHandler(err, {
      messages: {
        ...enumValues,
        enum: '"{path}" field has an invalid value.',
        date: 'The "{path}" field must be a valid date in the format YYYY-MM-DD',
        objectId: '"{path}" must be a valid id',
        required: '"{path}" is required',
        // 'number.max': '"{path}" must be less than or equal to {max}',
        // 'number.min': '"{path}" must be greater than or equal to {min}',
      },
    });
    // This converts text quoted in "" from camelCase to startCase
    let message: string =
      error.message?.replace(/"[^"]*"/g, (match) =>
        startCase(match.replace(/"/g, '')),
      ) || '';
    errData = err?.errors || err;
    const firstError = Object.keys(err.errors)[0];
    if (err.errors[firstError]?.kind === 'validate') {
      message = err.errors[firstError]?.message;
    }
    return response(res, 400, upperFirst(message), errData);
  }

  console.log(error.name, 'error 59');
  if (err.type === 'entity.parse.failed') {
    return response(res, 400, 'Invalid payload passed.');
  }
  if (err.code === 'ENOTFOUND') {
    return response(
      res,
      500,
      'Service not available at the moment. Please try again later',
    );
  }

  if (
    err.message &&
    err.message.includes('Cast to ObjectId failed for value')
  ) {
    let regex = /(?<=at path ")(.*?)(?=")/g;
    let match = regex.exec(err.message);
    let path = match ? match[0] : err.message.split(' ')[2];
    return response(res, 400, `${startCase(path)} not found or invalid`, err);
  }

  if (err.name === 'CastError') {
    return response(res, 400, `${startCase(err.path)} path is invalid`, err);
  }

  if (err.code === 11000) {
    const vars = err.message?.split(':');
    const tableName = vars[1]?.split(' ')[1]?.split('.')[1] || '';
    let modelName = startCase(pluralize.singular(tableName));
    let fieldName = vars[2]?.split(' ')[1]?.split('_')[0];
    if (!modelName) {
      console.log('In modelName');
      modelName = startCase(vars[5]?.split(' ')[1]?.split('.')[1]);
      // field name is in last element of vars array
      // splitt by "
      fieldName = vars[vars.length - 2]?.split(' ')[2];
    }
    return response(res, 400, `${modelName} with the ${fieldName} exists`);
  }
  if (err.message) {
    if (err.message.match(/validation failed/i)) {
      let message = err.message.replace(/[^]*validation failed: /g, '');
      let enumValues = [];
      if (message.match(/enum/i)) {
        try {
          enumValues = err.errors?.status?.properties?.enumValues || [];
          const enumValuesString = enumValues.join(', ');
          message = `${message}. Valid values are ${enumValuesString}`;
        } catch (error) {
          console.log(error);
        }
      }

      return response(res, 400, upperFirst(message), err?.errors || err);
    }
    return response(res, 400, upperFirst(err.message));
  }
  if (/^5/.test(err.status) || !err.status) {
    let themessage;
    if (typeof err === 'string') {
      themessage = err;
    }

    themessage = err.message || 'Something broke. We will fix it';
    // checks if err.err is a string

    return response(res, 500, upperFirst(themessage));
  }

  if (err.response) {
    const errorText = JSON.parse(err.response.text);

    if (errorText) {
      return response(
        res,
        400,
        upperFirst(errorText.message || errorText.error),
      );
    }

    if (err) {
      return response(res, 500, upperFirst(err.message));
    }

    return response(res, 404, 'Requested route not found');
  }

  return response(res, 500, 'Something broke. We will fix it');
}
