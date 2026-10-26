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

  // Mode: Default is User ID login. If useEmail is checked, user logs in with email.
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
      setError(err.response?.data?.message || 'সঠিক ইউজার আইডি/ইমেইল অথবা পাসওয়ার্ড দিন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] cosmic-hero-bg text-white flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Deep space radial ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-rose-950/40 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[220px] bg-red-600/15 rounded-full blur-[90px] pointer-events-none -z-10 animate-atmosphere" />
      <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-blue-900/15 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Twinkling Cosmic Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
        <div className="absolute top-[25%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
        <div className="absolute top-[18%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
        <div className="absolute top-[35%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-200 animate-star-twinkle-slow" />
        <span className="shooting-star meteor-1" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <div className="flex justify-center mb-4">
            <SiteLogo size="xl" showText={false} className="border border-white/20 shadow-xl shadow-blue-500/30" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            লগইন করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium">
            আপনার গ্র্যাভ একাডেমি স্টুডেন্ট পোর্টাল অথবা ড্যাশবোর্ডে প্রবেশ করুন
          </p>
        </div>

        <div className="rounded-[32px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-2 border-slate-200/80 dark:border-slate-800/90 p-7 sm:p-8 shadow-2xl shadow-blue-950/20 text-slate-900 dark:text-white">
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
                  {useEmail ? 'ইমেইল এড্রেস' : 'ইউজার আইডি (User ID)'}
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
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-medium"
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
                  className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <label
                  htmlFor="useEmailToggle"
                  className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-medium"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>সাইন ইন</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
            এখনো কোনো একাউন্ট নেই?{' '}
            <Link
              href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              className="text-blue-600 dark:text-blue-400 hover:underline font-black"
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
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
