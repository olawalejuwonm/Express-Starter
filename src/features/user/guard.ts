import { NextFunction, Request, Response } from 'express';
import {
  authenticateCheck,
  checkUserTypes,
  checkUserTypesService,
} from '../../middlewares/authentication';
import { throwMiddleware } from '../../utilities';
import { GuardFunction, PermType } from '../../guards';

export const canCreateUser = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can create User',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't create User",
      query: {},
    };
  }
};

export const canFetchUser = async (req: Request): Promise<PermType> => {
  try {
    await authenticateCheck(req);
    return {
      auth: true,
      message: 'Can fetch User',
      query: {
        _id: req.user._id,
      },
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't fetch User",
      query: {},
    };
  }
};

export const canFetchProfile = async (req: Request): Promise<PermType> => {
  try {
    await authenticateCheck(req);
    return {
      auth: true,
      message: 'Can fetch User',
      query: {
        _id: req.user._id,
      },
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't fetch User",
      query: {},
    };
  }
};
export const canFetchProfiles = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can fetch User',
      query: {
      },
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't fetch User",
      query: {},
    };
  }
};
export const canUpdateProfile: GuardFunction = async (req) => {
  try {
    await authenticateCheck(req);
    return {
      auth: true,
      message: 'Can update User',
      query: {
        _id: req.user._id,
      },
    };
  } catch (error: any) {
    return {
      auth: false,
      message: error.message,
      query: {},
    };
  }
};

export const canUpdateUserStatus: GuardFunction = async (req) => {
  try {
    await checkUserTypesService(req, ['super']);

    return {
      auth: true,
      message: 'Can update User',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error.message,
      query: {},
    };
  }
};

export const canDeleteUser = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can delete User',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't delete User",
      query: {},
    };
  }
};
