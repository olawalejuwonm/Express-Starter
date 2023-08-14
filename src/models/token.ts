import mongoose, { Document, Model } from 'mongoose';
import { InferSchemaType } from 'mongoose';

const { Schema } = mongoose;
const tokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      //TODO: Turn to typegoose and make enum
      enum: ['verify-email', 'reset-password', 'verify-phone'],
      required: true,
    },
    userType: {
      type: String,
      enum: ['User', 'Admin'],
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      refPath: 'userType',
    },
    expired: {
      type: Boolean,
      default: false,
    },
    expireAt: {
      type: Date,
      // default: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  },
  {
    timestamps: true,
  },
);

// expire after 10 minutes
// tokenSchema.index(
//   {
//     expireAt: 1, // 1 means ascending
//   },
//   {
//     expireAfterSeconds: 0, // 0 means never expire
//   },
// );

export type IToken = InferSchemaType<typeof tokenSchema>;

// Use `mongoose.Model<IToken>` instead of `<Model<IToken>>`
export const Token: Model<IToken> = mongoose.model<IToken>(
  'Token',
  tokenSchema,
);

// Export the tokenSchema as well
export { tokenSchema };

export default Token;
