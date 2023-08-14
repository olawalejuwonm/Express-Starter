import mongoose, { InferSchemaType, modelNames } from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: function () {
        const self = this as any;
        return self.payload;
      },
      // enum: modelNames(),
    },
    message: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      source: 'body',
    },
    payload: {
      type: Schema.Types.ObjectId,
      refPath: 'type',
      required: function () {
        const self = this as any;
        return self.type;
      },
    },
  },
  {
    timestamps: true,
  },
);

export type NotificationType = InferSchemaType<typeof notificationSchema>;

export default mongoose.model<NotificationType>(
  'Notification',
  notificationSchema,
);
