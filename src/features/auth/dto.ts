import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Profile } from '../../models/profileModel';

export class RegisterDto implements Partial<Profile> {
  @IsNotEmpty()
  @IsString()
  public email!: string;

  @IsNotEmpty()
  @IsString()
  public password!: string;

  @IsNotEmpty()
  firstName?: string;

  @IsNotEmpty()
  lastName?: string;

  @IsNotEmpty()
  type?: string | undefined;

  @IsNotEmpty()
  phone?: string | undefined;
}
export class LoginDto {
  // export class CreateAuthDto implements Partial<Auth> {
  @IsNotEmpty()
  @IsString()
  public username!: string;

  @IsNotEmpty()
  public password!: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  public oldPassword!: string;

  @IsNotEmpty()
  public newPassword!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  public token!: string;

  @IsNotEmpty()
  public newPassword!: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  public email!: string;
}

export class VerifyEmailDto {
  @IsNotEmpty()
  public token!: string;
}

export class VerifyEmailResendDto {
  @IsNotEmpty()
  public email!: string;
}
