'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import { GraduationCap, Mail, Lock, AlertCircle, Loader2, UserCheck, Hash, Eye, EyeOff } from 'lucide-react';
import { SiteLogo } from '@/components/common/SiteLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { login } = useAuth();

  // Mode: Default is Grav ID login. If useEmail is checked, user logs in with email.
  const [useEmail, setUseEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        identifier: formData.identifier.trim(),
        password: formData.password,
      });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        // If redirect URL is provided and valid, prioritize redirect
        if (redirectUrl && redirectUrl.startsWith('/')) {
          router.push(redirectUrl);
          return;
        }

        // Role-based routing
        if (user.role === 'superadmin' || user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'teacher') {
          router.push('/teacher');
        } else if (user.role === 'guardian') {
          router.push('/guardian');
        } else if (user.role === 'employee') {
          router.push('/employee');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'সঠিক Grav ID/ইমেইল অথবা পাসওয়ার্ড দিন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ga-page ga-auth-page relative grid min-h-[calc(100vh-4rem)] w-full overflow-hidden px-4 py-10 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(28rem,1.2fr)] lg:gap-12 lg:px-10">
      <aside className="relative hidden h-[calc(100vh-8rem)] min-h-[34rem] overflow-hidden rounded-3xl bg-[#111318] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <SiteLogo size="xl" showText />
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">Grav Academy</p><h2 className="mt-3 max-w-md text-4xl font-black leading-tight">Your Academic Care</h2></div>
      </aside>
      {/* Deep space radial ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-orange-950/40 via-amber-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[220px] bg-orange-600/10 rounded-full blur-[90px] pointer-events-none -z-10 animate-atmosphere" />
      <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Twinkling Cosmic Stars */}
      <div className="hidden">
        <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
        <div className="absolute top-[25%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
        <div className="absolute top-[18%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
        <div className="absolute top-[35%] right-[12%] w-1.5 h-1.5 rounded-full bg-orange-200 animate-star-twinkle-slow" />
        <span className="shooting-star meteor-1" />
      </div>

      <div className="relative z-10 min-w-0 w-full max-w-[calc(100vw-2rem)] sm:max-w-md justify-self-center">
        <div className="text-center mb-7">
          <div className="flex justify-center mb-4">
            <SiteLogo size="xl" showText={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            লগইন করুন
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            আপনার গ্র্যাভ একাডেমি স্টুডেন্ট পোর্টাল অথবা ড্যাশবোর্ডে প্রবেশ করুন
          </p>
        </div>

        <div className="ga-card rounded-2xl p-7 sm:p-8 text-slate-900 dark:text-white">
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {useEmail ? 'ইমেইল এড্রেস' : 'Grav ID'}
                </label>
              </div>

              <div className="relative">
                {useEmail ? (
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={useEmail ? 'email' : 'text'}
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder={useEmail ? 'name@example.com' : 'যেমন: 261024001'}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                />
              </div>

              {/* Checkbox Toggle to switch to email login */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useEmailToggle"
                  checked={useEmail}
                  onChange={(e) => {
                    setUseEmail(e.target.checked);
                    setFormData({ ...formData, identifier: '' });
                    setError('');
                  }}
                  className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                />
                <label
                  htmlFor="useEmailToggle"
                  className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  ইমেইল দিয়ে লগইন করতে চাই
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  পাসওয়ার্ড
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-[#262b34] rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ga-primary-button w-full mt-2 text-sm active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>সাইন ইন</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#1e222a] text-center text-xs text-slate-600 dark:text-slate-400">
            এখনো কোনো একাউন্ট নেই?{' '}
            <Link
              href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              className="text-orange-600 dark:text-orange-400 hover:underline font-black"
            >
              নতুন একাউন্ট খুলুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border-2 border-orange-500/20 border-t-orange-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
