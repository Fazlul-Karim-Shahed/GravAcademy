'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, DriveFileUpload } from '@/components/ui';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Check,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface TeacherUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Available teachers from database
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [form, setForm] = useState({
    title: '',
    thumbnailUrl: '',
    description: '',
    gradeLevel: 'Class 10',
    subject: '',
    courseFee: 2500,
    regularPrice: 3500,
    discountPrice: 2500,
    duration: '1 Year',
    targetAudience: 'Designed for SSC candidates and Class 10 students aiming for GPA 5.',
    isPublished: true,
    instructors: [] as string[],
    curriculumHighlights: [
      'Complete Chapter Breakdown with Mathematical Concept Solvers',
      'Dedicated Board Exam Question Analysis & Test Papers',
      'Weekly Live Interactive Problem Solving Sessions',
      'Downloadable Hand Notes and Formula Sheets via Google Drive',
    ],
    features: [
      'Recorded Class Archive with Unlimited Replays',
      'Online Timed MCQ and Written Assessment System',
      'Direct Mentor Support and Doubt Clearance Batches',
    ],
  });

  const [newHighlight, setNewHighlight] = useState('');
  const [newFeature, setNewFeature] = useState('');

  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);

  const gradeOptions = academicClasses.map((ac) => ac.name);

  useEffect(() => {
    fetchTeachers();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const list = await getSharedAcademicClasses();
    setAcademicClasses(list);
    if (list.length > 0 && !list.some((c) => c.name === form.gradeLevel)) {
      setForm((prev) => ({ ...prev, gradeLevel: list[0].name }));
    }
  };

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      // Fetch users who are teachers or admins
      const res = await api.get('/users');
      if (res.data?.success) {
        const staff = res.data.data.filter(
          (u: TeacherUser) => u.role === 'teacher' || u.role === 'admin' || u.role === 'superadmin'
        );
        setTeachers(staff);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setForm((prev) => {
      const exists = prev.instructors.includes(teacherId);
      return {
        ...prev,
        instructors: exists
          ? prev.instructors.filter((id) => id !== teacherId)
          : [...prev.instructors, teacherId],
      };
    });
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setForm((prev) => ({
      ...prev,
      curriculumHighlights: [...(prev.curriculumHighlights || []), newHighlight.trim()],
    }));
    setNewHighlight('');
  };

  const removeHighlight = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      curriculumHighlights: prev.curriculumHighlights.filter((_, i) => i !== idx),
    }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()],
    }));
    setNewFeature('');
  };

  const removeFeature = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/courses', form);
      if (res.data?.success) {
        setSuccess(`Course "${form.title}" created successfully! Redirecting...`);
        setTimeout(() => {
          router.push('/admin/courses');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course. Ensure valid permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses Catalog
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Course Creator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Comprehensive Course
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build a rich course profile with assigned faculty teachers, syllabus features, learning outcomes, and fee settings.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Dedicated Form */}
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Class 10 Physics Masterclass"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Course Header Picture / Thumbnail via Drive or URL */}
            <DriveFileUpload
              label="Course Header Picture / Thumbnail (Google Drive বা লিংক)"
              value={form.thumbnailUrl}
              onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
              placeholder="https://drive.google.com/... অথবা ফাইল আপলোড করুন"
              helperText="কোর্সের ব্যানার ছবি নির্বাচন করুন, ফাইলটি স্বয়ংক্রিয়ভাবে গুগল ড্রাইভে আপলোড হয়ে সেভ হবে।"
            />

            {/* Academic Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Academic Grade / Class *
              </label>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Detailed Course Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explain the concepts covered, board syllabus scope, and benefits for students..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Target Audience / Who is this course for?
              </label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="e.g. Class 10 candidates preparing for board finals and GPA-5 aspirants"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Course Pricing: Regular & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-950/60 border border-blue-200/60 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  অরিজিনাল প্রাইস (Regular Price - ৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.regularPrice === 0 ? '' : form.regularPrice}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === '' ? 0 : Number(raw);
                    setForm((prev) => ({
                      ...prev,
                      regularPrice: val,
                      courseFee: prev.discountPrice && prev.discountPrice > 0 ? prev.discountPrice : val,
                    }));
                  }}
                  placeholder="e.g. 3500"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">কোর্সের প্রকৃত মূল ফি</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ডিসকাউন্টেড প্রাইস (Discount Price - ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.discountPrice === 0 ? '' : form.discountPrice}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === '' ? 0 : Number(raw);
                    setForm((prev) => ({
                      ...prev,
                      discountPrice: val,
                      courseFee: val > 0 ? val : prev.regularPrice,
                    }));
                  }}
                  placeholder="e.g. 2500 (ফাঁকা বা ০ রাখলে ডিসকাউন্ট থাকবে না)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  যদি কোনো ডিসকাউন্ট না থাকে, তাহলে এটি ফাঁকা বা ০ রাখুন; শুধু অরিজিনাল প্রাইস দেখাবে।
                </p>
              </div>
            </div>

            {/* FACULTY TEACHERS PICKER */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Select Course Teachers (Faculty)
                  </span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {form.instructors.length} Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Choose the teachers from your registered database who conduct classes for this course. Their photos, names, and titles will appear prominently on the course landing page.
              </p>

              {loadingTeachers ? (
                <div className="text-xs text-slate-400 italic py-3">Loading teachers list...</div>
              ) : teachers.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-3">
                  No teachers found in user accounts. You can create accounts with &quot;teacher&quot; role in User Management.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {teachers.map((t) => {
                    const isSelected = form.instructors.includes(t._id);
                    return (
                      <div
                        key={t._id}
                        onClick={() => toggleTeacher(t._id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {t.avatarUrl ? (
                              <img src={t.avatarUrl} alt={t.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              t.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {t.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                              {t.role} • {t.email}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CURRICULUM HIGHLIGHTS & OUTCOMES */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>What Students Will Learn (Syllabus Highlights)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Add bullet points highlighting the chapters, topics, and key takeaways taught in this course.
              </p>

              <div className="space-y-2 mb-3">
                {form.curriculumHighlights.map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      {hl}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                  placeholder="e.g. Chapter 5: Pressure and States of Matter Mastery"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <Button type="button" size="sm" onClick={addHighlight} variant="secondary">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="pt-2">
              <label className="relative flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Publish Immediately
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    If checked, this course will immediately appear in the public courses directory for students.
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
              <Link href="/admin/courses">
                <Button type="button" variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={submitting} size="md">
                Save & Create Course
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}
