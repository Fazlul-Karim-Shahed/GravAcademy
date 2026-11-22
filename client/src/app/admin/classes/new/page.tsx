'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FormPageHeader } from '@/components/ui/FormPageHeader';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  getSharedAcademicClasses,
  saveSharedAcademicClasses,
  AcademicClassItem,
} from '@/lib/classes';

export default function CreateClassPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [classNameInput, setClassNameInput] = useState('');
  const [classOrderInput, setClassOrderInput] = useState(1);
  const [classSubtitleInput, setClassSubtitleInput] = useState('');
  const [classDescInput, setClassDescInput] = useState('');
  const [classHighlightsInput, setClassHighlightsInput] = useState(
    'অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস\nস্ট্যান্ডার্ড লেকচার শিট ও স্মার্ট নোটস\nসাপ্তাহিক ও মাসিক মেগা মডেল টেস্ট\nনিয়মিত প্রোগ্রেস ট্র্যাকিং ও গার্ডিয়ান মনিটরিং'
  );
  const [classFeaturesInput, setClassFeaturesInput] = useState(
    'অভিজ্ঞ মেন্টর প্যানেল | শীর্ষস্থানীয় বিশ্ববিদ্যালয় ও বোর্ডের অভিজ্ঞ শিক্ষকদের প্রত্যক্ষ তত্ত্বাবধান\nগোছানো কারিকুলাম | প্রতিটি বিষয়ের মৌলিক থিওরি ও অনুশীলনী সমাধান\n২৪/৭ ডাউট ক্লিয়ারিং | পড়াশোনায় যেকোনো জটিলতায় সার্বক্ষণিক গ্রুপ সহায়তা'
  );
  const [classFaqsInput, setClassFaqsInput] = useState(
    'ক্লাসগুলো কীভাবে অনুষ্ঠিত হবে? | সবগুলো ক্লাস গুগল মিট বা জুম-এর মাধ্যমে সরাসরি লাইভে নেওয়া হবে।\nরেকর্ডেড ক্লাস পাওয়া যাবে কি? | হ্যাঁ, প্রতিটি ক্লাসের পর ক্লাসরুমে সম্পূর্ণ এইচডি রেকর্ডিং ও নোটস পাওয়া যাবে।'
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSharedAcademicClasses().then((clsList) => {
      setClassOrderInput(clsList.length + 1);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      setError('ক্লাসের নাম দেওয়া আবশ্যক (যেমন: Class 6, Class 10)');
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

      // 1. Fetch current classes
      const currentClasses = await getSharedAcademicClasses();

      // Check if class name or slug already exists
      const exists = currentClasses.some(
        (c) =>
          c.name.toLowerCase() === payload.name.toLowerCase() ||
          c.slug === payload.slug
      );
      if (exists) {
        throw new Error(`"${payload.name}" নামের ক্লাস ইতোমধ্যে তৈরি করা আছে।`);
      }

      const newClassItem: AcademicClassItem = {
        _id: `class-${Date.now()}`,
        ...payload,
        subjects: [],
        createdAt: new Date().toISOString(),
      };

      const updatedClasses = [...currentClasses, newClassItem];

      // Save locally and try backend
      saveSharedAcademicClasses(updatedClasses);
      await api.post('/classes', payload).catch(() => {});

      setSuccess(`ক্লাস "${payload.name}" সফলভাবে যুক্ত হয়েছে!`);
      setTimeout(() => {
        router.push('/admin/classes');
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'ক্লাস সেভ করতে ব্যর্থ হয়েছে।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ga-page ga-admin-page ga-form-page py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <FormPageHeader backHref="/admin/classes" backLabel="Classes" eyebrow="Academic setup" title="নতুন একাডেমিক ক্লাস তৈরি করুন" description="ক্লাসের নাম, group ও বিষয়গুলো এক জায়গা থেকে সাজান।" badge={<span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">New class</span>} />

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
          <div className="ga-card p-6 sm:p-8 space-y-6">
            <nav className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 text-center text-xs font-bold dark:border-[#262b34]"><span className="border-r border-slate-200 px-3 py-3 text-orange-600 dark:border-[#262b34] dark:text-orange-400">মৌলিক তথ্য</span><span className="px-3 py-3 text-slate-500 dark:text-slate-400">কারিকুলাম</span></nav>
            
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-[#262b34]">
                <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
                    className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    এই নামের ভিত্তিতেই কোর্সসমূহ ফিল্টার হবে এবং URL স্লাগ স্বয়ংক্রিয় তৈরি হবে।
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
                    className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-bold"
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Section 2: Curriculum Highlights & Features */}
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-[#262b34]">
                <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Submit / Cancel Actions */}
            <div className="ga-sticky-action-bar mt-6 flex-col-reverse sm:flex-row">
              <Link
                href="/admin/classes"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#151921] text-xs font-bold transition-colors"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-black shadow-md shadow-orange-950/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'ক্লাস তৈরি হচ্ছে...' : 'ক্লাস তৈরি করুন'}
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
