'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, Phone, Mail, UserRound, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/common/ProtectedRoute';

interface BatchData {
  _id: string;
  name: string;
  status: string;
  capacity?: number;
  courseId?: {
    title?: string;
    gradeLevel?: string;
    subject?: string;
    courseFee?: number;
    regularPrice?: number;
    discountPrice?: number;
  };
}

function EnrollmentRequestContent({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    schoolOrCollege: '',
    gradeLevel: '',
    guardianName: '',
    guardianPhone: '',
    message: '',
  });

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const res = await api.get(`/batches/${resolvedParams.batchId}`);
        const loaded = res.data?.data || res.data?.batch || res.data;
        setBatch(loaded);
        setForm((prev) => ({ ...prev, gradeLevel: loaded?.courseId?.gradeLevel || '' }));
      } catch (err: any) {
        setError(err.response?.data?.message || 'ব্যাচের তথ্য লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    };
    loadBatch();
  }, [resolvedParams.batchId]);

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
      await api.post('/enrollment-requests', {
        batchId: resolvedParams.batchId,
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Request পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const fee = batch?.courseId?.discountPrice ?? batch?.courseId?.courseFee ?? batch?.courseId?.regularPrice;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> কোর্সে ফিরে যান
        </Link>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
        ) : submitted ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-8 h-8" /></div>
            <h1 className="text-xl sm:text-2xl font-black">Request পাঠানো হয়েছে</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Admin request review করে approve করলে এই batch আপনার classroom-এ দেখা যাবে।</p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">
              <Link href="/dashboard" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Dashboard</Link>
              <Link href="/courses" className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">কোর্স দেখুন</Link>
            </div>
          </div>
        ) : !batch ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800"><p className="text-sm font-bold">ব্যাচটি পাওয়া যায়নি।</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 items-start">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 lg:sticky lg:top-6">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center mb-5"><GraduationCap className="w-6 h-6" /></div>
              <p className="text-xs font-bold text-emerald-300 mb-2">ভর্তি request</p>
              <h1 className="text-xl sm:text-2xl font-black leading-tight">{batch.name}</h1>
              <p className="text-sm text-slate-300 mt-2">{batch.courseId?.title || 'Grav Academy course'}</p>
              {batch.courseId?.gradeLevel && <p className="text-xs text-slate-400 mt-4">Class: {batch.courseId.gradeLevel}</p>}
              {fee !== undefined && <p className="text-lg font-black text-emerald-300 mt-5">৳{fee.toLocaleString('bn-BD')}</p>}
              <div className="flex items-start gap-2 mt-6 pt-5 border-t border-white/10 text-xs text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" /> Payment এখনই লাগবে না। Admin approve করার পর payment arrange করা যাবে।</div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="mb-6"><h2 className="text-lg font-black">আপনার তথ্য দিন</h2><p className="text-xs text-slate-500 mt-1">শুধু প্রয়োজনীয় তথ্য দিয়ে request পাঠান।</p></div>
              {error && <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="নাম *" icon={<UserRound className="w-4 h-4" />} value={form.name} onChange={(v) => update('name', v)} required />
                <Field label="মোবাইল *" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={(v) => update('phone', v)} required type="tel" />
                <Field label="ইমেইল" icon={<Mail className="w-4 h-4" />} value={form.email} onChange={(v) => update('email', v)} type="email" />
                <Field label="শ্রেণি" value={form.gradeLevel} onChange={(v) => update('gradeLevel', v)} />
                <Field label="স্কুল / কলেজ" value={form.schoolOrCollege} onChange={(v) => update('schoolOrCollege', v)} />
                <Field label="অভিভাবকের নাম" value={form.guardianName} onChange={(v) => update('guardianName', v)} />
                <Field label="অভিভাবকের মোবাইল" value={form.guardianPhone} onChange={(v) => update('guardianPhone', v)} type="tel" />
              </div>
              <label className="block mt-4"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">মেসেজ <span className="font-normal text-slate-400">(optional)</span></span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="কোনো তথ্য জানাতে চাইলে লিখুন" /></label>
              <button type="submit" disabled={submitting} className="w-full mt-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{submitting ? 'পাঠানো হচ্ছে...' : 'Request পাঠান'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; icon?: React.ReactNode; required?: boolean; type?: string }) {
  return <label className="block"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span><span className="relative block mt-1.5">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}<input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.75 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${icon ? 'pl-10' : ''}`} /></span></label>;
}

export default function EnrollmentRequestPage({ params }: { params: Promise<{ batchId: string }> }) {
  return <ProtectedRoute allowedRoles={['student']}><EnrollmentRequestContent params={params} /></ProtectedRoute>;
}
