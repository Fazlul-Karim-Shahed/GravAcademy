'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';
import { SiteLogo } from '@/components/common/SiteLogo';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<'ready' | 'loading' | 'success' | 'error'>(token ? 'ready' : 'error');
  const [message, setMessage] = useState(token ? 'চালিয়ে যেতে নিচের button-এ click করুন।' : 'Verification link-এ token পাওয়া যায়নি। ইমেইলের পুরো link ব্যবহার করুন।');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification link-এ token পাওয়া যায়নি। ইমেইলের পুরো link ব্যবহার করুন।');
    }
  }, [token]);

  const verify = async () => {
    setState('loading');
    setMessage('ইমেইল যাচাই করা হচ্ছে…');
    api.post('/auth/verify-email', { token })
      .then((response) => {
        setState('success');
        setMessage(response.data?.message || 'ইমেইল verify হয়েছে।');
      })
      .catch((error: any) => {
        setState('error');
        setMessage(error.response?.data?.message || 'এই verification link ব্যবহার করা যাচ্ছে না।');
      });
  };

  const resend = async () => {
    setResending(true);
    setResendMessage('');
    try {
      const response = await api.post('/auth/resend-verification', { email });
      setResendMessage(response.data?.message || 'Verification link পাঠানো হয়েছে।');
    } catch (error: any) {
      setResendMessage(error.response?.data?.message || 'নতুন link পাঠানো যায়নি।');
    } finally {
      setResending(false);
    }
  };

  const Icon = state === 'loading' ? Loader2 : state === 'success' ? CheckCircle2 : state === 'error' ? XCircle : MailCheck;
  const iconColor = state === 'success' ? 'text-emerald-600' : state === 'error' ? 'text-rose-500' : 'text-blue-600';

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/40" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-950/40" />
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white text-center shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
        <div className="p-7 sm:p-10">
          <div className="mb-7 flex justify-center">
            <SiteLogo size="xl" showText={true} textClassName="text-lg" taglineClassName="text-xs" />
          </div>
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-8 ring-slate-50/70 dark:bg-slate-800 dark:ring-slate-800/50 ${iconColor}`}>
          <Icon className={`h-7 w-7 ${state === 'loading' ? 'animate-spin' : ''}`} />
          </div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
          {state === 'success' ? 'ইমেইল verify হয়েছে' : state === 'error' ? 'Verify করা যায়নি' : 'ইমেইল যাচাই হচ্ছে'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300" role="status">{message}</p>
        {state === 'success' && (
          <Link href="/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700">
            Login করুন
          </Link>
        )}
        {state === 'ready' && (
          <button type="button" onClick={verify} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700">
            Email confirm করুন
          </button>
        )}
        {state === 'error' && (
          <div className="mx-auto mt-7 max-w-sm space-y-3">
            <form onSubmit={(event) => { event.preventDefault(); void resend(); }} className="flex flex-col gap-2 sm:flex-row">
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="আপনার email address" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <button type="submit" disabled={resending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {resending && <Loader2 className="h-4 w-4 animate-spin" />} নতুন link
              </button>
            </form>
            {resendMessage && <p className="text-xs leading-5 text-slate-500 dark:text-slate-400" role="status">{resendMessage}</p>}
            <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">হোমে ফিরুন</Link>
          </div>
        )}
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></main>}><VerifyEmailContent /></Suspense>;
}
