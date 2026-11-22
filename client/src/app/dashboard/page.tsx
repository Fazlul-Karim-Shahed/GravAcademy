'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  PhoneCall,
  ArrowRight,
  Video,
  PlayCircle,
  FileText,
  AlertCircle,
  Compass,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  IdCard,
  Hash,
  User,
  CreditCard,
} from 'lucide-react';
import DailyScheduleView from '@/components/schedule/DailyScheduleView';

interface BatchInfo {
  _id: string;
  name: string;
  courseId: {
    _id: string;
    title: string;
    gradeLevel: string;
    subject: string;
    slug?: string;
  };
  scheduleText?: string;
  meetingUrl?: string;
  status: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch only batches the student has actually enrolled in
      const res = await api.get('/enrollments/my-batches');
      if (res.data?.success) {
        const nextBatches = res.data.data || [];
        setBatches(nextBatches);
        setSelectedBatchId((current) =>
          current && nextBatches.some((batch: BatchInfo) => batch._id === current)
            ? current
            : nextBatches[0]?._id || ''
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ga-page ga-dashboard-page text-slate-900 dark:text-slate-100 transition-colors pb-14">
      
      <header className="border-b border-slate-200 bg-white/80 py-6 dark:border-[#262b34] dark:bg-[#111318]/80 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                স্বাগতম,{' '}
                  <span className="text-orange-600 dark:text-orange-400">
                  {user?.name || 'শিক্ষার্থী'}!
                </span>
              </h1>

              {/* Unique Grav ID Display (Visible on mobile/small screens below greeting) */}
              {user?.gravId && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 md:hidden">
                  <span className="text-xs font-semibold text-slate-500">Grav ID:</span>
                  <span className="select-all font-mono text-xs font-black tracking-wider text-orange-600 dark:text-orange-400">
                    {user.gravId}
                  </span>
                </div>
              )}

            </div>

            {/* Right section: Grav ID (large screen) + Quick Actions */}
            <div className="flex flex-col md:items-end gap-3 self-start md:self-auto w-full md:w-auto min-w-0">
              {/* Unique Grav ID Display (Visible on md/lg screens on the right) */}
              {user?.gravId && (
                <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 md:inline-flex">
                  <span className="text-xs font-semibold text-slate-500">Grav ID:</span>
                  <span className="select-all font-mono text-xs font-black tracking-wider text-orange-600 dark:text-orange-400">
                    {user.gravId}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Link
                  href="/dashboard/payments"
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-700 transition-colors hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 md:flex-none"
                >
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <span>পেমেন্ট</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-700 transition-colors hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 md:flex-none"
                >
                  <User className="w-4 h-4 text-orange-500" />
                  <span>প্রোফাইল</span>
                </Link>
                <Link
                  href="/courses"
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 px-3.5 py-2.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-orange-700 md:flex-none"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>কোর্স</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* 2. Primary Feature: Interactive Daily & Weekly Class Schedule */}
        <div className="order-2">
          <DailyScheduleView
            role="student"
            cardless
            title="আজকের ও সাপ্তাহিক ক্লাস রুটিন"
          />
        </div>

        {/* 3. Generic quick access for the selected student batch */}
        {!loading && batches.length > 0 && (
          <div className="space-y-4 order-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/60 dark:border-orange-800/60">
                  <Compass className="w-4 h-4" />
                </div>
                <span>দরকারি লিংক</span>
              </h2>
              <select
                value={selectedBatchId}
                onChange={(event) => setSelectedBatchId(event.target.value)}
                className="w-full sm:w-80 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#111318] px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                aria-label="ব্যাচ নির্বাচন করুন"
              >
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} — {batch.courseId?.title}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedBatch = batches.find((batch) => batch._id === selectedBatchId);
              if (!selectedBatch) return null;

              const quickLinks = [
                { href: `/classroom/${selectedBatch._id}`, label: 'ক্লাসরুম', icon: Video },
                { href: `/classroom/${selectedBatch._id}/assignments`, label: 'অ্যাসাইনমেন্ট', icon: FileCheck2 },
                { href: `/classroom/${selectedBatch._id}/exams`, label: 'এক্সাম', icon: FileText },
                { href: `/learn/${selectedBatch._id}`, label: 'লেকচার', icon: BookOpen },
                { href: `/classroom/${selectedBatch._id}/marksheet`, label: 'ফলাফল', icon: CheckCircle2 },
              ];

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {quickLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="group rounded-2xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#111318] p-3 sm:p-3.5 shadow-sm hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-md transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50/70 dark:bg-[#151921] text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{link.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-1.5 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. Enrolled Batches: Curriculum & Study Materials */}
        <div className="space-y-6 order-3">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/60 dark:border-orange-800/60">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>আপনার সক্রিয় ব্যাচসমূহ</span>
              </h2>
            </div>
            <Link href="/courses" className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 hover:text-orange-500 font-black hidden sm:flex items-center gap-1 transition-colors">
              <span>সকল কোর্স তালিকা</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] animate-pulse p-5 space-y-4"
                >
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-2xl p-10 bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#151921] text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">কোনো ব্যাচে এখনো এনরোল করা হয়নি</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                কোর্স ক্যাটালগ থেকে আপনার শ্রেণির ব্যাচে যুক্ত হন।
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold transition-all shadow-md shadow-orange-950/25"
              >
                <span>কোর্স ক্যাটালগ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {batches.map((batch) => (
                <div
                  key={batch._id}
                  className="group rounded-xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] p-4 flex flex-col justify-between hover:border-orange-500/70 transition-colors"
                >
                  <div className="relative z-10 space-y-3">
                    {/* Class Tag (Aligned Right) */}
                    <div className="flex items-center justify-end">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {batch.courseId?.gradeLevel || 'একাডেমিক'}
                      </span>
                    </div>

                    {/* Course Title as Primary Heading */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                        {batch.courseId?.title || batch.name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                          {batch.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Action Bar: Direct Classroom & Study Material Entry */}
                  <div className="pt-3 mt-4 border-t border-slate-100 dark:border-[#262b34] flex items-center gap-2">
                    <Link
                      href={`/classroom/${batch._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1c222c] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors"
                      title="নোটিশ ও সহপাঠীদের ডিসকাশন"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>ক্লাসরুম</span>
                    </Link>

                    <Link
                      href={`/learn/${batch._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-[11px] font-bold shadow-md shadow-orange-950/25 transition-all"
                      title="রেকর্ড ক্লাস ও পড়ালেখার ম্যাটেরিয়াল"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-orange-100" />
                      <span>পড়া শুরু করুন</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Helpline & Support Strip */}
        <div className="ga-card order-4 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-950/25">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 dark:text-white block">ক্লাস বা পড়া বুঝতে যেকোনো সমস্যায় সার্বক্ষণিক সহায়তা</span>
              <span className="text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">আমাদের শিক্ষক ও একাডেমিক কেয়ার টিম সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয়।</span>
            </div>
          </div>
            <div className="flex items-center gap-2 self-start sm:self-auto max-w-full">
            <span className="font-black text-xs text-white text-center bg-gradient-to-r from-orange-600 to-orange-700 px-3 py-2 rounded-xl max-w-full shadow-md shadow-orange-950/20">
              📞 হেল্পলাইন: 16910
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
