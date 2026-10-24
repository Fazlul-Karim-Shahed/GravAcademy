import mongoose, { Document, Schema } from 'mongoose';

export interface IJobCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;        // e.g. "সরকারি চাকরি"
  slug: string;        // e.g. "govt" or "shorkari"
  description?: string;
  badgeColor?: string; // e.g. "emerald", "blue", "purple"
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobCategorySchema = new Schema<IJobCategory>(
  {
    name: {
      type: String,
      required: [true, 'ক্যাটাগরির নাম আবশ্যক'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    badgeColor: {
      type: String,
      default: 'emerald',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const JobCategory = mongoose.model<IJobCategory>('JobCategory', JobCategorySchema);
