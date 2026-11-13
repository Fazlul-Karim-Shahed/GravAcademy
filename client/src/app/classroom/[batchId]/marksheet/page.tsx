'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Award,
  ArrowLeft,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  BarChart3,
  Users,
  ShieldCheck,
  TrendingUp,
  PenTool,
  Eye,
} from 'lucide-react';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';

interface ExamMeta {
  _id: string;
  title: string;
  totalMarks: number;
  passMarks: number;
}

interface AssignmentMeta {
  _id: string;
  title: string;
  totalMarks: number;
  passMarks: number;
}

interface StudentRow {
  student: {
    _id: string;
    name: string;
    email: string;
    userId?: string;
    avatarUrl?: string;
    phone?: string;
  };
  exams: {
    examId: string;
    title: string;
    totalMarks: number;
    passMarks: number;
    attempted: boolean;
    status: string;
    mcqScore: number;
    cqScore: number;
    obtainedMarks: number | null;
    passed: boolean;
    isEvaluated: boolean;
  }[];
  assignments: {
    assignmentId: string;
    title: string;
    totalMarks: number;
    passMarks: number;
    submitted: boolean;
    isLate: boolean;
    status: string;
    obtainedMarks: number | null;
    feedback: string;
    isEvaluated: boolean;
    annotatedFileUrl?: string;
    annotatedFileName?: string;
  }[];
  summary: {
    totalExams: number;
    examsAttempted: number;
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

export default function MarksheetPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [batchInfo, setBatchInfo] = useState<{ _id: string; name: string; course?: any } | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [examsMeta, setExamsMeta] = useState<ExamMeta[]>([]);
  const [assignmentsMeta, setAssignmentsMeta] = useState<AssignmentMeta[]>([]);
  const [studentsData, setStudentsData] = useState<StudentRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected student for detailed modal inspection (Teacher/Admin view)
  const [selectedStudentRow, setSelectedStudentRow] = useState<StudentRow | null>(null);

  // In-App Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    fileName?: string;
  }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/marksheet`);
      return;
    }
    if (user && batchId) {
      loadMarksheet();
    }
  }, [batchId, user, authLoading]);

  const loadMarksheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/batches/${batchId}/marksheet`);
      if (res.data?.success) {
        setBatchInfo(res.data.batch);
        setIsStaff(res.data.isStaff);
        setExamsMeta(res.data.examsMetadata || []);
        setAssignmentsMeta(res.data.assignmentsMetadata || []);
        setStudentsData(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load marksheet:', err);
      setError(err.response?.data?.message || 'মার্কশিট লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentsData.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.student.name.toLowerCase().includes(q) ||
      (row.student.email && row.student.email.toLowerCase().includes(q)) ||
      (row.student.userId && row.student.userId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Banner */}
      <div className="relative w-[98%] mx-auto overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-5 sm:p-7 mb-8 border border-indigo-900/60 shadow-lg shadow-indigo-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(129,140,248,0.22),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(236,72,153,0.14),transparent_30%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <Link
                  href={`/classroom/${batchId}`}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
                  title="ক্লাসরুমে ফিরে যান"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                {isStaff ? (
                  <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>সব শিক্ষার্থী</span>
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight pt-1">
                মার্কশিট
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
                {batchInfo?.name}
              </p>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">মার্কশিট প্রস্তুত হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Self View: Prominent Card Display */}
            {!isStaff && studentsData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                      মোট অর্জন
                    </span>
                    <h3 className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">
                      {studentsData[0].summary.grandTotalObtained} / {studentsData[0].summary.grandTotalPossible}
                    </h3>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                      সার্বিক সফলতার হার: {studentsData[0].summary.percentage}%
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                      এক্সাম মার্কস
                    </span>
                    <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
                      {studentsData[0].summary.totalObtainedExamMarks} / {studentsData[0].summary.totalPossibleExamMarks}
                    </h3>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                      অংশগ্রহণ: {studentsData[0].summary.examsAttempted}/{studentsData[0].summary.totalExams} টি
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                      অ্যাসাইনমেন্ট স্কোর
                    </span>
                    <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                      {studentsData[0].summary.totalObtainedAssignmentMarks} / {studentsData[0].summary.totalPossibleAssignmentMarks}
                    </h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      জমা দেওয়া: {studentsData[0].summary.assignmentsSubmitted}/{studentsData[0].summary.totalAssignments} টি
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                      গ্রেড অবস্থান
                    </span>
                    <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
                      {studentsData[0].summary.percentage >= 80
                        ? 'A+'
                        : studentsData[0].summary.percentage >= 70
                        ? 'A'
                        : studentsData[0].summary.percentage >= 60
                        ? 'A-'
                        : studentsData[0].summary.percentage >= 50
                        ? 'B'
                        : studentsData[0].summary.percentage >= 40
                        ? 'C'
                        : 'F'}
                    </h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      অ্যাকাডেমিক লেটার গ্রেড
                    </p>
                  </div>
                </div>

                {/* Individual Breakdown for Student */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Exams Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>পরীক্ষাসমূহের ফলাফল ({studentsData[0].exams.length})</span>
                    </h4>
                    {studentsData[0].exams.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">কোনো পরীক্ষা পাওয়া যায়নি</p>
                    ) : (
                      studentsData[0].exams.map((ex) => (
                        <div
                          key={ex.examId}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{ex.title}</h5>
                            <span className="text-[11px] text-slate-500">
                              পূর্ণমান: {ex.totalMarks} · পাস নম্বর: {ex.passMarks}
                            </span>
                          </div>
                          <div className="text-right">
                            {ex.attempted ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-black ${
                                    ex.passed
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {ex.obtainedMarks} / {ex.totalMarks}
                                </span>
                                {ex.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 italic">অনুপস্থিত (Absent)</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Assignments Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>অ্যাসাইনমেন্টসমূহের ফলাফল ({studentsData[0].assignments.length})</span>
                    </h4>
                    {studentsData[0].assignments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি</p>
                    ) : (
                      studentsData[0].assignments.map((asgn) => (
                        <div
                          key={asgn.assignmentId}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{asgn.title}</h5>
                            <span className="text-[11px] text-slate-500">
                              পূর্ণমান: {asgn.totalMarks} {asgn.isLate && '· (লেইট সাবমিশন)'}
                            </span>
                            {asgn.feedback && (
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 italic mt-0.5">
                                "{asgn.feedback}"
                              </p>
                            )}
                            {asgn.annotatedFileUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    isOpen: true,
                                    url: asgn.annotatedFileUrl!,
                                    title: `${asgn.title} - শিক্ষকের চেক করা খাতা`,
                                    fileName: asgn.annotatedFileName || 'evaluated_script.png',
                                  })
                                }
                                className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <PenTool className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>শিক্ষকের চেক করা খাতা দেখুন</span>
                                <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            {asgn.submitted ? (
                              asgn.isEvaluated ? (
                                <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                                  {asgn.obtainedMarks} / {asgn.totalMarks}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-500">অপেক্ষমাণ (Pending)</span>
                              )
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 italic">জমা দেওয়া হয়নি</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Staff / Teacher View: Full Matrix Table with Search */}
            {isStaff && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="শিক্ষার্থীর নাম, রোল বা ইমেইল দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    মোট শিক্ষার্থী: <span className="font-bold text-slate-900 dark:text-white">{studentsData.length}</span> জন
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">শিক্ষার্থী</th>
                        <th className="py-3 px-4 text-center">পরীক্ষা এটেন্ড</th>
                        <th className="py-3 px-4 text-center">পরীক্ষার প্রাপ্ত নম্বর</th>
                        <th className="py-3 px-4 text-center">অ্যাসাইনমেন্ট সাবমিশন</th>
                        <th className="py-3 px-4 text-center">অ্যাসাইনমেন্ট নম্বর</th>
                        <th className="py-3 px-4 text-center">সর্বমোট নম্বর</th>
                        <th className="py-3 px-4 text-center">পার্সেন্টেজ (%)</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            কোনো শিক্ষার্থী রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((row) => (
                          <tr key={row.student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                                  {row.student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{row.student.name}</div>
                                  <div className="text-[10px] text-slate-400">{row.student.userId || row.student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {row.summary.examsAttempted} / {row.summary.totalExams}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                              {row.summary.totalObtainedExamMarks} / {row.summary.totalPossibleExamMarks}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {row.summary.assignmentsSubmitted} / {row.summary.totalAssignments}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                              {row.summary.totalObtainedAssignmentMarks} / {row.summary.totalPossibleAssignmentMarks}
                            </td>
                            <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">
                              {row.summary.grandTotalObtained} / {row.summary.grandTotalPossible}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                                  row.summary.percentage >= 60
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : row.summary.percentage >= 40
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {row.summary.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentRow(row)}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                              >
                                বিস্তারিত দেখুন
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Student Transcript Modal */}
      {selectedStudentRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudentRow(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>{selectedStudentRow.student.name} - মার্কশিট ও বিশ্লেষণ</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              আইডি: {selectedStudentRow.student.userId || selectedStudentRow.student.email} · সামগ্রিক সফলতা: {selectedStudentRow.summary.percentage}%
            </p>

            <div className="space-y-6">
              {/* Exams */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>পরীক্ষার ফলাফল তালিকা</span>
                </h4>
                <div className="space-y-2">
                  {selectedStudentRow.exams.map((e) => (
                    <div
                      key={e.examId}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{e.title}</div>
                        <div className="text-[11px] text-slate-500">
                          MCQ: {e.mcqScore} · CQ: {e.cqScore} · পাস নম্বর: {e.passMarks}
                        </div>
                      </div>
                      <div className="font-black text-sm">
                        {e.attempted ? (
                          <span className={e.passed ? 'text-emerald-600' : 'text-rose-600'}>
                            {e.obtainedMarks} / {e.totalMarks}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">অনুপস্থিত</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignments */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span>অ্যাসাইনমেন্ট মূল্যায়ন তালিকা</span>
                </h4>
                <div className="space-y-2">
                  {selectedStudentRow.assignments.map((a) => (
                    <div
                      key={a.assignmentId}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {a.isLate ? 'লেইট সাবমিশন' : 'সময়মতো জমা'}
                          {a.feedback && ` · মন্তব্য: "${a.feedback}"`}
                        </div>
                        {a.annotatedFileUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                isOpen: true,
                                url: a.annotatedFileUrl!,
                                title: `${a.title} - শিক্ষকের চেক করা খাতা`,
                                fileName: a.annotatedFileName || 'evaluated_script.png',
                              })
                            }
                            className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>শিক্ষকের চেক করা খাতা দেখুন</span>
                            <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
                          </button>
                        )}
                      </div>
                      <div className="font-black text-sm">
                        {a.submitted ? (
                          a.isEvaluated ? (
                            <span className="text-purple-600">{a.obtainedMarks} / {a.totalMarks}</span>
                          ) : (
                            <span className="text-amber-500 text-xs font-bold">অমূল্যায়িত</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs italic">জমা পড়েনি</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
