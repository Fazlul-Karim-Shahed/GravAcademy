'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import {
  Video,
  Calendar,
  Clock,
  PlusCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  Sparkles,
  PlayCircle,
  Radio,
  BookOpen,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { DriveFileUpload } from '@/components/ui';

interface FreeClassItem {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  provider: 'zoom' | 'google_meet';
  meetingUrl: string;
  startTime: string;
  durationMinutes: number;
  isFreePublic?: boolean;
  batchId?: {
    name: string;
  };
  teacherId?: {
    name: string;
  };
}

export default function FreeClassesPage() {
  const { user } = useAuth();
  const canManageLive = hasPermission(user, PERMISSIONS.LIVE_CLASSES_MANAGE);

  const [classes, setClasses] = useState<FreeClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editingClass, setEditingClass] = useState<FreeClassItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editMeetingUrl, setEditMeetingUrl] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadFreeClasses();
  }, []);

  const loadFreeClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/free-classes');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setClasses(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (cls: FreeClassItem) => {
    setEditingClass(cls);
    setEditTitle(cls.title);
    setEditThumbnailUrl(cls.thumbnailUrl || '');
    setEditMeetingUrl(cls.meetingUrl || '');
    setEditDuration(cls.durationMinutes || 60);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/live-classes/${editingClass._id}`, {
        title: editTitle.trim(),
        thumbnailUrl: editThumbnailUrl.trim(),
        meetingUrl: editMeetingUrl.trim(),
        durationMinutes: Number(editDuration),
      });

      if (res.data?.success) {
        setClasses((prev) =>
          prev.map((c) =>
            c._id === editingClass._id
              ? {
                  ...c,
                  title: editTitle.trim(),
                  thumbnailUrl: editThumbnailUrl.trim(),
                  meetingUrl: editMeetingUrl.trim(),
                  durationMinutes: Number(editDuration),
                }
              : c
          )
        );
        setEditingClass(null);
      }
    } catch (err) {
      console.error('Failed to update class', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ফ্রি ক্লাসটি মুছে ফেলতে চান?')) return;
    try {
      const res = await api.delete(`/live-classes/${id}`);
      if (res.data?.success) {
        setClasses((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete class', err);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    return (
      searchQuery === '' ||
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teacherId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c1a] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. COSMIC GLOWING HERO HEADER STRIP (Matching Home Page Cosmic Theme) */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-10 pb-12 sm:pt-14 sm:pb-16">
        
        {/* Deep space radial ambient lighting & celestial nebula glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[380px] bg-gradient-to-b from-rose-950/45 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-red-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[350px] h-[250px] bg-blue-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />
        <div className="absolute -top-10 right-1/4 w-[350px] h-[250px] bg-purple-900/15 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Twinkling Cosmic Stars & Shooting Star */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[14%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[24%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[12%] right-[16%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <div className="absolute top-[30%] right-[10%] w-1.5 h-1.5 rounded-full bg-rose-200 animate-star-twinkle-slow" />
          <span className="shooting-star meteor-1" />
          <span className="shooting-star meteor-3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-normal leading-[1.35] text-white">
                ফ্রি লাইভ ক্লাস ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 pt-1 pb-2 px-1">
                  স্পেশাল সেমিনার
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl font-medium leading-relaxed">
                কোনো রেজিস্ট্রেশন ফি ছাড়াই সরাসরি যুক্ত হয়ে ক্লাস যাচাই করো এবং বিষয়ভিত্তিক শিক্ষকদের সাথে পরামর্শ নাও।
              </p>
            </div>

            {/* Actions & Cosmic Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ক্লাসের নাম বা শিক্ষক খুঁজুন..."
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 backdrop-blur-xl border border-white/20 focus:border-indigo-400 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all font-medium shadow-inner"
                />
              </div>

              {canManageLive && (
                <Link
                  href="/free-classes/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 hover:scale-102 transition-all shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন ক্লাস যোগ করুন</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Classes Status Banner */}
        <div className="flex items-center justify-between mb-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              চলতি সেশন: <span className="text-slate-900 dark:text-white font-extrabold">{filteredClasses.length}</span> টি ক্লাস
            </span>
          </div>
          {searchQuery && (
            <div className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 text-xs">
              সার্চ ফিল্টার: <span className="text-blue-600 dark:text-blue-400 font-bold">"{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Classes List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-[32px] bg-white/70 dark:bg-slate-900/70 border-2 border-slate-200/80 dark:border-slate-800/80 animate-pulse p-6 space-y-4"
              >
                <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-[34px] text-center py-16 px-6 border-2 border-slate-200/90 dark:border-slate-800/90 shadow-xl max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
              <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">বর্তমানে কোনো ফ্রি ক্লাস নেই</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
              পরবর্তী ফ্রি লাইভ সেশন ও সেমিনারের সময়সূচী খুব শীঘ্রই এখানে ঘোষণা করা হবে।
            </p>
            {canManageLive && (
              <Link
                href="/free-classes/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন ফ্রি ক্লাস তৈরি করুন</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredClasses.map((cls, idx) => {
              const startDate = new Date(cls.startTime);
              const formattedDate = startDate.toLocaleDateString('bn-BD', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const formattedTime = startDate.toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Vibrant gradient thumbnail themes matching home page
              const cardThemes = [
                {
                  gradient: 'from-[#0284c7] via-[#2563eb] to-[#4f46e5]',
                  accentColor: 'text-blue-500',
                  glow: 'shadow-blue-500/20',
                },
                {
                  gradient: 'from-[#059669] via-[#0d9488] to-[#0284c7]',
                  accentColor: 'text-emerald-500',
                  glow: 'shadow-emerald-500/20',
                },
                {
                  gradient: 'from-[#4f46e5] via-[#7c3aed] to-[#c026d3]',
                  accentColor: 'text-purple-500',
                  glow: 'shadow-purple-500/20',
                },
                {
                  gradient: 'from-[#ea580c] via-[#e11d48] to-[#c026d3]',
                  accentColor: 'text-rose-500',
                  glow: 'shadow-rose-500/20',
                },
              ];

              const currentTheme = cardThemes[idx % cardThemes.length];

              return (
                <div
                  key={cls._id}
                  className="cute-course-card group rounded-[34px] overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-purple-500/70 transition-all duration-300"
                >
                  <div>
                    {/* Top Thumbnail Banner with Curved Mask */}
                    <div className="relative w-full aspect-[16/9.5] rounded-[26px] overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-sm bg-slate-900">
                      {cls.thumbnailUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={formatDriveImageUrl(cls.thumbnailUrl)}
                            alt={cls.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          <div className="absolute bottom-2.5 left-3 right-3 text-white font-bold text-xs drop-shadow-md line-clamp-1">
                            {cls.batchId?.name || 'ফ্রি লাইভ সেশন'}
                          </div>
                        </div>
                      ) : (
                        <div className={`relative w-full h-full bg-gradient-to-br ${currentTheme.gradient}`}>
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/30">
                              <Video className="w-7 h-7" />
                            </div>
                            <span className="text-white font-black text-sm drop-shadow-md tracking-wide px-3 line-clamp-1">
                              {cls.batchId?.name || 'ফ্রি লাইভ সেশন'}
                            </span>
                          </div>

                          {/* Gloss Sheen Shine Across Thumbnail */}
                          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />
                        </div>
                      )}

                        {/* Top Badges Overlay */}
                        <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                          {/* Platform Tag */}
                          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black border border-white/25 shadow-md flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>{cls.provider === 'google_meet' ? 'Google Meet' : 'Zoom'}</span>
                          </span>

                          {/* Live Free Badge */}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[11px] font-black shadow-md border border-slate-200/60 dark:border-white/15">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                              <span className="relative m-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                            </span>
                            <span>ফ্রি এক্সেস</span>
                          </span>
                        </div>
                      </div>

                    {/* Card Content Body */}
                    <div className="px-3.5 sm:px-4 pb-3 pt-3.5">
                      {/* Class Title */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {cls.title}
                      </h3>

                      {/* Teacher name if present */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">মেন্টর: {cls.teacherId?.name || 'অনলাইন ফ্যাকাল্টি'}</span>
                      </div>

                      {/* Cute Schedule & Duration Pills */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span>তারিখ: {formattedDate} • {formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <span>সময়কাল: {cls.durationMinutes} মিনিট লাইভ সেশন</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {canManageLive && (
                    <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-900/90 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cls)}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline p-1"
                        title="এডিট করুন"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClass(cls._id)}
                        className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:underline p-1"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  )}

                  {/* Card Bottom: Direct Join CTA */}
                  <div className="p-3.5 sm:p-4 mt-1 rounded-[24px] border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shadow-inner">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        সম্পূর্ণ উন্মুক্ত
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        ফি: ১০০% ফ্রি
                      </span>
                    </div>

                    <a
                      href={cls.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all flex items-center gap-1.5 shrink-0 group-hover:scale-102"
                    >
                      <span>ক্লাসে যোগ দিন</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* EDIT MODAL WITH DRIVE FILE UPLOAD */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ফ্রি ক্লাস এডিট করুন
                </h3>
              </div>
              <button
                onClick={() => setEditingClass(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  ক্লাস শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Drive File Upload for Free Class Thumbnail */}
              <DriveFileUpload
                label="ক্লাস থাম্বনেইল (Google Drive বা লিংক)"
                value={editThumbnailUrl}
                onChange={(url) => setEditThumbnailUrl(url)}
                placeholder="https://drive.google.com/... অথবা ফাইল আপলোড করুন"
                helperText="ফ্রি ক্লাসের থাম্বনেইল ছবি সরাসরি ড্রাইভে আপলোড করুন।"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  মিটিং লিংক (Google Meet / Zoom URL) *
                </label>
                <input
                  type="url"
                  required
                  value={editMeetingUrl}
                  onChange={(e) => setEditMeetingUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  ক্লাসের সময়কাল (মিনিট)
                </label>
                <input
                  type="number"
                  min="15"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
