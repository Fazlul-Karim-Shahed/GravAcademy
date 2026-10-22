'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Layers,
  Plus,
  Trash2,
  Video,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  FolderPlus,
  Tv,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  HelpCircle,
  X,
  BookOpen,
  Edit2,
  Pencil,
  Upload,
  Paperclip,
  Loader2,
  Download
} from 'lucide-react';
import TextEditor from '@/components/ui/TextEditor';

interface Resource {
  _id?: string;
  title: string;
  type: string;
  fileAssetId?: {
    _id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    googleDriveFileId: string;
  } | string;
  externalUrl?: string;
}

interface Lesson {
  _id: string;
  title: string;
  order: number;
  description?: string;
  youtubeVideoId?: string;
  resources?: Resource[];
}

interface Section {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Module {
  _id: string;
  title: string;
  order: number;
  sections: Section[];
  directLessons: Lesson[];
}

export default function BatchCurriculumBuilderPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state: Add
  const [moduleModal, setModuleModal] = useState(false);
  const [sectionModal, setSectionModal] = useState<{ open: boolean; moduleId: string; moduleTitle?: string }>({
    open: false,
    moduleId: '',
  });
  const [lessonModal, setLessonModal] = useState<{
    open: boolean;
    moduleId: string;
    sectionId?: string;
    parentTitle?: string;
  }>({
    open: false,
    moduleId: '',
  });

