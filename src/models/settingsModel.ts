import mongoose, { InferSchemaType } from 'mongoose';

const { Schema } = mongoose;
const settingsSchema = new Schema(
  {
    dataTypes: {
      type: Array,
      default: [],
    },
    superAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    roles: {
      universityStaff: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
      universityAdmin: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
      companyStaff: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
      companyAdmin: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
      },
    },
    showDocs: {
      type: Boolean,
      default: true,
    },
    links: {},
  },
  {
    timestamps: true,
  },
);

export type SettingsType = mongoose.Document &
  InferSchemaType<typeof settingsSchema>;

export default mongoose.model<SettingsType>('Settings', settingsSchema);
