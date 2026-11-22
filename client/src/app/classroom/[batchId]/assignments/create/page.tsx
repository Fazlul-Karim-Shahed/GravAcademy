'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import TextEditor from '@/components/ui/TextEditor';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';
import { FileUploadField } from '@/components/ui/FileUploadField';
import {
  PlusCircle,
  ArrowLeft,
  ChevronRight,
  Calendar,
  File,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Loader2,
  ExternalLink,
  Award,
  Sparkles,
  Eye,
} from 'lucide-react';

export default function CreateAssignmentPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMarks: 100,
    passMarks: 40,
    dueDate: '',
    allowLateSubmission: false,
    latePenaltyPercent: 0,
    attachmentUrl: '',
    attachmentName: '',
    isPublished: true,
  });

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    fileName?: string;
  }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}/assignments/create`);
      return;
    }
    // Only teacher or admin allowed
    if (user && !['superadmin', 'admin', 'teacher'].includes(user.role)) {
      router.push(`/classroom/${batchId}/assignments`);
      return;
    }

    if (user && ['superadmin', 'admin', 'teacher'].includes(user.role)) {
      api.get(`/classrooms/${batchId}`)
        .then(() => setCheckingAccess(false))
        .catch(() => router.push(`/classroom/${batchId}/assignments`));
    }
  }, [batchId, user, authLoading, router]);


  const handleSelectedFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFormData((prev) => ({
      ...prev,
      attachmentName: file?.name || '',
      attachmentUrl: file ? prev.attachmentUrl : '',
    }));
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFormData((prev) => ({
      ...prev,
      attachmentUrl: '',
      attachmentName: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      setError('শিরোনাম ও শেষ সময় (Due Date) অবশ্যই পূরণ করতে হবে');
      return;
    }
    if (formData.passMarks > formData.totalMarks) {
      setError('পাস নম্বর কখনও পূর্ণমানের চেয়ে বেশি হতে পারবে না');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let finalAttachmentUrl = formData.attachmentUrl;
      let finalAttachmentName = formData.attachmentName;

      // Upload file to Google Drive ONLY when submitting the form!
      if (selectedFile) {
        const data = new FormData();
        data.append('file', selectedFile);

        const uploadRes = await api.post('/documents/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success && uploadRes.data?.data) {
          const fileAsset = uploadRes.data.data;
          finalAttachmentUrl =
            fileAsset.url || fileAsset.fileUrl || fileAsset.streamUrl || fileAsset.driveDownloadUrl || fileAsset.googleDriveFileId;
          finalAttachmentName = selectedFile.name;
        } else {
          throw new Error(uploadRes.data?.message || 'ফাইলটি ড্রাইভে আপলোড করা সম্ভব হয়নি');
        }
      }

      const res = await api.post('/assignments', {
        ...formData,
        attachmentUrl: finalAttachmentUrl,
        attachmentName: finalAttachmentName,
        batchId,
        dueDate: new Date(formData.dueDate).toISOString(),
      });

      if (res.data?.success) {
        router.push(`/classroom/${batchId}/assignments`);
      }
    } catch (err: any) {
      console.error('Failed to create assignment:', err);
      setError(err.response?.data?.message || err.message || 'অ্যাসাইনমেন্ট প্রকাশ করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ga-page ga-classroom-page ga-form-page text-slate-900 dark:text-slate-100 pb-20">
      <header className="mb-8 border-b border-slate-200 bg-white/80 py-5 dark:border-[#262b34] dark:bg-[#0d0f13]/80 sm:py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/classroom/${batchId}/assignments`}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-300"
              title="অ্যাসাইনমেন্ট লিস্টে ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="mb-0.5 flex items-center gap-2 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link href={`/classroom/${batchId}`} className="hover:underline">
                  ক্লাসরুম
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/classroom/${batchId}/assignments`} className="hover:underline">
                  অ্যাসাইনমেন্ট
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-orange-300">নতুন অ্যাসাইনমেন্ট</span>
              </div>
              <h1 className="flex items-center gap-2 truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                <PlusCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <span>নতুন ব্যাচ অ্যাসাইনমেন্ট তৈরি ও প্রকাশ</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {checkingAccess ? (
          <div className="ga-card p-10 text-center text-sm font-semibold text-slate-500">
            ব্যাচের অনুমতি যাচাই করা হচ্ছে...
          </div>
        ) : <form onSubmit={handleSubmit} className="ga-card space-y-6 p-4 sm:p-6 md:p-8">
          <nav className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-center text-[11px] font-bold text-slate-500 dark:border-[#262b34] dark:text-slate-400"><span className="border-r border-slate-200 px-2 py-3 text-orange-600 dark:border-[#262b34] dark:text-orange-400">নির্দেশনা</span><span className="border-r border-slate-200 px-2 py-3 dark:border-[#262b34]">সময়সীমা</span><span className="px-2 py-3">সাবমিশন</span></nav>
          {/* Assignment Title */}
          <div>
            <label className="hidden">
              অ্যাসাইনমেন্টের শিরোনাম *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মহাকর্ষ ও বলের প্রথম সূত্রের গাণিতিক সমস্যা সমাধান"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>

          {/* Rich Text Editor for Instructions & Guidelines */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              নির্দেশনা ও বিস্তারিত প্রশ্ন (রিচ টেক্সট এডিটর)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              শিক্ষার্থীদের করণীয় বিষয়াবলী, সূত্র বা প্রশ্নসমূহ হেডিং, বোল্ড বা নাম্বারিং দিয়ে সাজিয়ে লিখুন।
            </p>
            <TextEditor
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="এখানে শিক্ষার্থীদের জন্য বিস্তারিত গাইডলাইন, প্রশ্নের নির্দেশনা বা টেক্সট উল্লেখ করুন..."
              minHeight="240px"
            />
          </div>

          {/* Marks and Pass Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                মোট পূর্ণমান (Total Marks) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                পাস নম্বর (Pass Marks) *
              </label>
              <input
                type="number"
                required
                min={0}
                max={formData.totalMarks}
                value={formData.passMarks}
                onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              জমা দেওয়ার শেষ সময় (Due Date & Time) *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Question / Reference File Selection (Uploaded ONLY on Submit) */}
          <div>
            <label className="hidden">
              প্রশ্নপত্র অথবা সহায়ক ফাইল সংযুক্তকরণ (Google Drive)
            </label>
            <FileUploadField
              label="প্রশ্নপত্র অথবা সহায়ক ফাইল সংযুক্ত করুন"
              selectedFile={selectedFile}
              onFileChange={handleSelectedFileChange}
              existingUrl={formData.attachmentUrl}
              existingFileName={formData.attachmentName}
              disabled={submitting}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onPreviewExisting={() => setPreviewDoc({ isOpen: true, url: formData.attachmentUrl, title: 'সংযুক্ত অ্যাসাইনমেন্ট ফাইল', fileName: formData.attachmentName || 'ফাইল' })}
              onClearExisting={handleRemoveSelectedFile}
            />

          </div>

          {/* Late Submission Allowed Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] flex items-center gap-3">
            <input
              type="checkbox"
              id="allowLateToggle"
              checked={formData.allowLateSubmission}
              onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="allowLateToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              ডেডলাইনের পরেও লেইট সাবমিশন গ্রহণ করার অনুমতি দিন
            </label>
          </div>

          {formData.allowLateSubmission && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">লেইট সাবমিশন পেনাল্টি (%)</label>
              <input type="number" min={0} max={100} step="0.01" value={formData.latePenaltyPercent} onChange={(e) => setFormData({ ...formData, latePenaltyPercent: Number(e.target.value) })} className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="ga-sticky-action-bar mt-6">
            <Link
              href={`/classroom/${batchId}/assignments`}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1c222d] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>অ্যাসাইনমেন্ট প্রকাশ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>}
      </div>
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
