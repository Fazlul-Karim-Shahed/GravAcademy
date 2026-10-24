'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  PlusCircle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Award,
  ChevronRight,
  BookOpen,
  HelpCircle,
  UploadCloud,
  FileCheck,
  Flame,
  Users,
  Timer,
} from 'lucide-react';

interface ExamItem {
  _id: string;
  batchId: string;
  title: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  startWindow: string;
  endWindow: string;
  examType: 'upload_paper' | 'system_questions';
  questionMode?: 'mcq' | 'cq' | 'both';
  questionPaperUrl?: string;
  myAttempt?: {
    _id: string;
    status: 'in_progress' | 'submitted' | 'evaluated' | 'timeout' | 'abandoned';
    totalScore: number;
    mcqScore: number;
    cqScore: number;
    passed: boolean;
    isEvaluated: boolean;
    submittedAt?: string;
  } | null;
}

export default function ExamRoomPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const isTeacherOrAdmin =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin';

  useEffect(() => {
    // Keep local clock updated every second for live timers
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams`);
      return;
    }
    if (user && batchId) {
      loadExams();
    }
  }, [batchId, user, authLoading]);

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/batches/${batchId}/exams`);
      if (res.data?.success) {
        setExams(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load exams:', err);
      setError(err.response?.data?.message || 'এক্সাম লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getExamTimingStatus = (exam: ExamItem) => {
    const start = new Date(exam.startWindow);
    const end = new Date(exam.endWindow);
    const now = currentTime;

    if (now < start) {
      const diffMs = start.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let startsInText = '';
      if (diffDays > 0) startsInText = `${diffDays} দিন পর`;
      else if (diffHours > 0) startsInText = `${diffHours} ঘণ্টা ${diffMins % 60} মিনিট পর`;
      else startsInText = `${diffMins} মিনিট পর`;

      return {
        state: 'UPCOMING',
        badge: 'আসন্ন পরীক্ষা',
        startsInText,
        canStart: false,
      };
    } else if (now >= start && now <= end) {
      const diffMs = end.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return {
        state: 'RUNNING',
        badge: 'চলমান পরীক্ষা',
        endsInText: `${diffMins} মিনিট বাকি`,
        canStart: true,
      };
    } else {
      return {
        state: 'ENDED',
        badge: 'সময় সমাপ্ত',
        canStart: false,
      };
    }
  };

  const formatBanglaDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('bn-BD', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-8 pb-10 sm:pt-10 sm:pb-12 mb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-rose-950/40 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <Link
                  href={`/classroom/${batchId}`}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
                  title="ক্লাসরুমে ফিরুন"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-300 font-bold bg-rose-950/60 border border-rose-500/40 px-3 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>এক্সাম রুম ও মূল্যায়ন কেন্দ্র</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-normal leading-[1.35] pt-1">
                পরীক্ষা ও মূল্যায়ন হল
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
                নির্ধারিত সময়ের মধ্যে পরীক্ষায় অংশগ্রহণ করুন অথবা ফলাফল পর্যবেক্ষণ করুন
              </p>
            </div>

            {/* Teacher Actions */}
            {isTeacherOrAdmin && (
              <div className="flex items-center gap-3">
                <Link
                  href={`/classroom/${batchId}/exams/create`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন এক্সাম তৈরি করুন</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border-2 border-rose-500/20 border-t-rose-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">পরীক্ষার তালিকা লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
              এখনও কোনো পরীক্ষা যোগ করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              শিক্ষক পরীক্ষা শিডিউল করলে এখানে স্বয়ংক্রিয়ভাবে নোটিশ ও প্রশ্নপত্র দেখতে পাবেন।
            </p>
            {isTeacherOrAdmin && (
              <Link
                href={`/classroom/${batchId}/exams/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>প্রথম এক্সাম তৈরি করুন</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const timing = getExamTimingStatus(exam);
              const attempt = exam.myAttempt;

              return (
                <div
                  key={exam._id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  {/* Top Status Badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {timing.state === 'RUNNING' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>চলমান পরীক্ষা</span>
                        </span>
                      ) : timing.state === 'UPCOMING' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timing.badge} ({timing.startsInText})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <span>সময় সমাপ্ত</span>
                        </span>
                      )}

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                        {exam.examType === 'upload_paper'
                          ? 'পেপার আপলোড'
                          : exam.questionMode === 'both'
                          ? 'MCQ + CQ'
                          : exam.questionMode === 'cq'
                          ? 'CQ প্রশ্ন'
                          : 'MCQ পরীক্ষা'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {exam.title}
                    </h3>

                    {exam.instructions && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                        {exam.instructions}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-5 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Timer className="w-3.5 h-3.5 text-blue-500" />
                        <span>সময়: <strong>{exam.durationMinutes} মি.</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>মোট নম্বর: <strong>{exam.totalMarks}</strong></span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span>শুরু: {formatBanglaDate(exam.startWindow)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions based on Role & Student Attempt State */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {isTeacherOrAdmin ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/classroom/${batchId}/exams/${exam._id}/submissions`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <Users className="w-4 h-4" />
                          <span>খাতা মূল্যায়ন ও রেজাল্ট</span>
                        </Link>
                      </div>
                    ) : attempt ? (
                      // Student already attempted
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                          <span className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {attempt.isEvaluated ? 'ফলাফল প্রকাশিত' : 'খাতা জমা হয়েছে'}
                          </span>
                          <span className="font-black text-sm">
                            {attempt.isEvaluated ? `${attempt.totalScore} / ${exam.totalMarks}` : 'অপেক্ষমাণ'}
                          </span>
                        </div>
                        <Link
                          href={`/classroom/${batchId}/exams/${exam._id}/result`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                        >
                          <span>বিস্তারিত রেজাল্ট দেখুন</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : timing.state === 'RUNNING' ? (
                      // Active Exam: Student can take it!
                      <Link
                        href={`/classroom/${batchId}/exams/${exam._id}/take`}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>পরীক্ষায় অংশ নিন (Start Now)</span>
                      </Link>
                    ) : timing.state === 'UPCOMING' ? (
                      // Upcoming Exam: Locked with message
                      <button
                        disabled
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        <span>নির্ধারিত সময়ে উন্মুক্ত হবে ({timing.startsInText})</span>
                      </button>
                    ) : (
                      // Ended
                      <button
                        disabled
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>পরীক্ষার নির্ধারিত সময় অতিক্রান্ত</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
