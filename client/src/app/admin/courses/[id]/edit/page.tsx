'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Check,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface TeacherUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    gradeLevel: 'Class 10',
    subject: 'Physics',
    courseFee: 2500,
    duration: '1 Year',
    targetAudience: '',
    isPublished: true,
    instructors: [] as string[],
    curriculumHighlights: [] as string[],
    features: [] as string[],
  });

  const [newHighlight, setNewHighlight] = useState('');

  const gradeOptions = [
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
  ];

  const subjectOptions = [
    'Bangla',
    'English',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'ICT',
    'Higher Math',
    'General Science',
  ];

  useEffect(() => {
    loadCourseAndTeachers();
  }, [resolvedParams.id]);

  const loadCourseAndTeachers = async () => {
    setLoading(true);
    try {
      const [courseRes, usersRes] = await Promise.all([
        api.get(`/courses/${resolvedParams.id}`),
        api.get('/users'),
      ]);

      if (usersRes.data?.success) {
        const staff = usersRes.data.data.filter(
          (u: TeacherUser) => u.role === 'teacher' || u.role === 'admin' || u.role === 'superadmin'
        );
        setTeachers(staff);
      }

      if (courseRes.data?.success) {
        const c = courseRes.data.data;
        const currentInstructorIds = (c.instructors || []).map((ins: any) =>
          typeof ins === 'object' ? ins._id : ins
        );

        setForm({
          title: c.title || '',
          description: c.description || '',
          gradeLevel: c.gradeLevel || 'Class 10',
          subject: c.subject || 'Physics',
          courseFee: c.courseFee || 0,
          duration: c.duration || '1 Year',
          targetAudience: c.targetAudience || '',
          isPublished: c.isPublished ?? true,
          instructors: currentInstructorIds,
          curriculumHighlights: Array.isArray(c.curriculumHighlights) ? c.curriculumHighlights : [],
          features: Array.isArray(c.features) ? c.features : [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
      setLoadingTeachers(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setForm((prev) => {
      const exists = prev.instructors.some((id) => String(id) === String(teacherId));
      return {
        ...prev,
        instructors: exists
          ? prev.instructors.filter((id) => String(id) !== String(teacherId))
          : [...prev.instructors, teacherId],
      };
    });
  };

  const addHighlight = () => {
    const trimmed = newHighlight.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      curriculumHighlights: [...(prev.curriculumHighlights || []), trimmed],
    }));
    setNewHighlight('');
  };

  const removeHighlight = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      curriculumHighlights: (prev.curriculumHighlights || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        courseFee: Number(form.courseFee) || 0,
        instructors: form.instructors || [],
        curriculumHighlights: form.curriculumHighlights || [],
      };
      console.log('Submitting updated course payload:', payload);
      const res = await api.put(`/courses/${resolvedParams.id}`, payload);
      if (res.data?.success) {
        setSuccess(`Course "${form.title}" updated successfully! Redirecting...`);
        setTimeout(() => {
          router.push('/admin/courses');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Update course error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update course. Make sure you are signed in as an Admin.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 flex items-center justify-center">
        <div className="text-sm text-slate-500 animate-pulse">Loading course details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Courses
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200">Edit Course</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Course Customizer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Edit Course Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update descriptions, assigned faculty teachers, curriculum highlights, and tuition fees.
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Academic Level & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Subject *
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                placeholder="e.g. Class 10 candidates preparing for board finals"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Fee & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Course Fee (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={form.courseFee}
                  onChange={(e) => setForm({ ...form, courseFee: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Course Duration Scope
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 1 Year, 6 Months"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* FACULTY TEACHERS PICKER */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Assigned Teachers (Faculty)
                  </span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {form.instructors.length} Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Check or uncheck the teachers from your registered database assigned to this course.
              </p>

              {loadingTeachers ? (
                <div className="text-xs text-slate-400 italic py-3">Loading teachers list...</div>
              ) : teachers.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-3">
                  No teachers found in user accounts.
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
                  placeholder="e.g. Chapter 6: Thermodynamics Problem Sets"
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
                    Course is Published & Visible
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    If unchecked, this course will be saved as a private draft and hidden from student catalogs.
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
                Update Course
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}
