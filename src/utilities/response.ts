import { NextFunction, Response } from 'express';
import { PermType } from '../guards';

type serviceErrorType<T> =
  | {
      message: string;
      [key: string]: any;
    }
  | (T & {
      message: string;
    });

type SuccessResponseType<T> = {
  success: true;
  message: string;
  data: T;
  statusCode?: number;
};

type ErrorResponseType<T> = {
  success: false;
  message: string;
  data: serviceErrorType<T>;
  statusCode?: number;
};

export type serviceResponseType<T = any> =
  | SuccessResponseType<T>
  | ErrorResponseType<T>;


export const serviceError = <T>(
  error: serviceErrorType<T>,
): ErrorResponseType<T> => {
  return {
    success: false,
    message: error.message,
    data: error,
  };
};

export const serviceSuccess = <T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
): SuccessResponseType<T> => {
  return {
    success: true,
    message: message,
    data: data,
    statusCode: statusCode,
  };
};

export const serviceWrapper = async <T>(
  fn: () => Promise<T>,
): Promise<serviceResponseType<T>> => {
  try {
    const data = await fn();
    return serviceSuccess(data);
  } catch (error) {
    return serviceError(error);
  }
};

export default <T = any>(
  res: Response,
  status: number,
  message: string,
  data: T = null as any,
) => {
  return res.status(status).json({
    message,
    data,
  });
};

export const throwIfError = <MT>(
  fn: serviceResponseType<MT>,
): SuccessResponseType<MT> & {
  statusCode: number;
} => {
  if (fn.success === false) {
    const data: serviceResponseType<MT> = {
      success: false,
      message: fn.message || 'Error',
      data: null as any,
      statusCode: fn.statusCode || 400,
    };

    if (fn.data) {
      data.data = fn.data;
    }

    throw data;
  }

  const data: SuccessResponseType<MT> & {
    statusCode: number;
  } = {
    success: true,
    message: fn.message || 'Success',
    data: fn.data,
    statusCode: fn.statusCode || 200,
  };

  return data;
};

export const throwPermIfError = <T, K>(
  fn: PermType<T, K>,
  next?: NextFunction,
): PermType<T, K> => {

  if (fn.auth === true) {
    return fn;
  }

  throw fn;
};
