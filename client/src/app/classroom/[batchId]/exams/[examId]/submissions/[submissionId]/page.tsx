'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatBDTime } from '@/lib/dateUtils';
import { getDrivePreviewUrl } from '@/lib/drive';
import { UserAvatar } from '@/components/common/UserAvatar';
import { DocumentAnnotator } from '@/components/ui/DocumentAnnotator';
import { Check, ExternalLink, FileText, Save, AlertCircle, PenTool, Eye } from 'lucide-react';

interface SubmissionItem {
  _id: string;
  gravId: { _id: string; name: string; email: string; avatarUrl?: string; gravId?: string };
  submittedAt: string;
  cqAnswers?: { questionIndex: number; answerText: string }[];
  studentDocumentUrl?: string;
  annotatedFileUrl?: string;
  annotatedFileName?: string;
  mcqScore: number;
  cqScore: number;
  totalScore: number;
  passed: boolean;
  isEvaluated: boolean;
  teacherFeedback?: string;
  status: string;
}

interface ExamInfo {
  title: string;
  totalMarks: number;
  passMarks: number;
  cqQuestions?: { questionText: string; marks: number }[];
}

export default function SubmissionEvaluationPage({
  params,
}: { params: Promise<{ batchId: string; examId: string; submissionId: string }> }) {
  const { batchId, examId, submissionId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [submission, setSubmission] = useState<SubmissionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cqScore, setCqScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [annotationSourceUrl, setAnnotationSourceUrl] = useState('');
  const [annotatedBlob, setAnnotatedBlob] = useState<Blob | null>(null);
  const [annotatedPreviewUrl, setAnnotatedPreviewUrl] = useState('');
  const [savedAnnotatedUrl, setSavedAnnotatedUrl] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/exams/${examId}/submissions/${submissionId}`);
      return;
    }
    if (user) loadSubmission();
  }, [authLoading, user, examId, submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/exams/${examId}/submissions`);
      const item = (res.data?.data || []).find((sub: SubmissionItem) => sub._id === submissionId);
      if (!res.data?.success || !item) throw new Error('সাবমিশনটি পাওয়া যায়নি');
      setExam(res.data.exam);
      setSubmission(item);
      setCqScore(item.cqScore || 0);
      setFeedback(item.teacherFeedback || '');
      setSavedAnnotatedUrl(item.annotatedFileUrl || '');
      setAnnotatedPreviewUrl('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'সাবমিশন লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const cqMax = Math.max(0, exam?.cqQuestions?.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) || (exam?.totalMarks || 0) - (submission?.mcqScore || 0));

  const handleSave = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      const safeScore = Math.min(Math.max(Number(cqScore) || 0, 0), cqMax);
      let finalAnnotatedUrl = annotatedPreviewUrl || savedAnnotatedUrl || submission.annotatedFileUrl || '';

      if (annotatedBlob) {
        const formData = new FormData();
        formData.append('file', annotatedBlob, `exam_checked_${submission.gravId?.name || 'student'}_${Date.now()}.png`);
        const uploadRes = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!uploadRes.data?.success || !uploadRes.data?.data) {
          throw new Error(uploadRes.data?.message || 'Checked script upload failed');
        }
        const fileAsset = uploadRes.data.data;
        finalAnnotatedUrl = fileAsset.url || fileAsset.fileUrl || fileAsset.streamUrl || fileAsset.driveDownloadUrl || '';
      }

      const res = await api.put(`/exams/attempts/${submission._id}/evaluate`, {
        cqScore: safeScore,
        teacherFeedback: feedback.trim(),
        annotatedFileUrl: finalAnnotatedUrl,
        annotatedFileName: finalAnnotatedUrl ? 'checked_exam_script.png' : '',
      });
      if (!res.data?.success) throw new Error(res.data?.message || 'মূল্যায়ন সংরক্ষণ করা যায়নি');
      setCqScore(safeScore);
      setSavedAnnotatedUrl(finalAnnotatedUrl);
      setAnnotatedBlob(null);
      setAnnotatedPreviewUrl('');
      setSubmission((prev) => prev ? { ...prev, cqScore: safeScore, totalScore: (prev.mcqScore || 0) + safeScore, teacherFeedback: feedback.trim(), annotatedFileUrl: finalAnnotatedUrl, annotatedFileName: finalAnnotatedUrl ? 'checked_exam_script.png' : prev.annotatedFileName, isEvaluated: true, status: 'evaluated' } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'মূল্যায়ন সংরক্ষণ করা যায়নি');
    } finally {
      setSaving(false);
    }
  };

  const handleAnnotatedScriptSave = (blob: Blob, previewUrl: string) => {
    if (!submission) return;
    setAnnotatedBlob(blob);
    setAnnotatedPreviewUrl((currentUrl) => {
      if (currentUrl.startsWith('blob:')) URL.revokeObjectURL(currentUrl);
      return previewUrl;
    });
  };

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] flex items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-400">লোড হচ্ছে...</div>;
  if (error || !submission || !exam) return <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] flex items-center justify-center p-6"><div className="max-w-md text-center"><AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" /><p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error || 'সাবমিশন পাওয়া যায়নি'}</p></div></div>;

  return (
    <div className="ga-page ga-classroom-page ga-form-page text-slate-900 dark:text-slate-100 pb-24">
      <header className="border-b border-slate-200 bg-white py-6 dark:border-[#262b34] dark:bg-[#111318]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <UserAvatar name={submission.gravId.name} avatarUrl={submission.gravId.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{submission.gravId.name}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.title} · জমা: {formatBDTime(submission.submittedAt)}</p>
            </div>
            <div className="sm:ml-auto text-left sm:text-right">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">বর্তমান স্কোর</p>
              <p className="text-2xl font-black">{submission.totalScore} <span className="text-sm text-white/60">/ {exam.totalMarks}</span></p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-5">
        <section className="space-y-5">
        {submission.studentDocumentUrl && <div className="ga-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-black flex items-center gap-2"><FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />উত্তরপত্র</h2>
              <div className="flex items-center gap-3">
                {submission.annotatedFileUrl && <a href={submission.annotatedFileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />চেকড</a>}
                <a href={submission.studentDocumentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1">খুলুন <ExternalLink className="w-3.5 h-3.5" /></a>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button type="button" onClick={() => { setAnnotationSourceUrl(annotatedPreviewUrl || savedAnnotatedUrl || submission.annotatedFileUrl || submission.studentDocumentUrl || ''); setShowAnnotator(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 px-3 py-2 text-xs font-black text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors">
                <PenTool className="w-3.5 h-3.5" />{submission.annotatedFileUrl ? 'এডিট' : 'অ্যানোটেট'}
              </button>
              {annotatedBlob && <span className="text-[11px] font-bold text-amber-600">নতুন annotation save-এর জন্য প্রস্তুত</span>}
            </div>
            <iframe src={getDrivePreviewUrl(submission.studentDocumentUrl)} title="Answer Script" className="w-full h-[460px] rounded-2xl border border-slate-200 dark:border-[#262b34] bg-slate-100 dark:bg-[#151921]" />
          </div>}
          <div className="bg-white dark:bg-[#111318] rounded-3xl border border-slate-200 dark:border-[#262b34] p-5 shadow-sm"><h2 className="text-sm font-black mb-4">লিখিত উত্তর</h2>{submission.cqAnswers?.length ? <div className="space-y-3">{submission.cqAnswers.map((answer) => <div key={answer.questionIndex} className="rounded-2xl bg-slate-50 dark:bg-[#151921] p-4 border border-slate-100 dark:border-[#262b34]"><p className="text-[11px] font-black text-orange-600 dark:text-orange-400 mb-1">প্রশ্ন {answer.questionIndex + 1}</p><p className="text-sm leading-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{answer.answerText || 'কোনো উত্তর নেই'}</p></div>)}</div> : <p className="text-xs text-slate-500 dark:text-slate-400">কোনো লিখিত উত্তর জমা দেওয়া হয়নি।</p>}</div>
        </section>

          <aside className="ga-card h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-5"><div><p className="text-[11px] text-slate-500 dark:text-slate-400">MCQ স্কোর</p><p className="text-xl font-black text-orange-600 dark:text-orange-400">{submission.mcqScore}</p></div><div className="text-right"><p className="text-[11px] text-slate-500 dark:text-slate-400">CQ সর্বোচ্চ</p><p className="text-xl font-black text-orange-600 dark:text-orange-400">{cqMax}</p></div></div>
          <label className="block text-xs font-black mb-2 text-slate-800 dark:text-slate-200">CQ নম্বর</label>
          <input type="number" min="0" max={cqMax} step="0.5" value={cqScore} onChange={(e) => setCqScore(Math.min(Math.max(Number(e.target.value) || 0, 0), cqMax))} className="w-full rounded-2xl border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">মোট: {(submission.mcqScore || 0) + Number(cqScore)} / {exam.totalMarks}</p>
          <label className="block text-xs font-black mt-5 mb-2 text-slate-800 dark:text-slate-200">ফিডব্যাক</label>
          <textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="শিক্ষার্থীর জন্য সংক্ষিপ্ত feedback লিখুন" className="w-full rounded-2xl border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <button type="button" onClick={handleSave} disabled={saving} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-3 text-sm font-black shadow-md shadow-orange-950/25 transition-all disabled:opacity-60">{saved ? <><Check className="w-4 h-4" />সংরক্ষিত</> : <><Save className="w-4 h-4" />{saving ? 'সংরক্ষণ হচ্ছে...' : 'মূল্যায়ন সংরক্ষণ'}</>}</button>
        </aside>
      </main>

      {showAnnotator && submission && annotationSourceUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full h-full max-w-6xl max-h-[92vh] flex flex-col">
            <DocumentAnnotator
              fileUrl={annotationSourceUrl}
              backgroundFileUrl={submission.studentDocumentUrl}
              fileName={submission.annotatedFileUrl ? (submission.annotatedFileName || 'checked_exam_script.png') : 'exam_answer_script'}
              onSaveAnnotated={handleAnnotatedScriptSave}
              onCancel={() => setShowAnnotator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
