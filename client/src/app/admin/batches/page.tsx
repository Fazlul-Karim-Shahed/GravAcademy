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
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  status: string;
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
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    status: 'draft',
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {
        name: form.name,
        courseId: form.courseId,
        status: form.status,
        scheduleText: form.scheduleText,
        capacity: Number(form.capacity),
      };

      if (form.copyFromBatchId) {
        payload.copyFromBatchId = form.copyFromBatchId;
      }

      const res = await api.post('/batches', payload);
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: form.copyFromBatchId
            ? '✅ Batch created with cloned content hierarchy successfully!'
            : '✅ Batch created successfully!',
        });
        setShowCreateModal(false);
        setForm({
          name: '',
          courseId: '',
          status: 'draft',
          scheduleText: '',
          capacity: 40,
          copyFromBatchId: '',
        });
        loadData();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create batch.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-500" /> Batch Management & Duplication
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize student batches, schedule classes, and clone batch content hierarchies with zero coupling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/courses"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Manage Courses
          </Link>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 shrink-0">
            <PlusCircle className="w-4 h-4" /> Create New Batch
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Batch Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card className="text-center py-16">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No batches created yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create your first batch or clone an existing curriculum to get started.
          </p>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            Create Batch
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <Card key={batch._id} className="flex flex-col justify-between border border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                    {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                      batch.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : batch.status === 'upcoming'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{batch.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>{batch.courseId?.title || 'Unassigned Course'}</span>
                </p>

                {batch.scheduleText && (
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{batch.scheduleText}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/admin/batches/${batch._id}/curriculum`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/30 flex items-center gap-1 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Curriculum & Lessons</span>
                </Link>

                <button
                  onClick={() => {
                    setForm({ ...form, copyFromBatchId: batch._id, courseId: batch.courseId?._id || '' });
                    setShowCreateModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Clone this batch content to a new batch"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duplicate</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / DUPLICATE BATCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-500" />
              {form.copyFromBatchId ? 'Duplicate & Create New Batch' : 'Create New Batch'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Configure batch details. Cloned batches receive an independent copy of all modules and lessons.
            </p>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Class 10 Physics - Special Batch 2"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Associated Course
                </label>
                <select
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a Course...</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.gradeLevel} - {c.subject} ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              {/* CRITICAL FEATURE: Copy content setting */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
                <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy Content From Existing Batch? (Optional)
                </label>
                <select
                  value={form.copyFromBatchId}
                  onChange={(e) => setForm({ ...form, copyFromBatchId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Start with an empty batch</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      Clone from: {b.name} ({b.courseId?.title})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Copies all modules, sections, lessons, YouTube video IDs, and PDF references into an isolated tree. Modifying the new batch will not affect the source.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Schedule Text
                </label>
                <input
                  type="text"
                  value={form.scheduleText}
                  onChange={(e) => setForm({ ...form, scheduleText: e.target.value })}
                  placeholder="e.g. Mon, Wed, Fri 8:00 PM"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  {form.copyFromBatchId ? 'Duplicate & Create' : 'Create Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
