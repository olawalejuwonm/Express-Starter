import User, { AllUserType, UserType } from '../models/userModel';
import response, { throwIfError } from '../utilities/response';
import AuthTemplates from '../utilities/templates/auth';
import { Profile } from '../models/profileModel';

import { genToken, verifyToken } from '../utilities/token';

import { matched, validForm } from '../middlewares/validators';

import { Request, Response, NextFunction } from 'express';
import mailService from '../services/mailService';
import axios, { isCancel, AxiosError } from 'axios';
import mongoose from 'mongoose';
import NotificationService from '../appservice/notification.service';
import LinkedinService from '../services/linkedin';
import GoogleService from '../services/google';
import { ProfileModel } from '../models';

export default {
  requestResetPassword: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({
        email,
      }).populate('profile');

      if (!user) {
        return response(
          res,
          200,
          'If an account with this email exists, an email has been sent to you.',
        );
      }

      const theToken = await genToken(user, 'User', 'reset-password');

      await AuthTemplates.resetPasswordTemplate(user, theToken);
      return response(
        res,
        200,
        'If an account with this email exists, an email has been sent to you.',
      );
    } catch (error) {
      next(error);
    }
  },
  verifyAccount: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { token } = req.body;
    try {
      const theToken = await verifyToken(token, 'verify-email');
      if (!theToken.valid) {
        return response(res, 401, theToken.message);
      }
      const { userId } = theToken;
      const user = await User.findById(userId);
      // const referral = await createReferral(userId, user.referredBy);
      const theUser = await User.findByIdAndUpdate(
        userId,
        {
          // referralCode,
          // referral: referral._id,
          emailVerified: true,
        },
        { strict: false, new: true, runValidators: true },
      );

      return response(res, 200, 'Account verified successfully', theUser);
    } catch (error) {
      next(error);
    }
  },

  sendVerificationEmail: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({
        email,
      }).populate('profile');
      if (!user) {
        return response(
          res,
          200,
          'If an account with this email exists, an email has been sent to you.',
        );
      }
      if (user.emailVerified) {
        return response(res, 200, 'Account already verified');
      }
      const theToken = await genToken(user, 'User', 'verify-email');
      await AuthTemplates.verifyEmailTemplate(user, theToken);
      return response(
        res,
        200,
        'If an account with this email exists, an email has been sent to you.',
      );
    } catch (error) {
      next(error);
    }
  },
  loginUser: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    try {
      const { username, password } = matched(req);

      const { user, error } = await User.authenticate()(username, password);
      if (error) {
        return response(res, 401, error.message);
      }
      const theUser = user;
      if (!theUser) {
        return response(res, 401, 'Invalid credentials');
      }
      if (theUser.email && theUser.emailVerified === false) {
        return response(res, 401, 'Email has not been verified', {
          verified: false,
          email: theUser.email,
        });
      }
      // if (!theUser.isVerified) {
      //   return response(res, 401, 'Account not verified');
      // }
      // if (theUser.status !== 'active') {
      //   return response(res, 401, 'Account not active');
      // }
      const token = await theUser.generateJWT();
      response(res, 200, 'Welcome back!', {
        token,
        user: theUser,
      });
      const profile = await ProfileModel.findById(theUser.profile);
      if (profile) {
        NotificationService.subscribeToNotification(theUser._id, profile);
      } else {
        console.error('No profile found');
      }
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { token, newPassword } = req.body;
    try {
      const emailVerify = await verifyToken(token, 'reset-password');

      if (!emailVerify.valid) {
        return response(res, 401, emailVerify.message);
      }
      const { userId } = emailVerify;
      const user = (await User.findById(userId).populate(
        'profile',
      )) as AllUserType | null;
      if (!user) {
        return response(res, 404, 'User does not exist.');
      }
      // await user.resetAttempts();
      await user.setPassword(newPassword);
      await user.save();
      await AuthTemplates.passwordResetConfirmationTemplate(user);
      return response(res, 200, 'Password reset successfully', user);
    } catch (error) {
      next(error);
    }
  },

  //TODO: Interface for req
  changePassword: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { oldPassword, newPassword } = req.body;
    try {
      const user = req.user as AllUserType;
      if (!user) {
        return response(res, 401, 'Invalid user');
      }
      await user.changePassword(oldPassword, newPassword);
      // await user.save();
      return response(res, 200, 'Password changed successfully', user);
    } catch (error: any) {
      if (error.name === 'IncorrectPasswordError') {
        return response(res, 401, 'Old password is incorrect');
      }
      next(error);
    }
  },

  // Sign in with linkedin
  linkedinLogin: async (
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction,
  ) => {
    const { code } = req.query;
    const linkedinUser = throwIfError(
      await LinkedinService.getAccessToken(code as string),
    );

    console.log(linkedinUser, 'linkedInuser');

    const { access_token } = linkedinUser.data;

    const linkedinProfile = throwIfError(
      await LinkedinService.getProfile(access_token),
    );
    console.log(linkedinProfile, 'LinkedIn profile');
    const { email } = linkedinProfile.data;
    const user = await User.findOne({
      email,
    }).populate('profile');
    if (!user) {
      return response(res, 404, 'User not found', linkedinProfile);
    }
    // if (user.status !== 'active') {
    //   return response(res, 401, 'Account not active');
    // }
    const token = await user.generateJWT();
    return response(res, 200, 'Welcome back!', {
      token,
      user,
      linkedinProfile,
    });
  },

  // Sign in with google
  googleLogin: async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;
    const googleProfile = throwIfError(
      await GoogleService.verifyToken(credential),
    );
    console.log(googleProfile, 'googleProfile');
    const { email } = googleProfile.data;

    const user = await User.findOne({
      email,
    }).populate('profile');
    if (!user) {
      return response(res, 404, 'User not found', googleProfile);
    }
    // if (user.status !== 'active') {
    //   return response(res, 401, 'Account not active');
    // }
    const token = await user.generateJWT();
    return response(res, 200, 'Welcome back!', {
      token,
      user,
      googleProfile,
    });
  },
};
