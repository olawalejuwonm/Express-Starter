import response, { serviceResponseType } from '../utilities/response';
import { find, findOne } from '../utilities/query';
import { matched, validForm } from '../middlewares/validators';
import { Request, Response, NextFunction } from 'express';
import Role from '../models/role.model';
import Permission from '../utilities/permission';
import permissionModel from '../models/permissionModel';
import { UserModel } from '../models';

export default class RoleService {
  /**
   * @description Get all roles
   * @param {object} queries
   * @returns {Promise<QueryReturn>}
   */

  static async fetch(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ): Promise<serviceResponseType> {
    try {
      if (conditions) {
        const data = await find(Role, queries, conditions);
        return {
          success: true,
          message: 'Roles fetched successfully',
          data,
        };
      }
      // return await find(Role, queries);
      const data = await find(Role, queries);
      return {
        success: true,
        message: 'Roles fetched successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching roles',
        data: error,
      };
    }
  }

  static async create(data: {}): Promise<serviceResponseType> {
    try {
      const createdRole = await Role.create(data);
      return {
        success: true,
        message: 'Role created successfully',
        data: createdRole,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creating role',
        data: error,
      };
    }
  }

  static async updateOne(
    queries: { [key: string]: any },
    data: {},
  ): Promise<serviceResponseType> {
    try {
      const foundRole = await findOne(Role, queries);
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }
      const updatedRole = await Role.findByIdAndUpdate(foundRole._id, data, {
        new: true,
        runValidators: true,
      });
      return {
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating role',
        data: error,
      };
    }
  }

  static async deleteOne(queries: {
    [key: string]: any;
  }): Promise<serviceResponseType> {
    try {
      const foundRole = await findOne(Role, queries);
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }
      const deletedRole = await Role.findByIdAndDelete(foundRole._id);
      return {
        success: true,
        message: 'Role deleted successfully',
        data: deletedRole,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error deleting role',
        data: error,
      };
    }
  }

  static async assignRoleToUser(
    query: { [key: string]: any },
    userQuery: {
      [key: string]: any;
    },
  ): Promise<serviceResponseType> {
    try {
      const foundRole = await Role.findOne(query);
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }
      const foundUser = await UserModel.findOne(userQuery);
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }

      if ((foundUser.roles || [])?.includes(foundRole._id)) {
        throw new Error('Role already assigned to user');
      }
      (foundUser.roles && foundUser.roles)?.push(foundRole._id);
      const updatedUser = await foundUser.save();

      return {
        success: true,
        message: 'Role assigned successfully',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        data: error,
      };
    }
  }

  static async assignPermissionsToRole(
    query: { [key: string]: any },
    permissions: string[],
  ): Promise<serviceResponseType> {
    try {
      console.log(query, 'query');
      const foundRole = await Role.findOne(query);
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }
      const permissionIds = await permissionModel.find({
        name: {
          $in: permissions,
        },
      });
      console.log(permissionIds, 'permissionIds');
      foundRole.permissions = [
        ...foundRole.permissions,
        ...permissionIds.map((permission) => permission._id),
      ];
      const updatedRole = await foundRole.save();
      return {
        success: true,
        message: 'Permissions assigned successfully',
        data: updatedRole,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error assigning permissions',
        data: error,
      };
    }
  }

  static async removeRoleFromUser(
    query: { [key: string]: any },
    userQuery: {
      [key: string]: any;
    },
  ): Promise<serviceResponseType> {
    try {
      const foundRole = await Role.findOne(query);
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }
      const foundUser = UserModel.findOneAndUpdate(
        userQuery,
        {
          $pull: {
            roles: foundRole._id,
          },
        },
        {
          new: true,
        },
      );
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }

      return {
        success: true,
        message: 'Role removed successfully',
        data: foundUser,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        data: error,
      };
    }
  }

  static async removePermissionFromRole(
    query: { [key: string]: any },
    permissions: string[],
  ): Promise<serviceResponseType> {
    try {
      const permissionIds = await permissionModel.find({
        name: {
          $in: permissions,
        },
      });

      const foundRole = await Role.findOneAndUpdate(
        query,
        {
          $pull: {
            permissions: {
              $in: permissionIds.map((permission) => permission._id),
            },
          },
        },
        {
          new: true,
        },
      );
      if (!foundRole) {
        throw new Error('Role not found or access denied');
      }

      return {
        success: true,
        message: 'Permission removed successfully',
        data: foundRole,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        data: error,
      };
    }
  }

  static async addPermissionToUser(
    userquery: { [key: string]: any },
    permissions: string[],
  ): Promise<serviceResponseType> {
    try {
      const permissionIds = await permissionModel.find({
        name: {
          $in: permissions,
        },
      });
      const foundUser = await UserModel.findOneAndUpdate(
        userquery,
        {
          $push: {
            permissions: {
              $each: permissionIds.map((permission) => permission._id),
            },
          },
        },
        {
          new: true,
        },
      );
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }

      return {
        success: true,
        message: 'Permission added successfully',
        data: foundUser,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        data: error,
      };
    }
  }

  static async removePermissionFromUser(
    userquery: { [key: string]: any },
    permissions: string[],
  ): Promise<serviceResponseType> {
    try {
      const permissionIds = await permissionModel.find({
        name: {
          $in: permissions,
        },
      });
      const foundUser = await UserModel.findOneAndUpdate(
        userquery,
        {
          $pull: {
            permissions: {
              $in: permissionIds.map((permission) => permission._id),
            },
          },
        },
        {
          new: true,
        },
      );
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }

      return {
        success: true,
        message: 'Permission removed successfully',
        data: foundUser,
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        data: error,
      };
    }
  }
}
