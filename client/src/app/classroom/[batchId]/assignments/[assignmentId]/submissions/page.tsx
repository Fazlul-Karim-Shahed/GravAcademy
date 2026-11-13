'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sanitizeRichHtml } from '@/lib/sanitizeHtml';
import { useAuth } from '@/context/AuthContext';
import {
  FileCheck,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  File,
  Check,
  Search,
  Filter,
  PenTool,
  Eye,
} from 'lucide-react';
import { DocumentAnnotator } from '@/components/ui/DocumentAnnotator';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';

interface SubmissionItem {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    studentId?: string;
    avatarUrl?: string;
  };
  submittedAt: string;
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
  annotatedFileUrl?: string;
  annotatedFileName?: string;
  isLate: boolean;
  isEvaluated: boolean;
  score?: number;
  rawScore?: number;
  feedback?: string;
  evaluatedAt?: string;
}

interface AssignmentDetails {
  _id: string;
  title: string;
  description: string;
  totalMarks: number;
  passMarks: number;
  dueDate: string;
  allowLateSubmission: boolean;
  attachmentUrl?: string;
}

export default function AssignmentSubmissionsPage({
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
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'evaluated'>('all');

  // Selected Submission for Review / Evaluation Drawer
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Digital Marking & Annotation State
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [annotatedBlob, setAnnotatedBlob] = useState<Blob | null>(null);
  const [annotatedPreviewUrl, setAnnotatedPreviewUrl] = useState<string>('');
  const [savedAnnotatedUrl, setSavedAnnotatedUrl] = useState<string>('');

  // In-App Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    fileName?: string;
  }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/assignments/${assignmentId}/submissions`);
      return;
    }
    if (user && assignmentId) {
      loadData();
    }
  }, [batchId, assignmentId, user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [assignmentRes, subsRes] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),
        api.get(`/assignments/${assignmentId}/submissions`),
      ]);

      if (assignmentRes.data?.success) {
        setAssignment(assignmentRes.data.data);
      }
      if (subsRes.data?.success) {
        setSubmissions(subsRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load assignment submissions:', err);
      setError(err.response?.data?.message || 'সাবমিশন ও অ্যাসাইনমেন্ট তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setGradeScore(sub.rawScore ?? sub.score ?? 0);
    setGradeFeedback(sub.feedback || '');
    setSavedAnnotatedUrl(sub.annotatedFileUrl || '');
    setAnnotatedBlob(null);
    setAnnotatedPreviewUrl('');
    setShowAnnotator(false);
    setSaveSuccess(false);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !assignment) return;

    if (gradeScore < 0 || gradeScore > assignment.totalMarks) {
      alert(`নম্বর অবশ্যই ০ থেকে ${assignment.totalMarks} এর মধ্যে হতে হবে।`);
      return;
    }

    setSavingGrade(true);
    try {
      let finalAnnotatedUrl = savedAnnotatedUrl;

      // If teacher annotated the document, upload the checked script to Google Drive
      if (annotatedBlob) {
        const formData = new FormData();
        const scriptFileName = `evaluated_${selectedSub.studentId?.name || 'student'}_${Date.now()}.png`;
        formData.append('file', annotatedBlob, scriptFileName);

        const uploadRes = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success && uploadRes.data?.data) {
          const fileAsset = uploadRes.data.data;
          finalAnnotatedUrl =
            fileAsset.url || fileAsset.fileUrl || fileAsset.streamUrl || fileAsset.driveDownloadUrl || fileAsset.googleDriveFileId;
          setSavedAnnotatedUrl(finalAnnotatedUrl);
        }
      }

      const res = await api.put(`/assignments/submissions/${selectedSub._id}/grade`, {
        score: gradeScore,
        feedback: gradeFeedback,
        annotatedFileUrl: finalAnnotatedUrl,
        annotatedFileName: 'evaluated_script.png',
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        // Update local state smoothly
        setSubmissions((prev) =>
          prev.map((s) =>
            s._id === selectedSub._id
              ? {
                  ...s,
                  isEvaluated: true,
                  score: gradeScore,
                  feedback: gradeFeedback,
                  annotatedFileUrl: finalAnnotatedUrl,
                  annotatedFileName: 'evaluated_script.png',
                  evaluatedAt: new Date().toISOString(),
                }
              : s
          )
        );
        setSelectedSub((prev) =>
          prev
            ? {
                ...prev,
                isEvaluated: true,
                score: gradeScore,
                feedback: gradeFeedback,
                annotatedFileUrl: finalAnnotatedUrl,
              }
            : null
        );
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'মূল্যায়ন সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setSavingGrade(false);
    }
  };

  // Stats calculation
  const totalSubmissions = submissions.length;
  const evaluatedCount = submissions.filter((s) => s.isEvaluated).length;
  const pendingCount = totalSubmissions - evaluatedCount;
  const averageScore =
    evaluatedCount > 0
      ? Math.round(
          submissions.filter((s) => s.isEvaluated).reduce((acc, s) => acc + (s.score || 0), 0) /
            evaluatedCount
        )
      : 0;

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentId?.studentId && s.studentId.studentId.includes(searchQuery));

    if (!matchesSearch) return false;
    if (filterMode === 'pending') return !s.isEvaluated;
    if (filterMode === 'evaluated') return s.isEvaluated;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Shared classroom header */}
      <div className="relative w-[98%] mx-auto overflow-hidden rounded-2xl cosmic-hero-bg text-white p-5 sm:p-7 mb-8 border border-indigo-900/60 shadow-lg shadow-indigo-950/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] bg-gradient-to-b from-rose-950/40 via-red-950/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[200px] bg-red-600/15 rounded-full blur-[80px] pointer-events-none animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-blue-900/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[25%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[18%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <span className="shooting-star meteor-1" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 pt-1 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <FileCheck className="w-6 h-6 sm:w-7 sm:h-7 text-purple-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                সাবমিশন ও মূল্যায়ন
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1 truncate">
                {assignment?.title || 'শিক্ষার্থীদের জমা দেওয়া কাজ দেখুন'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">সাবমিশন তালিকা লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-blue-500" /> মোট জমা পড়েছে
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalSubmissions} <span className="text-xs font-medium text-slate-500">টি</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> মূল্যায়িত
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {evaluatedCount} <span className="text-xs font-medium text-slate-500">টি</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-amber-500" /> মূল্যায়ন বাকি
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {pendingCount} <span className="text-xs font-medium text-slate-500">টি</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Award className="w-4 h-4 text-purple-500" /> গড় নম্বর
                </span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {averageScore} <span className="text-xs font-medium text-slate-500">/ {assignment?.totalMarks || 100}</span>
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="শিক্ষার্থীর নাম, ইউজার আইডি অথবা ইমেইল দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterMode === 'all'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    সকল ({totalSubmissions})
                  </button>
                  <button
                    onClick={() => setFilterMode('pending')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterMode === 'pending'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    বাকি ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('evaluated')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterMode === 'evaluated'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    মূল্যায়িত ({evaluatedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Split Screen Layout: List on Left, Active Evaluation Panel on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Submissions Table / List */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  সাবমিশন তালিকা ({filteredSubmissions.length})
                </h3>

                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    কোনো শিক্ষার্থীর সাবমিশন পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSubmissions.map((sub) => {
                      const isSelected = selectedSub?._id === sub._id;
                      const subTime = new Date(sub.submittedAt);

                      return (
                        <div
                          key={sub._id}
                          onClick={() => handleSelectSubmission(sub)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                                {sub.studentId?.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {sub.studentId?.name || 'শিক্ষার্থী'}
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                  {sub.studentId?.studentId || sub.studentId?.email}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {sub.isLate && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                  লেইট
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  sub.isEvaluated
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                }`}
                              >
                                {sub.isEvaluated
                                  ? `মূল্যায়িত (${sub.score}/${assignment?.totalMarks})`
                                  : 'অপেক্ষমান'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {subTime.toLocaleString('bn-BD', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {sub.fileUrl && (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                <File className="w-3 h-3" /> ফাইল সংযুক্ত
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Active Evaluation Form & Answer Review */}
              <div className="lg:col-span-5 sticky top-24">
                {selectedSub ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          সাবমিশন পর্যালোচনা
                        </h3>
                        <p className="text-xs text-slate-500">{selectedSub.studentId?.name}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          selectedSub.isEvaluated
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {selectedSub.isEvaluated ? 'মূল্যায়িত' : 'অমূল্যায়িত'}
                      </span>
                    </div>

                    {/* Student Written Text Note (Rendered with HTML / Rich formatting) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        শিক্ষার্থীর টেক্সট উত্তর / সমাধান:
                      </label>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                        {selectedSub.submissionText ? (
                          <div
                            className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(selectedSub.submissionText) }}
                          />
                        ) : (
                          <p className="text-slate-400 italic">কোনো লিখিত টেক্সট উত্তর উল্লেখ করা হয়নি।</p>
                        )}
                      </div>
                    </div>

                    {/* Attached File (Google Drive / Cloud Document) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          শিক্ষার্থীর আপলোডকৃত খাতা / ডকুমেন্ট:
                        </label>
                        {selectedSub.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setShowAnnotator(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black shadow-md shadow-rose-600/25 active:scale-95 transition-all cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>খাতা মূল্যায়ন ও দাগ দিন (Annotate)</span>
                          </button>
                        )}
                      </div>

                      {/* Display Checked Annotated Script if generated */}
                      {(annotatedPreviewUrl || savedAnnotatedUrl) && (
                        <div className="mb-3 p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 truncate">
                            <PenTool className="w-4 h-4 shrink-0 text-rose-600" />
                            <span className="truncate">শিক্ষকের চেক করা খাতা প্রস্তুত আছে (Annotated Script)</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  isOpen: true,
                                  url: annotatedPreviewUrl || savedAnnotatedUrl,
                                  title: 'শিক্ষকের মূল্যায়ন ও দাগানো খাতা (Annotated Script)',
                                  fileName: 'evaluated_script.png',
                                })
                              }
                              className="text-xs text-rose-600 dark:text-rose-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>দেখুন</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAnnotatedBlob(null);
                                setAnnotatedPreviewUrl('');
                                setSavedAnnotatedUrl('');
                              }}
                              className="text-[11px] text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                              title="চেক করা খাতা রিসেট করুন"
                            >
                              রিসেট
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedSub.fileUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
                            <span className="flex items-center gap-2.5 truncate">
                              <File className="w-4 h-4 shrink-0 text-blue-600" />
                              <span className="truncate">
                                {selectedSub.fileName || 'শিক্ষার্থীর মূল ডকুমেন্ট / ফাইল (PDF/Image)'}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  isOpen: true,
                                  url: selectedSub.fileUrl!,
                                  title: `${selectedSub.studentId?.name || 'শিক্ষার্থী'} - জমা দেওয়া ডকুমেন্ট`,
                                  fileName: selectedSub.fileName || 'ডকুমেন্ট',
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg shrink-0 ml-2 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ফুলস্ক্রিন প্রিভিউ</span>
                            </button>
                          </div>

                          {/* Live In-App Iframe Preview for Drive Documents / PDFs / Images */}
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950">
                            <div className="p-2 bg-slate-200 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                              <span>মূল ডকুমেন্ট প্রিভিউ (Original Script)</span>
                              <button
                                type="button"
                                onClick={() => setShowAnnotator(true)}
                                className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>এই ডকুমেন্টে দাগিয়ে মূল্যায়ন করুন</span>
                              </button>
                            </div>
                            <iframe
                              src={
                                selectedSub.fileUrl.includes('drive.google.com/file/d/')
                                  ? selectedSub.fileUrl.replace('/view', '/preview')
                                  : selectedSub.fileUrl
                              }
                              className="w-full h-80 border-0"
                              title="Student Submitted Document Preview"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic">
                          শিক্ষার্থী আলাদা কোনো ড্রাইভ ফাইল সংযুক্ত করেনি (শুধুমাত্র টেক্সট উত্তর জমা দিয়েছে)।
                        </div>
                      )}
                    </div>

                    {/* Evaluation Form */}
                    <form onSubmit={handleSaveGrade} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            প্রদত্ত নম্বর (Marks) *
                          </label>
                          <span className="text-[11px] font-semibold text-slate-500">
                            সর্বোচ্চ: {assignment?.totalMarks}
                          </span>
                        </div>
                        <input
                          type="number"
                          required
                          min={0}
                          max={assignment?.totalMarks || 100}
                          value={gradeScore}
                          onChange={(e) => setGradeScore(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          শিক্ষকের মন্তব্য ও দিকনির্দেশনা (Feedback)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="শিক্ষার্থীকে উন্নতির জন্য পরামর্শ বা উৎসাহমূলক মন্তব্য লিখুন..."
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      {saveSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>নম্বর ও মূল্যায়ন সফলভাবে সংরক্ষিত হয়েছে!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={savingGrade}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>{savingGrade ? 'সংরক্ষণ হচ্ছে...' : 'মূল্যায়ন ও গ্রেড নিশ্চিত করুন'}</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center flex flex-col items-center justify-center">
                    <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      কোনো সাবমিশন নির্বাচন করা হয়নি
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      বামপাশের তালিকা থেকে যেকোনো শিক্ষার্থীর সাবমিশনে ক্লিক করুন বিস্তারিত পর্যালোচনা ও নম্বর দেওয়ার জন্য।
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full-Screen Digital Script Annotation Modal */}
      {showAnnotator && selectedSub?.fileUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full h-full max-w-6xl max-h-[92vh] flex flex-col">
            <DocumentAnnotator
              fileUrl={selectedSub.fileUrl}
              fileName={selectedSub.fileName}
              onSaveAnnotated={(blob, previewUrl) => {
                setAnnotatedBlob(blob);
                setAnnotatedPreviewUrl(previewUrl);
                setShowAnnotator(false);
              }}
              onCancel={() => setShowAnnotator(false)}
            />
          </div>
        </div>
      )}
      {/* In-App Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc.isOpen}
        onClose={() => setPreviewDoc((prev) => ({ ...prev, isOpen: false }))}
        url={previewDoc.url}
        title={previewDoc.title}
        fileName={previewDoc.fileName}
      />
    </div>
  );
}
