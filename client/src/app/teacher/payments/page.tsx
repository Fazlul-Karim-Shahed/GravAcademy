'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { ArrowLeft, Banknote, CalendarDays, Printer, Receipt, X } from 'lucide-react';
import Link from 'next/link';

type Payment = { receiptNo: string; amountPaid: number; paidAt: string; notes?: string; classes?: Array<{ classDate: string; courseName?: string; topic?: string }> };
const money = (value: number) => `৳${new Intl.NumberFormat('en-BD').format(value || 0)}`;
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export default function TeacherPaymentsPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teacher, setTeacher] = useState<{ name?: string; gravId?: string; email?: string; createdAt?: string } | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificateOpen, setCertificateOpen] = useState(false);

  useEffect(() => {
    api.get('/teacher-attendance/my-payments').then((res) => {
      setPayments(res.data.data || []); setTeacher(res.data.teacher || null); setTotalPaid(res.data.totalPaid || 0);
    }).catch(() => setError('Payment history load করা যায়নি।')).finally(() => setLoading(false));
  }, []);

  return <main className="ga-page py-8 text-slate-900 dark:text-slate-100"><div className="mx-auto max-w-5xl px-4 sm:px-6">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><Link href="/teacher" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600"><ArrowLeft className="h-4 w-4" /> ড্যাশবোর্ড</Link><h1 className="text-2xl font-black">Payment</h1><p className="mt-1 text-sm text-slate-500">কোম্পানি থেকে পাওয়া আপনার সব payment</p></div><button type="button" onClick={() => setCertificateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700"><Receipt className="h-4 w-4" />Salary Certificate</button></div>
    <section className="mb-6 grid gap-4 sm:grid-cols-3"><div className="ga-card p-5"><Banknote className="h-5 w-5 text-orange-600" /><p className="mt-3 text-xs text-slate-500">Total received</p><p className="mt-1 text-2xl font-black">{money(totalPaid)}</p></div><div className="ga-card p-5"><Receipt className="h-5 w-5 text-blue-600" /><p className="mt-3 text-xs text-slate-500">Payment records</p><p className="mt-1 text-2xl font-black">{payments.length}</p></div><div className="ga-card p-5"><CalendarDays className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs text-slate-500">Teacher</p><p className="mt-1 truncate text-base font-black">{teacher?.name || user?.name || '—'}</p></div></section>
    <section className="ga-card overflow-hidden"><div className="border-b border-slate-100 px-5 py-4 dark:border-[#262b34]"><h2 className="font-black">Payment history</h2></div>{loading ? <div className="p-8 text-center text-sm text-slate-500">Loading…</div> : error ? <div className="p-8 text-center text-sm text-rose-600">{error}</div> : payments.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">এখনো কোনো payment পাওয়া যায়নি।</div> : <div className="divide-y divide-slate-100 dark:divide-[#262b34]">{payments.map((payment) => <div key={payment.receiptNo} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-bold">{payment.receiptNo}</p><p className="mt-1 text-xs text-slate-500">{date(payment.paidAt)} · {payment.classes?.length || 0}টি class</p></div><p className="text-lg font-black text-emerald-600">{money(payment.amountPaid)}</p></div>)}</div>}</section>
    {certificateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setCertificateOpen(false)}><section role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl print:shadow-none" onClick={(event) => event.stopPropagation()}><div className="flex justify-end print:hidden"><button type="button" onClick={() => setCertificateOpen(false)} aria-label="Close"><X /></button></div><div id="salary-certificate" className="border-2 border-slate-200 p-6 sm:p-10"><div className="text-center"><h2 className="text-2xl font-black">{settings?.siteName || 'Grav Academy'}</h2><p className="mt-1 text-sm text-slate-500">Salary Certificate</p><div className="mx-auto mt-5 h-px bg-slate-300" /></div><p className="mt-8 text-sm leading-7">This is to certify that <strong>{teacher?.name || user?.name || 'Teacher'}</strong>{teacher?.gravId ? ` (${teacher.gravId})` : ''} has received a total payment of <strong>{money(totalPaid)}</strong> from {settings?.siteName || 'the company'} to date.</p><div className="mt-8 grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Issue date:</span> {date(new Date().toISOString())}</p><p><span className="text-slate-500">Payment records:</span> {payments.length}</p></div><div className="mt-16 flex justify-between text-xs text-slate-500"><span>Authorized signature</span><span>{settings?.siteName || 'Company'}</span></div></div><div className="mt-5 flex justify-end print:hidden"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white"><Printer className="h-4 w-4" />Print certificate</button></div></section></div>}
  </div></main>;
}
