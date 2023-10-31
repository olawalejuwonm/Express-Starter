import mongoose from 'mongoose';
import { PermissionType } from '../models/permissionModel';
import { RoleType } from '../models/role.model';
import { importAllModels } from '../controllers/generators/service';
import { DocumentType } from '@typegoose/typegoose';
import { Request } from 'express';
import * as core from 'express-serve-static-core';
import { User, UserType } from '../features/user/schema';

export const crudModelPermssions = (
  model: string | string[],
  mode = 'crud',
): string[] => {
  if (Array.isArray(model)) {
    const perms: string[] = [];
    model.forEach((modelName) => {
      perms.push(...crudModelPermssions(modelName, mode));
    });
    return perms;
  }
  const modelName = model.toLowerCase();

  // importAllModels().then(() => {
  //   const modelExists = mongoose
  //     .modelNames()
  //     .map((m) => m.toLowerCase())
  //     .includes(modelName);
  //   if (!modelExists) {
  //     throw new Error(`Model ${modelName} does not exist`);
  //   }
  // });
  // if mode has c then create:ModelName, read:ModelName, update:ModelName, delete:ModelName
  const modes = mode.split('');
  const perms: string[] = [];
  modes.forEach((m) => {
    switch (m) {
      case 'c':
        perms.push(`create:${modelName}`);
        break;
      case 'r':
        perms.push(`read:${modelName}`);
        break;
      case 'u':
        perms.push(`update:${modelName}`);
        break;
      case 'd':
        perms.push(`delete:${modelName}`);
        break;
      default:
        break;
    }
  });
  return perms;
};

export type PermType<T = { [key: string]: any }, D = any> = {
  auth: boolean;
  message: string;
  permissions?: string[];
  query: T;
  data?: D;
};

export type GuardFunction<Q = any, D = any, P = core.ParamsDictionary> = (
  req: Request<P>,
  exec: boolean,
) => Promise<PermType<Q, D>>;

export const isPermitted = async (
  user: UserType,
  permission: string,
): Promise<PermType> => {
  let permissions: string[] = [];
  const theUser = await (
    await (user as DocumentType<User>).populate('roles permissions')
  ).populate<{
    roles: RoleType &
      {
        permissions: PermissionType[];
      }[];
    permissions: PermissionType[];
  }>('roles.permissions');
  // console.log('theUser roles', theUser.roles, theUser.permissions);
  const roles = theUser.roles;
  const userpermissions = theUser.permissions.filter(
    (p) => p.status === 'active',
  );
  console.log('user active permissions', userpermissions);
  roles.forEach((role) => {
    permissions.push(
      ...role.permissions
        ?.filter((p) => p.status === 'active')
        .map((p) => p.name),
    );
  });
  permissions.push(...userpermissions.map((p: any) => p.name));
  console.log('permissions', permissions);
  const auth = user.type === 'super' ? true : permissions.includes(permission);
  return {
    auth,
    permissions,
    query: user.type === 'super' ? {} : { _id: user._id },
    message: auth ? 'Access granted' : 'Access denied',
  };
};
