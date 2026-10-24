'use client';

import React, { useEffect, useState, useId } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  DollarSign,
  Search,
  PlusCircle,
  Printer,
  Calendar,
  CreditCard,
  Phone,
  RefreshCw,
  Wallet,
  TrendingUp,
  AlertCircle,
  FileText,
  User,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { MoneyReceiptModal, PaymentReceiptData } from '@/components/finance/MoneyReceiptModal';

interface FinancialStats {
  totalRevenue: number;
  totalTransactions: number;
  totalDue: number;
  todayTotal: number;
  todayCount: number;
  byMethod: {
    cash: number;
    bkash: number;
    nagad: number;
    bank: number;
  };
}

interface StudentOption {
  _id: string;
  name: string;
  userId: string;
  phone?: string;
}

interface BatchOption {
  _id: string;
  name: string;
  fee?: number;
}

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<PaymentReceiptData[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);

  // New Filters: Card click filter & Date Range Filter & Pagination
  const [cardFilterType, setCardFilterType] = useState<'none' | 'total' | 'today' | 'due'>('none');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Collect Payment Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [collectBatchId, setCollectBatchId] = useState('');
  const [collectAmount, setCollectAmount] = useState<number | string>('');
  const [collectMethod, setCollectMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'other'>('cash');
  const [collectTrxId, setCollectTrxId] = useState('');
  const [collectSender, setCollectSender] = useState('');
  const [collectDocUrl, setCollectDocUrl] = useState('');
  const [uploadingCollectDoc, setUploadingCollectDoc] = useState(false);
  const [collectDocSuccess, setCollectDocSuccess] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collectSubmitting, setCollectSubmitting] = useState(false);
  const [collectError, setCollectError] = useState('');

  const handleCollectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setCollectError('ফাইলের সাইজ সর্বোচ্চ ২০ মেগাবাইট হতে পারবে।');
      return;
    }

    setUploadingCollectDoc(true);
    setCollectDocSuccess('');
    setCollectError('');

    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post('/finance/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data?.fileUrl) {
        setCollectDocUrl(res.data.data.fileUrl);
        setCollectDocSuccess(`✅ "${file.name}" সফলভাবে ড্রাইভে আপলোড হয়েছে!`);
      } else {
        setCollectError(res.data?.message || 'ডকুমেন্ট আপলোড করা যায়নি।');
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      setCollectError(err.response?.data?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploadingCollectDoc(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudentsAndBatches();
  }, [selectedMethod, cardFilterType, dateRangePreset, startDate, endDate, currentPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedMethod !== 'all') params.append('paymentMethod', selectedMethod);
      if (cardFilterType !== 'none') params.append('filterType', cardFilterType);

      // Handle Date Presets or Custom Dates
      if (dateRangePreset === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.append('startDate', todayStr);
        params.append('endDate', todayStr);
      } else if (dateRangePreset === 'last_month') {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        params.append('startDate', lastMonth.toISOString().split('T')[0]);
        params.append('endDate', now.toISOString().split('T')[0]);
      } else if (dateRangePreset === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const res = await api.get(`/finance/admin-payments?${params.toString()}`);
      if (res.data?.success) {
        setPayments(res.data.data || []);
        setStats(res.data.summary || null);
        if (res.data.meta) {
          setTotalPages(res.data.meta.totalPages || 1);
          setTotalCount(res.data.meta.totalCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setCardFilterType('none');
    setSelectedMethod('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleCardClick = (type: 'total' | 'today' | 'due') => {
    if (cardFilterType === type) {
      setCardFilterType('none'); // Toggle off if clicked again -> returns to all/reset view
    } else {
      setCardFilterType(type);
      if (type === 'today') {
        setDateRangePreset('today');
      }
    }
    setCurrentPage(1);
  };

  const fetchStudentsAndBatches = async () => {
    try {
      const [userRes, batchRes] = await Promise.all([
        api.get('/users?role=student&limit=200'),
        api.get('/batches'),
      ]);
      if (userRes.data?.success) setStudents(userRes.data.data || []);
      if (batchRes.data?.success) setBatches(batchRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch helper lists:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectError('');

    if (!selectedStudent) {
      setCollectError('অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন');
      return;
    }

    const numAmount = Number(collectAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setCollectError('পরিশোধিত টাকার পরিমাণ সঠিক নয়');
      return;
    }

    setCollectSubmitting(true);
    try {
      const payload = {
        studentId: selectedStudent._id,
        batchId: collectBatchId || undefined,
        amountPaid: numAmount,
        paymentMethod: collectMethod,
        paymentType: 'due_payment',
        transactionId: collectTrxId.trim() || undefined,
        senderNumber: collectSender.trim() || undefined,
        documentUrl: collectDocUrl.trim() || undefined,
        notes: collectNotes.trim() || undefined,
      };

      const res = await api.post('/finance/collect-payment', payload);
      if (res.data?.success) {
        setIsCollectModalOpen(false);
        // Reset form
        setSelectedStudent(null);
        setCollectBatchId('');
        setCollectAmount('');
        setCollectTrxId('');
        setCollectSender('');
        setCollectDocUrl('');
        setCollectNotes('');

        // Reload payments and open receipt
        fetchPayments();
        if (res.data.data) {
          setActiveReceipt(res.data.data);
        }
      } else {
        setCollectError(res.data?.message || 'পেমেন্ট গ্রহণ সম্পন্ন হয়নি');
      }
    } catch (err: any) {
      setCollectError(err.response?.data?.message || err.message || 'পেমেন্ট জমা করতে ত্রুটি ঘটেছে');
    } finally {
      setCollectSubmitting(false);
    }
  };

  const filteredStudentsForSelect = studentSearch.trim()
    ? students.filter(
        (s) =>
          s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.userId?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.phone && s.phone.includes(studentSearch))
      )
    : students.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors shadow-2xs"
              title="ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </span>
                ফাইন্যান্স ম্যানেজমেন্ট (Finance Management)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCollectModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              নতুন পেমেন্ট / বকেয়া গ্রহণ
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Cards (Clickable Filters) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Revenue (Total Filter) */}
          <div
            onClick={() => handleCardClick('total')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
              cardFilterType === 'total'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  সর্বমোট কালেকশন
                </span>
                {cardFilterType === 'total' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ৳{stats?.totalRevenue?.toLocaleString('bn-BD') || 0}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
                {stats?.totalTransactions || 0} টি সম্পন্ন লেনদেন {cardFilterType === 'total' ? '• ফিল্টার সক্রিয়' : '• ক্লিক করুন'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-100 dark:border-emerald-800/60 shrink-0">
              ৳
            </div>
          </div>

          {/* Card 2: Today's Collection (Clickable Filter) */}
          <div
            onClick={() => handleCardClick('today')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
              cardFilterType === 'today'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  আজকের আদায়
                </span>
                {cardFilterType === 'today' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ৳{stats?.todayTotal?.toLocaleString('bn-BD') || 0}
              </div>
              <span className="text-[11px] text-blue-600/80 dark:text-blue-400 font-semibold mt-1 inline-block">
                আজ {stats?.todayCount || 0} টি রিসিট {cardFilterType === 'today' ? '• ফিল্টার সক্রিয়' : '• ক্লিক করুন'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Due (Clickable Filter) */}
          <div
            onClick={() => handleCardClick('due')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
              cardFilterType === 'due'
                ? 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  মোট বকেয়া (Due)
                </span>
                {cardFilterType === 'due' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                ৳{stats?.totalDue?.toLocaleString('bn-BD') || 0}
              </div>
              <span className="text-[11px] text-rose-500 font-semibold mt-1 inline-block">
                {cardFilterType === 'due' ? 'বকেয়া থাকা পেমেন্ট ফিল্টার সক্রিয়' : 'বকেয়া তালিকা দেখতে ক্লিক করুন'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800/60 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Method Breakdown */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              মাধ্যমভিত্তিক আদায়
            </span>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">ক্যাশ</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  ৳{stats?.byMethod?.cash ? stats.byMethod.cash.toLocaleString('bn-BD') : 0}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300">
                <span className="text-[10px] text-pink-500 block font-bold">বিকাশ</span>
                <span className="font-extrabold">
                  ৳{stats?.byMethod?.bkash ? stats.byMethod.bkash.toLocaleString('bn-BD') : 0}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                <span className="text-[10px] text-indigo-500 block font-bold">ব্যাংক</span>
                <span className="font-extrabold">
                  ৳{stats?.byMethod?.bank ? stats.byMethod.bank.toLocaleString('bn-BD') : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter & Control Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="রিসিট নং, শিক্ষার্থী, আইডি বা TrxID..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            {/* Date Presets (All / Today / Last Month / Custom Date) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> সময়কাল:
              </span>
              {[
                { id: 'all', label: 'সব সময়' },
                { id: 'today', label: 'আজকের' },
                { id: 'last_month', label: 'গত ১ মাস' },
                { id: 'custom', label: 'নির্দিষ্ট তারিখ' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDateRangePreset(d.id as any);
                    if (d.id === 'all') {
                      setStartDate('');
                      setEndDate('');
                    }
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateRangePreset === d.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}

              {(cardFilterType !== 'none' || dateRangePreset !== 'all' || selectedMethod !== 'all' || search) && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors ml-1 cursor-pointer"
                  title="ফিল্টার রিসেট করুন"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ফিল্টার রিসেট
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Pickers (Shown when 'custom' is selected) */}
          {dateRangePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-500">তারিখ নির্বাচন:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">হতে</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">পর্যন্ত</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Payment Method Pills */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> মাধ্যম:
              </span>
              {[
                { id: 'all', label: 'সকল' },
                { id: 'cash', label: '💵 ক্যাশ' },
                { id: 'bkash', label: '📱 বিকাশ' },
                { id: 'nagad', label: '📱 নগদ' },
                { id: 'bank_transfer', label: '🏦 ব্যাংক' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedMethod === m.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchPayments}
              className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transactions & Receipts Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">রিসিট নং ও তারিখ</th>
                  <th className="py-4 px-6">শিক্ষার্থী</th>
                  <th className="py-4 px-6">ব্যাচ ও কোর্স</th>
                  <th className="py-4 px-6">পেমেন্ট মাধ্যম ও TrxID</th>
                  <th className="py-4 px-6 text-right">আদায়ের পরিমাণ</th>
                  <th className="py-4 px-6 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      পেমেন্ট ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                      কোনো লেনদেনের তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const payDate = p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Receipt No & Date */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 select-all block">
                            {p.receiptNo}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {payDate}
                          </span>
                        </td>

                        {/* Student */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {p.studentId?.name || 'অজ্ঞাত'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="font-mono text-slate-500 dark:text-slate-300">
                              #{p.studentId?.userId || 'N/A'}
                            </span>
                            {p.studentId?.phone && <span>• {p.studentId.phone}</span>}
                          </div>
                        </td>

                        {/* Batch & Course */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.batchId?.name || '—'}
                          </div>
                          {p.courseId?.title && (
                            <span className="text-xs text-slate-400 truncate block max-w-xs">
                              {p.courseId.title}
                            </span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {p.paymentMethod === 'bkash' ? '📱 বিকাশ' : p.paymentMethod === 'bank_transfer' ? '🏦 ব্যাংক' : p.paymentMethod === 'nagad' ? '📱 নগদ' : '💵 ক্যাশ'}
                          </span>
                          {p.transactionId && (
                            <span className="block font-mono text-[11px] text-slate-400 mt-1">
                              Trx: {p.transactionId}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-6 text-right">
                          <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ৳{p.amountPaid?.toLocaleString('bn-BD')}
                          </div>
                          {p.dueAmount !== undefined && p.dueAmount > 0 && (
                            <span className="text-[11px] font-bold text-rose-500 block">
                              বকেয়া: ৳{p.dueAmount.toLocaleString('bn-BD')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {p.dueAmount !== undefined && p.dueAmount > 0 && (
                              <button
                                onClick={() => {
                                  if (p.studentId) {
                                    setSelectedStudent({
                                      _id: p.studentId._id || (p.studentId as any),
                                      name: p.studentId.name,
                                      userId: p.studentId.userId,
                                      phone: p.studentId.phone,
                                    });
                                  }
                                  if (p.batchId) {
                                    setCollectBatchId(p.batchId._id || (p.batchId as any));
                                  }
                                  setCollectAmount(p.dueAmount || 0);
                                  setIsCollectModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                                title="বকেয়া কিস্তি গ্রহণ করুন"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> বকেয়া জমা
                              </button>
                            )}

                            {p.amountPaid > 0 && (
                              <button
                                onClick={() => setActiveReceipt(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
                                title="মানি রিসিট দেখুন ও প্রিন্ট করুন"
                              >
                                <Printer className="w-3.5 h-3.5" /> রিসিট
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              সর্বমোট <strong className="text-slate-900 dark:text-white">{totalCount}</strong> টি রেকর্ডের মধ্যে{' '}
              পৃষ্ঠা <strong className="text-blue-600 dark:text-blue-400">{currentPage}</strong> / {totalPages || 1}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> পূর্ববর্তী
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                পরবর্তী <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Collect Due Payment Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-500" />
              পেমেন্ট / বকেয়া কিস্তি গ্রহণ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              শিক্ষার্থীর বকেয়া বা নতুন পেমেন্ট ম্যানুয়ালি এন্ট্রি করুন এবং রিসিট তৈরি করুন।
            </p>

            {collectError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-600 text-xs font-semibold">
                {collectError}
              </div>
            )}

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  শিক্ষার্থী নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-xs">
                    <div>
                      <span className="font-extrabold text-blue-700 dark:text-blue-300">
                        {selectedStudent.name}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 ml-2">
                        #{selectedStudent.userId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-rose-500 hover:underline font-bold"
                    >
                      পরিবর্তন
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="নাম, ফোন বা আইডি লিখে খুঁজুন..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      {filteredStudentsForSelect.length === 0 ? (
                        <div className="text-xs text-slate-400 p-2 text-center">
                          কোনো শিক্ষার্থী পাওয়া যায়নি
                        </div>
                      ) : (
                        filteredStudentsForSelect.map((s) => (
                          <div
                            key={s._id}
                            onClick={() => setSelectedStudent(s)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-slate-900 dark:text-white">
                              {s.name}
                            </span>
                            <span className="font-mono text-slate-400">#{s.userId}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ব্যাচ নির্বাচন (যদি কোনো নির্দিষ্ট ব্যাচের ফি হয়)
                </label>
                <select
                  value={collectBatchId}
                  onChange={(e) => setCollectBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- ব্যাচ নির্বাচন করুন (ঐচ্ছিক) --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.fee ? `(ফি: ৳${b.fee})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    পরিশোধিত টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="টাকার পরিমাণ লিখুন"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">💵 সরাসরি ক্যাশ (Cash)</option>
                    <option value="bkash">📱 পার্সোনাল বিকাশ (bKash)</option>
                    <option value="nagad">📱 নগদ (Nagad)</option>
                    <option value="rocket">📱 রকেট (Rocket)</option>
                    <option value="bank_transfer">🏦 ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="other">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              {/* TrxID & Sender Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    TrxID / রেফারেন্স নং (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={collectTrxId}
                    onChange={(e) => setCollectTrxId(e.target.value)}
                    placeholder="যেমন: 8X7A... বা রিসিট নং"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    প্রেরকের ফোন বা ব্যাংক হিসাব নং (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={collectSender}
                    onChange={(e) => setCollectSender(e.target.value)}
                    placeholder="যেমন: 01712..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Document / Slip URL & Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ডকুমেন্ট বা স্লিপ ফাইল (ঐচ্ছিক)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    সরাসরি ফাইল আপলোড অথবা লিংক
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="url"
                    value={collectDocUrl}
                    onChange={(e) => setCollectDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />

                  <label
                    className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      uploadingCollectDoc
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleCollectFileUpload}
                      disabled={uploadingCollectDoc}
                      className="hidden"
                    />
                    {uploadingCollectDoc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        আপলোড হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        ডিভাইস থেকে ফাইল
                      </>
                    )}
                  </label>
                </div>

                {collectDocSuccess && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                    {collectDocSuccess}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মন্তব্য
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="যেমন: ২য় কিস্তি আদায়..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={collectSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all disabled:opacity-60 cursor-pointer"
                >
                  {collectSubmitting ? 'পেমেন্ট জমা হচ্ছে...' : 'পেমেন্ট নিশ্চিত করুন ও রিসিট দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Money Receipt View Modal */}
      <MoneyReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        data={activeReceipt}
      />
    </div>
  );
}
