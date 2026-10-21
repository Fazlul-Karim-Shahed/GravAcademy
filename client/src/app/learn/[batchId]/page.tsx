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
    scheduleText?: string;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 py-4 sm:py-5 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  কোর্সসমূহ
                </Link>
                <span>/</span>
                <Link href={courseLink} className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                  {data.batch.courseId?.title}
                </Link>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{data.batch.name}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeLesson ? activeLesson.title : data.batch.name}
              </h1>
            </div>

            {/* Batch Routine Pill */}
            {data.batch.scheduleText && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{data.batch.scheduleText}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LEARNING WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 8 COLS: Video Player & Educational Notes */}
          <div className="lg:col-span-8 space-y-6">
            {activeLesson ? (
              <>
                {/* Embedded Video Container */}
                <div className="rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-black aspect-video relative shadow-xl">
                  {activeLesson.youtubeVideoId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?rel=0&modestbranding=1`}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                        <Video className="w-7 h-7 text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">এই ক্লাসের কোনো রেকর্ডেড ভিডিও নেই</p>
                      <p className="text-xs text-slate-500 mt-1">লাইভ ক্লাসের সময় জুমে অংশ নিন অথবা লেকচার শিট পড়ে প্রস্তুতি নিন।</p>
                    </div>
                  )}
                </div>

                {/* Lesson Notes & Overview */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      ক্লাস বিবরণী ও নোট
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">
                    {activeLesson.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {activeLesson.description || 'এই ক্লাসের জন্য কোনো বিশেষ অতিরিক্ত নির্দেশনা দেওয়া হয়নি।'}
                  </p>

                  {/* Attached Documents / Google Drive Resources */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        সংযুক্ত লেকচার শিট ও হ্যান্ডনোট
                      </h4>
                    </div>

                    {activeLesson.resources && activeLesson.resources.length > 0 ? (
                      <div className="space-y-3">
                        {activeLesson.resources.map((res, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                                  {res.title}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                  {res.type} • গুগল ড্রাইভ স্টোরেজ
                                </span>
                              </div>
                            </div>

                            {res.fileAssetId ? (
                              <a
                                href={`http://localhost:5000/api/v1/documents/${res.fileAssetId._id}/stream`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> ওপেন / ডাউনলোড
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">রেফারেন্স ফাইল</span>
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">ক্লাস শুরু করতে ডানপাশের তালিকা থেকে নির্বাচন করুন</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ডানদিকের সিলেবাস মডিউল থেকে যেকোনো অধ্যায়ের পাঠে ক্লিক করুন।</p>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: Curriculum Hierarchy Tree */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    কোর্স কারিকুলাম
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {data.modules.length} টি অধ্যায়
                </span>
              </div>

              {data.modules.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-400 font-semibold">কোনো অধ্যায় পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.modules.map((mod) => (
                    <div
                      key={mod._id}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                    >
                      {/* Module Title Button */}
                      <button
                        onClick={() => toggleModule(mod._id)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {mod.title}
                        </span>
                        {expandedModules[mod._id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {/* Lessons in Module */}
                      {expandedModules[mod._id] && (
                        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                          {/* Direct Lessons */}
                          {mod.directLessons?.map((lesson) => (
                            <button
                              key={lesson._id}
                              onClick={() => setActiveLesson(lesson)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                activeLesson?._id === lesson._id
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{lesson.title}</span>
                              </div>
                              {activeLesson?._id === lesson._id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1" />
                              )}
                            </button>
                          ))}

                          {/* Nested Sections */}
                          {mod.sections?.map((sec) => (
                            <div key={sec._id} className="mt-2 pl-2 border-l-2 border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block py-1">
                                {sec.title}
                              </span>
                              {sec.lessons?.map((lesson) => (
                                <button
                                  key={lesson._id}
                                  onClick={() => setActiveLesson(lesson)}
                                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                    activeLesson?._id === lesson._id
                                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{lesson.title}</span>
                                  </div>
                                  {activeLesson?._id === lesson._id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1" />
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
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
