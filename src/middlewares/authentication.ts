import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { decodeJWT } from '../utilities/jwt';
import response from '../utilities/response';
import Permission from '../models/permissionModel';
import Role from '../models/role.model';
import { AuthQuery } from '../utilities/permission';
import { isDocument } from '@typegoose/typegoose';
import { UserModel } from '../models';
import { UserTypes } from '../features/user/schema';

// TODO: Write intrface
// Make envs in a single variable

//If user already exists check if the user is a student then update the user
// If user exists on their end and it's not registered on our end, throw an error
type AuthenticatedUser = {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
};

const whitelistUrls = [
  // '/api/v1/project',
  // '/api/verify/company',
  // '/api/verify/individual',
  '/project',
  '/verify/individual',
  '/verify/company',
  '/file',
];

const blacklistUrls = ['/job'];
export const authenticator: any = async (
  req: Request,
  secrets = [],
): Promise<AuthenticatedUser> => {
  try {
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];
        if (/^Bearer$/i.test(scheme)) {
          const token = credentials;
          const secret = secrets[0];
          const decoded = decodeJWT(token, secret);
          if (!decoded.id) {
            return {
              success: false,
              message: 'Invalid token Decoded',
            };
          }
          const user = await UserModel.findById(decoded.id);
          if (!user) {
            return {
              success: false,
              message: 'Invalid token',
            };
          }

          req.user = user;

          user.lastActive = new Date();
          user.save();
          console.info(
            'User authenticated',
            user?._id,
            req.originalUrl,
            req.url,
          );
          // if (
          //   user.status !== 'active' &&
          //   req.method !== 'GET' &&
          //   !whitelistUrls.includes(req.url)
          // ) {
          //   return {
          //     success: false,
          //     message: 'Account is not active',
          //   };
          // }
          return {
            success: true,
            message: 'User authenticated',
            user,
          };
        }
      }
    }
    return {
      success: false,
      message: 'No authorization header was found',
    };
  } catch (error: any) {
    // next(error);
    if (secrets?.length > 1) {
      return authenticator(req, secrets.slice(1));
    }
    return {
      success: false,
      message: error.message,
      error,
    };
  }
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authenticated = await authenticator(req, [
      process.env.USER_JWT_SECRET,
    ]);
    if (!authenticated?.success) {
      return response(res, 401, authenticated?.message);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authenticateAdmin = async (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction,
) => {
  try {
    const authenticated = await authenticator(req, [
      process.env.ADMIN_JWT_SECRET,
    ]);
    if (!authenticated?.success) {
      return response(res, 401, authenticated?.message);
    }
    if (!authenticated?.user?.isAdmin) {
      return response(
        res,
        401,
        'You do not have admin privileges to perform this action',
      );
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authenticate = async (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction,
) => {
  try {
    const authenticated = await authenticator(req, [
      process.env.USER_JWT_SECRET,
      process.env.ADMIN_JWT_SECRET,
    ]);
    if (!authenticated?.success) {
      return response(res, 401, authenticated?.message);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

export const authenticateCheck = async (req: Request) => {
  const authenticated = await authenticator(req, [
    process.env.USER_JWT_SECRET,
    process.env.ADMIN_JWT_SECRET,
  ]);
  if (authenticated?.success) {
    return {
      success: true,
      message: 'Authenticated',
    };
  }
  throw new Error(authenticated?.message);
};
type userTypes = `${UserTypes}`;

export const checkUserTypes =
  (types: userTypes[]) =>
  async (
    req: any,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const authenticated = await authenticator(req, [
      process.env.USER_JWT_SECRET,
      process.env.ADMIN_JWT_SECRET,
    ]);
    if (!authenticated?.success) {
      console.log('authenticated', authenticated);
      return response(res, 401, authenticated?.message);
    }

    if (types.includes(req.user.type)) {
      next();
    } else {
      return response(
        res,
        401,
        `Permission denied for this user: ${req.user.type}`,
      );
    }
  };

// write the above as a service
export const checkUserTypesService = async (
  req: Request,
  types: userTypes[],
): Promise<AuthenticatedUser> => {
  const authenticated = await authenticator(req, [
    process.env.USER_JWT_SECRET,
    process.env.ADMIN_JWT_SECRET,
  ]);
  if (!authenticated?.success) {
    throw new Error(authenticated?.message);
  }

  if (types.includes(req.user.type)) {
    return {
      success: true,
      message: 'User is of the right type',
    };
  }
  throw new Error(`Permission denied for this user: ${req.user.type}`);
};

export const checkPermission = (slug: any) => {
  return async (
    req: { user: { role: any; permissions: string | any[] } },
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    try {
      let permission = await Permission.findOne({ slug });
      if (!permission) {
        return response(res, 401, 'Permission not found');
      }
      if (permission.status === 'inactive') {
        return response(res, 401, 'Permission is inactive');
      }
      let role = await Role.findById(req.user.role);
      if (
        !req.user.permissions.includes(permission._id) &&
        role &&
        !role.permissions.includes(permission._id)
      ) {
        return response(
          res,
          401,
          "You don't have permission to access this route",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const usePermission = (permission: () => Promise<AuthQuery>) => {
  return async (
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    try {
      const authQuery = await permission();
      if (authQuery.auth === false) {
        return response(res, 401, authQuery.message);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
export default {
  authenticateUser,
  authenticateAdmin,
  authenticate,
  authenticator,
  checkUserTypes,
};
