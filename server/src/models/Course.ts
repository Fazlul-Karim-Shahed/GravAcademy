import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevel: string; // e.g., 'Class 6', 'Class 10', 'HSC'
  subject: string;    // e.g., 'Bangla', 'Mathematics', 'Physics'
  isPublished: boolean;
  duration?: string;
  courseFee: number;
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
    },
    gradeLevel: {
      type: String,
      required: [true, 'Grade/Class level is required'],
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    duration: {
      type: String,
    },
    courseFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    prerequisites: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering
CourseSchema.index({ gradeLevel: 1, subject: 1, isPublished: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
