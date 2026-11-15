import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevel: string; // e.g., 'Class 6', 'Class 10', 'HSC'
  subject?: string;
  isPublished: boolean;
  duration?: string;
  studentAccessMode?: 'manual' | 'lifetime';
  studentAccessMonths?: number;
  courseFee: number;
  regularPrice?: number;
  discountPrice?: number;
  prerequisites?: string[];
  instructors: mongoose.Types.ObjectId[];
  curriculumHighlights?: string[];
  features?: string[];
  targetAudience?: string;
  heroEyebrow?: string;
  accessLabel?: string;
  instructorProfiles?: ICourseInstructorProfile[];
  syllabus?: ICourseSyllabusItem[];
  routine?: ICourseRoutine;
  supportSection?: ICourseSupportSection;
  promoCards?: ICoursePromoCard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseInstructorProfile {
  instructorId: mongoose.Types.ObjectId;
  subject?: string;
  experience?: string;
}

export interface ICourseSyllabusItem {
  title: string;
  details?: string;
  contentLines?: string[];
  demoTitle?: string;
  demoUrl?: string;
}

export interface ICourseRoutine {
  title?: string;
  bannerText?: string;
  programLabel?: string;
  routineUrl?: string;
  prospectusUrl?: string;
}

export interface ICourseSupportSection {
  title?: string;
  description?: string;
  hours?: string;
  phone?: string;
  note?: string;
  imageUrl?: string;
}

export interface ICoursePromoCard {
  key: 'video' | 'facebook';
  eyebrow?: string;
  title?: string;
  buttonLabel?: string;
  buttonUrl?: string;
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
      default: '',
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
    studentAccessMode: { type: String, enum: ['manual', 'lifetime'], default: 'manual' },
    studentAccessMonths: { type: Number, min: 1, max: 120 },
    courseFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    regularPrice: {
      type: Number,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    prerequisites: [{ type: String }],
    instructors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    curriculumHighlights: [{ type: String }],
    features: [{ type: String }],
    targetAudience: { type: String, default: '' },
    heroEyebrow: { type: String, default: 'ACADEMIC PROGRAM', trim: true, maxlength: 100 },
    accessLabel: { type: String, default: 'সীমাহীন সেশন', trim: true, maxlength: 100 },
    instructorProfiles: [
      {
        instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, default: '', trim: true, maxlength: 120 },
        experience: { type: String, default: '', trim: true, maxlength: 80 },
      },
    ],
    syllabus: [
      {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        details: { type: String, default: '', trim: true, maxlength: 1000 },
        contentLines: [{ type: String, trim: true, maxlength: 500 }],
        demoTitle: { type: String, default: 'এখনই ফ্রী ডেমো দেখুন', trim: true, maxlength: 120 },
        demoUrl: { type: String, default: '', trim: true, maxlength: 500 },
      },
    ],
    routine: {
      title: { type: String, default: 'প্রোগ্রামের ক্লাস রুটিন ও প্রসপেক্টাস', trim: true, maxlength: 150 },
      bannerText: { type: String, default: 'রুটিন শীঘ্রই আসছে', trim: true, maxlength: 200 },
      programLabel: { type: String, default: 'Academic Program', trim: true, maxlength: 120 },
      routineUrl: { type: String, default: '', trim: true },
      prospectusUrl: { type: String, default: '', trim: true },
    },
    supportSection: {
      title: { type: String, default: 'যেকোনো প্রয়োজনে কল করো এখনই', trim: true, maxlength: 160 },
      description: { type: String, default: 'কোর্স, পড়াশোনা বা ভর্তি নিয়ে যেকোনো প্রশ্নে আমাদের সাথে কথা বলুন।', trim: true, maxlength: 500 },
      hours: { type: String, default: 'সকাল ৮টা - রাত ১০টা', trim: true, maxlength: 100 },
      phone: { type: String, default: '16910', trim: true, maxlength: 40 },
      note: { type: String, default: '* সাধারণ কল রেট প্রযোজ্য', trim: true, maxlength: 200 },
      imageUrl: { type: String, default: '', trim: true },
    },
    promoCards: [
      {
        key: { type: String, enum: ['video', 'facebook'], required: true },
        eyebrow: { type: String, default: '', trim: true, maxlength: 80 },
        title: { type: String, default: '', trim: true, maxlength: 120 },
        buttonLabel: { type: String, default: '', trim: true, maxlength: 60 },
        buttonUrl: { type: String, default: '', trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering
CourseSchema.index({ gradeLevel: 1, subject: 1, isPublished: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
