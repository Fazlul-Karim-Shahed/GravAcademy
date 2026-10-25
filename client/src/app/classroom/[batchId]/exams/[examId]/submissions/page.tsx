'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  User,
  Save,
  Check,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';

interface SubmissionItem {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    studentId?: string;
  };
  submittedAt: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
  cqAnswers?: {
    questionIndex: number;
    answerText: string;
  }[];
  studentDocumentUrl?: string;
  mcqScore: number;
  cqScore: number;
  totalScore: number;
  passed: boolean;
  isEvaluated: boolean;
  teacherFeedback?: string;
  status: string;
}

interface ExamInfo {
  _id: string;
  title: string;
  totalMarks: number;
  passMarks: number;
  durationMinutes: number;
  examType: string;
  questionMode?: string;
  cqQuestions?: { questionText: string; marks: number }[];
}

export default function ExamSubmissionsPage({
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
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);

  // Selected Submission for Evaluation Modal / Drawer
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [evalCqScore, setEvalCqScore] = useState<number>(0);
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [savingEval, setSavingEval] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/submissions`);
      return;
    }
    if (user && examId) {
      loadSubmissions();
    }
  }, [examId, user, authLoading]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/submissions`);
      if (res.data?.success) {
        setExam(res.data.exam);
        setSubmissions(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'সাবমিশন লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const openEvaluation = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setEvalCqScore(sub.cqScore || 0);
    setEvalFeedback(sub.teacherFeedback || '');
    setSaveSuccess(false);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSub) return;
    setSavingEval(true);
    try {
      const res = await api.put(`/exams/attempts/${selectedSub._id}/evaluate`, {
        cqScore: Number(evalCqScore),
        teacherFeedback: evalFeedback.trim(),
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        // Update local state
        setSubmissions((prev) =>
          prev.map((item) =>
            item._id === selectedSub._id
              ? {
                  ...item,
                  cqScore: Number(evalCqScore),
                  totalScore: (item.mcqScore || 0) + Number(evalCqScore),
                  teacherFeedback: evalFeedback.trim(),
                  isEvaluated: true,
                  status: 'evaluated',
                }
              : item
          )
        );

        setTimeout(() => {
          setSelectedSub(null);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'মূল্যায়ন সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setSavingEval(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header */}
      <div className="cosmic-hero-bg text-white pt-8 pb-10 mb-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-full">
              টিচার মূল্যায়ন কেন্দ্র
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {exam?.title || 'খাতা মূল্যায়ন ও মার্কিং'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
            মোট সাবমিশন: {submissions.length} টি • পূর্ণমান: {exam?.totalMarks || 100} • পাস মার্ক: {exam?.passMarks || 40}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border-2 border-purple-500/20 border-t-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">সাবমিশন তালিকা লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
              এখনও কোনো শিক্ষার্থী উত্তরপত্র জমা দেয়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              শিক্ষার্থীরা পরীক্ষা শেষ করে সাবমিট করলে তাদের খাতা এখানে মূল্যায়নের জন্য দেখতে পাবেন।
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">শিক্ষার্থী</th>
                    <th className="py-3.5 px-4">জমার সময়</th>
                    <th className="py-3.5 px-4 text-center">MCQ স্কোর</th>
                    <th className="py-3.5 px-4 text-center">CQ স্কোর</th>
                    <th className="py-3.5 px-4 text-center">মোট নম্বর</th>
                    <th className="py-3.5 px-4 text-center">অবস্থা</th>
                    <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {submissions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={sub.studentId?.name || 'শিক্ষার্থী'}
                            avatarUrl={sub.studentId?.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {sub.studentId?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {sub.studentId?.studentId ? `#${sub.studentId.studentId}` : sub.studentId?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.submittedAt).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {sub.mcqScore}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                        {sub.cqScore}
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white">
                        {sub.totalScore} / {exam?.totalMarks}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {sub.isEvaluated ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            মূল্যায়িত
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            মূল্যায়ন বাকি
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEvaluation(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{sub.isEvaluated ? 'পুনর্মূল্যায়ন' : 'মূল্যায়ন করুন'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Submissions Cards (<md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub) => (
                <div key={sub._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={sub.studentId?.name || 'শিক্ষার্থী'}
                        avatarUrl={sub.studentId?.avatarUrl}
                        size="md"
                      />
                      <div>
                        <div className="font-black text-sm text-slate-900 dark:text-white">
                          {sub.studentId?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sub.studentId?.studentId ? `#${sub.studentId.studentId}` : sub.studentId?.email}
                        </div>
                      </div>
                    </div>
                    {sub.isEvaluated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        মূল্যায়িত
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                        মূল্যায়ন বাকি
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">MCQ</div>
                      <div className="text-xs font-black text-blue-600 dark:text-blue-400">{sub.mcqScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">CQ</div>
                      <div className="text-xs font-black text-purple-600 dark:text-purple-400">{sub.cqScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">মোট</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">{sub.totalScore}/{exam?.totalMarks}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEvaluation(sub)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{sub.isEvaluated ? 'পুনর্মূল্যায়ন করুন' : 'মূল্যায়ন করুন'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EVALUATION MODAL / DRAWER */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  শিক্ষার্থীর খাতা মূল্যায়ন: {selectedSub.studentId?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  MCQ স্বয়ংক্রিয়ভাবে মূল্যায়িত হয়েছে ({selectedSub.mcqScore} নম্বর)। CQ ও ডকুমেন্টের নম্বর দিন।
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 p-2 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* If Student submitted Document / PDF */}
              {selectedSub.studentDocumentUrl && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      শিক্ষার্থীর আপলোড করা উত্তরপত্র
                    </span>
                    <a
                      href={selectedSub.studentDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 underline font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>সম্পূর্ণ ভিউ করুন</span>
                    </a>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-64 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <iframe
                      src={selectedSub.studentDocumentUrl}
                      className="w-full h-full border-0"
                      title="Answer Script"
                    />
                  </div>
                </div>
              )}

              {/* Typed CQ Answers */}
              {selectedSub.cqAnswers && selectedSub.cqAnswers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    সৃজনশীল প্রশ্নের টাইপ করা উত্তর:
                  </h4>
                  {selectedSub.cqAnswers.map((cq) => (
                    <div
                      key={cq.questionIndex}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">
                        প্রশ্ন #{cq.questionIndex + 1}:
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {cq.answerText || 'কোনো লিখিত উত্তর নেই'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Marks Input & Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    CQ / লিখিত অংশের নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={evalCqScore}
                    onChange={(e) => setEvalCqScore(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    মোট নম্বর হবে: {(selectedSub.mcqScore || 0) + Number(evalCqScore)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    শিক্ষকের ফিডব্যাক / মন্তব্য (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="যেমন: খাতার উপস্থাপনা সুন্দর ছিল। আরও অনুশীলন প্রয়োজন।"
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
              >
                বন্ধ করুন
              </button>

              <button
                type="button"
                disabled={savingEval}
                onClick={handleSaveEvaluation}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>সংরক্ষিত হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{savingEval ? 'সংরক্ষণ হচ্ছে...' : 'মূল্যায়ন সংরক্ষণ করুন'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
