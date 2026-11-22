'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2, Lock, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Reset linkটি অসম্পূর্ণ। নতুন link নিন।');
      return;
    }
    if (password !== confirmPassword) {
      setError('দুইটি password একই হতে হবে।');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.data?.message || 'Password পরিবর্তন হয়েছে।');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password পরিবর্তন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ga-page ga-auth-page px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"><ArrowLeft className="h-4 w-4" /> Login</Link>
        <section className="ga-card p-6 sm:p-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200/70 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400"><Lock className="h-5 w-5" /></div>
          <h1 className="text-2xl font-black">নতুন password দিন</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">কমপক্ষে ৬ অক্ষরের একটি password ব্যবহার করুন।</p>
          {message && <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{message} <Link href="/login" className="underline text-orange-600 dark:text-orange-400">Login</Link></div>}
          {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">নতুন password</span><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-500 dark:border-[#262b34] dark:bg-[#151921]" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">আবার password</span><input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-500 dark:border-[#262b34] dark:bg-[#151921]" /></label>
            <button type="submit" disabled={loading} className="ga-primary-button w-full disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Password save করুন</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50 dark:bg-[#0b0d12]" />}><ResetPasswordForm /></Suspense>;
}
