import { DocumentType, getModelForClass } from '@typegoose/typegoose';
import { File } from '../features/file/schema';
import { Token } from './token';
import { PassportLocalModel } from 'mongoose';
import { User } from '../features/user/schema';

const UserMod = getModelForClass(User);
export type UserModelType = typeof UserMod &
  PassportLocalModel<DocumentType<User>>;
export const UserModel = UserMod as UserModelType;
export const FileModel = getModelForClass(File);
export const TokenModel = getModelForClass(Token);
