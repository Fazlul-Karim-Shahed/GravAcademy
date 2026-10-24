'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  User,
  MessageSquare,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface ResultData {
  exam: {
    _id: string;
    title: string;
    totalMarks: number;
    passMarks: number;
    durationMinutes: number;
    examType: string;
    questionMode?: string;
  };
  attempt: {
    _id: string;
    mcqScore: number;
    cqScore: number;
    totalScore: number;
    passed: boolean;
    isEvaluated: boolean;
    teacherFeedback?: string;
    evaluatedBy?: {
      name: string;
    };
    submittedAt: string;
    answers: {
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
      marksAwarded: number;
    }[];
    studentDocumentUrl?: string;
  };
  questions?: {
    _id: string;
    questionText: string;
    options: { optionId: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
    marks: number;
  }[];
}

export default function StudentExamResultPage({
  params,
}: {
  params: Promise<{ batchId: string; examId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId, examId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/result`);
      return;
    }
    if (user && examId) {
      loadResult();
    }
  }, [examId, user, authLoading]);

  const loadResult = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/my-result`);
      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'ফলাফল লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">ফলাফল তৈরি হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">ফলাফল পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {error || 'আপনি সম্ভবত এখনও এই পরীক্ষায় অংশগ্রহণ করেননি।'}
          </p>
          <Link
            href={`/classroom/${batchId}/exams`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>এক্সাম রুমে ফিরে যান</span>
          </Link>
        </div>
      </div>
    );
  }

  const { exam, attempt, questions } = result;
  const percentage = Math.round((attempt.totalScore / exam.totalMarks) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="cosmic-hero-bg text-white pt-8 pb-10 mb-8 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
              পরীক্ষার ফলাফল ও মূল্যায়ন রিপোর্ট
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {exam.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
            জমা দেওয়া হয়েছে: {new Date(attempt.submittedAt).toLocaleString('bn-BD')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* SCORE CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Score circle / Big text */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                প্রাপ্ত মোট নম্বর
              </span>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 mt-2 mb-1">
                {attempt.totalScore}
                <span className="text-xl font-bold text-slate-400"> / {exam.totalMarks}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mt-2">
                {attempt.isEvaluated ? (
                  attempt.passed ? (
                    <span className="text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> পাস ({percentage}%)
                    </span>
                  ) : (
                    <span className="text-rose-600 bg-rose-100 dark:bg-rose-950 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> অকৃতকার্য ({percentage}%)
                    </span>
                  )
                ) : (
                  <span className="text-amber-600 bg-amber-100 dark:bg-amber-950 px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> মূল্যায়ন অপেক্ষমাণ
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 font-bold mb-1">MCQ নম্বর</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {attempt.mcqScore}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 font-bold mb-1">CQ / লিখিত নম্বর</div>
                  <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                    {attempt.isEvaluated ? attempt.cqScore : 'মূল্যায়ন চলছে'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 font-bold mb-1">পাস মার্ক</div>
                  <div className="text-lg font-black text-slate-700 dark:text-slate-300">
                    {exam.passMarks}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 font-bold mb-1">মূল্যায়ন করেছেন</div>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-300 truncate">
                    {attempt.evaluatedBy?.name || 'শিক্ষক'}
                  </div>
                </div>
              </div>

              {/* Teacher Feedback Banner */}
              {attempt.teacherFeedback && (
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs">
                  <div className="font-bold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>শিক্ষকের মন্তব্য ও দিকনির্দেশনা:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    "{attempt.teacherFeedback}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DETAILED MCQ ANSWERS PREVIEW */}
        {questions && questions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>MCQ উত্তরপত্রের বিস্তারিত বিশ্লেষণ</span>
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const studentAns = attempt.answers?.find(
                  (a) => a.questionId?.toString() === q._id?.toString()
                );
                const isCorrect = studentAns?.isCorrect;

                return (
                  <div
                    key={q._id}
                    className={`p-4 rounded-2xl border text-xs ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : studentAns?.selectedOptionId
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-bold text-slate-900 dark:text-white">
                        <span className="mr-1">{idx + 1}.</span> {q.questionText}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? `+${q.marks}` : '০'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt) => {
                        const isStudentPicked = studentAns?.selectedOptionId === opt.optionId;
                        const isTheCorrectOne = q.correctOptionId === opt.optionId;

                        return (
                          <div
                            key={opt.optionId}
                            className={`p-2 rounded-xl text-[11px] font-semibold flex items-center justify-between ${
                              isTheCorrectOne
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                                : isStudentPicked
                                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-300'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span>{opt.text}</span>
                            {isTheCorrectOne && (
                              <span className="text-[10px] font-black text-emerald-600">✓ সঠিক</span>
                            )}
                            {!isTheCorrectOne && isStudentPicked && (
                              <span className="text-[10px] font-black text-rose-600">✗ আপনার উত্তর</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
