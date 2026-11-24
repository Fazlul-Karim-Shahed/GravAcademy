'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
  Trash2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import ComingSoonCard from '@/components/common/ComingSoonCard';

interface UserRecord {
  _id: string;
  gravId?: string;
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

  const canDeleteUser = (target: UserRecord) =>
    Boolean(user) &&
    target._id !== user?.id &&
    target.role !== 'superadmin' &&
    (target.role !== 'admin' || user?.role === 'superadmin');

  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deletinggravId, setDeletinggravId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeletinggravId(deleteTarget._id);
    setDeleteError('');
    try {
      const res = await api.delete(`/users/${deleteTarget._id}`);
      if (!res.data?.success) {
        setDeleteError(res.data?.message || 'ইউজার ডিলিট করা যায়নি');
        return;
      }
      setDeleteTarget(null);
      await fetchUsers(users.length === 1 && page > 1 ? page - 1 : page);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'ইউজার ডিলিট করা যায়নি');
    } finally {
      setDeletinggravId(null);
    }
  };

  // Guardian <-> Student linking modal
  const [linkModalGuardian, setLinkModalGuardian] = useState<UserRecord | null>(null);
  const [allStudents, setAllStudents] = useState<UserRecord[]>([]);
  const [selectedgravIds, setSelectedgravIds] = useState<string[]>([]);
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
      const linked = (guardianRes.data?.data?.guardianDetails?.linkedGravIds || []) as any[];
      setSelectedgravIds(linked.map((s: any) => (typeof s === 'string' ? s : s.gravId || s._id)));
      setAllStudents(studentsRes.data?.data || []);
    } catch (e) {
      setLinkError('তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoadingLinkModal(false);
    }
  };

  const toggleStudentSelection = (gravId: string) => {
    setSelectedgravIds((prev) =>
      prev.includes(gravId) ? prev.filter((id) => id !== gravId) : [...prev, gravId]
    );
  };

  const saveGuardianLinks = async () => {
    if (!linkModalGuardian) return;
    setSavingLink(true);
    setLinkError('');
    try {
      const res = await api.put(`/users/${linkModalGuardian._id}/link-students`, {
        gravIds: selectedgravIds,
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
    return s.name.toLowerCase().includes(q) || (s.gravId || '').toLowerCase().includes(q);
  });

  // Create Member Account (Teacher / Guardian / Employee) modal
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'teacher' | 'guardian' | 'employee'>('teacher');
  const [staffLinkedStudents, setStaffLinkedStudents] = useState<string[]>([]);
  const [staffStudentSearch, setStaffStudentSearch] = useState('');
  const [isStaffStudentDropdownOpen, setIsStaffStudentDropdownOpen] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createStaffError, setCreateStaffError] = useState('');
  const [createStaffSuccess, setCreateStaffSuccess] = useState('');

  const fetchStudentsList = async () => {
    if (allStudents.length > 0) return;
    setLoadingStudents(true);
    try {
      const res = await api.get('/users', { params: { role: 'student', limit: 500 } });
      setAllStudents(res.data?.data || []);
    } catch (e) {
      console.error('Failed to load students list', e);
    } finally {
      setLoadingStudents(false);
    }
  };

  const resetStaffForm = () => {
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffPassword('');
    setStaffRole('teacher');
    setStaffLinkedStudents([]);
    setStaffStudentSearch('');
    setIsStaffStudentDropdownOpen(false);
    setCreateStaffError('');
  };

  const filteredStaffStudents = allStudents.filter((s) => {
    if (!staffStudentSearch.trim()) return true;
    const q = staffStudentSearch.trim().toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.gravId || '').toLowerCase().includes(q);
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStaffError('');
    setCreatingStaff(true);
    try {
      const payload: any = {
        name: staffName.trim(),
        email: staffEmail.trim() || undefined,
        phone: staffPhone.trim() || undefined,
        password: staffPassword,
        role: staffRole,
      };
      if (staffRole === 'guardian' && staffLinkedStudents.length > 0) {
        payload.linkedGravIds = staffLinkedStudents;
      }
      const res = await api.post('/users/create-staff', payload);
      if (res.data?.success) {
        setCreateStaffSuccess(`"${staffName}" account তৈরি হয়েছে (Grav ID: ${res.data.data?.gravId})। চালু করতে email verification প্রয়োজন।`);
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

  if (loadingSettings) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0d12]">লোড হচ্ছে...</div>;
  if (!isFeatureEnabled('userManagement', user?.role === 'superadmin')) return <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-[#0b0d12]"><ComingSoonCard feature="User Management" /></div>;
  return (
    <div className="ga-page ga-admin-page py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <AdminPageHeader title="ইউজার ম্যানেজমেন্ট" description="সকল user account, role এবং staff access পরিচালনা করুন।" actions={<>
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1a202c] border border-slate-200 dark:border-[#262b34] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-orange-500" />
              <span>নতুন মেম্বার তৈরি করুন</span>
            </button>
            <Link
              href="/admin/admissions"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী ভর্তি</span>
            </Link>
          </>} />

        {/* Role Quick Filters */}
        <div className="ga-operation-toolbar mb-6 overflow-x-auto p-1 no-scrollbar">
          {rolePills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleRoleChange(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === pill.id
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xs'
                  : 'bg-white dark:bg-[#111318] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#151921] border border-slate-200/80 dark:border-[#262b34]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Main Users Table Card */}
        <div className="bg-white dark:bg-[#111318] rounded-3xl border border-slate-200/90 dark:border-[#262b34] shadow-sm overflow-hidden">
          
          {/* Card Top Control Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#262b34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>সকল ইউজার অ্যাকাউন্ট</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
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
                  placeholder="নাম বা Grav ID লিখে খুঁজুন..."
                  className="bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 w-60 sm:w-72 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#151921] hover:bg-slate-200 dark:hover:bg-[#1a202c] border border-slate-200/80 dark:border-[#262b34] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                খুঁজুন
              </button>
            </div>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#262b34]">
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
                        <Link href={`/admin/users/${u._id}`} title="প্রোফাইল দেখুন" className="font-bold text-sm text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400 truncate transition-colors">
                          {u.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.email || u.phone || 'কোনো ইমেইল বা ফোন নেই'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-lg font-bold uppercase text-[10px] tracking-wide inline-block ${
                        u.role === 'admin' || u.role === 'superadmin'
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                          : u.role === 'teacher'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                          : u.role === 'guardian'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                          : 'bg-slate-100 text-slate-600 dark:bg-[#151921] dark:text-slate-400 border border-slate-200/60 dark:border-[#262b34]'
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

                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#151921]/60 p-2.5 rounded-xl border border-slate-100 dark:border-[#262b34]">
                    <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                      Grav ID: {u.gravId || '—'}
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

                  <Link href={`/admin/users/${u._id}`} className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs transition-colors border border-orange-500/20">
                    <Eye className="w-3.5 h-3.5" />
                    <span>প্রোফাইল</span>
                  </Link>

                  <Link
                    href={`/admin/users/${u._id}/permissions`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-orange-50 dark:bg-[#151921] dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition-colors border border-slate-200/70 dark:border-[#262b34] shadow-2xs"
                  >
                    <Key className="w-3.5 h-3.5 text-orange-500" />
                    <span>পারমিশন ও অ্যাক্সেস কন্ট্রোল</span>
                    <ChevronRight className="w-3 h-3 ml-auto text-slate-400" />
                  </Link>

                  {canDeleteUser(u) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTarget(u);
                      }}
                      disabled={deletinggravId === u._id}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors border border-rose-200/70 dark:border-rose-800 shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ডিলিট</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Table (Desktop: hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#262b34] bg-slate-50/50 dark:bg-[#151921]/60 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">ইউজার</th>
                  <th className="py-3.5 px-4">Grav ID</th>
                  <th className="py-3.5 px-4">যোগাযোগ (Email / Phone)</th>
                  <th className="py-3.5 px-3">রোল (Role)</th>
                  <th className="py-3.5 px-3">স্ট্যাটাস</th>
                  <th className="py-3.5 px-2"></th>
                  <th className="py-3.5 px-2"></th>
                  <th className="py-3.5 px-2"></th>
                  <th className="py-3.5 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262b34]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-400 font-medium">
                      ইউজার তালিকা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-400 font-medium">
                      কোনো ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-[#151921]/40 transition-colors">
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
                            <Link href={`/admin/users/${u._id}`} title="প্রোফাইল দেখুন" className="font-bold text-sm text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400 truncate transition-colors">
                              {u.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Grav ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/20 select-all">
                          {u.gravId || '—'}
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
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                              : u.role === 'teacher'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                              : u.role === 'guardian'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                              : 'bg-slate-100 text-slate-600 dark:bg-[#151921] dark:text-slate-400 border border-slate-200/60 dark:border-[#262b34]'
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

                      {/* Button Column 1: Profile */}
                      <td className="py-3.5 px-2 whitespace-nowrap text-center">
                        <Link
                          href={`/admin/users/${u._id}`}
                          title="প্রোফাইল দেখুন"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs transition-colors border border-orange-500/20 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>প্রোফাইল</span>
                        </Link>
                      </td>

                      {/* Button Column 2: Link Student (for guardian) */}
                      <td className="py-3.5 px-2 whitespace-nowrap text-center">
                        {u.role === 'guardian' ? (
                          <button
                            type="button"
                            onClick={() => openLinkModal(u)}
                            title="শিক্ষার্থী লিংক করুন"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors border border-amber-200/70 dark:border-amber-800 shadow-2xs cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>শিক্ষার্থী লিংক</span>
                          </button>
                        ) : null}
                      </td>

                      {/* Button Column 3: Permissions */}
                      <td className="py-3.5 px-2 whitespace-nowrap text-center">
                        <Link
                          href={`/admin/users/${u._id}/permissions`}
                          title="পারমিশন ও অ্যাক্সেস কন্ট্রোল"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 dark:bg-[#151921] dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition-colors border border-slate-200/70 dark:border-[#262b34] shadow-2xs cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-orange-500" />
                          <span>পারমিশন</span>
                        </Link>
                      </td>

                      {/* Button Column 4: Delete */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-center w-12">
                        {canDeleteUser(u) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(u);
                            }}
                            disabled={deletinggravId === u._id}
                            title="ইউজার ডিলিট করুন"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-300 transition-colors border border-rose-200/70 dark:border-rose-900/40 shadow-2xs disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-[#151921]/40 border-t border-slate-100 dark:border-[#262b34] flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                পৃষ্ঠা <span className="font-bold text-orange-600 dark:text-orange-400">{page}</span> / {totalPages} (মোট {totalCount} জন)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingUsers}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1a202c] transition-colors shadow-2xs"
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
                            className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                              page === pNum
                                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#151921]'
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1a202c] transition-colors shadow-2xs"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Create Staff / Member Account Modal (Teacher / Guardian / Employee) */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-md w-full border border-slate-200 dark:border-[#262b34] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-[#262b34] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">নতুন মেম্বার অ্যাকাউন্ট তৈরি করুন</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateStaffModal(false);
                  resetStaffForm();
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#151921] flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4 overflow-y-auto flex-1">
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
                      onClick={() => {
                        setStaffRole(r.id);
                        if (r.id === 'guardian') {
                          fetchStudentsList();
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        staffRole === r.id
                          ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a202c]'
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
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    ইমেইল <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">মোবাইল (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">
                * ভেরিফিকেশনের জন্য ইমেইল আবশ্যক। অ্যাকাউন্ট তৈরির সাথে সাথে স্বয়ংক্রিয়ভাবে আইডি ও পাসওয়ার্ডসহ ওয়েলকাম মেসেজ যাবে।
              </p>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">পাসওয়ার্ড *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* If Guardian is selected, show student linking select box */}
              {staffRole === 'guardian' && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#262b34]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-orange-500" />
                      <span>শিক্ষার্থী লিংক করুন</span>
                      <span className="text-[11px] font-normal text-slate-400">(ঐচ্ছিক)</span>
                    </label>
                    {staffLinkedStudents.length > 0 && (
                      <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                        {staffLinkedStudents.length} জন নির্বাচিত
                      </span>
                    )}
                  </div>

                  {/* Selected Students Chips */}
                  {staffLinkedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {staffLinkedStudents.map((gravId) => {
                        const student = allStudents.find((s) => (s.gravId || s._id) === gravId);
                        return (
                          <span
                            key={gravId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 text-xs font-semibold text-orange-700 dark:text-orange-300"
                          >
                            <span className="truncate max-w-[130px]">{student?.name || gravId}</span>
                            <span className="text-[10px] text-orange-500 font-mono">#{gravId}</span>
                            <button
                              type="button"
                              onClick={() => setStaffLinkedStudents((prev) => prev.filter((id) => id !== gravId))}
                              className="hover:text-rose-600 text-orange-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="বাদ দিন"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search / Select dropdown box */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={staffStudentSearch}
                        onChange={(e) => {
                          setStaffStudentSearch(e.target.value);
                          setIsStaffStudentDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsStaffStudentDropdownOpen(true);
                          fetchStudentsList();
                        }}
                        placeholder="শিক্ষার্থীর নাম বা Grav ID দিয়ে খুঁজুন..."
                        className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl pl-8.5 pr-8 py-2.5 focus:outline-none focus:border-orange-500"
                      />
                      {staffStudentSearch && (
                        <button
                          type="button"
                          onClick={() => setStaffStudentSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Backdrop */}
                    {isStaffStudentDropdownOpen && (
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsStaffStudentDropdownOpen(false)}
                      />
                    )}

                    {/* Dropdown list */}
                    {isStaffStudentDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto bg-white dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl shadow-xl p-1.5 space-y-1">
                        {loadingStudents ? (
                          <div className="p-3 text-center text-xs text-slate-400">শিক্ষার্থী লোড হচ্ছে...</div>
                        ) : filteredStaffStudents.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
                        ) : (
                          filteredStaffStudents.slice(0, 50).map((s) => {
                            const sGravId = s.gravId || s._id;
                            const isSelected = staffLinkedStudents.includes(sGravId);
                            return (
                              <button
                                key={s._id}
                                type="button"
                                onClick={() => {
                                  setStaffLinkedStudents((prev) =>
                                    isSelected ? prev.filter((id) => id !== sGravId) : [...prev, sGravId]
                                  );
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-[#1a202c] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-semibold truncate">{s.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">#{s.gravId || s._id}</div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 accent-orange-600 rounded pointer-events-none"
                                />
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    অভিভাবক লগইন করার পর লিঙ্ক করা শিক্ষার্থীদের ড্যাশবোর্ড ও অগ্রগতি দেখতে পাবেন।
                  </p>
                </div>
              )}

              {createStaffError && (
                <div className="text-xs text-rose-600 font-bold">{createStaffError}</div>
              )}
              {createStaffSuccess && (
                <div className="text-xs text-emerald-600 font-bold">{createStaffSuccess}</div>
              )}

              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {creatingStaff ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guardian <-> Student Link Modal */}
      {linkModalGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-[#262b34] shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-[#262b34] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  "{linkModalGuardian.name}" এর জন্য শিক্ষার্থী লিংক করুন
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  এই অভিভাবক শুধু নিচে নির্বাচিত শিক্ষার্থীদের তথ্য দেখতে পারবেন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalGuardian(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#151921] flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-[#262b34]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={linkStudentSearch}
                  onChange={(e) => setLinkStudentSearch(e.target.value)}
                  placeholder="নাম বা আইডি দিয়ে শিক্ষার্থী খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-orange-500"
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
                  const sGravId = s.gravId || s._id;
                  const checked = selectedgravIds.includes(sGravId);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/60'
                          : 'bg-slate-50 dark:bg-[#151921]/40 border-transparent hover:border-slate-200 dark:hover:border-[#262b34]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudentSelection(sGravId)}
                        className="w-4 h-4 accent-orange-600 rounded"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">#{s.gravId || '—'}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {linkError && (
              <div className="px-4 pb-2 text-xs text-rose-600 font-bold">{linkError}</div>
            )}

            <div className="p-4 border-t border-slate-200 dark:border-[#262b34] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedgravIds.length} জন নির্বাচিত
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalGuardian(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#151921] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#1a202c] transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={savingLink || loadingLinkModal}
                  onClick={saveGuardianLinks}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingLink ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-[#262b34] flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ইউজার ডিলিট করবেন?</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{deleteTarget.name}</span>-এর অ্যাকাউন্ট ও সংশ্লিষ্ট রেকর্ড স্থায়ীভাবে মুছে যাবে। এই কাজ ফেরানো যাবে না।
                </p>
                <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">পেমেন্ট হিসাব থাকবে, শুধু পুরোনো সংগ্রাহকের লিংক সরবে।</p>
              </div>
            </div>
            {deleteError && <div className="px-5 pt-4 text-xs font-bold text-rose-600">{deleteError}</div>}
            <div className="p-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletinggravId)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#151921] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#1a202c] transition-colors disabled:opacity-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={Boolean(deletinggravId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletinggravId ? 'ডিলিট হচ্ছে...' : 'স্থায়ীভাবে ডিলিট'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
