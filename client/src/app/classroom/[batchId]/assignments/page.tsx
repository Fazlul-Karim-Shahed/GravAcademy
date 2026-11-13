'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import ComingSoonCard from '@/components/common/ComingSoonCard';
import TextEditor from '@/components/ui/TextEditor';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';
import {
  FileText,
  PlusCircle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UploadCloud,
  FileCheck,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Send,
  X,
  File,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';

interface AssignmentItem {
  _id: string;
  batchId: string;
  title: string;
  description: string;
  totalMarks: number;
  passMarks: number;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenaltyPercent?: number;
  attachmentUrl?: string;
  isPublished: boolean;
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  mySubmission?: {
    _id: string;
    submissionText?: string;
    fileUrl?: string;
    fileName?: string;
    submittedAt: string;
    isLate: boolean;
    score?: number;
    feedback?: string;
    isEvaluated: boolean;
    status: string;
  } | null;
  submissionStats?: {
    total: number;
    evaluated: number;
  };
}

interface SubmissionRecord {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    userId?: string;
    avatarUrl?: string;
  };
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
  isLate: boolean;
  score?: number;
  feedback?: string;
  isEvaluated: boolean;
  status: string;
}

export const dynamic = 'force-dynamic';

export default function AssignmentRoomPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { loading: settingsLoading, isFeatureEnabled } = useSiteSettings();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    fileName?: string;
  }>({ isOpen: false, url: '', title: '' });

  // Teacher Create/Edit Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMarks: 100,
    passMarks: 40,
    dueDate: '',
    allowLateSubmission: false,
    latePenaltyPercent: 0,
    attachmentUrl: '',
    isPublished: true,
  });
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Student Submission Modal
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<AssignmentItem | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [studentFileUrl, setStudentFileUrl] = useState('');
  const [studentFileName, setStudentFileName] = useState('');
  const [uploadingStudentDoc, setUploadingStudentDoc] = useState(false);
  const [submittingStudentWork, setSubmittingStudentWork] = useState(false);

  // Teacher Review Submissions Modal
  const [activeAssignmentForReview, setActiveAssignmentForReview] = useState<AssignmentItem | null>(null);
  const [submissionsList, setSubmissionsList] = useState<SubmissionRecord[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading State
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  const isTeacherOrAdmin =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/assignments`);
      return;
    }
    if (user && batchId) {
      loadAssignments();
    }
  }, [batchId, user, authLoading]);

  const loadAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/batches/${batchId}/assignments`);
      if (res.data?.success) {
        setAssignments(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
      setError(err.response?.data?.message || 'অ্যাসাইনমেন্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-500">লোড হচ্ছে...</div>;
  if (!isFeatureEnabled('assignments', user?.role === 'superadmin')) return <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-slate-950"><ComingSoonCard feature="Assignment Management" /></div>;

  // Upload file handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isTeacherDoc: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    if (isTeacherDoc) setUploadingAttachment(true);
    else setUploadingStudentDoc(true);

    try {
      const res = await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const fileAsset = res.data.data;
        const fileUrl = fileAsset.streamUrl || fileAsset.driveDownloadUrl || fileAsset.googleDriveFileId;
        if (isTeacherDoc) {
          setFormData((prev) => ({ ...prev, attachmentUrl: fileUrl }));
        } else {
          setStudentFileUrl(fileUrl);
          setStudentFileName(file.name);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'ফাইল আপলোড ব্যর্থ হয়েছে');
    } finally {
      if (isTeacherDoc) setUploadingAttachment(false);
      else setUploadingStudentDoc(false);
    }
  };

  // Submit Assignment (Student)
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForSubmit) return;
    if (!studentNotes.trim() && !studentFileUrl.trim()) {
      alert('অনুগ্রহ করে লেখার উত্তর লিখুন অথবা কোনো অ্যাসাইনমেন্ট ফাইল আপলোড করুন');
      return;
    }

    setSubmittingStudentWork(true);
    try {
      const res = await api.post(`/assignments/${activeAssignmentForSubmit._id}/submit`, {
        submissionText: studentNotes,
        fileUrl: studentFileUrl,
        fileName: studentFileName,
      });
      if (res.data?.success) {
        alert(res.data.message || 'অ্যাসাইনমেন্ট সফলভাবে জমা দেওয়া হয়েছে!');
        setActiveAssignmentForSubmit(null);
        setStudentNotes('');
        setStudentFileUrl('');
        setStudentFileName('');
        loadAssignments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'অ্যাসাইনমেন্ট জমা দেওয়া সম্ভব হয়নি');
    } finally {
      setSubmittingStudentWork(false);
    }
  };

  // Save / Create Assignment (Teacher)
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      alert('শিরোনাম ও শেষ সময় (Due Date) বাধ্যতামূলক');
      return;
    }

    setSubmittingAssignment(true);
    try {
      if (editingAssignmentId) {
        await api.put(`/assignments/${editingAssignmentId}`, {
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString(),
        });
      } else {
        await api.post('/assignments', {
          ...formData,
          batchId,
          dueDate: new Date(formData.dueDate).toISOString(),
        });
      }
      setShowCreateModal(false);
      setEditingAssignmentId(null);
      setFormData({
        title: '',
        description: '',
        totalMarks: 100,
        passMarks: 40,
        dueDate: '',
        allowLateSubmission: false,
        latePenaltyPercent: 0,
        attachmentUrl: '',
        isPublished: true,
      });
      loadAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'অ্যাসাইনমেন্ট সংরক্ষণ করা সম্ভব হয়নি');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই অ্যাসাইনমেন্টটি মুছে ফেলতে চান? এতে শিক্ষার্থীদের সাবমিশনও মুছে যাবে।')) {
      return;
    }
    try {
      const res = await api.delete(`/assignments/${assignmentId}`);
      if (res.data?.success) {
        setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'অ্যাসাইনমেন্ট মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  // Open Submissions Review
  const handleOpenReview = async (assignment: AssignmentItem) => {
    setActiveAssignmentForReview(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      if (res.data?.success) {
        setSubmissionsList(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'সাবমিশন লিস্ট লোড করা যায়নি');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Save Grade
  const handleSaveGrade = async (submissionId: string) => {
    if (!activeAssignmentForReview) return;
    setSavingGrade(true);
    try {
      const res = await api.put(`/assignments/submissions/${submissionId}/grade`, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
        status: 'evaluated',
      });
      if (res.data?.success) {
        setSubmissionsList((prev) =>
          prev.map((s) => (s._id === submissionId ? res.data.data : s))
        );
        setGradingSubmissionId(null);
        setGradeFeedback('');
        loadAssignments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'গ্রেড সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-3 pt-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  অ্যাসাইনমেন্ট
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1 truncate">
                  কাজ দেখুন, জমা দিন
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/classroom/${batchId}/marksheet`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/15 active:scale-95 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>ফলাফল</span>
              </Link>

              {isTeacherOrAdmin && (
                <Link
                  href={`/classroom/${batchId}/assignments/create`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন কাজ</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">অ্যাসাইনমেন্ট লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">এখনো কোনো অ্যাসাইনমেন্ট প্রকাশ করা হয়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              শিক্ষক এই ব্যাচে নতুন কোনো অ্যাসাইনমেন্ট বা হোমওয়ার্ক দিলে এখানে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {assignments.map((assignment) => {
              const due = new Date(assignment.dueDate);
              const isOverdue = currentTime.getTime() > due.getTime();
              const mySub = assignment.mySubmission;

              return (
                <div
                  key={assignment._id}
                  className="bg-white dark:bg-slate-900 rounded-[1.35rem] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{isOverdue ? 'সময় শেষ' : 'জমা দেওয়া যাবে'}</span>
                      </span>

                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {assignment.totalMarks} নম্বর
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {assignment.title}
                    </h3>
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" /> জমা দেওয়ার শেষ সময়:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {due.toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {assignment.attachmentUrl && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <File className="w-3.5 h-3.5" /> প্রশ্নপত্র / এটাচমেন্ট:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                isOpen: true,
                                url: assignment.attachmentUrl!,
                                title: `${assignment.title} - প্রশ্নপত্র`,
                                fileName: 'প্রশ্নপত্র / এটাচমেন্ট',
                              })
                            }
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>প্রিভিউ দেখুন</span>
                          </button>
                        </div>
                      )}

                      {/* Student view: Submission Status */}
                      {!isTeacherOrAdmin && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-500">আপনার অবস্থা:</span>
                            {mySub ? (
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {mySub.isLate ? 'লেট সাবমিটেড' : 'জমা দেওয়া হয়েছে'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                এখনো জমা দেননি
                              </span>
                            )}
                          </div>
                          {mySub?.isEvaluated && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                              <span className="text-[11px] font-semibold text-slate-500">প্রাপ্ত মার্কস:</span>
                              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                                {mySub.score} / {assignment.totalMarks}
                              </span>
                            </div>
                          )}
                          {mySub?.feedback && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              মন্তব্য: "{mySub.feedback}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Teacher view: Submission stats */}
                      {isTeacherOrAdmin && assignment.submissionStats && (
                        <div className="flex items-center justify-between pt-2 text-[11px] font-semibold text-slate-500">
                          <span>জমা পড়েছে: {assignment.submissionStats.total} টি</span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            মূল্যায়ন হয়েছে: {assignment.submissionStats.evaluated} টি
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {isTeacherOrAdmin ? (
                      <>
                        <Link
                          href={`/classroom/${batchId}/assignments/${assignment._id}/submissions`}
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>সাবমিশন ও মূল্যায়ন ({assignment.submissionStats?.total || 0})</span>
                        </Link>
                        <Link
                          href={`/classroom/${batchId}/assignments/${assignment._id}/edit`}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="অ্যাসাইনমেন্ট সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="অ্যাসাইনমেন্ট মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : isOverdue && !assignment.allowLateSubmission && !mySub ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                          <span>জমা দেওয়ার সময় শেষ</span>
                      </button>
                    ) : (
                      <Link
                        href={`/classroom/${batchId}/assignments/${assignment._id}/submit`}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          mySub?.isEvaluated
                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer'
                            : mySub
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {mySub?.isEvaluated
                            ? 'ফলাফল দেখুন'
                            : mySub
                            ? 'সাবমিশন আপডেট করুন'
                            : 'জমা দিন'}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL: Teacher Create / Edit Assignment ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>{editingAssignmentId ? 'অ্যাসাইনমেন্ট পরিবর্তন করুন' : 'নতুন অ্যাসাইনমেন্ট প্রকাশ করুন'}</span>
            </h3>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অ্যাসাইনমেন্টের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মহাকর্ষ ও বলের প্রথম সূত্রের সমস্যা সমাধান"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নির্দেশনা ও বিস্তারিত প্রশ্ন (রিচ টেক্সট এডিটর)
                </label>
                <div className="mt-1">
                  <TextEditor
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="শিক্ষার্থীদের কী কী নির্দেশনা মেনে হোমওয়ার্ক সম্পন্ন করতে হবে তা লিখুন (হেডিং, লিস্ট, বোল্ড ইত্যাদি ব্যবহার করতে পারেন)..."
                    minHeight="180px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোট নম্বর (Total Marks) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাস নম্বর (Pass Marks) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.passMarks}
                    onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জমা দেওয়ার শেষ সময় (Due Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রশ্নপত্র অথবা সহায়ক ফাইল (PDF/DOCX/Images)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    onChange={(e) => handleUploadFile(e, true)}
                    className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                  />
                  {uploadingAttachment && (
                    <span className="text-xs font-bold text-emerald-600 animate-pulse">আপলোড হচ্ছে...</span>
                  )}
                </div>
                {formData.attachmentUrl && (
                  <p className="text-[11px] text-emerald-600 mt-1 truncate">সংযুক্ত ফাইল লিংক যুক্ত হয়েছে</p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lateSub"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="lateSub" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ডেডলাইনের পরেও লেইট সাবমিশন গ্রহণ করার অনুমতি দিন
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {submittingAssignment ? 'সংরক্ষণ হচ্ছে...' : 'অ্যাসাইনমেন্ট প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Student Submit Assignment ================= */}
      {activeAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveAssignmentForSubmit(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>অ্যাসাইনমেন্ট জমা দিন</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">{activeAssignmentForSubmit.title}</p>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  উত্তরের টেক্সট নোট বা বিবরণ
                </label>
                <textarea
                  rows={4}
                  placeholder="আপনার অ্যাসাইনমেন্টের ব্যাখ্যা বা টেক্সট উত্তর এখানে লিখতে পারেন..."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অ্যাসাইনমেন্ট ডকুমেন্টস / খাতা আপলোড (PDF/Images)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleUploadFile(e, false)}
                  className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                />
                {uploadingStudentDoc && (
                  <p className="text-xs font-bold text-emerald-600 animate-pulse mt-1">ফাইল ক্লাউডে আপলোড হচ্ছে...</p>
                )}
                {studentFileName && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সংযুক্ত ফাইল: {studentFileName}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAssignmentForSubmit(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingStudentWork || uploadingStudentDoc}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingStudentWork ? 'জমা দেওয়া হচ্ছে...' : 'নিশ্চিত জমা দিন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Teacher Review & Evaluation ================= */}
      {activeAssignmentForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  <span>অ্যাসাইনমেন্ট সাবমিশন রিভিউ ও গ্রেডিং</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAssignmentForReview.title} (মোট নম্বর: {activeAssignmentForReview.totalMarks})
                </p>
              </div>
              <button
                onClick={() => setActiveAssignmentForReview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingSubmissions ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">শিক্ষার্থীদের সাবমিশন লোড হচ্ছে...</p>
                </div>
              ) : submissionsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                  এখনো কোনো শিক্ষার্থী এই অ্যাসাইনমেন্ট জমা দেয়নি।
                </div>
              ) : (
                submissionsList.map((sub) => {
                  const isGradingThis = gradingSubmissionId === sub._id;

                  return (
                    <div
                      key={sub._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                            {sub.studentId?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {sub.studentId?.name}
                            </h4>
                            <span className="text-[10px] text-slate-500">
                              {sub.studentId?.userId || sub.studentId?.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.isLate && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                              লেইট সাবমিশন
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              sub.isEvaluated
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}
                          >
                            {sub.isEvaluated ? `মূল্যায়িত (${sub.score}/${activeAssignmentForReview.totalMarks})` : 'অমূল্যায়িত'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      {sub.submissionText && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          {sub.submissionText}
                        </div>
                      )}

                      {sub.fileUrl && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                isOpen: true,
                                url: sub.fileUrl!,
                                title: `${sub.studentId?.name || 'শিক্ষার্থী'} - সাবমিশন ফাইল`,
                                fileName: sub.fileName || 'ডকুমেন্ট',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ফাইল প্রিভিউ দেখুন ({sub.fileName || 'ডকুমেন্ট'})</span>
                          </button>
                        </div>
                      )}

                      {/* Grading Form / Display */}
                      {isGradingThis ? (
                        <div className="mt-2 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                নম্বর (সর্বোচ্চ {activeAssignmentForReview.totalMarks})
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={activeAssignmentForReview.totalMarks}
                                value={gradeScore}
                                onChange={(e) => setGradeScore(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                মূল্যায়ন মন্তব্য (Feedback)
                              </label>
                              <input
                                type="text"
                                placeholder="যেমন: চমৎকার উপস্থাপন, ৩ নং সমীকরণটি পুনরায় দেখুন"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setGradingSubmissionId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              disabled={savingGrade}
                              onClick={() => handleSaveGrade(sub._id)}
                              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                            >
                              {savingGrade ? 'সংরক্ষণ হচ্ছে...' : 'গ্রেড কনফার্ম করুন'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          {sub.feedback && (
                            <span className="text-[11px] text-slate-500 italic">
                              মন্তব্য: "{sub.feedback}"
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setGradingSubmissionId(sub._id);
                              setGradeScore(sub.score || 0);
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300 text-purple-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            {sub.isEvaluated ? 'গ্রেড সম্পাদন করুন' : 'নম্বর দিন (Grade)'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* Dedicated Document Preview Modal */}
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
