'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

interface UserProfile {
  _id: string;
  gravId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  studentDetails?: {
    schoolOrCollege?: string;
    gradeLevel?: string;
    group?: string;
    guardianName?: string;
    guardianPhone?: string;
  };
  teacherDetails?: {
    institution?: string;
    department?: string;
    experience?: string;
    specialistSubjects?: string[];
  };
  guardianDetails?: { linkedGravIds?: string[] };
  employeeDetails?: { department?: string; assignedTasks?: string[] };
}

const roleNames: Record<string, string> = {
  superadmin: 'সুপারএডমিন',
  admin: 'এডমিন',
  teacher: 'শিক্ষক',
  student: 'শিক্ষার্থী',
  guardian: 'অভিভাবক',
  employee: 'কর্মচারী',
};

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex min-w-0 items-start gap-3 py-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = String(params?.id || '');
  const { user: currentUser } = useAuth();
  const { loading: loadingSettings, isFeatureEnabled } = useSiteSettings();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canManageUsers = hasPermission(currentUser, PERMISSIONS.USERS_MANAGE) || hasPermission(currentUser, PERMISSIONS.PERMISSIONS_MANAGE);
  const base = currentUser?.role === 'employee' ? '/employee/users' : '/admin/users';

  useEffect(() => {
    if (loadingSettings) return;
    if (!userId || !canManageUsers || !isFeatureEnabled('userManagement', currentUser?.role === 'superadmin')) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    api.get(`/users/${userId}`)
      .then((response) => {
        if (active) setProfile(response.data?.data || null);
      })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.message || 'প্রোফাইল লোড করা যায়নি।');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId, loadingSettings, canManageUsers, currentUser?.role, isFeatureEnabled]);

  if (loadingSettings || loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">প্রোফাইল লোড হচ্ছে...</main>;
  }

  if (!canManageUsers || !isFeatureEnabled('userManagement', currentUser?.role === 'superadmin')) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-600 dark:bg-[#0b0d12] dark:text-slate-300">এই প্রোফাইল দেখার permission নেই।</main>;
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-[#0b0d12]">
        <div className="ga-card mx-auto max-w-3xl p-6 text-sm text-rose-700 dark:text-rose-300">
          {error || 'ইউজার পাওয়া যায়নি।'}
          <Link href={base} className="ml-3 font-bold text-orange-600 dark:text-orange-400 underline underline-offset-4">ইউজার তালিকায় ফিরুন</Link>
        </div>
      </main>
    );
  }

  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' })
    : undefined;
  const verifiedText = profile.emailVerified ? 'Verified' : 'Verification pending';
  const linkedStudentCount = profile.guardianDetails?.linkedGravIds?.length || 0;

  return (
    <main className="ga-page ga-admin-page py-6 text-slate-900 dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href={base} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-orange-300 dark:hover:border-orange-500/40 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300 dark:hover:text-orange-400">
            <ArrowLeft className="h-4 w-4" /> ইউজার তালিকা
          </Link>
          {hasPermission(currentUser, PERMISSIONS.PERMISSIONS_MANAGE) && (currentUser?.role !== 'employee' || profile.role === 'employee') && <Link href={`${base}/${profile._id}/permissions`} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:border-orange-300 dark:hover:border-orange-500/40 hover:text-orange-600 dark:border-[#262b34] dark:bg-[#111318] dark:text-slate-300 dark:hover:text-orange-400">Permissions</Link>}
        </div>

        <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318] lg:grid-cols-[220px_1fr]">
          <div className="flex items-center justify-center border-b border-slate-200 bg-slate-50 p-7 dark:border-[#262b34] dark:bg-[#151921] lg:border-b-0 lg:border-r">
            <UserAvatar name={profile.name} avatarUrl={profile.avatarUrl} role={profile.role} size="xl" />
          </div>
          <div className="min-w-0 p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900 dark:text-white">{profile.name}</h1>
                <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20">{roleNames[profile.role] || profile.role}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${profile.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}>{profile.status === 'active' ? 'সক্রিয়' : profile.status}</span>
              </div>
              <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{profile.email || 'ইমেইল দেওয়া নেই'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {profile.gravId && <span className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1.5 font-mono font-bold text-orange-600 dark:text-orange-400">Grav ID: {profile.gravId}</span>}
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ${profile.emailVerified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}><ShieldCheck className="h-3.5 w-3.5" />{verifiedText}</span>
              </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><UserRound className="h-4 w-4 text-orange-600 dark:text-orange-400" /> মৌলিক তথ্য</h2>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-[#262b34]">
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone} />
              <InfoItem icon={<CalendarDays className="h-4 w-4" />} label="Joined" value={joinedDate} />
              <InfoItem icon={<ShieldCheck className="h-4 w-4" />} label="Email verification" value={verifiedText} />
              {profile.bio && <InfoItem icon={<UserRound className="h-4 w-4" />} label="Bio" value={profile.bio} />}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><GraduationCap className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Role details</h2>
            {profile.studentDetails && <div className="mt-3 divide-y divide-slate-100 dark:divide-[#262b34]"><InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Class / Grade" value={profile.studentDetails.gradeLevel} /><InfoItem icon={<MapPin className="h-4 w-4" />} label="School / College" value={profile.studentDetails.schoolOrCollege} /><InfoItem icon={<UserRound className="h-4 w-4" />} label="Group" value={profile.studentDetails.group} /><InfoItem icon={<Users className="h-4 w-4" />} label="Guardian" value={profile.studentDetails.guardianName} /><InfoItem icon={<Phone className="h-4 w-4" />} label="Guardian phone" value={profile.studentDetails.guardianPhone} /></div>}
            {profile.teacherDetails && <div className="mt-3 divide-y divide-slate-100 dark:divide-[#262b34]"><InfoItem icon={<MapPin className="h-4 w-4" />} label="Institution" value={profile.teacherDetails.institution} /><InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Department" value={profile.teacherDetails.department} /><InfoItem icon={<CalendarDays className="h-4 w-4" />} label="Experience" value={profile.teacherDetails.experience} /><InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Specialist subjects" value={profile.teacherDetails.specialistSubjects?.join(', ')} /></div>}
            {profile.guardianDetails && <div className="mt-3"><InfoItem icon={<Users className="h-4 w-4" />} label="Linked students" value={`${linkedStudentCount} জন`} /></div>}
            {profile.employeeDetails && <div className="mt-3 divide-y divide-slate-100 dark:divide-[#262b34]"><InfoItem icon={<MapPin className="h-4 w-4" />} label="Department" value={profile.employeeDetails.department} /><InfoItem icon={<Users className="h-4 w-4" />} label="Assigned tasks" value={profile.employeeDetails.assignedTasks?.length ? profile.employeeDetails.assignedTasks.join(', ') : undefined} /></div>}
            {!profile.studentDetails && !profile.teacherDetails && !profile.guardianDetails && !profile.employeeDetails && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">এই role-এর জন্য অতিরিক্ত তথ্য নেই।</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
