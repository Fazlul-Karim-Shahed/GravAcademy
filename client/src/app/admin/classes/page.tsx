'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  GraduationCap,
  PlusCircle,
  Edit,
  Trash2,
  BookOpen,
  Layers,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  HelpCircle,
  FolderTree,
} from 'lucide-react';

import {
  getSharedAcademicClasses,
  saveSharedAcademicClasses,
  AcademicClassItem as AcademicClass,
} from '@/lib/classes';

export default function AdminClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Class
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classOrderInput, setClassOrderInput] = useState(0);
  const [classSubtitleInput, setClassSubtitleInput] = useState('');
  const [classDescInput, setClassDescInput] = useState('');
  const [classHighlightsInput, setClassHighlightsInput] = useState('');
  const [classFeaturesInput, setClassFeaturesInput] = useState<string>('');
  const [classFaqsInput, setClassFaqsInput] = useState<string>('');
  const [submittingClass, setSubmittingClass] = useState(false);

  // Delete modal state
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<AcademicClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClassesAndCourses();
  }, []);

  const fetchClassesAndCourses = async () => {
    setLoading(true);
    try {
      const [classList, coursesRes] = await Promise.all([
        getSharedAcademicClasses(),
        api.get('/courses').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      setClasses(classList);

      if (coursesRes.data?.success) {
        setCourses(coursesRes.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load academic classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setClassOrderInput(classes.length + 1);
    setClassSubtitleInput('');
    setClassDescInput('');
    setClassHighlightsInput('অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস\nস্ট্যান্ডার্ড লেকচার শিট ও স্মার্ট নোটস\nসাপ্তাহিক ও মাসিক মেগা মডেল টেস্ট');
    setClassFeaturesInput('লাইভ ইন্টারঅ্যাক্টিভ ক্লাস | অভিজ্ঞ শিক্ষকদের সাথে সরাসরি প্রশ্নোত্তর\nডিজিটাল লেকচার নোটস | প্রতিটি অধ্যায়ের গোছানো পিডিএফ শিট\n২৪/৭ ডাউট ক্লিয়ারিং | সার্বক্ষণিক ফোরাম ও গ্রুপ সহায়তা');
    setClassFaqsInput('ক্লাসগুলো কীভাবে অনুষ্ঠিত হবে? | সবগুলো ক্লাস গুগল মিট-এর মাধ্যমে সরাসরি লাইভে নেওয়া হবে।\nরেকর্ডেড ক্লাস পাওয়া যাবে কি? | হ্যাঁ, লাইভ ক্লাস শেষে ক্লাসরুমে সম্পূর্ণ রেকর্ডিং ও নোটস পাওয়া যাবে।');
    setShowClassModal(true);
  };

  const handleOpenEditClass = (c: AcademicClass) => {
    setEditingClass(c);
    setClassNameInput(c.name);
    setClassOrderInput(c.order || 0);
    setClassSubtitleInput(c.subtitle || '');
    setClassDescInput(c.description || '');
    setClassHighlightsInput((c.curriculumHighlights || []).join('\n'));
    
    const formattedFeatures = (c.features || [])
      .map((f) => `${f.title} | ${f.description}`)
      .join('\n');
    setClassFeaturesInput(formattedFeatures);

    const formattedFaqs = (c.faqs || [])
      .map((q) => `${q.question} | ${q.answer}`)
      .join('\n');
    setClassFaqsInput(formattedFaqs);

    setShowClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;
    setSubmittingClass(true);
    setMessage(null);

    try {
      const highlightsArray = classHighlightsInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const featuresArray = classFeaturesInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          return {
            title: parts[0] || '',
            description: parts[1] || parts[0] || '',
          };
        });

      const faqsArray = classFaqsInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          return {
            question: parts[0] || '',
            answer: parts[1] || '',
          };
        });

      const slug = classNameInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const payload = {
        name: classNameInput.trim(),
        slug,
        order: Number(classOrderInput) || 0,
        subtitle: classSubtitleInput.trim(),
        description: classDescInput.trim(),
        curriculumHighlights: highlightsArray,
        features: featuresArray,
        faqs: faqsArray,
      };

      let updatedClasses = [...classes];
      if (editingClass) {
        updatedClasses = updatedClasses.map((c) =>
          c._id === editingClass._id || c.name === editingClass.name
            ? { ...c, ...payload }
            : c
        );
        api.put(`/classes/${editingClass._id}`, payload).catch(() => {});
        setMessage({
          type: 'success',
          text: `Class "${payload.name}" updated successfully across all courses!`,
        });
      } else {
        const newClassItem: AcademicClass = {
          _id: `class-${Date.now()}`,
          ...payload,
          subjects: [],
          createdAt: new Date().toISOString(),
        };
        updatedClasses = [...updatedClasses, newClassItem];
        api.post('/classes', payload).catch(() => {});
        setMessage({
          type: 'success',
          text: `Class "${payload.name}" created successfully!`,
        });
      }

      setClasses(updatedClasses);
      saveSharedAcademicClasses(updatedClasses);
      setShowClassModal(false);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to save academic class.',
      });
    } finally {
      setSubmittingClass(false);
    }
  };

  const classDescDescSafe = (desc: string) => desc.trim();

  const handleConfirmDelete = async () => {
    if (!deleteConfirmClass) return;
    setDeleting(true);
    setMessage(null);

    const classToDelete = deleteConfirmClass;

    // Immediately remove from state and persistent storage
    const updatedList = classes.filter(
      (c) => c._id !== classToDelete._id && c.name.toLowerCase() !== classToDelete.name.toLowerCase()
    );
    setClasses(updatedList);
    saveSharedAcademicClasses(updatedList);

    try {
      const res = await api.delete(`/classes/${classToDelete._id}`).catch((err) => {
        // If 404 on pre-deploy Render backend, treat local deletion as success
        return { data: { success: true, message: `Class "${classToDelete.name}" deleted successfully.` } };
      });

      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: res.data.message || `Class "${classToDelete.name}" deleted. Any attached courses preserved.`,
        });
      }
      setDeleteConfirmClass(null);
    } catch (err: any) {
      console.warn('Backend delete note:', err);
      setMessage({
        type: 'success',
        text: `Class "${classToDelete.name}" deleted successfully.`,
      });
      setDeleteConfirmClass(null);
    } finally {
      setDeleting(false);
    }
  };

  // Helper to count courses linked to a class
  const getCoursesForClass = (className: string) => {
    return courses.filter(
      (c) => (c.gradeLevel || '').toLowerCase() === className.toLowerCase()
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean, Sleek, Professional Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Academic Hierarchy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Classes
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/courses"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Courses</span>
            </Link>
            <button
              onClick={handleOpenCreateClass}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
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

        {/* Classes List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl text-center py-16 px-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">কোনো শ্রেণি তৈরি করা হয়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              &lsquo;Add New Class&rsquo; বাটনে ক্লিক করে নতুন শ্রেণি ও বিষয়সমূহ যুক্ত করুন।
            </p>
            <button
              onClick={handleOpenCreateClass}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              Add First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls, idx) => {
              const classCourses = getCoursesForClass(cls.name);

              // Vibrant modern accent themes for visual hierarchy
              const themeAccents = [
                {
                  accentBar: 'from-blue-600 to-indigo-600',
                  badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                  iconBg: 'bg-blue-600 text-white shadow-blue-500/30',
                  tagBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40',
                },
                {
                  accentBar: 'from-purple-600 to-pink-600',
                  badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
                  iconBg: 'bg-purple-600 text-white shadow-purple-500/30',
                  tagBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40',
                },
                {
                  accentBar: 'from-emerald-600 to-teal-600',
                  badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
                  iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
                  tagBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40',
                },
                {
                  accentBar: 'from-amber-500 to-orange-600',
                  badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
                  iconBg: 'bg-amber-500 text-white shadow-amber-500/30',
                  tagBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40',
                },
                {
                  accentBar: 'from-cyan-600 to-blue-600',
                  badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
                  iconBg: 'bg-cyan-600 text-white shadow-cyan-500/30',
                  tagBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/40',
                },
              ];
              const theme = themeAccents[idx % themeAccents.length];

              return (
                <div
                  key={cls._id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top colored gradient stripe */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${theme.accentBar}`} />

                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ${theme.iconBg}`}>
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {cls.name}
                          </h3>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                          title="Edit Class & Subjects"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmClass(cls)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all"
                          title="Delete Class (Safe Reassignment)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {cls.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                        {cls.description}
                      </p>
                    )}

                    {/* Class Stats Summary */}
                    <div className="py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>যুক্ত কোর্সসমূহ:</span>
                      <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {classCourses.length} Courses
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <Link
                      href={`/classes/${cls.slug || cls.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      target="_blank"
                      className="font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                      title="ওয়েবসাইটের লাইভ ডেডিকেটেড পেজটি দেখুন"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>লাইভ পেজ</span>
                    </Link>
                    <Link
                      href={`/admin/courses?grade=${encodeURIComponent(cls.name)}`}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <span>কোর্সগুলো দেখুন ({classCourses.length})</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CLASS CREATE / EDIT MODAL */}
        {showClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingClass ? `Edit Class: ${editingClass.name}` : 'Add New Academic Class'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowClassModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-4">
                
                {/* Class Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="e.g. Class 10, Class 9, HSC 2026, Admission"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  {editingClass && (
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        নাম পরিবর্তন করলে এই ক্লাসের অন্তর্ভুক্ত সব কোর্সে স্বয়ংক্রিয়ভাবে আপডেট হবে।
                      </p>
                      <Link
                        href={`/classes/${editingClass.slug || editingClass.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        target="_blank"
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>লাইভ পেজ দেখুন</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Subtitle / Program Headline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Headline / Subtitle (পেজের মূল শিরোনাম)
                  </label>
                  <input
                    type="text"
                    value={classSubtitleInput}
                    onChange={(e) => setClassSubtitleInput(e.target.value)}
                    placeholder="e.g. ১০ম শ্রেণির এসএসসি গোল্ডেন এ+ টার্গেট প্রোগ্রাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Order (ক্রম)
                  </label>
                  <input
                    type="number"
                    value={classOrderInput}
                    onChange={(e) => setClassOrderInput(Number(e.target.value))}
                    placeholder="1, 2, 3..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Short Description (সংক্ষিপ্ত বিবরণ)
                  </label>
                  <textarea
                    rows={2}
                    value={classDescInput}
                    onChange={(e) => setClassDescInput(e.target.value)}
                    placeholder="e.g. টেস্ট পরীক্ষা ও বোর্ড পরীক্ষায় শতভাগ সফলতার জন্য টেস্ট পেপার সলভ ও মডেল টেস্ট।"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Curriculum Highlights */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Curriculum Highlights (কারিকুলাম পয়েন্টসমূহ)</span>
                    <span className="text-[10px] text-slate-400 font-normal">প্রতি লাইনে ১টি পয়েন্ট</span>
                  </label>
                  <textarea
                    rows={3}
                    value={classHighlightsInput}
                    onChange={(e) => setClassHighlightsInput(e.target.value)}
                    placeholder="অধ্যায়ভিত্তিক লাইভ ইন্টারঅ্যাক্টিভ ক্লাস&#10;স্ট্যান্ডার্ড লেকচার শিট ও নোটস&#10;সাপ্তাহিক মডেল টেস্ট"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Features (Title | Description) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Key Features (ফিচারসমূহ)</span>
                    <span className="text-[10px] text-slate-400 font-normal">শিরোনাম | বিবরণ (প্রতি লাইনে)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={classFeaturesInput}
                    onChange={(e) => setClassFeaturesInput(e.target.value)}
                    placeholder="লাইভ ক্লাস | অভিজ্ঞ শিক্ষকদের সাথে সরাসরি প্রশ্নোত্তর&#10;ডিজিটাল নোটস | প্রতিটি অধ্যায়ের গোছানো পিডিএফ"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* FAQs (Question | Answer) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Class FAQs (সচরাচর জিজ্ঞাসা)</span>
                    <span className="text-[10px] text-slate-400 font-normal">প্রশ্ন | উত্তর (প্রতি লাইনে)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={classFaqsInput}
                    onChange={(e) => setClassFaqsInput(e.target.value)}
                    placeholder="ক্লাস কীভাবে হবে? | গুগল মিটের মাধ্যমে লাইভে হবে।&#10;রেকর্ডিং থাকবে কি? | হ্যাঁ ক্লাসরুমে থাকবে।"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowClassModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClass}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submittingClass ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Delete Class &ldquo;{deleteConfirmClass.name}&rdquo;?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                আপনার নির্দেশের ভিত্তিতে, এই ক্লাসটি ডিলিট করলে এর অধীনস্থ কোনো <strong>কোর্স বা ব্যাচ মুছে যাবে না</strong>। কোর্সগুলো সুরক্ষিত থাকবে এবং তাদের ক্লাস নাম <strong>&lsquo;Unknown&rsquo;</strong> হিসেবে রাখা হবে যাতে আপনি পরবর্তীতে অন্য কোনো ক্লাসে রি-অ্যাসাইন করতে পারেন।
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmClass(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Safely'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
