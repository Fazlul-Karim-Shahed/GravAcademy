import mongoose, { Document, Schema } from 'mongoose';

export type JobSector = string;

export interface ICustomJobField {
  label: string;
  value: string;
}

export interface IJobPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;                  // e.g. "বাংলাদেশ রেলওয়ে নিয়োগ বিজ্ঞপ্তি ২০২৬"
  slug: string;                   // url-friendly slug
  organizationName: string;       // e.g. "বাংলাদেশ রেলওয়ে"
  organizationLogo?: string;
  sector: JobSector;              // 'govt' | 'semi_govt' | 'private' | 'bank' | etc.
  category?: string;              // e.g. "প্রকৌশল ও প্রযুক্তি", "শিক্ষা ও শিক্ষকতা", "প্রশাসন ও সাধারণ"
  postName: string;               // e.g. "সহকারী স্টেশন মাস্টার, বুকিং সহকারী"
  vacancyCount?: string;          // e.g. "৫৬৩ জন" or "উল্লেখ নেই"
  salaryScale?: string;           // e.g. "গ্রেড-১৫ (৯,৭০০ - ২৩,৪৯০/-)"
  educationalQualification?: string; // e.g. "যেকোনো স্বীকৃত বিশ্ববিদ্যালয় হতে স্নাতক বা সমমান"
  experienceRequired?: string;    // e.g. "প্রযোজ্য নয় / ১ বছরের অভিজ্ঞতা"
  ageLimit?: string;              // e.g. "১৮ হতে ৩০ বছর (মুক্তিযোদ্ধা কোটায় ৩২ বছর)"
  applicationFee?: string;        // e.g. "২২৩/- টাকা (টেলিটক এসএমএস এর মাধ্যমে)"
  publishDate?: Date;             // Publication Date
  applicationStartDate?: Date;
  applicationDeadline?: Date;
  sourceOrNewspaper?: string;     // e.g. "দৈনিক ইত্তেফাক, অফিসিয়াল ওয়েবসাইট"
  officialWebsite?: string;       // e.g. "http://railway.teletalk.com.bd"
  circularImageUrl?: string;      // Image/Banner of circular
  circularPdfUrl?: string;        // PDF link
  shortDescription?: string;      // Quick summary / highlight
  fullDescriptionHtml?: string;   // Rich text / detailed content
  customFields?: ICustomJobField[]; // Dynamic custom sections: [{ label: 'পরীক্ষার মানবণ্টন', value: '...' }]
  status: 'published' | 'draft' | 'archived';
  viewsCount: number;
  featured: boolean;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomJobFieldSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const JobPostSchema = new Schema<IJobPost>(
  {
    title: {
      type: String,
      required: [true, 'জব সার্কুলার এর শিরোনাম আবশ্যক'],
      trim: true,
      maxlength: 300,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: [true, 'প্রতিষ্ঠানের নাম আবশ্যক'],
      trim: true,
      index: true,
    },
    organizationLogo: {
      type: String,
      trim: true,
    },
    sector: {
      type: String,
      default: 'govt',
      index: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'সাধারণ সরকারি',
      index: true,
    },
    postName: {
      type: String,
      required: [true, 'পদের নাম আবশ্যক'],
      trim: true,
    },
    vacancyCount: {
      type: String,
      trim: true,
      default: 'উল্লেখ নেই',
    },
    salaryScale: {
      type: String,
      trim: true,
    },
    educationalQualification: {
      type: String,
      trim: true,
    },
    experienceRequired: {
      type: String,
      trim: true,
      default: 'প্রযোজ্য নয়',
    },
    ageLimit: {
      type: String,
      trim: true,
    },
    applicationFee: {
      type: String,
      trim: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    applicationStartDate: {
      type: Date,
    },
    applicationDeadline: {
      type: Date,
      index: true,
    },
    sourceOrNewspaper: {
      type: String,
      trim: true,
    },
    officialWebsite: {
      type: String,
      trim: true,
    },
    circularImageUrl: {
      type: String,
      trim: true,
    },
    circularPdfUrl: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    fullDescriptionHtml: {
      type: String,
      default: '',
    },
    customFields: [CustomJobFieldSchema],
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

JobPostSchema.index({ status: 1, createdAt: -1 });
JobPostSchema.index({ sector: 1, status: 1 });
JobPostSchema.index({ title: 'text', organizationName: 'text', postName: 'text' });

export const JobPost = mongoose.model<IJobPost>('JobPost', JobPostSchema);
