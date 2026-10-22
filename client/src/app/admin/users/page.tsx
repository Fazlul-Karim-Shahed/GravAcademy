'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  ALL_PERMISSIONS_METADATA,
  ROLE_DEFAULT_PERMISSIONS,
  PermissionDefinition,
  PermissionKey,
  UserRole,
  ROLES,
} from '@/lib/permissions';
import {
  ShieldAlert,
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Key,
  Users,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  X,
  Mail,
  Phone,
  Settings,
  Check,
  Info,
  BookOpen,
  Video,
  FileCheck2,
  FolderOpen,
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

  // Permission Configuration Modal
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [userCustomPermissions, setUserCustomPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  const handleOpenConfig = (u: UserRecord) => {
    setEditingUser(u);
    setNewRole(u.role as UserRole);
    setUserCustomPermissions(u.customPermissions || []);
    setActiveCategory('all');
  };

  const toggleCustomPermission = (permKey: string) => {
    setUserCustomPermissions((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter((p) => p !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.put(`/users/${editingUser._id}/role`, {
        role: newRole,
        customPermissions: userCustomPermissions,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `${editingUser.name} এর রোল (${newRole.toUpperCase()}) ও পারমিশন সফলভাবে আপডেট করা হয়েছে!`,
        });
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'পারমিশন আপডেট করতে ব্যর্থ হয়েছে।',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Group permissions by category
  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_PERMISSIONS_METADATA.map((p) => p.category)));
    return ['all', ...cats];
  }, []);

  const filteredPermissions = useMemo(() => {
    if (activeCategory === 'all') return ALL_PERMISSIONS_METADATA;
    return ALL_PERMISSIONS_METADATA.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  // Baseline permissions granted automatically by the currently selected role
  const roleDefaultPerms = useMemo(() => {
    return new Set(ROLE_DEFAULT_PERMISSIONS[newRole] || []);
  }, [newRole]);

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
              যেকোনো ব্যবহারকারীর রোল পরিবর্তন করুন এবং ডিফল্ট ফিচারের বাইরে অতিরিক্ত কাস্টম পারমিশন প্রদান করুন।
            </p>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs flex items-center gap-3 border shadow-xs transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

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

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenConfig(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800/60 transition-colors shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>রোল ও পারমিশন সেট</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FULL GRANULAR PERMISSION CONFIGURATION MODAL */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      রোল ও কাস্টম পারমিশন কনফিগারেশন
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ইউজার: <strong className="text-slate-900 dark:text-white">{editingUser.name}</strong> ({editingUser.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <form onSubmit={handleSavePermissions} className="flex-1 overflow-y-auto pr-1 space-y-6">
                
                {/* 1. Base Role Selection */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    বেসিক প্ল্যাটফর্ম রোল (Primary Base Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="student">Student (শিক্ষার্থী - সাধারণ লার্নিং অ্যাকাউন্ট)</option>
                    <option value="teacher">Teacher (শিক্ষক - ক্লাস নেওয়া ও সিলেবাস সাজানো)</option>
                    <option value="admin">Admin (অ্যাকাডেমিক এডমিনিস্ট্রেটর)</option>
                    <option value="guardian">Guardian (অভিভাবক - স্টুডেন্ট প্রগ্রেস ট্র্যাকার)</option>
                    <option value="employee">Employee (স্টাফ / সহায়তা কর্মী)</option>
                    {currentUser?.role === 'superadmin' && (
                      <option value="superadmin">Superadmin (পূর্ণ প্ল্যাটফর্ম অধিশীর্ষ ক্ষমতা)</option>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    নির্বাচিত রোলের ডিফল্ট পারমিশনগুলো অটোমেটিক সক্রিয় থাকে। আপনি নিচে থেকে চাইলে আরও বিশেষ ফিচার যোগ করতে পারবেন।
                  </p>
                </div>

                {/* 2. Granular Permission Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        ফিচারভিত্তিক কাস্টম পারমিশন (Granular Feature Permissions)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        সবুজ টিক = রোলের ডিফল্ট পারমিশন | নীল টিক = আপনার দেওয়া অতিরিক্ত পারমিশন
                      </p>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize shrink-0 transition-colors ${
                          activeCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat === 'all' ? 'সকল ফিচার' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Permissions List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredPermissions.map((perm) => {
                      const isDefaultByRole = roleDefaultPerms.has(perm.key);
                      const isGrantedCustom = userCustomPermissions.includes(perm.key);
                      const isEffective = isDefaultByRole || isGrantedCustom;

                      return (
                        <div
                          key={perm.key}
                          onClick={() => {
                            if (!isDefaultByRole) {
                              toggleCustomPermission(perm.key);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                            isDefaultByRole
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50 opacity-90 cursor-default'
                              : isGrantedCustom
                              ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 cursor-pointer shadow-xs'
                              : 'bg-white dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {perm.label}
                              </span>
                              {isDefaultByRole ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                                  ডিফল্ট রোল পারমিশন
                                </span>
                              ) : isGrantedCustom ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                                  + এক্সট্রা পারমিশন
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {perm.description}
                            </p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isDefaultByRole ? (
                              <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isGrantedCustom}
                                onChange={() => toggleCustomPermission(perm.key)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingUser(null)}>
                    বাতিল (Cancel)
                  </Button>
                  <Button type="submit" size="sm" isLoading={submitting}>
                    পারমিশন সেভ করুন
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
