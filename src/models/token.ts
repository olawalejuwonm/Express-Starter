import {
  prop,
  getModelForClass,
  Ref,
  modelOptions,
} from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export enum TokenType {
  VerifyEmail = 'verify-email',
  ResetPassword = 'reset-password',
  VerifyPhone = 'verify-phone',
  AccountNumber = 'account-number',
}

enum UserType {
  User = 'User',
  Admin = 'Admin',
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Token {
  @prop({ required: true })
  token!: string;

  @prop({ required: true, enum: TokenType })
  type!: TokenType;

  @prop({ required: true, enum: UserType })
  userType!: UserType;

  @prop()
  payload?: string;

  @prop({ refPath: 'userType' })
  user?: Ref<any>;

  @prop({ default: false })
  expired?: boolean;

  @prop({ expires: 600 })
  expireAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}
