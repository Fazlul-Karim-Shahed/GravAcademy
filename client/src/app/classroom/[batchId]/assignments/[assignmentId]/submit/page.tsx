'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import TextEditor from '@/components/ui/TextEditor';
import {
  UploadCloud,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Clock,
  Award,
  File,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Loader2,
  Info,
  PenTool,
} from 'lucide-react';

interface AssignmentDetails {
  _id: string;
  batchId: string;
  title: string;
  description: string;
  totalMarks: number;
  passMarks: number;
  dueDate: string;
  allowLateSubmission: boolean;
  attachmentUrl?: string;
  mySubmission?: {
    _id: string;
    submissionText?: string;
    fileUrl?: string;
    fileName?: string;
    annotatedFileUrl?: string;
    annotatedFileName?: string;
    isLate: boolean;
    isEvaluated: boolean;
    score?: number;
    feedback?: string;
    submittedAt?: string;
  };
}

export default function StudentAssignmentSubmitPage({
  params,
}: {
  params: Promise<{ batchId: string; assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId, assignmentId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);

  // Form State
  const [studentNotes, setStudentNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [existingFileName, setExistingFileName] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/assignments/${assignmentId}/submit`);
      return;
    }
    if (user && assignmentId) {
      loadAssignmentData();
    }
  }, [batchId, assignmentId, user, authLoading]);

  const loadAssignmentData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/assignments/${assignmentId}`);
      if (res.data?.success) {
        const item: AssignmentDetails = res.data.data;
        setAssignment(item);
        if (item.mySubmission) {
          setStudentNotes(item.mySubmission.submissionText || '');
          setExistingFileUrl(item.mySubmission.fileUrl || '');
          setExistingFileName(item.mySubmission.fileName || '');
        }
      }
    } catch (err: any) {
      console.error('Failed to load assignment details:', err);
      setError(err.response?.data?.message || 'অ্যাসাইনমেন্টের বিস্তারিত লোড করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  // Only store chosen file in state. DO NOT upload on change!
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('ফাইলের আকার ২৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExistingFileUrl('');
    setExistingFileName('');
  };

  // Submit Assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNotes.trim() && !selectedFile && !existingFileUrl.trim()) {
      alert('অনুগ্রহ করে উত্তরের টেক্সট নোট লিখুন অথবা অ্যাসাইনমেন্ট ফাইল আপলোড করুন।');
      return;
    }

    setSubmittingWork(true);
    setSuccessMessage('');
    try {
      let finalFileUrl = existingFileUrl;
      let finalFileName = existingFileName;

      // Upload file to Google Drive only when student actually clicks Submit!
      if (selectedFile) {
        const data = new FormData();
        data.append('file', selectedFile);

        const uploadRes = await api.post('/documents/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success && uploadRes.data?.data) {
          const fileAsset = uploadRes.data.data;
          finalFileUrl =
            fileAsset.url || fileAsset.fileUrl || fileAsset.streamUrl || fileAsset.driveDownloadUrl || fileAsset.googleDriveFileId;
          finalFileName = selectedFile.name;
        } else {
          throw new Error(uploadRes.data?.message || 'ফাইলটি ড্রাইভে আপলোড করা যায়নি');
        }
      }

      const res = await api.post(`/assignments/${assignmentId}/submit`, {
        submissionText: studentNotes,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
      });

      if (res.data?.success) {
        setSuccessMessage('আপনার অ্যাসাইনমেন্ট সফলভাবে জমা দেওয়া হয়েছে!');
        setTimeout(() => {
          router.push(`/classroom/${batchId}/assignments`);
        }, 1500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'অ্যাসাইনমেন্ট জমা দেওয়া সম্ভব হয়নি');
    } finally {
      setSubmittingWork(false);
    }
  };

  const due = assignment ? new Date(assignment.dueDate) : null;
  const isOverdue = due ? new Date().getTime() > due.getTime() : false;
  const mySub = assignment?.mySubmission;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/classroom/${batchId}/assignments`}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="অ্যাসাইনমেন্ট লিস্টে ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-0.5">
                <Link href={`/classroom/${batchId}`} className="hover:underline">
                  ক্লাসরুম
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/classroom/${batchId}/assignments`} className="hover:underline">
                  অ্যাসাইনমেন্ট
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-emerald-600 dark:text-emerald-400">জমা দেওয়ার পেজ</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                <span>{assignment?.title || 'অ্যাসাইনমেন্ট জমা দিন'}</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">অ্যাসাইনমেন্টের তথ্য লোড হচ্ছে...</p>
          </div>
        ) : error || !assignment ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error || 'অ্যাসাইনমেন্ট খুঁজে পাওয়া যায়নি'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Submission Form with Rich Text Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Previous Submission Status Banner */}
              {mySub && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    mySub.isEvaluated
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      mySub.isEvaluated
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <p
                      className={`font-bold ${
                        mySub.isEvaluated
                          ? 'text-purple-900 dark:text-purple-200 text-sm'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {mySub.isEvaluated
                        ? 'এই অ্যাসাইনমেন্টটি শিক্ষক কর্তৃক মূল্যায়িত ও চূড়ান্ত হয়েছে!'
                        : 'আপনি ইতোমধ্যেই এই অ্যাসাইনমেন্ট জমা দিয়েছেন!'}
                    </p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      {mySub.isEvaluated
                        ? 'যেহেতু শিক্ষক ইতোমধ্যে আপনার খাতা মূল্যায়ন করে নম্বর প্রদান করেছেন, তাই এই অ্যাসাইনমেন্টটি আর নতুন করে পরিবর্তন বা পুনরায় জমা দেওয়া যাবে না।'
                        : 'নিচে থেকে আপনার উত্তর পরিবর্তন বা আপডেট করে পুনরায় সাবমিট করতে পারেন।'}
                    </p>
                    {mySub.isEvaluated && (
                      <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-purple-700 dark:text-purple-300 text-xs">
                            প্রাপ্ত মার্কস: {mySub.score} / {assignment.totalMarks}
                          </span>
                          {mySub.annotatedFileUrl && (
                            <a
                              href={mySub.annotatedFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>শিক্ষকের চেক করা খাতা দেখুন</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {mySub.feedback && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                            শিক্ষকের মন্তব্য: "{mySub.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submission Form Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  আপনার অ্যাসাইনমেন্ট সমাধান
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  নিচের টেক্সট এডিটরে ব্যাখ্যা বা সমীকরণ লিখুন এবং প্রয়োজনে ড্রাইভের মাধ্যমে ফাইল সংযুক্ত করুন।
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Rich Text Editor for Student Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      উত্তরের টেক্সট নোট বা বিস্তারিত বিবরণ (রিচ টেক্সট এডিটর)
                    </label>
                    <TextEditor
                      value={studentNotes}
                      onChange={(val) => setStudentNotes(val)}
                      placeholder="এখানে আপনার অ্যাসাইনমেন্টের ব্যাখ্যা, সমাধান বা টেক্সট নোট লিখুন (বোল্ড, লিস্ট, সমীকরণ ইত্যাদি ব্যবহার করতে পারেন)..."
                      minHeight="220px"
                    />
                  </div>

                  {/* Google Drive Document / Homework File Selection (Uploaded ONLY on Submit) */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      অ্যাসাইনমেন্ট ডকুমেন্টস / খাতা আপলোড (Google Drive)
                    </label>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          disabled={submittingWork}
                          className="text-xs file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                        />
                      </div>

                      {selectedFile ? (
                        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">সিলেক্টেড ফাইল: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold ml-2 shrink-0 cursor-pointer"
                          >
                            ফাইল বাদ দিন
                          </button>
                        </div>
                      ) : existingFileUrl ? (
                        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">আগে জমা দেওয়া ফাইল: {existingFileName || 'ডকুমেন্ট ফাইল'}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={existingFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold shrink-0"
                            >
                              <span>প্রিভিউ দেখুন</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold ml-1 shrink-0 cursor-pointer"
                            >
                              মুছে ফেলুন
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {successMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Submit Action Button */}
                  <div className="pt-3 flex items-center justify-end gap-3">
                    <Link
                      href={`/classroom/${batchId}/assignments`}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      ফিরে যান
                    </Link>
                    {mySub?.isEvaluated ? (
                      <div className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span>মূল্যায়ন সম্পন্ন (সাবমিশন লক করা)</span>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={submittingWork || (isOverdue && !assignment.allowLateSubmission && !mySub)}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {submittingWork ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>জমা দেওয়া হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{mySub ? 'সাবমিশন আপডেট নিশ্চিত করুন' : 'নিশ্চিত অ্যাসাইনমেন্ট জমা দিন'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Col: Assignment Meta & Guidelines */}
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>অ্যাসাইনমেন্টের বিবরণ</span>
                </h3>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Award className="w-3.5 h-3.5 text-purple-500" /> মোট নম্বর:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{assignment.totalMarks}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> পাস নম্বর:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{assignment.passMarks}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> শেষ সময়:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {due?.toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-rose-500" /> সময় স্ট্যাটাস:
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {isOverdue ? 'ডেডলাইন শেষ' : 'চলমান (Open)'}
                    </span>
                  </div>
                </div>

                {/* Question attachment file if teacher provided */}
                {assignment.attachmentUrl && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      শিক্ষকের প্রশ্নপত্র / ফাইল:
                    </label>
                    <a
                      href={assignment.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <File className="w-4 h-4 shrink-0" />
                        <span className="truncate">প্রশ্নপত্র ডাউনলোড করুন</span>
                      </span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Instructions rendering */}
              {assignment.description && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    শিক্ষকের নির্দেশনাবলী
                  </h3>
                  <div
                    className="text-xs text-slate-600 dark:text-slate-400 prose prose-xs dark:prose-invert max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
