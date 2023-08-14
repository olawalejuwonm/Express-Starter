import { PermType, isPermitted } from '.';
import { UserType } from '../models/userModel';

export const canCreateRole = async (user: UserType): Promise<PermType> => {
  const canCreate = await isPermitted(user, 'create:role');
  return {
    ...canCreate,
  };
};

export const canReadRole = async (user: UserType): Promise<PermType> => {
  const canRead = await isPermitted(user, 'read:role');
  return {
    ...canRead,
  };
};

export const canUpdateRole = async (user: UserType): Promise<PermType> => {
  const canUpdate = await isPermitted(user, 'update:role');
  return {
    ...canUpdate,
  };
};

export const canDeleteRole = async (user: UserType): Promise<PermType> => {
  const canDelete = await isPermitted(user, 'delete:role');
  return {
    ...canDelete,
  };
};

export const canAssignRole = async (user: UserType): Promise<PermType> => {
  const canAssign = await isPermitted(user, 'assign:role');
  return {
    ...canAssign,
  };
};


