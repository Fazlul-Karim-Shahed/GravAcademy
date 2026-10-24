'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Award,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface MCQQuestionInput {
  questionText: string;
  options: { optionId: string; text: string }[];
  correctOptionId: string;
  marks: number;
}

interface CQQuestionInput {
  questionText: string;
  marks: number;
}

export default function CreateExamPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const router = useRouter();
  const { user } = useAuth();

  // Basic Information
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [negativeMarkPerWrong, setNegativeMarkPerWrong] = useState(0);

  // Scheduling
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });

  // Question Creation Options
  const [examType, setExamType] = useState<'upload_paper' | 'system_questions'>('system_questions');
  const [questionPaperUrl, setQuestionPaperUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // System Questions Mode: 'mcq' | 'cq' | 'both'
  const [questionMode, setQuestionMode] = useState<'mcq' | 'cq' | 'both'>('mcq');

  // MCQ Questions State
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestionInput[]>([
    {
      questionText: '',
      options: [
        { optionId: 'opt_1', text: '' },
        { optionId: 'opt_2', text: '' },
        { optionId: 'opt_3', text: '' },
        { optionId: 'opt_4', text: '' },
      ],
      correctOptionId: 'opt_1',
      marks: 1,
    },
  ]);

  // CQ Questions State
  const [cqQuestions, setCqQuestions] = useState<CQQuestionInput[]>([
    { questionText: '', marks: 10 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Question Paper Upload via API
  const handlePaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post('/finance/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setQuestionPaperUrl(res.data.data.fileUrl);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'প্রশ্নপত্র ফাইল আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploadingDoc(false);
    }
  };

  // MCQ Question Builders
  const addMcqQuestion = () => {
    setMcqQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: [
          { optionId: 'opt_1', text: '' },
          { optionId: 'opt_2', text: '' },
          { optionId: 'opt_3', text: '' },
          { optionId: 'opt_4', text: '' },
        ],
        correctOptionId: 'opt_1',
        marks: 1,
      },
    ]);
  };

  const removeMcqQuestion = (index: number) => {
    setMcqQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMcqText = (index: number, text: string) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[index].questionText = text;
      return copy;
    });
  };

  const updateMcqOption = (qIdx: number, optIdx: number, text: string) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx].text = text;
      return copy;
    });
  };

  const setCorrectOption = (qIdx: number, optionId: string) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].correctOptionId = optionId;
      return copy;
    });
  };

  const updateMcqMarks = (index: number, marks: number) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[index].marks = marks;
      return copy;
    });
  };

  // CQ Question Builders
  const addCqQuestion = () => {
    setCqQuestions((prev) => [...prev, { questionText: '', marks: 10 }]);
  };

  const removeCqQuestion = (index: number) => {
    setCqQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCqText = (index: number, text: string) => {
    setCqQuestions((prev) => {
      const copy = [...prev];
      copy[index].questionText = text;
      return copy;
    });
  };

  const updateCqMarks = (index: number, marks: number) => {
    setCqQuestions((prev) => {
      const copy = [...prev];
      copy[index].marks = marks;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('অনুগ্রহ করে এক্সামের নাম প্রদান করুন');
      return;
    }

    if (examType === 'upload_paper' && !questionPaperUrl.trim()) {
      setErrorMessage('অনুগ্রহ করে প্রশ্নপত্র ফাইল বা ডকুমেন্টের লিংক আপলোড করুন');
      return;
    }

    if (examType === 'system_questions') {
      if (questionMode === 'mcq' || questionMode === 'both') {
        const invalidMcq = mcqQuestions.some(
          (q) => !q.questionText.trim() || q.options.some((opt) => !opt.text.trim())
        );
        if (invalidMcq) {
          setErrorMessage('অনুগ্রহ করে সকল MCQ প্রশ্ন ও অপশনগুলো সঠিকভাবে পূরণ করুন');
          return;
        }
      }

      if (questionMode === 'cq' || questionMode === 'both') {
        const invalidCq = cqQuestions.some((q) => !q.questionText.trim());
        if (invalidCq) {
          setErrorMessage('অনুগ্রহ করে সকল CQ/সৃজনশীল প্রশ্ন সঠিকভাবে লিখুন');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        batchId,
        title: title.trim(),
        instructions: instructions.trim(),
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passMarks: Number(passMarks),
        negativeMarkPerWrong: Number(negativeMarkPerWrong) || 0,
        startWindow: new Date(startDate).toISOString(),
        endWindow: new Date(endDate).toISOString(),
        attemptLimit: 1,
        randomizeQuestions: false,
        isPublished: true,
        examType,
        questionMode: examType === 'system_questions' ? questionMode : undefined,
        questionPaperUrl: examType === 'upload_paper' ? questionPaperUrl : undefined,
      };

      if (examType === 'system_questions') {
        if (questionMode === 'mcq' || questionMode === 'both') {
          payload.mcqQuestions = mcqQuestions;
        }
        if (questionMode === 'cq' || questionMode === 'both') {
          payload.cqQuestions = cqQuestions;
        }
      }

      const res = await api.post('/exams', payload);
      if (res.data?.success) {
        router.push(`/classroom/${batchId}/exams`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'এক্সাম তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Top Banner */}
      <div className="cosmic-hero-bg text-white pt-8 pb-10 mb-8 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full">
              টিচার পোর্টাল • এক্সাম ক্রিয়েটর
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            নতুন পরীক্ষা তৈরি ও শিডিউল করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
            কোশ্চেন পেপার আপলোড করুন অথবা সিস্টেমের মাধ্যমে MCQ ও CQ প্রশ্নপত্র ডিজাইন করুন
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* STEP 1: Basic Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                ১
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  মৌলিক তথ্য ও সময় নির্ধারণ
                </h2>
                <p className="text-xs text-slate-500">পরীক্ষার নাম, সময়সীমা এবং পূর্ণমান নির্ধারণ করুন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার নাম / শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অধ্যায় ১ ও ২ উইকলি টেস্ট"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার সময়কাল (মিনিট) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মোট নম্বর (Total Marks) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পাস মার্ক (Pass Marks)
                </label>
                <input
                  type="number"
                  min="0"
                  value={passMarks}
                  onChange={(e) => setPassMarks(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ভুল উত্তরের জন্য নেগেটিভ মার্ক (ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={negativeMarkPerWrong}
                  onChange={(e) => setNegativeMarkPerWrong(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Start and End Window */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষা শুরুর তারিখ ও সময় <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  এই সময়ের পূর্বে শিক্ষার্থীরা প্রশ্ন দেখতে পারবে না।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষা সমাপ্তির শেষ সময় <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  শিক্ষার্থীদের জন্য নির্দেশনা (Instructions)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: প্রতিটি প্রশ্নের মান সমান। নির্ধারিত সময়ে উত্তরপত্র সাবমিট করুন।"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Question Delivery Method */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm">
                ২
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  প্রশ্নপত্রের ধরন ও তৈরি পদ্ধতি
                </h2>
                <p className="text-xs text-slate-500">প্রশ্নপত্র আপলোড করবেন নাকি সিস্টেমে তৈরি করবেন নির্বাচন করুন</p>
              </div>
            </div>

            {/* Toggle Delivery Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  examType === 'upload_paper'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="examType"
                  value="upload_paper"
                  checked={examType === 'upload_paper'}
                  onChange={() => setExamType('upload_paper')}
                  className="mt-1 accent-purple-600"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-purple-600" />
                    <span>কোশ্চেন পেপার আপলোড</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    আপনার তৈরি করা প্রশ্নপত্রের ছবি বা PDF ডকুমেন্ট আপলোড করুন। শিক্ষার্থীরা দেখে লিখে সাবমিট করবে।
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  examType === 'system_questions'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="examType"
                  value="system_questions"
                  checked={examType === 'system_questions'}
                  onChange={() => setExamType('system_questions')}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>সিস্টেমের মাধ্যমে প্রশ্ন তৈরি</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    সরাসরি ওয়েবসাইটে MCQ, রচনামূলক (CQ) বা উভয় পদ্ধতির প্রশ্ন যুক্ত করুন।
                  </p>
                </div>
              </label>
            </div>

            {/* If Option A: Upload Question Paper */}
            {examType === 'upload_paper' && (
              <div className="p-6 rounded-2xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    প্রশ্নপত্র ডকুমেন্ট আপলোড করুন (PDF বা ছবি)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all">
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingDoc ? 'আপলোড হচ্ছে...' : 'ফাইল নির্বাচন করুন'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handlePaperUpload}
                        disabled={uploadingDoc}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-500">অথবা সরাসরি লিংক দিন:</span>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={questionPaperUrl}
                      onChange={(e) => setQuestionPaperUrl(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {questionPaperUrl && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      প্রশ্নপত্র সফলভাবে যুক্ত হয়েছে
                    </span>
                    <a
                      href={questionPaperUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-semibold"
                    >
                      প্রিভিউ দেখুন
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* If Option B: System Questions (MCQ, CQ, Both) */}
            {examType === 'system_questions' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    প্রশ্নের ধরন নির্বাচন করুন (Question Format):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setQuestionMode('mcq')}
                      className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'mcq'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-sm mb-1">১. বহুনির্বাচনি (MCQ)</div>
                      <div className="text-[11px] opacity-80">শুধুমাত্র অপশন ভিত্তিক প্রশ্ন</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionMode('cq')}
                      className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'cq'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-sm mb-1">২. রচনামূলক (CQ)</div>
                      <div className="text-[11px] opacity-80">প্রশ্নোত্তর ও ব্যাখ্যামূলক</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionMode('both')}
                      className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'both'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-sm mb-1">৩. উভয়ই (MCQ + CQ)</div>
                      <div className="text-[11px] opacity-80">একই প্রশ্নপত্রে দুই অংশই থাকবে</div>
                    </button>
                  </div>
                </div>

                {/* Section A: MCQ Builder */}
                {(questionMode === 'mcq' || questionMode === 'both') && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        <span>বহুনির্বাচনি প্রশ্নসমূহ (MCQ Questions) - {mcqQuestions.length} টি</span>
                      </h3>
                      <button
                        type="button"
                        onClick={addMcqQuestion}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>MCQ যোগ করুন</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {mcqQuestions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                              প্রশ্ন নং #{qIdx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>নম্বর:</span>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={q.marks}
                                  onChange={(e) => updateMcqMarks(qIdx, Number(e.target.value))}
                                  className="w-14 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-xs font-bold"
                                />
                              </div>
                              {mcqQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMcqQuestion(qIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="প্রশ্ন মুছুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <input
                            type="text"
                            required
                            placeholder={`প্রশ্ন লিখুন (যেমন: পর্যায় সারণির প্রথম মৌল কোনটি?)`}
                            value={q.questionText}
                            onChange={(e) => updateMcqText(qIdx, e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.optionId}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  q.correctOptionId === opt.optionId
                                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct_opt_${qIdx}`}
                                  checked={q.correctOptionId === opt.optionId}
                                  onChange={() => setCorrectOption(qIdx, opt.optionId)}
                                  title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                                  className="accent-emerald-600 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  required
                                  placeholder={`অপশন ${String.fromCharCode(65 + optIdx)}`}
                                  value={opt.text}
                                  onChange={(e) => updateMcqOption(qIdx, optIdx, e.target.value)}
                                  className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                                />
                                {q.correctOptionId === opt.optionId && (
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
                                    সঠিক
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: CQ / Descriptive Builder */}
                {(questionMode === 'cq' || questionMode === 'both') && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>সৃজনশীল / রচনামূলক প্রশ্নসমূহ (CQ Questions) - {cqQuestions.length} টি</span>
                      </h3>
                      <button
                        type="button"
                        onClick={addCqQuestion}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CQ যোগ করুন</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {cqQuestions.map((q, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                              সৃজনশীল প্রশ্ন #{cIdx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>নম্বর:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={q.marks}
                                  onChange={(e) => updateCqMarks(cIdx, Number(e.target.value))}
                                  className="w-14 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-xs font-bold"
                                />
                              </div>
                              {cqQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCqQuestion(cIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="প্রশ্ন মুছুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            required
                            placeholder={`উদ্দীপক ও প্রশ্ন লিখুন (যেমন: ক. অমুক কি? খ. ব্যাখ্যা কর... ইত্যাদি)`}
                            value={q.questionText}
                            onChange={(e) => updateCqText(cIdx, e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              বাতিল করুন
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'প্রকাশ হচ্ছে...' : 'এক্সাম সম্পন্ন ও প্রকাশ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
