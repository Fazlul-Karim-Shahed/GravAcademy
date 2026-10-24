'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
  FileText,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
  Layers,
  Sparkles,
  ArrowLeft,
  School,
  Award,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';

export default function ProfileEditPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  // Basic Details State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  // Teacher specific state
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [experience, setExperience] = useState('');
  const [specialistSubjects, setSpecialistSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [badge, setBadge] = useState('মেন্টর');
  const [cvUrl, setCvUrl] = useState('');
  const [classesCount, setClassesCount] = useState('');
  const [studentsCount, setStudentsCount] = useState('');

  // Student specific state
  const [schoolOrCollege, setSchoolOrCollege] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [group, setGroup] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Populate initial values
    setName(user.name || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || '');
    setBio(user.bio || '');

    if (user.role === 'teacher') {
      const td = user.teacherDetails || {};
      setInstitution(td.institution || '');
      setDepartment(td.department || '');
      setExperience(td.experience || '');
      setSpecialistSubjects(td.specialistSubjects || []);
      setBadge(td.badge || 'মেন্টর');
      setCvUrl(td.cvUrl || '');
      setClassesCount(td.classesCount || '');
      setStudentsCount(td.studentsCount || '');
    }

    if (user.role === 'student') {
      const sd = user.studentDetails || {};
      setSchoolOrCollege(sd.schoolOrCollege || '');
      setGradeLevel(sd.gradeLevel || '');
      setGroup(sd.group || '');
      setGuardianName(sd.guardianName || '');
      setGuardianPhone(sd.guardianPhone || '');
    }
  }, [user, authLoading, router]);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectInput.trim()) return;
    if (!specialistSubjects.includes(subjectInput.trim())) {
      setSpecialistSubjects([...specialistSubjects, subjectInput.trim()]);
    }
    setSubjectInput('');
  };

  const handleRemoveSubject = (sub: string) => {
    setSpecialistSubjects(specialistSubjects.filter((s) => s !== sub));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: any = {
        name,
        phone,
        avatarUrl,
        bio,
      };

      if (user?.role === 'teacher') {
        payload.teacherDetails = {
          institution,
          department,
          experience,
          specialistSubjects,
          badge,
          cvUrl,
          classesCount,
          studentsCount,
        };
      }

      if (user?.role === 'student') {
        payload.studentDetails = {
          schoolOrCollege,
          gradeLevel,
          group,
          guardianName,
          guardianPhone,
        };
      }

      const res = await api.put('/auth/profile', payload);

      if (res.data?.success) {
        setMessage({ type: 'success', text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
        // Update local auth context and cookie
        updateUser(res.data.data.user);
        setTimeout(() => {
          router.push('/profile');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-xs font-bold text-slate-400">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                প্রোফাইল এডিট
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আপনার প্রয়োজনীয় তথ্য ও ছবি আপডেট করুন।
              </p>
            </div>
          </div>

          <button
            type="submit"
            form="profile-edit-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar & Photo Section */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>প্রোফাইল ছবি (Avatar / Photo)</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative group self-center sm:self-auto">
                <UserAvatar
                  name={name || user.name}
                  avatarUrl={avatarUrl}
                  role={user.role}
                  size="xl"
                  className="w-24 h-24 text-2xl shadow-md border-2 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  ছবির ডিরেক্ট ওয়েব লিংক (Image URL):
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg অথবা /images/teacher-1.jpg"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  সরাসরি কোনো ছবির লিংক পেস্ট করুন। ছবি না থাকলে ডিফল্ট চমৎকার আইকন প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          </div>

          {/* Basic Personal Info */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>সাধারণ তথ্য</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  ইউজার আইডি (অপরিবর্তনযোগ্য)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.userId || '—'}
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs rounded-xl px-3.5 py-2.5 cursor-not-allowed select-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  ফোন নম্বর
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  ইমেইল এড্রেস (যদি থাকে)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || 'ইমেইল নেই'}
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-xl px-3.5 py-2.5 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                সংক্ষিপ্ত পরিচিতি (Bio / About Me)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="নিজের সম্পর্কে সংক্ষিপ্ত ২-৩ লাইন লিখুন..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl p-3.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* TEACHER SPECIFIC FIELDS */}
          {user.role === 'teacher' && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>শিক্ষক পরিচিতি ও হোমপেজ তথ্য</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    পড়াশোনার প্রতিষ্ঠান (যেমন: বুয়েট, ঢাবি, ডিএমসি)
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="যেমন: বুয়েট (BUET - CSE)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    বিভাগ বা ডিগ্রি (Department)
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="যেমন: কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    পূর্বের অভিজ্ঞতা (Experience)
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="যেমন: ৮+ বছরের শিক্ষকতা অভিজ্ঞতা"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    সম্মানসূচক ব্যাজ (Badge Title)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="যেমন: মাস্টার ট্রেইনার, সিনিয়র মেন্টর"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    লাইভ ক্লাস সংখ্যা (হোমপেজে প্রদর্শিত)
                  </label>
                  <input
                    type="text"
                    value={classesCount}
                    onChange={(e) => setClassesCount(e.target.value)}
                    placeholder="যেমন: ৪৫০+ লাইভ ক্লাস"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    শিক্ষার্থী সংখ্যা (হোমপেজে প্রদর্শিত)
                  </label>
                  <input
                    type="text"
                    value={studentsCount}
                    onChange={(e) => setStudentsCount(e.target.value)}
                    placeholder="যেমন: ১৫,০০০+"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Specialist subjects tags input */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  যেসব বিষয় পড়ান বা স্পেশালিস্ট (Specialist Subjects)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject(e))}
                    placeholder="বিষয় লিখে এন্টার চাপুন (যেমন: উচ্চতর গণিত)"
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    যুক্ত করুন
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-8">
                  {specialistSubjects.map((sub, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-purple-400 hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* CV URL Input */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  সিভি বা জীবনবৃত্তান্তের লিংক (Google Drive / PDF URL)
                </label>
                <input
                  type="url"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... অথবা ডিরেক্ট পিডিএফ লিংক"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* STUDENT SPECIFIC FIELDS */}
          {user.role === 'student' && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>অ্যাকাডেমিক ও শিক্ষাপ্রতিষ্ঠান তথ্য</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    স্কুল বা কলেজের নাম
                  </label>
                  <input
                    type="text"
                    value={schoolOrCollege}
                    onChange={(e) => setSchoolOrCollege(e.target.value)}
                    placeholder="যেমন: ঢাকা রেসিডেনসিয়াল মডেল কলেজ"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    বর্তমান শ্রেণি (Grade Level)
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">শ্রেণি নির্বাচন করুন</option>
                    <option value="Class 6">Class 6 (৬ষ্ঠ শ্রেণি)</option>
                    <option value="Class 7">Class 7 (৭ম শ্রেণি)</option>
                    <option value="Class 8">Class 8 (৮ম শ্রেণি)</option>
                    <option value="Class 9">Class 9 (৯ম শ্রেণি)</option>
                    <option value="Class 10">Class 10 (১০ম শ্রেণি / SSC)</option>
                    <option value="HSC 1st Year">HSC ১ম বর্ষ</option>
                    <option value="HSC 2nd Year">HSC ২য় বর্ষ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    বিভাগ (Group)
                  </label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">গ্রুপ নির্বাচন করুন</option>
                    <option value="বিজ্ঞান (Science)">বিজ্ঞান (Science)</option>
                    <option value="ব্যবসায় শিক্ষা (Commerce)">ব্যবসায় শিক্ষা (Commerce)</option>
                    <option value="মানবিক (Arts)">মানবিক (Arts)</option>
                    <option value="সাধারণ (General)">সাধারণ (General)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    অভিভাবকের নাম
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="পিতা বা মাতার নাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    জরুরি যোগাযোগের জন্য অভিভাবকের ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="018xxxxxxxx"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              বাতিল
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
