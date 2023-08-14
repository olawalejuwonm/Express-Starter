import mongoose, { Document, InferSchemaType, Schema } from 'mongoose';
import lodash from 'lodash';
const userPermissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    for: {
      type: [Schema.Types.ObjectId],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

userPermissionSchema.pre('save', function (next) {
  this.slug = lodash.kebabCase(this.name + '-' + this.user);
  next();
});

export type IUserPermission = InferSchemaType<typeof userPermissionSchema>;
const UserPermission = mongoose.model<IUserPermission>(
  'UserPermission',
  userPermissionSchema,
);

export default UserPermission;
