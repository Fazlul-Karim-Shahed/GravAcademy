'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
import {
  ArrowLeft,
  FileVideo,
  Upload,
  Loader2,
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
} from 'lucide-react';
import TextEditor from '@/components/ui/TextEditor';
import { FileUploadField } from '@/components/ui/FileUploadField';

interface Resource {
  title: string;
  type: string;
  fileAssetId?: any;
  externalUrl?: string;
}

const lessonSections = [
  { id: 'basic', label: 'Basic & video' },
  { id: 'notes', label: 'Notes & details' },
  { id: 'materials', label: 'Lecture materials' },
];

export default function NewLessonPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = searchParams.get('moduleId') || '';
  const sectionId = searchParams.get('sectionId') || '';
  const parentTitle = searchParams.get('parent') || '';

  const [title, setTitle] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cleanYouTubeInput = (raw: string) => {
    let clean = raw.trim();
    if (clean.includes('v=')) {
      clean = clean.split('v=')[1]?.split('&')[0] || clean;
    } else if (clean.includes('youtu.be/')) {
      clean = clean.split('youtu.be/')[1]?.split('?')[0] || clean;
    }
    return clean;
  };

  const uploadPendingFile = async (file: File): Promise<Resource> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'ফাইল আপলোড ব্যর্থ হয়েছে।');
    const inferredType =
      file.type.includes('image') || file.type.includes('word') || file.type.includes('officedocument')
        ? 'worksheet'
        : 'pdf';
    return { title: file.name.replace(/\.[^/.]+$/, ''), type: inferredType, fileAssetId: res.data.data };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'লেসন শিরোনাম আবশ্যক।' });
      return;
    }
    if (!moduleId) {
      setMessage({ type: 'error', text: 'মডিউল সিলেক্ট করা নেই।' });
      return;
    }

    const cleanYtId = cleanYouTubeInput(youtubeVideoId);
    if (cleanYtId && !/^[A-Za-z0-9_-]{11}$/.test(cleanYtId)) {
      setMessage({
        type: 'error',
        text: 'YouTube ভিডিও লিংক বা আইডি সঠিক নয়। সঠিক YouTube লিংক বা ১১ অক্ষরের ভিডিও আইডি দিন।',
      });
      return;
    }

    setSubmitting(true);
    setUploadingFile(Boolean(pendingFiles.length));
    try {
      const uploadedResources = pendingFiles.length
        ? await Promise.all(pendingFiles.map(uploadPendingFile))
        : [];
      const formattedResources = [...resources, ...uploadedResources].map((r) => ({
        title: r.title,
        type: r.type,
        fileAssetId: typeof r.fileAssetId === 'object' ? r.fileAssetId?._id : r.fileAssetId,
        externalUrl: r.externalUrl || '',
      }));

      const payload = {
        title: title.trim(),
        youtubeVideoId: cleanYtId,
        description: description.trim(),
        resources: formattedResources,
      };

      const queryParams = new URLSearchParams({ moduleId });
      if (sectionId) queryParams.set('sectionId', sectionId);

      const res = await api.post(`/batches/${resolvedParams.batchId}/curriculum/lessons?${queryParams.toString()}`, payload);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'লেসন সফলভাবে তৈরি হয়েছে!' });
        setTimeout(() => {
          router.push(`/admin/batches/${resolvedParams.batchId}/curriculum`);
        }, 1200);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to add lesson' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to add lesson' });
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref={`/admin/batches/${resolvedParams.batchId}/curriculum`}
          backLabel="Curriculum"
          eyebrow={parentTitle ? `Target: ${parentTitle}` : 'Curriculum setup'}
          title="নতুন লেসন তৈরি করুন"
          description="লেসনের শিরোনাম, ভিডিও লিংক, রিচ নোট এবং লেকচার শিট আপলোড করুন।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              New lesson
            </span>
          }
        />

        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-xs ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Lesson sections" items={lessonSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* Section 1: Basic & Video */}
            <FormSection
              id="basic"
              icon={<Video className="h-4 w-4" />}
              title="লেসন শিরোনাম ও ভিডিও"
              description="লেসনের নাম এবং সংশ্লিষ্ট YouTube ক্লাস ভিডিও লিংক বা আইডি যুক্ত করুন।"
            >
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    লেসন শিরোনাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: লেকচার ০১: গতি ও ত্বরণ"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    YouTube ভিডিও লিংক বা আইডি
                  </label>
                  <input
                    type="text"
                    value={youtubeVideoId}
                    onChange={(e) => setYoutubeVideoId(e.target.value)}
                    placeholder="dQw4w9WgXcQ অথবা https://youtu.be/..."
                    className={`${inputClass} font-mono`}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    ফুল ভিডিও লিংক দিলে আইডি স্বয়ংক্রিয়ভাবে আলাদা হয়ে যাবে।
                  </p>
                </div>
              </div>
            </FormSection>

            {/* Section 2: Notes */}
            <FormSection
              id="notes"
              icon={<FileText className="h-4 w-4" />}
              title="লেসন নোট ও নির্দেশনাসমূহ"
              description="ক্লাসের সারসংক্ষেপ, প্রয়োজনীয় সূত্রাবলী বা নির্দেশনা সুন্দরভাবে সাজিয়ে লিখুন।"
            >
              <div>
                <TextEditor
                  value={description}
                  onChange={(val) => setDescription(val)}
                  placeholder="এখানে ক্লাসের সারসংক্ষেপ, প্রয়োজনীয় সূত্রাবলী বা নির্দেশনা সুন্দরভাবে সাজিয়ে লিখুন..."
                  minHeight="220px"
                />
              </div>
            </FormSection>

            {/* Section 3: Materials */}
            <FormSection
              id="materials"
              icon={<Paperclip className="h-4 w-4" />}
              title="সংযুক্ত লেকচার শিট ও ফাইল"
              description="লেকচার শিট, হ্যান্ডনোট, ইমেজ বা অন্যান্য সহায়ক ফাইল আপলোড করুন।"
            >
              <div className="space-y-4">
                <FileUploadField
                  label="Lesson materials"
                  selectedFile={pendingFiles[0] || null}
                  selectedFiles={pendingFiles}
                  multiple
                  onFileChange={(file) => setPendingFiles(file ? [file] : [])}
                  onFilesChange={setPendingFiles}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSizeMb={25}
                  disabled={uploadingFile || submitting}
                />

                {resources && resources.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                      সংযুক্ত ফাইলসমূহ ({resources.length}):
                    </span>
                    {resources.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-[#262b34] dark:bg-[#151921]"
                      >
                        <div className="flex min-w-0 items-center gap-2.5 pr-3">
                          <Paperclip className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {res.title}
                          </span>
                          <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400 dark:border-[#262b34] dark:bg-[#111318]">
                            {res.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setResources((prev) => prev.filter((_, idx) => idx !== rIdx));
                          }}
                          className="p-1.5 text-slate-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>

            {/* Sticky Action Bar */}
            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
                লেসনটি কারিকুলামে যুক্ত করতে সেভ বাটনে চাপুন।
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/batches/${resolvedParams.batchId}/curriculum`}>
                  <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                    বাতিল
                  </Button>
                </Link>
                <Button
                  type="submit"
                  isLoading={submitting || uploadingFile}
                  className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  লেসন সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
