import _ from 'lodash';
import User from '../models/userModel';
import response from '../utilities/response';
import { find, findOne } from '../utilities/query';
import { matched, validForm } from '../middlewares/validators';
import mailService from '../services/mailService';

import { Request, Response, NextFunction } from 'express';
import { ProfileModel } from '../models';

export default {
  fetchUserProfile: async (
    req: any,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    try {
      const user = await findOne(
        User,
        req.query,
        req.user?.isAdmin ? {} : { _id: req.user._id },
      );
      console.log(
        req.user,
        'req.user',
        req.query,
        req.user?.isAdmin ? {} : { _id: req.user._id },
      );
      return response(res, 200, 'User profile fetched successfully', user);
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (
    req: any,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    try {
      const { profile } = req.user;
      console.log(req.user, 'req.user');
      const body = validForm(ProfileModel, req.body);
      console.log(body, 'body');
      const updatedProfile = await ProfileModel.findByIdAndUpdate(profile, body, {
        new: true,
        runValidators: true,
      });

      return response(res, 200, 'Profile updated successfully', updatedProfile);
    } catch (error) {
      next(error);
    }
  },

  contactUs: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: (arg0: unknown) => void,
  ) => {
    try {
      // TODO: change admin email
      const { message, firstName, lastName, email } = matched(req);
      await mailService(
        'New Contact Request',
        process.env.ADMIN_EMAIL || '',
        `
      <h1>Contact Us</h1>
      <p>Name: ${firstName} ${lastName} </p>
      <p>Email: ${email} </p>
      <p>Message: ${message} </p>
      `,
      );

      return response(res, 200, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { id } = req.params;
    try {
      await User.findByIdAndDelete(id);
      return response(res, 200, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  deleteProfile: async (
    req: any,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { id } = req.user;
    try {
      await User.findByIdAndDelete(id);
      return response(res, 200, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  fetchPublicProfile: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Reject if no query
      if (_.isEmpty(req.query) && !req.user?.isAdmin) {
        return response(res, 400, 'No query provided');
      }

      const Profiles = await find(User, req.query);

      return response(res, 200, 'Profile fetched successfully', Profiles);
    } catch (error) {
      next(error);
    }
  },
};
