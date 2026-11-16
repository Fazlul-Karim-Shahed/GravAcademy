import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { CompanyExpense, COMPANY_EXPENSE_CATEGORIES } from '../models/CompanyExpense';
import { ReceiptCounter } from '../models/ReceiptCounter';
import { TeacherPayment } from '../models/TeacherPayment';
import { User } from '../models/User';

const TIME_ZONE = 'Asia/Dhaka';
const formatDhakaDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
const validDate = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(new Date(`${value}T12:00:00.000Z`).getTime())
  && new Date(`${value}T12:00:00.000Z`).toISOString().slice(0, 10) === value;
const dhakaDayStart = (value: string) => new Date(`${value}T00:00:00.000+06:00`);
const dhakaDayEnd = (value: string) => new Date(`${value}T23:59:59.999+06:00`);
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createCompanyExpenseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum(COMPANY_EXPENSE_CATEGORIES),
  amount: z.number().int().positive().max(100_000_000),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payee: z.string().trim().max(120).optional().or(z.literal('')),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other']).default('cash'),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

const createExpenseNumber = async () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: '2-digit', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values: Record<string, string> = {};
  parts.forEach((part) => { values[part.type] = part.value; });
  const prefix = `EXP-${values.year}${values.month}${values.day}`;
  const counter = await ReceiptCounter.findOneAndUpdate({ _id: prefix }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `${prefix}-${counter.seq.toString().padStart(3, '0')}`;
};

export const getCompanyExpenses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = formatDhakaDate();
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : '';
    if (month && (Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12)) return res.status(400).json({ success: false, message: 'মাসটি সঠিক নয়।' });
    const monthStart = month ? `${month}-01` : '';
    const monthEnd = month ? `${month}-${String(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()).padStart(2, '0')}` : today;
    const hasStart = typeof req.query.startDate === 'string' && req.query.startDate.length > 0;
    const hasEnd = typeof req.query.endDate === 'string' && req.query.endDate.length > 0;
    if (hasStart !== hasEnd || (hasStart && (!validDate(req.query.startDate) || !validDate(req.query.endDate) || String(req.query.startDate) > String(req.query.endDate)))) {
      return res.status(400).json({ success: false, message: 'Start ও end date সঠিকভাবে দিন।' });
    }
    const startDate = hasStart ? String(req.query.startDate) : monthStart || null;
    const endDate = hasEnd ? String(req.query.endDate) : monthEnd;
    const dateRange: Record<string, Date> = { $lte: dhakaDayEnd(endDate) };
    if (startDate) dateRange.$gte = dhakaDayStart(startDate);
    const source = ['teacher', 'manual'].includes(String(req.query.source)) ? String(req.query.source) : 'all';
    const category = typeof req.query.category === 'string' ? req.query.category : 'all';
    if (category !== 'all' && category !== 'teacher_payment' && !(COMPANY_EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
      return res.status(400).json({ success: false, message: 'Expense category সঠিক নয়।' });
    }
    const searchText = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '25'), 10) || 25));
    const normalizedMatch: Record<string, any> = {};
    if (source !== 'all') normalizedMatch.source = source;
    if (category !== 'all') normalizedMatch.category = category;
    if (searchText) {
      const regex = new RegExp(escapeRegex(searchText), 'i');
      normalizedMatch.$or = [{ title: regex }, { payeeName: regex }, { referenceNo: regex }, { category: regex }, { notes: regex }];
    }

    const teacherCollection = User.collection.name;
    const pipeline: any[] = [
      { $match: { paidAt: dateRange } },
      { $lookup: { from: teacherCollection, localField: 'teacherId', foreignField: '_id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: teacherCollection, localField: 'paidBy', foreignField: '_id', as: 'actor' } },
      { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
      { $project: {
        source: { $literal: 'teacher' }, sourceId: '$_id', referenceNo: '$receiptNo',
        title: { $concat: ['শিক্ষক payment · ', { $ifNull: ['$teacher.name', 'Teacher'] }] },
        payeeName: '$teacher.name', gravId: '$teacher.gravId', amount: '$amountPaid', date: '$paidAt',
        category: { $literal: 'teacher_payment' }, paymentMethod: { $literal: 'cash' }, notes: 1,
        classCount: { $size: { $ifNull: ['$classes', []] } }, classes: 1, courseBreakdown: 1,
        createdBy: '$actor.name',
      } },
      { $unionWith: { coll: CompanyExpense.collection.name, pipeline: [
        { $match: { expenseDate: dateRange } },
        { $lookup: { from: teacherCollection, localField: 'createdBy', foreignField: '_id', as: 'actor' } },
        { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
        { $project: {
          source: { $literal: 'manual' }, sourceId: '$_id', referenceNo: '$expenseNo', title: 1,
          payeeName: '$payee', amount: 1, date: '$expenseDate', category: 1, paymentMethod: 1,
          reference: 1, notes: 1, createdBy: '$actor.name', classCount: { $literal: 0 },
        } },
      ] } },
      ...(Object.keys(normalizedMatch).length ? [{ $match: normalizedMatch }] : []),
      { $facet: {
        data: [{ $sort: { date: -1, sourceId: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
        summary: [{ $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          teacherPayments: { $sum: { $cond: [{ $eq: ['$source', 'teacher'] }, '$amount', 0] } },
          manualExpenses: { $sum: { $cond: [{ $eq: ['$source', 'manual'] }, '$amount', 0] } },
          count: { $sum: 1 },
        } }],
        count: [{ $count: 'total' }],
      } },
    ];

    const [result] = await TeacherPayment.aggregate(pipeline).allowDiskUse(true);
    const summary = result?.summary?.[0] || { totalExpenses: 0, teacherPayments: 0, manualExpenses: 0, count: 0 };
    const total = result?.count?.[0]?.total || 0;
    return res.json({
      success: true,
      range: { startDate, endDate },
      data: result?.data || [],
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('getCompanyExpenses error:', error);
    return res.status(500).json({ success: false, message: 'Company expenses load করা যায়নি।' });
  }
};

export const createCompanyExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, amount, expenseDate, payee = '', paymentMethod = 'cash', reference = '', notes = '' } = req.body;
    if (!validDate(expenseDate) || expenseDate > formatDhakaDate()) {
      return res.status(400).json({ success: false, message: 'Expense date আজকের বা আগের তারিখ হতে হবে।' });
    }
    const expense = await CompanyExpense.create({
      expenseNo: await createExpenseNumber(),
      title,
      category,
      amount,
      expenseDate: new Date(`${expenseDate}T12:00:00.000+06:00`),
      payee,
      paymentMethod,
      reference,
      notes,
      createdBy: req.user!._id,
    });
    const data = await CompanyExpense.findById(expense._id).populate('createdBy', 'name gravId').lean();
    return res.status(201).json({ success: true, message: 'Expense সংরক্ষণ হয়েছে।', data });
  } catch (error: any) {
    console.error('createCompanyExpense error:', error);
    return res.status(500).json({ success: false, message: 'Expense সংরক্ষণ করা যায়নি।' });
  }
};
