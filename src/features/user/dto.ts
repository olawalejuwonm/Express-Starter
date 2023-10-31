import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IDocs } from '../../utilities/templates/types';
import { User, UserStatus } from './schema';
import { Ref } from '@typegoose/typegoose';

const doc: IDocs = {};

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
      | 'roles'
      | 'permissions'
      | 'email'
      | 'phone'
    >
{
  @IsOptional()
  firstName: string;
  @IsOptional()
  lastName: string;
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
  status: UserStatus;

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
