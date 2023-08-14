import { QueryOptions } from 'mongoose';
import { find, findOne } from '../../utilities/query';
import { CreateUserDto, UpdateUserDto } from './dto';
import UserModel from '../../models/userModel';
import { ProfileModel } from '../../models';

export default class UserService {
  /**
   * Fetches Users from the database based on the provided queries and conditions.
   * @param queries - The queries to filter the Users by.
   * @param conditions - The conditions to apply to the query (optional).
   * @returns A promise that resolves to an array of Users that match the provided queries and conditions.
   */
  static async fetch(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ) {
    if (conditions) {
      return await find(UserModel, queries, conditions);
    }
    return await find(UserModel, queries);
  }

  static async fetchProfiles(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ) {
    if (conditions) {
      return await find(ProfileModel, queries, conditions);
    }
    return await find(ProfileModel, queries);
  }

  static async create(data: CreateUserDto) {
    return await UserModel.create(data);
  }

  static async fetchOne(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ) {
    if (conditions) {
      return await findOne(UserModel, queries, conditions);
    }
    return await findOne(UserModel, queries);
  }

  static async updateOne(
    queries: { [key: string]: any; _id: string },
    data: UpdateUserDto,
    options: QueryOptions = { new: true, runValidators: true },
  ) {
    const foundUser = await findOne(ProfileModel, queries);
    if (!foundUser) {
      throw new Error('User not found or access denied');
    }
    const updatedUser = await ProfileModel.findByIdAndUpdate(
      foundUser._id,
      data,
      options,
    );

    return updatedUser;
  }

  static async deleteOne(id: string, queries: { [key: string]: any }) {
    const foundUser = await findOne(UserModel, queries, {
      _id: id,
    });
    if (!foundUser) {
      throw new Error('User not found or access denied');
    }
    const deletedUser = await UserModel.findByIdAndDelete(foundUser._id);
    return deletedUser;
  }
}
