import { prop, plugin, pre, modelOptions, Ref } from '@typegoose/typegoose';
import mongooseIdValidator from 'mongoose-id-validator2';
import { User } from '../../models/userModel';
@plugin(mongooseIdValidator)
@pre<File>('save', function (next) {
  // this.record = doc.name + '-' + doc.createdBy;
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { automaticName: true },
})
export class File {
  @prop({ required: true })
  url!: string;

  @prop({})
  name?: string;

  @prop({ enum: ['image', 'video', 'audio', 'document'] })
  type?: string;

  @prop({})
  size?: string;

  @prop({ immutable: true })
  refType?: string;

  @prop({})
  fieldname?: string;

  @prop({ refPath: 'refType' })
  ref?: Ref<any>;

  @prop({})
  format?: string;

  @prop({ ref: () => User, immutable: true })
  createdBy?: Ref<User>;

  @prop({ type: () => Object })
  metadata?: Record<string, any>;
}
