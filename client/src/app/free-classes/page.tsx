'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  Video,
  Calendar,
  Clock,
  PlusCircle,
  ExternalLink,
  Users,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface FreeClassItem {
  _id: string;
  title: string;
  provider: 'zoom' | 'google_meet';
  meetingUrl: string;
  startTime: string;
  durationMinutes: number;
  isFreePublic?: boolean;
  batchId?: {
    name: string;
  };
  teacherId?: {
    name: string;
  };
}

export default function FreeClassesPage() {
  const { user } = useAuth();
  const canManageLive = hasPermission(user, PERMISSIONS.LIVE_CLASSES_MANAGE);

  const [classes, setClasses] = useState<FreeClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreeClasses();
  }, []);

  const loadFreeClasses = async () => {
    setLoading(true);
    try {
      // First try fetching public free classes
      const res = await api.get('/free-classes');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setClasses(res.data.data);
      } else {
        // Fallback
        const fallbackRes = await api.get('/live-classes');
        if (fallbackRes.data?.success) {
          setClasses(fallbackRes.data.data);
        }
      }
    } catch (e) {
      console.error('Error fetching free classes:', e);
      try {
        const fallbackRes = await api.get('/live-classes');
        if (fallbackRes.data?.success) {
          setClasses(fallbackRes.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 sm:p-12 mb-10 text-white shadow-xl shadow-indigo-950/20">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>উন্মুক্ত ফ্রি মাস্টারক্লাস ও সেমিনার</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              সবার জন্য উন্মুক্ত ফ্রি ক্লাস
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              গ্র্যাভ একাডেমির অভিজ্ঞ শিক্ষকদের স্পেশাল মাস্টারক্লাস, ওয়েবিনর এবং দিকনির্দেশনামূলক ফ্রি সেশন। রেজিস্ট্রেশন ছাড়াই সরাসরি ক্লাসের লিংকে ক্লিক করে যুক্ত হতে পারবেন।
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>১০০% ফ্রি ওপেন ক্লাস</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Meet / Zoom সরাসরি লিংক</span>
            </div>
          </div>

          {/* Decorative Background Accents */}
          <div className="absolute right-[-20px] top-[-30px] w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-12 bottom-4 opacity-15 hidden sm:block pointer-events-none">
            <Video className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>আসন্ন ফ্রি সেশনসমূহ</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              নিচের যে কোনো ক্লাসের নির্ধারিত সময়ে &ldquo;সরাসরি ক্লাসে যুক্ত হন&rdquo; বাটনে ক্লিক করুন।
            </p>
          </div>

          {canManageLive && (
            <Link
              href="/free-classes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন ফ্রি ক্লাস বা ওয়েবিনর প্রকাশ করুন</span>
            </Link>
          )}
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse shadow-xs" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl text-center py-16 px-6 border border-slate-200/90 dark:border-slate-800 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">বর্তমানে কোনো ফ্রি সেশন নির্ধারিত নেই</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              শিঘ্রই আমাদের নতুন স্পেশাল ফ্রি ক্লাস ও ওয়েবিনর ঘোষণা করা হবে। নিয়মিত আমাদের কোর্স পেইজ ও নোটিশ ফলো করুন।
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>আমাদের পেইড ব্যাচসমূহ দেখুন</span>
              </Link>
              {canManageLive && (
                <Link
                  href="/free-classes/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ক্লাস প্রকাশ করুন</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                        cls.provider === 'google_meet'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                          : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50'
                      }`}
                    >
                      {cls.provider === 'google_meet' ? 'Google Meet' : 'Zoom'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {cls.durationMinutes} মি.
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cls.title}
                  </h3>

                  <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-6">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-semibold">{new Date(cls.startTime).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={cls.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>সরাসরি ক্লাসে যুক্ত হন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
