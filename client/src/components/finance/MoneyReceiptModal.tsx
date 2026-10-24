'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle,
  Building2,
  Calendar,
  CreditCard,
  User,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';

export interface PaymentReceiptData {
  _id: string;
  receiptNo: string;
  amountPaid: number;
  totalFee?: number;
  dueAmount?: number;
  paymentMethod: string;
  paymentType?: string;
  transactionId?: string;
  senderNumber?: string;
  documentUrl?: string;
  notes?: string;
  paidAt?: string;
  createdAt?: string;
  studentId: {
    _id?: string;
    name: string;
    userId: string;
    phone?: string;
    email?: string;
    studentDetails?: {
      schoolOrCollege?: string;
      gradeLevel?: string;
    };
  };
  batchId?: {
    _id?: string;
    name: string;
    fee?: number;
  };
  courseId?: {
    _id?: string;
    title: string;
    courseFee?: number;
    regularPrice?: number;
    discountPrice?: number;
  };
  collectedBy?: {
    name: string;
    userId?: string;
    role?: string;
  };
  allPayments?: PaymentReceiptData[];
}

interface MoneyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PaymentReceiptData | null;
  allPayments?: PaymentReceiptData[];
}

const methodNames: Record<string, string> = {
  cash: 'ক্যাশ (Cash)',
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  rocket: 'রকেট (Rocket)',
  bank_transfer: 'ব্যাংক ট্রান্সফার (Bank Transfer)',
  other: 'অন্যান্য (Other)',
};

export const MoneyReceiptModal: React.FC<MoneyReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  allPayments,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  // Determine payments list: if allPayments passed or data.allPayments exists with items, use that; otherwise fallback to [data]
  const paymentsList = (allPayments && allPayments.length > 0)
    ? allPayments
    : (data.allPayments && data.allPayments.length > 0)
    ? data.allPayments
    : [data];

  // Calculate cumulative paid amount across all payments
  const totalPaidAcrossAll = paymentsList.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  
  // Total current fee of the course: Always prioritize live course pricing (discountPrice ?? courseFee ?? regularPrice)
  const courseDoc = data.courseId;
  const courseCurrentPrice =
    courseDoc?.discountPrice ??
    courseDoc?.courseFee ??
    courseDoc?.regularPrice ??
    data.totalFee ??
    totalPaidAcrossAll;

  const courseTotalFee = courseCurrentPrice;

  // Final due amount is accurately: max(0, courseTotalFee - totalPaidAcrossAll)
  const finalDueAmount = Math.max(0, courseTotalFee - totalPaidAcrossAll);

  const receiptDate = data.paidAt || data.createdAt
    ? new Date(data.paidAt || data.createdAt!).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('bn-BD');

  const receiptTime = data.paidAt || data.createdAt
    ? new Date(data.paidAt || data.createdAt!).toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              মানি রিসিট (Money Receipt)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট / PDF ডাউনলোড
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:p-8 print:space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-dashed border-slate-200 dark:border-slate-800 print:border-slate-400">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 print:border print:border-black">
                  G
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                    GravAcademy
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">
                    অফিসিয়াল পেমেন্ট ও এডমিশন রিসিট
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs print:border-black print:text-black print:bg-transparent">
                রিসিট নং: {data.receiptNo}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 print:text-slate-600">
                তারিখ: {receiptDate} {receiptTime && `(${receiptTime})`}
              </div>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 print:bg-slate-50 print:border-slate-300">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                শিক্ষার্থীর তথ্য (Student Info)
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white print:text-black mt-1">
                {data.studentId?.name || 'অজ্ঞাত শিক্ষার্থী'}
              </h3>
              <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 print:text-black mt-0.5">
                স্টুডেন্ট আইডি: {data.studentId?.userId || 'N/A'}
              </p>
              {data.studentId?.phone && (
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {data.studentId.phone}
                </p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                কোর্স ও ব্যাচ (Course & Batch)
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mt-1">
                {data.batchId?.name || 'ব্যাচ নির্ধারিত হয়নি'}
              </h4>
              {data.courseId?.title && (
                <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700 mt-0.5">
                  কোর্স: {data.courseId.title}
                </p>
              )}
              {data.studentId?.studentDetails?.schoolOrCollege && (
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                  প্রতিষ্ঠান: {data.studentId.studentDetails.schoolOrCollege}
                </p>
              )}
            </div>
          </div>

          {/* Payment Breakdown Table (Shows all installments or single payment) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 print:bg-slate-200 print:text-black text-xs font-extrabold">
                <tr>
                  <th className="py-3 px-4">তারিখ ও কিস্তির বিবরণ (Description)</th>
                  <th className="py-3 px-4 text-center">মেথড ও ট্রানজ্যাকশন</th>
                  <th className="py-3 px-4 text-right">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                {paymentsList.map((item, idx) => {
                  const itemDate = item.paidAt || item.createdAt
                    ? new Date(item.paidAt || item.createdAt!).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  const installmentLabel = paymentsList.length > 1
                    ? `কিস্তি #${idx + 1} (${item.paymentType === 'admission' ? 'ভর্তি/১ম কিস্তি' : 'বকেয়া পরিশোধ'})`
                    : item.paymentType === 'admission'
                    ? 'ভর্তি ও কোর্স ফি'
                    : 'বকেয়া পরিশোধ / কিস্তি';

                  return (
                    <tr key={item._id || idx}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white print:text-black">
                        <div>{installmentLabel}</div>
                        {itemDate && (
                          <div className="text-[11px] text-slate-400 print:text-slate-600 font-normal mt-0.5">
                            তারিখ: {itemDate} • রিসিট নং: <span className="font-mono">{item.receiptNo}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                          {methodNames[item.paymentMethod] || item.paymentMethod}
                        </span>
                        {item.transactionId && (
                          <div className="font-mono text-[10px] text-slate-500 print:text-black mt-0.5">
                            TrxID: {item.transactionId}
                          </div>
                        )}
                        {item.senderNumber && (
                          <div className="font-mono text-[10px] text-slate-500 print:text-black">
                            Sender: {item.senderNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white print:text-black text-base">
                        ৳{item.amountPaid?.toLocaleString('bn-BD')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            {/* Notes / Document */}
            <div className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 max-w-xs space-y-1">
              {data.notes && (
                <p>
                  <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">মন্তব্য:</span> {data.notes}
                </p>
              )}
              {data.documentUrl && (
                <p className="print:hidden">
                  <a
                    href={data.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" /> প্রমাণপত্র/স্লিপ ফাইল দেখুন
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
            </div>

            {/* Calculations Card */}
            <div className="w-full sm:w-64 space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 print:text-black">
                <span>কোর্সের মোট ফি:</span>
                <span className="font-bold">৳{courseTotalFee.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400 print:text-black border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span>সর্বমোট পরিশোধিত:</span>
                <span>৳{totalPaidAcrossAll.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 print:text-black border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span>অবশিষ্ট বকেয়া (Due):</span>
                <span>৳{finalDueAmount.toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>

          {/* Signature / Footer */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 print:border-slate-400 flex items-end justify-between text-xs text-slate-500 print:text-black">
            <div>
              <p>আদায়কারী: {data.collectedBy?.name || 'অফিস অ্যাডমিন'}</p>
              <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                GravAcademy ERP দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত রিসিট।
              </p>
            </div>

            <div className="text-center w-36">
              <div className="border-b border-slate-400 dark:border-slate-600 mb-1" />
              <p className="font-bold text-[11px]">কর্তৃপক্ষের স্বাক্ষর</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
