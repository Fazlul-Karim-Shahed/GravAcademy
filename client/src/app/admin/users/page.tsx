'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import {
  Search,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
  Users,
  Sparkles,
  ArrowLeft,
  ChevronRight,
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

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedRole !== 'all') params.role = selectedRole;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" /> Access Control & RBAC
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" /> ব্যবহারকারী ও পারমিশন ম্যানেজমেন্ট
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ব্যবহারকারীদের অ্যাকাউন্টের রোল পরিবর্তন এবং ডেডিকেটেড পেজে অতিরিক্ত কাস্টম পারমিশন কনফিগার করুন।
            </p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="নাম বা ইমেইল দিয়ে সার্চ করুন..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9.5 pr-3.5 py-2.5 w-64 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
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
                  <th className="py-3.5 px-6">ইউজার প্রোফাইল</th>
                  <th className="py-3.5 px-6">বর্তমান রোল</th>
                  <th className="py-3.5 px-6">কাস্টম অতিরিক্ত পারমিশন</th>
                  <th className="py-3.5 px-6">স্ট্যাটাস</th>
                  <th className="py-3.5 px-6">যোগদানের তারিখ</th>
                  <th className="py-3.5 px-6 text-right">পারমিশন অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      অ্যাকাউন্ট লোড হচ্ছে...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      কোনো ব্যবহারকারী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const extraCount = u.customPermissions?.length || 0;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">{u.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] tracking-wider border ${
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

                        {/* Custom Extra Permissions */}
                        <td className="py-4 px-6">
                          {extraCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-semibold text-[11px]">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              {extraCount} টি অতিরিক্ত পারমিশন সক্রিয়
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">ডিফল্ট রোল পারমিশন</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold capitalize text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {u.status}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions - Dedicated Page Link */}
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/admin/users/${u._id}/permissions`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800/60 transition-colors shadow-2xs group"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>রোল ও পারমিশন সেট</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
    </div>
  );
}
