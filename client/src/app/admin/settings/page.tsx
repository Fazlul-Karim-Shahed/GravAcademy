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
  MessageCircle,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Shield,
  Key,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { SiteLogo } from '@/components/common/SiteLogo';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { DriveFileUpload, DriveFileUploadHandle } from '@/components/ui/DriveFileUpload';
import { formatDriveImageUrl } from '@/lib/drive';
import { CheckCircle2, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  HeroCardItem,
  DEFAULT_HERO_CARDS,
  HERO_COLOR_SCHEMES,
  HERO_ICONS,
  getHeroCardStyles,
  HeroCardIcon,
} from '@/lib/heroCards';
import { InstructorCard, DEFAULT_INSTRUCTOR_CARDS } from '@/lib/instructorCards';

interface UserRecord {
  _id: string;
  gravId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  avatarUrl?: string;
}

type TabType = 'users' | 'homepage' | 'general' | 'notifications';
type WhatsAppStatus = { state: 'starting' | 'qr' | 'ready' | 'disconnected' | 'error'; qrImage: string | null; lastError: string | null };

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings, loading: loadingSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null);
  const [messageRecipient, setMessageRecipient] = useState<UserRecord | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState('');
  const [disconnectingWhatsApp, setDisconnectingWhatsApp] = useState(false);
  const [checkingWhatsApp, setCheckingWhatsApp] = useState(false);

  const checkWhatsAppStatus = async () => {
    setCheckingWhatsApp(true);
    try {
      const response = await api.get('/whatsapp/status');
      setWhatsAppStatus(response.data.data);
    } catch {
      setWhatsAppStatus({ state: 'error', qrImage: null, lastError: 'স্ট্যাটাস লোড করা যায়নি' });
    } finally {
      setCheckingWhatsApp(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!window.confirm('বর্তমান WhatsApp account disconnect করবেন? এরপর নতুন account connect করতে QR scan করতে হবে।')) return;
    setDisconnectingWhatsApp(true);
    try {
      await api.post('/whatsapp/disconnect');
      setWhatsAppFeedback('WhatsApp account disconnect হয়েছে। নতুন account connect করতে QR scan করুন।');
      setWhatsAppStatus({ state: 'disconnected', qrImage: null, lastError: null });
    } catch (error: any) {
      setWhatsAppFeedback(error.response?.data?.message || 'WhatsApp disconnect করা যায়নি।');
    } finally {
      setDisconnectingWhatsApp(false);
    }
  };

  const sendStudentWhatsApp = async () => {
    if (!messageRecipient || !whatsAppMessage.trim()) return;
    setSendingWhatsApp(true);
    setWhatsAppFeedback('');
    try {
      await api.post(`/whatsapp/users/${messageRecipient._id}/send`, { message: whatsAppMessage.trim() });
      setWhatsAppFeedback('মেসেজটি WhatsApp গ্রহণ করেছে।');
      setWhatsAppMessage('');
    } catch (error: any) {
      setWhatsAppFeedback(error.response?.data?.message || 'মেসেজ পাঠানো যায়নি।');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'notifications' || !['admin', 'superadmin'].includes(user?.role || '')) return;
    let active = true;
    const refresh = async () => { if (active) await checkWhatsAppStatus(); };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [activeTab, user?.role]);

  // Site Settings state
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [siteName, setSiteName] = useState(settings.siteName || '');
  const [siteTagline, setSiteTagline] = useState(settings.siteTagline || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const logoUploadRef = React.useRef<DriveFileUploadHandle>(null);

  // Hero Cards state
  const [heroCards, setHeroCards] = useState<HeroCardItem[]>(DEFAULT_HERO_CARDS);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);
  const [featuredCourseIds, setFeaturedCourseIds] = useState<string[]>([]);
  const [instructorCards, setInstructorCards] = useState<InstructorCard[]>(DEFAULT_INSTRUCTOR_CARDS);
  const [savingHeroCards, setSavingHeroCards] = useState(false);
  const [heroCardsSaveSuccess, setHeroCardsSaveSuccess] = useState(false);
  const [heroCardsSaveError, setHeroCardsSaveError] = useState('');

  const updateHeroCardField = (index: number, field: keyof HeroCardItem, value: any) => {
    setHeroCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveHeroCards = async () => {
    setSavingHeroCards(true);
    setHeroCardsSaveSuccess(false);
    setHeroCardsSaveError('');
    try {
      const ok = await updateSettings({ heroCards, featuredCourseIds: featuredCourseIds.slice(0, 4), instructorCards: instructorCards.slice(0, 4) });
      if (ok) {
        setHeroCardsSaveSuccess(true);
        setTimeout(() => setHeroCardsSaveSuccess(false), 3500);
      } else {
        setHeroCardsSaveError('সেটিংস সংরক্ষণ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setHeroCardsSaveError(err?.response?.data?.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setSavingHeroCards(false);
    }
  };

  const handleResetHeroCards = () => {
    if (window.confirm('আপনি কি হিরো সেকশনের ৬টি কার্ডের তথ্য ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      setHeroCards(DEFAULT_HERO_CARDS);
    }
  };

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl || '');
      setSiteName(settings.siteName || 'Grav Academy');
      setSiteTagline(settings.siteTagline || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার');
      if (settings.heroCards && Array.isArray(settings.heroCards) && settings.heroCards.length > 0) {
        setHeroCards(settings.heroCards);
      } else {
        setHeroCards(DEFAULT_HERO_CARDS);
      }
      setFeaturedCourseIds(Array.isArray(settings.featuredCourseIds) ? settings.featuredCourseIds.slice(0, 4) : []);
      setInstructorCards(Array.isArray(settings.instructorCards) && settings.instructorCards.length >= 4 ? settings.instructorCards.slice(0, 4) : DEFAULT_INSTRUCTOR_CARDS);
    }
  }, [settings]);

  useEffect(() => {
    if (activeTab !== 'homepage') return;
    api.get('/courses', { params: { isPublished: true } }).then((res) => {
      if (res.data?.success) setPopularCourses(res.data.data || []);
    }).catch(() => setPopularCourses([]));
  }, [activeTab]);

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      let nextLogoUrl = logoUrl;
      if (logoUploadRef.current?.hasPendingFile()) {
        const uploadedUrl = await logoUploadRef.current.uploadSelectedFile();
        if (!uploadedUrl) {
          setSaveError('লোগো আপলোড করা যায়নি। আবার চেষ্টা করুন।');
          return;
        }
        nextLogoUrl = uploadedUrl;
      }
      const ok = await updateSettings({
        logoUrl: nextLogoUrl,
        siteName,
        siteTagline,
      });
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError('এই পরিবর্তনটি শুধু Superadmin সংরক্ষণ করতে পারবেন।');
      }
    } catch (err) {
      console.error(err);
      setSaveError('সেটিংস সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
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
    ...(user?.role === 'superadmin' ? [{ id: 'general' as TabType, label: 'সাধারণ সেটিংস', icon: Sliders }] : []),
    { id: 'notifications' as TabType, label: 'নোটিফিকেশন', icon: Bell },
  ];

  return (
    <div className="ga-page min-h-screen py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-[#262b34]">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] flex items-center justify-center text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-500/40 transition-colors"
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
          <div className="lg:col-span-3 bg-white dark:bg-[#111318] rounded-2xl p-2 border border-slate-200/90 dark:border-[#262b34] shadow-2xs space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md shadow-orange-950/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#151921] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#151921] text-slate-500'
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
              <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/90 dark:border-[#262b34] shadow-2xs overflow-hidden">
                {/* Panel Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#262b34] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        className="bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-2 w-44 sm:w-52 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
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
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#262b34]">
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
                              <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold block">
                                Grav ID: {u.gravId || '—'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] shrink-0 ${
                              u.role === 'admin' || u.role === 'superadmin'
                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                : u.role === 'teacher'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-[#151921] dark:text-slate-400'
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
                          <div className="flex items-center gap-2">
                          {u.role === 'student' && <button type="button" disabled={!u.phone} onClick={() => { setMessageRecipient(u); setWhatsAppFeedback(''); }} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 disabled:opacity-40 dark:bg-emerald-950/50 dark:text-emerald-300"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>}
                          <Link
                            href={`/admin/users/${u._id}/permissions`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 dark:bg-[#151921] dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition-colors"
                          >
                            <Key className="w-3.5 h-3.5 text-orange-500" />
                            <span>পারমিশন</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Users List Table (Desktop: hidden on mobile) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#262b34] bg-slate-50/50 dark:bg-[#151921]/60 text-slate-400 font-semibold uppercase text-[11px]">
                        <th className="py-3 px-4">ইউজার</th>
                        <th className="py-3 px-4">Grav ID</th>
                        <th className="py-3 px-3">রোল</th>
                        <th className="py-3 px-3">স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#262b34]">
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
                          <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-[#151921]/40 transition-colors">
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

                            {/* Grav ID Column */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-xs px-2 py-1 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/20 select-all">
                                {u.gravId || '—'}
                              </span>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                  u.role === 'admin' || u.role === 'superadmin'
                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                    : u.role === 'teacher'
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-[#151921] dark:text-slate-400'
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
                              {u.role === 'student' && <button type="button" disabled={!u.phone} onClick={() => { setMessageRecipient(u); setWhatsAppFeedback(''); }} className="mr-2 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 disabled:opacity-40 dark:bg-emerald-950/50 dark:text-emerald-300"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>}
                              <Link
                                href={`/admin/users/${u._id}/permissions`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 dark:bg-[#151921] dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-semibold text-xs transition-colors"
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
                  <div className="p-3.5 px-4 bg-slate-50/60 dark:bg-[#151921]/40 border-t border-slate-100 dark:border-[#262b34] flex items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 dark:text-slate-400">
                      পৃষ্ঠা <span className="font-bold text-orange-600 dark:text-orange-400">{page}</span> / {totalPages}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || loadingUsers}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1a202c] transition-colors"
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
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                    page === pNum
                                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xs'
                                      : 'hover:bg-slate-200 dark:hover:bg-[#151921] text-slate-600 dark:text-slate-400'
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1a202c] transition-colors"
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
              <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white dark:bg-[#111318] rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#262b34] shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            হিরো সেকশন কার্ড কাস্টমাইজেশন (৬টি কার্ড)
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ওয়েবসাইটের মূল হোমপেজের হিরো সেকশনে প্রদর্শিত ৬টি ৩ডি গ্লসি কার্ডের প্রতিটি ফিল্ড, লিংক, আইকন ও কালার থিম এখান থেকে সম্পূর্ণ নিয়ন্ত্রণ করুন।
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleResetHeroCards}
                        disabled={savingHeroCards}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#262b34] bg-slate-50 hover:bg-slate-100 dark:bg-[#151921] dark:hover:bg-[#1a202c] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ডিফল্টে রিসেট</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveHeroCards}
                        disabled={savingHeroCards}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-950/20 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {savingHeroCards ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{savingHeroCards ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                      </button>
                    </div>
                  </div>

                  {heroCardsSaveSuccess && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>হিরো সেকশনের ৬টি কার্ড সফলভাবে আপডেট হয়েছে এবং হোমপেজে কার্যকর হয়েছে!</span>
                    </div>
                  )}

                  {heroCardsSaveError && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      {heroCardsSaveError}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-[#111318] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#262b34] shadow-2xs">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div><h3 className="text-base font-black text-slate-900 dark:text-white">জনপ্রিয় কোর্স নির্বাচন</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">হোমপেজে সর্বোচ্চ ৪টি কোর্স দেখানো হবে।</p></div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">{featuredCourseIds.length}/৪</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {popularCourses.map((course) => {
                      const selected = featuredCourseIds.includes(course._id);
                      return <label key={course._id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${selected ? 'border-orange-400 bg-orange-50/70 dark:border-orange-500/60 dark:bg-orange-950/20' : 'border-slate-200 dark:border-[#262b34]'}`}><input type="checkbox" checked={selected} disabled={!selected && featuredCourseIds.length >= 4} onChange={() => setFeaturedCourseIds((prev) => selected ? prev.filter((id) => id !== course._id) : [...prev, course._id].slice(0, 4))} className="h-4 w-4 accent-orange-600" /><span className="font-semibold text-slate-700 dark:text-slate-200">{course.title}</span></label>;
                    })}
                  </div>
                </div>

                {/* 6 Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {heroCards.map((card, index) => {
                    const cardStyles = getHeroCardStyles(card.colorScheme);
                    const presetLinks = [
                      { label: 'HSC ২৬', url: '/courses?class=Class%2012' },
                      { label: 'HSC ২৭', url: '/courses?class=Class%2011' },
                      { label: 'SSC ২৭', url: '/courses?class=Class%2010' },
                      { label: '৯ম শ্রেণি', url: '/courses?class=Class%209' },
                      { label: '৬ষ্ঠ-৮ম', url: '/courses?class=Class%208' },
                      { label: 'সকল কোর্স', url: '/courses' },
                      { label: 'সকল ক্লাস', url: '/classes' },
                      { label: 'ফ্রি ক্লাস', url: '/free-classes' },
                      { label: 'ভর্তি ফরম', url: '/admissions' },
                    ];

                    return (
                      <div
                        key={card.id || index}
                        className="bg-white dark:bg-[#111318] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#262b34] shadow-2xs space-y-5 flex flex-col justify-between"
                      >
                        {/* Card Header & Live Mini Preview */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#262b34]">
                          <div className="space-y-1 text-center sm:text-left">
                            <div className="inline-flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
                                {index + 1}
                              </span>
                              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                কার্ড {index + 1}: {card.title || 'শিরোনামহীন'}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              হোমপেজের {index + 1}ম কার্ডের রিয়েল-টাইম প্রিভিউ ডানপাশে প্রদর্শিত হচ্ছে।
                            </p>
                          </div>

                          {/* Mini Realistic Glossy Card Preview */}
                          <div className="shrink-0 flex flex-col items-center">
                            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              লাইভ প্রিভিউ
                            </div>
                            <div className="w-[105px] p-2 rounded-[24px] glossy-glass-card aspect-[1/1.12] flex flex-col items-center justify-between border-2 border-slate-700/30 overflow-hidden relative shadow-sm">
                              <div className={`w-full h-full rounded-[18px] ${cardStyles.bubbleBg} p-2 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30`}>
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[18px] pointer-events-none" />
                                <div className="absolute -right-2 -bottom-2 pointer-events-none opacity-30 transform rotate-[-18deg]">
                                  <HeroCardIcon name={card.icon} className="w-10 h-10 text-white" />
                                </div>
                                <span className={`text-[8px] font-black tracking-widest ${cardStyles.categoryText} uppercase drop-shadow-md z-10`}>
                                  {card.category || '—'}
                                </span>
                                <div className="text-xl font-black text-white flex items-center justify-center drop-shadow-lg z-10">
                                  <span>{card.mainText || '—'}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold text-slate-100 mt-1.5 tracking-wide text-center truncate max-w-full px-0.5 z-10">
                                {card.title || '—'}
                              </span>
                            </div>
                            <div className={`mt-1.5 px-2 py-0.5 rounded-full ${cardStyles.badge} text-white text-[8px] font-black shadow-xs whitespace-nowrap text-center max-w-[110px] truncate`}>
                              {card.badge || '—'}
                            </div>
                          </div>
                        </div>

                        {/* Card Form Inputs */}
                        <div className="space-y-4">
                          {/* Row 1: Category & MainText */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                ক্যাটাগরি ট্যাগ (Category)
                              </label>
                              <input
                                type="text"
                                value={card.category || ''}
                                onChange={(e) => updateHeroCardField(index, 'category', e.target.value)}
                                placeholder="যেমন: HSC, SSC, CLASS"
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                মূল সংখ্যা / লেখা (Main Text)
                              </label>
                              <input
                                type="text"
                                value={card.mainText || ''}
                                onChange={(e) => updateHeroCardField(index, 'mainText', e.target.value)}
                                placeholder="যেমন: ২৬, ২৭, ৯, ৬-৮"
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-black"
                              />
                            </div>
                          </div>

                          {/* Row 2: Title & Badge */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                কার্ডের টাইটেল (Title)
                              </label>
                              <input
                                type="text"
                                value={card.title || ''}
                                onChange={(e) => updateHeroCardField(index, 'title', e.target.value)}
                                placeholder="যেমন: HSC ২৬, ৯ম শ্রেণি"
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                নিচের পিল ব্যাজ (Badge)
                              </label>
                              <input
                                type="text"
                                value={card.badge || ''}
                                onChange={(e) => updateHeroCardField(index, 'badge', e.target.value)}
                                placeholder="যেমন: ভার্সিটি ও ইঞ্জি."
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-semibold"
                              />
                            </div>
                          </div>

                          {/* Destination Link URL */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              গন্তব্য লিংক URL (ক্লিক করলে যেখানে যাবে)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={card.link || ''}
                                onChange={(e) => updateHeroCardField(index, 'link', e.target.value)}
                                placeholder="যেমন: /courses?class=Class%2012 বা /classes বা https://..."
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-mono"
                              />
                            </div>

                            {/* Preset pills for fast link selection */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mr-1">
                                দ্রুত লিংক দিন:
                              </span>
                              {presetLinks.map((preset) => (
                                <button
                                  key={preset.url}
                                  type="button"
                                  onClick={() => updateHeroCardField(index, 'link', preset.url)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                    card.link === preset.url
                                      ? 'bg-orange-500 text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Row 4: Icon & Color Theme */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                ব্যাকগ্রাউন্ড আইকন (Icon)
                              </label>
                              <select
                                value={card.icon || 'Trophy'}
                                onChange={(e) => updateHeroCardField(index, 'icon', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-semibold"
                              >
                                {HERO_ICONS.map((ic) => (
                                  <option key={ic.id} value={ic.id}>
                                    {ic.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                কালার স্কিম (Color Theme)
                              </label>
                              <select
                                value={card.colorScheme || 'sky'}
                                onChange={(e) => updateHeroCardField(index, 'colorScheme', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] text-slate-900 dark:text-white focus:outline-hidden focus:border-orange-500 font-semibold"
                              >
                                {HERO_COLOR_SCHEMES.map((sch) => (
                                  <option key={sch.id} value={sch.id}>
                                    {sch.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Open in new tab toggle */}
                          <div className="pt-1 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!card.openInNewTab}
                                onChange={(e) => updateHeroCardField(index, 'openInNewTab', e.target.checked)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                ক্লিক করলে নতুন ট্যাবে খুলবে (Open link in new tab)
                              </span>
                            </label>

                            {card.link && (
                              <a
                                href={card.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                              >
                                <span>টেস্ট লিংক</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white dark:bg-[#111318] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-[#262b34] shadow-2xs">
                  <div className="mb-5">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">মেন্টর কার্ড</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">হোমপেজের “যাদের সান্নিধ্যে তোমার স্বপ্নপূরণ” অংশের চারটি কার্ড সম্পাদনা করুন।</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {instructorCards.map((card, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 dark:border-[#262b34] p-4 space-y-3">
                        <div className="flex items-center justify-between"><span className="text-xs font-black text-slate-700 dark:text-slate-200">কার্ড {index + 1}</span><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {([
                            ['name', 'নাম'], ['institution', 'প্রতিষ্ঠান'], ['department', 'বিভাগ'], ['exp', 'অভিজ্ঞতা'],
                            ['badge', 'ব্যাজ'], ['studentsCount', 'শিক্ষার্থী সংখ্যা'], ['classesCount', 'ক্লাস সংখ্যা'], ['photo', 'ছবির URL'],
                          ] as const).map(([field, label]) => (
                            <label key={field} className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {label}
                              <input value={card[field]} onChange={(e) => setInstructorCards((prev) => prev.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] px-3 py-2 text-xs text-slate-900 dark:text-white" />
                            </label>
                          ))}
                        </div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">বিষয়সমূহ (কমা দিয়ে আলাদা)
                          <input value={card.subjects.join(', ')} onChange={(e) => setInstructorCards((prev) => prev.map((item, i) => i === index ? { ...item, subjects: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) } : item))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] px-3 py-2 text-xs text-slate-900 dark:text-white" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Save Bar */}
                <div className="bg-white dark:bg-[#111318] rounded-2xl p-5 border border-slate-200/90 dark:border-[#262b34] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    সবগুলো কার্ডের তথ্য পরিবর্তন সম্পন্ন হলে সংরক্ষণ বাটনে ক্লিক করুন।
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetHeroCards}
                      disabled={savingHeroCards}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#262b34] bg-slate-50 hover:bg-slate-100 dark:bg-[#151921] dark:hover:bg-[#1a202c] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                    >
                      ডিফল্টে রিসেট
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveHeroCards}
                      disabled={savingHeroCards}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-950/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {savingHeroCards ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{savingHeroCards ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন সংরক্ষণ করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-[#111318] rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#262b34] shadow-2xs space-y-6">
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
                {saveError && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    {saveError}
                  </div>
                )}

                <form onSubmit={handleSaveSiteSettings} className="space-y-6">
                  {/* Live Logo Preview Box */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-[#262b34] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        লাইভ প্রিভিউ (বর্তমান লোগো)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        নিচে ছবি আপলোড করলে বা লিংক দিলে লোগো এখানে প্রদর্শিত হবে।
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] shadow-sm">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${
                        (logoPreviewUrl || formatDriveImageUrl(logoUrl))
                          ? 'bg-transparent shadow-none'
                          : 'bg-gradient-to-tr from-orange-600 to-orange-500 text-white font-bold shadow-md shadow-orange-950/20'
                      }`}>
                        {(logoPreviewUrl || formatDriveImageUrl(logoUrl)) ? (
                          <img
                            src={logoPreviewUrl || formatDriveImageUrl(logoUrl)}
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
                      ref={logoUploadRef}
                      value={logoUrl}
                      onChange={(url) => setLogoUrl(url)}
                      onPreviewChange={setLogoPreviewUrl}
                      hideUploadButton
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
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-orange-950/25 disabled:opacity-50 transition-all cursor-pointer"
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
              <div className="bg-white dark:bg-[#111318] rounded-2xl p-6 border border-slate-200/90 dark:border-[#262b34] shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  WhatsApp সংযোগ
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  ইমেইল সফলভাবে পাঠানো হলে নিবন্ধিত ফোন নম্বরে একই বার্তা WhatsApp-এ পাঠানোর চেষ্টা হবে। সংযোগ না থাকলে WhatsApp বার্তা যাবে না।
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921]/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      অবস্থা: {whatsAppStatus?.state === 'ready' ? 'সংযুক্ত' : whatsAppStatus?.state === 'qr' ? 'QR স্ক্যান করুন' : whatsAppStatus?.state === 'starting' ? 'সংযোগ হচ্ছে' : whatsAppStatus?.state === 'disconnected' ? 'বিচ্ছিন্ন' : whatsAppStatus?.state === 'error' ? 'সমস্যা হয়েছে' : 'লোড হচ্ছে'}
                    </p>
                    <button type="button" onClick={() => void checkWhatsAppStatus()} disabled={checkingWhatsApp} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#262b34] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#151921] disabled:opacity-50 transition-colors">
                      <RefreshCw className={`h-3.5 w-3.5 ${checkingWhatsApp ? 'animate-spin' : ''}`} /> স্ট্যাটাস চেক করুন
                    </button>
                  </div>
                  {whatsAppStatus?.qrImage && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300">ফোনের WhatsApp → Linked devices → Link a device থেকে QR স্ক্যান করুন।</p>
                      <img src={whatsAppStatus.qrImage} alt="WhatsApp সংযোগের QR কোড" className="h-64 w-64 max-w-full rounded-lg bg-white p-2" />
                    </div>
                  )}
                  {whatsAppStatus?.lastError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{whatsAppStatus.lastError}</p>}
                  {whatsAppStatus?.state === 'ready' && (
                    <button type="button" onClick={() => void disconnectWhatsApp()} disabled={disconnectingWhatsApp} className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40">
                      {disconnectingWhatsApp ? 'Disconnect হচ্ছে...' : 'বর্তমান account disconnect করুন'}
                    </button>
                  )}
                  {whatsAppFeedback && <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300" role="status">{whatsAppFeedback}</p>}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
      {messageRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="WhatsApp মেসেজ">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#262b34] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-bold text-slate-900 dark:text-white">WhatsApp মেসেজ</h2><p className="text-sm text-slate-500 dark:text-slate-400">{messageRecipient.name} · {messageRecipient.phone}</p></div>
              <button type="button" onClick={() => setMessageRecipient(null)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#151921]" aria-label="বন্ধ করুন">×</button>
            </div>
            <textarea value={whatsAppMessage} onChange={(event) => setWhatsAppMessage(event.target.value)} maxLength={2000} rows={5} placeholder="মেসেজ লিখুন" className="mt-4 w-full rounded-xl border border-slate-200 dark:border-[#262b34] bg-white dark:bg-[#151921] p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
            {whatsAppFeedback && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300" role="status">{whatsAppFeedback}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setMessageRecipient(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#151921]">বন্ধ করুন</button>
              <button type="button" disabled={sendingWhatsApp || !whatsAppMessage.trim()} onClick={sendStudentWhatsApp} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{sendingWhatsApp ? 'পাঠানো হচ্ছে...' : 'পাঠান'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
