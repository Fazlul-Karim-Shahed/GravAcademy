'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatBDDate } from '@/lib/dateUtils';
import ComingSoonCard from '@/components/common/ComingSoonCard';
import {
  ArrowLeft, ArrowDownLeft, Banknote, Building2, CalendarDays, Check, ChevronLeft,
  ChevronRight, CircleDollarSign, FileText, Filter, LoaderCircle, Plus, Search, X, Pencil, Trash2,
} from 'lucide-react';

interface ExpenseRow {
  source: 'teacher' | 'manual';
  sourceId: string;
  referenceNo: string;
  title: string;
  payeeName?: string;
  gravId?: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  classCount?: number;
  classes?: Array<{ batchId?: { name?: string }; courseId?: { title?: string }; classDate: string; amount: number }>;
  courseBreakdown?: Array<{ courseName: string; classCount: number; subtotal: number }>;
  createdBy?: string;
}

interface ExpenseSummary { totalExpenses: number; teacherPayments: number; manualExpenses: number; count: number }

const categories = [
  ['office_rent', 'অফিস ভাড়া'], ['utilities', 'বিদ্যুৎ ও ইউটিলিটি'], ['marketing', 'মার্কেটিং'],
  ['equipment', 'যন্ত্রপাতি'], ['transport', 'যাতায়াত'], ['maintenance', 'মেইনটেন্যান্স'],
  ['software', 'সফটওয়্যার'], ['internet', 'ইন্টারনেট'], ['staff_salary', 'স্টাফ বেতন'], ['other', 'অন্যান্য'],
] as const;
const categoryLabels: Record<string, string> = Object.fromEntries(categories);
const methodLabels: Record<string, string> = { cash: 'Cash', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', bank_transfer: 'Bank', other: 'Other' };
const todayDhaka = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (part: string) => parts.find((item) => item.type === part)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
const todayDhakaFromDate = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const get = (part: string) => parts.find((item) => item.type === part)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
const currentMonthStart = () => `${todayDhaka().slice(0, 7)}-01`;
const formatMoney = (amount = 0) => `৳${Number(amount).toLocaleString('bn-BD')}`;

export default function CompanyExpensesPage() {
  const { user } = useAuth();
  const { loading: settingsLoading, isFeatureEnabled } = useSiteSettings();
  const canView = hasPermission(user, PERMISSIONS.FINANCE_VIEW);
  const canAdd = hasPermission(user, PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({ totalExpenses: 0, teacherPayments: 0, manualExpenses: 0, count: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', category: 'other', amount: '', expenseDate: todayDhaka(), payee: '', paymentMethod: 'cash', reference: '', notes: '' });

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/finance/company-expenses', { params: { startDate, endDate, source, category, search, page, limit: 25 } });
      setRows(response.data.data || []);
      setSummary(response.data.summary || { totalExpenses: 0, teacherPayments: 0, manualExpenses: 0, count: 0 });
      setTotalPages(Math.max(1, response.data.pagination?.totalPages || 1));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Expense list লোড হয়নি।');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, source, category, search, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadExpenses(); }, 250);
    return () => window.clearTimeout(timer);
  }, [loadExpenses]);

  const filteredTotalLabel = useMemo(() => `${summary.count.toLocaleString('bn-BD')}টি record`, [summary.count]);

  const submitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const response = editingId
        ? await api.put(`/finance/company-expenses/${editingId}`, payload)
        : await api.post('/finance/company-expenses', payload);
      setNotice(response.data.message || (editingId ? 'Expense আপডেট হয়েছে।' : 'Expense যোগ হয়েছে।'));
      setForm({ title: '', category: 'other', amount: '', expenseDate: todayDhaka(), payee: '', paymentMethod: 'cash', reference: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      setPage(1);
      await loadExpenses();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Expense যোগ করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (row: ExpenseRow) => {
    setError('');
    setNotice('');
    setEditingId(row.sourceId);
    setForm({
      title: row.title,
      category: row.category,
      amount: String(row.amount),
      expenseDate: todayDhakaFromDate(row.date),
      payee: row.payeeName || '',
      paymentMethod: row.paymentMethod || 'cash',
      reference: row.reference || '',
      notes: row.notes || '',
    });
    setShowForm(true);
  };

  const deleteExpense = async (row: ExpenseRow) => {
    if (!window.confirm(`“${row.title}” expense-টি মুছে ফেলবেন?`)) return;
    setDeletingId(row.sourceId);
    setError('');
    setNotice('');
    try {
      const response = await api.delete(`/finance/company-expenses/${row.sourceId}`);
      setNotice(response.data.message || 'Expense মুছে ফেলা হয়েছে।');
      if (rows.length === 1 && page > 1) setPage((value) => value - 1);
      else await loadExpenses();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Expense মুছে ফেলা যায়নি।');
    } finally {
      setDeletingId(null);
    }
  };

  const resetToMonth = () => {
    setStartDate(currentMonthStart());
    setEndDate(todayDhaka());
    setPage(1);
  };
  const resetToAllTime = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (settingsLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">লোড হচ্ছে...</div>;
  if (!isFeatureEnabled('finance', user?.role === 'superadmin')) return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950"><ComingSoonCard feature="Finance Management" /></div>;
  if (!canView) return <main className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-slate-600 dark:text-slate-300">Company expense দেখার permission নেই।</main>;

  return (
    <main className="min-h-screen bg-slate-50 py-7 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/finance" aria-label="ফাইন্যান্সে ফিরে যান" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /></Link>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white"><Building2 className="h-5 w-5" /></span>
            <div className="min-w-0"><h1 className="text-xl font-black tracking-tight sm:text-2xl">Company Expense</h1><p className="mt-0.5 text-xs text-slate-500">Teacher payment ও business expense</p></div>
          </div>
          {canAdd && <button type="button" onClick={() => { setError(''); setEditingId(null); setForm({ title: '', category: 'other', amount: '', expenseDate: todayDhaka(), payee: '', paymentMethod: 'cash', reference: '', notes: '' }); setShowForm(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"><Plus className="h-4 w-4" />Add Expense</button>}
        </header>

        {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><Check className="h-4 w-4" />{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button></div>}
        {error && !showForm && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Total Expense</span><CircleDollarSign className="h-4 w-4 text-indigo-600" /></div><p className="mt-3 text-2xl font-black">{formatMoney(summary.totalExpenses)}</p><p className="mt-1 text-xs text-slate-500">{filteredTotalLabel}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Teacher Payment</span><Banknote className="h-4 w-4 text-blue-600" /></div><p className="mt-3 text-2xl font-black">{formatMoney(summary.teacherPayments)}</p><p className="mt-1 text-xs text-slate-500">Attendance থেকে তৈরি</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Manual Expense</span><FileText className="h-4 w-4 text-amber-600" /></div><p className="mt-3 text-2xl font-black">{formatMoney(summary.manualExpenses)}</p><p className="mt-1 text-xs text-slate-500">নিজে যোগ করা খরচ</p></article>
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold"><Filter className="h-4 w-4 text-slate-500" />Filters</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.4fr_auto]">
            <label className="text-xs text-slate-500">From<input type="date" value={startDate} onChange={(event) => { setPage(1); setStartDate(event.target.value); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="text-xs text-slate-500">To<input type="date" value={endDate} onChange={(event) => { setPage(1); setEndDate(event.target.value); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="text-xs text-slate-500">Type<select value={source} onChange={(event) => { setPage(1); setSource(event.target.value); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="all">সব expense</option><option value="teacher">Teacher payment</option><option value="manual">Manual expense</option></select></label>
            <label className="text-xs text-slate-500">Category<select value={category} onChange={(event) => { setPage(1); setCategory(event.target.value); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="all">সব category</option><option value="teacher_payment">Teacher payment</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="relative self-end"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Expense খুঁজুন" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
            <div className="flex gap-2 self-end"><button type="button" onClick={resetToAllTime} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">সব সময়</button><button type="button" onClick={resetToMonth} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><CalendarDays className="h-3.5 w-3.5" />এই মাস</button></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5"><div><h2 className="font-bold">Expense List</h2><p className="mt-0.5 text-xs text-slate-500">সাম্প্রতিক খরচ আগে</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{summary.count.toLocaleString('bn-BD')}টি</span></div>
          {loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />লোড হচ্ছে...</div> : rows.length === 0 ? <div className="px-5 py-14 text-center"><ArrowDownLeft className="mx-auto mb-2 h-7 w-7 text-slate-300" /><p className="font-semibold">এই filter-এ কোনো expense নেই</p><p className="mt-1 text-sm text-slate-500">তারিখ পরিবর্তন করুন অথবা নতুন expense যোগ করুন।</p></div> : <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">{rows.map((row) => <article key={`${row.source}-${row.sourceId}`} className="space-y-2.5 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{row.title}</p><p className="mt-0.5 text-xs text-slate-500">{formatBDDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {row.referenceNo}</p></div><span className="shrink-0 font-black">{formatMoney(row.amount)}</span></div><div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className={`rounded-full px-2.5 py-1 font-semibold ${row.source === 'teacher' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{row.source === 'teacher' ? 'Teacher payment' : categoryLabels[row.category] || 'Manual expense'}</span>{row.payeeName && <span>{row.payeeName}</span>}{row.classCount ? <span>{row.classCount}টি class</span> : null}</div>{row.courseBreakdown?.length ? <p className="text-xs text-slate-500">{row.courseBreakdown.map((item) => `${item.courseName} (${item.classCount})`).join(' · ')}</p> : null}{canAdd && row.source === 'manual' && <div className="flex gap-2 pt-1"><button type="button" onClick={() => startEditing(row)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold dark:border-slate-700"><Pencil className="h-3.5 w-3.5" />Edit</button><button type="button" disabled={deletingId === row.sourceId} onClick={() => void deleteExpense(row)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"><Trash2 className="h-3.5 w-3.5" />{deletingId === row.sourceId ? 'Deleting…' : 'Delete'}</button></div>}</article>)}</div>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950/50"><tr><th className="px-5 py-3 font-semibold">Date / Ref</th><th className="px-4 py-3 font-semibold">Expense</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Payee / Details</th><th className="px-5 py-3 text-right font-semibold">Amount</th>{canAdd && <th className="px-4 py-3 text-right font-semibold">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row) => <tr key={`${row.source}-${row.sourceId}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"><td className="px-5 py-3.5"><p className="font-medium">{formatBDDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="mt-0.5 font-mono text-[11px] text-slate-400">{row.referenceNo}</p></td><td className="px-4 py-3.5 font-semibold">{row.title}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.source === 'teacher' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{row.source === 'teacher' ? 'Teacher payment' : categoryLabels[row.category] || 'Manual'}</span></td><td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">{row.payeeName || '—'}{row.classCount ? <span className="ml-2 text-slate-400">· {row.classCount} class</span> : null}{row.courseBreakdown?.length ? <p className="mt-1 text-[11px] text-slate-400">{row.courseBreakdown.map((item) => `${item.courseName} (${item.classCount})`).join(' · ')}</p> : null}</td><td className="px-5 py-3.5 text-right font-black">{formatMoney(row.amount)}</td>{canAdd && <td className="px-4 py-3.5">{row.source === 'manual' ? <div className="flex justify-end gap-1.5"><button type="button" title="Edit expense" aria-label="Edit expense" onClick={() => startEditing(row)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"><Pencil className="h-4 w-4" /></button><button type="button" title="Delete expense" aria-label="Delete expense" disabled={deletingId === row.sourceId} onClick={() => void deleteExpense(row)} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"><Trash2 className="h-4 w-4" /></button></div> : <span className="block text-right text-xs text-slate-400">—</span>}</td>}</tr>)}</tbody></table></div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5"><span className="text-xs text-slate-500">Page {page} / {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronRight className="h-4 w-4" /></button></div></div>
          </>}
        </section>
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="expense-form-title" className="my-auto max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="expense-form-title" className="text-lg font-black">{editingId ? 'Edit Manual Expense' : 'Add Manual Expense'}</h2><p className="mt-1 text-xs text-slate-500">{editingId ? 'খরচের তথ্য সংশোধন করুন' : 'খরচের তথ্য যোগ করুন'}</p></div><button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div><form onSubmit={submitExpense} className="space-y-4"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Expense title<input required minLength={2} maxLength={160} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="যেমন: অফিস ইন্টারনেট বিল" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Amount (৳)<input required type="number" min="1" step="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="0" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Expense date<input required type="date" max={todayDhaka()} value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Payment method<select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Paid to (optional)<input maxLength={120} value={form.payee} onChange={(event) => setForm((current) => ({ ...current, payee: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Person / company" /></label><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Reference (optional)<input maxLength={120} value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Transaction / invoice no." /></label></div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Notes (optional)<textarea maxLength={500} rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}<div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? 'Update Expense' : 'Save Expense'}</button></div></form></section></div>}
    </main>
  );
}
