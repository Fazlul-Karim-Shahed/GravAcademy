'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Shield,
  Key,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Filter,
  Link2,
  X,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import ComingSoonCard from '@/components/common/ComingSoonCard';

interface UserRecord {
  _id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { loading: loadingSettings, isFeatureEnabled } = useSiteSettings();

  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 12;

  useEffect(() => {
    fetchUsers(page);
  }, [selectedRole, page]);

  const fetchUsers = async (targetPage = page) => {
    setLoadingUsers(true);
    try {
      const params: any = {
        page: targetPage,
        limit,
      };
      if (selectedRole !== 'all') params.role = selectedRole;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount ?? res.data.data?.length ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
  };

  // Guardian <-> Student linking modal
  const [linkModalGuardian, setLinkModalGuardian] = useState<UserRecord | null>(null);
  const [allStudents, setAllStudents] = useState<UserRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingLinkModal, setLoadingLinkModal] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkStudentSearch, setLinkStudentSearch] = useState('');

  const openLinkModal = async (guardian: UserRecord) => {
    setLinkModalGuardian(guardian);
    setLinkError('');
    setLinkStudentSearch('');
    setLoadingLinkModal(true);
    try {
      const [guardianRes, studentsRes] = await Promise.all([
        api.get(`/users/${guardian._id}`),
        api.get('/users', { params: { role: 'student', limit: 500 } }),
      ]);
      const linked = (guardianRes.data?.data?.guardianDetails?.linkedStudents || []) as any[];
      setSelectedStudentIds(linked.map((s: any) => (typeof s === 'string' ? s : s._id)));
      setAllStudents(studentsRes.data?.data || []);
    } catch (e) {
      setLinkError('তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoadingLinkModal(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const saveGuardianLinks = async () => {
    if (!linkModalGuardian) return;
    setSavingLink(true);
    setLinkError('');
    try {
      const res = await api.put(`/users/${linkModalGuardian._id}/link-students`, {
        studentIds: selectedStudentIds,
      });
      if (res.data?.success) {
        setLinkModalGuardian(null);
      } else {
        setLinkError(res.data?.message || 'সংযোগ আপডেট করা যায়নি');
      }
    } catch (err: any) {
      setLinkError(err.response?.data?.message || 'সংযোগ আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setSavingLink(false);
    }
  };

  const filteredModalStudents = allStudents.filter((s) => {
    if (!linkStudentSearch.trim()) return true;
    const q = linkStudentSearch.trim().toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.userId || '').toLowerCase().includes(q);
  });

  // Create Staff Account (Teacher / Guardian / Employee) modal
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'teacher' | 'guardian' | 'employee'>('teacher');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createStaffError, setCreateStaffError] = useState('');
  const [createStaffSuccess, setCreateStaffSuccess] = useState('');

  const resetStaffForm = () => {
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffPassword('');
    setStaffRole('teacher');
    setCreateStaffError('');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStaffError('');
    setCreatingStaff(true);
    try {
      const res = await api.post('/users/create-staff', {
        name: staffName.trim(),
        email: staffEmail.trim() || undefined,
        phone: staffPhone.trim() || undefined,
        password: staffPassword,
        role: staffRole,
      });
      if (res.data?.success) {
        setCreateStaffSuccess(`"${staffName}" সফলভাবে তৈরি হয়েছে (ID: ${res.data.data?.userId})`);
        resetStaffForm();
        fetchUsers(1);
        setPage(1);
        setTimeout(() => {
          setShowCreateStaffModal(false);
          setCreateStaffSuccess('');
        }, 1800);
      } else {
        setCreateStaffError(res.data?.message || 'অ্যাকাউন্ট তৈরি করা যায়নি');
      }
    } catch (err: any) {
      setCreateStaffError(err.response?.data?.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPage(1);
  };

  const rolePills = [
    { id: 'all', label: 'সকল ইউজার' },
    { id: 'student', label: 'শিক্ষার্থী (Student)' },
    { id: 'teacher', label: 'শিক্ষক (Teacher)' },
    { id: 'admin', label: 'এডমিন (Admin)' },
    { id: 'guardian', label: 'অভিভাবক (Guardian)' },
    { id: 'employee', label: 'কর্মচারী (Employee)' },
  ];

  if (loadingSettings) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!isFeatureEnabled('userManagement', user?.role === 'superadmin')) return <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-slate-950"><ComingSoonCard feature="User Management" /></div>;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors shadow-2xs"
              title="ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Users className="w-6 h-6" />
                </span>
                ইউজার ম্যানেজমেন্ট (User Management)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন স্টাফ তৈরি করুন</span>
            </button>
            <Link
              href="/admin/admissions"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী ভর্তি</span>
            </Link>
          </div>
        </div>

        {/* Role Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {rolePills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleRoleChange(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === pill.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Main Users Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Card Top Control Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>সকল ইউজার অ্যাকাউন্ট</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60">
                  {totalCount} জন
                </span>
              </h2>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="নাম বা ইউজার আইডি লিখে খুঁজুন..."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 w-60 sm:w-72 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                খুঁজুন
              </button>
            </div>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {loadingUsers ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                ইউজার তালিকা লোড হচ্ছে...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                কোনো ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।
              </div>
            ) : (
              users.map((u) => (
                <div key={u._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={u.name}
                        avatarUrl={u.avatarUrl}
                        role={u.role}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.email || u.phone || 'কোনো ইমেইল বা ফোন নেই'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-lg font-bold uppercase text-[10px] tracking-wide inline-block ${
                        u.role === 'admin' || u.role === 'superadmin'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                          : u.role === 'teacher'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                          : u.role === 'guardian'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      {u.role === 'admin'
                        ? 'এডমিন'
                        : u.role === 'superadmin'
                        ? 'সুপারএডমিন'
                        : u.role === 'teacher'
                        ? 'শিক্ষক'
                        : u.role === 'guardian'
                        ? 'অভিভাবক'
                        : u.role === 'employee'
                        ? 'কর্মচারী'
                        : 'শিক্ষার্থী'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                      ID: {u.userId || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {u.status === 'active' ? 'সক্রিয়' : u.status}
                    </span>
                  </div>

                  {u.role === 'guardian' && (
                    <button
                      type="button"
                      onClick={() => openLinkModal(u)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors border border-amber-200/70 dark:border-amber-800 shadow-2xs"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>শিক্ষার্থী লিংক করুন</span>
                    </button>
                  )}

                  <Link
                    href={`/admin/users/${u._id}/permissions`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-colors border border-slate-200/70 dark:border-slate-700 shadow-2xs"
                  >
                    <Key className="w-3.5 h-3.5 text-blue-500" />
                    <span>পারমিশন ও অ্যাক্সেস কন্ট্রোল</span>
                    <ChevronRight className="w-3 h-3 ml-auto text-slate-400" />
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Table (Desktop: hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">ইউজার</th>
                  <th className="py-3.5 px-4">ইউজার আইডি (User ID)</th>
                  <th className="py-3.5 px-4">যোগাযোগ (Email / Phone)</th>
                  <th className="py-3.5 px-3">রোল (Role)</th>
                  <th className="py-3.5 px-3">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-slate-400 font-medium">
                      ইউজার তালিকা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-slate-400 font-medium">
                      কোনো ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Avatar + Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={u.name}
                            avatarUrl={u.avatarUrl}
                            role={u.role}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {u.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 select-all">
                          {u.userId || '—'}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                            {u.email || '—'}
                          </div>
                          {u.phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] tracking-wide inline-block ${
                            u.role === 'admin' || u.role === 'superadmin'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                              : u.role === 'teacher'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                              : u.role === 'guardian'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          {u.role === 'admin'
                            ? 'এডমিন'
                            : u.role === 'superadmin'
                            ? 'সুপারএডমিন'
                            : u.role === 'teacher'
                            ? 'শিক্ষক'
                            : u.role === 'guardian'
                            ? 'অভিভাবক'
                            : u.role === 'employee'
                            ? 'কর্মচারী'
                            : 'শিক্ষার্থী'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {u.status === 'active' ? 'সক্রিয়' : u.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {u.role === 'guardian' && (
                            <button
                              type="button"
                              onClick={() => openLinkModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors shadow-2xs"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>শিক্ষার্থী লিংক করুন</span>
                            </button>
                          )}
                          <Link
                            href={`/admin/users/${u._id}/permissions`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-colors shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>পারমিশন ও কন্ট্রোল</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                পৃষ্ঠা <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> / {totalPages} (মোট {totalCount} জন)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingUsers}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>পূর্ববর্তী</span>
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1)
                    .map((pNum, i, arr) => {
                      const prev = arr[i - 1];
                      return (
                        <React.Fragment key={pNum}>
                          {prev && pNum - prev > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setPage(pNum)}
                            disabled={loadingUsers}
                            className={`w-7 h-7 rounded-xl text-xs font-bold transition-colors ${
                              page === pNum
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pNum}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loadingUsers}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Create Staff Account Modal (Teacher / Guardian / Employee) */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">নতুন স্টাফ অ্যাকাউন্ট তৈরি করুন</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateStaffModal(false);
                  resetStaffForm();
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">রোল</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'teacher', label: 'শিক্ষক' },
                    { id: 'guardian', label: 'অভিভাবক' },
                    { id: 'employee', label: 'কর্মচারী' },
                  ] as const).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setStaffRole(r.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                        staffRole === r.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="যেমন: রাকিব আল হাসান"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">ইমেইল</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">মোবাইল</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">ইমেইল অথবা মোবাইলের মধ্যে অন্তত একটি দিতে হবে</p>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">পাসওয়ার্ড *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              {createStaffError && (
                <div className="text-xs text-rose-600 font-bold">{createStaffError}</div>
              )}
              {createStaffSuccess && (
                <div className="text-xs text-emerald-600 font-bold">{createStaffSuccess}</div>
              )}

              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {creatingStaff ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guardian <-> Student Link Modal */}
      {linkModalGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  "{linkModalGuardian.name}" এর জন্য শিক্ষার্থী লিংক করুন
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  এই অভিভাবক শুধু নিচে নির্বাচিত শিক্ষার্থীদের তথ্য দেখতে পারবেন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalGuardian(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={linkStudentSearch}
                  onChange={(e) => setLinkStudentSearch(e.target.value)}
                  placeholder="নাম বা আইডি দিয়ে শিক্ষার্থী খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {loadingLinkModal ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">লোড হচ্ছে...</div>
              ) : filteredModalStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
              ) : (
                filteredModalStudents.map((s) => {
                  const checked = selectedStudentIds.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudentSelection(s._id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                        <div className="text-[11px] text-slate-500">#{s.userId || '—'}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {linkError && (
              <div className="px-4 pb-2 text-xs text-rose-600 font-bold">{linkError}</div>
            )}

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedStudentIds.length} জন নির্বাচিত
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalGuardian(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={savingLink || loadingLinkModal}
                  onClick={saveGuardianLinks}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingLink ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
