'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ChevronDown,
  Clock,
  Download,
  ArrowLeft,
  Calendar,
  PlayCircle,
  ExternalLink,
  Eye,
  X,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { ScheduleSlot, getDayInfo, formatTo12Hour } from '@/lib/schedule';

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
    scheduleText?: string;
    weeklySchedule?: ScheduleSlot[];
    meetingUrl?: string;
    courseId: {
      _id: string;
      title: string;
      slug?: string;
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

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    open: boolean;
    title: string;
    url: string;
    directDriveUrl?: string;
    isFullScreen?: boolean;
  } | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    fetchHierarchy();
  }, [resolvedParams.batchId]);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${resolvedParams.batchId}/hierarchy`);
      if (res.data?.success) {
        const hierarchyData: BatchHierarchyData = res.data.data;
        setData(hierarchyData);

        // Expand all modules by default
        const exp: Record<string, boolean> = {};
        let firstFoundLesson: Lesson | null = null;

        hierarchyData.modules.forEach((m: Module) => {
          exp[m._id] = true;
          if (!firstFoundLesson) {
            if (m.directLessons && m.directLessons.length > 0) {
              firstFoundLesson = m.directLessons[0];
            } else if (m.sections && m.sections.length > 0 && m.sections[0].lessons && m.sections[0].lessons.length > 0) {
              firstFoundLesson = m.sections[0].lessons[0];
            }
          }
        });

        setExpandedModules(exp);
        if (firstFoundLesson) {
          setActiveLesson(firstFoundLesson);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse shadow-xs" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">ব্যাচের কারিকুলাম পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            এই ব্যাচে এখনও কোনো ক্লাস বা পাঠপরিকল্পনা যুক্ত করা হয়নি।
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল কোর্সে ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  const courseLink = `/courses/${data.batch.courseId?.slug || data.batch.courseId?._id}`;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. TOP HEADER - Sleek, Minimalist & Focused */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="ড্যাশবোর্ডে ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    ড্যাশবোর্ড
                  </Link>
                  <span>/</span>
                  <Link href={courseLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[150px] sm:max-w-xs">
                    {data.batch.courseId?.title}
                  </Link>
                  <span>/</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate max-w-[150px]">
                    {data.batch.name}
                  </span>
                </div>

                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 line-clamp-1">
                  {activeLesson ? activeLesson.title : data.batch.name}
                </h1>
              </div>
            </div>

            {/* Quick Live Classroom Action Button */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              {data.batch.meetingUrl && (
                <a
                  href={data.batch.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all"
                  title="Google Meet-এ লাইভ ক্লাসরুমে প্রবেশ করুন"
                >
                  <Video className="w-4 h-4" />
                  <span>ক্লাসরুমে প্রবেশ (Google Meet)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LEARNING WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT 8 COLS: Video Player & Educational Notes */}
          <div className="lg:col-span-8 space-y-6">
            {activeLesson ? (
              <>
                {/* Embedded Video Container */}
                <div className="rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-950 aspect-video relative shadow-lg">
                  {activeLesson.youtubeVideoId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?rel=0&modestbranding=1`}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-radial from-slate-900 to-slate-950">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 flex items-center justify-center mb-3 shadow-inner">
                        <Video className="w-7 h-7 text-slate-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">এই ক্লাসের কোনো রেকর্ডেড ভিডিও নেই</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        লাইভ ক্লাসের সময় সরাসরি ক্লাসরুমে অংশ নিন অথবা নিচের লেকচার শিট পড়ে প্রস্তুতি সম্পন্ন করুন।
                      </p>
                    </div>
                  )}
                </div>

                {/* Lesson Notes & Overview */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        ক্লাস বিবরণী ও রিসোর্স
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      {activeLesson.resources?.length || 0} টি সংযুক্ত ফাইল
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    {activeLesson.title}
                  </h2>

                  {activeLesson.description ? (
                    <div
                      className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal prose prose-slate dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: activeLesson.description }}
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-400 italic">
                      এই ক্লাসের জন্য কোনো বিশেষ অতিরিক্ত নির্দেশনা দেওয়া হয়নি।
                    </p>
                  )}

                  {/* Attached Documents / Google Drive Resources */}
                  <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 mb-3.5">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        সংযুক্ত লেকচার শিট ও হ্যান্ডনোট
                      </h3>
                    </div>

                    {activeLesson.resources && activeLesson.resources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeLesson.resources.map((res, i) => (
                          <div
                            key={i}
                            className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all shadow-2xs hover:shadow-xs"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 block">
                                  {res.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                  {res.type}
                                </span>
                              </div>
                            </div>

                            {res.fileAssetId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const driveId = res.fileAssetId?.googleDriveFileId;
                                  const previewUrl = driveId && !driveId.startsWith('stub_')
                                    ? `https://drive.google.com/file/d/${driveId}/preview`
                                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/documents/${res.fileAssetId?._id}/stream`;
                                  setDocLoading(true);
                                  setPreviewDoc({
                                    open: true,
                                    title: res.title,
                                    url: previewUrl,
                                    isFullScreen: false,
                                  });
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>ডকুমেন্ট দেখুন</span>
                              </button>
                            ) : res.externalUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDocLoading(true);
                                  setPreviewDoc({
                                    open: true,
                                    title: res.title,
                                    url: res.externalUrl!,
                                    directDriveUrl: res.externalUrl,
                                    isFullScreen: false,
                                  });
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>লিংক দেখুন</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic text-center py-1">
                                রেফারেন্স ফাইল
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">এই পাঠের সাথে কোনো পিডিএফ শিট বা হ্যান্ডনোট যুক্ত নেই।</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">ক্লাস শুরু করতে তালিকা থেকে নির্বাচন করুন</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ডানদিকের সিলেবাস মডিউল থেকে যেকোনো অধ্যায়ের পাঠে ক্লিক করুন।</p>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: Modern Playlist Style Curriculum Hierarchy */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <BookOpen className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    কোর্স কারিকুলাম
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {data.modules.length} টি অধ্যায়
                </span>
              </div>

              {/* Module Accordions with Internal Scroll */}
              {data.modules.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400 font-semibold">কোনো অধ্যায় পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-1 scrollbar-thin">
                  {data.modules.map((mod, mIdx) => (
                    <div
                      key={mod._id}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-slate-50/60 dark:bg-slate-950/40"
                    >
                      {/* Module Title Button */}
                      <button
                        onClick={() => toggleModule(mod._id)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {mIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {mod.title}
                          </span>
                        </div>
                        {expandedModules[mod._id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {/* Lessons in Module */}
                      {expandedModules[mod._id] && (
                        <div className="px-2.5 pb-2.5 pt-1 space-y-1 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                          {/* Direct Lessons */}
                          {mod.directLessons?.map((lesson) => {
                            const isSelected = activeLesson?._id === lesson._id;
                            return (
                              <button
                                key={lesson._id}
                                onClick={() => setActiveLesson(lesson)}
                                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <PlayCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                  <span className="truncate">{lesson.title}</span>
                                </div>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}

                          {/* Nested Sections */}
                          {mod.sections?.map((sec) => (
                            <div key={sec._id} className="mt-2 pl-2 border-l-2 border-blue-500/30 dark:border-blue-400/20 space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block py-0.5">
                                {sec.title}
                              </span>
                              {sec.lessons?.map((lesson) => {
                                const isSelected = activeLesson?._id === lesson._id;
                                return (
                                  <button
                                    key={lesson._id}
                                    onClick={() => setActiveLesson(lesson)}
                                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <PlayCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                      <span className="truncate">{lesson.title}</span>
                                    </div>
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* IN-APP DOCUMENT PREVIEW POPUP MODAL */}
      {previewDoc?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
              previewDoc.isFullScreen
                ? 'fixed inset-2 sm:inset-4 rounded-2xl z-50'
                : 'w-full max-w-5xl h-[88vh] rounded-3xl'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {previewDoc.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    লেকচার নোট ও স্টাডি ফাইল
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc((prev) => (prev ? { ...prev, isFullScreen: !prev.isFullScreen } : null))
                  }
                  title={previewDoc.isFullScreen ? 'রিস্টোর' : 'ফুলস্ক্রিন'}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  {previewDoc.isFullScreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  title="বন্ধ করুন"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe Viewer */}
            <div className="relative flex-1 w-full h-full bg-slate-100 dark:bg-slate-950">
              {docLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/90 dark:bg-slate-900/90 z-10">
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    লেকচার শিট লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
                  </p>
                </div>
              )}

              <iframe
                src={previewDoc.url}
                className="w-full h-full border-0"
                allow="autoplay"
                title={previewDoc.title}
                onLoad={() => setDocLoading(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
