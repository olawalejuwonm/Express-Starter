import {
  prop,
  getModelForClass,
  pre,
  modelOptions,
  plugin,
  Ref,
} from '@typegoose/typegoose';
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
  @prop({ ref: 'User', immutable: true })
  createdBy!: string;

  @prop({ required: true, immutable: true })
  type!: string;

  @prop({ required: true })
  firstName!: string;

  @prop({ required: true })
  lastName!: string;

  @prop()
  email?: string;

  @prop({
    unique: true,
  })
  employeeId?: string;

  @prop()
  probationPeriod?: Date;

  @prop()
  avatar?: string;

  @prop()
  phone?: string;

  @prop()
  address?: string;

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

  //TODO: Work on Branch

  @prop()
  pension?: string;

  @prop()
  pensionNumber?: string;

  @prop()
  onHMOScheme?: boolean;

  @prop()
  hmoProvider?: string;

  @prop()
  hmoNumber?: string;

  @prop()
  hmoId?: string;

  @prop()
  hmoPlan?: string;

  @prop()
  hmoHospital?: string;

  @prop()
  hmoStatus?: string;

  @prop({ type: () => [Education] })
  education?: Education[];

  @prop({ type: () => [Experience] })
  experience?: Experience[];
}

// export const ProfileModel = getModelForClass(Profile);
