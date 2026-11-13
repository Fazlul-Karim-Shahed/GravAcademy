'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Award,
  BarChart3,
  CheckCircle2,
  FileText,
  Eye,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';

interface StudentRow {
  student: {
    _id: string;
    name: string;
    email: string;
    userId?: string;
    avatarUrl?: string;
  };
  exams: {
    examId: string;
    title: string;
    totalMarks: number;
    passMarks: number;
    attempted: boolean;
    obtainedMarks: number | null;
    passed: boolean;
  }[];
  assignments: {
    assignmentId: string;
    title: string;
    totalMarks: number;
    submitted: boolean;
    isLate: boolean;
    obtainedMarks: number | null;
    feedback: string;
    isEvaluated: boolean;
    annotatedFileUrl?: string;
    annotatedFileName?: string;
  }[];
  summary: {
    examsAttempted: number;
    totalExams: number;
    examsPassed: number;
    totalAssignments: number;
    assignmentsSubmitted: number;
    totalPossibleExamMarks: number;
    totalObtainedExamMarks: number;
    totalPossibleAssignmentMarks: number;
    totalObtainedAssignmentMarks: number;
    grandTotalPossible: number;
    grandTotalObtained: number;
    percentage: number;
  };
}

export const dynamic = 'force-dynamic';

export default function StudentMarksheetPage({
  params,
}: {
  params: Promise<{ batchId: string; studentId: string }>;
}) {
  const { batchId, studentId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [batchName, setBatchName] = useState('');
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    fileName?: string;
  }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/marksheet/${studentId}`);
      return;
    }
    if (user) loadStudentMarksheet();
  }, [authLoading, user, batchId, studentId]);

  const loadStudentMarksheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/batches/${batchId}/marksheet`);
      if (!res.data?.success) throw new Error('Marksheet load করা যায়নি');
      setBatchName(res.data.batch?.name || 'Classroom');
      const row = (res.data.data || []).find((item: StudentRow) => item.student?._id === studentId);
      if (!row) throw new Error('এই student-এর marksheet পাওয়া যায়নি');
      setStudent(row);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Marksheet load করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
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
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate">
                মার্কশিট ও বিশ্লেষণ
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1 truncate">
                {student?.student.name || 'Student'} · {batchName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Marksheet প্রস্তুত হচ্ছে...
          </div>
        ) : error || !student ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error || 'Marksheet পাওয়া যায়নি'}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl md:bg-white md:dark:bg-slate-900 md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm p-1 sm:p-3 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  {student.student.avatarUrl ? (
                    <img src={student.student.avatarUrl} alt={student.student.name} className="w-14 h-14 rounded-2xl object-cover border border-purple-200 dark:border-purple-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xl font-black">
                      {student.student.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-black truncate">{student.student.name}</h2>
                    <p className="text-xs text-slate-500 truncate">{student.student.userId || student.student.email}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-500">Overall</span>
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{student.summary.percentage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                  <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300">মোট অর্জন</p>
                  <p className="text-xl font-black mt-1">{student.summary.grandTotalObtained} / {student.summary.grandTotalPossible}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Exam score</p>
                  <p className="text-xl font-black mt-1">{student.summary.totalObtainedExamMarks} / {student.summary.totalPossibleExamMarks}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Assignment score</p>
                  <p className="text-xl font-black mt-1">{student.summary.totalObtainedAssignmentMarks} / {student.summary.totalPossibleAssignmentMarks}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Grade</p>
                  <p className="text-xl font-black mt-1">{getGrade(student.summary.percentage)}</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-3xl md:bg-white md:dark:bg-slate-900 md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm p-1 sm:p-3 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-sm font-black"><FileText className="w-4 h-4 text-blue-600" /> Exam ফলাফল</h3>
                  <span className="text-[11px] text-slate-500">{student.summary.examsAttempted}/{student.summary.totalExams} attempted</span>
                </div>
                <div className="space-y-3">
                  {student.exams.length === 0 ? <p className="text-xs text-slate-500 py-6 text-center">কোনো exam পাওয়া যায়নি</p> : student.exams.map((exam) => (
                    <div key={exam.examId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
                      <div className="min-w-0"><p className="text-xs font-bold truncate">{exam.title}</p><p className="text-[11px] text-slate-500 mt-1">Pass: {exam.passMarks}</p></div>
                      {exam.attempted ? <span className={`shrink-0 text-xs font-black ${exam.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{exam.obtainedMarks} / {exam.totalMarks} {exam.passed ? <CheckCircle2 className="inline w-3.5 h-3.5" /> : <XCircle className="inline w-3.5 h-3.5" />}</span> : <span className="text-[11px] text-slate-400">অংশ নেয়নি</span>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl md:bg-white md:dark:bg-slate-900 md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm p-1 sm:p-3 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-sm font-black"><Award className="w-4 h-4 text-purple-600" /> Assignment ফলাফল</h3>
                  <span className="text-[11px] text-slate-500">{student.summary.assignmentsSubmitted}/{student.summary.totalAssignments} submitted</span>
                </div>
                <div className="space-y-3">
                  {student.assignments.length === 0 ? <p className="text-xs text-slate-500 py-6 text-center">কোনো assignment পাওয়া যায়নি</p> : student.assignments.map((assignment) => (
                    <div key={assignment.assignmentId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold truncate">{assignment.title}</p>{assignment.submitted ? assignment.isEvaluated ? <span className="text-xs font-black text-purple-600 shrink-0">{assignment.obtainedMarks} / {assignment.totalMarks}</span> : <span className="text-[11px] text-amber-600 shrink-0">চেক বাকি</span> : <span className="text-[11px] text-slate-400 shrink-0">জমা হয়নি</span>}</div>
                      {assignment.feedback && <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-2 italic">“{assignment.feedback}”</p>}
                      {assignment.annotatedFileUrl && <button type="button" onClick={() => setPreviewDoc({ isOpen: true, url: assignment.annotatedFileUrl!, title: `${assignment.title} - চেকড খাতা`, fileName: assignment.annotatedFileName || 'checked_script.png' })} className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"><Eye className="w-3 h-3" /> খাতা দেখুন</button>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <DocumentPreviewModal isOpen={previewDoc.isOpen} onClose={() => setPreviewDoc((prev) => ({ ...prev, isOpen: false }))} url={previewDoc.url} title={previewDoc.title} fileName={previewDoc.fileName} />
    </div>
  );
}
