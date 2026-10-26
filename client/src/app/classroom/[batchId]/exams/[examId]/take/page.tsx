'use client';

import React, { useEffect, useState, useRef, use } from 'react';
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
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface MCQQuestionOption {
  optionId: string;
  text: string;
  imageUrl?: string;
}

interface MCQQuestion {
  _id: string;
  questionText: string;
  imageUrl?: string;
  options: MCQQuestionOption[];
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
  questionsVersion?: number;
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

  // Live Sync & Network tracking
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [liveUpdatedAlert, setLiveUpdatedAlert] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const questionsVersionRef = useRef<number>(1);

  // Storage key for local draft persistence
  const studentIdentifier = user?.id || user?.userId || 'guest';
  const storageKey = `grav_exam_draft_${examId}_${studentIdentifier}`;

  // Track network online / offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/take`);
      return;
    }
    if (user && examId) {
      loadExam();
    }
  }, [examId, user, authLoading]);

  // Load Exam and verify schedule + restore draft
  const loadExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/take`);
      if (res.data?.success) {
        const { exam: examData, mcqQuestions: questions } = res.data.data;
        setExam(examData);
        setMcqQuestions(questions || []);
        questionsVersionRef.current = examData.questionsVersion || 1;

        // Restore draft answers and timer from localStorage if present
        let restoredTimeLeft = examData.durationMinutes * 60;
        if (storageKey && typeof window !== 'undefined') {
          try {
            const rawDraft = localStorage.getItem(storageKey);
            if (rawDraft) {
              const draft = JSON.parse(rawDraft);
              if (draft.selectedAnswers) setSelectedAnswers(draft.selectedAnswers);
              if (draft.cqAnswers) setCqAnswers(draft.cqAnswers);
              if (draft.studentDocumentUrl) setStudentDocumentUrl(draft.studentDocumentUrl);
              if (typeof draft.timeLeft === 'number' && draft.timeLeft > 0) {
                // Adjust for elapsed time since draft saved
                const elapsedSeconds = draft.savedAt
                  ? Math.floor((Date.now() - draft.savedAt) / 1000)
                  : 0;
                restoredTimeLeft = Math.max(5, draft.timeLeft - elapsedSeconds);
              }
            }
          } catch (e) {
            console.error('Failed to read draft from localStorage:', e);
          }
        }

        setTimeLeft(restoredTimeLeft);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'পরীক্ষার তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Auto save draft to localStorage whenever answers or timer change
  useEffect(() => {
    if (!storageKey || loading || submitting) return;

    try {
      const draftData = {
        selectedAnswers,
        cqAnswers,
        studentDocumentUrl,
        timeLeft,
        savedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save exam draft to localStorage:', e);
    }
  }, [selectedAnswers, cqAnswers, studentDocumentUrl, timeLeft, storageKey, loading, submitting]);

  // Live Question Sync (Silent Background Polling every 7 seconds)
  // If teacher edits questions during live exam, questions update smoothly without wipe
  useEffect(() => {
    if (loading || submitting || !exam) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await api.get(`/exams/${examId}/take`);
        if (res.data?.success) {
          const { exam: latestExam, mcqQuestions: latestQuestions } = res.data.data;
          const newVersion = latestExam.questionsVersion || 1;

          if (newVersion !== questionsVersionRef.current) {
            questionsVersionRef.current = newVersion;
            setExam((prev) => (prev ? { ...prev, ...latestExam } : latestExam));
            setMcqQuestions(latestQuestions || []);
            setLiveUpdatedAlert(true);
            setTimeout(() => setLiveUpdatedAlert(false), 5000);
          }
        }
      } catch (e) {
        // Silent fail on background poll (e.g. temporary offline)
      }
    }, 7000);

    return () => clearInterval(syncInterval);
  }, [examId, loading, submitting, exam]);

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
        // Clear local storage draft upon successful submission
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {}
        }
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
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3 shadow-sm">
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
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                <span>পূর্ণমান: {exam.totalMarks} • পাস: {exam.passMarks}</span>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                    <WifiOff className="w-3 h-3" />
                    <span>ইন্টারনেট বিচ্ছিন্ন (অ্যানসার সেভ আছে)</span>
                  </span>
                )}
              </div>
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
        {/* Live Question Update Alert Banner */}
        {liveUpdatedAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3 animate-bounce">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 animate-spin" />
            <div className="font-bold">
              শিক্ষক প্রশ্নপত্র আপডেট করেছেন এবং আপনার স্ক্রিনে তা রিয়েল-টাইমে যুক্ত হয়েছে! আপনার দেওয়া পূর্ববর্তী উত্তর সুরক্ষিত রয়েছে।
            </div>
          </div>
        )}

        {/* Offline indicator message if connection drops */}
        {!isOnline && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">ইন্টারনেট সংযোগ সাময়িকভাবে বিচ্ছিন্ন: </span>
              চিন্তা করবেন না, আপনার সিলেক্ট করা সমস্ত উত্তর লোকাল স্টোরেজে নিরাপদে সংরক্ষিত হচ্ছে। পেজ রিলোড হলেও কোনো উত্তর হারাবে না!
            </div>
          </div>
        )}

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

                      {/* Optional Question Image Attachment */}
                      {q.imageUrl && (
                        <div className="my-3 max-w-md rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img
                            src={q.imageUrl}
                            alt={`Question ${idx + 1} Diagram`}
                            className="w-full max-h-72 object-contain bg-white dark:bg-slate-900 p-2"
                          />
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[q._id] === opt.optionId;
                          return (
                            <button
                              key={opt.optionId}
                              type="button"
                              onClick={() => handleSelectOption(q._id, opt.optionId)}
                              className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-600'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
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
                              </div>

                              {/* Option Image if available */}
                              {opt.imageUrl && (
                                <div className="pl-8 pt-1 max-w-[200px]">
                                  <img
                                    src={opt.imageUrl}
                                    alt={`Option ${optIdx + 1}`}
                                    className="max-h-28 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1"
                                  />
                                </div>
                              )}
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
                        placeholder="আপনার উত্তর এখানে টাইপ করুন (অথবা নিচে সম্পূর্ণ উত্তরপত্র আপলোড করতে পারেন)..."
                        value={cqAnswers[idx] || ''}
                        onChange={(e) => handleCqTextChange(idx, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* SECTION 4: STUDENT ANSWER SHEET UPLOAD (CQ / PAPER MODE) */}
          {(exam.examType === 'upload_paper' ||
            exam.questionMode === 'cq' ||
            exam.questionMode === 'both') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                  <span>উত্তরপত্রের ছবি বা PDF আপলোড (Answer Sheet Upload)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  খাতায় লেখা উত্তরের ছবি তুলুন বা PDF বানিয়ে এখানে আপলোড করুন
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingDoc ? 'আপলোড হচ্ছে...' : 'উত্তরপত্র আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleAnswerDocUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-500">অথবা সরাসরি ফাইল লিংক দিন:</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={studentDocumentUrl}
                    onChange={(e) => setStudentDocumentUrl(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {studentDocumentUrl && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      উত্তরপত্র যুক্ত করা হয়েছে
                    </span>
                    <a
                      href={studentDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      উত্তরপত্র প্রিভিউ
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON BAR */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-slate-500 font-medium">
              আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে সংরক্ষিত রয়েছে
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'জমা দেওয়া হচ্ছে...' : 'পরীক্ষা সম্পন্ন ও জমা দিন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
