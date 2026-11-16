import mongoose, { Document, Schema } from 'mongoose';

export const COMPANY_EXPENSE_CATEGORIES = [
  'office_rent', 'utilities', 'marketing', 'equipment', 'transport', 'maintenance',
  'software', 'internet', 'staff_salary', 'other',
] as const;
export type CompanyExpenseCategory = (typeof COMPANY_EXPENSE_CATEGORIES)[number];

export interface ICompanyExpense extends Document {
  expenseNo: string;
  title: string;
  category: CompanyExpenseCategory;
  amount: number;
  expenseDate: Date;
  payee?: string;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'other';
  reference?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyExpenseSchema = new Schema<ICompanyExpense>({
  expenseNo: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: COMPANY_EXPENSE_CATEGORIES, required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  expenseDate: { type: Date, required: true, index: true },
  payee: { type: String, trim: true, maxlength: 120, default: '' },
  paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other'], default: 'cash' },
  reference: { type: String, trim: true, maxlength: 120, default: '' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: undefined, index: true },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CompanyExpenseSchema.index({ expenseDate: -1, createdAt: -1 });

export const CompanyExpense = mongoose.model<ICompanyExpense>('CompanyExpense', CompanyExpenseSchema);
