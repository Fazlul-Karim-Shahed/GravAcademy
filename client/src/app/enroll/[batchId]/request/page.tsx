'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, Mail, MailCheck, Phone, UserRound, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface BatchData {
  _id: string;
  name: string;
  status: string;
  capacity?: number;
  courseId?: { title?: string; gradeLevel?: string; subject?: string; courseFee?: number; regularPrice?: number; discountPrice?: number };
}

function EnrollmentRequestContent({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', schoolOrCollege: '', gradeLevel: '', guardianName: '', guardianPhone: '', message: '' });

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const res = await api.get(`/batches/${resolvedParams.batchId}`);
        const loaded = res.data?.data || res.data?.batch || res.data;
        setBatch(loaded);
        setForm((prev) => ({
          ...prev,
          name: user?.role === 'student' ? user.name || prev.name : prev.name,
          phone: user?.role === 'student' ? user.phone || prev.phone : prev.phone,
          email: user?.role === 'student' ? user.email || prev.email : prev.email,
          schoolOrCollege: user?.role === 'student' ? user.studentDetails?.schoolOrCollege || prev.schoolOrCollege : prev.schoolOrCollege,
          gradeLevel: loaded?.courseId?.gradeLevel || '',
          guardianName: user?.role === 'student' ? user.studentDetails?.guardianName || prev.guardianName : prev.guardianName,
          guardianPhone: user?.role === 'student' ? user.studentDetails?.guardianPhone || prev.guardianPhone : prev.guardianPhone,
        }));
      } catch (err: any) {
        setError(err.response?.data?.message || 'ব্যাচের তথ্য লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    };
    loadBatch();
  }, [resolvedParams.batchId, user]);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('নাম ও মোবাইল নম্বর দিন।');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post('/enrollment-requests', { batchId: resolvedParams.batchId, ...form, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined });
      setSubmittedMessage(response.data?.message || 'আপনার request গ্রহণ করা হয়েছে।');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Request পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const fee = batch?.courseId?.discountPrice ?? batch?.courseId?.courseFee ?? batch?.courseId?.regularPrice;

  return (
    <div className="ga-page ga-public-page ga-form-page text-slate-900 dark:text-slate-100 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"><ArrowLeft className="w-4 h-4" /> কোর্সে ফিরে যান</Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> নিরাপদ ভর্তি request</span>
        </div>

        {loading ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" /></div>
        ) : submitted ? (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#111318] rounded-[28px] border border-emerald-200 dark:border-emerald-900/60 p-8 sm:p-12 text-center shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-5">{user ? <CheckCircle2 className="w-8 h-8" /> : <MailCheck className="w-8 h-8" />}</div>
            <h1 className="text-xl sm:text-2xl font-black">{user ? 'Request পাঠানো হয়েছে' : 'আপনার ইমেইল ভেরিফাই করুন'}</h1>
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">{submittedMessage || (user ? 'Admin review করে approve করলে এই batch আপনার classroom-এ দেখা যাবে।' : 'আপনার ইমেইলে একটি যাচাইকরণ লিংক পাঠানো হয়েছে। Inbox বা spam folder দেখে লিংকটিতে ক্লিক করুন।')}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">{user && <Link href="/dashboard" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/20">Dashboard</Link>}<Link href="/courses" className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">কোর্স দেখুন</Link></div>
          </div>
        ) : !batch ? (
          <div className="ga-card p-8 text-center"><p className="text-sm font-bold">ব্যাচটি পাওয়া যায়নি।</p></div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <section className="relative overflow-hidden rounded-2xl border border-orange-100 bg-white p-6 dark:border-[#262b34] dark:bg-[#111318] lg:sticky lg:top-24">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl dark:bg-orange-500/10" />
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-start gap-4 min-w-0"><div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-orange-600 flex items-center justify-center shrink-0 shadow-sm border border-orange-100 dark:border-slate-700"><GraduationCap className="w-6 h-6" /></div><div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400 mb-1">ভর্তি request</p><h1 className="text-xl sm:text-2xl font-black leading-tight truncate">{batch.name}</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{batch.courseId?.title || 'Grav Academy course'}</p></div></div>
                <div className="flex items-center gap-2 shrink-0">{batch.courseId?.gradeLevel && <span className="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">{batch.courseId.gradeLevel}</span>}{fee !== undefined && <span className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-black shadow-md shadow-orange-950/20">৳{fee.toLocaleString('bn-BD')}</span>}</div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="bg-transparent dark:bg-transparent sm:bg-white sm:dark:bg-[#111318] sm:rounded-[28px] sm:border border-slate-200/90 dark:border-[#262b34] sm:p-8 lg:p-10 sm:shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="mb-7"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center"><UserRound className="w-5 h-5" /></div><div><h2 className="text-lg font-black">আপনার তথ্য</h2><p className="text-xs text-slate-500 mt-0.5">শুধু প্রয়োজনীয় তথ্য দিয়ে request পাঠান</p></div></div></div>
              {error && <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <Field label="নাম *" icon={<UserRound className="w-4 h-4" />} value={form.name} onChange={(v) => update('name', v)} required readOnly={Boolean(user?.name)} />
                <Field label="মোবাইল (WhatsApp) *" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={(v) => update('phone', v)} required type="tel" readOnly={Boolean(user?.phone)} />
                <Field label={user ? "ইমেইল" : "ইমেইল (request confirmation-এর জন্য আবশ্যক) *"} icon={<Mail className="w-4 h-4" />} value={form.email} onChange={(v) => update('email', v)} required={!user} type="email" readOnly={Boolean(user?.email)} />
                <Field label="শ্রেণি" value={form.gradeLevel} onChange={() => {}} readOnly />
                <Field label="স্কুল / কলেজ" value={form.schoolOrCollege} onChange={(v) => update('schoolOrCollege', v)} readOnly={Boolean(user?.studentDetails?.schoolOrCollege)} />
                <Field label="অভিভাবকের নাম" value={form.guardianName} onChange={(v) => update('guardianName', v)} readOnly={Boolean(user?.studentDetails?.guardianName)} />
                <Field label="অভিভাবকের মোবাইল (WhatsApp)" value={form.guardianPhone} onChange={(v) => update('guardianPhone', v)} type="tel" readOnly={Boolean(user?.studentDetails?.guardianPhone)} />
              </div>
              <label className="block mt-5"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">মেসেজ <span className="font-normal text-slate-400">(optional)</span></span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 resize-none transition-colors" placeholder="কোনো তথ্য জানাতে চাইলে লিখুন" /></label>
              <div className="ga-sticky-action-bar mt-6"><button type="submit" disabled={submitting} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 text-sm font-black text-white transition-colors hover:bg-orange-700 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{submitting ? 'পাঠানো হচ্ছে...' : 'Request পাঠান'}</button></div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon, required, type = 'text', readOnly }: { label: string; value: string; onChange: (value: string) => void; icon?: React.ReactNode; required?: boolean; type?: string; readOnly?: boolean }) {
  return <label className="block"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span><span className="relative block mt-1.5">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}<input required={required} readOnly={readOnly} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 ${readOnly ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed' : 'bg-slate-50/70 dark:bg-slate-950'} px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-colors ${icon ? 'pl-10' : ''}`} /></span></label>;
}

export default function EnrollmentRequestPage({ params }: { params: Promise<{ batchId: string }> }) {
  return <EnrollmentRequestContent params={params} />;
}
