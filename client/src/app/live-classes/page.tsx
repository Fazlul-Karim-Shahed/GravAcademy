'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Video,
  Calendar,
  Clock,
  PlusCircle,
  ExternalLink,
  Users,
  CheckCircle,
  X,
  Radio,
  Tv,
  ArrowRight
} from 'lucide-react';

interface LiveClassItem {
  _id: string;
  title: string;
  provider: 'zoom' | 'google_meet';
  meetingUrl: string;
  startTime: string;
  durationMinutes: number;
  batchId?: {
    name: string;
  };
  teacherId?: {
    name: string;
  };
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    batchId: '',
    title: '',
    provider: 'google_meet' as 'zoom' | 'google_meet',
    meetingUrl: '',
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    durationMinutes: 60,
  });

  useEffect(() => {
    loadLiveClasses();
  }, []);

  const loadLiveClasses = async () => {
    setLoading(true);
    try {
      const [classRes, batchRes] = await Promise.all([
        api.get('/live-classes'),
        api.get('/batches'),
      ]);
      if (classRes.data?.success) setClasses(classRes.data.data);
      if (batchRes.data?.success) setBatches(batchRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/live-classes', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
      });
      setShowModal(false);
      loadLiveClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Live Sessions
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Video className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Live Classes & Meetings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Zoom and Google Meet scheduled online sessions for coaching cohorts.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Schedule Live Class
          </button>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl text-center py-16 px-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No upcoming live classes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Schedule a Zoom or Google Meet interactive session for any active batch.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Schedule First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                        cls.provider === 'google_meet'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                          : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50'
                      }`}
                    >
                      {cls.provider === 'google_meet' ? 'Google Meet' : 'Zoom'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {cls.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
                    Cohort: <strong className="text-slate-800 dark:text-slate-200">{cls.batchId?.name || 'All Batches'}</strong>
                  </p>

                  <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-6">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium">{new Date(cls.startTime).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={cls.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Join Session</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCHEDULE MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Schedule Live Class
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch Cohort *
                  </label>
                  <select
                    required
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">Select a batch...</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Weekly Doubt Clearing & Problem Solving"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Provider
                    </label>
                    <select
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      value={form.durationMinutes}
                      onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.meetingUrl}
                    onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                    placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
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
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Class'}
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
