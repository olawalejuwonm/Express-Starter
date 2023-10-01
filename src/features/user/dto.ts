import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Status, User, UserTypes } from '../../models/userModel';
import { Ref, DocumentType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { IDocs, IMethod } from '../../utilities/templates/types';

const doc: IDocs = {};
export class CreateUserDto implements Partial<User> {
  // export class CreateUserDto implements Partial<User> {
}
export class UpdateUserDto
  implements
    Omit<
      User,
      | 'generateJWT'
      | 'toJSON'
      | 'role'
      | 'permission'
      | 'status'
      | 'profile'
      | 'emailVerified'
      | 'isAdmin'
      | 'lastActive'
      | 'lastLogin'
      | 'type'
      | 'phoneVerified'
    >
{
  @IsOptional()
  email: string;
  @IsOptional()
  phone: string;
  //export class UpdateUserDto implements Partial<User> {
}

doc['/'] = {
  PUT: {
    schema: UpdateUserDto.name,
  },
};

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @IsNotEmpty()
  @IsString()
  status: Status;

  // description should be only required when status is rejected
  @IsOptional()
  @IsString()
  description?: string;
}

doc['/update-status'] = {
  PUT: {
    schema: UpdateUserStatusDto.name,
  },
};

export class updateEmailDto {
  @IsEmail(
    {},
    {
      message: 'Email format is invalid',
    },
  )
  @IsString()
  email: string;
}

export const docs = doc;
