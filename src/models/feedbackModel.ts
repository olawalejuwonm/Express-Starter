import mongoose from 'mongoose';
import mongooseIdValidator from 'mongoose-id-validator2';

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    for: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      source: 'body',
    },
    refType: {
      type: String,
      required: true,
      immutable: true,
      source: 'body',
    },
    ref: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
      refPath: 'refType',
      source: 'body',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      source: 'body',
      required: true,
    },
    comment: {
      type: String,
      source: 'body',
    },
    positive: {
        type: String,
        source: 'body',
    },
    slug: {
      type: String,
      immutable: true,
      unique: true,
    },
    ownedBy: {
      type: String,
      required: true,
      enum: ['company', 'college'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'ownedBy',
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.plugin(mongooseIdValidator);


feedbackSchema.pre('save', function (next) {
  this.slug = `${this.refType}-${this.ref}-${this.createdBy}-${this.for}-${this.owner}`;
  next();
});

const Feedback = mongoose.model('feedback', feedbackSchema);

export default Feedback;