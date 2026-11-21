'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Key,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
  Sparkles,
  Info,
  Check,
  User,
  Mail,
  Calendar,
  Lock,
} from 'lucide-react';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  avatarUrl?: string;
  phone?: string;
  customPermissions: string[];
  revokedPermissions: string[];
  createdAt: string;
}

export default function UserPermissionsEditPage() {
  const params = useParams();
  const router = useRouter();
  const gravId = params?.id as string;
  const { user: currentUser } = useAuth();

  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [revokedPermissions, setRevokedPermissions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (gravId) {
      loadUserDetails();
    }
  }, [gravId]);

  const loadUserDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${gravId}`);
      if (res.data?.success && res.data.data) {
        const u: UserDetail = res.data.data;
        setTargetUser(u);
        setSelectedRole(u.role);
        setCustomPermissions(u.customPermissions || []);
        setRevokedPermissions(u.revokedPermissions || []);
      }
    } catch (err: any) {
      console.error('Failed to load user:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'ব্যবহারকারীর তথ্য লোড করতে সমস্যা হয়েছে।',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomPermission = (permKey: PermissionKey) => {
    if (selectedRole === ROLES.SUPERADMIN) return;
    if (roleDefaultPerms.has(permKey)) {
      setRevokedPermissions((previous) => previous.includes(permKey)
        ? previous.filter((permission) => permission !== permKey)
        : [...previous, permKey]);
      return;
    }
    setCustomPermissions((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter((p) => p !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await api.put(`/users/${gravId}/role`, {
        role: selectedRole,
        customPermissions: customPermissions,
        revokedPermissions,
      });

      if (res.data?.success) {
        setStatusMessage({
          type: 'success',
          text: `ব্যবহারকারীর রোল (${selectedRole.toUpperCase()}) ও পারমিশন সফলভাবে আপডেট ও সেভ হয়েছে!`,
        });
        setTimeout(() => {
          router.push('/admin/users');
        }, 1200);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'পারমিশন সেভ করতে ব্যর্থ হয়েছে।',
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
    return new Set(ROLE_DEFAULT_PERMISSIONS[selectedRole] || []);
  }, [selectedRole]);

  const getPermissionGranted = (permissionKey: PermissionKey) => (
    (roleDefaultPerms.has(permissionKey) && !revokedPermissions.includes(permissionKey))
    || customPermissions.includes(permissionKey)
  );

  const allPermissionsSelected = ALL_PERMISSIONS_METADATA.every((permission) => getPermissionGranted(permission.key));

  const setAllPermissionsSelected = (checked: boolean) => {
    if (selectedRole === ROLES.SUPERADMIN) return;
    if (checked) {
      setCustomPermissions(ALL_PERMISSIONS_METADATA
        .filter((permission) => !roleDefaultPerms.has(permission.key))
        .map((permission) => permission.key));
      setRevokedPermissions([]);
      return;
    }
    setCustomPermissions([]);
    setRevokedPermissions(Array.from(roleDefaultPerms));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border-2 border-orange-500/20 border-t-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            পারমিশন প্রোফাইল লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] py-16 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] rounded-3xl p-8 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">ব্যবহারকারী পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            এই আইডি সম্পন্ন কোনো অ্যাকাউন্ট ডাটাবেসে নেই বা মুছে ফেলা হয়েছে।
          </p>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1a202c] border border-slate-200 dark:border-[#262b34] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> সেটিংস তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ga-page min-h-screen py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="bg-white dark:bg-[#111318] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#262b34] shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md shadow-orange-950/20 overflow-hidden">
              {targetUser.avatarUrl ? (
                <img src={targetUser.avatarUrl} alt={targetUser.name} className="w-full h-full object-cover" />
              ) : (
                targetUser.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {targetUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {targetUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {targetUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {new Date(targetUser.createdAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">মোট সক্রিয় পারমিশন:</span>
            <span className="font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              {ALL_PERMISSIONS_METADATA.filter((permission) => getPermissionGranted(permission.key)).length} টি সক্রিয়
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs flex items-center gap-3 border shadow-xs transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Main Permissions Configuration Form */}
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* SECTION 1: Base Platform Role */}
          <div className="bg-white dark:bg-[#111318] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-[#262b34] shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#262b34]">
              <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                ১. প্রাইমারি প্ল্যাটফর্ম রোল (Primary Base Role)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { role: 'student', title: 'Student (শিক্ষার্থী)', desc: 'সাধারণ লার্নিং অ্যাকাউন্ট ও ক্লাস অ্যাক্সেস' },
                { role: 'teacher', title: 'Teacher (শিক্ষক)', desc: 'ক্লাস নেওয়া, পরীক্ষা ও সিলেবাস সাজানো' },
                { role: 'admin', title: 'Admin (অপারেশনাল এডমিন)', desc: 'কোর্স, ব্যাচ ও অ্যাকাডেমিক ম্যানেজমেন্ট' },
                { role: 'guardian', title: 'Guardian (অভিভাবক)', desc: 'সন্তানের উপস্থিতি ও ফলাফল পর্যবেক্ষণ' },
                { role: 'employee', title: 'Employee (স্টাফ)', desc: 'সহায়তা কর্মী ও হাজিরা অপারেটর' },
                ...(currentUser?.role === 'superadmin'
                  ? [{ role: 'superadmin', title: 'Superadmin (পূর্ণ ক্ষমতা)', desc: 'প্ল্যাটফর্মের সর্বময় অধিশীর্ষ ক্ষমতা' }]
                  : []),
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role as UserRole)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-500/10 dark:bg-orange-950/30 border-orange-500/60 dark:border-orange-500/50 text-orange-900 dark:text-orange-100 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#151921]/60 border-slate-200/80 dark:border-[#262b34] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{item.title}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-orange-600 bg-orange-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              নির্বাচিত রোলের ডিফল্ট পারমিশনগুলো তালিকা থেকে চালু বা বন্ধ করতে পারবেন। প্রয়োজন হলে অতিরিক্ত ফিচারও সক্রিয় করতে পারবেন।
            </p>
          </div>

          {/* SECTION 2: Granular Feature Matrix */}
          <div className="bg-white dark:bg-[#111318] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-[#262b34] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-[#262b34]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  ২. ফিচারভিত্তিক কাস্টম পারমিশন (Granular Permissions Overrides)
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ডিফল্ট রোল পারমিশন
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> অতিরিক্ত কাস্টম পারমিশন
                </span>
              </div>
            </div>

            <label className="mb-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/20 p-3">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                সব permission একসাথে চালু বা বন্ধ করুন
              </span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                <span>সব নির্বাচন</span>
                <input
                  type="checkbox"
                  checked={allPermissionsSelected}
                  disabled={selectedRole === ROLES.SUPERADMIN}
                  onChange={(event) => setAllPermissionsSelected(event.target.checked)}
                  className="h-4 w-4 rounded accent-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </span>
            </label>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize shrink-0 transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a202c]'
                  }`}
                >
                  {cat === 'all' ? 'সকল ফিচার ক্যাটাগরি' : cat}
                </button>
              ))}
            </div>

            {/* Permissions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPermissions.map((perm) => {
                const isDefaultByRole = roleDefaultPerms.has(perm.key);
                const isRevoked = revokedPermissions.includes(perm.key);
                const isGrantedCustom = customPermissions.includes(perm.key);
                const isGranted = getPermissionGranted(perm.key);

                return (
                  <div
                    key={perm.key}
                    onClick={() => toggleCustomPermission(perm.key)}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isRevoked
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60 cursor-pointer'
                        : isGranted
                        ? 'bg-orange-50/70 dark:bg-orange-950/25 border-orange-400/60 dark:border-orange-500/40 cursor-pointer shadow-xs'
                        : 'bg-slate-50/50 dark:bg-[#151921]/40 border-slate-200/80 dark:border-[#262b34] hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {perm.label}
                        </span>
                        {isRevoked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                            ডিফল্ট বন্ধ
                          </span>
                        ) : isDefaultByRole ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            ডিফল্ট রোল পারমিশন
                          </span>
                        ) : isGrantedCustom ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200">
                            + অতিরিক্ত পারমিশন
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {perm.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={isGranted}
                        disabled={selectedRole === ROLES.SUPERADMIN}
                        onChange={() => toggleCustomPermission(perm.key)}
                        onClick={(event) => event.stopPropagation()}
                        className="w-4 h-4 rounded accent-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Footer Bar with Save Button */}
          <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#262b34] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{targetUser.name}</span> এর জন্য পারমিশন সেভ করতে প্রস্তুত।
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link href="/admin/settings" className="flex-1 sm:flex-none">
                <button
                  type="button"
                  className="w-full px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#151921] transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'সংরক্ষণ করা হচ্ছে...' : 'রোল ও পারমিশন সেভ করুন'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
