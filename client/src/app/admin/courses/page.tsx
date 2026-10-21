'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  PlusCircle,
  Edit3,
  Trash2,
  GraduationCap,
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradeLevel: string;
  subject: string;
  courseFee: number;
  duration?: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');

  // Modal State for Create & Edit
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    gradeLevel: 'Class 6',
    subject: 'Bangla',
    courseFee: 0,
    duration: '6 Months',
    isPublished: true,
  });

  const gradeOptions = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const subjectOptions = ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'ICT', 'Higher Math', 'General Science'];

  useEffect(() => {
    fetchCourses();
  }, [selectedGrade]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedGrade !== 'all') params.gradeLevel = selectedGrade;
      if (search) params.search = search;

      const res = await api.get('/courses', { params });
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err: any) {
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setForm({
      title: '',
      description: '',
      gradeLevel: 'Class 6',
      subject: 'Bangla',
      courseFee: 0,
      duration: '6 Months',
      isPublished: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description || '',
      gradeLevel: course.gradeLevel,
      subject: course.subject,
      courseFee: course.courseFee || 0,
      duration: course.duration || '6 Months',
      isPublished: course.isPublished,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (editingCourse) {
        const res = await api.put(`/courses/${editingCourse._id}`, form);
        if (res.data?.success) {
          setMessage({ type: 'success', text: `Course "${form.title}" updated successfully!` });
        }
      } else {
        const res = await api.post('/courses', form);
        if (res.data?.success) {
          setMessage({ type: 'success', text: `New Course "${form.title}" created successfully!` });
        }
      }
      setShowModal(false);
      fetchCourses();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save course. Ensure valid permissions.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Course "${title}" deleted successfully.` });
        fetchCourses();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete course.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Course Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create, edit, organize syllabus, and publish courses dynamically for Class 6 to Class 12.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Add New Course
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 mb-8 flex flex-wrap items-center justify-between gap-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                placeholder="Search courses..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9.5 pr-3.5 py-2.5 w-64 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Class Levels</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchCourses}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Filter
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Courses: <strong className="text-slate-900 dark:text-white">{courses.length}</strong>
          </span>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl text-center py-16 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses created yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Click &apos;Add New Course&apos; to create your first dynamic curriculum.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              Add Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                      {course.gradeLevel}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        course.isPublished
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{course.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {course.description || 'Comprehensive curriculum with video lectures, lecture notes, and tests.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subject</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{course.subject}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:border-slate-800" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fee</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {course.courseFee === 0 ? 'Free' : `৳ ${course.courseFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:border-slate-800" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{course.duration || 'Flexible'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/courses/${course._id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/80 dark:border-blue-700/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Batches</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Edit Course Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id, course.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE & EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Class 10 Higher Mathematics Masterclass"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Grade / Class Level
                    </label>
                    <select
                      value={form.gradeLevel}
                      onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {gradeOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief syllabus overview, learning objectives, and details..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course Fee (BDT ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.courseFee}
                      onChange={(e) => setForm({ ...form, courseFee: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 6 Months, 1 Year"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPublishedCheck"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="isPublishedCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Publish immediately (visible in public catalog)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
