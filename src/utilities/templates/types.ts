// ITemplace is a function that accepts replacements object and returns a promise that resolves to service response.

import { serviceResponseType } from '../response';

export type ITemplate = Promise<serviceResponseType>;

export enum IMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface IADoc {
  description?: string;
  schema?: string;
  //   method: IMethod;
}

// export interface IDocs {
//   [key: string]: {

// }
type IMethodKeys = 'GET' | 'POST' | 'PUT' | 'DELETE';

type IADocMap = {
  [key in IMethodKeys]?: IADoc;
};

export interface IDocs {
  [key: string]: IADocMap;
}
