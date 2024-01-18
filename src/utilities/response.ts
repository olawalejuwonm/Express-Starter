import { NextFunction, Response } from 'express';
import { PermType } from '../guards';

export type serviceResponseType<T = any> = {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
};

export const serviceError = (error: any): serviceResponseType => {
  // console.error(error);
  return {
    success: false,
    message: error.message,
    data: error,
  };
};

export const serviceSuccess = (
  data: any = null,
  message: string = 'Sucess',
  statusCode: number = 200,
): serviceResponseType => {
  // console.error(error);
  return {
    success: true,
    message: message,
    data: data,
    statusCode: statusCode,
  };
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

export const throwIfError = <MT = any>(
  fn: serviceResponseType<MT>,
  next?: NextFunction,
): serviceResponseType<MT> & {
  statusCode: number;
} => {
  console.log(fn, 'fn data');

  if (fn.success === false) {
    let data: serviceResponseType<MT> = {
      success: false,
      message: fn.message,
      data: null as any,
      statusCode: fn.statusCode || 400,
    };

    if (fn.data) {
      data.data = fn.data;
    }

    throw data;
  }

  let data = {
    success: true,
    message: fn.message || 'Success',
    data: fn.data,
    statusCode: fn.statusCode || 200,
  };

  return data;
};

export const throwPermIfError = <T>(
  fn: PermType<T>,
  next?: NextFunction,
): PermType<T> => {
  console.log(fn, 'fn data');

  if (fn.auth === true) {
    return fn;
  }

  throw fn;
};
