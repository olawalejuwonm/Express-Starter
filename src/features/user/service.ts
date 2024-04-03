import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { QueryReturn, find, findOne } from '../../utilities/query';
import { UpdateUserDto, UpdateUserStatusDto } from './dto';
import { UserMod, UserModel } from '../../models';
import {
  serviceError,
  serviceResponseType,
  serviceSuccess,
} from '../../utilities/response';
import { validateDTO } from '../../middlewares/validate';
import { User } from './schema';
import { DeletedResultType, FindOneReturnType } from '../../utilities/templates/types';
import { Ref } from '@typegoose/typegoose';

export default class UserService {
  static Model = UserModel;
  static async fetchUsers(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ): Promise<serviceResponseType<QueryReturn<User>>> {
    try {
      let profile;
      if (conditions) {
        profile = await find(UserMod, queries, conditions);
      } else {
        profile = await find(UserMod, queries);
      }

      return serviceSuccess(profile, 'User fetched successfully');
    } catch (error) {
      return serviceError(error);
    }
  }

  static async fetchOne(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ): Promise<serviceResponseType<FindOneReturnType<User>>> {
    try {
      let profile;
      if (conditions) {
        profile = await findOne(UserMod, queries, conditions);
      } else {
        profile = await findOne(UserMod, queries);
      }
      if (!profile) {
        throw new Error('User not found');
      }

      return serviceSuccess(profile, 'User fetched successfully');
    } catch (error) {
      return serviceError(error);
    }
  }

  static async updateOne(
    queries: FilterQuery<User> | { _id: Ref<User> },
    data: Partial<UpdateUserDto>,
    others: UpdateQuery<User> & Partial<User> = {},
    options: QueryOptions<User> = { new: true, runValidators: true },
  ): Promise<serviceResponseType<FindOneReturnType<User>>> {
    const updatedUser = await UserModel.findOneAndUpdate(
      queries,
      { ...data, ...others },
      options,
    ).orFail();

    return serviceSuccess(updatedUser, 'User updated successfully');
  }

  static async updateStatus(
    queries: { [key: string]: any; _id: string },
    data: UpdateUserStatusDto,
    options: QueryOptions<User> = { new: true, runValidators: true },
  ): Promise<serviceResponseType<User | null>> {
    const foundUser = await findOne(UserMod, queries);
    if (!foundUser) {
      throw new Error('User not found or access denied');
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      foundUser._id,
      data,
      options,
    );

    if (data.status === 'active') {
      // await approval(foundUser);
    } else if (data.status === 'rejected') {
      // Send email to user
      if (!data.description) {
        throw new Error('Please provide a description');
      }
      // await decline(foundUser, data.description);
    }

    return {
      success: true,
      message: 'User status updated successfully',
      data: updatedUser,
    };
  }
  static async deleteOne(
    id: string,
    queries: { [key: string]: any },
  ): Promise<serviceResponseType<DeletedResultType<User>>> {
    try {
      const foundUser = await findOne(UserMod, queries, {
        _id: id,
      });
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }
      const deletedUser = await UserModel.findOneAndDelete({
        _id: foundUser._id,
      }).orFail();
      return serviceSuccess(deletedUser, 'User deleted successfully');
    } catch (error) {
      return serviceError(error);
    }
  }

  static async updateUser(
    queries: { [key: string]: any },
    data: UpdateUserDto,
    options: QueryOptions = { new: true, runValidators: true },
  ): Promise<serviceResponseType<FindOneReturnType<User>>> {
    try {
      validateDTO(UpdateUserDto, data);
      const foundUser = await findOne(UserMod, queries);
      if (!foundUser) {
        throw new Error('User not found or access denied');
      }
      const otherData: Partial<User> = {};
      // if (data.email) {
      //   otherData.emailVerified = false;
      // }
      // if (data.phone) {
      //   otherData.phoneVerified = false;
      // }
      const updatedUser = await UserModel.findByIdAndUpdate(
        foundUser._id,
        { ...data, ...otherData },
        options,
      ).orFail();

      // return updatedUser;
      return serviceSuccess(updatedUser, 'Profile updated successfully');
    } catch (error) {
      return serviceError(error);
    }
  }
}
