'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import { FormPageHeader, FormSectionNav, FormSection } from '@/components/ui';
import {
  DASHBOARD_PERMISSION_METADATA,
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  PermissionDefinition,
  PermissionKey,
  UserRole,
  ROLES,
} from '@/lib/permissions';
import { DASHBOARD_PERMISSION_DETAILS } from '@/lib/permissionDetails';
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
  Save,
  X,
  CircleCheck,
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
  const { user } = useAuth();
  const base = user?.role === 'employee' ? '/employee/users' : '/admin/users';
  const gravId = params?.id as string;

  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [revokedPermissions, setRevokedPermissions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detailPermission, setDetailPermission] = useState<PermissionDefinition | null>(null);

  useEffect(() => {
    if (gravId) {
      loadUserDetails();
    }
  }, [gravId]);

  useEffect(() => {
    if (!detailPermission) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailPermission(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [detailPermission]);

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
    const bundledClassroomKeys: PermissionKey[] = [
      PERMISSIONS.EXAMS_MANAGE,
      PERMISSIONS.EXAMS_EVALUATE,
      PERMISSIONS.ASSIGNMENTS_MANAGE,
      PERMISSIONS.RESULTS_VIEW_ALL,
    ];
    if (permKey === PERMISSIONS.EXAMS_MANAGE) {
      const enabling = !(
        (roleDefaultPerms.has(PERMISSIONS.EXAMS_MANAGE) && !revokedPermissions.includes(PERMISSIONS.EXAMS_MANAGE)) ||
        customPermissions.includes(PERMISSIONS.EXAMS_MANAGE)
      );
      if (enabling) {
        setRevokedPermissions((prev) => prev.filter((p) => !bundledClassroomKeys.includes(p as PermissionKey)));
        setCustomPermissions((prev) => Array.from(new Set([...prev, ...bundledClassroomKeys.filter((k) => !roleDefaultPerms.has(k))])));
      } else {
        setCustomPermissions((prev) => prev.filter((p) => !bundledClassroomKeys.includes(p as PermissionKey)));
        setRevokedPermissions((prev) => Array.from(new Set([...prev, ...bundledClassroomKeys.filter((k) => roleDefaultPerms.has(k))])));
      }
      return;
    }
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
        setTargetUser((prev) =>
          prev
            ? {
                ...prev,
                role: selectedRole,
                customPermissions,
                revokedPermissions,
              }
            : prev
        );
        setStatusMessage({
          type: 'success',
          text: `ব্যবহারকারীর রোল (${selectedRole.toUpperCase()}) ও পারমিশন সফলভাবে সংরক্ষণ করা হয়েছে!`,
        });
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
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

  // Each group is one visible Admin Dashboard card, never a technical subcategory.
  const categories = useMemo(() => {
    const cats = Array.from(new Set(DASHBOARD_PERMISSION_METADATA.map((p) => p.category)));
    return ['all', ...cats];
  }, []);

  const filteredPermissions = useMemo(() => {
    if (activeCategory === 'all') return DASHBOARD_PERMISSION_METADATA;
    return DASHBOARD_PERMISSION_METADATA.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  // These are intentionally the same groups as the visible Admin Dashboard
  // cards.  There is no separate technical permission category in this picker.
  const visiblePermissionGroups = useMemo(() => {
    if (activeCategory !== 'all') {
      return [{ category: activeCategory, permissions: filteredPermissions }];
    }

    return categories
      .filter((category) => category !== 'all')
      .map((category) => ({
        category,
        permissions: DASHBOARD_PERMISSION_METADATA.filter((permission) => permission.category === category),
      }));
  }, [activeCategory, categories, filteredPermissions]);

  // Baseline permissions granted automatically by the currently selected role
  const roleDefaultPerms = useMemo(() => {
    return new Set(ROLE_DEFAULT_PERMISSIONS[selectedRole] || []);
  }, [selectedRole]);

  const getPermissionGranted = (permissionKey: PermissionKey) => (
    !revokedPermissions.includes(permissionKey)
    && (roleDefaultPerms.has(permissionKey) || customPermissions.includes(permissionKey))
  );

  const allPermissionsSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((permission) => getPermissionGranted(permission.key));

  const setAllPermissionsSelected = (checked: boolean) => {
    if (selectedRole === ROLES.SUPERADMIN) return;
    const bundledClassroomKeys: PermissionKey[] = [
      PERMISSIONS.EXAMS_MANAGE,
      PERMISSIONS.EXAMS_EVALUATE,
      PERMISSIONS.ASSIGNMENTS_MANAGE,
      PERMISSIONS.RESULTS_VIEW_ALL,
    ];
    const targetKeys = new Set<PermissionKey>(filteredPermissions.map((permission) => permission.key));
    if (targetKeys.has(PERMISSIONS.EXAMS_MANAGE)) {
      bundledClassroomKeys.forEach((key) => targetKeys.add(key));
    }

    if (checked) {
      setRevokedPermissions((prev) => prev.filter((key) => !targetKeys.has(key as PermissionKey)));
      setCustomPermissions((prev) => Array.from(new Set([
        ...prev,
        ...Array.from(targetKeys).filter((key) => !roleDefaultPerms.has(key)),
      ])));
      return;
    }

    setCustomPermissions((prev) => prev.filter((key) => !targetKeys.has(key as PermissionKey)));
    setRevokedPermissions((prev) => Array.from(new Set([
      ...prev,
      ...Array.from(targetKeys).filter((key) => roleDefaultPerms.has(key)),
    ])));
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

  if (!targetUser || (user?.role === 'employee' && targetUser.role !== 'employee')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] py-16 flex items-center justify-center p-4">
        <div className="ga-card max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">ব্যবহারকারী পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            এই আইডি সম্পন্ন কোনো অ্যাকাউন্ট ডাটাবেসে নেই বা মুছে ফেলা হয়েছে।
          </p>
          <Link
            href={base}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1a202c] border border-slate-200 dark:border-[#262b34] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> ইউজার তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-[#0b0d12] dark:text-white sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FormPageHeader
          backHref={base}
          backLabel="Users"
          eyebrow="Access control"
          title={`${targetUser.name} - রোল ও পারমিশন`}
          description="Admin Dashboard-এর প্রতিটি কার্ডে দেখা যায় এমন কাজ অনুযায়ী access দিন।"
          badge={
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              {targetUser.role}
            </span>
          }
        />

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-xs shadow-xs transition-all ${
              statusMessage.type === 'success'
                ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <FormSectionNav
            heading="Permission sections"
            items={[
              { id: 'role', label: 'Primary role' },
              { id: 'granular', label: 'Dashboard access' },
            ]}
          />

          <div className="min-w-0 bg-transparent sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white dark:bg-transparent dark:sm:border-[#262b34] dark:sm:bg-[#111318]">
            {/* SECTION 1: Base Platform Role */}
            <FormSection
              id="role"
              icon={<Shield className="h-4 w-4" />}
              title="প্রাইমারি প্ল্যাটফর্ম রোল (Primary Base Role)"
              description="ব্যবহারকারীর মূল ভূমিকা নির্ধারণ করুন। এর ভিত্তিতে ডিফল্ট পারমিশন স্বয়ংক্রিয়ভাবে কার্যকর হবে।"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { role: 'student', title: 'Student (শিক্ষার্থী)', desc: 'সাধারণ লার্নিং অ্যাকাউন্ট ও ক্লাস অ্যাক্সেস' },
                  { role: 'teacher', title: 'Teacher (শিক্ষক)', desc: 'ক্লাস নেওয়া, পরীক্ষা ও সিলেবাস সাজানো' },
                  { role: 'admin', title: 'Admin (অপারেশনাল এডমিন)', desc: 'কোর্স, ব্যাচ ও অ্যাকাডেমিক ম্যানেজমেন্ট' },
                  { role: 'guardian', title: 'Guardian (অভিভাবক)', desc: 'সন্তানের উপস্থিতি ও ফলাফল পর্যবেক্ষণ' },
                  { role: 'employee', title: 'Employee (স্টাফ)', desc: 'সহায়তা কর্মী ও হাজিরা অপারেটর' },
                ].filter((item) => user?.role !== 'employee' || item.role === 'employee').map((item) => {
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
            </FormSection>

            {/* SECTION 2: Granular Feature Matrix */}
            <FormSection
              id="granular"
              icon={<Key className="h-4 w-4" />}
              title="Dashboard কার্ড অনুযায়ী Access"
              description="প্রতিটি tab একটি Admin Dashboard card। ভেতরে শুধু ওই card-এ দেখা যায় এমন কাজগুলো আছে।"
            >
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ডিফল্ট রোল পারমিশন
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> অতিরিক্ত কাস্টম পারমিশন
                </span>
              </div>

              <label className="mb-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/20 p-3">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {activeCategory === 'all'
                    ? 'সব Dashboard কার্ডের permission একসাথে চালু বা বন্ধ করুন'
                    : `${activeCategory}-এর সব permission একসাথে চালু বা বন্ধ করুন`}
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

              {/* Each choice below represents one Admin Dashboard card. */}
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'border-orange-600 bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-sm shadow-orange-950/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:border-[#262b34] dark:bg-[#151921] dark:text-slate-200 dark:hover:border-orange-700 dark:hover:bg-orange-950/20'
                    }`}
                  >
                    <span className="block truncate">{cat === 'all' ? 'সব Dashboard কার্ড' : cat}</span>
                    {cat !== 'all' && (
                      <span className={`mt-1 block text-[10px] font-medium ${activeCategory === cat ? 'text-orange-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {DASHBOARD_PERMISSION_METADATA.filter((permission) => permission.category === cat).length}টি কাজ
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Permission rows stay directly under their dashboard card. */}
              <div className="space-y-4">
                {visiblePermissionGroups.map(({ category, permissions }) => (
                  <section key={category} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#262b34] dark:bg-[#111318]">
                    {activeCategory === 'all' && (
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-[#262b34] dark:bg-[#151921]">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{category}</h3>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Dashboard card</span>
                      </div>
                    )}
                    {permissions.map((perm) => {
                  const isDefaultByRole = roleDefaultPerms.has(perm.key);
                  const isRevoked = revokedPermissions.includes(perm.key);
                  const isGrantedCustom = customPermissions.includes(perm.key);
                  const isGranted = getPermissionGranted(perm.key);

                  return (
                    <div
                      key={perm.key}
                      onClick={() => toggleCustomPermission(perm.key)}
                      className={`flex items-start justify-between gap-3 border-b border-slate-100 p-4 transition-colors last:border-b-0 dark:border-[#262b34] ${
                        isRevoked
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 cursor-pointer'
                          : isGranted
                          ? 'bg-orange-50/70 dark:bg-orange-950/25 cursor-pointer'
                          : 'hover:bg-slate-50 dark:hover:bg-[#151921] cursor-pointer'
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
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailPermission(perm);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-[#303640] dark:bg-[#151921] dark:text-slate-300 dark:hover:border-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-300"
                          aria-label={`${perm.label} পারমিশনের বিস্তারিত দেখুন`}
                        >
                          <Info className="h-3.5 w-3.5" />
                          বিস্তারিত
                        </button>
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
                  </section>
                ))}
              </div>
            </FormSection>

            <div className="ga-sticky-action-bar m-4 sm:m-5">
              <div className="flex items-center gap-2">
                <Link
                  href={base}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#262b34] dark:text-slate-200 dark:hover:bg-[#1a202c]"
                >
                  বাতিল (Cancel)
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'সংরক্ষণ করা হচ্ছে...' : 'রোল ও পারমিশন সেভ করুন'}
                </button>
              </div>
            </div>
          </div>

        </form>

        {detailPermission && (() => {
          const details = DASHBOARD_PERMISSION_DETAILS[detailPermission.key];
          return (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="permission-detail-title"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setDetailPermission(null);
              }}
            >
              <section className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#303640] dark:bg-[#111318]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-[#262b34] dark:bg-[#151921] sm:px-6">
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                      {detailPermission.category}
                    </span>
                    <h2 id="permission-detail-title" className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                      {detailPermission.label}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailPermission(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-[#303640] dark:bg-[#111318] dark:text-slate-400 dark:hover:bg-[#20252e] dark:hover:text-white"
                    aria-label="বিস্তারিত বন্ধ করুন"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-4 py-5 sm:px-6">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {details?.summary || detailPermission.description}
                  </p>

                  <div className="mt-5">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">এই পারমিশন দিলে যা হবে</h3>
                    <ul className="mt-3 space-y-2.5">
                      {(details?.grants || [detailPermission.description]).map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-5 text-slate-600 dark:text-slate-300">
                          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {details?.note && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/25">
                      <div className="flex items-start gap-2.5">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                        <div>
                          <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">মনে রাখুন</p>
                          <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">{details.note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-[#262b34] dark:bg-[#151921] sm:px-6">
                  <button
                    type="button"
                    onClick={() => setDetailPermission(null)}
                    className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    বুঝেছি
                  </button>
                </div>
              </section>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
