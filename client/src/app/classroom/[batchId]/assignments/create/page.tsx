'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import TextEditor from '@/components/ui/TextEditor';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';
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
      api.get(`/classroom/${batchId}`)
        .then(() => setCheckingAccess(false))
        .catch(() => router.push(`/classroom/${batchId}/assignments`));
    }
  }, [batchId, user, authLoading, router]);

  // When user selects a file from disk, only store it locally in state. Do NOT upload to Drive yet!
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('ফাইলের আকার ২৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setSelectedFile(file);
    setFormData((prev) => ({
      ...prev,
      attachmentName: file.name,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
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
                <span className="text-emerald-600 dark:text-emerald-400">নতুন অ্যাসাইনমেন্ট</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>নতুন ব্যাচ অ্যাসাইনমেন্ট তৈরি ও প্রকাশ</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {checkingAccess ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm font-semibold text-slate-500">
            ব্যাচের অনুমতি যাচাই করা হচ্ছে...
          </div>
        ) : <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Assignment Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              অ্যাসাইনমেন্টের শিরোনাম *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মহাকর্ষ ও বলের প্রথম সূত্রের গাণিতিক সমস্যা সমাধান"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Question / Reference File Selection (Uploaded ONLY on Submit) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              প্রশ্নপত্র অথবা সহায়ক ফাইল সংযুক্তকরণ (Google Drive)
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={submitting}
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
                    onClick={handleRemoveSelectedFile}
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold ml-2 shrink-0 cursor-pointer"
                  >
                    ফাইল বাদ দিন
                  </button>
                </div>
              ) : formData.attachmentUrl ? (
                <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">সংযুক্ত ফাইল: {formData.attachmentName || 'ফাইল'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        isOpen: true,
                        url: formData.attachmentUrl,
                        title: 'সংযুক্ত অ্যাসাইনমেন্ট ফাইল',
                        fileName: formData.attachmentName || 'ফাইল',
                      })
                    }
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold shrink-0 ml-2 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>প্রিভিউ</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Late Submission Allowed Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <input
              type="checkbox"
              id="allowLateToggle"
              checked={formData.allowLateSubmission}
              onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="allowLateToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              ডেডলাইনের পরেও লেইট সাবমিশন গ্রহণ করার অনুমতি দিন
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              href={`/classroom/${batchId}/assignments`}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
