'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
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
} from 'lucide-react';

interface FreeClassItem {
  _id: string;
  title: string;
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

  useEffect(() => {
    loadFreeClasses();
  }, []);

  const loadFreeClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/free-classes');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setClasses(res.data.data);
      } else {
        const fallbackRes = await api.get('/live-classes');
        if (fallbackRes.data?.success) {
          setClasses(fallbackRes.data.data);
        }
      }
    } catch (e) {
      try {
        const fallbackRes = await api.get('/live-classes');
        if (fallbackRes.data?.success) {
          setClasses(fallbackRes.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 py-6 sm:py-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  সবার জন্য উন্মুক্ত • {classes.length}টি ক্লাস
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ফ্রি ক্লাস ও সেমিনার
              </h1>
            </div>

            {/* Actions & Search */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ক্লাস খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {canManageLive && (
                <Link
                  href="/free-classes/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">নতুন ক্লাস</span>
                  <span className="sm:hidden">যুক্ত করুন</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Classes List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 animate-pulse shadow-xs" />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl text-center py-14 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
            <Video className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">বর্তমানে কোনো ফ্রি ক্লাস নেই</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              পরবর্তী ফ্রি সেশনের সময়সূচী এখানে আপডেট করা হবে।
            </p>
            {canManageLive && (
              <Link
                href="/free-classes/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ফ্রি ক্লাস তৈরি করুন</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => {
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

              return (
                <div
                  key={cls._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Platform & Duration */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          cls.provider === 'google_meet'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                        }`}
                      >
                        {cls.provider === 'google_meet' ? 'Google Meet' : 'Zoom'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{cls.durationMinutes} মি.</span>
                      </span>
                    </div>

                    {/* Class Title */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-3">
                      {cls.title}
                    </h3>

                    {/* Schedule Time */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-4 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{formattedDate} • {formattedTime}</span>
                    </div>
                  </div>

                  {/* Join Link */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={cls.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>সরাসরি ক্লাসে যোগ দিন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
