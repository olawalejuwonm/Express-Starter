import mongoose, { InferSchemaType } from 'mongoose';
const { Schema } = mongoose;
import slugify from 'slugify';
import mongooseIdValidator from 'mongoose-id-validator2';

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      source: 'body',
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      source: 'body',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      source: 'body',
    },
    type: {
      type: String,
      enum: ['default', 'user'],
      default: 'user',
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        source: 'body',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        const self: any = this;
        return self.type === 'user';
      },
      immutable: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      refPath: 'ownedBy',
      required: function () {
        const self: any = this;
        return self.type === 'user';
      },
      immutable: true,
    },
    ownedBy: {
      type: String,
      enum: ['company', 'college'],
      required: function () {
        const self: any = this;
        return self.type === 'user';
      },
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

roleSchema.plugin(mongooseIdValidator);

roleSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

export type RoleType = InferSchemaType<typeof roleSchema>;

export default mongoose.model<RoleType>('Role', roleSchema);
