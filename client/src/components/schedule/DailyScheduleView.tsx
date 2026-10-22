'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
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
  subtitle = "প্রতিদিনের নির্ধারিত ক্লাস সময়সূচী ও ব্যাচ রুটিন",
}: DailyScheduleViewProps) {
  const [data, setData] = useState<DailyScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DayOfWeek>('saturday');

  useEffect(() => {
    fetchScheduleOverview();
  }, []);

  const fetchScheduleOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/batches/schedule/overview');
      if (res.data?.success) {
        setData(res.data);
        if (res.data.today?.day) {
          setActiveTab(res.data.today.day);
        }
      }
    } catch (err) {
      console.error('Failed to fetch schedule overview:', err);
    } finally {
      setLoading(false);
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
    <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* Today Summary Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-black shrink-0">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            আজ {data.today.label?.bn}: {data.today.classesCount} টি ক্লাস
          </span>
        </div>
      </div>

      {/* Day Selector Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClasses.map((item, index) => (
            <div
              key={`${item.batchId}-${index}`}
              className="group p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Time Pill & Grade Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-100/70 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-black">
                    <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>
                      {formatTo12Hour(item.startTime)} {item.endTime ? `- ${formatTo12Hour(item.endTime)}` : ''}
                    </span>
                  </span>

                  {item.course?.gradeLevel && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      {item.course.gradeLevel}
                    </span>
                  )}
                </div>

                {/* Batch Name */}
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.batchName}
                </h4>

                {/* Course Name */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium mb-2">
                  {item.course?.title || 'Course'}
                </p>

                {/* Topic if specified */}
                {item.topic && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-2 font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{item.topic}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {item.day}
                </span>

                {role === 'student' ? (
                  <Link
                    href={`/learn/${item.batchId}`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>ক্লাসরুমে যান</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : role === 'teacher' ? (
                  <Link
                    href={`/admin/batches/${item.batchId}/curriculum`}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>কারিকুলাম</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/admin/batches/${item.batchId}/edit`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>ম্যানেজ করুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
