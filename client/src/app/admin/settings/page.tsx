'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import {
  Settings,
  Users,
  Home,
  Sliders,
  Shield,
  Key,
  Search,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Bell,
  Globe,
  Palette,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
  customPermissions: string[];
}

type SettingTab = 'users' | 'homepage' | 'general' | 'notifications';

export default function AdminSettingsPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('users');

  // User Management State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, selectedRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params: any = {};
      if (selectedRole !== 'all') params.role = selectedRole;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const navItems = [
    {
      id: 'users' as SettingTab,
      label: 'ইউজার সেটিংস (User Settings)',
      description: 'অ্যাকাউন্ট, রোল ও পারমিশন কন্ট্রোল',
      icon: Users,
      badge: users.length > 0 ? `${users.length}` : undefined,
    },
    {
      id: 'homepage' as SettingTab,
      label: 'হোম পেজ সেটিংস (Homepage)',
      description: 'ওয়েবসাইটের কন্টেন্ট ও ব্যানার কনফিগারেশন',
      icon: Home,
      badge: 'শীঘ্রই আসছে',
    },
    {
      id: 'general' as SettingTab,
      label: 'সাধারণ সেটিংস (General)',
      description: 'ইনস্টিটিউট ইনফো, লোগো ও ব্র্যান্ডিং',
      icon: Sliders,
    },
    {
      id: 'notifications' as SettingTab,
      label: 'নোটিফিকেশন ও অ্যালার্ট',
      description: 'এসএমএস, ইমেইল ও পুশ নোটিফিকেশন',
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb & Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>ড্যাশবোর্ডে ফিরে যান</span>
          </Link>
          <div className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">অন্যান্য সেটিংস (Other Settings)</span>
          </div>
        </div>

        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-2">
              <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              <span>সিস্টেম কন্ট্রোল সেন্টার ও সেটিংস</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              অন্যান্য সেটিংস (Other Settings)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ইউজার অ্যাকাউন্ট পারমিশন, হোমপেজ কন্টেন্ট এবং বিভিন্ন সিস্টেম কনফিগারেশন এখান থেকে পরিচালনা করুন।
            </p>
          </div>
        </div>

        {/* Two-Column Layout: Left Sidebar + Right Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2 sticky top-6">
            <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              সেটিংস মেনু তালিকা
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start justify-between gap-3 group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-snug">{item.label}</div>
                        <div
                          className={`text-[11px] truncate leading-tight mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Help / Info Card in Sidebar */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 px-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>সাহায্য প্রয়োজন?</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  বাম পাশের মেনু থেকে যেকোনো সেটিংসে ক্লিক করে ডান পাশের প্যানেলে সরাসরি কনফিগারেশন পরিবর্তন করতে পারবেন।
                </p>
              </div>
            </div>
          </div>

          {/* Right Content Area (8 cols on lg) */}
          <div className="lg:col-span-8 min-w-0">
            
            {/* TAB 1: USERS SETTINGS */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Section Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-bold border border-purple-200/80 dark:border-purple-800/60 mb-2">
                      <Shield className="w-3.5 h-3.5" /> Access Control & Roles
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" /> ব্যবহারকারী ও পারমিশন কন্ট্রোল
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      সকল অ্যাকাউন্টের তালিকা, রোলসমূহ এবং প্রতি জনের জন্য কাস্টম অতিরিক্ত পারমিশন কনফিগার করুন।
                    </p>
                  </div>

                  <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
                  >
                    <span>ফুল পেজে দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

                {/* Filter / Search Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        placeholder="নাম বা ইমেইল দিয়ে সার্চ করুন..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9.5 pr-3.5 py-2.5 w-60 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>

                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">সকল রোল (All Roles)</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher (শিক্ষক)</option>
                      <option value="student">Student (শিক্ষার্থী)</option>
                      <option value="guardian">Guardian (অভিভাবক)</option>
                      <option value="employee">Employee (স্টাফ)</option>
                    </select>

                    <Button size="sm" variant="secondary" onClick={fetchUsers}>
                      ফিল্টার
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>মোট একাউন্ট:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{users.length} জন</span>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                          <th className="py-3.5 px-5">ব্যবহারকারী</th>
                          <th className="py-3.5 px-4">রোল</th>
                          <th className="py-3.5 px-4">পারমিশন</th>
                          <th className="py-3.5 px-4">স্ট্যাটাস</th>
                          <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400">
                              ব্যবহারকারীদের তথ্য লোড হচ্ছে...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400">
                              কোনো ব্যবহারকারী পাওয়া যায়নি।
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => {
                            const extraCount = u.customPermissions?.length || 0;
                            return (
                              <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                {/* Name & Avatar */}
                                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                                      {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                      ) : (
                                        u.name.slice(0, 2).toUpperCase()
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {u.name}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                                        {u.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Role Badge */}
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg font-bold uppercase text-[10px] tracking-wider border ${
                                      u.role === 'superadmin'
                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                        : u.role === 'admin'
                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                        : u.role === 'teacher'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                                        : u.role === 'guardian'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                        : u.role === 'employee'
                                        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>

                                {/* Custom Permissions */}
                                <td className="py-3.5 px-4">
                                  {extraCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-semibold text-[10px]">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                      {extraCount} টি কাস্টম
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">ডিফল্ট</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold capitalize text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {u.status}
                                  </span>
                                </td>

                                {/* Actions Link */}
                                <td className="py-3.5 px-5 text-right">
                                  <Link
                                    href={`/admin/users/${u._id}/permissions`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800/60 transition-colors shadow-2xs group"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                    <span>রোল ও পারমিশন</span>
                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HOMEPAGE SETTINGS */}
            {activeTab === 'homepage' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        হোম পেজ সেটিংস (Homepage Content)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ওয়েবসাইটের মূল হোমপেজের টেক্সট, ব্যানার ও সেকশনগুলো কনফিগার করুন
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                    পরবর্তী ধাপে সংযুক্ত হবে
                  </span>
                </div>

                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    হোম পেজ কন্টেন্ট কন্ট্রোল প্যানেল
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    আপনার নির্দেশনামাফিক এখানে হোমপেজের প্রতিটি সেকশন (যেমন: হিরো ব্যানার, ফিচারের তালিকা, এফএকিউ এবং কল-টু-অ্যাকশন টেক্সট) এডিটের ফর্ম ও কন্ট্রোল প্রস্তুত রাখা হয়েছে। আপনার চাহিদা অনুযায়ী পরবর্তী ধাপে এটি কার্যকর করা হবে।
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      সাধারণ সেটিংস (General Settings)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ইনস্টিটিউটের নাম, যোগাযোগের তথ্য ও সিস্টেম সেটিংস
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 block mb-1">ইনস্টিটিউটের নাম</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">GravAcademy</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 block mb-1">সিস্টেম স্ট্যাটাস</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">অনলাইন ও সক্রিয়</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      নোটিফিকেশন ও অ্যালার্ট সেটিংস
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      শিক্ষার্থী ও অভিভাবকদের জন্য স্বয়ংক্রিয় নোটিফিকেশন কনফিগারেশন
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    সিস্টেমের লাইভ ক্লাস শুরু, ব্যাচ এনরোলমেন্ট ও পেমেন্ট রিসিট সম্পর্কিত অ্যালার্ট চালু রয়েছে।
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
