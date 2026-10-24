'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Briefcase,
  Search,
  Filter,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  GraduationCap,
  Sparkles,
  RefreshCw,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';

interface JobListItem {
  _id: string;
  title: string;
  slug: string;
  organizationName: string;
  postName: string;
  sector: 'govt' | 'semi_govt' | 'private' | 'autonomous' | 'bank' | 'ngo';
  category?: string;
  vacancyCount?: string;
  salaryScale?: string;
  educationalQualification?: string;
  applicationDeadline?: string;
  publishDate?: string;
  featured?: boolean;
  viewsCount?: number;
  createdAt: string;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  badgeColor?: string;
}

const sectorBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
  govt: { label: 'সরকারি চাকরি', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  semi_govt: { label: 'আধা সরকারি', bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  autonomous: { label: 'স্বায়ত্তশাসিত', bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  bank: { label: 'ব্যাংক ও আর্থিক', bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  private: { label: 'বেসরকারি চাকরি', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  ngo: { label: 'এনজিও', bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
};

export default function PublicJobCircularsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, activeSector]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/jobs/categories');
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load job categories:', e);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (activeSector !== 'all') params.sector = activeSector;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/jobs', { params });
      setJobs(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (e) {
      console.error('Failed to load public jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            সকল চাকরির সার্কুলার <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">এক ঠিকানায়</span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            মন্ত্রণালয়, অধিদপ্তর, ব্যাংক, স্বায়ত্তশাসিত ও শীর্ষস্থানীয় বেসরকারি প্রতিষ্ঠানের সর্বশেষ প্রকাশিত জব সার্কুলার, আবেদনের নিয়ম ও সময়সীমা এক নজরে দেখুন।
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-8 relative max-w-xl mx-auto">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="মন্ত্রণালয়, প্রতিষ্ঠান বা পদের নাম লিখে খুঁজুন..."
                className="w-full px-2 py-2.5 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                খুঁজুন
              </button>
            </div>
          </form>
        </div>

        {/* Category Tabs: Loaded dynamically from database, default: Shorkari */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => {
              setActiveSector('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSector === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            সকল চাকরি
          </button>

          {categories.map((cat) => {
            const isActive = activeSector === cat.slug;
            return (
              <button
                key={cat._id}
                onClick={() => {
                  setActiveSector(cat.slug);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Circulars Count Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-500 dark:text-slate-400">
          <div>
            মোট <strong>{totalCount}</strong> টি জব সার্কুলার পাওয়া গেছে
          </div>
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ করুন
          </button>
        </div>

        {/* Circular Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
            জব সার্কুলার লোড হচ্ছে...
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
            <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              কোনো জব সার্কুলার পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500">অন্য কোনো কি-ওয়ার্ড দিয়ে খুঁজুন অথবা অন্য ক্যাটাগরি বেছে নিন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const badge = sectorBadges[job.sector] || {
                label: job.sector,
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
                border: 'border-slate-200 dark:border-slate-700',
              };

              const isExpired = job.applicationDeadline
                ? new Date(job.applicationDeadline) < new Date()
                : false;

              return (
                <Link
                  key={job._id}
                  href={`/jobs/${job.slug}`}
                  className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:border-blue-400/80 dark:hover:border-blue-500/60 transition-all duration-300"
                >
                  <div>
                    {/* Header: Sector badge & Expiry Status */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span
                        className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                      {job.featured && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1">
                          ★ হট জব
                        </span>
                      )}
                    </div>

                    {/* Organization Name */}
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{job.organizationName}</span>
                    </div>

                    {/* Circular Title */}
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-3">
                      {job.title}
                    </h2>

                    {/* Job Details Meta */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          পদ: {job.postName}
                        </span>
                      </div>

                      {job.vacancyCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>পদসংখ্যা: <strong>{job.vacancyCount}</strong></span>
                        </div>
                      )}

                      {job.salaryScale && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">বেতন: {job.salaryScale}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Deadline & Action */}
                  <div className="pt-4 flex items-center justify-between text-xs mt-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        আবেদনের শেষ তারিখ
                      </div>
                      <div
                        className={`font-extrabold mt-0.5 flex items-center gap-1.5 ${
                          isExpired
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {job.applicationDeadline
                          ? new Date(job.applicationDeadline).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'নির্দিষ্ট নয়'}
                        {isExpired && (
                          <span className="text-[10px] text-rose-500 font-bold">(মেয়াদ উত্তীর্ণ)</span>
                        )}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:translate-x-1 shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              পূর্ববর্তী পেজ
            </button>
            <span className="px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              পেজ {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              পরবর্তী পেজ
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
