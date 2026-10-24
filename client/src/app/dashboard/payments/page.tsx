'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CreditCard,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { MoneyReceiptModal, PaymentReceiptData } from '@/components/finance/MoneyReceiptModal';

interface StudentFinanceSummary {
  totalPaid: number;
  totalDue: number;
  totalEnrolledBatches: number;
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<PaymentReceiptData[]>([]);
  const [summary, setSummary] = useState<StudentFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);

  useEffect(() => {
    fetchMyPayments();
  }, []);

  const fetchMyPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/my-payments');
      if (res.data?.success) {
        setPayments(res.data.data || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load my payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors shadow-2xs"
            title="ড্যাশবোর্ডে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <CreditCard className="w-6 h-6" />
              </span>
              আমার পেমেন্ট ও মানি রিসিট
            </h1>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              মোট পরিশোধিত
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ৳{summary?.totalPaid?.toLocaleString('bn-BD') || 0}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              {payments.length} টি পেমেন্ট সম্পন্ন
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              অবশিষ্ট বকেয়া (Due)
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ৳{summary?.totalDue?.toLocaleString('bn-BD') || 0}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              ভর্তি থাকা ব্যাচসমূহের মোট
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ভর্তি ব্যাচ সংখ্যা
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {summary?.totalEnrolledBatches || 0} টি
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              বর্তমান সক্রিয় কোর্স
            </span>
          </div>
        </div>

        {/* Receipts & Payments List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              পেমেন্ট হিস্ট্রি ও অফিসিয়াল রিসিট তালিকা
            </h2>
            <button
              onClick={fetchMyPayments}
              className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} /> রিফ্রেশ
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                পেমেন্ট তথ্য লোড হচ্ছে...
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                কোনো পেমেন্টের রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              payments.map((p) => {
                const payDate = p.paidAt
                  ? new Date(p.paidAt).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <div
                    key={p._id}
                    className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60">
                          {p.receiptNo}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {payDate}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                        {p.batchId?.name || 'কোর্স পেমেন্ট'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                          মেথড: {p.paymentMethod === 'bkash' ? 'বিকাশ' : p.paymentMethod === 'bank_transfer' ? 'ব্যাংক' : p.paymentMethod === 'nagad' ? 'নগদ' : 'ক্যাশ'}
                        </span>
                        {p.transactionId && (
                          <span className="font-mono text-[11px]">
                            • TrxID: {p.transactionId}
                          </span>
                        )}
                        {p.notes && (
                          <span className="text-slate-400">• {p.notes}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Print Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 self-start sm:self-center">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          ৳{p.amountPaid?.toLocaleString('bn-BD')}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 block">
                          {p.paymentType === 'admission' ? 'ভর্তি ফি' : 'কিস্তি / বকেয়া'}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveReceipt(p)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        title="মানি রিসিট দেখুন ও প্রিন্ট করুন"
                      >
                        <Printer className="w-4 h-4" />
                        রিসিট ডাউনলোড
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Money Receipt Modal */}
      <MoneyReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        data={activeReceipt}
      />
    </div>
  );
}
