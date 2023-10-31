import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RequestPhoneVerificationDto,
  ResetPasswordDto,
  VerifyEmailResendDto,
  VerifyToken,
} from './dto';
import { serviceResponseType } from '../../utilities/response';
import { genToken, saveToken, verifyToken } from '../../utilities/token';
import AuthTemplates, {
  resetPasswordTemplate,
} from '../../utilities/templates/auth';
import { UserModel } from '../../models';
import axios from 'axios';
import { validateDTO } from '../../middlewares/validate';
import { TokenType } from '../../models/token';
import { AllUserType, UserType } from '../user/schema';
export default class AuthService {
  static async login(data: LoginDto): Promise<serviceResponseType> {
    try {
      const { user, error } = await UserModel.authenticate()(
        data.username,
        data.password,
      );
      const theUser = user as UserType;
      if (error) {
        return {
          success: false,
          message: error.message,
          data: error,
        };
      }
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: user,
        };
      }
      // if (user.email && !user.emailVerified) {
      //   return {
      //     success: false,
      //     message: 'Email not verified',
      //     data: user,
      //   };
      // }
      const token = await theUser.generateJWT();
      theUser.lastLogin = new Date();
      theUser.save();
      return {
        success: true,
        message: 'Login successful',
        data: { user, token },
      };
    } catch (error) {
      // return
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async register(data: RegisterDto): Promise<serviceResponseType> {
    try {
      const { email, password } = data;

      // Check if user with phone exists
      const userWithPhone = await UserModel.findOne({
        phone: data.phone,
      });

      if (userWithPhone) {
        return {
          success: false,
          message: 'A user with this phone number already exists',
          data: null,
        };
      }

      const user = await UserModel.register(
        new UserModel({
          ...data,
          email,
        }),
        password,
      );



      console.log('user', user._id);
      // if (profile.type === 'artisan')
      // await welcomeTemplate(user.email, profile);

      return {
        success: true,
        message: 'User created successfully',
        data: { user, token: await user.generateJWT() },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async changePassword(
    body: ChangePasswordDto,
    user: UserType,
  ): Promise<serviceResponseType> {
    try {
      const { oldPassword, newPassword } = body;
      const theuser = user as AllUserType;
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: user,
        };
      }
      await theuser.changePassword(oldPassword, newPassword);
      return {
        success: true,
        message: 'Password changed successfully',
        data: user,
      };
    } catch (error: any) {
      if (error.name === 'IncorrectPasswordError') {
        return {
          success: false,
          message: 'Incorrect password',
          data: error,
        };
      }
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async resetPassword(
    body: ResetPasswordDto,
  ): Promise<serviceResponseType> {
    const { token, newPassword } = body;
    try {
      const emailVerify = await verifyToken(token, TokenType.ResetPassword);

      if (!emailVerify.valid) {
        return {
          success: false,
          message: 'Invalid token',
          data: emailVerify,
        };
      }
      const { userId } = emailVerify;
      const user = (await UserModel.findById(userId).populate(
        'profile',
      )) as AllUserType | null;
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: user,
        };
      }
      // await user.resetAttempts();
      await user.setPassword(newPassword);
      await user.save();
      await AuthTemplates.passwordResetConfirmationTemplate(user);
      return {
        success: true,
        message: 'Password reset successfully',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async requestResetPassword(
    body: ForgotPasswordDto,
  ): Promise<serviceResponseType> {
    const { email } = body;
    try {
      const user = await UserModel.findOne({
        email,
      }).populate('profile profile.createdBy');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: user,
          statusCode: 404,
        };
      }

      const theToken = await genToken(user, 'User', 'reset-password');

      await resetPasswordTemplate(user, theToken);
      return {
        success: true,
        message:
          'If an account with this email exists, an email has been sent to you.',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async verifyEmailAccount(body: VerifyToken) {
    try {
      const { token } = body;

      const theToken = await verifyToken(token, TokenType.VerifyEmail);
      if (!theToken.valid) {
        // return response(res, 401, theToken.message);
        return {
          success: false,
          message: theToken.message,
          data: theToken,
        };
      }
      const { userId } = theToken;
      const user = await UserModel.findById(userId);
      // const referral = await createReferral(userId, user.referredBy);
      const theUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          // referralCode,
          // referral: referral._id,
          emailVerified: true,
        },
        { strict: false, new: true, runValidators: true },
      );

      return {
        success: true,
        message: 'Email verified successfully',
        data: theUser,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async sendVerificationEmail(
    body: VerifyEmailResendDto,
  ): Promise<serviceResponseType> {
    const { email } = body;
    try {
      const user = await UserModel.findOne({
        email,
      }).populate('profile');
      if (!user) {
        return {
          success: false,
          message:
            'If an account with this email exists, an email has been sent to you.',
          data: null,
        };
      }
      if (user.emailVerified) {
        return {
          success: false,
          message: 'Account already verified',
          data: user,
        };
      }
      const theToken = await genToken(user, 'User', 'verify-email');
      await AuthTemplates.verifyEmailTemplate(user, theToken);
      return {
        success: true,
        message:
          'If an account with this email exists, an email has been sent to you.',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async sendSMS(phone: string, otpCode: string) {
    try {
      // console.log(
      //   process.env.TEXTNG_SMS_API_KEY,
      //   process.env.TEXTNG_SENDER_ID,
      //   process.env.TEXTNG_route,
      // );
      const message = `Your one time password is ${otpCode} OTP will expire in 10 minutes`;
      const apiUrl = `https://api.ng.termii.com/api/sms/send`;
      const response = await axios.post(apiUrl, {
        api_key: process.env.TERMII_API_KEY,
        to: phone,
        from: 'N-Alert',
        sms: message,
        type: 'plain',
        channel: 'dnd',
      });

      console.log(response.data, 'response.data');
      return response.data;
    } catch (error) {
      console.error(error, 'error');
      throw error;
    }
  }

  static async sendPhoneVerification(
    data: RequestPhoneVerificationDto,
  ): Promise<serviceResponseType> {
    try {
      validateDTO(RequestPhoneVerificationDto, data);
      const user = await UserModel.findOne({
        phone: data.phone,
      });
      if (!user) {
        return {
          success: false,
          message: 'No user with this phone number',
          data: null,
        };
      }
      if (user.phoneVerified) {
        return {
          success: false,
          message: 'Phone number already verified',
          data: null,
        };
      }
      const theToken: string = await saveToken(
        4,
        data.phone,
        TokenType.VerifyPhone,
      );
      const sms = await this.sendSMS(data.phone, theToken);
      // await AuthTemplates.verifyEmailTemplate(user, theToken);
      return {
        success: true,
        message:
          'Please enter the code sent to your phone number to verify your account',
        data: sms,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }

  static async verifyPhone(token: string) {
    try {
      const theToken = await verifyToken(token, TokenType.VerifyPhone);

      if (!theToken.valid) {
        return {
          success: false,
          message: theToken.message,
          data: theToken,
        };
      }

      const user = await UserModel.findOneAndUpdate(
        {
          phone: theToken?.token?.payload,
        },
        {
          phoneVerified: true,
        },
        {
          new: true,
        },
      ).populate('profile');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Phone verified successfully',
        data: { user, token: await user?.generateJWT() },
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: error,
      };
    }
  }
}
