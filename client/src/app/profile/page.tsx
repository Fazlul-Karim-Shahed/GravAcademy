'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
  FileText,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  School,
  Award,
  Calendar,
} from 'lucide-react';

export default function ProfileViewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-xs font-bold text-slate-400">প্রোফাইল লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">আপনি লগইন করেননি</h2>
        <p className="text-xs text-slate-500 mb-4">প্রোফাইল দেখার জন্য অনুগ্রহ করে লগইন করুন।</p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          লগইন পেজে যান
        </Link>
      </div>
    );
  }

  const roleTitle =
    user.role === 'admin' || user.role === 'superadmin'
      ? 'এডমিনিস্ট্রেটর'
      : user.role === 'teacher'
      ? 'শিক্ষক / মেন্টর'
      : user.role === 'guardian'
      ? 'অভিভাবক'
      : 'শিক্ষার্থী';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span>আমার প্রোফাইল</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              আপনার ব্যক্তিগত ও অ্যাকাডেমিক তথ্য পর্যালোচনা করুন।
            </p>
          </div>

          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:scale-102 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>প্রোফাইল এডিট করুন</span>
          </Link>
        </div>

        {/* Hero Profile Card */}
        <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs overflow-hidden mb-8">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              role={user.role}
              size="xl"
              className="w-24 h-24 sm:w-28 sm:h-28 text-2xl border-2 border-white dark:border-slate-800 shadow-lg"
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {user.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {roleTitle}
                </span>
                {user.teacherDetails?.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{user.teacherDetails.badge}</span>
                  </span>
                )}
              </div>

              {/* ID & Basic Info */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                {user.userId && (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">আইডি:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300 select-all">
                      {user.userId}
                    </span>
                  </div>
                )}

                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Bio summary */}
              {user.bio && (
                <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ROLE-SPECIFIC DETAILED SECTION */}
        {user.role === 'teacher' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>শিক্ষকতা ও অ্যাকাডেমিক তথ্যাবলি</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    শিক্ষাপ্রতিষ্ঠান (University / College)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.teacherDetails?.institution || 'তথ্য দেওয়া হয়নি'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    বিভাগ / ডিগ্রি (Department)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.teacherDetails?.department || 'তথ্য দেওয়া হয়নি'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    শিক্ষকতার অভিজ্ঞতা (Experience)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.teacherDetails?.experience || 'তথ্য দেওয়া হয়নি'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    মোট শিক্ষার্থী ও ক্লাস সংখ্যা
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.teacherDetails?.studentsCount || '—'} শিক্ষার্থী | {user.teacherDetails?.classesCount || '—'} লাইভ ক্লাস
                  </span>
                </div>
              </div>

              {/* Specialist Subjects */}
              <div className="mt-5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  যেসব বিষয়ে স্পেশালিস্ট / পাঠদান করেন:
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.teacherDetails?.specialistSubjects && user.teacherDetails.specialistSubjects.length > 0 ? (
                    user.teacherDetails.specialistSubjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800"
                      >
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">কোনো বিষয় যুক্ত করা হয়নি</span>
                  )}
                </div>
              </div>

              {/* CV Document Link */}
              {user.teacherDetails?.cvUrl && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">সিভি / জীবনবৃত্তান্ত</span>
                  </div>
                  <a
                    href={user.teacherDetails.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <span>সিভি দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STUDENT PROFILE SPECIFICS */}
        {user.role === 'student' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>অ্যাকাডেমিক ও অভিভাবক পরিচিতি</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    স্কুল বা কলেজ
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.studentDetails?.schoolOrCollege || 'তথ্য দেওয়া হয়নি'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    বর্তমান শ্রেণি (Grade Level)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.studentDetails?.gradeLevel || 'তথ্য দেওয়া হয়নি'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    বিভাগ (Group)
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.studentDetails?.group || 'বিজ্ঞান / সাধারণ'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    অভিভাবকের নাম ও যোগাযোগ
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {user.studentDetails?.guardianName || 'তথ্য নেই'}{' '}
                    {user.studentDetails?.guardianPhone ? `(${user.studentDetails.guardianPhone})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
