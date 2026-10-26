'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle2,
  Users,
  Video,
  ChevronRight,
  Award,
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronDown,
  Layers,
  Star,
  Check,
  Calendar,
  MessageCircle,
  Trophy,
  Target,
  Backpack,
  ScrollText,
  Tent,
  BookOpenCheck,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';
import { UserAvatar } from '@/components/common/UserAvatar';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  gradeLevel: string;
  courseFee: number;
  regularPrice?: number;
  discountPrice?: number;
  duration?: string;
  batchCount?: number;
  instructors?: any[];
  curriculumHighlights?: string[];
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [dynamicClasses, setDynamicClasses] = useState<AcademicClassItem[]>([]);
  const classList = ['All', ...dynamicClasses.map((c) => c.name)];

  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedCourses();
    fetchDynamicClasses();
    fetchTeachers();
  }, []);

  const fetchDynamicClasses = async () => {
    const list = await getSharedAcademicClasses();
    setDynamicClasses(list);
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      if (res.data?.success && res.data.data?.length > 0) {
        setDbTeachers(res.data.data);
      }
    } catch (err) {
      // Fallback to static list gracefully
    }
  };

  const fetchFeaturedCourses = async () => {
    try {
      const res = await api.get('/courses', { params: { isPublished: true } });
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load courses on homepage', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const filteredCourses =
    selectedClass === 'All'
      ? courses
      : courses.filter((c) => c.gradeLevel.toLowerCase() === selectedClass.toLowerCase());

  const faqs = [
    {
      q: 'গ্র্যাভ একাডেমিতে ক্লাস কীভাবে পরিচালিত হয়?',
      a: 'আমাদের প্রতিটি কোর্সে রুটিন অনুযায়ী লাইভ ক্লাস নেওয়া হয়। লাইভ ক্লাস শেষ হওয়ার সাথে সাথেই হাই-ডেফিনিশন রেকর্ডেড ক্লাস স্টুডেন্ট ড্যাশবোর্ডে যুক্ত হয়ে যায়, যাতে শিক্ষার্থীরা যেকোনো সময় রিভিশন দিতে পারে।',
    },
    {
      q: 'ক্লাসের নোটস বা লেকচার শিট কীভাবে পাওয়া যাবে?',
      a: 'প্রতিটি অধ্যায়ের কনসেপ্ট শিট, ফর্মুলা বুকলেট ও বিগত বছরের প্রশ্ন সমাধানের পিডিএফ সরাসরি স্টুডেন্ট পোর্টাল ও গুগল ড্রাইভ থেকে এক ক্লিকেই সহজে ডাউনলোড করা যায়।',
    },
    {
      q: 'কোনো বিষয়ে পড়া বুঝতে সমস্যা হলে বা ডাউট থাকলে কীভাবে সমাধান পাব?',
      a: 'লাইভ ক্লাসে সরাসরি শিক্ষকদের প্রশ্ন করার সুযোগ রয়েছে। এছাড়া কোর্সে এনরোল্ড শিক্ষার্থীদের জন্য সার্বক্ষণিক ডেডিকেটেড ডাউট-সলভিং সাপোর্ট ও সাপ্তাহিক বিশেষ রিভিশন ক্লাস অনুষ্ঠিত হয়।',
    },
    {
      q: 'পরীক্ষা বা মডেল টেস্টের মূল্যায়ন কীভাবে করা হয়?',
      a: 'প্রতিটি চ্যাপ্টার শেষে অটোমেটেড অনলাইন এমসিকিউ (MCQ) এবং বোর্ড স্ট্যান্ডার্ড রিটেন পরীক্ষা নেওয়া হয়। পরীক্ষা শেষেই শিক্ষার্থী তার প্রাপ্ত নম্বর, বিস্তারিত ব্যাখ্যা এবং মেধা তালিকা দেখতে পায়।',
    },
    {
      q: 'কোর্সে কীভাবে ভর্তি বা ফি পেমেন্ট করব?',
      a: 'কোর্সের "বিস্তারিত ও ভর্তি" বাটনে ক্লিক করে যেকোনো উপযুক্ত ব্যাচ নির্বাচন করে বিকাশ, নগদ বা কার্ডের মাধ্যমে সম্পূর্ণ অনলাইনে ভর্তি সম্পন্ন করা যায়।',
    },
  ];

  const defaultInstructors = [
    {
      name: 'মাহমুদুল হাসান',
      institution: '',
      department: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং',
      exp: '৮+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান'],
      badge: 'মাস্টার ট্রেইনার',
      studentsCount: '১৫,০০০+',
      classesCount: '৪৫০+ লাইভ ক্লাস',
      photo: '/images/teacher-2.jpg',
    },
    {
      name: 'রফিকুল ইসলাম',
      institution: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
      department: 'ফলিত রসায়ন ও কেমিকৌশল বিভাগ',
      exp: '৬+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['রসায়ন', 'সাধারণ বিজ্ঞান'],
      badge: 'বোর্ড স্পেশালিস্ট',
      studentsCount: '১২,০০০+',
      classesCount: '৩৮০+ লাইভ ক্লাস',
      photo: '/images/teacher-3.jpg',
    },
    {
      name: 'তানভীর আহমেদ',
      institution: 'ঢাকা মেডিকেল কলেজ (DMC)',
      department: 'এমবিবিএস (MBBS)',
      exp: '৫+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['জীববিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি'],
      badge: 'সিনিয়র মেন্টর',
      studentsCount: '১০,০০০+',
      classesCount: '৩২০+ লাইভ ক্লাস',
      photo: '/images/teacher-1.jpg',
    },
    {
      name: 'ফারজানা আক্তার',
      institution: 'বুয়েট (BUET - EEE)',
      department: 'তড়িৎ ও ইলেকট্রনিক কৌশল',
      exp: '৬+ বছরের শিক্ষকতা অভিজ্ঞতা',
      subjects: ['পদার্থবিজ্ঞান', 'উচ্চতর গণিত'],
      badge: 'কনসেপ্ট স্পেশালিস্ট',
      studentsCount: '১১,০০০+',
      classesCount: '৩৬০+ লাইভ ক্লাস',
      photo: '/images/teacher-2.jpg',
    },
  ];

  // If DB teachers exist, prioritize them, and fill remaining slots from defaultInstructors so 4 cards always show
  const mappedDbTeachers = dbTeachers.map((t) => ({
    name: t.name,
    institution: t.teacherDetails?.institution || '',
    department: t.teacherDetails?.department || 'বিষয়ভিত্তিক স্পেশালিস্ট',
    exp: t.teacherDetails?.experience || 'অভিজ্ঞ মেন্টর',
    subjects:
      t.teacherDetails?.specialistSubjects && t.teacherDetails.specialistSubjects.length > 0
        ? t.teacherDetails.specialistSubjects
        : ['গণিত', 'বিজ্ঞান'],
    badge: t.teacherDetails?.badge || 'মেন্টর',
    studentsCount: t.teacherDetails?.studentsCount || '৫,০০০+',
    classesCount: t.teacherDetails?.classesCount || '২০০+ লাইভ ক্লাস',
    photo: t.avatarUrl || '',
  }));

  const instructorsList =
    mappedDbTeachers.length >= 4
      ? mappedDbTeachers
      : [
          ...mappedDbTeachers,
          ...defaultInstructors.filter(
            (def) => !mappedDbTeachers.some((db) => db.name === def.name)
          ),
        ].slice(0, 4);

  return (
    <div className="bg-slate-50 dark:bg-[#080c1a] text-slate-900 dark:text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white transition-colors">

      {/* 2. COSMIC GLOWING HORIZON HERO SECTION (Inspired by 10 Minute School) */}
      <section className="relative overflow-hidden cosmic-hero-bg text-white py-12 lg:py-0 lg:min-h-[calc(100vh-4rem)] lg:flex lg:flex-col lg:items-center lg:justify-center">
        
        {/* Deep space radial ambient lighting & celestial nebula glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-rose-950/50 via-red-950/25 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-red-600/18 rounded-full blur-[120px] pointer-events-none -z-10 animate-atmosphere" />
        <div className="absolute -top-10 left-1/4 w-[400px] h-[300px] bg-blue-900/15 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute -top-10 right-1/4 w-[400px] h-[300px] bg-purple-900/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* 🌟 GLOWING & DIMMING STARS (Twinkling Cosmic Starfield) - Placed above base background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top-left star cluster */}
          <div className="absolute top-[8%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[18%] left-[5%] w-1 h-1 rounded-full bg-rose-200 animate-star-twinkle-medium" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[28%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" style={{ animationDelay: '0.6s' }} />
          <div className="absolute top-[12%] left-[24%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" style={{ animationDelay: '2.4s' }} />
          
          {/* Top-center star cluster */}
          <div className="absolute top-[7%] left-[42%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" style={{ animationDelay: '1.8s' }} />
          <div className="absolute top-[15%] left-[56%] w-1 h-1 rounded-full bg-rose-300 animate-star-twinkle-slow" style={{ animationDelay: '3.1s' }} />
          <div className="absolute top-[10%] left-[66%] w-1.5 h-1.5 rounded-full bg-amber-200 animate-star-twinkle-fast" style={{ animationDelay: '0.9s' }} />
          
          {/* Top-right star cluster */}
          <div className="absolute top-[11%] right-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[24%] right-[7%] w-1 h-1 rounded-full bg-sky-200 animate-star-twinkle-fast" style={{ animationDelay: '2.7s' }} />
          <div className="absolute top-[16%] right-[20%] w-1 h-1 rounded-full bg-rose-200 animate-star-twinkle-medium" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-[32%] right-[15%] w-1 h-1 rounded-full bg-amber-100 animate-star-twinkle-slow" style={{ animationDelay: '3.8s' }} />
          
          {/* Mid & lower background stars */}
          <div className="absolute top-[48%] left-[7%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" style={{ animationDelay: '2.1s' }} />
          <div className="absolute top-[64%] left-[14%] w-1 h-1 rounded-full bg-rose-200 animate-star-twinkle-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[44%] right-[8%] w-1 h-1 rounded-full bg-white animate-star-twinkle-fast" style={{ animationDelay: '3.3s' }} />
          <div className="absolute top-[70%] right-[16%] w-1.5 h-1.5 rounded-full bg-amber-200 animate-star-twinkle-medium" style={{ animationDelay: '1.7s' }} />

          {/* 🌠 REALISTIC SHOOTING STARS / METEORS (Natural space streaks with varied speeds) */}
          <span className="shooting-star meteor-1" />
          <span className="shooting-star meteor-2" />
          <span className="shooting-star meteor-3" />
          <span className="shooting-star meteor-4" />
        </div>

        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col justify-center flex-1 py-6 lg:py-10">
          
          {/* Glowing Planetary Horizon Half-Arch (Semi-circular atmospheric curvature) */}
          <div className="relative mx-auto max-w-4xl pt-2 sm:pt-4 pb-2 sm:pb-4">
            
            {/* The Half-Circle Horizon Curved Arc - Crowned elegantly OVER the top of the heading */}
            <div 
              style={{
                maskImage: 'radial-gradient(ellipse 65% 65% at 50% 100%, black 40%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 100%, black 40%, transparent 75%)',
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[15%] w-[120%] sm:w-[95%] h-[160px] rounded-t-[500px] pointer-events-none border-t-[3px] border-rose-400/90 shadow-[0_-14px_45px_12px_rgba(239,68,68,0.55),0_-2px_15px_rgba(255,255,255,0.95)] animate-horizon-glow" 
            />
            
            {/* Atmospheric Red & Crimson Air Eclipse Glow Behind the Title (Seamless Radial Blend) */}
            <div 
              style={{
                background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(225, 29, 72, 0.28) 0%, rgba(239, 68, 68, 0.15) 40%, transparent 75%)',
              }}
              className="absolute -inset-x-20 -inset-y-10 pointer-events-none blur-3xl animate-cosmic-air-1" 
            />

            {/* Secondary Soft Golden-Rose Luminous Air Wave */}
            <div 
              style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245, 158, 11, 0.18) 0%, rgba(244, 63, 94, 0.12) 45%, transparent 70%)',
              }}
              className="absolute -inset-x-10 -inset-y-6 pointer-events-none blur-2xl animate-cosmic-air-2" 
            />

            {/* Hero Main Heading with Left-to-Right & Vice Versa Glowing Color Sweep */}
            <div className="relative z-10 px-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.25] animate-glow-sweep-title">
                লক্ষ্য এবার আকাশছোঁয়া!
              </h1>

              <p className="mt-3.5 text-base sm:text-xl font-bold max-w-xl mx-auto drop-shadow-sm animate-glow-sweep-subtitle">
                সেরা গাইডে নিশ্চিত করো তোমার সেরা ফলাফল!
              </p>
            </div>
          </div>

          {/* GLOSSY CLASS CARDS ROW */}
          <div className="mt-6 sm:mt-10 lg:mt-14">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-6 sm:gap-y-8 max-w-[1260px] mx-auto px-1 sm:px-4">
              
              {/* Card 1: HSC 26 */}
              <div 
                style={{ animationDelay: '100ms' }}
                onClick={() => {
                  setSelectedClass('Class 12');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-amber aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-amber-400/30 overflow-hidden">
                  
                  {/* Ultra-soft realistic feathered crystal sheen beam */}
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" />
                  
                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    {/* Top glass bubble shine */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Trophy className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-sky-100 uppercase drop-shadow-md z-10">
                      HSC
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5 sm:mt-1">
                      <span>২৬</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-extrabold text-slate-100 mt-2 sm:mt-3 tracking-wide group-hover:text-amber-300 transition-colors z-10">
                    HSC ২৬
                  </span>
                </div>
                
                {/* Cute pill badge */}
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-rose-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  ভার্সিটি ও ইঞ্জি.
                </div>
              </div>

              {/* Card 2: HSC 27 */}
              <div 
                style={{ animationDelay: '180ms' }}
                onClick={() => {
                  setSelectedClass('Class 11');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-sky aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-sky-400/30 overflow-hidden">
                  
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" style={{ animationDelay: '4s' }} />

                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1d4ed8] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Target className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-blue-100 uppercase drop-shadow-md z-10">
                      HSC
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5 sm:mt-1">
                      <span>২৭</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-100 mt-1.5 sm:mt-2.5 tracking-wide group-hover:text-sky-300 transition-colors z-10">
                    HSC ২৭
                  </span>
                </div>
                
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-red-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  বোর্ড স্ট্যান্ডার্ড
                </div>
              </div>

              {/* Card 3: HSC 28 */}
              <div 
                style={{ animationDelay: '260ms' }}
                onClick={() => {
                  setSelectedClass('Class 11');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-blue aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-cyan-400/30 overflow-hidden">
                  
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" style={{ animationDelay: '8s' }} />

                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0f766e] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Backpack className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-100 uppercase drop-shadow-md z-10">
                      HSC
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5 sm:mt-1">
                      <span>২৮</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-100 mt-1.5 sm:mt-2.5 tracking-wide group-hover:text-cyan-300 transition-colors z-10">
                    HSC ২৮
                  </span>
                </div>
                
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-blue-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  ফুল কোর্স
                </div>
              </div>

              {/* Card 4: SSC 27 (দশম শ্রেণি) */}
              <div 
                style={{ animationDelay: '340ms' }}
                onClick={() => {
                  setSelectedClass('Class 10');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-orange aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-orange-400/30 overflow-hidden">
                  
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" style={{ animationDelay: '12s' }} />

                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#fb923c] via-[#ea580c] to-[#c2410c] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <ScrollText className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-orange-100 uppercase drop-shadow-md z-10">
                      SSC
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5 sm:mt-1">
                      <span>২৭</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-100 mt-1.5 sm:mt-2.5 tracking-wide group-hover:text-orange-300 transition-colors z-10">
                    দশম শ্রেণি
                  </span>
                </div>
                
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-orange-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  লাইভ ও রিভিশন
                </div>
              </div>

              {/* Card 5: Class 9 (৯ম শ্রেণি) */}
              <div 
                style={{ animationDelay: '420ms' }}
                onClick={() => {
                  setSelectedClass('Class 9');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-emerald aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-emerald-400/30 overflow-hidden">
                  
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" style={{ animationDelay: '16s' }} />

                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#34d399] via-[#059669] to-[#047857] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Tent className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[9px] sm:text-[11px] font-black tracking-widest text-emerald-100 uppercase drop-shadow-md z-10">
                      CLASS
                    </span>
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5 sm:mt-1">
                      <span>৯</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-100 mt-1.5 sm:mt-2.5 tracking-wide group-hover:text-emerald-300 transition-colors z-10">
                    ৯ম শ্রেণি
                  </span>
                </div>
                
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-emerald-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  নতুন কারিকুলাম
                </div>
              </div>

              {/* Card 6: Class 6, 7, 8 (৬ষ্ঠ - ৮ম শ্রেণি) */}
              <div 
                style={{ animationDelay: '500ms' }}
                onClick={() => {
                  setSelectedClass('Class 8');
                  const el = document.getElementById('featured-courses');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-card-in group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full relative p-2 sm:p-3 rounded-[30px] sm:rounded-[38px] lg:rounded-[44px] glossy-glass-card glow-card-teal aspect-[1/1.05] sm:aspect-[1/1.12] lg:aspect-[1/1.18] flex flex-col items-center justify-between border-2 border-teal-400/30 overflow-hidden">
                  
                  <div className="absolute -inset-full w-[260%] h-[260%] bg-gradient-to-r from-transparent via-white/5 via-white/35 via-white/10 to-transparent pointer-events-none animate-gloss-beam z-20 blur-[1px]" style={{ animationDelay: '20s' }} />

                  <div className="w-full h-full rounded-[26px] sm:rounded-[32px] bg-gradient-to-b from-[#2dd4bf] via-[#0d9488] to-[#115e59] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden border border-white/30">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                    
                    {/* Tilted Artistic Icon on the Right Side as Background */}
                    <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                      <BookOpenCheck className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                    </div>

                    <span className="text-[9px] sm:text-[11px] font-black tracking-widest text-teal-100 uppercase drop-shadow-md z-10">
                      CLASS
                    </span>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center justify-center drop-shadow-lg z-10 mt-0.5">
                      <span>৬-৮</span>
                    </div>
                  </div>
                  
                  <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-100 mt-1.5 sm:mt-2.5 tracking-wide group-hover:text-teal-300 transition-colors z-10">
                    জুনিয়র ব্যাচ
                  </span>
                </div>
                
                <div className="mt-1.5 sm:mt-2.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black shadow-lg shadow-teal-600/30 whitespace-nowrap group-hover:scale-105 transition-all border border-white/20">
                  ফাউন্ডেশন কোর্স
                </div>
              </div>

            </div>
          </div>

          {/* Action CTAs: Free Class and All Courses Button */}
          <div className="mt-12 sm:mt-16 lg:mt-24 pb-8 lg:pb-14 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/free-classes"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/35 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2.5"
            >
              <span>ফ্রি ক্লাস (HSC / SSC)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/courses"
              className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/25 backdrop-blur-md hover:scale-105 transition-all flex items-center gap-2.5 shadow-lg"
            >
              <span>সকল কোর্স দেখুন</span>
              <ChevronRight className="w-4 h-4 text-rose-300" />
            </Link>
          </div>

        </div>

      </section>

      {/* 3. KEY METRICS STRIP (Appears right after hero upon scrolling) */}
      <section className="relative z-20 bg-slate-900 border-y border-slate-800 text-white py-8 sm:py-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">১০,০০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">নিবন্ধিত শিক্ষার্থী</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">৫০০+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">রেকর্ডেড লেকচার ও ক্লাস</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">১০০%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">সিলেবাস ও টেস্ট পেপার</div>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">২৪/৭</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">মেন্টরশিপ ও ডাউট সলভ</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED COURSES SECTION (Unified Continuous Flow) */}
      <section id="featured-courses" className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows in the background */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-6">
            <div>
              {/* Title */}
              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                জনপ্রিয় কোর্স ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                  ব্যাচসমূহ
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2.5 max-w-xl font-medium">
                লক্ষ্যপূরণে তোমার উপযোগী কোর্স বেছে নাও—প্রতিটি ব্যাচে থাকছে পূর্ণাঙ্গ সিলেবাস কভারেজ ও সার্বক্ষণিক সাপোর্ট।
              </p>
            </div>

            {/* Cute Class Switcher Pill Tabs */}
            <div className="p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
              {classList.slice(0, 6).map((cls) => {
                const isActive = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {cls === 'All' ? 'সকল শ্রেণি' : cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 border-t-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">কোর্সগুলো সাজানো হচ্ছে...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6">এই শ্রেণির জন্য নতুন কোর্স ও ব্যাচ খুব শীঘ্রই লাইভ হবে।</p>
              <button
                onClick={() => setSelectedClass('All')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all"
              >
                সব কোর্স দেখুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {filteredCourses.slice(0, 4).map((c, idx) => {
                const instructorName =
                  c.instructors && c.instructors.length > 0
                    ? typeof c.instructors[0] === 'object'
                      ? c.instructors[0].name
                      : 'ফ্যাকাল্টি মেন্টর'
                    : 'গ্র্যাভ একাডেমি শিক্ষক প্যানেল';

                // Cute vibrant card thumbnail gradients
                const cardThemes = [
                  {
                    gradient: 'from-[#4f46e5] via-[#7c3aed] to-[#c026d3]',
                    pillBg: 'from-purple-500 to-indigo-600',
                    accentColor: 'text-purple-600 dark:text-purple-400',
                    glow: 'shadow-purple-500/20',
                  },
                  {
                    gradient: 'from-[#0284c7] via-[#2563eb] to-[#4f46e5]',
                    pillBg: 'from-blue-500 to-indigo-600',
                    accentColor: 'text-blue-600 dark:text-blue-400',
                    glow: 'shadow-blue-500/20',
                  },
                  {
                    gradient: 'from-[#059669] via-[#0d9488] to-[#0284c7]',
                    pillBg: 'from-emerald-500 to-teal-600',
                    accentColor: 'text-teal-600 dark:text-teal-400',
                    glow: 'shadow-teal-500/20',
                  },
                  {
                    gradient: 'from-[#ea580c] via-[#e11d48] to-[#c026d3]',
                    pillBg: 'from-rose-500 to-orange-500',
                    accentColor: 'text-rose-600 dark:text-rose-400',
                    glow: 'shadow-rose-500/20',
                  },
                  {
                    gradient: 'from-[#d97706] via-[#ea580c] to-[#e11d48]',
                    pillBg: 'from-amber-500 to-orange-600',
                    accentColor: 'text-amber-600 dark:text-amber-400',
                    glow: 'shadow-amber-500/20',
                  },
                ];

                const currentTheme = cardThemes[idx % cardThemes.length];

                return (
                  <Link
                    key={c._id}
                    href={`/courses/${c.slug || c._id}`}
                    className="cute-course-card group rounded-[22px] sm:rounded-[34px] overflow-hidden flex flex-col justify-between p-1.5 sm:p-3 border sm:border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-purple-500/70 transition-all duration-300"
                  >
                    <div>
                      {/* Top Thumbnail Banner with Smooth Curved Mask */}
                      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] rounded-[18px] sm:rounded-[26px] overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-sm">
                        <div className={`relative w-full h-full ${c.thumbnailUrl ? 'bg-slate-900' : `bg-gradient-to-br ${currentTheme.gradient}`}`}>
                          {c.thumbnailUrl ? (
                            <img
                              src={formatDriveImageUrl(c.thumbnailUrl)}
                              alt={c.title}
                              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6 text-center">
                              <BookOpen className="w-6 h-6 sm:w-12 sm:h-12 text-white/80 drop-shadow-md mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300" />
                              <span className="text-white font-black text-xs sm:text-sm drop-shadow-md tracking-wide px-1 sm:px-3 line-clamp-1">
                                {c.title}
                              </span>
                            </div>
                          )}

                          {/* Gloss Sheen Shine Across Thumbnail */}
                          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />

                          {/* Top Badges Overlay */}
                          <div className="hidden sm:flex absolute top-1.5 sm:top-2.5 inset-x-1.5 sm:inset-x-2.5 z-20 items-center justify-between pointer-events-none gap-1">
                            {/* Grade Level Tag */}
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-black border border-white/25 shadow-md flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 shrink-0" />
                              <span className="truncate">{c.gradeLevel}</span>
                            </span>

                            {/* Cute Live Indicator */}
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[10px] sm:text-[11px] font-black shadow-md border border-slate-200/60 dark:border-white/15">
                              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                <span className="relative m-auto h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                              </span>
                              <span className="hidden xs:inline">লাইভ ব্যাচ</span>
                              <span className="xs:hidden">লাইভ</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="px-2 sm:px-4 pb-2 sm:pb-3 pt-2.5 sm:pt-3.5">
                        {/* Course Title */}
                        <h3 className="text-[11px] sm:text-base lg:text-lg font-normal sm:font-black text-slate-900 dark:text-white leading-tight sm:leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[1.75rem] sm:min-h-0">
                          {c.title}
                        </h3>

                        {/* Short Description (Hidden on mobile) */}
                        {c.description && (
                          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-1.5 overflow-hidden">
                            {c.description.length > 55
                              ? c.description.slice(0, 55).trim() + '...'
                              : c.description}
                          </p>
                        )}

                        {/* Feature Micro-Badges (Hidden on mobile) */}
                        <div className="hidden sm:block mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <PlayCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-1">লাইভ ক্লাস ও সার্বক্ষণিক ডাউট সলভ</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-1">অধ্যায়ভিত্তিক লেকচার শিট ও নোট</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Award className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-1">অনলাইন উইকলি টেস্ট ও এনালাইসিস</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cute Card Bottom: Enrollment CTA */}
                    <div className="p-0 sm:p-4 mt-2 sm:mt-1 rounded-none sm:rounded-[24px] border-0 sm:border sm:border-slate-200/70 dark:sm:border-slate-800/80 bg-transparent sm:bg-slate-50/80 dark:sm:bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-3 shadow-none sm:shadow-inner">
                      {/* Price Section */}
                      <div className="min-w-0 flex items-center justify-between sm:block px-1 sm:px-0 mb-0.5 sm:mb-0">
                        <span className="text-[9px] sm:text-[10px] font-medium sm:font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                          ভর্তি চলছে
                        </span>
                        <div className="flex items-baseline gap-1 sm:mt-0.5">
                          {c.discountPrice && c.discountPrice > 0 && c.regularPrice && c.regularPrice > c.discountPrice ? (
                            <>
                              <span className="text-xs sm:text-lg font-black text-blue-600 dark:text-blue-400 sm:text-slate-900 sm:dark:text-white">
                                ৳{c.discountPrice}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-semibold">
                                ৳{c.regularPrice}
                              </span>
                            </>
                          ) : c.regularPrice || c.courseFee ? (
                            <span className="text-xs sm:text-lg font-black text-blue-600 dark:text-blue-400 sm:text-slate-900 sm:dark:text-white">
                              ৳{c.regularPrice || c.courseFee}
                            </span>
                          ) : (
                            <span className="text-[11px] sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                              ফ্রি
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="w-full sm:w-auto py-1.5 sm:py-2.5 px-0 sm:px-4 rounded-none sm:rounded-xl bg-transparent sm:bg-gradient-to-r sm:from-blue-600 sm:via-indigo-600 sm:to-purple-600 sm:group-hover:from-blue-700 sm:group-hover:to-purple-700 text-blue-600 dark:text-blue-400 sm:text-white font-semibold sm:font-black text-xs shadow-none sm:shadow-md sm:shadow-blue-500/20 sm:group-hover:shadow-blue-500/35 transition-all flex items-center justify-center sm:justify-center gap-1 shrink-0 group-hover:scale-102">
                        <span>ব্যাচ দেখুন</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Cute Catalog CTA Button */}
          <div className="mt-14 sm:mt-16 text-center">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200/90 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-900 dark:text-white font-black text-sm shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <span>সকল কোর্স ও ব্যাচ ক্যাটালগ দেখুন</span>
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. VISUAL SECTION 1: LIVE CLASS (Cute, Cosmic & Glossy Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows */}
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Image on Left - Glossy Glass Container */}
            <div className="lg:col-span-6 order-1 lg:order-1">
              <div className="relative p-2.5 sm:p-3.5 rounded-[36px] sm:rounded-[44px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-black/50 group">
                
                {/* Image Mask Frame */}
                <div className="relative rounded-[28px] sm:rounded-[34px] overflow-hidden aspect-[16/10.5] bg-slate-900 border border-slate-200/60 dark:border-white/10 shadow-inner">
                  <img
                    src="/images/live-class.jpg"
                    alt="Teacher conducting live class on digital interactive smartboard"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
                  />
                  
                  {/* Gloss Shimmer Sheen Across Image */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />

                  {/* Overlaid Cute Top Badge */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-black border border-white/25 shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                      <span className="relative m-auto h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                    </span>
                    <span>ইন্টারেক্টিভ লাইভ ক্লাস</span>
                  </div>

                  {/* Bottom cute tag overlay */}
                  <div className="absolute bottom-3.5 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-xs font-black shadow-md border border-slate-200/60 dark:border-white/15 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>টু-ওয়ে অডিও ও স্ক্রিন শেয়ার</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text & Feature Cards on Right */}
            <div className="lg:col-span-6 order-2 lg:order-2">
              <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white leading-[1.3] tracking-tight">
                ইন্টারেক্টিভ{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                  অনলাইন ক্লাস
                </span>
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed font-medium">
                অনলাইন হলেও মনে হবে শিক্ষক তোমার সামনেই আছেন! সরাসরি কথা বলে প্রশ্ন করা এবং স্ক্রিনে হাতে-কলমে সমাধান পাওয়ার আধুনিক ব্যবস্থা।
              </p>

              {/* 3 Cute Glassmorphic Feature Pill Cards */}
              <div className="mt-8 space-y-3.5">
                
                {/* Feature 1 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/60 dark:hover:border-blue-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md shadow-blue-500/25 group-hover/item:scale-108 transition-transform">
                    ১
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                      সরাসরি কথা বলে ডাউট সলভ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      ক্লাস চলাকালীন মাইক অন করে বা চ্যাটে সরাসরি প্রশ্ন করে যেকোনো দ্বিধা সঙ্গে সঙ্গে ক্লিয়ার করে নাও।
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md shadow-emerald-500/25 group-hover/item:scale-108 transition-transform">
                    ২
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                      স্ক্রিন শেয়ার ও লাইভ নোটস
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      শিক্ষক স্ক্রিনে প্রতিটি অঙ্ক ও থিওরি লিখে সমাধান করান এবং ক্লাস শেষেই ক্লাসরুমে হ্যান্ডনোট দিয়ে দেন।
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/60 dark:hover:border-purple-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md shadow-purple-500/25 group-hover/item:scale-108 transition-transform">
                    ৩
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">
                      আনলিমিটেড রেকর্ডেড ক্লাস
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      পরীক্ষার আগে রিভিশনের জন্য যেকোনো সময় যতবার খুশি ফুল এইচডি ক্লাস দেখার সুবিধা।
                    </p>
                  </div>
                </div>

              </div>

              {/* Cute CTA Button */}
              <div className="mt-8 pt-2">
                <Link
                  href="/free-classes"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-102 transition-all duration-300"
                >
                  <span>ফ্রি ক্লাস ও সেমিনার দেখুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. VISUAL SECTION 2: STUDY COLLABORATION & EXAM READINESS (Cute Cosmic Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Text & Feature Cards on Left */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              
              {/* Short & Punchy Header */}
              <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white leading-[1.3] tracking-tight">
                একসাথে প্রস্তুতি ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
                  আত্মবিশ্বাস বৃদ্ধি
                </span>
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed font-medium">
                নিয়মিত অনলাইন পরীক্ষা, মডেল টেস্ট ও তাৎক্ষণিক পারফরম্যান্স অ্যানালাইসিস দিয়ে দেশসেরা সহপাঠীদের সাথে নিজেকে যাচাই করো।
              </p>

              {/* 2 Cute Glassmorphic Highlight Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Highlight Card 1 */}
                <div className="group/card p-5 sm:p-5.5 rounded-[28px] bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/60 dark:hover:border-amber-400/60 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black mb-3.5 shadow-md shadow-amber-500/25 group-hover/card:scale-110 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
                    রিয়েলটাইম লিডারবোর্ড
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    পরীক্ষার পর সারাদেশে সহপাঠীদের মাঝে নিজের মেধার সঠিক অবস্থান ও র‍্যাঙ্ক দেখার সুবিধা।
                  </p>
                </div>

                {/* Highlight Card 2 */}
                <div className="group/card p-5 sm:p-5.5 rounded-[28px] bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black mb-3.5 shadow-md shadow-emerald-500/25 group-hover/card:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors">
                    স্মার্ট প্রগ্রেস ট্র্যাকিং
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    ক্লাসের উপস্থিতি, মডেল টেস্টের মার্কস ও দুর্বল বিষয়ের প্রগ্রেস রিপোর্ট সহজে পর্যালোচনা।
                  </p>
                </div>

              </div>

              {/* Cute CTA Button */}
              <div className="mt-8 pt-2">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-102 transition-all duration-300"
                >
                  <span>ফ্রি স্টুডেন্ট অ্যাকাউন্ট খুলুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Image on Right - Glossy Glass Container */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative p-2.5 sm:p-3.5 rounded-[36px] sm:rounded-[44px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-black/50 group">
                
                {/* Image Mask Frame */}
                <div className="relative rounded-[28px] sm:rounded-[34px] overflow-hidden aspect-[16/10.5] bg-slate-900 border border-slate-200/60 dark:border-white/10 shadow-inner">
                  <img
                    src="/images/group-study.jpg"
                    alt="Students happily collaborating and checking high exam scores"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
                  />

                  {/* Gloss Shimmer Sheen Across Image */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />

                  {/* Top cute tag overlay */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-black border border-white/25 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>সাপ্তাহিক মডেল টেস্ট</span>
                  </div>

                  {/* Bottom cute tag overlay */}
                  <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/95 backdrop-blur-md text-white text-xs font-black shadow-lg border border-emerald-400/30">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>৯৮% সন্তুষ্ট শিক্ষার্থী ও অভিভাবক</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. TEACHERS / FACULTY SECTION (Cute Cosmic Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows */}
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header - Clean, Direct & Professional */}
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              যাদের সান্নিধ্যে{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                তোমার স্বপ্নপূরণ
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষ মেডিকেল কলেজের অভিজ্ঞ মেন্টরদের নিবিড় তত্ত্বাবধানে বিষয়ভিত্তিক পাঠদান।
            </p>
          </div>

          {/* Cute Instructors Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {instructorsList.slice(0, 4).map((teacher, idx) => (
              <div
                key={idx}
                className="group relative p-2 sm:p-3.5 rounded-[22px] sm:rounded-[30px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border sm:border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-purple-500/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
              >
                {/* Portrait Photo */}
                <div className="relative rounded-[16px] sm:rounded-[22px] overflow-hidden aspect-[4/3.5] w-full bg-slate-900 border border-slate-200/60 dark:border-white/10 shadow-inner flex items-center justify-center">
                  {teacher.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  ) : (
                    <UserAvatar
                      name={teacher.name}
                      role="teacher"
                      size="xl"
                      className="w-full h-full rounded-none"
                    />
                  )}
                  
                  {/* Gloss Sheen Shine Across Photo */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-card-sheen" />
                </div>

                {/* Information Body: Name, University, Subject with Middle Alignment */}
                <div className="w-full px-1 pt-3 pb-2 flex flex-col items-center text-center">
                  {/* Teacher Name */}
                  <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-full">
                    {teacher.name}
                  </h3>

                  {/* University / Institution */}
                  {teacher.institution ? (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                      {teacher.institution}
                    </p>
                  ) : teacher.department ? (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                      {teacher.department}
                    </p>
                  ) : null}

                  {/* Subject */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <p className="text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5 truncate max-w-full">
                      {teacher.subjects.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. 3-STEP ADMISSION PROCESS (Cute Cosmic Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows */}
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - Clean, Direct & Professional */}
          <div className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              ভর্তি হতে মাত্র{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                ৩টি সহজ ধাপ
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              সহজ তিনটি ধাপে ভর্তি হয়ে আজ থেকেই তোমার স্বপ্নের একাডেমিক পড়াশোনা শুরু করো।
            </p>
          </div>

          {/* 3 Cute Connected Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            
            {/* Step 1 */}
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/70 dark:hover:border-blue-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                ১
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                রেজিস্ট্রেশন করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                নাম ও মোবাইল নম্বর দিয়ে মাত্র ১ মিনিটে বিনামূল্যে একটি স্টুডেন্ট অ্যাকাউন্ট খুলুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/70 dark:hover:border-indigo-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                ২
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                কোর্স ও ব্যাচ পছন্দ করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                তোমার পছন্দের শ্রেণি অনুযায়ী কোর্স নির্বাচন করে চলতি ব্যাচে সহজে ভর্তি সম্পন্ন করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/70 dark:hover:border-emerald-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                ৩
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                ক্লাস শুরু করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                ড্যাশবোর্ড থেকে লাইভ ক্লাসে অংশ নিন, হ্যান্ডনোট ডাউনলোড করুন ও নিয়মিত মডেল টেস্ট দিন।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) (Cute Cosmic Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient cosmic glows */}
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - Clean, Direct & Professional */}
          <div className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              সচরাচর{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                জিজ্ঞাসিত প্রশ্ন (FAQ)
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              গ্র্যাভ একাডেমিতে ক্লাস, পরীক্ষা এবং ভর্তি সংক্রান্ত যেকোনো সাধারণ প্রশ্নের স্পষ্ট উত্তর।
            </p>
          </div>

          {/* Cute Glassmorphic Accordion Cards */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-[26px] border-2 transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                    isOpen
                      ? 'bg-white/95 dark:bg-slate-900/90 border-blue-500/70 dark:border-purple-500/70 shadow-lg shadow-blue-500/10 dark:shadow-purple-500/10'
                      : 'bg-white/80 dark:bg-slate-900/75 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? 'bg-blue-100 dark:bg-purple-950/60 text-blue-600 dark:text-purple-300 rotate-180'
                        : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-400'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-[1.8] border-t border-slate-100 dark:border-slate-800/80 pt-4 font-medium pl-14 sm:pl-16">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. BOTTOM BANNER / CTA (Full Width Solid Midnight Clean Aesthetic - Same As Footer) */}
      <section className="relative w-full py-20 sm:py-28 overflow-hidden bg-[#080c1a] text-white text-center">

        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Title */}
          <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-tight">
            আজই শুরু হোক তোমার{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300">
              সেরা প্রস্তুতি!
            </span>
          </h2>

          <p className="mt-4 text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            কোনো প্রকার সংশয় ছাড়াই আজই বিনামূল্যে রেজিস্ট্রেশন করে পূর্ণাঙ্গ সিলেবাস, ক্লাস রুটিন ও ফ্রি ডেমো ক্লাস দেখে নাও।
          </p>

          {/* Cute CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="group px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-black text-xs sm:text-base shadow-lg sm:shadow-xl shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-2.5"
            >
              <span>বিনামূল্যে একাউন্ট খুলুন</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/courses"
              className="px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-base border border-white/20 sm:border-2 backdrop-blur-md hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-2.5"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>সকল কোর্স দেখুন</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 11. FOOTER (Matching Bottom Banner) */}
      <footer className="relative bg-[#080c1a] text-slate-400 py-12 text-xs">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-indigo-950/80">
            <div>
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="tracking-tight">Grav Academy</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                ক্লাস ৬ থেকে ১২ শ্রেণির শিক্ষার্থীদের জন্য আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম।
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-indigo-300">কোর্সসমূহ</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="hover:text-indigo-300 transition-colors">Class 6 - 8 Foundation</Link></li>
                <li><Link href="/courses" className="hover:text-indigo-300 transition-colors">Class 9 - 10 SSC Special</Link></li>
                <li><Link href="/courses" className="hover:text-indigo-300 transition-colors">Class 11 - 12 HSC Prep</Link></li>
                <li><Link href="/free-classes" className="hover:text-indigo-300 transition-colors">ফ্রি ক্লাস ও সেমিনার</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-indigo-300">কুইক লিংকস</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-indigo-300 transition-colors">লগইন</Link></li>
                <li><Link href="/register" className="hover:text-indigo-300 transition-colors">রেজিস্ট্রেশন</Link></li>
                <li><Link href="/courses" className="hover:text-indigo-300 transition-colors">সকল ব্যাচ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-indigo-300">যোগাযোগ ও হেল্পলাইন</h4>
              <p className="leading-relaxed mb-2">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত যেকোনো সহায়তায়:</p>
              <p className="text-white font-bold text-sm text-indigo-200">📞 16910 / 01700-000000</p>
              <p className="text-slate-400 mt-1">ইমেইল: support@gravacademy.com</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Grav Academy. সর্বস্বত্ব সংরক্ষিত।</div>
            <div className="text-indigo-400/60 font-medium">Bangladeshi Academic Coaching Platform</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
