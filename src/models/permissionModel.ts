import mongoose, { Document, InferSchemaType } from 'mongoose';
const { Schema } = mongoose;
import slugify from 'slugify';
import mongooseIdValidator from 'mongoose-id-validator2';

const permissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    type: {
      type: String,
      enum: ['default', 'admin'],
      default: 'default',
    },
  },
  {
    timestamps: true,
  },
);

permissionSchema.plugin(mongooseIdValidator);

permissionSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

export type PermissionType = Document &
  InferSchemaType<typeof permissionSchema>;

export default mongoose.model<PermissionType>('Permission', permissionSchema);
