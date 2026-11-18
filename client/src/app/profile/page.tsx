'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/common/UserAvatar';
import { SiteLogo } from '@/components/common/SiteLogo';
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
  const joinedDate = (user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-GB') : '—';

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
                {user.gravId && (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Grav ID:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300 select-all">
                      {user.gravId}
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

        {/* Printable identity card */}
        <style jsx global>{`@media print { body * { visibility: hidden !important; } #identity-card-sheet, #identity-card-sheet * { visibility: visible !important; } #identity-card-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } }`}</style>
        <section className="mb-8 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">আপনার ID Card</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">পরিচয়পত্রটি print করে ব্যবহার করতে পারেন।</p>
            </div>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 print:hidden"><FileText className="h-4 w-4" /> Print</button>
          </div>
          <div id="identity-card-sheet" className="mx-auto grid w-full max-w-[620px] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:items-start sm:gap-5">
            <div className="relative h-[390px] w-[245px] overflow-hidden bg-white shadow-xl ring-1 ring-slate-200 print:shadow-none">
              <div className="absolute inset-x-0 top-0 h-[24px] bg-[#323032]" />
              <div className="absolute inset-x-0 top-[24px] h-[7px] bg-red-600" />
              <div className="absolute left-1/2 top-[31px] h-[7px] w-[93px] -translate-x-1/2 bg-red-600 [clip-path:polygon(0_0,100%_0,93%_100%,7%_100%)]" />
              <div className="absolute left-1/2 top-[45px] z-10 -translate-x-1/2 text-center"><SiteLogo size="sm" showText={true} textClassName="text-slate-800 text-[8px] font-semibold" taglineClassName="text-slate-500 text-[5px]" className="!border-0 !bg-transparent" /></div>
              <div className="absolute left-1/2 top-[108px] z-20 -translate-x-1/2"><UserAvatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="lg" className="h-[104px] w-[104px] rounded-full border border-[#222] bg-[#e4e3e6] shadow-none" /></div>
              <div className="absolute inset-x-0 top-[237px] z-20 px-4 text-center"><h4 className="truncate font-black uppercase leading-none tracking-wide text-red-600" style={{fontSize: user.name.length > 18 ? '18px' : '24px'}}>{user.name}</h4><p className="mt-1 text-[9px] font-light uppercase text-[#555]">{roleTitle}</p><svg className="mx-auto mt-3 h-[24px] w-[113px]" viewBox="0 0 277 71" preserveAspectRatio="none" aria-label="ID barcode">{[0,4,14,18,30,34,40,46,50,58,62,68,74,86,90,101,107,115,121,125,137,141,147,153,159,171,179,185,195,199,205,213,219,225,235,243,251,261,269].map((x, i) => <rect key={i} x={x} y="0" width={i % 5 === 0 ? 2 : i % 3 === 0 ? 6 : 4} height="71" fill="#111" />)}</svg><p className="mt-1 text-[7px] text-[#111]">{user.gravId || '000000'}</p><p className="mt-2 text-[10px] font-light text-[#555]">ID NUMBER: {user.gravId || '—'}</p></div>
              <div className="absolute inset-x-0 bottom-[17px] h-[7px] bg-red-600" /><div className="absolute inset-x-0 bottom-0 h-[17px] bg-[#323032]" />
            </div>
            <div className="relative h-[390px] w-[245px] overflow-hidden bg-white shadow-xl ring-1 ring-slate-200 print:shadow-none">
              <div className="absolute left-1/2 top-[32px] z-10 flex h-[27px] w-[27px] -translate-x-1/2 items-center justify-center rounded-[3px] bg-black text-[22px] font-bold leading-none text-white">T</div>
              <div className="absolute inset-x-0 top-[120px] whitespace-nowrap text-center text-[8px] font-light leading-4 tracking-[0.04em] text-[#555]">DATE ISSUED: {(() => { const issued = (user as typeof user & { createdAt?: string }).createdAt; return issued ? new Date(issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'; })()}</div>
              <div className="absolute inset-x-0 top-[143px] whitespace-nowrap text-center text-[8px] font-light leading-4 tracking-[0.04em] text-[#555]">EXPIRY DATE: {(() => { const issued = (user as typeof user & { createdAt?: string }).createdAt; const d = issued ? new Date(issued) : new Date(); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); })()}</div>
              <div className="absolute inset-x-0 top-[164px] h-[7px] bg-red-600" /><div className="absolute left-1/2 top-[154px] h-[10px] w-[86px] -translate-x-1/2 bg-red-600 [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 top-[171px] bottom-0 bg-[#323032] text-white"><h4 className="mt-[57px] text-center font-black uppercase tracking-[0.02em]" style={{fontSize: '18px'}}>IN CASE OF EMERGENCY:</h4><p className="mt-[31px] text-center text-[10px] font-light">CONTACT NUMBER:</p><p className="mt-2 text-center text-[12px] font-light">{user.phone || '—'}</p><p className="mt-[20px] text-center text-[10px] font-light">EMAIL:</p><p className="mx-3 mt-2 truncate text-center text-[9px] font-light uppercase">{user.email}</p><p className="absolute inset-x-6 bottom-[25px] text-center text-[9px] italic leading-4 text-white/90">THIS ID CARD MUST BE SURRENDERED UPON TERMINATION OF SERVICES IN THIS BUSINESS ENTERPRISE.</p></div>
            </div>
          </div>
        </section>

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
