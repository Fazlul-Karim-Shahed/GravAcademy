'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Briefcase,
  ArrowLeft,
  Building,
  Calendar,
  DollarSign,
  GraduationCap,
  Users,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CustomJobField {
  label: string;
  value: string;
}

interface JobPostDetail {
  _id: string;
  title: string;
  slug: string;
  organizationName: string;
  organizationLogo?: string;
  sector: string;
  category?: string;
  postName: string;
  vacancyCount?: string;
  salaryScale?: string;
  educationalQualification?: string;
  experienceRequired?: string;
  ageLimit?: string;
  applicationFee?: string;
  publishDate?: string;
  applicationStartDate?: string;
  applicationDeadline?: string;
  sourceOrNewspaper?: string;
  officialWebsite?: string;
  circularImageUrl?: string;
  circularPdfUrl?: string;
  shortDescription?: string;
  fullDescriptionHtml?: string;
  customFields?: CustomJobField[];
  viewsCount?: number;
  featured?: boolean;
  createdAt: string;
}

const sectorLabels: Record<string, { label: string; badgeClass: string }> = {
  govt: { label: 'সরকারি চাকরি', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  semi_govt: { label: 'আধা সরকারি চাকরি', badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  autonomous: { label: 'স্বায়ত্তশাসিত প্রতিষ্ঠান', badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  bank: { label: 'ব্যাংক ও আর্থিক প্রতিষ্ঠান', badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  private: { label: 'বেসরকারি চাকরি', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  ngo: { label: 'এনজিও ও আন্তর্জাতিক সংস্থা', badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
};

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [job, setJob] = useState<JobPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [slug]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${slug}`);
      setJob(res.data.data);
    } catch (e) {
      console.error('Failed to load job detail:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-20 text-slate-500 text-sm">
        বিজ্ঞপ্তির বিস্তারিত লোড হচ্ছে...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center py-20 px-4 text-center">
        <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">জব সার্কুলারটি পাওয়া যায়নি</h1>
        <p className="text-sm text-slate-500 mb-6">বিজ্ঞপ্তিটি মুছে ফেলা হতে পারে বা লিংকটি ভুল হয়েছে।</p>
        <Link
          href="/jobs"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
        >
          সকল জব সার্কুলার দেখুন
        </Link>
      </div>
    );
  }

  const sectorMeta = sectorLabels[job.sector] || {
    label: job.sector,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const isExpired = job.applicationDeadline
    ? new Date(job.applicationDeadline) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">হোম</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/jobs" className="hover:text-blue-600 transition-colors">জব সার্কুলার</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-xs">
              {job.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> লিংক কপি হয়েছে
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" /> শেয়ার
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Circular Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-xs mb-8">
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border ${sectorMeta.badgeClass}`}
            >
              {sectorMeta.label}
            </span>

            {job.category && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {job.category}
              </span>
            )}

            {job.featured && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1">
                ★ হট জব
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
            <Building className="w-4 h-4 shrink-0" />
            <span>{job.organizationName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {job.title}
          </h1>

          {job.shortDescription && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
              {job.shortDescription}
            </p>
          )}

          {/* Action Bar (Apply Now & Source) */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            {job.officialWebsite && (
              <a
                href={job.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>অনলাইনে আবেদন করুন</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {job.circularPdfUrl && (
              <a
                href={job.circularPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>অফিসিয়াল সার্কুলার PDF</span>
              </a>
            )}

            {isExpired && (
              <span className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> এই বিজ্ঞপ্তির আবেদনের সময় শেষ হয়েছে
              </span>
            )}
          </div>

        </div>

        {/* Quick Facts / Highlight Summary Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <Sparkles className="w-5 h-5 text-amber-500" /> নিয়োগ বিজ্ঞপ্তির সংক্ষিপ্ত তথ্য (Quick Summary)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            
            <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">প্রতিষ্ঠানের নাম</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{job.organizationName}</span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">পদের নাম</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{job.postName}</span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">মোট পদসংখ্যা</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{job.vacancyCount || 'উল্লেখ নেই'}</span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">চাকরির ধরন</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{sectorMeta.label}</span>
            </div>

            {job.salaryScale && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">বেতন স্কেল ও গ্রেড</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{job.salaryScale}</span>
              </div>
            )}

            {job.educationalQualification && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">শিক্ষাগত যোগ্যতা</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{job.educationalQualification}</span>
              </div>
            )}

            {job.ageLimit && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">বয়সসীমা</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{job.ageLimit}</span>
              </div>
            )}

            {job.applicationFee && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">আবেদন ফি</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{job.applicationFee}</span>
              </div>
            )}

            {job.publishDate && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">বিজ্ঞপ্তি প্রকাশের তারিখ</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {new Date(job.publishDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            {job.applicationStartDate && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">আবেদন শুরুর তারিখ</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {new Date(job.applicationStartDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            {job.applicationDeadline && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">আবেদনের শেষ তারিখ</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-right">
                  {new Date(job.applicationDeadline).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            {job.sourceOrNewspaper && (
              <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">বিজ্ঞপ্তি প্রকাশের মাধ্যম</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{job.sourceOrNewspaper}</span>
              </div>
            )}

          </div>
        </div>

        {/* Dynamic Custom Fields Section (if any) */}
        {job.customFields && job.customFields.length > 0 && (
          <div className="space-y-6 mb-8">
            {job.customFields.map((field, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {field.label}
                </h3>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Rich Description */}
        {job.fullDescriptionHtml && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> সার্কুলারের বিস্তারিত বিজ্ঞপ্তি
            </h2>

            <div
              className="tiptap-content text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: job.fullDescriptionHtml }}
            />
          </div>
        )}

        {/* Circular Image (if provided) */}
        {job.circularImageUrl && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> সার্কুলারের মূল নোটিশ / ছবি
            </h2>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-center">
              <img
                src={job.circularImageUrl}
                alt={job.title}
                className="max-w-full h-auto object-contain max-h-[1000px]"
              />
            </div>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="text-center pt-4">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> সকল জব সার্কুলার দেখুন
          </Link>
        </div>

      </div>
    </div>
  );
}
