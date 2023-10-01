import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Profile } from '../../models/profileModel';
import { UserTypes } from '../../models/userModel';
import { IDocs, IMethod } from '../../utilities/templates/types';
import { authPaths } from './guard';

const doc: IDocs = {};

export class RegisterDto implements Partial<Profile> {
  @IsNotEmpty()
  @IsEmail(
    {},
    {
      message: 'Email format is invalid',
    },
  )
  public email!: string;

  @IsStrongPassword(
    {
      minLength: 7,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 7 characters long, one uppercase letter, one lowercase letter, one number, and one symbol.',
    },
  )
  @IsString()
  public password!: string;

  @IsNotEmpty()
  firstName?: string;

  @IsNotEmpty()
  lastName?: string;

  @IsNotEmpty()
  type?: UserTypes;

  @IsNotEmpty()
  phone?: string | undefined;
}

doc[authPaths.register] = {
  POST: {
    schema: RegisterDto.name,
  },
};
export class LoginDto {
  // export class CreateAuthDto implements Partial<Auth> {
  @IsNotEmpty()
  @IsString()
  public username!: string;

  @IsNotEmpty()
  public password!: string;
}

doc[authPaths.login] = {
  POST: {
    description: `
    For individual account
    username olawalejuwonm@gmail.com,
    password Juwon@1234
    For Admin Account
    username admin@${process.env.APP_NAME}.com,
    password Super@1234
   `,
    schema: LoginDto.name,
  },
};

export class ChangePasswordDto {
  @IsNotEmpty()
  public oldPassword!: string;

  @IsNotEmpty()
  public newPassword!: string;
}
doc[authPaths.changePassword] = {
  POST: {
    schema: ChangePasswordDto.name,
  },
};

export class ResetPasswordDto {
  @IsNotEmpty()
  public token!: string;

  @IsNotEmpty()
  public newPassword!: string;
}

doc[authPaths.resetPassword] = {
  POST: {
    schema: ResetPasswordDto.name,
  },
};

export class ForgotPasswordDto {
  @IsNotEmpty()
  public email!: string;
}

doc[authPaths.requestResetPassword] = {
  POST: {
    schema: ForgotPasswordDto.name,
  },
};

export class VerifyEmailResendDto {
  @IsNotEmpty()
  public email!: string;
}

doc[authPaths.requestEmailVerification] = {
  POST: {
    schema: VerifyEmailResendDto.name,
  },
};

export class VerifyToken {
  @IsNotEmpty()
  public token!: string;
}

doc[authPaths.tokenValidity] = {
  POST: {
    schema: VerifyToken.name,
  },
};
doc[authPaths.verifyEmailAccount] = {
  POST: {
    schema: VerifyToken.name,
  },
};

doc[authPaths.verifyPhone] = {
  POST: {
    schema: VerifyToken.name,
  },
};
export class RequestPhoneVerificationDto {
  @IsNotEmpty()
  public phone!: string;
}
doc[authPaths.requestPhoneVerification] = {
  POST: {
    schema: RequestPhoneVerificationDto.name,
  },
};

export const docs = doc;

// console.log('hello', docs);
