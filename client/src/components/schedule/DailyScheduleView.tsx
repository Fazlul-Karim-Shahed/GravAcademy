'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DAYS_OF_WEEK, DayOfWeek, formatTo12Hour } from '@/lib/schedule';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  Video,
  ExternalLink,
} from 'lucide-react';

interface ScheduleClassItem {
  batchId: string;
  batchName: string;
  status: string;
  course: {
    _id: string;
    title: string;
    gradeLevel?: string;
    subject?: string;
  };
  assignedTeachers?: { name: string; email: string }[];
  day: DayOfWeek;
  startTime: string;
  endTime?: string;
  topic?: string;
  meetingUrl?: string;
}

interface DailyScheduleData {
  today: {
    day: DayOfWeek;
    label: { en: string; bn: string };
    classesCount: number;
    classes: ScheduleClassItem[];
  };
  scheduleByDay: Record<string, ScheduleClassItem[]>;
  dayLabels: Record<string, { en: string; bn: string }>;
  daysOrder: string[];
}

interface DailyScheduleViewProps {
  role?: 'admin' | 'teacher' | 'student';
  title?: string;
  subtitle?: string;
}

export default function DailyScheduleView({
  role = 'student',
  title = "আজকের ও সাপ্তাহিক ক্লাস শিডিউল",
  subtitle,
}: DailyScheduleViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DailyScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DayOfWeek>('saturday');

  useEffect(() => {
    fetchScheduleOverview();

    const handleFocus = () => {
      fetchScheduleOverview(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  const fetchScheduleOverview = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get(`/batches/schedule/overview?_t=${Date.now()}`);
      if (res.data?.success) {
        setData(res.data);
        if (res.data.today?.day) {
          setActiveTab(res.data.today.day);
        }
      }
    } catch (err) {
      console.error('Failed to fetch schedule overview:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-8">
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-950 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentClasses = data.scheduleByDay[activeTab] || [];
  const currentDayLabel = `${data.dayLabels[activeTab]?.bn} এর ক্লাস`;

  return (
    <div className="relative overflow-hidden bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border-2 border-slate-200/90 dark:border-slate-800/90 shadow-xl mb-8">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-36 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-10 w-64 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-blue-500/20 dark:from-indigo-500/30 dark:to-blue-500/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Today Summary Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>
            আজ {data.today.label?.bn}: <strong className="font-extrabold">{data.today.classesCount} টি</strong> ক্লাস
          </span>
        </div>
      </div>

      {/* Day Selector Pills Bar */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
        {DAYS_OF_WEEK.map((d) => {
          const count = (data.scheduleByDay[d.key] || []).length;
          const isSelected = activeTab === d.key;
          const isToday = data.today.day === d.key;

          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveTab(d.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 relative ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isToday
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{d.shortBn}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isToday
                      ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards Grid */}
      {currentClasses.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Calendar className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {currentDayLabel} এ কোনো ক্লাসের শিডিউল নেই
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            অন্যান্য দিনের বার নির্বাচন করে সেই দিনের ক্লাস রুটিন দেখুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentClasses.map((item, index) => (
            <div
              key={`${item.batchId}-${index}`}
              className="group relative overflow-hidden p-5 rounded-[24px] bg-slate-50/70 dark:bg-slate-800/50 border-2 border-slate-200/80 dark:border-slate-700/70 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Top Accent Gradient Border Glow */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header: Time Badge & Meet Status */}
                <div className="flex items-center justify-between gap-2 mb-3.5 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200/80 dark:border-emerald-800/80">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {formatTo12Hour(item.startTime)} {item.endTime ? `- ${formatTo12Hour(item.endTime)}` : ''}
                    </span>
                  </span>

                  {/* Google Meet Platform Indicator */}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Google Meet
                  </span>
                </div>

                {/* Batch Name (Primary Title) */}
                <h4 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.batchName}
                </h4>

                {/* Course Name (Subtitle) */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-semibold mb-3">
                  {item.course?.title || 'কোর্স'}
                </p>

                {/* Topic if specified */}
                {item.topic && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-3 font-medium flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{item.topic}</span>
                  </div>
                )}
              </div>

              {/* Action Area: Full-width or Prominent Join Button & Admin/Teacher Links */}
              <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 space-y-2">
                {item.meetingUrl ? (
                  <a
                    href={item.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
                    title="Google Meet-এ ক্লাসরুমে প্রবেশ করুন"
                  >
                    <Video className="w-4 h-4" />
                    <span>ক্লাসরুমে প্রবেশ</span>
                  </a>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 font-medium bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    মিট লিংক শীঘ্রই প্রদান করা হবে
                  </div>
                )}

                {/* Admin Secondary Quick Links if applicable */}
                {role === 'admin' && (
                  <div className="flex items-center justify-end gap-3 pt-1 text-xs">
                    <Link
                      href={`/admin/batches/${item.batchId}/edit`}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                    >
                      <span>ম্যানেজ</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
