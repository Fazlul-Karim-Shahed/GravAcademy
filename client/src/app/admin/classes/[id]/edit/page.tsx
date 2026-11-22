'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
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

const classSections = [
  { id: 'basic', label: 'Basic info' },
  { id: 'curriculum', label: 'Curriculum & FAQs' },
];

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

      const payload = {
        name: classNameInput.trim(),
        order: Number(classOrderInput) || 0,
        subtitle: classSubtitleInput.trim(),
        description: classDescInput.trim(),
        curriculumHighlights: highlightsArray,
        features: featuresArray,
        faqs: faqsArray,
      };

      const currentClasses = await getSharedAcademicClasses();
      const updatedClasses = currentClasses.map((c) => {
        if (
          c._id === classId ||
          c.slug === classId ||
          c.name.toLowerCase() === (targetClass?.name || '').toLowerCase()
        ) {
          return {
            ...c,
            ...payload,
          };
        }
        return c;
      });

      // Save locally & sync backend
      saveSharedAcademicClasses(updatedClasses);
      await api
        .put(`/classes/${targetClass?._id || classId}`, payload)
        .catch(() => {});

      setSuccess(`ক্লাস "${payload.name}" সফলভাবে আপডেট হয়েছে!`);
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

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 py-10 dark:bg-[#0b0d12]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-2xl border-2 border-orange-500/20 border-t-orange-600" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ক্লাস তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref="/admin/classes"
          backLabel="Classes"
          eyebrow="Academic management"
          title={`‘${targetClass?.name || 'ক্লাস'}’ এডিট করুন`}
          description="ক্লাসের বিষয়, group ও public information আপডেট করুন।"
          badge={
            targetClass ? (
              <Link
                href={`/classes/${getClassSlug(targetClass)}`}
                target="_blank"
                className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              >
                Live page
              </Link>
            ) : undefined
          }
        />

        {/* Notification Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Class sections" items={classSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* Section 1: Basic Information */}
            <FormSection
              id="basic"
              icon={<GraduationCap className="h-4 w-4" />}
              title="মৌলিক তথ্য"
              description="ক্লাসের নাম, প্রদর্শনের ক্রম এবং পরিচিতিমূলক হেডলাইন নির্ধারণ করুন।"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      ক্লাসের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="e.g. Class 6, Class 10, HSC"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      নাম পরিবর্তন করলে ফিল্টারিং ও ইউআরএল স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
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
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    পেজের মূল শিরোনাম / হেডলাইন (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={classSubtitleInput}
                    onChange={(e) => setClassSubtitleInput(e.target.value)}
                    placeholder="e.g. ৬ষ্ঠ শ্রেণির পূর্ণাঙ্গ ফাউন্ডেশন ও নতুন কারিকুলাম প্রস্তুতি"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    সংক্ষিপ্ত বিবরণ (Description)
                  </label>
                  <textarea
                    rows={3}
                    value={classDescInput}
                    onChange={(e) => setClassDescInput(e.target.value)}
                    placeholder="e.g. নতুন শিক্ষাক্রমের আলোকে কনসেপ্ট ক্লিয়ারিং, এক্টিভিটি ও হ্যান্ডস-অন প্রজেক্ট ভিত্তিক শিখন।"
                    className={inputClass}
                  />
                </div>
              </div>
            </FormSection>

            {/* Section 2: Curriculum Highlights & Features */}
            <FormSection
              id="curriculum"
              icon={<Sparkles className="h-4 w-4" />}
              title="কারিকুলাম ও ফিচারসমূহ"
              description="ক্লাসের বৈশিষ্ট্য, বিশেষ সুবিধা এবং সচরাচর জিজ্ঞাসিত প্রশ্নাবলী যুক্ত করুন।"
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={labelClass}>
                      কারিকুলাম হাইলাইটস (Curriculum Highlights)
                    </label>
                    <span className="text-[10px] text-slate-400">প্রতি লাইনে ১টি পয়েন্ট</span>
                  </div>
                  <textarea
                    rows={4}
                    value={classHighlightsInput}
                    onChange={(e) => setClassHighlightsInput(e.target.value)}
                    placeholder={'অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস\nস্ট্যান্ডার্ড লেকচার শিট ও স্মার্ট নোটস'}
                    className={`${inputClass} font-mono leading-relaxed`}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={labelClass}>
                      মূল ফিচারসমূহ (Key Features)
                    </label>
                    <span className="text-[10px] text-slate-400">শিরোনাম | বিবরণ (প্রতি লাইনে)</span>
                  </div>
                  <textarea
                    rows={4}
                    value={classFeaturesInput}
                    onChange={(e) => setClassFeaturesInput(e.target.value)}
                    placeholder={'অভিজ্ঞ মেন্টর প্যানেল | অভিজ্ঞ শিক্ষকদের সরাসরি দিকনির্দেশনা\nডিজিটাল নোটস | প্রতিটি অধ্যায়ের পিডিএফ শিট'}
                    className={`${inputClass} font-mono leading-relaxed`}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={labelClass}>
                      সচরাচর জিজ্ঞাসা (Class FAQs)
                    </label>
                    <span className="text-[10px] text-slate-400">প্রশ্ন | উত্তর (প্রতি লাইনে)</span>
                  </div>
                  <textarea
                    rows={3}
                    value={classFaqsInput}
                    onChange={(e) => setClassFaqsInput(e.target.value)}
                    placeholder={'ক্লাস কীভাবে হবে? | গুগল মিটের মাধ্যমে সরাসরি লাইভে হবে।\nরেকর্ডিং থাকবে কি? | হ্যাঁ, ক্লাসরুমে ফুল এইচডি রেকর্ডিং থাকবে।'}
                    className={`${inputClass} font-mono leading-relaxed`}
                  />
                </div>
              </div>
            </FormSection>

            {/* Sticky Action Bar */}
            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
                পরিবর্তনগুলো সংরক্ষণ করতে নিচের বাটনটি চাপুন।
              </div>
              <div className="flex gap-2">
                <Link href="/admin/classes">
                  <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                    বাতিল করুন
                  </Button>
                </Link>
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  পরিবর্তন সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
