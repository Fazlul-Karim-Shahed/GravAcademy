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
  Shield,
  Key,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  avatarUrl?: string;
}

type TabType = 'users' | 'homepage' | 'general' | 'notifications';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Users state
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ইউজার একাউন্ট ও সিস্টেম কনফিগারেশন
              </p>
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
                      সিস্টেমের মোট {users.length} জন ব্যবহারকারী
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
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        placeholder="নাম বা ইমেইল..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-2 w-44 sm:w-52 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
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

                {/* Users List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase text-[11px]">
                        <th className="py-3 px-4">ইউজার</th>
                        <th className="py-3 px-3">রোল</th>
                        <th className="py-3 px-3">স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400">
                            লোড হচ্ছে...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400">
                            কোনো অ্যাকাউন্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            {/* User Avatar + Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0 overflow-hidden">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                  ) : (
                                    u.name.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                                </div>
                              </div>
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  সাধারণ সেটিংস
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">প্ল্যাটফর্মের নাম</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">GravAcademy</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">সার্ভার স্ট্যাটাস</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">সক্রিয় (Active)</span>
                  </div>
                </div>
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
