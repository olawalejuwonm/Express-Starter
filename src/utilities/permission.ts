import { Request } from 'express';
import { authenticator } from '../middlewares/authentication';
import settingsModel from '../models/settingsModel';
import { Types } from 'mongoose';

export type AuthQuery = {
  auth: boolean;
  message: string;
  query: {
    owner?: Types.ObjectId;
    ownedBy?: 'company' | 'college';
    _filterOnPopulate?: boolean;
    _populate?: string;
    [key: string]: any;
  };
};

const fetchSettings = async () => {
  try {
    let settings = await settingsModel.findOne({});

    return settings;
  } catch (error) {
    console.log(error);
  }
};

let settings: any = fetchSettings();

export default class Permission {}
