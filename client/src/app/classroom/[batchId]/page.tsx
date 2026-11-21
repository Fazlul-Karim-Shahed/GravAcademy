'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import {
  Users,
  MessageSquare,
  Megaphone,
  Video,
  Send,
  Pin,
  Clock,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  PlusCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  FileText,
  UserMinus,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Award,
  ArrowRight,
  Clipboard,
  X,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { LiveKitClassroomModal } from '@/components/classroom/LiveKitClassroomModal';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

interface BatchInfo {
  _id: string;
  name: string;
  status: string;
  scheduleText?: string;
  meetingUrl?: string;
  courseId: {
    _id: string;
    title: string;
    gradeLevel: string;
    subject: string;
  };
  assignedTeachers: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }[];
}

interface MemberUser {
  _id: string;
  gravId?: string;
  name: string;
  email?: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  isPinned: boolean;
  emailSentCount: number;
  createdAt: string;
}

interface DiscussionMsg {
  _id: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  message: string;
  createdAt: string;
}
interface ClassroomMaterial { id: string; title: string; url: string; category: string; }

export const dynamic = 'force-dynamic';

export default function BatchClassroomPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFeatureEnabled } = useSiteSettings();

  // Start with a simple classroom home; detailed areas remain available as tabs.
  const [activeTab, setActiveTab] = useState<'home' | 'discussion' | 'announcements' | 'members' | 'materials'>('home');
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [memberCounts, setMemberCounts] = useState<{
    teachersCount: number;
    studentsCount: number;
    totalMembers: number;
  }>({ teachersCount: 0, studentsCount: 0, totalMembers: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab !== 'materials' || materials.length) return;
    let active = true;
    setMaterialsLoading(true);
    api.get(`/batches/${batchId}/assignments`).then((response) => {
      const items = response.data?.data?.assignments || response.data?.assignments || response.data?.data || [];
      const next = (Array.isArray(items) ? items : []).filter((item: any) => item.attachmentUrl).map((item: any) => ({ id: item._id, title: item.title || 'Assignment document', url: item.attachmentUrl, category: 'Assignment' }));
      if (active) setMaterials(next);
    }).catch(() => { if (active) setMaterials([]); }).finally(() => { if (active) setMaterialsLoading(false); });
    return () => { active = false; };
  }, [activeTab, batchId, materials.length]);

  // Discussions State
  const [messages, setMessages] = useState<DiscussionMsg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '', isPinned: false });
  const [submittingAnnounce, setSubmittingAnnounce] = useState(false);
  const [announceNotice, setAnnounceNotice] = useState('');

  // Members State
  const [members, setMembers] = useState<{ teachers: MemberUser[]; students: MemberUser[] }>({
    teachers: [],
    students: [],
  });
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<MemberUser | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [removeNotice, setRemoveNotice] = useState('');
  const [showEmailList, setShowEmailList] = useState(false);
  const [emailCopyNotice, setEmailCopyNotice] = useState('');

  // Shift Batch State
  const [studentToShift, setStudentToShift] = useState<MemberUser | null>(null);
  const [allBatchesForShift, setAllBatchesForShift] = useState<any[]>([]);
  const [loadingBatchesForShift, setLoadingBatchesForShift] = useState(false);
  const [selectedTargetBatchId, setSelectedTargetBatchId] = useState('');
  const [shiftingStudent, setShiftingStudent] = useState(false);
  const [isJitsiOpen, setIsJitsiOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isTeacher = user?.role === 'teacher';
  const canViewStudentMembers = isAdmin || isTeacher || hasPermission(user, PERMISSIONS.BATCHES_VIEW);
  const batchEmails = Array.from(new Set(
    [...members.teachers, ...(canViewStudentMembers ? members.students : [])]
      .map((member) => member.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email)),
  )).filter((email) => email !== user?.email?.trim().toLowerCase());

  const copyBatchEmails = async () => {
    if (!batchEmails.length) return;
    try {
      // YouTube Studio accepts the compact comma-separated recipient format.
      await navigator.clipboard.writeText(batchEmails.join(','));
      setEmailCopyNotice('YouTube-এর জন্য সব email কপি হয়েছে।');
    } catch {
      setEmailCopyNotice('কপি করা যায়নি। Email তালিকা select করে কপি করুন।');
    }
  };

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/classrooms/${batchId}`);
      if (res.data?.success) {
        setBatch(res.data.data.batch);
        setMemberCounts(res.data.data.memberCounts);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'ক্লাসরুমের তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async () => {
    try {
      const res = await api.get(`/classrooms/${batchId}/discussions`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load discussions:', err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await api.get(`/classrooms/${batchId}/announcements`);
      if (res.data?.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/classrooms/${batchId}/members`);
      if (res.data?.success) {
        setMembers({
          teachers: res.data.data.teachers || [],
          students: res.data.data.students || [],
        });
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
      setMembersLoaded(true);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}`);
      return;
    }
    if (user && batchId) {
      setMembersLoaded(false);
      loadOverview();
      loadDiscussions();
      loadAnnouncements();
    }
  }, [batchId, user, authLoading]);

  useEffect(() => {
    if (activeTab === 'members' && !membersLoaded) {
      loadMembers();
    }
  }, [activeTab, membersLoaded]);

  const fetchBatchesForShift = async () => {
    setLoadingBatchesForShift(true);
    try {
      const res = await api.get('/batches');
      if (res.data?.success) {
        setAllBatchesForShift(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load batches for shift:', e);
    } finally {
      setLoadingBatchesForShift(false);
    }
  };

  const handleOpenShiftModal = (student: MemberUser) => {
    setStudentToShift(student);
    setSelectedTargetBatchId('');
    fetchBatchesForShift();
  };

  const handleConfirmShiftStudent = async () => {
    if (!studentToShift || !selectedTargetBatchId) return;

    setShiftingStudent(true);
    try {
      const res = await api.post('/enrollments/shift', {
        gravId: studentToShift._id,
        currentBatchId: batchId,
        targetBatchId: selectedTargetBatchId,
      });

      if (res.data?.success) {
        setRemoveNotice(res.data.message || `${studentToShift.name} এর ব্যাচ সফলভাবে পরিবর্তন করা হয়েছে।`);
        setTimeout(() => setRemoveNotice(''), 6000);
        setStudentToShift(null);
        setSelectedTargetBatchId('');
        await loadMembers();
        await loadOverview();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'ব্যাচ পরিবর্তন করতে সমস্যা হয়েছে।');
    } finally {
      setShiftingStudent(false);
    }
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    setRemovingStudent(true);
    try {
      const res = await api.post('/enrollments/cancel', {
        batchId,
        gravId: studentToRemove._id,
      });

      if (res.data?.success) {
        setRemoveNotice(
          `${studentToRemove.name} কে এই ব্যাচ থেকে রিমুভ করা হয়েছে এবং যাবতীয় লেনদেন মুছে ফাইন্যান্স আপডেট করা হয়েছে।`
        );
        setTimeout(() => setRemoveNotice(''), 5000);
        // Refresh members list & overview counts
        await loadMembers();
        await loadOverview();
        setStudentToRemove(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'শিক্ষার্থীকে রিমুভ করা সম্ভব হয়নি।');
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await api.post(`/classrooms/${batchId}/discussions`, {
        message: newMessage.trim(),
      });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'মেসেজ পাঠানো সম্ভব হয়নি');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceForm.title.trim() || !announceForm.content.trim() || submittingAnnounce) return;

    setSubmittingAnnounce(true);
    setAnnounceNotice('');
    try {
      const res = await api.post(`/classrooms/${batchId}/announcements`, announceForm);
      if (res.data?.success) {
        setAnnouncements((prev) => [res.data.data, ...prev]);
        setShowAnnounceModal(false);
        setAnnounceForm({ title: '', content: '', isPinned: false });
        setAnnounceNotice('এনাউন্সমেন্ট সফলভাবে প্রকাশিত হয়েছে এবং সকল সদস্যের কাছে ইমেইল পাঠানো হয়েছে!');
        setTimeout(() => setAnnounceNotice(''), 6000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'এনাউন্সমেন্ট তৈরি করা সম্ভব হয়নি');
    } finally {
      setSubmittingAnnounce(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border-2 border-orange-500/20 border-t-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ক্লাসরুম লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d12] py-16 px-4">
        <div className="ga-card max-w-md mx-auto p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {error || 'আপনি এই ক্লাসরুমের সদস্য নন। দয়া করে সংশ্লিষ্ট ব্যাচে এনরোল করুন।'}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পূর্ববর্তী পাতায় ফিরে যান</span>
          </button>
        </div>
      </div>
    );
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
            এডমিন
          </span>
        );
      case 'teacher':
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
            শিক্ষক
          </span>
        );
      case 'guardian':
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            অভিভাবক
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            শিক্ষার্থী
          </span>
        );
    }
  };

  return (
    <div className="ga-page min-h-screen text-slate-900 dark:text-slate-100 transition-colors pb-16">
      
      {/* 1. TOP HEADER BANNER (Cosmic Theme) */}
      <div className="relative w-[98%] mx-auto overflow-hidden rounded-[1.75rem] cosmic-hero-bg text-white pt-6 pb-7 sm:pt-7 sm:pb-8 mb-6 sm:mb-8 border border-orange-500/20 shadow-xl shadow-orange-950/20">
        {/* Deep space radial ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] bg-gradient-to-b from-orange-950/40 via-amber-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[200px] bg-orange-600/15 rounded-full blur-[80px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-orange-900/15 rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* Twinkling Cosmic Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[25%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[18%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <span className="shooting-star meteor-1" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-orange-200/80 hover:text-white font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>পূর্ববর্তী পাতায় ফিরে যান</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/25 text-orange-200 border border-orange-400/40">
                  {batch.courseId?.gradeLevel || 'একাডেমিক'}
                </span>
                {batch.courseId?.subject && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/15">
                    {batch.courseId.subject}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  সক্রিয় ব্যাচ
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {batch.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold">
                {batch.courseId?.title}
              </p>
            </div>

            {/* Quick Primary Actions in Header */}
            <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
              {/* Primary Live Class CTA Button */}
              <button
                type="button"
                onClick={() => setIsJitsiOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-xl shadow-emerald-950/40 hover:shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                title="সরাসরি লাইভ ক্লাসে যুক্ত হোন"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>সরাসরি লাইভ ক্লাসে যান</span>
              </button>

              <Link
                href={`/learn/${batchId}`}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span>লেকচার</span>
              </Link>

              <Link
                href={`/classroom/${batchId}/exams`}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>এক্সাম</span>
              </Link>
            </div>
          </div>

          {/* Broadcast confirmation alert */}
          {announceNotice && (
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{announceNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Classroom section navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: 'home' as const, label: 'হোম ড্যাশবোর্ড', icon: BookOpen, count: null },
            { key: 'discussion' as const, label: 'ডিসকাশন গ্রুপ', icon: MessageSquare, count: messages.length },
            { key: 'announcements' as const, label: 'নোটিশ ও ঘোষণা', icon: Megaphone, count: announcements.length },
            { key: 'materials' as const, label: 'রিসোর্স ও শিট', icon: FileText, count: materials.length },
            {
              key: 'members' as const,
              label: canViewStudentMembers ? 'শিক্ষক ও সহপাঠী' : 'শিক্ষকবৃন্দ',
              icon: Users,
              count: canViewStudentMembers ? memberCounts.totalMembers : (members.teachers.length || memberCounts.teachersCount),
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-sm shadow-orange-950/20'
                    : 'bg-white dark:bg-[#111318] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#262b34] hover:border-orange-400 dark:hover:border-orange-500/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-orange-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1a202c] text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ================= CLASSROOM HOME ================= */}
        {activeTab === 'materials' && (
          <section className="space-y-4">
            <div><h2 className="text-xl font-black text-slate-900 dark:text-white">Classroom Materials</h2><p className="mt-1 text-sm text-slate-500">এই classroom-এর uploaded PDF ও document এক জায়গায় দেখুন।</p></div>
            {materialsLoading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-[#111318]">Materials লোড হচ্ছে...</div> : materials.length ? <div className="grid gap-3 sm:grid-cols-2">{materials.map((material) => <a key={material.id} href={material.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-400 hover:shadow-sm dark:border-[#262b34] dark:bg-[#111318]"><div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 dark:bg-orange-950/40"><FileText className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-white">{material.title}</p><p className="mt-1 text-xs text-slate-500">{material.category} · PDF/Document</p></div><ExternalLink className="ml-auto h-4 w-4 shrink-0 text-slate-400" /></a>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-[#262b34] dark:bg-[#111318]">এখনো কোনো material upload করা হয়নি।</div>}
          </section>
        )}

        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT 8 COLUMNS: Academic Hub, Live Banner & Notices */}
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Live Class & Routine Hero Action Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#151921] to-[#0f131a] border border-orange-500/30 p-5 sm:p-7 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-md">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-[11px] font-bold">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>{batch.scheduleText || 'সাপ্তাহিক রুটিন অনুযায়ী ক্লাস পরিচালিত হয়'}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      আজকের ক্লাসরুম ও লাইভ সেশন
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      লাইভ ক্লাসে যুক্ত হয়ে শিক্ষকের সাথে সরাসরি প্রশ্নোত্তর করুন এবং পড়ালেখার অগ্রগতি নিশ্চিত করুন।
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsJitsiOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>লাইভ ক্লাসে যান</span>
                    </button>
                    <Link
                      href={`/learn/${batchId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all text-center"
                    >
                      <BookOpen className="w-4 h-4 text-orange-400" />
                      <span>লেকচার দেখুন</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 2. Four Core Academic Hub Cards (2x2 Grid) */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    একাডেমিক মডিউল
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    প্রয়োজনীয় পাতা বেছে নিন
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {/* Card 1: Lectures */}
                  <Link
                    href={`/learn/${batchId}`}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs hover:shadow-lg hover:border-orange-500/60 transition-all flex flex-col justify-between"
                  >
                    <BookOpen className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-orange-500/10 group-hover:scale-110 group-hover:-rotate-6 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>পড়া শুরু করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        লেকচার ও ক্লাস কনটেন্ট
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        অধ্যায়ভিত্তিক ভিডিও লেকচার ও ক্লাস নোটস
                      </p>
                    </div>
                  </Link>

                  {/* Card 2: Exams */}
                  <Link
                    href={`/classroom/${batchId}/exams`}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs hover:shadow-lg hover:border-rose-500/60 transition-all flex flex-col justify-between"
                  >
                    <FileText className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-rose-500/10 group-hover:scale-110 group-hover:-rotate-6 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>পরীক্ষা দিন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        অনলাইন এক্সাম ও কুইজ
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        চলতি পরীক্ষায় অংশ নিন ও নিজের প্রস্তুতি যাচাই করুন
                      </p>
                    </div>
                  </Link>

                  {/* Card 3: Assignments */}
                  <Link
                    href={`/classroom/${batchId}/assignments`}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs hover:shadow-lg hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                  >
                    <Award className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-emerald-500/10 group-hover:scale-110 group-hover:-rotate-6 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>কাজ জমা দিন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        অ্যাসাইনমেন্ট ও হোমওয়ার্ক
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        বাড়ির কাজ জমা দিন এবং শিক্ষকের মূল্যায়ন দেখুন
                      </p>
                    </div>
                  </Link>

                  {/* Card 4: Marksheet */}
                  <Link
                    href={`/classroom/${batchId}/marksheet`}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs hover:shadow-lg hover:border-purple-500/60 transition-all flex flex-col justify-between"
                  >
                    <GraduationCap className="absolute -right-3 -bottom-3 w-24 h-24 text-slate-100 dark:text-slate-800/40 group-hover:text-purple-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>ফলাফল দেখুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        মার্কশিট ও প্রগ্রেস
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        পরীক্ষার নম্বর, র‌্যাংক ও ব্যক্তিগত অগ্রগতি
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* 3. Recent Notices Section on Home Tab */}
              <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#262b34] mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ক্লাসরুমের সর্বশেষ নোটিশ
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>সব নোটিশ ({announcements.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    বর্তমানে কোনো নতুন নোটিশ নেই।
                  </p>
                ) : (
                  <div className="space-y-3">
                    {announcements.slice(0, 2).map((item) => (
                      <div
                        key={item._id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-200/80 dark:border-[#262b34] flex items-start gap-3"
                      >
                        {item.isPinned && (
                          <Pin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(item.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT 4 COLUMNS: Sidebar Widgets */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Widget 1: Schedule Widget */}
              <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    ক্লাস শিডিউল ও সময়
                  </h4>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-orange-950/30 border border-orange-500/20 text-xs font-bold text-orange-700 dark:text-orange-300 leading-relaxed">
                  {batch.scheduleText || 'সাপ্তাহিক রুটিন অনুযায়ী ক্লাস অনুষ্ঠিত হয়।'}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  ক্লাস শুরুর ৫ মিনিট পূর্বে রুমে প্রবেশ করার অনুরোধ করা হচ্ছে।
                </p>
              </div>

              {/* Widget 2: Teachers Assigned */}
              <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      দায়িত্বপ্রাপ্ত শিক্ষক ({batch.assignedTeachers?.length || 0})
                    </h4>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {batch.assignedTeachers && batch.assignedTeachers.length > 0 ? (
                    batch.assignedTeachers.map((t) => (
                      <div
                        key={t._id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-100 dark:border-[#262b34]"
                      >
                        <UserAvatar
                          name={t.name}
                          avatarUrl={t.avatarUrl}
                          role="teacher"
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {t.email}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-1">কোনো শিক্ষক নির্ধারিত নেই।</p>
                  )}
                </div>
              </div>

              {/* Widget 3: Discussion Glance */}
              <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      ডিসকাশন গ্রুপ
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#151921] text-slate-600 dark:text-slate-400">
                    {messages.length} বার্তা
                  </span>
                </div>

                {messages.length > 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-100 dark:border-[#262b34] mb-3">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {messages[messages.length - 1].senderName}:
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                      "{messages[messages.length - 1].message}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-3">এখনো কোনো বার্তা পাঠানো হয়নি।</p>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('discussion')}
                  className="w-full py-2.5 rounded-xl border border-orange-500/30 hover:border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:bg-orange-500/5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>গ্রুপ ডিসকাশনে যান</span>
                </button>
              </div>

              {/* Widget 4: Batch Members Count */}
              <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ক্লাসরুম সদস্য
                  </h4>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {canViewStudentMembers ? memberCounts.totalMembers : (members.teachers.length || memberCounts.teachersCount)}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">জন</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1c222d] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>তালিকা</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 1: DISCUSSION GROUP ================= */}
        {activeTab === 'discussion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Simple & Clean Chat Thread */}
            <div className="lg:col-span-8 rounded-3xl md:bg-white md:dark:bg-[#111318] md:border md:border-slate-200/90 md:dark:border-[#262b34] p-1 sm:p-3 md:p-6 md:shadow-sm flex flex-col h-[580px] sm:h-[640px] max-w-full overflow-hidden">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262b34] mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    ডিসকাশন
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0 text-right">
                  প্রশ্ন ও মতামত শেয়ার করুন
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-w-0">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-40 text-orange-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">এখনো কোনো ডিসকাশন শুরু হয়নি</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      আপনার প্রথম বার্তা বা পড়া সম্পর্কিত প্রশ্ন নিচে লিখে পাঠান। শিক্ষক ও সহপাঠীরা মতামত দিতে পারবেন।
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderName === user?.name;
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-3 items-start ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col min-w-0`}>
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {msg.senderName}
                            </span>
                            {roleBadge(msg.senderRole)}
                            <span className="text-[10px] text-slate-400 ml-1">
                              {new Date(msg.createdAt).toLocaleTimeString('bn-BD', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium break-words max-w-full ${
                              isMe
                                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-tr-xs shadow-xs'
                                : 'bg-slate-100 dark:bg-[#151921] text-slate-900 dark:text-slate-100 rounded-tl-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-[#262b34] mt-3 sm:mt-4 flex items-center gap-2 w-full min-w-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="আপনার বার্তা বা প্রশ্ন লিখুন..."
                  className="flex-1 min-w-0 bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMsg}
                  className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                  title="পাঠান"
                >
                  <span className="hidden xs:inline sm:inline">পাঠান</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

            {/* Right 4 Cols: Batch Quick Info & Instructor Card */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Routine Card */}
              <div className="group rounded-2xl md:bg-white md:dark:bg-[#111318] md:border md:border-slate-200/90 md:dark:border-[#262b34] p-4 shadow-xs hover:shadow-lg hover:border-orange-400/70 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ক্লাস রুটিন
                  </h4>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {batch.scheduleText || 'সাপ্তাহিক নিয়মিত শিডিউল অনুযায়ী ক্লাস পরিচালিত হয়।'}
                </p>
              </div>

              {/* Teachers Assigned */}
              <div className="group rounded-2xl md:bg-white md:dark:bg-[#111318] md:border md:border-slate-200/90 md:dark:border-[#262b34] p-4 shadow-xs hover:shadow-lg hover:border-orange-400/70 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      দায়িত্বপ্রাপ্ত শিক্ষকবৃন্দ ({batch.assignedTeachers?.length || 0})
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {batch.assignedTeachers?.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#151921] border border-slate-100 dark:border-[#262b34]">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {t.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {t.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members Stats Pill */}
              <div className="group rounded-2xl md:bg-white md:dark:bg-[#111318] md:border md:border-slate-200/90 md:dark:border-[#262b34] p-4 shadow-xs hover:shadow-lg hover:border-emerald-400/70 transition-all flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    {canViewStudentMembers ? 'মোট সদস্য' : 'কোর্স শিক্ষক'}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {canViewStudentMembers
                      ? `${memberCounts.totalMembers} জন`
                      : `${members.teachers.length || memberCounts.teachersCount} জন`}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('members')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151921] dark:hover:bg-[#1c222d] text-xs font-bold text-orange-600 dark:text-orange-400 transition-colors"
                >
                  {canViewStudentMembers ? 'সদস্য দেখুন' : 'শিক্ষক দেখুন'}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: ANNOUNCEMENTS ================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            
            {/* Header / New Announcement Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl md:bg-white md:dark:bg-[#111318] p-1 sm:p-3 md:p-5 md:border md:border-slate-200/90 md:dark:border-[#262b34] md:shadow-sm">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span>ব্যাচ এনাউন্সমেন্ট ও নোটিশ</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এখানে যেকোনো ঘোষণা প্রকাশ করলে ক্লাসরুমের প্রত্যেক সদস্যের কাছে সরাসরি ইমেইল নোটিফিকেশন পৌঁছে যায়।
                </p>
              </div>

              <button
                onClick={() => setShowAnnounceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন নোটিশ</span>
              </button>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-[#111318] rounded-3xl p-12 text-center border border-slate-200/90 dark:border-[#262b34]">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">বর্তমানে কোনো এনাউন্সমেন্ট নেই</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  শিক্ষক বা শিক্ষার্থী যেকোনো গুরুত্বপূর্ণ নোটিশ এখানে ঘোষণা করতে পারেন।
                </p>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নোটিশ দিন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div
                    key={a._id}
                      className={`rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#111318] border transition-all hover:shadow-lg ${
                      a.isPinned
                        ? 'border-orange-400 dark:border-orange-700 shadow-md ring-1 ring-orange-500/20'
                        : 'border-slate-200/90 dark:border-[#262b34] shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {a.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                            <Pin className="w-3 h-3" /> পিন করা
                          </span>
                        )}
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {a.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ইমেইল ব্রডকাস্ট হয়েছে ({a.emailSentCount || memberCounts.totalMembers})</span>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(a.createdAt).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                      {a.content}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#262b34] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">প্রকাশক:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{a.authorName}</span>
                        {roleBadge(a.authorRole)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 3: MEMBERS DIRECTORY ================= */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            
            {/* Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {canViewStudentMembers
                      ? `ক্লাসরুম মেম্বার তালিকা (${memberCounts.totalMembers} জন)`
                      : `কোর্স শিক্ষক ও নির্দেশকবৃন্দ (${members.teachers.length || memberCounts.teachersCount} জন)`}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
                  {members.teachers.length || memberCounts.teachersCount} জন শিক্ষক
                </span>
                {canViewStudentMembers && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {members.students.length || memberCounts.studentsCount} জন শিক্ষার্থী
                  </span>
                )}
                {canViewStudentMembers && (
                  <button
                    type="button"
                    onClick={() => { setShowEmailList(true); setEmailCopyNotice(''); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/60"
                  >
                    <Mail className="h-3.5 w-3.5" /> Get all email
                  </button>
                )}
              </div>
            </div>

            {showEmailList && canViewStudentMembers && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="batch-email-title">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#262b34] dark:bg-[#111318] sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 id="batch-email-title" className="text-base font-bold text-slate-900 dark:text-white">Batch member emails</h3>
                      <p className="mt-1 text-xs text-slate-500">{batchEmails.length}টি unique email</p>
                    </div>
                    <button type="button" onClick={() => setShowEmailList(false)} aria-label="Close email list" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#151921]"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#262b34] dark:bg-[#0b0d12]">
                    {batchEmails.length ? (
                      <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-7 text-slate-700 dark:text-slate-200">{batchEmails.join('\n')}</pre>
                    ) : (
                      <p className="py-6 text-center text-sm text-slate-500">কোনো email পাওয়া যায়নি।</p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    {emailCopyNotice && <span role="status" className="mr-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400">{emailCopyNotice}</span>}
                    <button type="button" onClick={() => void copyBatchEmails()} disabled={!batchEmails.length} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"><Clipboard className="h-4 w-4" /> Copy all email</button>
                    <button type="button" onClick={() => setShowEmailList(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#262b34] dark:text-slate-200 dark:hover:bg-[#151921]">Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Removal Notification */}
            {removeNotice && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{removeNotice}</span>
              </div>
            )}

            {loadingMembers ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                মেম্বার তালিকা লোড হচ্ছে...
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Teachers Section */}
                <div>
                  {canViewStudentMembers && (
                    <div className="mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        শিক্ষক ও ইনস্ট্রাক্টর ({members.teachers.length} জন)
                      </h4>
                    </div>
                  )}

                  {members.teachers.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-8 text-center text-xs text-slate-400 font-medium">
                      বর্তমানে এই ক্লাসরুমে কোনো শিক্ষক নির্ধারিত নেই।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.teachers.map((t: any) => (
                        <div
                          key={t._id}
                          className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111318] border border-orange-200 dark:border-orange-900/60 shadow-xs hover:shadow-lg hover:border-orange-400 transition-all flex items-center gap-3.5"
                        >
                          <UserAvatar
                            name={t.name}
                            avatarUrl={t.avatarUrl}
                            role="teacher"
                            size="lg"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                {t.name}
                              </span>
                              {roleBadge('teacher')}
                            </div>
                            <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400 block truncate">
                              {t.gravId ? `Grav ID: ${t.gravId}` : 'শিক্ষক'}
                            </span>
                            {t.email && (
                              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                {t.email}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Students Section (Only visible to Admins and Teachers) */}
                {canViewStudentMembers && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#262b34]">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ভর্তিকৃত শিক্ষার্থী ({members.students.length} জন)
                      </h4>
                    </div>

                    {members.students.length === 0 ? (
                      <div className="rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] p-8 text-center text-xs text-slate-400 font-medium">
                        এই ব্যাচে এখনো কোনো শিক্ষার্থী নেই।
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.students.map((s) => (
                          <div
                            key={s._id}
                            className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-[#262b34] shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <UserAvatar
                                name={s.name}
                                avatarUrl={s.avatarUrl}
                                role="student"
                                size="lg"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                    {s.name}
                                  </span>
                                  {roleBadge('student')}
                                </div>
                                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                                  {s.gravId ? `Grav ID: ${s.gravId}` : 'শিক্ষার্থী'}
                                </span>
                              </div>
                            </div>

                            {/* Admin Actions: Shift Batch & Remove Student */}
                            {isAdmin && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenShiftModal(s)}
                                  title="ব্যাচ বা কোর্স পরিবর্তন করুন (শিফট)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/80 dark:border-orange-800/60 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span>শিফট</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setStudentToRemove(s)}
                                  title="এই ব্যাচ/কোর্স থেকে রিমুভ করুন"
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all shrink-0 cursor-pointer"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ================= MODAL: REMOVE STUDENT CONFIRMATION ================= */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#111318] rounded-3xl p-6 border border-slate-200 dark:border-[#262b34] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  কোর্স/ব্যাচ থেকে রিমুভ করবেন?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ভুলবশত ভর্তি বাতিলকরণ
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-100 dark:border-[#262b34] mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentToRemove.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grav ID:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{studentToRemove.gravId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান ব্যাচ:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{batch?.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              আপনি কি নিশ্চিত যে এই শিক্ষার্থীকে এই ব্যাচ থেকে বাতিল করতে চান? শিক্ষার্থী আর এই ক্লাসরুম, লেকচার ও এক্সামে প্রবেশ করতে পারবে না, তার এই ব্যাচের ট্রানজ্যাকশনগুলো মুছে যাবে এবং ফাইন্যান্স হালনাগাদ হবে।
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={removingStudent}
                onClick={() => setStudentToRemove(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151921] transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={removingStudent}
                onClick={handleConfirmRemoveStudent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {removingStudent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>রিমুভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, রিমুভ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SHIFT STUDENT BATCH ================= */}
      {studentToShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#111318] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-[#262b34] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  শিক্ষার্থীর ব্যাচ / কোর্স শিফট করুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  একই কোর্স বা অন্য কোনো কোর্সের ভিন্ন ব্যাচে স্থানান্তর
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151921] border border-slate-100 dark:border-[#262b34] mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentToShift.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grav ID:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{studentToShift.gravId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান ব্যাচ:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{batch?.name} ({batch?.courseId?.title})</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন ব্যাচ নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                {loadingBatchesForShift ? (
                  <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                    <span>ব্যাচ তালিকা লোড হচ্ছে...</span>
                  </div>
                ) : (
                  <select
                    value={selectedTargetBatchId}
                    onChange={(e) => setSelectedTargetBatchId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] bg-slate-50 dark:bg-[#151921] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                    {allBatchesForShift
                      .filter((b) => b._id !== batchId)
                      .map((b) => {
                        const cTitle = b.courseId?.title || 'কোর্স';
                        const fee = b.courseId?.discountPrice ?? b.courseId?.courseFee ?? b.courseId?.regularPrice ?? b.fee ?? 0;
                        return (
                          <option key={b._id} value={b._id}>
                            {b.name} — {cTitle} (ফি: ৳{fee.toLocaleString('bn-BD')})
                          </option>
                        );
                      })}
                  </select>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  * নতুন ব্যাচে শিফট করার সাথে সাথে ওই কোর্সের বর্তমান ফি ব্যাচ-ফি হিসেবে সেট হবে এবং পূর্বের পরিশোধিত কিস্তির হিসাব অক্ষুণ্ণ রেখে নতুন বকেয়া স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={shiftingStudent}
                onClick={() => setStudentToShift(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262b34] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151921] transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={shiftingStudent || !selectedTargetBatchId}
                onClick={handleConfirmShiftStudent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-orange-950/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {shiftingStudent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>শিফট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>ব্যাচ শিফট করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= MODAL: CREATE ANNOUNCEMENT ================= */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#111318] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-[#262b34] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262b34] mb-5">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">নতুন এনাউন্সমেন্ট তৈরি করুন</h3>
              </div>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ঘোষণার বিষয় / শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={announceForm.title}
                  onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                  placeholder="যেমন: আগামী রবিবারের স্পেশাল ক্লাস ও সিলেবাস"
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  বিস্তারিত বার্তা *
                </label>
                <textarea
                  required
                  rows={5}
                  value={announceForm.content}
                  onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                  placeholder="আপনার নোটিশ বিস্তারিত এখানে লিখুন..."
                  className="w-full bg-slate-50 dark:bg-[#151921] border border-slate-200 dark:border-[#262b34] rounded-xl p-3.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={announceForm.isPinned}
                  onChange={(e) => setAnnounceForm({ ...announceForm, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  গুরুত্বপূর্ণ নোটিশ হিসেবে উপরে পিন করে রাখুন
                </label>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/60 text-orange-800 dark:text-orange-300 text-[11px] leading-relaxed flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                <span>এই নোটিশটি পাবলিশ হওয়া মাত্রই ক্লাসের সকল এনরোল্ড সদস্যের ইমেইলে পাঠিয়ে দেওয়া হবে।</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#262b34]">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnounce}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {submittingAnnounce ? 'প্রকাশ করা হচ্ছে...' : 'পাবলিশ ও ইমেইল পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Native LiveKit WebRTC Classroom Modal */}
      {batch && (
        <LiveKitClassroomModal
          isOpen={isJitsiOpen}
          onClose={() => setIsJitsiOpen(false)}
          roomName={`Batch-${batchId}`}
          displayName={user?.name || 'শিক্ষার্থী'}
          email={user?.email || ''}
          subjectTitle={`${batch.name} — লাইভ ক্লাস`}
        />
      )}

    </div>
  );
}
