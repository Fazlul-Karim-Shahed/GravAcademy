'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import { GraduationCap, Mail, Lock, User, AlertCircle, Phone, Loader2 } from 'lucide-react';
import { SiteLogo } from '@/components/common/SiteLogo';

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        setSuccess(res.data.message || 'ইমেইলে verification link পাঠানো হয়েছে।');
        setFormData({ name: '', email: '', password: '', phone: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ga-page ga-auth-page relative grid min-h-[calc(100vh-4rem)] w-full overflow-hidden px-4 py-10 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(28rem,1.2fr)] lg:gap-12 lg:px-10">
      <aside className="relative hidden h-[calc(100vh-8rem)] min-h-[36rem] overflow-hidden rounded-3xl bg-[#111318] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <SiteLogo size="xl" showText />
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">Grav Academy</p><h2 className="mt-3 max-w-md text-4xl font-black leading-tight">Your Academic Care</h2></div>
      </aside>
      {/* Deep space radial ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-orange-950/40 via-amber-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[220px] bg-orange-600/15 rounded-full blur-[90px] pointer-events-none -z-10 animate-atmosphere" />
      <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-amber-900/15 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Twinkling Cosmic Stars */}
      <div className="hidden">
        <div className="absolute top-[12%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
        <div className="absolute top-[28%] left-[24%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
        <div className="absolute top-[16%] right-[16%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
        <div className="absolute top-[32%] right-[10%] w-1.5 h-1.5 rounded-full bg-orange-200 animate-star-twinkle-slow" />
        <span className="shooting-star meteor-1" />
      </div>

      <div className="relative z-10 min-w-0 w-full max-w-[calc(100vw-2rem)] sm:max-w-md justify-self-center">
        <div className="text-center mb-7">
          <div className="flex justify-center mb-4">
            <SiteLogo size="xl" showText={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            নতুন একাউন্ট তৈরি করুন
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            গ্র্যাভ একাডেমিতে যুক্ত হয়ে কোর্স, লাইভ ক্লাস ও স্টাডি ম্যাটেরিয়ালে প্রবেশ করুন
          </p>
        </div>

        <div className="ga-card rounded-2xl p-7 sm:p-8 text-slate-900 dark:text-white">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#111318] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                ইমেইল এড্রেস (Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com (আপনার সক্রিয় ইমেইল)"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#111318] transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                * রেজিস্ট্রেশন সম্পন্ন করার জন্য আপনার সক্রিয় ইমেইলে একটি ভেরিফিকেশন ও ওয়েলকাম মেসেজ পাঠানো হবে।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                মোবাইল নম্বর (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01700000000"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#111318] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#111318] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ga-primary-button w-full mt-3 text-sm active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'যাচাই ও অ্যাকাউন্ট তৈরি হচ্ছে...' : 'একাউন্ট তৈরি করুন'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#262b34] text-center text-xs text-slate-600 dark:text-slate-400">
            ইতিমধ্যেই একাউন্ট আছে?{' '}
            <Link
              href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="text-orange-600 dark:text-orange-400 hover:underline font-black"
            >
              লগইন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border-2 border-orange-500/20 border-t-orange-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
