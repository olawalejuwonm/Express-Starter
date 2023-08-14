import { getModelForClass } from '@typegoose/typegoose';
import { Profile } from './profileModel';
import { File } from '../features/file/schema';


export const ProfileModel = getModelForClass(Profile);
export const FileModel = getModelForClass(File);

