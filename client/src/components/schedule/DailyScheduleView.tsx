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
  layout?: 'auto' | 'table' | 'cards';
  cardless?: boolean;
}

export default function DailyScheduleView({
  role = 'student',
  title = "আজকের ও সাপ্তাহিক ক্লাস শিডিউল",
  subtitle,
  layout = 'auto',
  cardless = false,
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
      <div className={cardless ? 'mb-8 bg-transparent border-0 shadow-none' : 'bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-8'}>
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
    <div className={`relative min-w-0 max-w-full overflow-hidden mb-8 ${cardless ? 'p-0 bg-transparent border-0 shadow-none' : 'bg-white dark:bg-[#111318] rounded-[28px] p-6 sm:p-7 border border-slate-200/90 dark:border-[#262b34] shadow-lg shadow-slate-200/30 dark:shadow-black/25'}`}>
      {/* Decorative lighting is intentionally omitted in cardless mode. */}
      {!cardless && <>
        <div className="absolute top-0 right-1/4 w-80 h-36 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-10 w-64 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </>}

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="shrink-0 p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200/70 dark:border-orange-900/60 shadow-xs">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight break-words">
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
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0 shadow-xs self-start sm:self-auto">
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
                  ? 'bg-orange-600 text-white shadow-xs'
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

      {/* Class Schedule Content: Table View (Admin / Monitoring) vs Cards View */}
      {currentClasses.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {currentDayLabel} এ কোনো ক্লাসের শিডিউল নেই
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            অন্যান্য দিনের বার নির্বাচন করে সেই দিনের ক্লাস রুটিন দেখুন।
          </p>
        </div>
      ) : (layout === 'table' || (layout === 'auto' && role === 'admin')) ? (
        /* Simple schedule table for admin monitoring */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#090a0d]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">সময়</th>
                  <th className="px-4 py-3">ক্লাস</th>
                  <th className="px-4 py-3">কোর্স</th>
                  <th className="px-4 py-3">ব্যাচ</th>
                  <th className="px-4 py-3">Manage</th>
                  <th className="px-4 py-3">Enter Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {currentClasses.map((item, index) => {
                  return (
                    <tr
                      key={`${item.batchId}-${index}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {formatTo12Hour(item.startTime)}{item.endTime ? ` – ${formatTo12Hour(item.endTime)}` : ''}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {item.course?.gradeLevel || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[220px]">
                        <span className="block truncate" title={item.course?.title}>{item.course?.title || '—'}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                        {item.batchName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/batches/${item.batchId}/edit`}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          title="ব্যাচ ও ক্লাসের সময়সূচী পরিবর্তন করুন"
                        >
                          Manage
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/classroom/${item.batchId}`}
                          className="inline-flex items-center rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
                        >
                          Enter Classroom
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Regular Card Grid (For Students or Default Card Layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentClasses.map((item, index) => (
            <div
              key={`${item.batchId}-${index}`}
              className="group rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-500/70 transition-colors"
            >

              <div className="relative z-10 space-y-2">
                {/* Header: Time Badge & Class Tag / Meet Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {formatTo12Hour(item.startTime)} {item.endTime ? `- ${formatTo12Hour(item.endTime)}` : ''}
                    </span>
                  </span>

                  {/* Class / Grade Tag or Meet Badge */}
                  {item.course?.gradeLevel ? (
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {item.course.gradeLevel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      লাইভ ক্লাস
                    </span>
                  )}
                </div>

                {/* Batch Name (Primary Title) */}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.batchName}
                  </h4>
                  {/* Course Name (Subtitle) */}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {item.course?.title || 'কোর্স'}
                  </p>
                </div>

                {/* Topic if specified */}
                {item.topic && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">টপিক: {item.topic}</span>
                  </div>
                )}
              </div>

              {/* Action Area: Full-width Join Button & Admin Links */}
              <div className="relative z-10 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 mt-3">
                <Link
                  href={`/classroom/${item.batchId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  title="লাইভ ক্লাসরুমে প্রবেশ করুন"
                >
                  <Video className="w-4 h-4" />
                  <span>ক্লাসরুমে প্রবেশ</span>
                </Link>

                {/* Admin Secondary Quick Links if applicable */}
                {role === 'admin' && (
                  <div className="flex items-center justify-end gap-3 pt-1 text-xs">
                    <Link
                      href={`/admin/batches/${item.batchId}/edit`}
                      className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline text-[11px]"
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
