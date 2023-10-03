import { DocumentType, getModelForClass } from '@typegoose/typegoose';
import { Profile } from './profileModel';
import { File } from '../features/file/schema';
import { Token } from './token';
import { User } from './userModel';
import { PassportLocalModel } from 'mongoose';

const UserMod = getModelForClass(User);
export type UserModelType = typeof UserMod &
  PassportLocalModel<DocumentType<User>>;
export const UserModel = UserMod as UserModelType;
export const ProfileModel = getModelForClass(Profile);
export const FileModel = getModelForClass(File);
export const TokenModel = getModelForClass(Token);
