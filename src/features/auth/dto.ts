import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { IDocs } from '../../utilities/templates/types';
import { authPaths } from './guard';
import { User } from '../user/schema';
import { ValidateNestedProp } from '../../middlewares/validate';

const doc: IDocs = {};

export class RegisterDto
  implements
    Omit<
      Required<User>,
      | 'lastLogin'
      | 'emailVerified'
      | 'lastActive'
      | 'lastLogin'
      | 'isAdmin'
      | 'status'
      | 'role'
      | 'phoneVerified'
      | 'generateJWT'
      | 'roles'
      | 'permissions'
      | 'toJSON'
      | 'hotScore'
      | 'skp'
      | 'generateSKP'
      | 'verifySKP'
      | 'organisationAdmins'
      | 'organisationMembers'
      | 'type'
      | 'ninNumber'
      | 'bvnNumber'
      | 'levels'
      | 'positions'
      | 'departments'
    >
{
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
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsNotEmpty()
  phone!: string;
}

doc['/register-individual'] = {
  POST: {
    schema: RegisterDto.name,
    description: `
    {
      "email": "olawalejuwon@gmail.com",
      "password": "Juwon@1234",
      "firstName": "Micheal",
      "lastName": "Juwon",
      "type": "individual",
      "phone": "08145156235"
    }

    
    `,
  },
};


export class LoginDto {
  @IsNotEmpty()
  @IsString()
  public username!: string;

  @IsNotEmpty()
  public password!: string;
}

export class LoginAdminDto {
  @IsNotEmpty()
  @IsString()
  public email!: string;
}

doc['/login-admin'] = {
  POST: {
    description: ``,
    schema: LoginAdminDto.name,
  },
};

doc[authPaths.login] = {
  POST: {
    description: `
    For individual account
    {
      "username": "olawalejuwon@gmail.com",
      "password": "Juwon@1234"
    }
    For Admin Account
    {
      "username": "admin@${process.env.APP_NAME}.com",
      "password": "Super@1234"
    }
    For Organisation
    {
      "username": "o.l.awa.lejuwon@gmail.com",
      "password": "Juwon@1234"
    }
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
  @IsEmail()
  public email!: string;
}

doc[authPaths.requestResetPassword] = {
  POST: {
    schema: ForgotPasswordDto.name,
  },
};

export class VerifyEmailResendDto {
  @IsEmail(
    {},
    {
      message: 'Email format is invalid',
    },
  )
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

export class SetPinDTO {
  @IsNotEmpty()
  public pin!: string;

  @IsString()
  public password!: string;
}
doc['/set-pin'] = {
  POST: {
    schema: SetPinDTO.name,
    description: `
    PIN MUST BE BETWEEN 234567
    `,
  },
};

export const docs = doc;
