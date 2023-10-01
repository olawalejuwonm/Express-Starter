import { prop, pre, modelOptions, plugin, Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import idValidator from 'mongoose-id-validator2';

export class Education {
  @prop({ required: true })
  institution!: string;

  @prop({})
  courseOfStudy!: string;

  @prop({})
  qualification!: string;

  @prop({})
  startDate!: Date;

  @prop({})
  endDate!: Date;
}

export class Experience {
  @prop({ required: true })
  company!: string;

  @prop({})
  position!: string;

  @prop({})
  startDate!: Date;

  @prop({})
  endDate!: Date;
}
@plugin(idValidator)
@pre<Profile>('save', function (next) {
  // this.record = doc.name + '-' + doc.createdBy;
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { automaticName: true },
})
export class Profile {
  @prop({ ref: 'User' })
  createdBy!: Types.ObjectId;

  @prop({ required: true })
  firstName!: string;

  @prop({ required: true })
  lastName!: string;

  @prop()
  avatar?: string;

  @prop()
  address?: string;

  @prop()
  landmark?: string;

  @prop()
  agreedToTerms?: boolean;

  @prop()
  lgaOfOrigin?: string;

  @prop()
  stateOfOrigin?: string;

  @prop()
  stateOfResidence?: string;

  @prop()
  country?: string;

  @prop()
  zip?: string;

  @prop()
  gender?: string;

  @prop()
  maritalStatus?: string;

  @prop()
  dateOfBirth?: Date;

  @prop({ type: () => [Education] })
  education?: Education[];

  @prop({ type: () => [Experience] })
  experience?: Experience[];

  @prop()
  bio?: string;

  @prop()
  bankName?: string;

  @prop()
  accountNumber?: string;

  @prop()
  accountName?: string;
}
