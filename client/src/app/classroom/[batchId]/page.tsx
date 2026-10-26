'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { LiveKitClassroomModal } from '@/components/classroom/LiveKitClassroomModal';

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
  userId?: string;
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

  // Active Tab: 'discussion' | 'announcements' | 'members'
  const [activeTab, setActiveTab] = useState<'discussion' | 'announcements' | 'members'>('discussion');

  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [memberCounts, setMemberCounts] = useState<{
    teachersCount: number;
    studentsCount: number;
    totalMembers: number;
  }>({ teachersCount: 0, studentsCount: 0, totalMembers: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const [studentToRemove, setStudentToRemove] = useState<MemberUser | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [removeNotice, setRemoveNotice] = useState('');

  // Shift Batch State
  const [studentToShift, setStudentToShift] = useState<MemberUser | null>(null);
  const [allBatchesForShift, setAllBatchesForShift] = useState<any[]>([]);
  const [loadingBatchesForShift, setLoadingBatchesForShift] = useState(false);
  const [selectedTargetBatchId, setSelectedTargetBatchId] = useState('');
  const [shiftingStudent, setShiftingStudent] = useState(false);
  const [isJitsiOpen, setIsJitsiOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/classroom/${batchId}`);
      return;
    }
    if (user && batchId) {
      loadOverview();
      loadDiscussions();
      loadAnnouncements();
    }
  }, [batchId, user, authLoading]);

  useEffect(() => {
    if (activeTab === 'members' && members.students.length === 0) {
      loadMembers();
    }
  }, [activeTab]);

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
        studentId: studentToShift._id,
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
        studentId: studentToRemove._id,
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ক্লাসরুম লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {error || 'আপনি এই ক্লাসরুমের সদস্য নন। দয়া করে সংশ্লিষ্ট ব্যাচে এনরোল করুন।'}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
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
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      
      {/* 1. TOP HEADER BANNER (Cosmic Theme) */}
      <div className="relative overflow-hidden cosmic-hero-bg text-white pt-8 pb-10 sm:pt-10 sm:pb-12 mb-8">
        {/* Deep space radial ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] bg-gradient-to-b from-rose-950/40 via-red-950/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[200px] bg-red-600/15 rounded-full blur-[80px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] bg-blue-900/15 rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* Twinkling Cosmic Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[25%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" />
          <div className="absolute top-[18%] right-[14%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" />
          <span className="shooting-star meteor-1" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
                  title="ফিরে যান"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-200 bg-white/15 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                  {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>সক্রিয় ব্যাচ</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-normal leading-[1.35] pt-1">
                {batch.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
                {batch.courseId?.title}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Live Classroom Button */}
              <button
                type="button"
                onClick={() => setIsJitsiOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                title="সরাসরি লাইভ ক্লাসে যুক্ত হোন"
              >
                <Video className="w-4 h-4" />
                <span>লাইভ ক্লাস</span>
              </button>

              <Link
                href={`/classroom/${batchId}/exams`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>এক্সাম রুম (Exam Room)</span>
              </Link>

              <Link
                href={`/learn/${batchId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>স্টাডি ম্যাটেরিয়াল ও লেকচার</span>
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

          {/* 2. SUB-NAVIGATION TABS */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 border-t border-white/10 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('discussion')}
              className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                activeTab === 'discussion'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-102'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 backdrop-blur-md'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>গ্রুপ ডিসকাশন</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'discussion' ? 'bg-white/25 text-white' : 'bg-white/15 text-slate-300'
              }`}>
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-102'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 backdrop-blur-md'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>এনাউন্সমেন্ট</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'announcements' ? 'bg-white/25 text-white' : 'bg-white/15 text-slate-300'
              }`}>
                {announcements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-102'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 backdrop-blur-md'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>মেম্বার তালিকা</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'members' ? 'bg-white/25 text-white' : 'bg-white/15 text-slate-300'
              }`}>
                {memberCounts.totalMembers}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ================= TAB 1: DISCUSSION GROUP ================= */}
        {activeTab === 'discussion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Simple & Clean Chat Thread */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col h-[640px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ব্যাচ ডিসকাশন রুম
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  ক্লাসের পড়া, প্রশ্ন ও মতামত শেয়ার করুন
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-40 text-blue-500" />
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
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
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
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
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="আপনার বার্তা বা প্রশ্ন লিখুন..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMsg}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                >
                  <span>পাঠান</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

            {/* Right 4 Cols: Batch Quick Info & Instructor Card */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Routine Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ক্লাস রুটিন
                  </h4>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {batch.scheduleText || 'সাপ্তাহিক নিয়মিত শিডিউল অনুযায়ী ক্লাস পরিচালিত হয়।'}
                </p>
              </div>

              {/* Teachers Assigned */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      দায়িত্বপ্রাপ্ত শিক্ষকবৃন্দ ({batch.assignedTeachers?.length || 0})
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {batch.assignedTeachers?.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    মোট সদস্য
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {memberCounts.totalMembers} জন
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('members')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors"
                >
                  তালিকা দেখুন
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: ANNOUNCEMENTS ================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            
            {/* Header / New Announcement Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>ব্যাচ এনাউন্সমেন্ট ও নোটিশ</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এখানে যেকোনো ঘোষণা প্রকাশ করলে ক্লাসরুমের প্রত্যেক সদস্যের কাছে সরাসরি ইমেইল নোটিফিকেশন পৌঁছে যায়।
                </p>
              </div>

              <button
                onClick={() => setShowAnnounceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন এনাউন্সমেন্ট লিখুন</span>
              </button>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/90 dark:border-slate-800">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">বর্তমানে কোনো এনাউন্সমেন্ট নেই</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  শিক্ষক বা শিক্ষার্থী যেকোনো গুরুত্বপূর্ণ নোটিশ এখানে ঘোষণা করতে পারেন।
                </p>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>প্রথম নোটিশ প্রকাশ করুন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div
                    key={a._id}
                    className={`rounded-3xl p-6 bg-white dark:bg-slate-900 border transition-all ${
                      a.isPinned
                        ? 'border-blue-400 dark:border-blue-700 shadow-md ring-1 ring-blue-500/20'
                        : 'border-slate-200/90 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {a.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
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

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
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
                  <span>ক্লাসরুম মেম্বার তালিকা ({memberCounts.totalMembers} জন)</span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {members.teachers.length || memberCounts.teachersCount} জন শিক্ষক
                </span>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {members.students.length || memberCounts.studentsCount} জন শিক্ষার্থী
                </span>
              </div>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Teachers Section First */}
                {members.teachers.map((t: any) => (
                  <div
                    key={t._id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs flex items-center gap-3.5"
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
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 block truncate">
                        {t.userId ? `ID: ${t.userId}` : 'শিক্ষক'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Students Next */}
                {members.students.map((s) => (
                  <div
                    key={s._id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors group"
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
                          {s.userId ? `ID: ${s.userId}` : 'শিক্ষার্থী'}
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 text-xs font-bold transition-all cursor-pointer shadow-2xs"
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

      {/* ================= MODAL: REMOVE STUDENT CONFIRMATION ================= */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
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

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentToRemove.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">আইডি:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{studentToRemove.userId || 'N/A'}</span>
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentToShift.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">আইডি:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{studentToShift.userId || 'N/A'}</span>
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
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span>ব্যাচ তালিকা লোড হচ্ছে...</span>
                  </div>
                ) : (
                  <select
                    value={selectedTargetBatchId}
                    onChange={(e) => setSelectedTargetBatchId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={shiftingStudent || !selectedTargetBatchId}
                onClick={handleConfirmShiftStudent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={announceForm.isPinned}
                  onChange={(e) => setAnnounceForm({ ...announceForm, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  গুরুত্বপূর্ণ নোটিশ হিসেবে উপরে পিন করে রাখুন
                </label>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>এই নোটিশটি পাবলিশ হওয়া মাত্রই ক্লাসের সকল এনরোল্ড সদস্যের ইমেইলে পাঠিয়ে দেওয়া হবে।</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
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
