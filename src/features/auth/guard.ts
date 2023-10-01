import { NextFunction, Request, Response } from 'express';
import {
  checkUserTypes,
  checkUserTypesService,
} from '../../middlewares/authentication';
import { throwMiddleware } from '../../utilities';
import { PermType } from '../../guards';

export const authPaths = {
  login: '/login',
  register: '/register',
  changePassword: '/change-password',
  verifyEmailAccount: '/verify-email-account',
  requestEmailVerification: '/request-email-verification',
  requestPhoneVerification: '/request-phone-verification',
  verifyPhone: '/verify-phone',
  requestResetPassword: '/request-reset-password',
  resetPassword: '/reset-password',
  tokenValidity: '/token-validity',
};

export const canCreateAuth = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can create Auth',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't create Auth",
      query: {},
    };
  }
};

export const canFetchAuth = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can fetch Auth',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't fetch Auth",
      query: {},
    };
  }
};

export const canUpdateAuth = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can update Auth',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't update Auth",
      query: {},
    };
  }
};

export const canDeleteAuth = async (req: Request): Promise<PermType> => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can delete Auth',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't delete Auth",
      query: {},
    };
  }
};
