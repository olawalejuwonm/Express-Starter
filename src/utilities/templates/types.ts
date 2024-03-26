import {
  BeAnObject,
  IObjectWithTypegooseFunction,
} from '@typegoose/typegoose/lib/types';
import { serviceResponseType } from '../response';
import { Document, ModifyResult, Types } from 'mongoose';

// export type ITemplate = Promise<serviceResponseType>;


export type CreateReturnType<DT> = Document<unknown, BeAnObject, DT> &
  Omit<
    DT & {
      _id: Types.ObjectId;
    },
    'typegooseName'
  > &
  IObjectWithTypegooseFunction;

export type FindOneReturnType<DT> = Document<unknown, BeAnObject, DT> &
  Omit<
    DT & {
      _id: Types.ObjectId;
    },
    'typegooseName'
  > &
  IObjectWithTypegooseFunction;

  export type DeletedResultType<DT> = Document<unknown, BeAnObject, DT> &
  Omit<
    DT & {
      _id: Types.ObjectId;
    },
    'typegooseName'
  > &
  IObjectWithTypegooseFunction;

export enum IMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface IADoc {
  description?: string;
  schema?: string;
}


export type IMethodKeys = 'GET' | 'POST' | 'PUT' | 'DELETE';

type IADocMap = {
  [key in IMethodKeys]?: IADoc;
};

export interface IDocs {
  [key: string]: IADocMap;
}


