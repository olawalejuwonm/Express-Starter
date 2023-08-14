import {
  authenticateCheck,
  checkUserTypesService,
} from '../../middlewares/authentication';
import { GuardFunction } from '../../guards';

export const canCreateFile: GuardFunction<any, any, any> = async (
  req,
  exec,
) => {
  try {
    await authenticateCheck(req);
    // throw new Error('Not implemented');
    return {
      auth: true,
      message: 'Can create File',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't create File",
      query: {},
    };
  }
};

export const canFetchFile: GuardFunction = async (req) => {
  try {
    // await checkUserTypesService(req, ['super']);
    await authenticateCheck(req);
    return {
      auth: true,
      message: 'Can fetch File',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't fetch File",
      query: {},
    };
  }
};

export const canUpdateFile: GuardFunction = async (req) => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can update File',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't update File",
      query: {},
    };
  }
};

export const canDeleteFile: GuardFunction = async (req) => {
  try {
    await checkUserTypesService(req, ['super']);
    return {
      auth: true,
      message: 'Can delete File',
      query: {},
    };
  } catch (error) {
    return {
      auth: false,
      message: error instanceof Error ? error.message : "Can't delete File",
      query: {},
    };
  }
};