  // Modals state: Edit
  const [editModuleModal, setEditModuleModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  });
  const [editSectionModal, setEditSectionModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  });
  const [editLessonModal, setEditLessonModal] = useState<{
    open: boolean;
    id: string;
    title: string;
    youtubeVideoId: string;
    description: string;
    resources: Resource[];
  }>({
    open: false,
    id: '',
    title: '',
    youtubeVideoId: '',
    description: '',
    resources: [],
  });

  // Forms: Add
  const [moduleTitle, setModuleTitle] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    description: string;
    youtubeVideoId: string;
    resources: Resource[];
  }>({
    title: '',
    description: '',
    youtubeVideoId: '',
    resources: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload to Google Drive via backend
  const handleUploadFile = async (
    file: File,
    onSuccess: (resource: Resource) => void
  ) => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data) {
        const fileAsset = res.data.data;
        let inferredType = 'pdf';
        if (file.type.includes('image')) inferredType = 'worksheet';
        else if (file.type.includes('word') || file.type.includes('officedocument')) inferredType = 'worksheet';

        const newResource: Resource = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          type: inferredType,
          fileAssetId: fileAsset,
        };

        onSuccess(newResource);
        setMessage({ type: 'success', text: `"${file.name}" সফলভাবে গুগল ড্রাইভে আপলোড হয়েছে!` });
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Upload failed.' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।' });
    } finally {
      setUploadingFile(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, [resolvedParams.batchId]);

  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${resolvedParams.batchId}/hierarchy`);
      if (res.data?.success) {
        setHierarchy(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load batch curriculum hierarchy.' });
    } finally {
      setLoading(false);
    }
  };

  // Helper for YouTube ID parsing
  const cleanYouTubeInput = (raw: string) => {
    let clean = raw.trim();
    if (clean.includes('v=')) {
      clean = clean.split('v=')[1]?.split('&')[0] || clean;
    } else if (clean.includes('youtu.be/')) {
      clean = clean.split('youtu.be/')[1]?.split('?')[0] || clean;
    }
    return clean;
  };

  // 1. Create Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/modules', {
        batchId: resolvedParams.batchId,
        title: moduleTitle.trim(),
      });
      setModuleModal(false);
      setModuleTitle('');
      setMessage({ type: 'success', text: 'Module added successfully!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add module' });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Edit Module
  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModuleModal.title.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/modules/${editModuleModal.id}`, {
        title: editModuleModal.title.trim(),
      });
      setEditModuleModal({ open: false, id: '', title: '' });
      setMessage({ type: 'success', text: 'Module updated successfully!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update module' });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Module
  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" and all its sections & lessons?`)) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setMessage({ type: 'success', text: 'Module removed.' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete module.' });
    }
  };

  // 4. Create Section
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/sections', {
        batchId: resolvedParams.batchId,
        moduleId: sectionModal.moduleId,
        title: sectionTitle.trim(),
      });
      setSectionModal({ open: false, moduleId: '' });
      setSectionTitle('');
      setMessage({ type: 'success', text: 'Section created!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add section' });
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Edit Section
  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSectionModal.title.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/sections/${editSectionModal.id}`, {
        title: editSectionModal.title.trim(),
      });
      setEditSectionModal({ open: false, id: '', title: '' });
      setMessage({ type: 'success', text: 'Section updated!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update section' });
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Delete Section
  const handleDeleteSection = async (sectionId: string, title: string) => {
    if (!confirm(`Delete section "${title}" and its lessons?`)) return;
    try {
      await api.delete(`/sections/${sectionId}`);
      setMessage({ type: 'success', text: 'Section deleted.' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete section' });
    }
  };

  // 7. Create Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    setSubmitting(true);
    try {
      const cleanYtId = cleanYouTubeInput(lessonForm.youtubeVideoId);
      // Format resources payload (extract fileAssetId if object)
      const formattedResources = lessonForm.resources.map((r) => ({
        title: r.title,
        type: r.type,
        fileAssetId: typeof r.fileAssetId === 'object' ? r.fileAssetId?._id : r.fileAssetId,
        externalUrl: r.externalUrl,
      }));

      await api.post('/lessons', {
        batchId: resolvedParams.batchId,
        moduleId: lessonModal.moduleId,
        sectionId: lessonModal.sectionId,
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        youtubeVideoId: cleanYtId,
        resources: formattedResources,
      });
      setLessonModal({ open: false, moduleId: '' });
      setLessonForm({ title: '', description: '', youtubeVideoId: '', resources: [] });
      setMessage({ type: 'success', text: 'Lesson added successfully!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add lesson' });
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Edit Lesson
  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLessonModal.title.trim()) return;
    setSubmitting(true);
    try {
      const cleanYtId = cleanYouTubeInput(editLessonModal.youtubeVideoId);
      const formattedResources = editLessonModal.resources.map((r) => ({
        title: r.title,
        type: r.type,
        fileAssetId: typeof r.fileAssetId === 'object' ? r.fileAssetId?._id : r.fileAssetId,
        externalUrl: r.externalUrl,
      }));

      await api.put(`/lessons/${editLessonModal.id}`, {
        title: editLessonModal.title.trim(),
        youtubeVideoId: cleanYtId,
        description: editLessonModal.description.trim(),
        resources: formattedResources,
      });
      setEditLessonModal({ open: false, id: '', title: '', youtubeVideoId: '', description: '', resources: [] });
      setMessage({ type: 'success', text: 'Lesson updated!' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update lesson' });
    } finally {
      setSubmitting(false);
    }
  };

  // 9. Delete Lesson
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setMessage({ type: 'success', text: 'Lesson deleted.' });
      loadHierarchy();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to delete lesson' });
    }
  };

  // Stats
  const totalModules = hierarchy?.modules?.length || 0;
  let totalLessons = 0;
  let totalSections = 0;
  if (hierarchy?.modules) {
    hierarchy.modules.forEach((m: Module) => {
      totalLessons += (m.directLessons?.length || 0);
      totalSections += (m.sections?.length || 0);
      m.sections?.forEach((s: Section) => {
        totalLessons += (s.lessons?.length || 0);
      });
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-6" />
          <div className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!hierarchy) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
          <Link
            href="/admin/batches"
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Batches
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-semibold">{hierarchy.batch.name}</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">Curriculum</span>
        </div>

        {/* Fresh Hero Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {hierarchy.batch.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Parent Course:{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {hierarchy.batch.courseId?.title}
                </span>{' '}
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-1.5 font-medium">
                  {hierarchy.batch.courseId?.gradeLevel}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click the <strong>pencil icon</strong> on any module, section, or lecture to edit names and parameters.
                </span>
              </p>
            </div>

            {/* Quick Actions & Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/learn/${hierarchy.batch._id}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Preview Student Room
              </Link>
              <button
                type="button"
                onClick={() => setModuleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Module
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{totalModules}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Modules</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{totalSections}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sections</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{totalLessons}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lectures</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between gap-3 shadow-2xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {hierarchy.modules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Curriculum is currently empty</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Create your first learning module to start organizing chapters, structured sections, and YouTube lecture links.
            </p>
            <button
              type="button"
              onClick={() => setModuleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Create First Module
            </button>
          </div>
        ) : (
          /* Modules Accordion / Card Feed */
          <div className="space-y-6">
            {hierarchy.modules.map((mod: Module, modIdx: number) => {
              const moduleLessonCount = (mod.directLessons?.length || 0) + (mod.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0);

              return (
                <div
                  key={mod._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden"
                >
                  {/* Module Header Bar */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-xs font-extrabold shadow-2xs">
                        {modIdx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {mod.title}
                          </h3>
                          {/* Edit Module Button */}
                          <button
                            type="button"
                            onClick={() => setEditModuleModal({ open: true, id: mod._id, title: mod.title })}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                            title="Edit Module Title"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {mod.sections?.length || 0} Sections • {moduleLessonCount} Total Lessons
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSectionModal({ open: true, moduleId: mod._id, moduleTitle: mod.title })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Section</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLessonModal({ open: true, moduleId: mod._id, parentTitle: mod.title })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/80 dark:border-blue-700/40 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lesson</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteModule(mod._id, mod.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Direct Lessons in Module */}
                    {mod.directLessons && mod.directLessons.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Direct Lessons
                        </p>
                        <div className="space-y-2">
                          {mod.directLessons.map((lesson) => (
                            <div
                              key={lesson._id}
                              className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                  <Video className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                                      {lesson.title}
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditLessonModal({
                                          open: true,
                                          id: lesson._id,
                                          title: lesson.title,
                                          youtubeVideoId: lesson.youtubeVideoId || '',
                                          description: lesson.description || '',
                                          resources: lesson.resources || [],
                                        })
                                      }
                                      className="opacity-60 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                      title="Edit Lesson"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {lesson.youtubeVideoId ? (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                                        <Tv className="w-2.5 h-2.5" /> YouTube ID:
                                      </span>
                                      <code className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                        {lesson.youtubeVideoId}
                                      </code>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                      No video attached
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                                className="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sections within Module */}
                    {mod.sections && mod.sections.length > 0 && (
                      <div className="space-y-4 pt-1">
                        {mod.sections.map((sec) => (
                          <div
                            key={sec._id}
                            className="bg-slate-50/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 transition-colors"
                          >
                            {/* Section Header */}
                            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  {sec.title}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setEditSectionModal({ open: true, id: sec._id, title: sec.title })}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                  title="Edit Section Title"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                  ({sec.lessons?.length || 0} lectures)
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLessonModal({
                                      open: true,
                                      moduleId: mod._id,
                                      sectionId: sec._id,
                                      parentTitle: `${mod.title} → ${sec.title}`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Lesson
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSection(sec._id, sec.title)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                  title="Delete Section"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Section Lessons */}
                            {sec.lessons && sec.lessons.length > 0 ? (
                              <div className="space-y-2">
                                {sec.lessons.map((lesson) => (
                                  <div
                                    key={lesson._id}
                                    className="group flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <Video className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-medium text-slate-900 dark:text-slate-200">
                                            {lesson.title}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditLessonModal({
                                                open: true,
                                                id: lesson._id,
                                                title: lesson.title,
                                                youtubeVideoId: lesson.youtubeVideoId || '',
                                                description: lesson.description || '',
                                                resources: lesson.resources || [],
                                              })
                                            }
                                            className="opacity-50 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                            title="Edit Lesson"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                        </div>
                                        {lesson.youtubeVideoId && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                              ID: <span className="font-mono">{lesson.youtubeVideoId}</span>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                                      className="opacity-70 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                                No lessons in this section yet. Click &apos;+ Add Lesson&apos; above.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Zero Lessons/Sections placeholder inside module */}
                    {(!mod.directLessons || mod.directLessons.length === 0) &&
                      (!mod.sections || mod.sections.length === 0) && (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            This module has no sections or direct lessons yet.
                          </p>
                          <div className="flex items-center justify-center gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => setSectionModal({ open: true, moduleId: mod._id, moduleTitle: mod.title })}
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600"
                            >
                              + Add Section
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => setLessonModal({ open: true, moduleId: mod._id, parentTitle: mod.title })}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              + Add Direct Lesson
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            MODAL 1: ADD MODULE
           ======================================================== */}
        {moduleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Curriculum Module</h3>
                </div>
                <button
                  onClick={() => setModuleModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="e.g. Chapter 3: Newton's Laws of Motion"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Modules group related sections and video lessons into a unified chapter.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModuleModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 1B: EDIT MODULE
           ======================================================== */}
        {editModuleModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Module</h3>
                </div>
                <button
                  onClick={() => setEditModuleModal({ open: false, id: '', title: '' })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editModuleModal.title}
                    onChange={(e) => setEditModuleModal({ ...editModuleModal, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModuleModal({ open: false, id: '', title: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Update Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: ADD SECTION
           ======================================================== */}
        {sectionModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Section</h3>
                    {sectionModal.moduleTitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        In: {sectionModal.moduleTitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSectionModal({ open: false, moduleId: '' })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSection} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="e.g. 3.1 Inertia and Momentum"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSectionModal({ open: false, moduleId: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2B: EDIT SECTION
           ======================================================== */}
        {editSectionModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Section</h3>
                </div>
                <button
                  onClick={() => setEditSectionModal({ open: false, id: '', title: '' })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSection} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSectionModal.title}
                    onChange={(e) => setEditSectionModal({ ...editSectionModal, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditSectionModal({ open: false, id: '', title: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Update Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 3: ADD LESSON
           ======================================================== */}
        {lessonModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Lecture / Lesson</h3>
                    {lessonModal.parentTitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lessonModal.parentTitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setLessonModal({ open: false, moduleId: '' })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Lecture 1: Concept & Problem Solving"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    YouTube Video ID or Full Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={lessonForm.youtubeVideoId}
                    onChange={(e) => setLessonForm({ ...lessonForm, youtubeVideoId: e.target.value })}
                    placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Paste the 11-character video ID or full YouTube link.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    লেসন নোট ও নির্দেশনাসমূহ (Lesson Notes / Instructions)
                  </label>
                  <TextEditor
                    value={lessonForm.description}
                    onChange={(val) => setLessonForm({ ...lessonForm, description: val })}
                    placeholder="এখানে লেসনের বিস্তারিত নোট, কনসেপ্ট বা গাইডলাইন লিখুন..."
                    minHeight="140px"
                  />
                </div>

                {/* Lecture Material Upload Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      সংযুক্ত লেকচার শিট ও ফাইল (PDF / Sheet / Image)
                    </label>
                  </div>

                  {/* Upload input button */}
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group">
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {uploadingFile ? 'আপলোড হচ্ছে...' : 'ফাইল যুক্ত করুন (PDF, DOCX, JPG/PNG)'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">সর্বোচ্চ ২৫ মেগাবাইট পর্যন্ত ফাইল সমর্থন করে</p>
                    <input
                      type="file"
                      disabled={uploadingFile}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadFile(file, (newRes) => {
                            setLessonForm((prev) => ({
                              ...prev,
                              resources: [...prev.resources, newRes],
                            }));
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  {/* List of Attached Resources */}
                  {lessonForm.resources && lessonForm.resources.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        সংযুক্ত ম্যাটেরিয়ালসমূহ ({lessonForm.resources.length}):
                      </span>
                      {lessonForm.resources.map((res, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {res.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded">
                              {res.type}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLessonForm((prev) => ({
                                ...prev,
                                resources: prev.resources.filter((_, idx) => idx !== rIdx),
                              }));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLessonModal({ open: false, moduleId: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingFile}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Lesson'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 3B: EDIT LESSON
           ======================================================== */}
        {editLessonModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
              <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">লেসন সম্পাদনা (Edit Lesson)</h3>
                </div>
                <button
                  onClick={() => setEditLessonModal({ open: false, id: '', title: '', youtubeVideoId: '', description: '', resources: [] })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLesson} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    লেসন শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLessonModal.title}
                    onChange={(e) => setEditLessonModal({ ...editLessonModal, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    YouTube ভিডিও লিংক বা আইডি
                  </label>
                  <input
                    type="text"
                    value={editLessonModal.youtubeVideoId}
                    onChange={(e) => setEditLessonModal({ ...editLessonModal, youtubeVideoId: e.target.value })}
                    placeholder="dQw4w9WgXcQ অথবা https://youtu.be/..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    লেসন নোট ও নির্দেশনাসমূহ
                  </label>
                  <TextEditor
                    value={editLessonModal.description}
                    onChange={(val) => setEditLessonModal({ ...editLessonModal, description: val })}
                    placeholder="এখানে লেসনের বিস্তারিত নোট, কনসেপ্ট বা গাইডলাইন লিখুন..."
                    minHeight="140px"
                  />
                </div>

                {/* Materials Section in Edit Modal */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    সংযুক্ত লেকচার শিট ও ফাইল (PDF / Sheet / Image)
                  </label>

                  {/* Upload input button */}
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group">
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {uploadingFile ? 'আপলোড হচ্ছে...' : 'ফাইল যুক্ত করুন (PDF, DOCX, JPG/PNG)'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">সর্বোচ্চ ২৫ মেগাবাইট পর্যন্ত ফাইল সমর্থন করে</p>
                    <input
                      type="file"
                      disabled={uploadingFile}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadFile(file, (newRes) => {
                            setEditLessonModal((prev) => ({
                              ...prev,
                              resources: [...prev.resources, newRes],
                            }));
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  {/* List of Attached Resources */}
                  {editLessonModal.resources && editLessonModal.resources.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        সংযুক্ত ম্যাটেরিয়ালসমূহ ({editLessonModal.resources.length}):
                      </span>
                      {editLessonModal.resources.map((res, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {res.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded">
                              {res.type}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditLessonModal((prev) => ({
                                ...prev,
                                resources: prev.resources.filter((_, idx) => idx !== rIdx),
                              }));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditLessonModal({ open: false, id: '', title: '', youtubeVideoId: '', description: '', resources: [] })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingFile}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সম্পন্ন করুন'}
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
