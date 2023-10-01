import response, { serviceResponseType } from '../utilities/response';
import { find, findOne } from '../utilities/query';
import { matched, validForm } from '../middlewares/validators';
import { Request, Response, NextFunction } from 'express';
import Notification, { NotificationType } from '../models/notification.model';
import Permission from '../utilities/permission';
import { UserType } from '../models/userModel';
import permissionModel from '../models/permissionModel';
import { Novu } from '@novu/node';
import { Document, Types } from 'mongoose';
import { Profile } from '../models/profileModel';
import { UserModel } from '../models';

export default class NotificationService {
  private static novu = new Novu(process.env.NOVU_API_KEY as string);

  /**
   * @description Get all notifications
   * @param {object} queries
   * @returns {Promise<QueryReturn>}
   */

  static async fetch(
    queries: { [key: string]: any },
    conditions:
      | {
          user?: Types.ObjectId;
        }
      | undefined = undefined,
  ): Promise<serviceResponseType> {
    try {
      if (conditions) {
        const data = await find(Notification, queries, conditions);
        return {
          success: true,
          message: 'Notifications fetched successfully',
          data,
        };
      }
      // return await find(Notification, queries);
      const data = await find(Notification, queries);
      return {
        success: true,
        message: 'Notifications fetched successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching notifications',
        data: error,
      };
    }
  }

  static async send(
    data: Omit<NotificationType, 'createdAt' | 'updatedAt' | 'read'> & {
      message: string;
    },
    sendTo: 'user' | 'college' | 'company',
    id: Types.ObjectId,
  ): Promise<serviceResponseType> {
    try {
      let users: Types.ObjectId[] = [];
      if (sendTo === 'user') {
        const user = await UserModel.find({ _id: id }).select('_id');
        users = user.map((u) => u._id);
      } else if (sendTo === 'college') {
        const user = await UserModel.find({ colleges: id }).select('_id');
        users = user.map((u) => u._id);
      } else if (sendTo === 'company') {
        const user = await UserModel.find({ companies: id }).select('_id');
        users = user.map((u) => u._id);
      }

      console.log(users, 'users to not');
      // send notification to users with novu
      for (const user of users) {
        data.user = user;
        const createdNotification = await Notification.create(data);
        // create new notification data without _id
        const notification = await this.novu.trigger('notification', {
          to: {
            subscriberId: user as unknown as string,
          },
          payload: {
            // message: createdNotification.message,
            ...createdNotification.toObject(),
          },
          // overrides: {
          //   // fcm: {
          //   //   imageUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
          //   // },
          // },
        });
        console.log(notification.data, 'notification data');
      }
      return {
        success: true,
        message: 'Notification created successfully',
        data: '',
      };
    } catch (error) {
      console.log(error, 'error sending notification');
      return {
        success: false,
        message: 'Error creating notification',
        data: error,
      };
    }
  }

  static async subscribeToNotification(
    userId: Types.ObjectId,
    userDetails: Profile & Document<any, any, Profile>,
  ): Promise<serviceResponseType> {
    try {
      const subscribed = await this.novu.subscribers.identify(
        userId as unknown as string,
        {
          email: (userDetails?.createdBy as unknown as UserType)?.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          // phone: userDetails.phone,
          data: {
            ...userDetails?.toObject(),
          },
        },
      );
      console.log(subscribed.data, 'subscribed data');
      this.novu.addListener('notification', async (notification) => {
        console.log(
          'notification start',
          notification,
          'notification received',
        );
      });
      return {
        success: true,
        message: 'Subscribed to notifications successfully',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error subscribing to notifications',
        data: error,
      };
    }
  }

  static async updateOne(
    queries: { [key: string]: any },
    data: {},
  ): Promise<serviceResponseType> {
    try {
      const foundNotification = await findOne(Notification, queries);
      if (!foundNotification) {
        throw new Error('Notification not found or access denied');
      }
      const updatedNotification = await Notification.findByIdAndUpdate(
        foundNotification._id,
        data,
        {
          new: true,
          runValidators: true,
        },
      );
      return {
        success: true,
        message: 'Notification updated successfully',
        data: updatedNotification,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating notification',
        data: error,
      };
    }
  }

  static async deleteOne(queries: {
    [key: string]: any;
  }): Promise<serviceResponseType> {
    try {
      const foundNotification = await findOne(Notification, queries);
      if (!foundNotification) {
        throw new Error('Notification not found or access denied');
      }
      const deletedNotification = await Notification.findByIdAndDelete(
        foundNotification._id,
      );
      return {
        success: true,
        message: 'Notification deleted successfully',
        data: deletedNotification,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error deleting notification',
        data: error,
      };
    }
  }
}

// console.log(NotificationService.send(
//   {
//     message: 'Hello boss',
//   },
//   'user',
//   new Types.ObjectId('63fceea412dcf16169ce15fe'),
// ), "trying notification")
