'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Button } from '@/components/ui';
import {
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Resource {
  _id: string;
  title: string;
  type: string;
  fileAssetId?: {
    _id: string;
    originalName: string;
    sizeBytes: number;
    mimeType: string;
    googleDriveFileId: string;
  };
  externalUrl?: string;
}

interface Lesson {
  _id: string;
  title: string;
  order: number;
  description?: string;
  youtubeVideoId?: string;
  videoDurationSeconds?: number;
  resources: Resource[];
  isPublished: boolean;
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

interface BatchHierarchyData {
  batch: {
    _id: string;
    name: string;
    courseId: {
      _id: string;
      title: string;
      gradeLevel: string;
      subject: string;
    };
  };
  modules: Module[];
}

export const dynamic = 'force-dynamic';

export default function LearningRoomPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<BatchHierarchyData | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHierarchy();
  }, [resolvedParams.batchId]);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${resolvedParams.batchId}/hierarchy`);
      if (res.data.success) {
        setData(res.data.data);

        // Expand all modules by default
        const exp: Record<string, boolean> = {};
        res.data.data.modules.forEach((m: Module) => {
          exp[m._id] = true;
        });
        setExpandedModules(exp);

        // Set first lesson active
        for (const m of res.data.data.modules) {
          if (m.directLessons?.length > 0) {
            setActiveLesson(m.directLessons[0]);
            break;
          }
          if (m.sections?.length > 0 && m.sections[0].lessons?.length > 0) {
            setActiveLesson(m.sections[0].lessons[0]);
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load batch hierarchy', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Batch curriculum not found</h2>
        <Link href="/courses" className="text-blue-400 text-sm mt-3 inline-block">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/courses" className="hover:text-blue-400">Courses</Link>
            <span>/</span>
            <span className="text-slate-300">{data.batch.courseId?.title}</span>
            <span>/</span>
            <span className="text-blue-400 font-semibold">{data.batch.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {activeLesson ? activeLesson.title : data.batch.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area: YouTube Video & Resources */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <>
              {/* YouTube Embedded Video Player */}
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video relative shadow-2xl">
                {activeLesson.youtubeVideoId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?rel=0&modestbranding=1`}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <Video className="w-12 h-12 mb-2 stroke-[1.5]" />
                    <p className="text-sm">No recorded lecture attached to this lesson.</p>
                  </div>
                )}
              </div>

              {/* Lesson Overview & Notes */}
              <Card className="border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-2">Lesson Notes & Overview</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeLesson.description || 'No detailed instructions provided for this lesson.'}
                </p>

                {/* Attached Documents (Google Drive Synced) */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" /> Attached Educational Materials
                  </h4>

                  {activeLesson.resources && activeLesson.resources.length > 0 ? (
                    <div className="space-y-2">
                      {activeLesson.resources.map((res, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-white block">{res.title}</span>
                              <span className="text-[11px] text-slate-500 uppercase">
                                {res.type} • Google Drive Storage
                              </span>
                            </div>
                          </div>

                          {res.fileAssetId ? (
                            <a
                              href={`http://localhost:5000/api/v1/documents/${res.fileAssetId._id}/stream`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Open / Download
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Reference asset</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No PDF documents or worksheets attached to this lesson.</p>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">Select a lesson to begin</h3>
              <p className="text-xs text-slate-400 mt-1">Choose from the curriculum sidebar on the right.</p>
            </Card>
          )}
        </div>

        {/* Sidebar: Curriculum Hierarchy Tree */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> Course Curriculum
            </h2>
          </div>

          <div className="space-y-3">
            {data.modules.map((mod, modIdx) => (
              <div
                key={mod._id}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden"
              >
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(mod._id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-200">
                    {mod.title}
                  </span>
                  {expandedModules[mod._id] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Module Lessons & Sections */}
                {expandedModules[mod._id] && (
                  <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-800/60">
                    {/* Direct Lessons in Module */}
                    {mod.directLessons?.map((lesson) => (
                      <button
                        key={lesson._id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          activeLesson?._id === lesson._id
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Video className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {activeLesson?._id === lesson._id && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        )}
                      </button>
                    ))}

                    {/* Sections */}
                    {mod.sections?.map((sec) => (
                      <div key={sec._id} className="mt-2 pl-2 border-l border-slate-800 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 block py-1">
                          {sec.title}
                        </span>
                        {sec.lessons?.map((lesson) => (
                          <button
                            key={lesson._id}
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              activeLesson?._id === lesson._id
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Video className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            {activeLesson?._id === lesson._id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
