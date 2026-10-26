'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { Card, Button, DriveFileUpload } from '@/components/ui';
import {
  Video,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Link2,
  ShieldAlert,
} from 'lucide-react';

export default function ScheduleFreeClassPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canManageLive = hasPermission(user, PERMISSIONS.LIVE_CLASSES_MANAGE);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    thumbnailUrl: '',
    provider: 'google_meet' as 'zoom' | 'google_meet',
    meetingUrl: '',
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    durationMinutes: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/live-classes', {
        ...form,
        isFreePublic: true,
        startTime: new Date(form.startTime).toISOString(),
        durationMinutes: Number(form.durationMinutes),
      });

      if (res.data?.success) {
        setSuccess('ফ্রি ক্লাস/ওয়েবিনর সফলভাবে নির্ধারিত হয়েছে! রিডাইরেক্ট করা হচ্ছে...');
        setTimeout(() => {
          router.push('/free-classes');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ফ্রি ক্লাস শিডিউল করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoading && !canManageLive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            অনুমতি প্রয়োজন (Access Restricted)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            আপনার অ্যাকাউন্টে নতুন উন্মুক্ত ফ্রি ক্লাস বা সেমিনার তৈরি করার অনুমতি নেই।
          </p>
          <Link
            href="/free-classes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> ফ্রি ক্লাস তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/free-classes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> ফ্রি ক্লাস তালিকায় ফিরে যান
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Video className="w-3.5 h-3.5" /> পাবলিক ফ্রি ক্লাস ও মাস্টারক্লাস
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            নতুন উন্মুক্ত ফ্রি ক্লাস শিডিউল করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            যেকোনো শিক্ষার্থী বা অভিভাবকের জন্য উন্মুক্ত লাইভ মাস্টারক্লাস, সেমিনার বা প্রশ্নোত্তর পর্ব প্রকাশ করুন।
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Session Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                ক্লাস / ওয়েবিনর শিরোনাম (Title) *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: এসএসসির জন্য ফিজিক্স শেষ মুহূর্তের প্রস্তুতি ও গাইডলাইন"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Thumbnail Upload (Google Drive) */}
            <DriveFileUpload
              label="ক্লাস ব্যানার / থাম্বনেইল (Google Drive বা লিংক)"
              value={form.thumbnailUrl}
              onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
              placeholder="https://drive.google.com/... অথবা ফাইল আপলোড করুন"
              helperText="ফ্রি ক্লাসের কার্ডে প্রদর্শনের জন্য ছবি আপলোড করুন, ফাইলটি সরাসরি ড্রাইভে সেভ হবে।"
            />

            {/* Start Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  শুরুর সময় *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  স্থায়িত্ব (মিনিটে)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
              <Link href="/free-classes" className="w-full sm:w-auto">
                <Button type="button" variant="secondary" size="md" className="w-full sm:w-auto">
                  বাতিল
                </Button>
              </Link>
              <Button type="submit" isLoading={submitting} size="md" className="w-full sm:w-auto">
                পাবলিক ফ্রি ক্লাস প্রকাশ করুন
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}
