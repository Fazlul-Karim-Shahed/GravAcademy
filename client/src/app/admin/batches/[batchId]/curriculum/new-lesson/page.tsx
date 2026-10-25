'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Video,
  Upload,
  Loader2,
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import TextEditor from '@/components/ui/TextEditor';

interface Resource {
  title: string;
  type: string;
  fileAssetId?: any;
  externalUrl?: string;
}

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

  const handleUploadFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ফাইলের আকার ২৫ মেগাবাইটের বেশি হতে পারবে না।' });
      return;
    }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data) {
        let inferredType = 'pdf';
        if (file.type.includes('image')) inferredType = 'worksheet';
        else if (file.type.includes('word') || file.type.includes('officedocument')) inferredType = 'worksheet';

        const newResource: Resource = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          type: inferredType,
          fileAssetId: res.data.data,
        };
        setResources((prev) => [...prev, newResource]);
        setMessage({ type: 'success', text: `"${file.name}" ফাইল সফলভাবে যুক্ত হয়েছে!` });
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Upload failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।' });
    } finally {
      setUploadingFile(false);
    }
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

    setSubmitting(true);
    try {
      const cleanYtId = cleanYouTubeInput(youtubeVideoId);
      const formattedResources = resources.map((r) => ({
        title: r.title,
        type: r.type,
        fileAssetId: typeof r.fileAssetId === 'object' ? r.fileAssetId?._id : r.fileAssetId,
        externalUrl: r.externalUrl,
      }));

      const res = await api.post('/lessons', {
        batchId: resolvedParams.batchId,
        moduleId,
        sectionId: sectionId || undefined,
        title: title.trim(),
        description: description.trim(),
        youtubeVideoId: cleanYtId,
        resources: formattedResources,
      });

      if (res.data?.success) {
        router.push(`/admin/batches/${resolvedParams.batchId}/curriculum`);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to add lesson' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to add lesson' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/batches/${resolvedParams.batchId}/curriculum`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> কারিকুলামে ফিরে যান
          </Link>
          <span className="text-xs text-slate-500 font-medium">
            {parentTitle ? `টার্গেট: ${parentTitle}` : ''}
          </span>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 border shadow-xs animate-in fade-in duration-200 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span className="text-xs sm:text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Main Editor Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                নতুন লেসন তৈরি করুন
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                লেসনের শিরোনাম, ভিডিও লিংক, রিচ নোট এবং লেকচার শিট আপলোড করুন
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                লেসন শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: লেকচার ০১: গতি ও ত্বরণ"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                YouTube ভিডিও লিংক বা আইডি
              </label>
              <input
                type="text"
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value)}
                placeholder="dQw4w9WgXcQ অথবা https://youtu.be/..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                লেসন নোট ও নির্দেশনাসমূহ
              </label>
              <TextEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="এখানে ক্লাসের সারসংক্ষেপ, প্রয়োজনীয় সূত্রাবলী বা নির্দেশনা সুন্দরভাবে সাজিয়ে লিখুন..."
                minHeight="220px"
              />
            </div>

            {/* Materials Upload */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                সংযুক্ত লেকচার শিট ও ফাইল (PDF / Document / Image)
              </label>

              <label className="flex items-center justify-center gap-2.5 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group">
                {uploadingFile ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {uploadingFile ? 'আপলোড হচ্ছে...' : 'ফাইল যুক্ত করুন (PDF, DOCX, JPG/PNG)'}
                </span>
                <input
                  type="file"
                  disabled={uploadingFile}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadFile(file);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              {resources && resources.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    সংযুক্ত ফাইলসমূহ ({resources.length}):
                  </span>
                  {resources.map((res, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {res.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {res.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResources((prev) => prev.filter((_, idx) => idx !== rIdx));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/admin/batches/${resolvedParams.batchId}/curriculum`}
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                বাতিল
              </Link>
              <button
                type="submit"
                disabled={submitting || uploadingFile}
                className="w-full sm:w-auto px-7 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : 'লেসন সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
