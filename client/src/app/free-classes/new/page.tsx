'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { Button, DriveFileUpload } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
import {
  Video,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Link2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const freeClassSections = [
  { id: 'basic', label: 'Session details' },
  { id: 'schedule', label: 'Time & platform' },
];

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

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

  if (!authLoading && !canManageLive) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 py-16">
        <div className="ga-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            অনুমতি প্রয়োজন (Access Restricted)
          </h2>
          <p className="mb-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            আপনার অ্যাকাউন্টে নতুন উন্মুক্ত ফ্রি ক্লাস বা সেমিনার তৈরি করার অনুমতি নেই।
          </p>
          <Link
            href="/free-classes"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> ফ্রি ক্লাস তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref="/free-classes"
          backLabel="Free classes"
          eyebrow="Public learning"
          title="নতুন উন্মুক্ত ফ্রি ক্লাস শিডিউল করুন"
          description="শিক্ষার্থী ও অভিভাবকদের জন্য লাইভ মাস্টারক্লাস, সেমিনার বা প্রশ্নোত্তর পর্ব প্রকাশ করুন।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              New class
            </span>
          }
        />

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Session sections" items={freeClassSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* Section 1: Basic */}
            <FormSection
              id="basic"
              icon={<Video className="h-4 w-4" />}
              title="ক্লাস বা সেমিনার পরিচিতি"
              description="উন্মুক্ত ফ্রি ক্লাসের শিরোনাম এবং ব্যানার বা থাম্বনেইল যুক্ত করুন।"
            >
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    ক্লাস / ওয়েবিনর শিরোনাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="যেমন: এসএসসির জন্য ফিজিক্স শেষ মুহূর্তের প্রস্তুতি ও গাইডলাইন"
                    className={inputClass}
                  />
                </div>

                <div>
                  <DriveFileUpload
                    label="ক্লাস ব্যানার / থাম্বনেইল (Google Drive বা লিংক)"
                    value={form.thumbnailUrl}
                    onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
                    placeholder="https://drive.google.com/... অথবা ফাইল আপলোড করুন"
                    helperText="ফ্রি ক্লাসের কার্ডে প্রদর্শনের জন্য ছবি আপলোড করুন, ফাইলটি সরাসরি ড্রাইভে সেভ হবে।"
                  />
                </div>
              </div>
            </FormSection>

            {/* Section 2: Time & Platform */}
            <FormSection
              id="schedule"
              icon={<Clock className="h-4 w-4" />}
              title="সময়সূচি ও লাইভ লিংক"
              description="ক্লাস শুরুর তারিখ, সময় এবং সরাসরি যোগদানের প্ল্যাটফর্ম নির্ধারণ করুন।"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      শুরুর সময় <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>স্থায়িত্ব (মিনিটে)</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={form.durationMinutes}
                      onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>লাইভ প্ল্যাটফর্ম</label>
                    <select
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value as any })}
                      className={inputClass}
                    >
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>মিটিং / জয়েন লিংক</label>
                    <input
                      type="url"
                      value={form.meetingUrl}
                      onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                      placeholder="https://meet.google.com/... বা https://zoom.us/..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Sticky Action Bar */}
            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
                ফ্রি ক্লাসটি পাবলিশ করতে নিচের বাটনে চাপুন।
              </div>
              <div className="flex gap-2">
                <Link href="/free-classes">
                  <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                    বাতিল
                  </Button>
                </Link>
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" /> পাবলিক ফ্রি ক্লাস প্রকাশ করুন
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
