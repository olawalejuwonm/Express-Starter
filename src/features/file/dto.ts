import { IsOptional } from 'class-validator';
import { File } from './schema';
import { Ref } from '@typegoose/typegoose';
import { User } from '../user/schema';

export class CreateFileDto implements File {
    url: string;
    name?: string | undefined;
    type?: string | undefined;
    size?: string | undefined;
    refType?: string | undefined;
    fieldname?: string | undefined;
    ref?: any;
    format?: string | undefined;
    createdBy?: Ref<User> | undefined;
    metadata?: Record<string, any> | undefined;
// export class CreateFileDto implements Partial<File> {
}
export class UpdateFileDto implements Partial<File> {
//export class UpdateFileDto implements Partial<File> {

}
