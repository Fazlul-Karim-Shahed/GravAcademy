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

interface CustomField {
  label: string;
  value: string;
}

interface JobPostFormProps {
  params?: Promise<{ id?: string }>;
}

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
  const [sector, setSector] = useState<'govt' | 'semi_govt' | 'private' | 'autonomous' | 'bank' | 'ngo'>('govt');
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
    if (isEditing && jobId) {
      loadJobDetails(jobId);
    }
  }, [jobId]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-20 text-slate-500 text-sm">
        তথ্য লোড করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin/jobs"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> জব সার্কুলার তালিকা
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-500">
                {isEditing ? 'সার্কুলার সম্পাদনা' : 'নতুন সার্কুলার'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Briefcase className="w-6 h-6" />
              </span>
              {isEditing ? 'জব সার্কুলার সম্পাদনা করুন' : 'নতুন জব সার্কুলার পোস্ট করুন'}
            </h1>
          </div>

          {savedSlug && (
            <Link
              href={`/jobs/${savedSlug}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-blue-500" /> প্রিভিউ পেজ দেখুন
            </Link>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: PRIMARY INFO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-blue-500" /> ১. সার্কুলার ও প্রতিষ্ঠানের প্রাথমিক তথ্য
            </h2>

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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  চাকরির সেক্টর <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="govt">সরকারি (Government)</option>
                  <option value="semi_govt">আধা সরকারি (Semi-Government)</option>
                  <option value="autonomous">স্বায়ত্তশাসিত প্রতিষ্ঠান</option>
                  <option value="bank">ব্যাংক ও আর্থিক প্রতিষ্ঠান</option>
                  <option value="private">বেসরকারি (Private)</option>
                  <option value="ngo">এনজিও / আন্তর্জাতিক সংস্থা (NGO)</option>
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: REQUIREMENTS & SALARY */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <GraduationCap className="w-5 h-5 text-indigo-500" /> ২. যোগ্যতা, বেতন ও আবেদনের শর্তাবলী
            </h2>

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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* SECTION 3: IMPORTANT DATES & MEDIA */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Calendar className="w-5 h-5 text-emerald-500" /> ৩. গুরুত্বপূর্ণ তারিখ ও সার্কুলার ইমেজ / ফাইল
            </h2>

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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* SECTION 4: FULL DESCRIPTION (RICH TEXT EDITOR) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" /> ৪. সার্কুলারের বিস্তারিত বিবরণ (Rich Text Editor)
              </h2>
              <span className="text-xs text-slate-400">ফরম্যাটেড টেক্সট, টেবিল ও লিস্ট সাপোর্ট করে</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                সংক্ষিপ্ত বিবরণ (Short Highlight)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="বিজ্ঞপ্তি সম্পর্কে এক বা দুই লাইনের হাইলাইট যা কার্ডে প্রদর্শিত হবে..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* SECTION 5: DYNAMIC CUSTOM FIELDS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> ৫. কাস্টম ইনপুট ফিল্ড (Custom Dynamic Sections)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  বিভিন্ন সার্কুলারের বিশেষ কোনো হেডিং বা কাস্টম তথ্যের জন্য ইচ্ছামতো ফিল্ড যোগ করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> কাস্টম ফিল্ড যোগ করুন
              </button>
            </div>

            {customFields.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                এখনো কোনো কাস্টম ফিল্ড যোগ করা হয়নি। যেমন: &quot;পরীক্ষার মানবন্টন&quot;, &quot;যেসব জেলার প্রার্থীরা আবেদন করতে পারবেন&quot; ইত্যাদি যোগ করতে পারেন।
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
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
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 6: PUBLISHING STATUS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পাবলিকেশন স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published">সবার জন্য প্রকাশ করুন (Published)</option>
                  <option value="draft">ড্রাফট রাখুন (Draft)</option>
                  <option value="archived">আর্কাইভ করুন (Archived)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="featured-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  ফিচার্ড সার্কুলার হিসেবে হাইলাইট করুন
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/admin/jobs"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center w-full sm:w-auto"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'সংরক্ষণ করা হচ্ছে...' : isEditing ? 'আপডেট সম্পন্ন করুন' : 'সার্কুলার প্রকাশ করুন'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
