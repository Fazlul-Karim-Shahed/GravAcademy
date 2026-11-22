'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toDateTimeLocalValue } from '@/lib/dateTimeLocal';
import { useAuth } from '@/context/AuthContext';
import TextEditor from '@/components/ui/TextEditor';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';
import { FileUploadField } from '@/components/ui/FileUploadField';
import {
  Edit,
  Calendar,
  File,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Loader2,
  Award,
  Save,
  Eye,
} from 'lucide-react';

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ batchId: string; assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId, assignmentId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      router.push(`/login?redirect=/classroom/${batchId}/assignments/${assignmentId}/edit`);
      return;
    }
    if (user && !['superadmin', 'admin', 'teacher'].includes(user.role)) {
      router.push(`/classroom/${batchId}/assignments`);
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
      const res = await api.get(`/assignments/${assignmentId}`);
      if (res.data?.success) {
        const item = res.data.data;
        const localDue = item.dueDate ? toDateTimeLocalValue(item.dueDate) : '';
        setFormData({
          title: item.title || '',
          description: item.description || '',
          totalMarks: item.totalMarks || 100,
          passMarks: item.passMarks || 40,
          dueDate: localDue,
          allowLateSubmission: item.allowLateSubmission || false,
          latePenaltyPercent: item.latePenaltyPercent || 0,
          attachmentUrl: item.attachmentUrl || '',
          attachmentName: item.attachmentName || '',
          isPublished: item.isPublished !== false,
        });
      }
    } catch (err: any) {
      console.error('Failed to load assignment:', err);
      setError(err.response?.data?.message || 'অ্যাসাইনমেন্টের তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData((prev) => ({
      ...prev,
      attachmentUrl: '',
      attachmentName: '',
    }));
  };

  const handleSelectedFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFormData((prev) => ({
      ...prev,
      attachmentName: file?.name || '',
      attachmentUrl: file ? prev.attachmentUrl : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      setError('শিরোনাম ও শেষ সময় অবশ্যই পূরণ করতে হবে');
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

      // Upload file to Google Drive only on submit!
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
          throw new Error(uploadRes.data?.message || 'ফাইলটি ড্রাইভে আপলোড করা যায়নি');
        }
      }

      const res = await api.put(`/assignments/${assignmentId}`, {
        ...formData,
        attachmentUrl: finalAttachmentUrl,
        attachmentName: finalAttachmentName,
        dueDate: new Date(formData.dueDate).toISOString(),
      });

      if (res.data?.success) {
        router.push(`/classroom/${batchId}/assignments`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'অ্যাসাইনমেন্ট আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ga-page ga-classroom-page ga-form-page text-slate-900 dark:text-slate-100 pb-20">
      <header className="mb-8 border-b border-slate-200 bg-white/80 py-5 dark:border-[#262b34] dark:bg-[#0d0f13]/80 sm:py-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3.5 px-4 sm:px-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
            <Edit className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">অ্যাসাইনমেন্ট সম্পাদনা</h1>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              {formData.title || 'কাজের তথ্য আপডেট করুন'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">অ্যাসাইনমেন্টের তথ্য লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="ga-card space-y-4 p-4 sm:space-y-5 sm:p-6 md:p-7"
            >
              <nav className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-center text-[11px] font-bold text-slate-500 dark:border-[#262b34] dark:text-slate-400"><span className="border-r border-slate-200 px-2 py-3 text-orange-600 dark:border-[#262b34] dark:text-orange-400">নির্দেশনা</span><span className="border-r border-slate-200 px-2 py-3 dark:border-[#262b34]">সময়সীমা</span><span className="px-2 py-3">সাবমিশন</span></nav>
              <div className="px-1 py-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="px-1 py-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  নির্দেশনা ও বিস্তারিত প্রশ্ন
                </label>
                <TextEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  minHeight="240px"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1 py-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    মোট পূর্ণমান *
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
                    পাস নম্বর *
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

              <div className="px-1 py-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  জমা দেওয়ার শেষ সময় *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="px-1 py-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  প্রশ্নপত্র অথবা সহায়ক ফাইল (Google Drive)
                </label>
                <FileUploadField
                  label="প্রশ্নপত্র বা সহায়ক ফাইল"
                  selectedFile={selectedFile}
                  onFileChange={handleSelectedFileChange}
                  existingUrl={formData.attachmentUrl}
                  existingFileName={formData.attachmentName}
                  onPreviewExisting={() => setPreviewDoc({ isOpen: true, url: formData.attachmentUrl, title: 'সংযুক্ত ফাইল', fileName: formData.attachmentName || 'ফাইল' })}
                  onClearExisting={handleRemoveFile}
                  disabled={submitting}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  maxSizeMb={25}
                />
                <div className="hidden min-w-0 max-w-full overflow-hidden p-4 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34]">
                  <div className="flex min-w-0 max-w-full flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      disabled={submitting}
                      className="block min-w-0 max-w-full w-full text-xs file:mr-2 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white hover:file:bg-orange-700 cursor-pointer"
                    />
                  </div>

                  {selectedFile ? (
                    <div className="mt-3 flex min-w-0 max-w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-white dark:bg-[#111318] border border-orange-200 dark:border-orange-800/60 text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">নতুন সিলেক্টেড ফাইল: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold ml-2 shrink-0 cursor-pointer"
                      >
                        ফাইল পরিবর্তন বা বাতিল
                      </button>
                    </div>
                  ) : formData.attachmentUrl ? (
                    <div className="mt-3 flex min-w-0 max-w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">বর্তমান সংযুক্ত ফাইল: {formData.attachmentName || 'ফাইল সংযুক্ত আছে'}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              isOpen: true,
                              url: formData.attachmentUrl,
                              title: `${formData.title || 'অ্যাসাইনমেন্ট'} - সংযুক্ত ফাইল`,
                              fileName: formData.attachmentName || 'ফাইল সংযুক্ত আছে',
                            })
                          }
                          className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>প্রিভিউ দেখুন</span>
                        </button>
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

              <div className="px-1 py-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowLateToggleEdit"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="allowLateToggleEdit" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  ডেডলাইনের পরেও লেইট সাবমিশন গ্রহণ করার অনুমতি দিন
                </label>
              </div>

              {formData.allowLateSubmission && (
                <div className="px-1 py-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">লেইট সাবমিশন পেনাল্টি (%)</label>
                  <input type="number" min={0} max={100} step="0.01" value={formData.latePenaltyPercent} onChange={(e) => setFormData({ ...formData, latePenaltyPercent: Number(e.target.value) })} className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              )}

              <div className="ga-sticky-action-bar flex items-center justify-end gap-3">
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
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>পরিবর্তন সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
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
