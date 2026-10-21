'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  GraduationCap,
  Layers,
  BookOpen,
  FileCheck2,
  Video,
  Upload,
  PlusCircle,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface Batch {
  _id: string;
  name: string;
  status: string;
  courseId: {
    title: string;
    gradeLevel: string;
    subject: string;
  };
  scheduleText?: string;
  capacity?: number;
}

export default function TeacherPanelPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick module creation modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeacherBatches();
  }, []);

  const loadTeacherBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/batches');
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/modules', {
        batchId: selectedBatchId,
        title: moduleTitle,
      });
      setShowModuleModal(false);
      setModuleTitle('');
      alert('Module added to batch curriculum successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add module');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-blue-950/20 to-slate-900/60">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Instructor Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Teacher Operations Panel
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Manage your assigned batches, upload lesson notes and worksheets, schedule live sessions, and review student progress.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Assigned Batches</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{batches.length} Batches</div>
          <span className="text-xs text-blue-400 mt-1 block">Class 6 to Class 10</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Sessions</span>
            <Video className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">Active</div>
          <span className="text-xs text-slate-500 mt-1 block">Zoom & Meet Dispatch</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Examinations</span>
            <FileCheck2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">MCQ Evaluated</div>
          <span className="text-xs text-purple-400 mt-1 block">Server-Side Auto-Grading</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Google Drive Pipeline</span>
            <Upload className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">Ready</div>
          <span className="text-xs text-emerald-400 mt-1 block">Auto-Sync Enabled</span>
        </Card>
      </div>

      {/* Batches Management */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Your Assigned Course Batches
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a batch to inspect curriculum or add new educational modules.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <Card key={batch._id} className="border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {batch.courseId?.gradeLevel || 'Class 6 - 12'}
                  </span>
                  <span className="text-[11px] font-semibold uppercase text-emerald-400">
                    {batch.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{batch.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{batch.courseId?.title}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <Link
                  href={`/learn/${batch._id}`}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => {
                    setSelectedBatchId(batch._id);
                    setShowModuleModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Add new module to this batch"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add Module</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QUICK ADD MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-2">Add Educational Module</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a chapter or topic block to the selected batch.
            </p>

            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Module Title
                </label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Quadratic Equations"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowModuleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Save Module
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
