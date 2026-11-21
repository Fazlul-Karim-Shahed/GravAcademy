'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('সঠিক email address দিন।');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setMessage(response.data?.message || 'Password reset link email-এ পাঠানো হয়েছে।');
    } catch (err: any) {
      setError(err.response?.data?.message || 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ga-page min-h-screen px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"><ArrowLeft className="h-4 w-4" /> Login</Link>
        <section className="ga-card p-6 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"><Mail className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black">Password reset</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">আপনার registered Gmail দিন। সেখানে password পরিবর্তনের link পাঠানো হবে।</p>
          {message && <div className="mt-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}
          {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">ইমেইল</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-orange-500 dark:border-[#262b34] dark:bg-[#151921]" placeholder="name@example.com" /></label>
            <button type="submit" disabled={loading} className="ga-primary-button w-full disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Link পাঠান</button>
          </form>
        </section>
      </div>
    </main>
  );
}
