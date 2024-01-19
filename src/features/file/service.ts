import { QueryOptions, UpdateQuery } from 'mongoose';
import { QueryReturn, find, findOne } from '../../utilities/query';
import { CreateFileDto, UpdateFileDto } from './dto';
import { File } from './schema';
import { serviceResponseType } from '../../utilities/response';
import { validateDTO } from '../../middlewares/validate';
import { FileModel } from '../../models';

export default class FileService {
  /**
   * Fetches Files from the database based on the provided queries and conditions.
   * @param queries - The queries to filter the Files by.
   * @param conditions - The conditions to apply to the query (optional).
   * @returns A promise that resolves to an array of Files that match the provided queries and conditions.
   */
  static async fetch(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ): Promise<serviceResponseType<QueryReturn<File>>> {
    try {
      let foundFiles: QueryReturn<File>;
      if (conditions) {
        foundFiles = await find(FileModel, queries, conditions);
      }
      foundFiles = await find(FileModel, queries);
      return {
        success: true,
        message: 'Files fetched successfully',
        data: foundFiles,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async create(
    payload: CreateFileDto,
    data: Partial<File> = {},
  ): Promise<serviceResponseType<File>> {
    // return await FileModel.create(data);
    validateDTO(CreateFileDto, payload);
    try {
      const createdFile = await FileModel.create({ ...payload, ...data });
      return {
        success: true,
        message: 'File created successfully',
        data: createdFile,
        statusCode: 201,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async fetchOne(
    queries: { [key: string]: any },
    conditions: {} | undefined = undefined,
  ): Promise<serviceResponseType<File>> {
    try {
      let foundFile;
      if (conditions) {
        foundFile = await findOne(FileModel, queries, conditions);
      }
      foundFile = await findOne(FileModel, queries);
      if (!foundFile) {
        throw {
          message: 'File not found or access denied',
          statusCode: 404,
        };
      }
      return {
        success: true,
        message: 'File fetched successfully',
        data: foundFile,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async updateOne(
    queries: { [key: string]: any; _id: string },
    data: UpdateFileDto,
    others: UpdateQuery<File> & Partial<File> = {},
    options: QueryOptions = { new: true, runValidators: true },
  ): Promise<serviceResponseType<File | null>> {
    try {
      // const foundFile = await findOne(FileModel, queries);
      // if (!foundFile) {
      //   throw {
      //     message: 'File not found or access denied',
      //     statusCode: 404,
      //   };
      // }
      const updatedFile = await FileModel.findOneAndUpdate(
        queries,
        { ...data, ...others },
        options,
      );
      if (!updatedFile) {
        throw {
          message: 'File not found or access denied',
          statusCode: 404,
        };
      }
      return {
        success: true,
        message: 'File updated successfully',
        data: updatedFile,
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async deleteOne(
    id: string,
    queries: { [key: string]: any },
  ): Promise<serviceResponseType<File | null>> {
    try {
      // const foundFile = await findOne(FileModel, queries, {
      //   _id: id,
      // });
      // if (!foundFile) {
      //   throw {
      //     message: 'File not found or access denied',
      //     statusCode: 404,
      //   };
      // }
      const deletedFile = await FileModel.findOneAndDelete({
        ...queries,
        _id: id,
      });
      if (!deletedFile) {
        throw {
          message: 'File not found or access denied',
          statusCode: 404,
        };
      }
      return {
        success: true,
        message: 'File deleted successfully',
        data: deletedFile,
        statusCode: 204,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }
}
