'use client';

import React, { useState, useEffect, use } from 'react';
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
  Image as ImageIcon,
  Copy,
  FileSpreadsheet,
  Save,
} from 'lucide-react';

interface MCQQuestionOptionInput {
  optionId: string;
  text: string;
  imageUrl?: string;
}

interface MCQQuestionInput {
  questionText: string;
  imageUrl?: string;
  options: MCQQuestionOptionInput[];
  correctOptionId: string;
  marks: number;
}

interface CQQuestionInput {
  questionText: string;
  marks: number;
}

export default function EditExamPage({
  params,
}: {
  params: Promise<{ batchId: string; examId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId, examId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Basic Information
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [negativeMarkPerWrong, setNegativeMarkPerWrong] = useState(0);

  // Scheduling
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Question Creation Options
  const [examType, setExamType] = useState<'upload_paper' | 'system_questions'>('system_questions');
  const [questionPaperUrl, setQuestionPaperUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // System Questions Mode: 'mcq' | 'cq' | 'both'
  const [questionMode, setQuestionMode] = useState<'mcq' | 'cq' | 'both'>('mcq');

  // Bulk Import modal / text
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Uploading image tracking: key = 'q_idx' or 'opt_idx_optidx'
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // MCQ Questions State
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestionInput[]>([]);

  // CQ Questions State
  const [cqQuestions, setCqQuestions] = useState<CQQuestionInput[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/edit`);
      return;
    }
    if (user && examId) {
      fetchExamData();
    }
  }, [examId, user, authLoading]);

  const fetchExamData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/exams/${examId}`);
      if (res.data?.success) {
        const { exam, questions } = res.data.data;
        setTitle(exam.title || '');
        setInstructions(exam.instructions || '');
        setDurationMinutes(exam.durationMinutes || 30);
        setTotalMarks(exam.totalMarks || 100);
        setPassMarks(exam.passMarks || 40);
        setNegativeMarkPerWrong(exam.negativeMarkPerWrong || 0);

        if (exam.startWindow) {
          setStartDate(new Date(exam.startWindow).toISOString().slice(0, 16));
        }
        if (exam.endWindow) {
          setEndDate(new Date(exam.endWindow).toISOString().slice(0, 16));
        }

        setExamType(exam.examType || 'system_questions');
        setQuestionPaperUrl(exam.questionPaperUrl || '');
        setQuestionMode(exam.questionMode || 'mcq');
        setCqQuestions(exam.cqQuestions || []);

        if (questions && questions.length > 0) {
          const formattedQuestions: MCQQuestionInput[] = questions.map((q: any) => ({
            questionText: q.questionText,
            imageUrl: q.imageUrl || '',
            options: q.options.map((opt: any) => ({
              optionId: opt.optionId,
              text: opt.text,
              imageUrl: opt.imageUrl || '',
            })),
            correctOptionId: q.correctOptionId || q.options[0]?.optionId || 'opt_1',
            marks: q.marks || 1,
          }));
          setMcqQuestions(formattedQuestions);
        } else {
          setMcqQuestions([
            {
              questionText: '',
              imageUrl: '',
              options: [
                { optionId: 'opt_1', text: '', imageUrl: '' },
                { optionId: 'opt_2', text: '', imageUrl: '' },
                { optionId: 'opt_3', text: '', imageUrl: '' },
                { optionId: 'opt_4', text: '', imageUrl: '' },
              ],
              correctOptionId: 'opt_1',
              marks: 1,
            },
          ]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'পরীক্ষার তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Upload image to server
  const handleImageUpload = async (
    file: File,
    onSuccess: (url: string) => void,
    key: string
  ) => {
    setUploadingImageKey(key);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await api.post('/finance/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data.data?.fileUrl) {
        onSuccess(res.data.data.fileUrl);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert(err.response?.data?.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setUploadingImageKey(null);
    }
  };

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
        imageUrl: '',
        options: [
          { optionId: `opt_${Date.now()}_1`, text: '', imageUrl: '' },
          { optionId: `opt_${Date.now()}_2`, text: '', imageUrl: '' },
          { optionId: `opt_${Date.now()}_3`, text: '', imageUrl: '' },
          { optionId: `opt_${Date.now()}_4`, text: '', imageUrl: '' },
        ],
        correctOptionId: `opt_${Date.now()}_1`,
        marks: 1,
      },
    ]);
  };

  const duplicateMcqQuestion = (index: number) => {
    const target = mcqQuestions[index];
    if (!target) return;
    const timestamp = Date.now();
    const clonedOptions = target.options.map((opt, i) => ({
      ...opt,
      optionId: `opt_${timestamp}_${i + 1}`,
    }));
    const targetOptIndex = target.options.findIndex((o) => o.optionId === target.correctOptionId);
    const newCorrectId =
      targetOptIndex >= 0 && clonedOptions[targetOptIndex]
        ? clonedOptions[targetOptIndex].optionId
        : clonedOptions[0].optionId;

    const cloned: MCQQuestionInput = {
      questionText: `${target.questionText} (কপি)`,
      imageUrl: target.imageUrl || '',
      options: clonedOptions,
      correctOptionId: newCorrectId,
      marks: target.marks,
    };

    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
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

  const updateMcqImageUrl = (index: number, url: string) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[index].imageUrl = url;
      return copy;
    });
  };

  const addOptionToQuestion = (qIdx: number) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      const optNum = copy[qIdx].options.length + 1;
      copy[qIdx].options.push({
        optionId: `opt_${Date.now()}_${optNum}`,
        text: '',
        imageUrl: '',
      });
      return copy;
    });
  };

  const removeOptionFromQuestion = (qIdx: number, optIdx: number) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIdx].options.length <= 2) {
        alert('কমপক্ষে ২টি অপশন থাকতে হবে!');
        return prev;
      }
      const removedId = copy[qIdx].options[optIdx].optionId;
      copy[qIdx].options.splice(optIdx, 1);
      if (copy[qIdx].correctOptionId === removedId) {
        copy[qIdx].correctOptionId = copy[qIdx].options[0].optionId;
      }
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

  const updateMcqOptionImage = (qIdx: number, optIdx: number, imageUrl: string) => {
    setMcqQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx].imageUrl = imageUrl;
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

  // Bulk Question Parser
  const handleBulkParse = () => {
    if (!bulkText.trim()) return;

    try {
      const blocks = bulkText.split(/\n\s*\n+/);
      const parsedQuestions: MCQQuestionInput[] = [];

      for (const block of blocks) {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) continue;

        let questionText = lines[0].replace(/^(\d+[\.\)]|\#\d+)\s*/, '');
        const options: MCQQuestionOptionInput[] = [];
        let correctLetter = 'A';

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const ansMatch = line.match(/^(?:উত্তর|Ans|Answer)\s*[:：\-]?\s*([A-Da-dক-ঘ1-4])/i);
          if (ansMatch) {
            correctLetter = ansMatch[1].toUpperCase();
            continue;
          }

          const optMatch = line.match(/^([A-Da-dক-ঘ1-4]|\([A-Da-dক-ঘ1-4]\))[\.\)\s\-]+(.*)/);
          if (optMatch) {
            const letter = optMatch[1].replace(/[\(\)]/g, '').toUpperCase();
            const text = optMatch[2].trim();
            options.push({
              optionId: `opt_${Date.now()}_${options.length + 1}`,
              text: text || letter,
              imageUrl: '',
            });
          } else if (line) {
            options.push({
              optionId: `opt_${Date.now()}_${options.length + 1}`,
              text: line,
              imageUrl: '',
            });
          }
        }

        if (options.length >= 2) {
          let correctIdx = 0;
          if (correctLetter === 'B' || correctLetter === 'খ' || correctLetter === '2') correctIdx = 1;
          else if (correctLetter === 'C' || correctLetter === 'গ' || correctLetter === '3') correctIdx = 2;
          else if (correctLetter === 'D' || correctLetter === 'ঘ' || correctLetter === '4') correctIdx = 3;

          if (correctIdx >= options.length) correctIdx = 0;

          parsedQuestions.push({
            questionText,
            imageUrl: '',
            options,
            correctOptionId: options[correctIdx].optionId,
            marks: 1,
          });
        }
      }

      if (parsedQuestions.length > 0) {
        setMcqQuestions((prev) => [...prev, ...parsedQuestions]);
        setShowBulkModal(false);
        setBulkText('');
        alert(`সফলভাবে ${parsedQuestions.length} টি বহুনির্বাচনি প্রশ্ন যুক্ত করা হয়েছে!`);
      } else {
        alert('কোনো বৈধ প্রশ্ন খুঁজে পাওয়া যায়নি। ফরম্যাটটি পরীক্ষা করুন।');
      }
    } catch (err) {
      console.error(err);
      alert('টেক্সট পার্স করতে সমস্যা হয়েছে।');
    }
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
    setSuccessMessage('');

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
        title: title.trim(),
        instructions: instructions.trim(),
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passMarks: Number(passMarks),
        negativeMarkPerWrong: Number(negativeMarkPerWrong) || 0,
        startWindow: new Date(startDate).toISOString(),
        endWindow: new Date(endDate).toISOString(),
        examType,
        questionMode: examType === 'system_questions' ? questionMode : undefined,
        questionPaperUrl: examType === 'upload_paper' ? questionPaperUrl : undefined,
      };

      if (examType === 'system_questions') {
        if (questionMode === 'mcq' || questionMode === 'both') {
          payload.mcqQuestions = mcqQuestions.map((q, idx) => ({
            questionText: q.questionText,
            imageUrl: q.imageUrl || '',
            options: q.options.map((opt) => ({
              optionId: opt.optionId,
              text: opt.text,
              imageUrl: opt.imageUrl || '',
            })),
            correctOptionId: q.correctOptionId,
            marks: q.marks,
            order: idx,
          }));
        }

        if (questionMode === 'cq' || questionMode === 'both') {
          payload.cqQuestions = cqQuestions;
        }
      }

      const res = await api.put(`/exams/${examId}`, payload);

      if (res.data?.success) {
        setSuccessMessage('এক্সাম ও প্রশ্নপত্র সফলভাবে আপডেট হয়েছে! লাইভ পরীক্ষায় থাকা শিক্ষার্থীদের স্ক্রিনে স্বয়ংক্রিয়ভাবে রিয়েল-টাইমে তা রিফ্লেক্ট হবে।');
        setTimeout(() => {
          router.push(`/classroom/${batchId}/exams`);
        }, 1800);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'এক্সাম আপডেট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">পরীক্ষার তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0" />
                <span>প্রশ্নপত্র ও এক্সাম এডিট (Edit Exam)</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                পরীক্ষা চলাকালীন সময়ও প্রশ্ন সংশোধন করা যাবে এবং রিয়েল টাইমে শিক্ষার্থীদের কাছে সিঙ্ক হবে।
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* STEP 1: Basic Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                ১
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  মৌলিক তথ্য ও শিডিউলিং (Basic Information)
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">পরীক্ষার নাম, সময়সীমা এবং নম্বর বণ্টন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার নাম (Exam Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পদার্থবিজ্ঞান ১ম অধ্যায় - উইকলি মডেল টেস্ট"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরীক্ষার সময়কাল (মিনিটে) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Question Delivery Method */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                ২
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  প্রশ্নপত্রের ধরন ও সম্পাদনা
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  সরাসরি ওয়েবসাইটে MCQ/CQ পরিবর্তন করুন অথবা রেডি প্রশ্নপত্র ফাইল বদলান
                </p>
              </div>
            </div>

            {/* Choose Exam Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <label
                className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  examType === 'upload_paper'
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="examType"
                  value="upload_paper"
                  checked={examType === 'upload_paper'}
                  onChange={() => setExamType('upload_paper')}
                  className="mt-0.5 accent-purple-600 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>প্রশ্নপত্র ফাইল / PDF আপলোড</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    প্রস্তুতকৃত প্রশ্নপত্র (PDF/Image) আপলোড করুন। শিক্ষার্থীরা দেখে খাতায় উত্তর লিখবে।
                  </p>
                </div>
              </label>

              <label
                className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  examType === 'system_questions'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="examType"
                  value="system_questions"
                  checked={examType === 'system_questions'}
                  onChange={() => setExamType('system_questions')}
                  className="mt-0.5 accent-blue-600 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>সিস্টেমের মাধ্যমে প্রশ্ন তৈরি</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    সরাসরি ওয়েবসাইটে MCQ, রচনামূলক (CQ) বা উভয় পদ্ধতির প্রশ্ন ছবি ও টেক্সটসহ যুক্ত করুন।
                  </p>
                </div>
              </label>
            </div>

            {/* If Option A: Upload Question Paper */}
            {examType === 'upload_paper' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    প্রশ্নপত্র ডকুমেন্ট আপলোড করুন (PDF বা ছবি)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all shrink-0">
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
                    <span className="text-xs text-slate-500 text-center sm:text-left shrink-0">অথবা সরাসরি লিংক দিন:</span>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={questionPaperUrl}
                      onChange={(e) => setQuestionPaperUrl(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {questionPaperUrl && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      প্রশ্নপত্র সফলভাবে যুক্ত রয়েছে
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setQuestionMode('mcq')}
                      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'mcq'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-xs sm:text-sm mb-0.5 sm:mb-1">১. বহুনির্বাচনি (MCQ)</div>
                      <div className="text-[10px] sm:text-[11px] opacity-80">শুধুমাত্র অপশন ভিত্তিক প্রশ্ন</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionMode('cq')}
                      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'cq'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-xs sm:text-sm mb-0.5 sm:mb-1">২. রচনামূলক (CQ)</div>
                      <div className="text-[10px] sm:text-[11px] opacity-80">প্রশ্নোত্তর ও ব্যাখ্যামূলক</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionMode('both')}
                      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs font-black transition-all border text-left ${
                        questionMode === 'both'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-black text-xs sm:text-sm mb-0.5 sm:mb-1">৩. উভয়ই (MCQ + CQ)</div>
                      <div className="text-[10px] sm:text-[11px] opacity-80">একই প্রশ্নপত্রে দুই অংশই থাকবে</div>
                    </button>
                  </div>
                </div>

                {/* Section A: MCQ Builder */}
                {(questionMode === 'mcq' || questionMode === 'both') && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 pt-5 sm:pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>বহুনির্বাচনি প্রশ্নসমূহ (MCQ) - {mcqQuestions.length} টি</span>
                      </h3>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setShowBulkModal(true)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                          <span>Bulk Paste</span>
                        </button>
                        <button
                          type="button"
                          onClick={addMcqQuestion}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span>MCQ যোগ</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      {mcqQuestions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-3.5 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative shadow-sm"
                        >
                          {/* Card Top: Header & Tools */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                              প্রশ্ন নং #{qIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <span>নম্বর:</span>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={q.marks}
                                  onChange={(e) => updateMcqMarks(qIdx, Number(e.target.value))}
                                  className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-xs font-bold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => duplicateMcqQuestion(qIdx)}
                                className="text-slate-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                title="প্রশ্ন ক্লোন / ডুপ্লিকেট করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {mcqQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMcqQuestion(qIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                                  title="প্রশ্ন মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Question Text & Optional Image */}
                          <div className="space-y-2 mb-3">
                            <textarea
                              rows={2}
                              required
                              placeholder="প্রশ্ন লিখুন (যেমন: পর্যায় সারণির প্রথম মৌল কোনটি? অথবা নিচের উদ্দীপক বা চিত্রটি লক্ষ্য কর...)"
                              value={q.questionText}
                              onChange={(e) => updateMcqText(qIdx, e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Question Image Attachment Bar */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all">
                                <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>
                                  {uploadingImageKey === `q_${qIdx}`
                                    ? 'আপলোড হচ্ছে...'
                                    : q.imageUrl
                                    ? 'ছবি পরিবর্তন'
                                    : 'প্রশ্নে ছবি যুক্ত করুন (ডায়াগ্রাম)'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingImageKey === `q_${qIdx}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(
                                        file,
                                        (url) => updateMcqImageUrl(qIdx, url),
                                        `q_${qIdx}`
                                      );
                                    }
                                  }}
                                />
                              </label>

                              {q.imageUrl && (
                                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-xl border border-blue-200 dark:border-blue-900 max-w-full">
                                  <img
                                    src={q.imageUrl}
                                    alt="Question Diagram"
                                    className="w-5 h-5 object-cover rounded shrink-0"
                                  />
                                  <a
                                    href={q.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-600 underline font-semibold truncate max-w-[100px]"
                                  >
                                    ছবি দেখুন
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => updateMcqImageUrl(qIdx, '')}
                                    className="text-rose-500 hover:text-rose-700 text-xs ml-1 font-bold shrink-0"
                                    title="ছবি মুছুন"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Options grid */}
                          <div className="space-y-2 mt-4">
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex flex-wrap items-center justify-between gap-1">
                              <span>অপশনসমূহ (সঠিক উত্তর মার্ক করতে বৃত্তে ক্লিক করুন):</span>
                              <button
                                type="button"
                                onClick={() => addOptionToQuestion(qIdx)}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>আরও অপশন</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctOptionId === opt.optionId;
                                const optKey = `opt_${qIdx}_${optIdx}`;
                                return (
                                  <div
                                    key={opt.optionId}
                                    className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                                      isCorrect
                                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <input
                                        type="radio"
                                        id={`edit_radio_${qIdx}_${opt.optionId}`}
                                        name={`correct_opt_${qIdx}`}
                                        checked={isCorrect}
                                        onChange={() => setCorrectOption(qIdx, opt.optionId)}
                                        title="সঠিক উত্তর হিসেবে চিহ্নিত করতে ক্লিক করুন"
                                        className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                                      />
                                      <span className="text-xs font-black text-slate-500 shrink-0">
                                        {String.fromCharCode(65 + optIdx)})
                                      </span>
                                      <input
                                        type="text"
                                        required
                                        placeholder={`অপশন ${String.fromCharCode(65 + optIdx)} এর টেক্সট`}
                                        value={opt.text}
                                        onChange={(e) =>
                                          updateMcqOption(qIdx, optIdx, e.target.value)
                                        }
                                        className="flex-1 min-w-0 bg-transparent text-xs font-semibold focus:outline-none"
                                      />

                                      {/* Image upload icon for option */}
                                      <label
                                        title="অপশনে ছবি যুক্ত করুন"
                                        className="cursor-pointer text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          disabled={uploadingImageKey === optKey}
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(
                                                file,
                                                (url) => updateMcqOptionImage(qIdx, optIdx, url),
                                                optKey
                                              );
                                            }
                                          }}
                                        />
                                      </label>

                                      {/* Delete option if > 2 */}
                                      {q.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                          className="text-slate-400 hover:text-rose-500 p-1 rounded shrink-0"
                                          title="অপশনটি মুছে ফেলুন"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {isCorrect && (
                                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 shrink-0">
                                          সঠিক
                                        </span>
                                      )}
                                    </div>

                                    {/* Option image preview if attached */}
                                    {opt.imageUrl && (
                                      <div className="mt-1.5 pl-6 flex items-center gap-2">
                                        <img
                                          src={opt.imageUrl}
                                          alt={`Option ${optIdx + 1}`}
                                          className="w-7 h-7 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0"
                                        />
                                        <a
                                          href={opt.imageUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-blue-600 underline font-semibold truncate max-w-[100px]"
                                        >
                                          ছবি প্রিভিউ
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => updateMcqOptionImage(qIdx, optIdx, '')}
                                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                                        >
                                          মুছুন
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: CQ / Descriptive Builder */}
                {(questionMode === 'cq' || questionMode === 'both') && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 pt-5 sm:pt-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>সৃজনশীল প্রশ্নসমূহ (CQ) - {cqQuestions.length} টি</span>
                      </h3>
                      <button
                        type="button"
                        onClick={addCqQuestion}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CQ যোগ করুন</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {cqQuestions.map((q, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3.5 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 relative"
                        >
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                              সৃজনশীল প্রশ্ন #{cIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <span>নম্বর:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={q.marks}
                                  onChange={(e) => updateCqMarks(cIdx, Number(e.target.value))}
                                  className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-xs font-bold"
                                />
                              </div>
                              {cqQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCqQuestion(cIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="প্রশ্ন মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            required
                            placeholder="উদ্দীপক ও প্রশ্ন লিখুন (যেমন: ক. অমুক কি? খ. ব্যাখ্যা কর... ইত্যাদি)"
                            value={q.questionText}
                            onChange={(e) => updateCqText(cIdx, e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-4 pt-3 sm:pt-4">
            <Link
              href={`/classroom/${batchId}/exams`}
              className="w-full sm:w-auto text-center px-6 py-2.5 sm:py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              বাতিল করুন
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও সিঙ্ক করুন'}</span>
            </button>
          </div>
        </form>

        {/* Modal: Bulk Paste MCQ */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                  <span>একসাথে একাধিক MCQ পেস্ট করুন (Bulk Import)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-500 space-y-1 bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <div className="font-bold text-purple-700 dark:text-purple-300">ফরম্যাট নির্দেশিকা:</div>
                <div>প্রতিটি প্রশ্নের পর অপশন (A, B, C, D বা ক, খ, গ, ঘ) এবং নিচে সঠিক উত্তর (Ans: B) লিখুন।</div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                  ১. বাংলাদেশের রাজধানী কোনটি?<br />
                  A) চট্টগ্রাম<br />
                  B) ঢাকা<br />
                  C) খুলনা<br />
                  D) সিলেট<br />
                  Ans: B
                </div>
              </div>

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="এখানে আপনার প্রশ্নগুলো কপি করে পেস্ট করুন..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBulkParse}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
                >
                  প্রশ্নগুলো কনভার্ট করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
