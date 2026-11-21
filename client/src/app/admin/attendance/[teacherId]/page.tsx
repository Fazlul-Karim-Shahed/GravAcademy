'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatBDDate } from '@/lib/dateUtils';
import { UserAvatar } from '@/components/common/UserAvatar';
import TeacherPaymentReceiptModal from '@/components/attendance/TeacherPaymentReceiptModal';
import {
  ArrowLeft,
  ArrowLeft as PreviousMonth,
  ArrowRight as NextMonth,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Banknote,
  Filter,
  LoaderCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

interface BatchOption { _id: string; name: string; courseId: string; courseName: string }
interface AttendanceRow {
  classKey: string;
  _id?: string;
  attendanceDate?: string;
  markedAt?: string;
  source?: string;
  status?: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  attendance?: { status: string; markedAt: string; source: string } | null;
  payment?: { paymentId: string; receiptNo: string; amount: number; paidAt: string } | null;
  markedBy?: { name?: string; gravId?: string };
}
interface TeacherAttendanceView {
  success: boolean;
  teacher: { _id: string; name: string; gravId?: string; email?: string; avatarUrl?: string };
  mode: 'month' | 'range' | 'schedule';
  scheduledDates: string[];
  courses: Array<{ _id: string; title: string }>;
  batches: BatchOption[];
  data: AttendanceRow[];
}
interface PaymentHistoryRow {
  _id: string;
  receiptNo: string;
  amountPaid: number;
  paidAt: string;
  voidedAt?: string;
  voidReason?: string;
  classes: Array<{ classDate: string }>;
}

const DAY_LABELS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
const formatTime = (date?: string) => date ? new Date(date).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' }) : '';
const todayInDhaka = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

export default function TeacherAttendanceDetailPage() {
  const params = useParams();
  const teacherId = String(params?.teacherId || '');
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.ATTENDANCE_MANAGE);
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [selectedDate, setSelectedDate] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState<TeacherAttendanceView | null>(null);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingBatch, setMarkingBatch] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [paymentRows, setPaymentRows] = useState<AttendanceRow[]>([]);
  const [paymentMode, setPaymentMode] = useState<'single' | 'bulk' | null>(null);
  const [paymentRates, setPaymentRates] = useState<Record<string, string>>({});
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [paymentAction, setPaymentAction] = useState<{ type: 'edit' | 'void'; payment: PaymentHistoryRow } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [classToUndo, setClassToUndo] = useState<AttendanceRow | null>(null);
  const [undoReason, setUndoReason] = useState('');
  const [undoingPayment, setUndoingPayment] = useState(false);
  useEffect(() => {
    setShowAllClasses(false);
  }, [month, selectedDate, startDate, endDate, courseId, batchId]);
  const dateError = (startDate && !endDate) || (!startDate && endDate)
    ? 'শুরুর ও শেষের তারিখ দুটোই দিন।'
    : startDate && endDate && startDate > endDate ? 'শুরুর তারিখ শেষের তারিখের পরে হতে পারে না।' : '';

  const loadAttendance = useCallback(async (silent = false) => {
    if (!teacherId) return;
    if (dateError && !selectedDate) {
      setLoading(false);
      setError('');
      return;
    }
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await api.get(`/teacher-attendance/teachers/${teacherId}`, {
        params: {
          month,
          ...(selectedDate ? { date: selectedDate } : {}),
          ...(!selectedDate && (startDate || endDate) ? { startDate, endDate } : {}),
          ...(courseId !== 'all' ? { courseId } : {}),
          ...(batchId !== 'all' ? { batchId } : {}),
        },
      });
      setView(response.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Attendance তথ্য লোড হয়নি।');
    } finally {
      setLoading(false);
    }
  }, [teacherId, month, selectedDate, startDate, endDate, courseId, batchId, dateError]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const loadPaymentHistory = useCallback(async () => {
    if (!teacherId) return;
    try {
      const response = await api.get(`/teacher-attendance/teachers/${teacherId}/payments`, { params: { page: historyPage } });
      setPaymentHistory(response.data.data || []);
      setHistoryTotalPages(Math.max(1, response.data.pagination?.totalPages || 1));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Payment history লোড হয়নি।');
    }
  }, [teacherId, historyPage]);

  useEffect(() => { void loadPaymentHistory(); }, [loadPaymentHistory]);

  const batchesForCourse = useMemo(() =>
    courseId === 'all' ? view?.batches || [] : (view?.batches || []).filter((batch) => batch.courseId === courseId),
  [view?.batches, courseId]);

  const changeCourse = (value: string) => {
    setCourseId(value);
    setBatchId('all');
  };

  const moveMonth = (amount: number) => {
    const [year, monthNumber] = month.split('-').map(Number);
    setSelectedDate('');
    setMonth(toMonthKey(new Date(year, monthNumber - 1 + amount, 1)));
  };

  const markPresent = async (row: AttendanceRow) => {
    setMarkingBatch(row.batchId);
    setNotice('');
    setError('');
    try {
      const response = await api.post('/teacher-attendance/mark', {
        teacherId,
        batchId: row.batchId,
        date: row.attendanceDate,
        source: 'manual',
      });
      setNotice(response.data.message || 'উপস্থিতি নেওয়া হয়েছে।');
      await loadAttendance(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Attendance mark করা যায়নি।');
    } finally {
      setMarkingBatch(null);
    }
  };

  const markAbsent = async (row: AttendanceRow) => {
    setMarkingBatch(row.batchId);
    setNotice('');
    setError('');
    try {
      const response = await api.post('/teacher-attendance/mark-absent', {
        teacherId, batchId: row.batchId, date: row.attendanceDate,
      });
      setNotice(response.data.message || 'Attendance Absent করা হয়েছে।');
      await loadAttendance(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Attendance সংশোধন করা যায়নি।');
    } finally {
      setMarkingBatch(null);
    }
  };

  const today = todayInDhaka();
  const bulkRows = dateError ? [] : (view?.data || []).filter((row) =>
    !row.payment && row.attendance?.status === 'present' && (row.attendanceDate || '') <= today);
  const paymentCourses = Array.from(new Map(paymentRows.map((row) => [row.courseId, {
    id: row.courseId,
    name: row.courseName,
    count: paymentRows.filter((item) => item.courseId === row.courseId).length,
  }])).values());
  const calculatedAmount = paymentCourses.reduce((sum, course) => sum + course.count * Number(paymentRates[course.id] || 0), 0);

  const openBulkPayment = () => {
    setPaymentMode('bulk');
    setPaymentRows(bulkRows);
    setPaymentRates(Object.fromEntries(Array.from(new Set(bulkRows.map((row) => row.courseId))).map((id) => [id, '0'])));
    setPaymentAmount('');
    setPaymentNotes('');
    setError('');
  };

  const openIndividualPayment = (row: AttendanceRow) => {
    setPaymentMode('single');
    setPaymentRows([row]);
    setPaymentRates({ [row.courseId]: '0' });
    setPaymentAmount('');
    setPaymentNotes('');
    setError('');
  };

  const savePayment = async () => {
    if (!paymentRows.length) return;
    const amount = paymentMode === 'bulk' && paymentAmount === '' ? calculatedAmount : Number(paymentAmount);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      setError('Payment amount ১ টাকা বা তার বেশি পূর্ণসংখ্যা দিন।');
      return;
    }
    setSavingPayment(true);
    setError('');
    try {
      const response = await api.post('/teacher-attendance/payments', {
        teacherId,
        bulk: paymentMode === 'bulk',
        classes: paymentRows.map((row) => ({ classKey: row.classKey, batchId: row.batchId, date: row.attendanceDate, startTime: row.startTime, endTime: row.endTime, topic: row.topic })),
        rates: Object.entries(paymentRates).map(([courseId, value]) => ({ courseId, rate: Number(value || 0) })),
        amountPaid: amount,
        notes: paymentNotes,
      });
      setReceiptData(response.data.data);
      setPaymentRows([]);
      setNotice(response.data.message || 'Payment তৈরি হয়েছে।');
      await loadAttendance(true);
      await loadPaymentHistory();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Teacher payment তৈরি করা যায়নি।');
    } finally {
      setSavingPayment(false);
    }
  };

  const openReceipt = async (paymentId: string) => {
    try {
      const response = await api.get(`/teacher-attendance/payments/${paymentId}`);
      setReceiptData(response.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Receipt খোলা যায়নি।');
    }
  };

  const savePaymentAction = async () => {
    if (!paymentAction) return;
    const reason = actionReason.trim();
    const amount = Number(actionAmount);
    if (reason.length < 3 || (paymentAction.type === 'edit' && (!Number.isSafeInteger(amount) || amount < 1))) {
      setError('সঠিক amount ও কমপক্ষে ৩ অক্ষরের কারণ দিন।');
      return;
    }
    setActionSaving(true);
    setError('');
    try {
      const id = paymentAction.payment._id;
      const response = paymentAction.type === 'edit'
        ? await api.patch(`/teacher-attendance/payments/${id}`, { amountPaid: amount, expectedAmountPaid: paymentAction.payment.amountPaid, reason })
        : await api.post(`/teacher-attendance/payments/${id}/void`, { reason });
      setNotice(response.data.message);
      setPaymentAction(null);
      setReceiptData(null);
      await Promise.all([loadAttendance(true), loadPaymentHistory()]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Payment পরিবর্তন করা যায়নি।');
    } finally {
      setActionSaving(false);
    }
  };

  const executeUndoPayment = async () => {
    if (!classToUndo?.payment) return;
    setUndoingPayment(true);
    setError('');
    try {
      const response = await api.post(`/teacher-attendance/payments/${classToUndo.payment.paymentId}/undo-class`, {
        classKey: classToUndo.classKey,
        reason: undoReason.trim() || 'Class payment undone by admin',
      });
      setNotice(response.data.message || 'পেমেন্ট সফলভাবে আন্ডু করা হয়েছে।');
      setClassToUndo(null);
      setUndoReason('');
      await Promise.all([loadAttendance(true), loadPaymentHistory()]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'পেমেন্ট আন্ডু করা যায়নি।');
    } finally {
      setUndoingPayment(false);
    }
  };

  const [yearValue, monthValue] = month.split('-').map(Number);
  const monthDate = new Date(yearValue, monthValue - 1, 1);
  const monthTitle = monthDate.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(yearValue, monthValue, 0).getDate();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: monthDate.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const scheduledDates = new Set(view?.scheduledDates || []);

  if (!canManage) return <main className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] px-4 py-12 text-center text-slate-600 dark:text-slate-400">এই পেজ দেখার permission নেই।</main>;

  return (
    <main className="ga-page min-h-screen py-6 text-slate-900 dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-[#262b34] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name={view?.teacher?.name || 'Teacher'} avatarUrl={view?.teacher?.avatarUrl} role="teacher" size="xl" />
            <div className="min-w-0">
              <p className="mb-0.5 text-sm font-semibold text-orange-600 dark:text-orange-400">Attendance & Payment</p>
              <h1 className="truncate text-xl font-bold sm:text-2xl">{view?.teacher?.name || (loading ? 'লোড হচ্ছে' : 'Teacher')}</h1>
              {view?.teacher?.gravId && <p className="mt-1 text-xs text-slate-500">Grav ID: {view.teacher.gravId}</p>}
            </div>
          </div>
          <Link href="/admin/attendance" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-200 dark:hover:border-orange-500/40 sm:self-auto">
            <ArrowLeft className="h-4 w-4" /> ফিরে যান
          </Link>
        </header>

        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</div>}
        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

        <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262b34] dark:bg-[#111318] sm:p-5" aria-label="Attendance calendar">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-orange-500" /><h2 className="font-bold">{monthTitle}</h2></div>
              <div className="flex gap-1">
                <button aria-label="আগের মাস" onClick={() => moveMonth(-1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#151921]"><PreviousMonth className="h-4 w-4" /></button>
                <button aria-label="পরের মাস" onClick={() => moveMonth(1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#151921]"><NextMonth className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_LABELS.map((day) => <div key={day} className="py-2 text-xs font-semibold text-slate-500">{day}</div>)}
              {calendarCells.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} />;
                const value = `${month}-${String(day).padStart(2, '0')}`;
                const isFutureDate = value > today;
                const isScheduled = scheduledDates.has(value);
                const selected = selectedDate === value;
                const isToday = todayInDhaka() === value;
                return (
                  <button key={value} disabled={isFutureDate} onClick={() => { setStartDate(''); setEndDate(''); setSelectedDate(selected ? '' : value); }} aria-pressed={selected} className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm transition disabled:cursor-not-allowed disabled:text-slate-300 dark:disabled:text-slate-700 sm:h-11 sm:w-11 ${selected ? 'bg-gradient-to-r from-orange-600 to-orange-700 font-bold text-white shadow-sm' : isScheduled && !isFutureDate ? 'bg-orange-50 font-semibold text-orange-800 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/50' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#151921]'} ${isToday && !selected ? 'ring-1 ring-orange-500' : ''}`}>
                    {day}{isScheduled && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-orange-600 dark:bg-orange-400" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />Class schedule</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262b34] dark:bg-[#111318] sm:p-5" aria-label="Attendance filters">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Filter className="h-4 w-4 text-slate-500" />সময় ও batch</h2>
              <button onClick={() => loadAttendance()} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#151921]"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Course</span>
                <span className="relative block"><select value={courseId} onChange={(event) => changeCourse(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-orange-400 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200"><option value="all">সব course</option>{(view?.courses || []).map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Batch</span>
                <span className="relative block"><select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-orange-400 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200"><option value="all">সব batch</option>{batchesForCourse.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setSelectedDate(''); setStartDate(''); setEndDate(''); setMonth(toMonthKey(new Date())); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">এই মাস</button>
              <button type="button" onClick={() => { const previous = new Date(); previous.setMonth(previous.getMonth() - 1); setSelectedDate(''); setStartDate(''); setEndDate(''); setMonth(toMonthKey(previous)); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">আগের মাস</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-500">শুরুর তারিখ</span><input type="date" value={startDate} onChange={(event) => { setSelectedDate(''); setStartDate(event.target.value); }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-500">শেষের তারিখ</span><input type="date" value={endDate} onChange={(event) => { setSelectedDate(''); setEndDate(event.target.value); }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200" /></label>
            </div>
            {dateError && <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">{dateError}</p>}
            <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600 dark:bg-[#151921] dark:text-slate-300">
              {selectedDate ? <span>নির্বাচিত দিন: <strong className="text-slate-900 dark:text-white">{formatDate(selectedDate)}</strong></span> : startDate && endDate ? <span>নির্বাচিত সময়: <strong className="text-slate-900 dark:text-white">{formatDate(startDate)} – {formatDate(endDate)}</strong></span> : <span>চলতি মাসের সব scheduled class</span>}
            </div>
          </section>
        </div>

        <section aria-live="polite">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">{selectedDate ? formatDate(selectedDate) : startDate && endDate ? 'নির্বাচিত সময়ের ক্লাস' : monthTitle}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">তারিখ অনুযায়ী নতুন class আগে</p>
            </div>
            <button type="button" disabled={!bulkRows.length || loading} onClick={openBulkPayment} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 text-sm font-bold text-white shadow-md shadow-orange-950/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"><Banknote className="h-4 w-4" />Bulk Payment <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{bulkRows.length}</span></button>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-[#262b34] dark:bg-[#111318]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে</div>
          ) : dateError ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300">{dateError}</div>
          ) : !view?.data?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-[#262b34] dark:bg-[#111318]">
              <CalendarDays className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">{selectedDate ? 'এই তারিখে কোনো scheduled class নেই' : 'এই সময়ে কোনো scheduled class নেই'}</p>
              <p className="mt-1 text-sm text-slate-500">অন্য দিন বা date range বেছে নিন।</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {view.data.slice(0, showAllClasses ? undefined : 10).map((row, index) => {
                const isPresent = row.attendance?.status === 'present';
                const isFuture = Boolean((row.attendanceDate || '') > todayInDhaka());
                const isAbsent = !isPresent && !isFuture;
                return (
                  <article
                    key={row.classKey || `${row.batchId}-${row.attendanceDate}-${row.startTime || index}`}
                    className={`flex flex-col gap-3 rounded-2xl p-4 shadow-sm transition sm:flex-row sm:items-center ${
                      isAbsent
                        ? 'border border-rose-200/80 bg-rose-50/[0.15] dark:border-rose-900/40 dark:bg-rose-950/[0.08]'
                        : 'border border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318]'
                    }`}
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isPresent ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : isAbsent ? 'bg-rose-50/60 text-rose-600/80 dark:bg-rose-950/30 dark:text-rose-400/80' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'}`}>
                      {isPresent ? <CheckCircle2 className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-bold">{row.courseName}</h3><span className="text-slate-300">·</span><span className="text-sm text-slate-600 dark:text-slate-300">{row.batchName}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{row.attendanceDate ? formatDate(row.attendanceDate) : ''}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{row.startTime}{row.endTime ? ` – ${row.endTime}` : ''}</span>
                        {isPresent && row.attendance?.markedAt && <span>হাজিরা: {formatTime(row.attendance.markedAt)}</span>}
                        {row.topic && <span>{row.topic}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {isPresent ? (
                        <button
                          type="button"
                          disabled={Boolean(row.payment) || markingBatch === row.batchId}
                          title={row.payment ? 'আগে payment Void করুন' : 'ভুল হাজিরা সংশোধন করুন'}
                          onClick={() => markAbsent(row)}
                          className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                        >
                          Absent করুন
                        </button>
                      ) : (
                        <button
                          disabled={isFuture || markingBatch === row.batchId}
                          onClick={() => markPresent(row)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {markingBatch === row.batchId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                          {isFuture ? 'Future' : 'Mark as Present'}
                        </button>
                      )}
                      {row.payment ? (
                        <>
                          {!isPresent && (
                            <span role="alert" className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                              Payment আছে, হাজিরা নেই
                            </span>
                          )}
                          <span className="inline-flex min-h-10 items-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-600 dark:bg-[#151921] dark:text-slate-300">
                            Paid
                          </span>
                          <button
                            type="button"
                            onClick={() => openReceipt(row.payment!.paymentId)}
                            className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-200 dark:hover:bg-[#151921]"
                          >
                            Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setClassToUndo(row);
                              setUndoReason('');
                              setError('');
                            }}
                            className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                            title="এই ক্লাসের পেমেন্ট আন্ডু করুন"
                          >
                            পেমেন্ট আন্ডু
                          </button>
                        </>
                      ) : isPresent ? (
                        <button
                          type="button"
                          disabled={isFuture}
                          onClick={() => openIndividualPayment(row)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300"
                        >
                          <Banknote className="h-4 w-4" />Make Payment
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {view.data.length > 10 && !showAllClasses && (
                <button
                  type="button"
                  onClick={() => setShowAllClasses(true)}
                  className="mx-auto mt-4 block min-h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-50 dark:border-[#262b34] dark:bg-[#111318] dark:text-orange-400 dark:hover:bg-[#151921]"
                >
                  Show all ({view.data.length})
                </button>
              )}
            </div>
          )}
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#262b34] dark:bg-[#111318] sm:p-5">
          <h2 className="mb-4 text-lg font-bold">Payment History</h2>
          {paymentHistory.length === 0 ? <p className="text-sm text-slate-500">এখনো কোনো payment নেই।</p> : <div className="divide-y divide-slate-100 dark:divide-[#262b34]">
            {paymentHistory.map((payment) => <div key={payment._id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">{payment.receiptNo} <span className="ml-2 text-sm text-slate-500">৳{payment.amountPaid.toLocaleString('bn-BD')}</span></p><p className="mt-1 text-xs text-slate-500">{payment.classes.length}টি class · {formatBDDate(payment.paidAt, { day: 'numeric', month: 'short', year: 'numeric' })}{payment.voidedAt ? ' · বাতিল' : ''}</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openReceipt(payment._id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">Receipt</button>{!payment.voidedAt && <><button type="button" onClick={() => { setPaymentAction({ type: 'edit', payment }); setActionAmount(String(payment.amountPaid)); setActionReason(''); setError(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-[#262b34] dark:text-slate-300 dark:hover:bg-[#151921]">Edit</button><button type="button" onClick={() => { setPaymentAction({ type: 'void', payment }); setActionReason(''); setError(''); }} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:text-rose-300">Void</button></>}</div>
            </div>)}
          </div>}
          <div className="mt-4 flex items-center justify-end gap-3 text-xs text-slate-500"><button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-[#262b34]">Previous</button><span>{historyPage} / {historyTotalPages}</span><button type="button" disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-[#262b34]">Next</button></div>
        </section>
      </div>
      {paymentAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-action-title"><section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 dark:border-[#262b34] dark:bg-[#111318] sm:p-6"><h2 id="payment-action-title" className="text-lg font-bold">{paymentAction.type === 'edit' ? 'Edit Payment' : 'Void Payment'}</h2><p className="mt-1 text-sm text-slate-500">{paymentAction.payment.receiptNo} · {paymentAction.payment.classes.length}টি class</p>{paymentAction.type === 'edit' ? <label className="mt-4 block text-sm font-semibold">Final amount (৳)<input type="number" min="1" step="1" value={actionAmount} onChange={(event) => setActionAmount(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-[#262b34] dark:bg-[#151921]" /></label> : <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">এই receipt-এর সব class আবার unpaid হবে এবং Finance expense থেকে টাকা বাদ যাবে।</p>}<label className="mt-4 block text-sm font-semibold">কারণ<input value={actionReason} onChange={(event) => setActionReason(event.target.value)} maxLength={300} placeholder="কেন পরিবর্তন করছেন" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-[#262b34] dark:bg-[#151921]" /></label>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setPaymentAction(null); setError(''); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-[#262b34] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#151921]">Cancel</button><button type="button" disabled={actionSaving} onClick={() => void savePaymentAction()} className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{paymentAction.type === 'edit' ? 'Save' : 'Void'}</button></div></section></div>}
      {paymentRows.length > 0 && paymentMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="teacher-payment-title">
          <section className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="teacher-payment-title" className="text-lg font-bold">{paymentMode === 'bulk' ? 'Bulk Payment' : 'Class Payment'}</h2><p className="mt-1 text-sm text-slate-500">{paymentRows.length}টি class · {view?.teacher?.name}</p></div>
              <button type="button" onClick={() => { setPaymentRows([]); setPaymentMode(null); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#151921]">বন্ধ করুন</button>
            </div>
            {paymentMode === 'bulk' ? (
              <div className="mt-5 space-y-3">
                {paymentCourses.map((course) => <div key={course.id} className="grid grid-cols-[minmax(0,1fr)_100px_70px] items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-[#262b34] sm:grid-cols-[minmax(0,1fr)_130px_100px]"><div className="min-w-0"><p className="truncate text-sm font-semibold">{course.name}</p><p className="text-xs text-slate-500">{course.count}টি class</p></div><label className="text-xs text-slate-500">প্রতি class<input type="number" min="0" step="1" value={paymentRates[course.id] ?? '0'} onChange={(event) => { setPaymentRates((current) => ({ ...current, [course.id]: event.target.value })); setPaymentAmount(''); }} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 dark:border-[#262b34] dark:bg-[#151921] dark:text-white" /></label><div className="text-right"><p className="text-[11px] text-slate-500">মোট</p><p className="text-sm font-bold">৳{(course.count * Number(paymentRates[course.id] || 0)).toLocaleString('bn-BD')}</p></div></div>)}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-[#151921]"><span>রেফারেন্স মোট</span><strong>৳{calculatedAmount.toLocaleString('bn-BD')}</strong></div>
              </div>
            ) : <div className="mt-5 rounded-xl border border-slate-200 p-3 text-sm dark:border-[#262b34]"><p className="font-semibold">{paymentRows[0].courseName} · {paymentRows[0].batchName}</p><p className="mt-1 text-xs text-slate-500">{formatDate(paymentRows[0].attendanceDate || '')} · {paymentRows[0].startTime}{paymentRows[0].endTime ? ` – ${paymentRows[0].endTime}` : ''}</p></div>}
            <label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">{paymentMode === 'bulk' ? 'চূড়ান্ত payment amount' : 'Payment amount'} (৳)</span><input type="number" min="1" step="1" value={paymentMode === 'bulk' && paymentAmount === '' ? calculatedAmount || '' : paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-lg font-bold text-slate-900 outline-none focus:border-orange-400 dark:border-[#262b34] dark:bg-[#151921] dark:text-white" placeholder="টাকার পরিমাণ" /></label>
            {paymentMode === 'bulk' && <p className="mt-1.5 text-xs text-slate-500">ফাইন্যান্সে চূড়ান্ত টাকার পরিমাণই যোগ হবে।</p>}
            <label className="mt-3 block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">নোট (ঐচ্ছিক)</span><input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} maxLength={500} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#262b34] dark:bg-[#151921]" placeholder="Payment note" /></label>
            {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setPaymentRows([]); setPaymentMode(null); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 dark:border-[#262b34] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#151921]">Cancel</button><button type="button" disabled={savingPayment} onClick={savePayment} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-5 text-sm font-bold text-white shadow-md shadow-orange-950/20 disabled:opacity-60">{savingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}Make Payment</button></div>
          </section>
        </div>
      )}
      {classToUndo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="undo-payment-title">
          <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
            <h2 id="undo-payment-title" className="text-lg font-bold text-rose-600 dark:text-rose-400">পেমেন্ট আন্ডু নিশ্চিতকরণ</h2>
            <div className="mt-3 rounded-xl bg-rose-50/60 p-3.5 text-sm text-slate-700 dark:bg-rose-950/30 dark:text-slate-200 border border-rose-200/50 dark:border-rose-900/40">
              <p className="font-semibold">{classToUndo.courseName} · {classToUndo.batchName}</p>
              <p className="mt-1 text-xs text-slate-500">তারিখ: {formatDate(classToUndo.attendanceDate || '')} · সময়: {classToUndo.startTime}{classToUndo.endTime ? ` – ${classToUndo.endTime}` : ''}</p>
              {classToUndo.payment && (
                <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  রিসিট নং: {classToUndo.payment.receiptNo} (টাকার পরিমাণ: ৳{classToUndo.payment.amount.toLocaleString('bn-BD')})
                </p>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিত যে এই নির্দিষ্ট ক্লাসের পেমেন্ট আন্ডু করতে চান? ফাইন্যান্স থেকেও এই ক্লাসের টাকা স্বয়ংক্রিয়ভাবে বাদ যাবে।
            </p>
            <label className="mt-3 block text-xs font-semibold text-slate-500">
              কারণ (ঐচ্ছিক)
              <input
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                maxLength={300}
                placeholder="পেমেন্ট আন্ডু করার কারণ"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-[#262b34] dark:bg-[#151921]"
              />
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setClassToUndo(null); setError(''); }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-[#262b34] hover:bg-slate-50 dark:hover:bg-[#151921]"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={undoingPayment}
                onClick={executeUndoPayment}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {undoingPayment && <LoaderCircle className="h-4 w-4 animate-spin" />}
                হ্যাঁ, পেমেন্ট আন্ডু করুন
              </button>
            </div>
          </section>
        </div>
      )}
      {receiptData && <TeacherPaymentReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />}
    </main>
  );
}
