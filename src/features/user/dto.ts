import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { User } from '../../models/userModel';

export class CreateUserDto implements Partial<User> {
  // export class CreateUserDto implements Partial<User> {
}
export class UpdateUserDto implements Partial<User> {
  //export class UpdateUserDto implements Partial<User> {
}
