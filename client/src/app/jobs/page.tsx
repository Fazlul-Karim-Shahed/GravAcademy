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
    <div className="ga-page ga-public-page text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end lg:px-8">
          <div className="max-w-2xl border-l-4 border-orange-500 pl-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">Career board</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">চাকরির সার্কুলার</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
            মন্ত্রণালয়, অধিদপ্তর, ব্যাংক, স্বায়ত্তশাসিত ও শীর্ষস্থানীয় বেসরকারি প্রতিষ্ঠানের সর্বশেষ প্রকাশিত জব সার্কুলার, আবেদনের নিয়ম ও সময়সীমা এক নজরে দেখুন।
          </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 focus-within:border-orange-500 dark:border-[#343a46] dark:bg-[#151921]">
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
                className="shrink-0 cursor-pointer rounded-lg bg-orange-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-700"
              >
                খুঁজুন
              </button>
            </div>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">ক্যাটাগরি</h2><span className="text-xs text-slate-500">{totalCount}টি</span></div>
          <div className="flex gap-2 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible">
          <button
            onClick={() => {
              setActiveSector('all');
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-xs font-bold transition-colors lg:w-full ${
              activeSector === 'all'
                ? 'bg-orange-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300'
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
                className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-xs font-bold transition-colors lg:w-full ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
          </div>
        </aside>

        <main className="min-w-0">

        {/* Circulars Count Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-500 dark:text-slate-400">
          <div>
            মোট <strong>{totalCount}</strong> টি জব সার্কুলার পাওয়া গেছে
          </div>
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ করুন
          </button>
        </div>

        {/* Circular Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-500" />
            জব সার্কুলার লোড হচ্ছে...
          </div>
        ) : jobs.length === 0 ? (
          <div className="ga-card py-20 text-center p-8">
            <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              কোনো জব সার্কুলার পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500">অন্য কোনো কি-ওয়ার্ড দিয়ে খুঁজুন অথবা অন্য ক্যাটাগরি বেছে নিন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-orange-400 dark:border-[#262b34] dark:bg-[#111318] dark:hover:border-orange-600"
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
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-500 text-white flex items-center gap-1">
                          ★ হট জব
                        </span>
                      )}
                    </div>

                    {/* Organization Name */}
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 mb-1.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{job.organizationName}</span>
                    </div>

                    {/* Circular Title */}
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug mb-3">
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

                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-orange-700 group-hover:text-white transition-all group-hover:translate-x-1 shrink-0">
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
        </main>
      </div>
    </div>
  );
}
