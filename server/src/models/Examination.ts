import mongoose, { Document, Schema } from 'mongoose';

// --- Examination ---
export interface IExamination extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  title: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarkPerWrong: number;
  startWindow: Date;
  endWindow: Date;
  attemptLimit: number;
  randomizeQuestions: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExaminationSchema = new Schema<IExamination>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, default: 100 },
    passMarks: { type: Number, required: true, default: 40 },
    negativeMarkPerWrong: { type: Number, default: 0, min: 0 },
    startWindow: { type: Date, required: true },
    endWindow: { type: Date, required: true },
    attemptLimit: { type: Number, default: 1, min: 1 },
    randomizeQuestions: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Examination = mongoose.model<IExamination>('Examination', ExaminationSchema);

// --- Question ---
export interface IQuestionOption {
  optionId: string;
  text: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  questionText: string;
  options: IQuestionOption[];
  correctOptionId: string; // Excluded from student responses
  explanation?: string;
  marks: number;
  order: number;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    questionText: { type: String, required: true },
    options: [
      {
        optionId: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctOptionId: { type: String, required: true, select: false }, // Security: Never send to students
    explanation: { type: String },
    marks: { type: Number, required: true, default: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

// --- Exam Attempt ---
export interface IStudentAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptionId?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
}

export interface IExamAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  answers: IStudentAnswer[];
  totalScore: number;
  passed: boolean;
  status: 'in_progress' | 'submitted' | 'timeout' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedOptionId: { type: String },
        isCorrect: { type: Boolean },
        marksAwarded: { type: Number, default: 0 },
      },
    ],
    totalScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'timeout', 'abandoned'],
      default: 'in_progress',
    },
  },
  { timestamps: true }
);

ExamAttemptSchema.index({ studentId: 1, examId: 1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
