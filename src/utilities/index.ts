import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';

const customAlphabet = (alphabet: string, size: number) => () => {
  let id = '';
  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i += 1) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
};

export const throwMiddleware = (fn: any) => async (req: Request, res: Response) => {
  await fn(req, res, (err: any) => {
    if (err) {
      throw err;
    }
  });
};

export const createRandomLetters = (length: any) =>
  customAlphabet(process.env.APP_NAME || '', length)();
export const createRandomNumbers = (length: number) =>
  customAlphabet('0123456789', length)();

export const removeFromData = (theData: any, toRemove: any[]) => {
  let cleanedData = theData;
  const removeFunc = (
    theKey: string,
    newData: string | { [x: string]: any; replace?: any; filter?: any },
  ) => {
    if (typeof newData === 'string') {
      return newData.replace(theKey, '');
    }

    if (Array.isArray(newData)) {
      return newData.filter((i) => i !== theKey);
    }

    if (typeof newData === 'object') {
      return Object.keys(newData).reduce(
        (
          acc: {
            [x: string]: any;
          },
          i,
        ) => {
          if (i !== theKey) {
            acc[i] = newData[i];
          }
          return acc;
        },
        {},
      );
    }

    return newData;
  };
  if (Array.isArray(toRemove)) {
    toRemove.map((key) => {
      cleanedData = removeFunc(key, cleanedData);
    });

    return cleanedData;
  }
  return theData;
};

export const createHex = (size = 20) =>
  crypto.randomBytes(size).toString('hex');

export const generateUniqueReference = (prefix = 'PAY') =>
  `${prefix}-${customAlphabet(
    'ABCDEFGHJKLMNPQRTUVWXYZ23456789',
    2,
  )().toUpperCase()}.${moment().format('YYYYMMDDHHmmss')}`;

export default {
  createRandomLetters,
  createRandomNumbers,
  removeFromData,
  createHex,
  generateUniqueReference,
};
