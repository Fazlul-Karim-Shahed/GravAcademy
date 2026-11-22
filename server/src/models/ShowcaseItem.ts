import mongoose, { Document, Schema } from 'mongoose';

export type ShowcaseType = 'achiever' | 'testimonial';

export interface IShowcaseItem extends Document {
  _id: mongoose.Types.ObjectId;
  type: ShowcaseType;
  name: string;
  imageUrl?: string;
  title?: string;
  institution?: string;
  achievement?: string;
  quote?: string;
  relation?: 'student' | 'guardian' | 'alumni';
  rating?: number;
  isPublished: boolean;
  sortOrder: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShowcaseItemSchema = new Schema<IShowcaseItem>(
  {
    type: { type: String, enum: ['achiever', 'testimonial'], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    imageUrl: { type: String, trim: true, maxlength: 1000 },
    title: { type: String, trim: true, maxlength: 180 },
    institution: { type: String, trim: true, maxlength: 180 },
    achievement: { type: String, trim: true, maxlength: 360 },
    quote: { type: String, trim: true, maxlength: 1000 },
    relation: { type: String, enum: ['student', 'guardian', 'alumni'] },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isPublished: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ShowcaseItemSchema.index({ type: 1, isPublished: 1, sortOrder: 1, createdAt: -1 });

export const ShowcaseItem = mongoose.model<IShowcaseItem>('ShowcaseItem', ShowcaseItemSchema);
