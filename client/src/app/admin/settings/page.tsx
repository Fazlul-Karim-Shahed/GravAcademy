'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Home,
  Sliders,
  Bell,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Shield,
  Key,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { SiteLogo } from '@/components/common/SiteLogo';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { DriveFileUpload } from '@/components/ui/DriveFileUpload';
import { CheckCircle2, Save, Loader2, Image as ImageIcon } from 'lucide-react';

interface UserRecord {
  _id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  avatarUrl?: string;
}

type TabType = 'users' | 'homepage' | 'general' | 'notifications';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings, loading: loadingSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Site Settings state
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [siteName, setSiteName] = useState(settings.siteName || '');
  const [siteTagline, setSiteTagline] = useState(settings.siteTagline || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl || '');
      setSiteName(settings.siteName || 'Grav Academy');
      setSiteTagline(settings.siteTagline || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার');
    }
  }, [settings]);

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const ok = await updateSettings({
        logoUrl,
        siteName,
        siteTagline,
      });
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(page);
    }
  }, [activeTab, selectedRole, page]);

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

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPage(1);
  };

  const tabs = [
    { id: 'users' as TabType, label: 'ইউজার সেটিংস', icon: Users, count: users.length },
    { id: 'homepage' as TabType, label: 'হোম পেজ সেটিংস', icon: Home },
    { id: 'general' as TabType, label: 'সাধারণ সেটিংস', icon: Sliders },
    { id: 'notifications' as TabType, label: 'নোটিফিকেশন', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors"
              title="ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                সেটিংস ও কন্ট্রোল
              </h1>
            </div>
          </div>
        </div>

        {/* 2-Column Clean Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="lg:col-span-9 min-w-0">
            
            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
                {/* Panel Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      ইউজার তালিকা ও পারমিশন
                    </h2>
                    <p className="text-xs text-slate-400">
                      মোট {totalCount} জন ব্যবহারকারী {totalPages > 1 && `(পৃষ্ঠা ${page}/${totalPages})`}
                    </p>
                  </div>

                  {/* Search and Role Filter */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="নাম বা আইডি..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-2 w-44 sm:w-52 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">সকল রোল</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="guardian">Guardian</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Card View (< md) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loadingUsers ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      লোড হচ্ছে...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      কোনো অ্যাকাউন্ট পাওয়া যায়নি।
                    </div>
                  ) : (
                    users.map((u) => (
                      <div key={u._id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                              name={u.name}
                              avatarUrl={u.avatarUrl}
                              role={u.role}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {u.name}
                              </div>
                              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                                ID: {u.userId || '—'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] shrink-0 ${
                              u.role === 'admin' || u.role === 'superadmin'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : u.role === 'teacher'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {u.status}
                          </span>
                          <Link
                            href={`/admin/users/${u._id}/permissions`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-colors"
                          >
                            <Key className="w-3.5 h-3.5 text-blue-500" />
                            <span>পারমিশন</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Users List Table (Desktop: hidden on mobile) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase text-[11px]">
                        <th className="py-3 px-4">ইউজার</th>
                        <th className="py-3 px-4">আইডি (User ID)</th>
                        <th className="py-3 px-3">রোল</th>
                        <th className="py-3 px-3">স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-400">
                            লোড হচ্ছে...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-400">
                            কোনো অ্যাকাউন্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            {/* User Avatar + Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar
                                  name={u.name}
                                  avatarUrl={u.avatarUrl}
                                  role={u.role}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                                </div>
                              </div>
                            </td>

                            {/* User ID Column */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 select-all">
                                {u.userId || '—'}
                              </span>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                  u.role === 'admin' || u.role === 'superadmin'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    : u.role === 'teacher'
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {u.status}
                              </span>
                            </td>

                            {/* Action Link */}
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/admin/users/${u._id}/permissions`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs transition-colors"
                              >
                                <span>পারমিশন</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-3.5 px-4 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 dark:text-slate-400">
                      পৃষ্ঠা <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> / {totalPages}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || loadingUsers}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>আগেরটি</span>
                      </button>

                      {/* Numeric page pills */}
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
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                    page === pNum
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span>পরেরটি</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: HOMEPAGE SETTINGS */}
            {activeTab === 'homepage' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  হোম পেজ সেটিংস
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  হোমপেজের কন্টেন্ট, ব্যানার ও সেকশন কন্ট্রোল করার অপশনগুলো পরবর্তী ধাপে যুক্ত করা হবে।
                </p>
              </div>
            )}

            {/* TAB: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    সাধারণ সেটিংস ও ব্র্যান্ডিং
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    এখানে লোগো বা সাইটের নাম পরিবর্তন করলে তা নেভিগেশন বার, ফুটার, লগইন ও পুরো ওয়েবসাইটে তাৎক্ষণিকভাবে কার্যকর হবে।
                  </p>
                </div>

                {saveSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>সেটিংস ও লোগো সফলভাবে আপডেট হয়েছে এবং পুরো ওয়েবসাইটে প্রয়োগ করা হয়েছে!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSiteSettings} className="space-y-6">
                  {/* Live Logo Preview Box */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        লাইভ প্রিভিউ (বর্তমান লোগো)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        নিচে ছবি আপলোড করলে বা লিংক দিলে লোগো এখানে প্রদর্শিত হবে।
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md shadow-blue-500/20 shrink-0">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-white/90" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block leading-tight">
                          {siteName || 'Grav Academy'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                          {siteTagline || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upload Logo using Google Drive / File Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      ওয়েবসাইট লোগো (Google Drive / ডিরেক্ট ইমেজ আপলোড)
                    </label>
                    <DriveFileUpload
                      value={logoUrl}
                      onChange={(url) => setLogoUrl(url)}
                      label="লোগো ফাইল আপলোড করুন"
                      placeholder="https://drive.google.com/... অথবা আপনার কম্পিউটার থেকে লোগো নির্বাচন করুন"
                      helperText="স্বচ্ছ ব্যাকগ্রাউন্ডসহ PNG বা স্কয়ার সাইজের লোগো (যেমন: 512x512) সবচেয়ে সুন্দর দেখাবে।"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    />
                  </div>

                  {/* Site Name and Tagline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        প্ল্যাটফর্মের নাম (Site Name)
                      </label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="Grav Academy"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ট্যাগলাইন (Tagline / সাবটাইটেল)
                      </label>
                      <input
                        type="text"
                        value={siteTagline}
                        onChange={(e) => setSiteTagline(e.target.value)}
                        placeholder="ক্লাস ৬ – ১২ একাডেমিক কেয়ার"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>সংরক্ষণ করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>সেটিংস ও লোগো সংরক্ষণ করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  নোটিফিকেশন সেটিংস
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ক্লাস অ্যালার্ট, লাইভ সেশন ও এসএমএস নোটিফিকেশন সিস্টেম চালু রয়েছে।
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
