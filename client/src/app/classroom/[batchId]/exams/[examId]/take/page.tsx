'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Send,
  Timer,
  Award,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface MCQQuestion {
  _id: string;
  questionText: string;
  options: { optionId: string; text: string }[];
  marks: number;
  order: number;
}

interface CQQuestion {
  questionText: string;
  marks: number;
}

interface ExamData {
  _id: string;
  batchId: string;
  title: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarkPerWrong: number;
  startWindow: string;
  endWindow: string;
  examType: 'upload_paper' | 'system_questions';
  questionMode?: 'mcq' | 'cq' | 'both';
  questionPaperUrl?: string;
  cqQuestions?: CQQuestion[];
}

export default function TakeExamPage({
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
  const [exam, setExam] = useState<ExamData | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);

  // Answers State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // { [questionId]: optionId }
  const [cqAnswers, setCqAnswers] = useState<Record<number, string>>({}); // { [questionIndex]: answerText }
  const [studentDocumentUrl, setStudentDocumentUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/take`);
      return;
    }
    if (user && examId) {
      loadExam();
    }
  }, [examId, user, authLoading]);

  // Load Exam and verify schedule
  const loadExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/take`);
      if (res.data?.success) {
        const { exam, mcqQuestions } = res.data.data;
        setExam(exam);
        setMcqQuestions(mcqQuestions || []);

        // Calculate timer remaining from duration
        // Initial timer in seconds
        setTimeLeft(exam.durationMinutes * 60);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'পরীক্ষার তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Live Timer Countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleCqTextChange = (qIndex: number, text: string) => {
    setCqAnswers((prev) => ({
      ...prev,
      [qIndex]: text,
    }));
  };

  // Upload student handwritten answer sheets / document
  const handleAnswerDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post('/finance/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setStudentDocumentUrl(res.data.data.fileUrl);
      }
    } catch (err: any) {
      console.error(err);
      alert('উত্তরপত্রের ফাইল আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('⚠️ পরীক্ষার সময় শেষ হয়ে গিয়েছে! আপনার উত্তর স্বয়ংক্রিয়ভাবে জমা দেওয়া হচ্ছে।');
    submitFinalExam();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('আপনি কি নিশ্চিত যে আপনার উত্তরপত্র জমা দিতে চান?')) {
      submitFinalExam();
    }
  };

  const submitFinalExam = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answersArray = Object.entries(selectedAnswers).map(([qId, optId]) => ({
        questionId: qId,
        selectedOptionId: optId,
      }));

      const cqAnswersArray = Object.entries(cqAnswers).map(([idx, text]) => ({
        questionIndex: Number(idx),
        answerText: text,
      }));

      const payload = {
        answers: answersArray,
        cqAnswers: cqAnswersArray,
        studentDocumentUrl: studentDocumentUrl.trim(),
      };

      const res = await api.post(`/exams/${examId}/submit`, payload);
      if (res.data?.success) {
        setSubmittedNotice(res.data.message || 'পরীক্ষা সফলভাবে জমা দেওয়া হয়েছে!');
        setTimeout(() => {
          router.push(`/classroom/${batchId}/exams/${examId}/result`);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'উত্তরপত্র জমা দিতে ব্যর্থ হয়েছে');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border-2 border-rose-500/20 border-t-rose-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">প্রশ্নপত্র প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">পরীক্ষায় প্রবেশ নিষেধ</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {error || 'পরীক্ষাটি বর্তমানে উন্মুক্ত নয়।'}
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
      {/* Sticky Exam Top Bar with Timer */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              title="বের হয়ে যান"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                {exam.title}
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold">
                পূর্ণমান: {exam.totalMarks} • পাস মার্ক: {exam.passMarks}
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-sm transition-all ${
                timeLeft < 300
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-900 text-white dark:bg-slate-800 border border-slate-700'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>অবশিষ্ট সময়: {formatTimer(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Exam Instructions Banner */}
        {exam.instructions && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-black">পরীক্ষার্থীদের জন্য সাধারণ নির্দেশনা: </span>
              {exam.instructions}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: QUESTION PAPER PREVIEW (IF UPLOADED PAPER) */}
          {exam.examType === 'upload_paper' && exam.questionPaperUrl && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>প্রশ্নপত্র (Question Paper)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    নিচের প্রশ্নপত্র দেখে খাতায় উত্তর লিখে ছবি বা PDF আপলোড করুন
                  </p>
                </div>
                <a
                  href={exam.questionPaperUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>নতুন ট্যাবে খুলুন</span>
                </a>
              </div>

              {/* Embedded Document Viewer */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 h-[520px] flex items-center justify-center">
                {exam.questionPaperUrl.endsWith('.pdf') || exam.questionPaperUrl.includes('drive.google.com') ? (
                  <iframe
                    src={exam.questionPaperUrl}
                    className="w-full h-full border-0"
                    title="Question Paper Preview"
                  />
                ) : (
                  <img
                    src={exam.questionPaperUrl}
                    alt="Question Paper"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: SYSTEM MCQ QUESTIONS */}
          {exam.examType === 'system_questions' &&
            (exam.questionMode === 'mcq' || exam.questionMode === 'both') &&
            mcqQuestions.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <span>বহুনির্বাচনি প্রশ্ন (MCQ Section)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    প্রতিটি প্রশ্নের জন্য সঠিক বৃত্ত / অপশনে ক্লিক করুন (মোট {mcqQuestions.length} টি প্রশ্ন)
                  </p>
                </div>

                <div className="space-y-6">
                  {mcqQuestions.map((q, idx) => (
                    <div
                      key={q._id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mr-1.5">
                            {idx + 1}.
                          </span>
                          {q.questionText}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                          {q.marks} নম্বর
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[q._id] === opt.optionId;
                          return (
                            <button
                              key={opt.optionId}
                              type="button"
                              onClick={() => handleSelectOption(q._id, opt.optionId)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-600'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs font-semibold">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* SECTION 3: SYSTEM CQ QUESTIONS */}
          {exam.examType === 'system_questions' &&
            (exam.questionMode === 'cq' || exam.questionMode === 'both') &&
            exam.cqQuestions &&
            exam.cqQuestions.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>সৃজনশীল / রচনামূলক প্রশ্ন (CQ Section)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    নিচে টেক্সট বক্সে উত্তর লিখুন অথবা খাতায় লিখে নিচে এক সাথে ছবি / PDF আপলোড করুন
                  </p>
                </div>

                <div className="space-y-6">
                  {exam.cqQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                          <span className="text-purple-600 dark:text-purple-400 font-bold mr-1.5">
                            CQ {idx + 1}.
                          </span>
                          {q.questionText}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shrink-0">
                          {q.marks} নম্বর
                        </span>
                      </div>

                      <textarea
                        rows={4}
                        placeholder="এখানে আপনার উত্তর টাইপ করুন (অথবা সম্পূর্ণ উত্তরপত্র নিচে আপলোড করুন)..."
                        value={cqAnswers[idx] || ''}
                        onChange={(e) => handleCqTextChange(idx, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* SECTION 4: DOCUMENT / HANDWRITTEN ANSWER SHEET SUBMISSION */}
          {(exam.examType === 'upload_paper' ||
            exam.questionMode === 'cq' ||
            exam.questionMode === 'both') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <span>উত্তরপত্রের ডকুমেন্ট / ছবি সাবমিট করুন</span>
                </h2>
                <p className="text-xs text-slate-500">
                  খাতায় লেখা উত্তরের ছবি তুলে বা PDF আকারে আপলোড করুন। শিক্ষক দেখে মূল্যায়ন করবেন।
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all w-full sm:w-auto">
                    <UploadCloud className="w-4 h-4 shrink-0" />
                    <span>{uploadingDoc ? 'আপলোড হচ্ছে...' : 'উত্তরপত্র ফাইল আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleAnswerDocUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-slate-500 text-center sm:text-left">অথবা Google Drive লিংক দিন:</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={studentDocumentUrl}
                    onChange={(e) => setStudentDocumentUrl(e.target.value)}
                    className="w-full sm:flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {studentDocumentUrl && (
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      উত্তরপত্র যুক্ত হয়েছে
                    </span>
                    <a
                      href={studentDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold"
                    >
                      ডকুমেন্ট ভিউ করুন
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FINAL SUBMISSION BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 sm:py-4 px-4 sm:px-6 z-40 shadow-xl">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
                নিশ্চিত হয়ে জমা দিন। সময় শেষ হওয়ার পূর্বেই সাবমিট করা বাধ্যতামূলক।
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'জমা হচ্ছে...' : 'পরীক্ষা সমাপ্ত ও সাবমিট করুন'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
