'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  ArrowLeft,
  Building,
  Calendar,
  DollarSign,
  GraduationCap,
  Users,
  Clock,
  Plus,
  Trash2,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import TextEditor from '@/components/ui/TextEditor';
import { Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';

interface CustomField {
  label: string;
  value: string;
}

interface JobPostFormProps {
  params?: Promise<{ id?: string }>;
}

const jobSections = [
  { id: 'primary', label: 'Primary info' },
  { id: 'eligibility', label: 'Qualifications & post' },
  { id: 'dates', label: 'Timeline & fees' },
  { id: 'details', label: 'Description & circular' },
  { id: 'custom', label: 'Custom fields' },
  { id: 'status', label: 'Publishing status' },
];

export default function AdminJobFormPage({ params }: JobPostFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Resolve params if editing
  const resolvedParams = params ? use(params) : undefined;
  const jobId = resolvedParams?.id;
  const isEditing = Boolean(jobId && jobId !== 'new');

  // Form State
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogo, setOrganizationLogo] = useState('');
  const [sector, setSector] = useState<string>('govt');
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [category, setCategory] = useState('সাধারণ সরকারি');
  const [postName, setPostName] = useState('');
  const [vacancyCount, setVacancyCount] = useState('');
  const [salaryScale, setSalaryScale] = useState('');
  const [educationalQualification, setEducationalQualification] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [ageLimit, setAgeLimit] = useState('');
  const [applicationFee, setApplicationFee] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [applicationStartDate, setApplicationStartDate] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [sourceOrNewspaper, setSourceOrNewspaper] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [circularImageUrl, setCircularImageUrl] = useState('');
  const [circularPdfUrl, setCircularPdfUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescriptionHtml, setFullDescriptionHtml] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [featured, setFeatured] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedSlug, setSavedSlug] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditing && jobId) {
      loadJobDetails(jobId);
    }
  }, [jobId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/jobs/categories');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
        if (!isEditing && res.data.data.length > 0) {
          setSector(res.data.data[0].slug);
        }
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const loadJobDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}`);
      const j = res.data.data;
      if (j) {
        setTitle(j.title || '');
        setOrganizationName(j.organizationName || '');
        setOrganizationLogo(j.organizationLogo || '');
        setSector(j.sector || 'govt');
        setCategory(j.category || 'সাধারণ সরকারি');
        setPostName(j.postName || '');
        setVacancyCount(j.vacancyCount || '');
        setSalaryScale(j.salaryScale || '');
        setEducationalQualification(j.educationalQualification || '');
        setExperienceRequired(j.experienceRequired || '');
        setAgeLimit(j.ageLimit || '');
        setApplicationFee(j.applicationFee || '');
        if (j.publishDate) setPublishDate(new Date(j.publishDate).toISOString().split('T')[0]);
        if (j.applicationStartDate) setApplicationStartDate(new Date(j.applicationStartDate).toISOString().split('T')[0]);
        if (j.applicationDeadline) setApplicationDeadline(new Date(j.applicationDeadline).toISOString().split('T')[0]);
        setSourceOrNewspaper(j.sourceOrNewspaper || '');
        setOfficialWebsite(j.officialWebsite || '');
        setCircularImageUrl(j.circularImageUrl || '');
        setCircularPdfUrl(j.circularPdfUrl || '');
        setShortDescription(j.shortDescription || '');
        setFullDescriptionHtml(j.fullDescriptionHtml || '');
        setCustomFields(j.customFields || []);
        setStatus(j.status || 'published');
        setFeatured(Boolean(j.featured));
        setSavedSlug(j.slug || '');
      }
    } catch (e: any) {
      setErrorMessage(e.response?.data?.message || 'সার্কুলারের তথ্য লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Add Dynamic Custom Field
  const handleAddCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  // Update Custom Field
  const handleUpdateCustomField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

  // Remove Custom Field
  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('সার্কুলারের শিরোনাম দেওয়া আবশ্যক।');
      return;
    }
    if (!organizationName.trim()) {
      setErrorMessage('প্রতিষ্ঠানের নাম প্রদান করা আবশ্যক।');
      return;
    }
    if (!postName.trim()) {
      setErrorMessage('পদের নাম প্রদান করা আবশ্যক।');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        organizationName: organizationName.trim(),
        organizationLogo: organizationLogo.trim() || undefined,
        sector,
        category: category.trim() || undefined,
        postName: postName.trim(),
        vacancyCount: vacancyCount.trim() || undefined,
        salaryScale: salaryScale.trim() || undefined,
        educationalQualification: educationalQualification.trim() || undefined,
        experienceRequired: experienceRequired.trim() || undefined,
        ageLimit: ageLimit.trim() || undefined,
        applicationFee: applicationFee.trim() || undefined,
        publishDate: publishDate || undefined,
        applicationStartDate: applicationStartDate || undefined,
        applicationDeadline: applicationDeadline || undefined,
        sourceOrNewspaper: sourceOrNewspaper.trim() || undefined,
        officialWebsite: officialWebsite.trim() || undefined,
        circularImageUrl: circularImageUrl.trim() || undefined,
        circularPdfUrl: circularPdfUrl.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        fullDescriptionHtml,
        customFields: customFields.filter((f) => f.label.trim() && f.value.trim()),
        status,
        featured,
      };

      if (isEditing && jobId) {
        const res = await api.put(`/admin/jobs/${jobId}`, payload);
        setSuccessMessage('জব সার্কুলারটি সফলভাবে আপডেট করা হয়েছে!');
        setSavedSlug(res.data.data?.slug || savedSlug);
      } else {
        const res = await api.post('/admin/jobs', payload);
        setSuccessMessage('নতুন জব সার্কুলার সফলভাবে তৈরি ও প্রকাশ করা হয়েছে!');
        setSavedSlug(res.data.data?.slug || '');
        setTimeout(() => {
          router.push('/admin/jobs');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'সার্কুলার সেভ করতে ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ga-page min-h-screen flex items-center justify-center py-20 text-slate-500 text-sm">
        তথ্য লোড করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref="/admin/jobs"
          backLabel="Job circulars"
          eyebrow="Career management"
          title={isEditing ? 'জব সার্কুলার সম্পাদনা করুন' : 'নতুন জব সার্কুলার পোস্ট করুন'}
          description="প্রতিষ্ঠানের তথ্য, পদবি, শিক্ষাগত যোগ্যতা, আবেদনের সময়সূচি ও সার্কুলার ফাইল সাজান।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              {isEditing ? 'Edit circular' : 'New circular'}
            </span>
          }
          action={
            savedSlug ? (
              <Link
                href={`/jobs/${savedSlug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-200 dark:hover:bg-[#151921]"
              >
                <ExternalLink className="h-4 w-4 text-orange-500" /> প্রিভিউ পেজ দেখুন
              </Link>
            ) : undefined
          }
        />

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav heading="Job sections" items={jobSections} />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* SECTION 1: PRIMARY INFO */}
            <FormSection
              id="primary"
              icon={<Building className="h-4 w-4" />}
              title="সার্কুলার ও প্রতিষ্ঠানের প্রাথমিক তথ্য"
              description="বিজ্ঞপ্তির শিরোনাম, প্রতিষ্ঠানের নাম এবং অফিসিয়াল ওয়েবসাইট লিংক দিন।"
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  বিজ্ঞপ্তির শিরোনাম (Job Circular Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: বাংলাদেশ রেলওয়ে নিয়োগ বিজ্ঞপ্তি ২০২৬"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রতিষ্ঠানের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="যেমন: বাংলাদেশ রেলওয়ে / বাংলাদেশ ব্যাংক"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>চাকরির ক্যাটাগরি / সেক্টর <span className="text-rose-500">*</span></span>
                  <Link href="/admin/jobs" className="text-orange-600 dark:text-orange-400 text-2xs hover:underline font-normal">
                    ক্যাটাগরি ম্যানেজ করুন
                  </Link>
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="govt">সরকারি চাকরি</option>
                  )}
                </select>
              </div>

              {/* Post Name(s) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পদের নাম (Designation) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={postName}
                  onChange={(e) => setPostName(e.target.value)}
                  placeholder="যেমন: সহকারী স্টেশন মাস্টার, পয়েন্টসম্যান"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Vacancy Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মোট পদসংখ্যা (Vacancies)
                </label>
                <input
                  type="text"
                  value={vacancyCount}
                  onChange={(e) => setVacancyCount(e.target.value)}
                  placeholder="যেমন: ৫৬৩ জন / উল্লেখ নেই"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ক্যাটাগরি
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="যেমন: মন্ত্রণালয়, প্রকৌশল, শিক্ষা, ইত্যাদি"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Official Website */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  আবেদন লিংক / অফিশিয়াল ওয়েবসাইট
                </label>
                <input
                  type="url"
                  value={officialWebsite}
                  onChange={(e) => setOfficialWebsite(e.target.value)}
                  placeholder="http://railway.teletalk.com.bd"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION 2: REQUIREMENTS & SALARY */}
          <FormSection
            id="eligibility"
            icon={<GraduationCap className="h-4 w-4" />}
            title="যোগ্যতা, বেতন ও আবেদনের শর্তাবলী"
            description="পদবি, শিক্ষাগত যোগ্যতা, অভিজ্ঞতা এবং বেতন স্কেল নির্ধারণ করুন।"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Educational Qualification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  শিক্ষাগত যোগ্যতা
                </label>
                <input
                  type="text"
                  value={educationalQualification}
                  onChange={(e) => setEducationalQualification(e.target.value)}
                  placeholder="যেমন: এসএসসি / এইচএসসি / যেকোনো বিষয়ে স্নাতক"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Salary Scale */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  বেতন স্কেল ও গ্রেড
                </label>
                <input
                  type="text"
                  value={salaryScale}
                  onChange={(e) => setSalaryScale(e.target.value)}
                  placeholder="যেমন: গ্রেড-১৫ (৯,৭০০ - ২৩,৪৯০/- টাকা)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Age Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  বয়সসীমা
                </label>
                <input
                  type="text"
                  value={ageLimit}
                  onChange={(e) => setAgeLimit(e.target.value)}
                  placeholder="যেমন: ১৮ হতে ৩০ বছর (কোটাধারীদের ৩২ বছর)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Application Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  আবেদন ফি
                </label>
                <input
                  type="text"
                  value={applicationFee}
                  onChange={(e) => setApplicationFee(e.target.value)}
                  placeholder="যেমন: ২২৩/- টাকা (টেলিটক এসএমএস এর মাধ্যমে)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Experience Required */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  অভিজ্ঞতা
                </label>
                <input
                  type="text"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  placeholder="যেমন: প্রযোজ্য নয় / ১ বছরের কম্পিউটার টাইপিং"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Source Newspaper / Origin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রকাশের সূত্র / পত্রিকা
                </label>
                <input
                  type="text"
                  value={sourceOrNewspaper}
                  onChange={(e) => setSourceOrNewspaper(e.target.value)}
                  placeholder="যেমন: দৈনিক ইত্তেফাক, অফিসিয়াল নোটিশ"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION 3: IMPORTANT DATES & MEDIA */}
          <FormSection
            id="dates"
            icon={<Calendar className="h-4 w-4" />}
            title="গুরুত্বপূর্ণ তারিখ ও সার্কুলার ইমেজ / ফাইল"
            description="আবেদন শুরুর তারিখ, ডেডলাইন ও সার্কুলার ফাইল লিংক।"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Publish Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রকাশের তারিখ
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  আবেদন শুরুর তারিখ
                </label>
                <input
                  type="date"
                  value={applicationStartDate}
                  onChange={(e) => setApplicationStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  আবেদনের শেষ তারিখ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              {/* Circular Image URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  সার্কুলারের ছবি / ব্যানার URL
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={circularImageUrl}
                    onChange={(e) => setCircularImageUrl(e.target.value)}
                    placeholder="https://example.com/circular.jpg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* PDF URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  সার্কুলার PDF লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  value={circularPdfUrl}
                  onChange={(e) => setCircularPdfUrl(e.target.value)}
                  placeholder="https://example.com/circular.pdf"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION 4: FULL DESCRIPTION (RICH TEXT EDITOR) */}
          <FormSection
            id="details"
            icon={<FileText className="h-4 w-4" />}
            title="সার্কুলারের বিস্তারিত বিবরণ"
            description="ফরম্যাটেড টেক্সট, টেবিল ও লিস্ট আকারে সম্পূর্ণ বিজ্ঞপ্তি উল্লেখ করুন।"
          >
            <div className="space-y-4">

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                সংক্ষিপ্ত বিবরণ (Short Highlight)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="বিজ্ঞপ্তি সম্পর্কে এক বা দুই লাইনের হাইলাইট যা কার্ডে প্রদর্শিত হবে..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                সম্পূর্ণ নিয়োগ বিজ্ঞপ্তির বিবরণ
              </label>
              <TextEditor
                value={fullDescriptionHtml}
                onChange={(html) => setFullDescriptionHtml(html)}
                placeholder="এখানে পদের বিস্তার, আবেদন পদ্ধতি, জেলাভিত্তিক সুযোগ, নিয়মাবলী ইত্যাদি বিস্তারিতভাবে লিখুন..."
                minHeight="280px"
              />
            </div>
          </div>
        </FormSection>

        {/* SECTION 5: DYNAMIC CUSTOM FIELDS */}
        <FormSection
          id="custom"
          icon={<Sparkles className="h-4 w-4" />}
          title="কাস্টম ইনপুট ফিল্ড"
          description="বিভিন্ন সার্কুলারের বিশেষ কোনো হেডিং বা কাস্টম তথ্যের জন্য ইচ্ছামতো ফিল্ড যোগ করুন।"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleAddCustomField}
                className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> কাস্টম ফিল্ড যোগ করুন
              </button>
            </div>

            {customFields.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-[#151921]/40 rounded-2xl border border-dashed border-slate-200 dark:border-[#262b34]">
                এখনো কোনো কাস্টম ফিল্ড যোগ করা হয়নি। যেমন: &quot;পরীক্ষার মানবন্টন&quot;, &quot;যেসব জেলার প্রার্থীরা আবেদন করতে পারবেন&quot; ইত্যাদি যোগ করতে পারেন।
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#151921]/50 border border-slate-200 dark:border-[#262b34] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          কাস্টম ফিল্ড হেডলাইন
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateCustomField(idx, 'label', e.target.value)}
                          placeholder="যেমন: পরীক্ষার মানবণ্টন / প্রয়োজনীয় কাগজপত্র"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(idx)}
                        className="p-2 mt-4 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="ফিল্ড ডিলিট করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        ফিল্ডের বিস্তারিত বিবরণ / নির্দেশনা
                      </label>
                      <textarea
                        rows={3}
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                        placeholder="এখানে এই হেডলাইনের বিস্তারিত বিবরণ লিখুন..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

          {/* SECTION 6: PUBLISHING STATUS */}
          <FormSection
            id="status"
            icon={<CheckCircle className="h-4 w-4" />}
            title="পাবলিকেশন স্ট্যাটাস ও ভিজিবিলিটি"
            description="সার্কুলারটি ড্রাফট রাখবেন নাকি সরাসরি শিক্ষার্থীদের জন্য উন্মুক্ত করবেন তা ঠিক করুন।"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পাবলিকেশন স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="published">সবার জন্য প্রকাশ করুন (Published)</option>
                  <option value="draft">ড্রাফট রাখুন (Draft)</option>
                  <option value="archived">আর্কাইভ করুন (Archived)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 sm:mt-5">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded-md border-slate-300 dark:border-[#262b34] focus:ring-orange-500"
                />
                <label htmlFor="featured-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  ফিচার্ড সার্কুলার হিসেবে হাইলাইট করুন
                </label>
              </div>
            </div>
          </FormSection>

          {/* Action Bar */}
          <div className="ga-sticky-action-bar m-4 sm:m-5">
            <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
              বিজ্ঞপ্তিটি সংরক্ষণ করতে নিচের বাটনে চাপুন।
            </div>
            <div className="flex gap-2">
              <Link href="/admin/jobs">
                <Button type="button" variant="secondary" className="border border-slate-200 hover:bg-slate-100 dark:border-[#262b34] dark:hover:bg-[#151921]">
                  বাতিল করুন
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={submitting}
                className="bg-orange-600 font-bold text-white hover:bg-orange-700"
              >
                <Save className="mr-1.5 h-4 w-4" /> {isEditing ? 'আপডেট সম্পন্ন করুন' : 'সার্কুলার প্রকাশ করুন'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      </div>
    </div>
  );
}
