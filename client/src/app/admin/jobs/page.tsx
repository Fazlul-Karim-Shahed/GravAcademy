'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react';

interface JobItem {
  _id: string;
  title: string;
  slug: string;
  organizationName: string;
  postName: string;
  sector: 'govt' | 'semi_govt' | 'private' | 'autonomous' | 'bank' | 'ngo';
  category?: string;
  vacancyCount?: string;
  applicationDeadline?: string;
  publishDate?: string;
  status: 'published' | 'draft' | 'archived';
  viewsCount: number;
  featured: boolean;
  createdAt: string;
}

const sectorLabels: Record<string, { label: string; badgeClass: string }> = {
  govt: {
    label: 'সরকারি',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  semi_govt: {
    label: 'আধা সরকারি',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  autonomous: {
    label: 'স্বায়ত্তশাসিত',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  bank: {
    label: 'ব্যাংক ও আর্থিক',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  private: {
    label: 'বেসরকারি',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  ngo: {
    label: 'এনজিও',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
};

export default function AdminJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<JobItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [page, selectedSector, selectedStatus]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (selectedSector !== 'all') params.sector = selectedSector;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/jobs', { params });
      setJobs(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (e: any) {
      console.error('Failed to fetch admin jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/jobs/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchJobs();
    } catch (e: any) {
      alert(e.response?.data?.message || 'জব সার্কুলারটি ডিলিট করা যায়নি।');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-500">জব ম্যানেজমেন্ট</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Briefcase className="w-6 h-6" />
              </span>
              জব সার্কুলার ম্যানেজমেন্ট
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              সরকারি, আধা-সরকারি ও বেসরকারি নিয়োগ বিজ্ঞপ্তিসমূহ তৈরি, এডিট এবং পরিচালনা করুন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" /> পাবলিক পেজ ভিউ
            </Link>
            <Link
              href="/admin/jobs/new"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-extrabold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> নতুন সার্কুলার পোস্ট করুন
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 mb-8 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="বিজ্ঞপ্তির শিরোনাম, প্রতিষ্ঠানের নাম বা পদের নাম দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Sector Filter */}
            <div className="w-full md:w-48">
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">সব সেক্টর (All Sectors)</option>
                <option value="govt">সরকারি (Govt)</option>
                <option value="semi_govt">আধা সরকারি (Semi-Govt)</option>
                <option value="autonomous">স্বায়ত্তশাসিত</option>
                <option value="bank">ব্যাংক ও আর্থিক প্রতিষ্ঠান</option>
                <option value="private">বেসরকারি (Private)</option>
                <option value="ngo">এনজিও (NGO)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="published">প্রকাশিত (Published)</option>
                <option value="draft">ড্রাফট (Draft)</option>
                <option value="archived">আর্কাইভ (Archived)</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> খুঁজুন
            </button>

          </form>
        </div>

        {/* Jobs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">বিজ্ঞপ্তির শিরোনাম ও পদ</th>
                  <th className="px-6 py-4">প্রতিষ্ঠান ও সেক্টর</th>
                  <th className="px-6 py-4">পদসংখ্যা</th>
                  <th className="px-6 py-4">আবেদনের শেষ তারিখ</th>
                  <th className="px-6 py-4 text-center">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-center">ভিউ</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      সার্কুলার তালিকা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs">
                      কোনো জব সার্কুলার পাওয়া যায়নি। নতুন সার্কুলার পোস্ট করুন।
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const sectorMeta = sectorLabels[job.sector] || {
                      label: job.sector,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
                    };

                    const isExpired = job.applicationDeadline
                      ? new Date(job.applicationDeadline) < new Date()
                      : false;

                    return (
                      <tr
                        key={job._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Title & Post */}
                        <td className="px-6 py-4 max-w-sm">
                          <Link
                            href={`/admin/jobs/${job._id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1 text-sm block"
                          >
                            {job.title}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
                            💼 {job.postName}
                          </div>
                        </td>

                        {/* Organization & Sector */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{job.organizationName}</span>
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 ${sectorMeta.badgeClass}`}
                          >
                            {sectorMeta.label}
                          </span>
                        </td>

                        {/* Vacancy */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {job.vacancyCount || 'উল্লেখ নেই'}
                          </span>
                        </td>

                        {/* Deadline */}
                        <td className="px-6 py-4">
                          {job.applicationDeadline ? (
                            <div>
                              <div
                                className={`text-xs font-bold flex items-center gap-1.5 ${
                                  isExpired
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(job.applicationDeadline).toLocaleDateString('bn-BD', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              {isExpired && (
                                <span className="text-[10px] font-bold text-rose-500">সময় শেষ</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">নির্দিষ্ট নয়</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              job.status === 'published'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                                : job.status === 'draft'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {job.status === 'published'
                              ? 'প্রকাশিত'
                              : job.status === 'draft'
                              ? 'ড্রাফট'
                              : 'আর্কাইভ'}
                          </span>
                        </td>

                        {/* Views */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            👁️ {job.viewsCount || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Public Preview */}
                            <Link
                              href={`/jobs/${job.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="পাবলিক পেজ প্রিভিউ"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Edit Button */}
                            <Link
                              href={`/admin/jobs/${job._id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="সম্পাদনা করুন"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteTarget(job)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                মোট <strong>{totalCount}</strong> টি সার্কুলারের মধ্যে <strong>{jobs.length}</strong> টি দেখানো হচ্ছে
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                >
                  পূর্ববর্তী
                </button>
                <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    সার্কুলার মুছে ফেলার নিশ্চয়তা
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    আপনি কি নিশ্চিতভাবে এই সার্কুলারটি ডিলিট করতে চান?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-5">
                {deleteTarget.title}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
