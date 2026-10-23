import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicClass extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;           // e.g. "Class 10", "Class 9", "HSC 2026"
  slug?: string;          // e.g. "class-10"
  order: number;          // display ordering
  description?: string;
  subtitle?: string;
  heroBannerUrl?: string;
  curriculumHighlights?: string[];
  features?: { title: string; description: string; icon?: string }[];
  faqs?: { question: string; answer: string }[];
  subjects?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AcademicClassSchema = new Schema<IAcademicClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    heroBannerUrl: {
      type: String,
      default: '',
      trim: true,
    },
    curriculumHighlights: {
      type: [String],
      default: [],
    },
    features: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        icon: { type: String, default: 'Sparkles' },
      },
    ],
    faqs: [
      {
        question: { type: String, default: '' },
        answer: { type: String, default: '' },
      },
    ],
    subjects: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

AcademicClassSchema.index({ order: 1, name: 1 });

export const AcademicClass = mongoose.model<IAcademicClass>('AcademicClass', AcademicClassSchema);
