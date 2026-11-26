'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toDateTimeLocalValue } from '@/lib/dateTimeLocal';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import TextEditor from '@/components/ui/TextEditor';
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal';
import { FileUploadField } from '@/components/ui/FileUploadField';
import { Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
import {
  FileText,
  Calendar,
  Award,
  Sparkles,
  Paperclip,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';

const assignmentSections = [
  { id: 'basic', label: 'Basic details' },
  { id: 'guidelines', label: 'Instructions & text' },
  { id: 'grading', label: 'Marks & due date' },
  { id: 'files', label: 'Attachment & rules' },
];

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ batchId: string; assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId, assignmentId } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canManageAssignments =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'teacher' ||
    hasPermission(user, PERMISSIONS.ASSIGNMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.EXAMS_MANAGE);

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
    if (user && !canManageAssignments) {
      router.push(`/classroom/${batchId}/assignments`);
      return;
    }
    if (user && canManageAssignments && assignmentId) {
      loadData();
    }
  }, [batchId, assignmentId, user, authLoading, canManageAssignments, router]);

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
            fileAsset.url ||
            fileAsset.fileUrl ||
            fileAsset.streamUrl ||
            fileAsset.driveDownloadUrl ||
            fileAsset.googleDriveFileId;
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

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 py-10 dark:bg-[#0b0d12]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-2xl border-2 border-orange-500/20 border-t-orange-600" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">অ্যাসাইনমেন্টের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref={`/classroom/${batchId}/assignments`}
          backLabel="Assignments"
          eyebrow="Assignment settings"
          title="অ্যাসাইনমেন্ট সম্পাদনা"
          description="অ্যাসাইনমেন্টের প্রশ্নাবলী, শেষ সময় এবং নম্বর সমন্বয় করুন।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              Edit assignment
            </span>
          }
        />

        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Assignment sections" items={assignmentSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* Section 1: Basic */}
            <FormSection
              id="basic"
              icon={<FileText className="h-4 w-4" />}
              title="অ্যাসাইনমেন্ট শিরোনাম"
              description="অ্যাসাইনমেন্টের মূল শিরোনাম যা শিক্ষার্থীরা দেখতে পাবে।"
            >
              <div>
                <label className={labelClass}>
                  শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass}
                />
              </div>
            </FormSection>

            {/* Section 2: Instructions */}
            <FormSection
              id="guidelines"
              icon={<Sparkles className="h-4 w-4" />}
              title="নির্দেশনা ও বিস্তারিত প্রশ্নাবলী"
              description="শিক্ষার্থীদের করণীয় বিষয়াবলী এবং প্রশ্নের নির্দেশনা বিস্তারিত লিখুন।"
            >
              <div>
                <TextEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  minHeight="240px"
                />
              </div>
            </FormSection>

            {/* Section 3: Grading & Schedule */}
            <FormSection
              id="grading"
              icon={<Award className="h-4 w-4" />}
              title="নম্বর ও ডেডলাইন"
              description="মোট পূর্ণমান, পাস নম্বর এবং জমা দেওয়ার শেষ তারিখ ও সময় নির্ধারণ করুন।"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      মোট পূর্ণমান <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      পাস নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={formData.totalMarks}
                      value={formData.passMarks}
                      onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    জমা দেওয়ার শেষ সময় <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </FormSection>

            {/* Section 4: Files & Rules */}
            <FormSection
              id="files"
              icon={<Paperclip className="h-4 w-4" />}
              title="সংযুক্ত ফাইল ও লেইট সাবমিশন"
              description="প্রশ্নপত্র বা সহায়ক ফাইল এবং দেরিতে জমা দেওয়ার নিয়মাবলি পরিবর্তন করুন।"
            >
              <div className="space-y-4">
                <FileUploadField
                  label="প্রশ্নপত্র বা সহায়ক ফাইল"
                  selectedFile={selectedFile}
                  onFileChange={handleSelectedFileChange}
                  existingUrl={formData.attachmentUrl}
                  existingFileName={formData.attachmentName}
                  onPreviewExisting={() =>
                    setPreviewDoc({
                      isOpen: true,
                      url: formData.attachmentUrl,
                      title: 'সংযুক্ত ফাইল',
                      fileName: formData.attachmentName || 'ফাইল',
                    })
                  }
                  onClearExisting={handleRemoveFile}
                  disabled={submitting}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  maxSizeMb={25}
                />

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#262b34] dark:bg-[#151921]/40">
                  <input
                    type="checkbox"
                    id="allowLateToggleEdit"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    className="h-4 w-4 rounded accent-orange-600 cursor-pointer"
                  />
                  <label
                    htmlFor="allowLateToggleEdit"
                    className="cursor-pointer text-xs font-semibold text-slate-700 select-none dark:text-slate-300"
                  >
                    ডেডলাইনের পরেও লেইট সাবমিশন গ্রহণ করার অনুমতি দিন
                  </label>
                </div>

                {formData.allowLateSubmission && (
                  <div>
                    <label className={labelClass}>লেইট সাবমিশন পেনাল্টি (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formData.latePenaltyPercent}
                      onChange={(e) => setFormData({ ...formData, latePenaltyPercent: Number(e.target.value) })}
                      className={`${inputClass} sm:max-w-xs`}
                    />
                  </div>
                )}
              </div>
            </FormSection>

            {/* Sticky Action Bar */}
            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
                পরিবর্তনগুলো সংরক্ষণ করতে নিচের বাটনে চাপুন।
              </div>
              <div className="flex gap-2">
                <Link href={`/classroom/${batchId}/assignments`}>
                  <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                    বাতিল
                  </Button>
                </Link>
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  <Save className="mr-1.5 h-4 w-4" /> পরিবর্তন সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Document Preview Modal */}
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
