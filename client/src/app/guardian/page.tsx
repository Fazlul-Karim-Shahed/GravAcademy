'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDDate } from '@/lib/dateUtils';
import {
  Users,
  FileCheck2,
  BookOpen,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';

interface RecentResult {
  examId: string;
  examTitle: string;
  totalScore: number;
  totalMarks: number;
  passed: boolean;
  isEvaluated: boolean;
}

interface LinkedStudent {
  _id: string;
  name: string;
  userId?: string;
  avatarUrl?: string;
  batches: { batchId: string; batchName: string; courseName: string }[];
  examSummary: {
    totalAttempts: number;
    evaluatedCount: number;
    averageScorePercent: number | null;
    recentResults: RecentResult[];
  };
  paymentSummary: { totalPaid: number };
}

interface PaymentRecord {
  _id: string;
  receiptNo: string;
  amountPaid: number;
  paidAt?: string;
  createdAt: string;
  batchId?: { name?: string };
  paymentMethod: string;
}

export default function GuardianPortalPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [paymentModalStudent, setPaymentModalStudent] = useState<LinkedStudent | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<{ totalPaid: number; totalDue: number } | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/guardian/overview');
      if (res.data?.success) {
        setStudents(res.data.data?.linkedStudents || []);
      } else {
        setError(res.data?.message || 'তথ্য লোড করা যায়নি');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = async (student: LinkedStudent) => {
    setPaymentModalStudent(student);
    setLoadingPayments(true);
    try {
      const res = await api.get('/finance/my-payments', { params: { studentId: student._id } });
      if (res.data?.success) {
        setPayments(res.data.data || []);
        setPaymentSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayments(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Welcome Banner */}
        <div className="rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                অভিভাবক পোর্টাল
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              সন্তানের একাডেমিক অগ্রগতি
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              আপনার সন্তানের পরীক্ষার ফলাফল, ভর্তিকৃত ব্যাচ এবং পেমেন্ট তথ্য এখান থেকে দেখুন।
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 text-slate-400 text-sm font-medium">তথ্য লোড হচ্ছে...</div>
        )}

        {!loading && error && (
          <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && students.length === 0 && (
          <div className="rounded-3xl p-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোনো শিক্ষার্থী লিংক করা নেই</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              আপনার একাউন্টের সাথে এখনো কোনো শিক্ষার্থী সংযুক্ত করা হয়নি। অনুগ্রহ করে একাডেমির অ্যাডমিনের সাথে যোগাযোগ করুন।
            </p>
          </div>
        )}

        {!loading && students.length > 0 && (
          <div className="space-y-8">
            {students.map((student) => (
              <div key={student._id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Student Header */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                      {student.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{student.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        #{student.userId || '—'} •{' '}
                        {student.batches.length > 0
                          ? student.batches.map((b) => b.batchName).join(', ')
                          : 'কোনো ব্যাচে ভর্তি নেই'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">গড় স্কোর</span>
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {student.examSummary.averageScorePercent !== null
                          ? `${student.examSummary.averageScorePercent}%`
                          : '—'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPaymentModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors border border-emerald-200/70 dark:border-emerald-800"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      পেমেন্ট দেখুন
                    </button>
                  </div>
                </div>

                {/* Batches + Recent Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> ভর্তিকৃত ব্যাচ
                    </h4>
                    {student.batches.length === 0 ? (
                      <p className="text-xs text-slate-400">কোনো সক্রিয় ভর্তি নেই</p>
                    ) : (
                      <div className="space-y-2">
                        {student.batches.map((b) => (
                          <div key={b.batchId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                            <div className="font-bold text-slate-900 dark:text-white">{b.batchName}</div>
                            <div className="text-slate-500 dark:text-slate-400">{b.courseName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-500" /> সাম্প্রতিক পরীক্ষার ফলাফল
                    </h4>
                    {student.examSummary.recentResults.length === 0 ? (
                      <p className="text-xs text-slate-400">কোনো পরীক্ষার ফলাফল পাওয়া যায়নি</p>
                    ) : (
                      <div className="space-y-2">
                        {student.examSummary.recentResults.map((r) => (
                          <div
                            key={r.examId}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between"
                          >
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate pr-2">
                              {r.examTitle}
                            </span>
                            {r.isEvaluated ? (
                              <span
                                className={`text-xs font-bold shrink-0 flex items-center gap-1 ${
                                  r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {r.totalScore} / {r.totalMarks}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 uppercase shrink-0">মূল্যায়ন বাকি</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History Modal */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                "{paymentModalStudent.name}" এর পেমেন্ট হিস্ট্রি
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalStudent(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentSummary && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
                  <div className="text-xs text-slate-500">মোট পরিশোধিত</div>
                  <div className="text-base font-bold text-emerald-600">৳{paymentSummary.totalPaid?.toLocaleString('bn-BD')}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-center">
                  <div className="text-xs text-slate-500">মোট বকেয়া</div>
                  <div className="text-base font-bold text-rose-600">৳{paymentSummary.totalDue?.toLocaleString('bn-BD')}</div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingPayments ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">লোড হচ্ছে...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">কোনো পেমেন্ট রেকর্ড নেই</div>
              ) : (
                payments.map((p) => (
                  <div key={p._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.receiptNo}</div>
                      <div className="text-slate-500">{formatBDDate(p.paidAt || p.createdAt)}</div>
                    </div>
                    <div className="font-bold text-emerald-600">৳{p.amountPaid?.toLocaleString('bn-BD')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
