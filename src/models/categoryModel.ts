import mongoose, { Schema, InferSchemaType } from 'mongoose';
import idValidator from 'mongoose-id-validator2';
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      source: 'body',
    },
    description: {
      type: String,
      source: 'body',
    },
    subCategories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      source: 'body',
    },
    avatar: {
      type: String,
      source: 'body',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      refPath: 'ownedBy',
      required: true,
      immutable: true,
    },
    ownedBy: {
      type: String,
      enum: ['company', 'college'],
      required: true,
      immutable: true,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.pre('save', function (next) {
  const self: any = this;
  self.slug = self.name?.toLowerCase() + '-' + self.owner;
  next();
});

// categorySchema.plugin(mongoose.idValidator);
categorySchema.plugin(idValidator);

export type CategoryType = InferSchemaType<typeof categorySchema>;

export default mongoose.model<CategoryType>('Category', categorySchema);
