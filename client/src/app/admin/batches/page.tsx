'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import {
  Layers,
  PlusCircle,
  Copy,
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  status: string;
  fee?: number;
  courseId: {
    _id: string;
    title: string;
    gradeLevel: string;
    subject: string;
  };
  scheduleText?: string;
  capacity?: number;
}

interface Course {
  _id: string;
  title: string;
  gradeLevel: string;
  subject: string;
}

export default function AdminBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    status: 'draft',
    fee: 0,
    scheduleText: '',
    capacity: 40,
    copyFromBatchId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, coursesRes] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
      ]);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setForm({
      name: '',
      courseId: courses.length > 0 ? courses[0]._id : '',
      status: 'draft',
      fee: 0,
      scheduleText: '',
      capacity: 40,
      copyFromBatchId: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setForm({
      name: batch.name,
      courseId: typeof batch.courseId === 'object' && batch.courseId !== null ? batch.courseId._id : (batch.courseId || ''),
      status: batch.status || 'draft',
      fee: batch.fee || 0,
      scheduleText: batch.scheduleText || '',
      capacity: batch.capacity || 40,
      copyFromBatchId: '',
    });
    setShowCreateModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {
        name: form.name,
        courseId: form.courseId,
        status: form.status,
        fee: Number(form.fee) || 0,
        scheduleText: form.scheduleText,
        capacity: Number(form.capacity),
      };

      if (!editingBatch && form.copyFromBatchId) {
        payload.copyFromBatchId = form.copyFromBatchId;
      }

      let res;
      if (editingBatch) {
        res = await api.put(`/batches/${editingBatch._id}`, payload);
      } else {
        res = await api.post('/batches', payload);
      }

      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: editingBatch
            ? `✅ Batch "${form.name}" updated successfully!`
            : form.copyFromBatchId
            ? '✅ Batch created with cloned content hierarchy successfully!'
            : '✅ Batch created successfully!',
        });
        setShowCreateModal(false);
        setEditingBatch(null);
        setForm({
          name: '',
          courseId: '',
          status: 'draft',
          fee: 0,
          scheduleText: '',
          capacity: 40,
          copyFromBatchId: '',
        });
        loadData();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || `Failed to ${editingBatch ? 'update' : 'create'} batch.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await api.delete(`/batches/${id}`);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `✅ Batch "${name}" deleted successfully.` });
        loadData();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete batch.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-blue-600 dark:text-blue-500" /> Batch Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create, organize student batches, manage admissions fees, and configure schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/courses"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/batches/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create New Batch
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 border shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
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

        {/* Batch Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-white dark:bg-slate-900/60 animate-pulse border border-slate-200/80 dark:border-slate-800"
              />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl text-center py-16 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No batches created yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Create your first batch or clone an existing curriculum to get started.
            </p>
            <Link
              href="/admin/batches/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create Batch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {batches.map((batch, idx) => {
              const batchAccents = [
                'from-blue-600 via-indigo-600 to-violet-700',
                'from-violet-600 via-purple-600 to-fuchsia-700',
                'from-emerald-600 via-teal-600 to-cyan-700',
                'from-amber-500 via-orange-600 to-rose-600',
                'from-cyan-600 via-sky-600 to-indigo-700',
              ];
              const accentGradient = batchAccents[idx % batchAccents.length];

              return (
                <div
                  key={batch._id}
                  className="group relative bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-2xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle Top Ambient Gradient Line */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient} opacity-90`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-black">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${
                          batch.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                            : batch.status === 'upcoming'
                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/80'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${batch.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {batch.status}
                      </span>
                    </div>

                    {/* Batch Name & Course Title */}
                    <div className="mb-4 flex-1">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
                        {batch.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                        {batch.courseId?.title || 'Unassigned Course'}
                      </p>
                    </div>

                    {/* Schedule Pill */}
                    {batch.scheduleText ? (
                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold truncate">{batch.scheduleText}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 italic">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>শিডিউল নির্ধারিত হয়নি</span>
                      </div>
                    )}

                    {/* Fee & Capacity 2-Column Info Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ভর্তি ফি</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {batch.fee && batch.fee > 0 ? `৳ ${batch.fee.toLocaleString()}` : 'ফ্রি ব্যাচ'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">আসন সংখ্যা</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{batch.capacity ? `${batch.capacity} জন` : 'সীমাহীন'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/batches/${batch._id}/curriculum`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>কারিকুলাম</span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/batches/${batch._id}/edit`}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Batch Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => {
                          setEditingBatch(null);
                          setForm({
                            name: `${batch.name} (Copy)`,
                            courseId: typeof batch.courseId === 'object' && batch.courseId !== null ? batch.courseId._id : (batch.courseId || ''),
                            status: 'draft',
                            fee: batch.fee || 0,
                            scheduleText: batch.scheduleText || '',
                            capacity: batch.capacity || 40,
                            copyFromBatchId: batch._id,
                          });
                          setShowCreateModal(true);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                        title="Clone this batch content to a new batch"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBatch(batch._id, batch.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE / EDIT / DUPLICATE BATCH MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {editingBatch ? (
                    <>
                      <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                      Edit Batch Details
                    </>
                  ) : form.copyFromBatchId ? (
                    <>
                      <Copy className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                      Duplicate & Create New Batch
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                      Create New Batch
                    </>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                {editingBatch
                  ? 'Update batch title, admission fee, classroom capacity, and live schedule.'
                  : 'Configure batch details. Cloned batches receive an independent copy of all modules and lessons.'}
              </p>

              <form onSubmit={handleSaveBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Class 10 Physics - Special Batch 2"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Associated Course *
                  </label>
                  <select
                    required
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select a Course...</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.gradeLevel} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CRITICAL FEATURE: Copy content setting (Only visible when creating new) */}
                {!editingBatch && (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5" /> Copy Content From Existing Batch? (Optional)
                    </label>
                    <select
                      value={form.copyFromBatchId}
                      onChange={(e) => setForm({ ...form, copyFromBatchId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Start with an empty batch</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          Clone from: {b.name} ({b.courseId?.title})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Copies all modules, sections, lessons, YouTube video IDs, and PDF references into an isolated tree. Modifying the new batch will not affect the source.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Batch Fee (৳ BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={form.fee}
                      onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Student Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Schedule Text
                  </label>
                  <input
                    type="text"
                    value={form.scheduleText}
                    onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                    placeholder="e.g. Mon, Wed, Fri 8:00 PM"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingBatch
                      ? 'Update Batch'
                      : form.copyFromBatchId
                      ? 'Duplicate & Create'
                      : 'Create Batch'}
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
