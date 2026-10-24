'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import {
  getSharedAcademicClasses,
  saveSharedAcademicClasses,
  AcademicClassItem,
  getClassSlug,
} from '@/lib/classes';

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = (params?.id as string) || '';
  const { user } = useAuth();

  const [targetClass, setTargetClass] = useState<AcademicClassItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [classNameInput, setClassNameInput] = useState('');
  const [classOrderInput, setClassOrderInput] = useState(0);
  const [classSubtitleInput, setClassSubtitleInput] = useState('');
  const [classDescInput, setClassDescInput] = useState('');
  const [classHighlightsInput, setClassHighlightsInput] = useState('');
  const [classFeaturesInput, setClassFeaturesInput] = useState('');
  const [classFaqsInput, setClassFaqsInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      const classList = await getSharedAcademicClasses();
      const found = classList.find(
        (c) =>
          c._id === classId ||
          c.slug === classId ||
          c.name.toLowerCase() === classId.toLowerCase()
      );

      if (found) {
        setTargetClass(found);
        setClassNameInput(found.name);
        setClassOrderInput(found.order || 0);
        setClassSubtitleInput(found.subtitle || '');
        setClassDescInput(found.description || '');
        setClassHighlightsInput((found.curriculumHighlights || []).join('\n'));

        const formattedFeatures = (found.features || [])
          .map((f) => `${f.title} | ${f.description}`)
          .join('\n');
        setClassFeaturesInput(formattedFeatures);

        const formattedFaqs = (found.faqs || [])
          .map((q) => `${q.question} | ${q.answer}`)
          .join('\n');
        setClassFaqsInput(formattedFaqs);
      } else {
        setError('অনুরোধকৃত ক্লাসটি খুঁজে পাওয়া যায়নি।');
      }
    } catch (err: any) {
      setError('ক্লাসের তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      setError('ক্লাসের নাম দেওয়া আবশ্যক');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const highlightsArray = classHighlightsInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const featuresArray = classFeaturesInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          return {
            title: parts[0] || '',
            description: parts[1] || parts[0] || '',
          };
        });

      const faqsArray = classFaqsInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          return {
            question: parts[0] || '',
            answer: parts[1] || '',
          };
        });

      const slug = classNameInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const payload = {
        name: classNameInput.trim(),
        slug,
        order: Number(classOrderInput) || 0,
        subtitle: classSubtitleInput.trim(),
        description: classDescInput.trim(),
        curriculumHighlights: highlightsArray,
        features: featuresArray,
        faqs: faqsArray,
      };

      const currentClasses = await getSharedAcademicClasses();

      const updatedClasses = currentClasses.map((c) =>
        c._id === classId || c._id === targetClass?._id || c.name === targetClass?.name
          ? { ...c, ...payload }
          : c
      );

      // Save locally and update backend
      saveSharedAcademicClasses(updatedClasses);
      if (targetClass?._id) {
        await api.put(`/classes/${targetClass._id}`, payload).catch(() => {});
      }

      setSuccess(`ক্লাস "${payload.name}" সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => {
        router.push('/admin/classes');
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'ক্লাস আপডেট করতে ব্যর্থ হয়েছে।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ক্লাসের তথ্য লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/admin/classes"
              className="hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সকল ক্লাস</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">
              {targetClass?.name || 'এডিট ক্লাস'}
            </span>
          </div>

          {targetClass && (
            <Link
              href={`/classes/${getClassSlug(targetClass)}`}
              target="_blank"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <span>লাইভ ক্লাস পেজ দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Academic Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              &lsquo;{targetClass?.name}&rsquo; এডিট করুন
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ক্লাসের নাম পরিবর্তন করলে এই ক্লাসের অন্তর্ভুক্ত সব কোর্সে স্বয়ংক্রিয়ভাবে আপডেট হবে।
            </p>
          </div>
        </div>

        {/* Notification Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>মৌলিক তথ্য</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Class Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ক্লাসের নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="e.g. Class 6, Class 10, HSC"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    নাম পরিবর্তন করলে ফিল্টারিং ও ইউআরএল স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।
                  </p>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    প্রদর্শনের ক্রম (Order)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={classOrderInput === 0 ? '' : classOrderInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setClassOrderInput(raw === '' ? 0 : Number(raw));
                    }}
                    placeholder="1, 2, 3..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Subtitle / Program Headline */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  পেজের মূল শিরোনাম / হেডলাইন (Subtitle)
                </label>
                <input
                  type="text"
                  value={classSubtitleInput}
                  onChange={(e) => setClassSubtitleInput(e.target.value)}
                  placeholder="e.g. ৬ষ্ঠ শ্রেণির পূর্ণাঙ্গ ফাউন্ডেশন ও নতুন কারিকুলাম প্রস্তুতি"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  সংক্ষিপ্ত বিবরণ (Description)
                </label>
                <textarea
                  rows={3}
                  value={classDescInput}
                  onChange={(e) => setClassDescInput(e.target.value)}
                  placeholder="e.g. নতুন শিক্ষাক্রমের আলোকে কনসেপ্ট ক্লিয়ারিং, এক্টিভিটি ও হ্যান্ডস-অন প্রজেক্ট ভিত্তিক শিখন।"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 2: Curriculum Highlights & Features */}
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>কারিকুলাম ও ফিচারসমূহ</span>
              </h2>

              {/* Curriculum Highlights */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    কারিকুলাম হাইলাইটস (Curriculum Highlights)
                  </label>
                  <span className="text-[10px] text-slate-400">প্রতি লাইনে ১টি পয়েন্ট</span>
                </div>
                <textarea
                  rows={4}
                  value={classHighlightsInput}
                  onChange={(e) => setClassHighlightsInput(e.target.value)}
                  placeholder="অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস&#10;স্ট্যান্ডার্ড লেকচার শিট ও স্মার্ট নোটস"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              {/* Features (Title | Description) */}
              <div className="space-y-1.5 mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    মূল ফিচারসমূহ (Key Features)
                  </label>
                  <span className="text-[10px] text-slate-400">শিরোনাম | বিবরণ (প্রতি লাইনে)</span>
                </div>
                <textarea
                  rows={4}
                  value={classFeaturesInput}
                  onChange={(e) => setClassFeaturesInput(e.target.value)}
                  placeholder="অভিজ্ঞ মেন্টর প্যানেল | অভিজ্ঞ শিক্ষকদের সরাসরি দিকনির্দেশনা&#10;ডিজিটাল নোটস | প্রতিটি অধ্যায়ের পিডিএফ শিট"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              {/* FAQs (Question | Answer) */}
              <div className="space-y-1.5 mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    সচরাচর জিজ্ঞাসা (Class FAQs)
                  </label>
                  <span className="text-[10px] text-slate-400">প্রশ্ন | উত্তর (প্রতি লাইনে)</span>
                </div>
                <textarea
                  rows={3}
                  value={classFaqsInput}
                  onChange={(e) => setClassFaqsInput(e.target.value)}
                  placeholder="ক্লাস কীভাবে হবে? | গুগল মিটের মাধ্যমে সরাসরি লাইভে হবে।&#10;রেকর্ডিং থাকবে কি? | হ্যাঁ, ক্লাসরুমে ফুল এইচডি রেকর্ডিং থাকবে।"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Submit / Cancel Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Link
                href="/admin/classes"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
