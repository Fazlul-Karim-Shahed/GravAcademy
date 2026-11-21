'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDriveImageUrl } from '@/lib/drive';
import { SiteLogo } from '@/components/common/SiteLogo';
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle2,
  Users,
  UserPlus,
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
  Mic,
  ScreenShare,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { CourseCard } from '@/components/course/CourseCard';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { HeroCardItem, DEFAULT_HERO_CARDS, getHeroCardStyles, HeroCardIcon } from '@/lib/heroCards';
import { InstructorCard } from '@/lib/instructorCards';

// Convert English numbers to Bengali numerals
function toBengaliNumerals(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
}

// Re-animating count-up component on scroll visibility
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 1500,
  formatComma = false,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  formatComma?: boolean;
}) {
  const [count, setCount] = useState<number>(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startTime: number | null = null;
    let animFrame: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Restart counter animation whenever scrolled into view
          startTime = null;
          setCount(0);

          const step = (now: number) => {
            if (!startTime) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease-out cubic formula
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOutProgress * target);
            setCount(current);

            if (progress < 1) {
              animFrame = requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };

          animFrame = requestAnimationFrame(step);
        } else {
          // Reset when out of view so next scroll re-animates smoothly
          cancelAnimationFrame(animFrame);
          setCount(0);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrame);
    };
  }, [target, duration]);

  const displayNum = formatComma ? count.toLocaleString('en-US') : count.toString();
  const bengaliNum = toBengaliNumerals(displayNum);

  return (
    <span ref={ref} className="inline-block">
      {prefix}
      {bengaliNum}
      {suffix}
    </span>
  );
}

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
  const { settings } = useSiteSettings();
  const heroCards: HeroCardItem[] = (settings?.heroCards && Array.isArray(settings.heroCards) && settings.heroCards.length > 0)
    ? settings.heroCards
    : DEFAULT_HERO_CARDS;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedCourses();
    fetchTeachers();
  }, []);

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

  const configuredFeaturedIds = Array.isArray(settings?.featuredCourseIds) ? settings.featuredCourseIds.slice(0, 4) : [];
  const popularCourses = (configuredFeaturedIds.length > 0
    ? courses.filter((course) => configuredFeaturedIds.includes(course._id))
    : courses).slice(0, 4);

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
      institution: 'বুয়েট (BUET)',
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

  // If DB teachers exist, prioritize them, and fill missing fields or slots from defaultInstructors
  const mappedDbTeachers = dbTeachers.map((t, idx) => {
    // If backend teacher has missing fields, fallback to corresponding default instructor data
    const fallback = defaultInstructors[idx % defaultInstructors.length];
    const institution = t.teacherDetails?.institution?.trim() || fallback.institution;
    const department = t.teacherDetails?.department?.trim() || fallback.department;
    const subjects =
      t.teacherDetails?.specialistSubjects && t.teacherDetails.specialistSubjects.length > 0
        ? t.teacherDetails.specialistSubjects
        : fallback.subjects;

    return {
      name: t.name || fallback.name,
      institution,
      department,
      exp: t.teacherDetails?.experience || fallback.exp,
      subjects,
      badge: t.teacherDetails?.badge || fallback.badge,
      studentsCount: t.teacherDetails?.studentsCount || fallback.studentsCount,
      classesCount: t.teacherDetails?.classesCount || fallback.classesCount,
      photo: t.avatarUrl || fallback.photo,
    };
  });

  const instructorsList =
    mappedDbTeachers.length >= 4
      ? mappedDbTeachers
      : [
          ...mappedDbTeachers,
          ...defaultInstructors.filter(
            (def) => !mappedDbTeachers.some((db) => db.name === def.name)
          ),
        ].slice(0, 4);
  const configuredInstructorCards: InstructorCard[] = Array.isArray(settings?.instructorCards) && settings.instructorCards.length >= 4
    ? settings.instructorCards.slice(0, 4)
    : instructorsList;

  return (
    <div className="ga-page text-slate-900 dark:text-slate-100 min-h-screen selection:bg-[#ff6a00] selection:text-white transition-colors">

      {/* 2. PROFESSIONAL PROGRAM HERO */}
      <section className="home-professional-hero relative flex min-h-[680px] flex-col items-center justify-center overflow-hidden pb-16 pt-12 text-white md:-mt-20 md:min-h-[760px] md:pb-20 md:pt-32 lg:-mt-24 lg:pt-36">
        
        {/* Deep space radial ambient lighting & warm celestial orange/amber aura */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[1100px] -translate-x-1/2 bg-gradient-to-b from-orange-900/20 via-amber-950/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[280px] w-[760px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-[120px]" />

        {/* 🌟 GLOWING & DIMMING STARS (Twinkling Cosmic Starfield) - Placed above base background */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-45">
          {/* Top-left star cluster */}
          <div className="absolute top-[8%] left-[10%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" />
          <div className="absolute top-[18%] left-[5%] w-1 h-1 rounded-full bg-orange-200 animate-star-twinkle-medium" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[28%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-100 animate-star-twinkle-fast" style={{ animationDelay: '0.6s' }} />
          <div className="absolute top-[12%] left-[24%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" style={{ animationDelay: '2.4s' }} />
          
          {/* Top-center star cluster */}
          <div className="absolute top-[7%] left-[42%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" style={{ animationDelay: '1.8s' }} />
          <div className="absolute top-[15%] left-[56%] w-1 h-1 rounded-full bg-orange-300 animate-star-twinkle-slow" style={{ animationDelay: '3.1s' }} />
          <div className="absolute top-[10%] left-[66%] w-1.5 h-1.5 rounded-full bg-amber-200 animate-star-twinkle-fast" style={{ animationDelay: '0.9s' }} />
          
          {/* Top-right star cluster */}
          <div className="absolute top-[11%] right-[12%] w-1 h-1 rounded-full bg-white animate-star-twinkle-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[24%] right-[7%] w-1 h-1 rounded-full bg-amber-100 animate-star-twinkle-fast" style={{ animationDelay: '2.7s' }} />
          <div className="absolute top-[16%] right-[20%] w-1 h-1 rounded-full bg-orange-200 animate-star-twinkle-medium" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-[32%] right-[15%] w-1 h-1 rounded-full bg-amber-100 animate-star-twinkle-slow" style={{ animationDelay: '3.8s' }} />
          
          {/* Mid & lower background stars */}
          <div className="absolute top-[48%] left-[7%] w-1 h-1 rounded-full bg-white animate-star-twinkle-medium" style={{ animationDelay: '2.1s' }} />
          <div className="absolute top-[64%] left-[14%] w-1 h-1 rounded-full bg-orange-200 animate-star-twinkle-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[44%] right-[8%] w-1 h-1 rounded-full bg-white animate-star-twinkle-fast" style={{ animationDelay: '3.3s' }} />
          <div className="absolute top-[70%] right-[16%] w-1.5 h-1.5 rounded-full bg-amber-200 animate-star-twinkle-medium" style={{ animationDelay: '1.7s' }} />

          {/* 🌠 REALISTIC SHOOTING STARS / METEORS (Natural space streaks with varied speeds) */}
          <span className="shooting-star meteor-1 hidden md:block" />
          <span className="shooting-star meteor-2 hidden md:block" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-4 py-5 text-center sm:px-6 lg:px-8">
          
          {/* Glowing Planetary Horizon Half-Arch (Semi-circular atmospheric curvature) */}
          <div className="relative mx-auto max-w-4xl pb-3 pt-2 sm:pb-5">
            
            {/* The Half-Circle Horizon Curved Arc - Crowned elegantly OVER the top of the heading */}
            <div 
              style={{
                maskImage: 'radial-gradient(ellipse 65% 65% at 50% 100%, black 40%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 100%, black 40%, transparent 75%)',
              }}
              className="hidden"
            />
            
            {/* Atmospheric Warm Amber Air Eclipse Glow Behind the Title (Seamless Radial Blend) */}
            <div 
              style={{
                background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 106, 0, 0.16) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 75%)',
              }}
              className="pointer-events-none absolute -inset-x-20 -inset-y-10 opacity-60 blur-3xl"
            />

            {/* Secondary Soft Golden-Luminous Air Wave */}
            <div 
              style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(254, 215, 170, 0.14) 0%, rgba(255, 106, 0, 0.06) 45%, transparent 70%)',
              }}
              className="pointer-events-none absolute -inset-x-10 -inset-y-6 opacity-40 blur-2xl"
            />

            {/* Clear, restrained hierarchy consistent with the rest of the site */}
            <div className="relative z-10 px-4">
              <h1 className="home-hero-title text-4xl font-black leading-[1.18] tracking-[-0.035em] sm:text-5xl md:text-6xl">
                লক্ষ্য এবার আকাশছোঁয়া!
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-300 sm:text-lg">
                সেরা গাইডে নিশ্চিত করো তোমার সেরা ফলাফল!
              </p>
            </div>
          </div>

          {/* Program cards */}
          <div className="mt-7 sm:mt-10">
            <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-3 px-1 sm:grid-cols-3 sm:gap-4 sm:px-4 lg:grid-cols-6">
              {heroCards.map((card, idx) => {
                const styles = getHeroCardStyles(card.colorScheme);
                const isExternal = card.link?.startsWith('http://') || card.link?.startsWith('https://');
                const cardHref = card.link || '#';

                const CardContent = (
                  <div
                    style={{ animationDelay: `${(idx + 1) * 80 + 20}ms` }}
                    className="group flex w-full cursor-pointer flex-col items-center transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className={`home-hero-program-card relative flex w-full flex-col items-center justify-between overflow-hidden rounded-2xl border ${styles.border} p-2.5 sm:p-3`}>
                      
                      {/* Ultra-soft realistic feathered crystal sheen beam */}
                      <div
                        className="hidden"
                        style={{ animationDelay: `${idx * 4}s` }}
                      />
                      
                      <div className={`relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-white/15 p-2.5 sm:p-3 ${styles.bubbleBg}`}>
                        {/* Top glass bubble shine */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[26px] sm:rounded-t-[32px] pointer-events-none" />
                        
                        {/* Tilted Artistic Icon on the Right Side as Background */}
                        <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 pointer-events-none opacity-25 sm:opacity-30 group-hover:opacity-45 transition-all duration-300 transform rotate-[-18deg] group-hover:rotate-[-8deg] group-hover:scale-110">
                          <HeroCardIcon name={card.icon} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
                        </div>

                        <span className={`z-10 text-[9px] font-black uppercase tracking-[0.12em] sm:text-[10px] ${styles.categoryText}`}>
                          {card.category}
                        </span>
                        <div className="z-10 mt-0.5 flex items-center justify-center text-2xl font-black text-white sm:text-3xl">
                          <span>{card.mainText}</span>
                        </div>
                      </div>
                      
                      <span className={`z-10 mt-2 max-w-full truncate px-1 text-center text-[11px] font-bold text-slate-100 transition-colors sm:text-xs ${styles.hoverTitle}`}>
                        {card.title}
                      </span>
                    </div>
                    
                    {/* Cute pill badge */}
                    <div className={`mt-2 max-w-full truncate rounded-full border border-white/15 px-2.5 py-0.5 text-center text-[9px] font-bold text-white sm:text-[10px] ${styles.badge}`}>
                      {card.badge}
                    </div>
                  </div>
                );

                if (isExternal) {
                  return (
                    <a
                      key={card.id || idx}
                      href={cardHref}
                      target={card.openInNewTab ? '_blank' : undefined}
                      rel={card.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="block no-underline"
                    >
                      {CardContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={card.id || idx}
                    href={cardHref}
                    target={card.openInNewTab ? '_blank' : undefined}
                    className="block no-underline"
                  >
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Action CTAs: Free Class and All Courses Button */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 pb-4 sm:mt-11 sm:gap-4">
            <Link
              href="/free-classes"
              className="ga-primary-button px-6 py-3 text-xs sm:px-7 sm:text-sm"
            >
              <span>ফ্রি ক্লাস (HSC / SSC)</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>

            <Link
              href="/courses"
              className="ga-secondary-button border-white/15 bg-white/[0.06] px-6 py-3 text-xs text-white hover:border-orange-300/40 hover:bg-white/10 hover:text-white sm:px-7 sm:text-sm"
            >
              <span>সকল কোর্স দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-300" />
            </Link>
          </div>

        </div>

      </section>

      {/* 3. KEY METRICS SHOWCASE (Compact, Centered, Background Watermark Icons, Scroll-triggered Counter Animation) */}
      <section className="relative z-30 -mt-8 sm:-mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ga-card relative rounded-2xl p-4 sm:p-5 md:p-6 overflow-hidden">
          {/* Subtle Ambient Glow Blobs */}
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-orange-500/8 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-emerald-500/8 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            
            {/* Metric 1: Students */}
            <div className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#090a0d]/60 border border-slate-200/70 dark:border-[#1a1d24] hover:border-orange-500/40 dark:hover:border-orange-400/40 hover:bg-white dark:hover:bg-[#111318] transition-all duration-300 hover:shadow-md text-center flex flex-col items-center justify-center min-h-[105px] sm:min-h-[120px]">
              {/* Background Watermark Icon */}
              <div className="absolute -right-3 -bottom-3 text-orange-500/10 dark:text-orange-400/10 pointer-events-none group-hover:scale-115 group-hover:text-orange-500/15 dark:group-hover:text-orange-400/15 transition-all duration-500">
                <Users className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1.2]" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  <AnimatedCounter target={10000} suffix="+" formatComma={true} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  নিবন্ধিত শিক্ষার্থী
                </div>
              </div>
            </div>

            {/* Metric 2: Classes */}
            <div className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#090a0d]/60 border border-slate-200/70 dark:border-[#1a1d24] hover:border-emerald-500/40 dark:hover:border-emerald-400/40 hover:bg-white dark:hover:bg-[#111318] transition-all duration-300 hover:shadow-md text-center flex flex-col items-center justify-center min-h-[105px] sm:min-h-[120px]">
              {/* Background Watermark Icon */}
              <div className="absolute -right-3 -bottom-3 text-emerald-500/10 dark:text-emerald-400/10 pointer-events-none group-hover:scale-115 group-hover:text-emerald-500/15 dark:group-hover:text-emerald-400/15 transition-all duration-500">
                <PlayCircle className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1.2]" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  <AnimatedCounter target={500} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  রেকর্ডেড লেকচার ও ক্লাস
                </div>
              </div>
            </div>

            {/* Metric 3: Syllabus */}
            <div className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#090a0d]/60 border border-slate-200/70 dark:border-[#1a1d24] hover:border-amber-500/40 dark:hover:border-amber-400/40 hover:bg-white dark:hover:bg-[#111318] transition-all duration-300 hover:shadow-md text-center flex flex-col items-center justify-center min-h-[105px] sm:min-h-[120px]">
              {/* Background Watermark Icon */}
              <div className="absolute -right-3 -bottom-3 text-amber-500/10 dark:text-amber-400/10 pointer-events-none group-hover:scale-115 group-hover:text-amber-500/15 dark:group-hover:text-amber-400/15 transition-all duration-500">
                <CheckCircle2 className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1.2]" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  <AnimatedCounter target={100} suffix="%" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  সিলেবাস ও টেস্ট পেপার
                </div>
              </div>
            </div>

            {/* Metric 4: Mentorship */}
            <div className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#090a0d]/60 border border-slate-200/70 dark:border-[#1a1d24] hover:border-teal-500/40 dark:hover:border-teal-400/40 hover:bg-white dark:hover:bg-[#111318] transition-all duration-300 hover:shadow-md text-center flex flex-col items-center justify-center min-h-[105px] sm:min-h-[120px]">
              {/* Background Watermark Icon */}
              <div className="absolute -right-3 -bottom-3 text-teal-500/10 dark:text-teal-400/10 pointer-events-none group-hover:scale-115 group-hover:text-teal-500/15 dark:group-hover:text-teal-400/15 transition-all duration-500">
                <MessageCircle className="w-20 h-20 sm:w-24 sm:h-24 stroke-[1.2]" />
              </div>

              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  <span className="inline-flex items-center">
                    <AnimatedCounter target={24} />
                    <span className="mx-0.5 text-slate-400 font-light">/</span>
                    <AnimatedCounter target={7} />
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  মেন্টরশিপ ও ডাউট সলভ
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURED COURSES SECTION (Unified Continuous Flow) */}
      <section id="featured-courses" className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient glows in the background */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-orange-500/6 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-amber-500/6 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-6">
            <div>
              {/* Title */}
              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                জনপ্রিয় কোর্স ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
                  ব্যাচসমূহ
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2.5 max-w-xl font-medium">
                লক্ষ্যপূরণে তোমার উপযোগী কোর্স বেছে নাও—প্রতিটি ব্যাচে থাকছে পূর্ণাঙ্গ সিলেবাস কভারেজ ও সার্বক্ষণিক সাপোর্ট।
              </p>
            </div>

          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border-2 border-orange-500/20 border-t-orange-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">কোর্সগুলো সাজানো হচ্ছে...</p>
            </div>
          ) : popularCourses.length === 0 ? (
            <div className="text-center py-16 bg-white/70 dark:bg-[#111318]/70 backdrop-blur-xl rounded-[32px] border border-slate-200/80 dark:border-[#262b34] p-8 sm:p-12 max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-800">
                <BookOpen className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">কোনো কোর্স পাওয়া যায়নি</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6">এই শ্রেণির জন্য নতুন কোর্স ও ব্যাচ খুব শীঘ্রই লাইভ হবে।</p>
              <Link
                href="/courses"
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold sm:font-black shadow-md shadow-orange-950/20 transition-all"
              >
                সব কোর্স দেখুন
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
              {popularCourses.map((c: any, idx) => (
                <CourseCard key={c._id} course={c} className={idx >= 4 ? 'hidden lg:flex' : 'flex'} />
              ))}
            </div>
          )}

          {/* Cute Catalog CTA Button */}
          <div className="mt-10 sm:mt-16 text-center">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#111318] border border-slate-200/90 sm:border-2 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 text-slate-900 dark:text-white font-bold sm:font-black text-xs sm:text-sm shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
            >
              <span>সকল কোর্স ও ব্যাচ দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. VISUAL SECTION 1: LIVE CLASS (Cute, Cosmic & Glossy Glass Aesthetic) */}
      <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28 dark:bg-[#090a0d]">
        <div className="absolute -right-40 top-1/4 h-96 w-96 rounded-full bg-orange-500/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -left-40 bottom-10 h-96 w-96 rounded-full bg-amber-500/[0.06] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Image on Left - Glossy Glass Container */}
            <div className="lg:col-span-6 order-1 lg:order-1">
              <div className="relative p-2.5 sm:p-3.5 rounded-[36px] sm:rounded-[44px] bg-white/85 dark:bg-[#111318]/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-[#262b34] shadow-xl shadow-slate-200/50 dark:shadow-black/50 group">
                
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
                      <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
                      <span className="relative m-auto h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,106,0,0.9)]" />
                    </span>
                    <span>ইন্টারেক্টিভ লাইভ ক্লাস</span>
                  </div>

                  {/* Bottom cute tag overlay */}
                  <div className="absolute bottom-3.5 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-[#111318]/90 backdrop-blur-md text-slate-900 dark:text-white text-xs font-black shadow-md border border-slate-200/60 dark:border-white/15 flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-orange-500" />
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
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
                  অনলাইন ক্লাস
                </span>
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed font-medium">
                অনলাইন হলেও মনে হবে শিক্ষক তোমার সামনেই আছেন! সরাসরি কথা বলে প্রশ্ন করা এবং স্ক্রিনে হাতে-কলমে সমাধান পাওয়ার আধুনিক ব্যবস্থা।
              </p>

              {/* 3 Cute Feature Cards */}
              <div className="mt-8 space-y-3.5">
                
                {/* Feature 1 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-[#111318]/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover/item:bg-orange-500/20 group-hover/item:scale-105 transition-all">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                      সরাসরি কথা বলে ডাউট সলভ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      ক্লাস চলাকালীন মাইক অন করে বা চ্যাটে সরাসরি প্রশ্ন করে যেকোনো দ্বিধা সঙ্গে সঙ্গে ক্লিয়ার করে নাও।
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-[#111318]/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover/item:bg-orange-500/20 group-hover/item:scale-105 transition-all">
                    <ScreenShare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                      স্ক্রিন শেয়ার ও লাইভ নোটস
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      শিক্ষক স্ক্রিনে প্রতিটি অঙ্ক ও থিওরি লিখে সমাধান করান এবং ক্লাস শেষেই ক্লাসরুমে হ্যান্ডনোট দিয়ে দেন।
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group/item p-4 sm:p-4.5 rounded-[24px] bg-white/80 dark:bg-[#111318]/70 backdrop-blur-md border-2 border-slate-200/80 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 shadow-xs hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover/item:bg-orange-500/20 group-hover/item:scale-105 transition-all">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                      আনলিমিটেড রেকর্ডেড ক্লাস
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      পরীক্ষার আগে রিভিশনের জন্য যেকোনো সময় যতবার খুশি ফুল এইচডি ক্লাস দেখার সুবিধা।
                    </p>
                  </div>
                </div>

              </div>

              {/* Cute CTA Button */}
              <div className="mt-6 sm:mt-8 pt-1 sm:pt-2">
                <Link
                  href="/free-classes"
                  className="group inline-flex items-center gap-2 sm:gap-2.5 px-4.5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold sm:font-black text-xs sm:text-sm shadow-lg shadow-orange-950/25 hover:shadow-orange-950/40 hover:scale-102 transition-all duration-300"
                >
                  <span>ফ্রি ক্লাস ও সেমিনার দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. VISUAL SECTION 2: STUDY COLLABORATION & EXAM READINESS (Cute Cosmic Glass Aesthetic) */}
      <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28 dark:bg-[#090a0d]">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-orange-500/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-amber-500/[0.06] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Text & Feature Cards on Left */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              
              {/* Short & Punchy Header */}
              <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white leading-[1.25] tracking-tight">
                একসাথে প্রস্তুতি ও{' '}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
                  আত্মবিশ্বাস বৃদ্ধি
                </span>
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed font-medium">
                নিয়মিত অনলাইন পরীক্ষা, মডেল টেস্ট ও তাৎক্ষণিক পারফরম্যান্স অ্যানালাইসিস দিয়ে দেশসেরা সহপাঠীদের সাথে নিজেকে যাচাই করো।
              </p>

              {/* 2 Cute Glassmorphic Highlight Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Highlight Card 1 */}
                <div className="group/card p-5 rounded-2xl bg-white/90 dark:bg-[#111318]/85 border border-slate-200/80 dark:border-[#262b34] hover:border-amber-500/60 dark:hover:border-amber-400/60 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3.5 group-hover/card:text-orange-500 group-hover/card:scale-110 transition-transform">
                    <Award className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
                    রিয়েলটাইম লিডারবোর্ড
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    পরীক্ষার পর সারাদেশে সহপাঠীদের মাঝে নিজের মেধার সঠিক অবস্থান ও র‍্যাঙ্ক দেখার সুবিধা।
                  </p>
                </div>

                {/* Highlight Card 2 */}
                <div className="group/card p-5 rounded-2xl bg-white/90 dark:bg-[#111318]/85 border border-slate-200/80 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 shadow-sm hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3.5 group-hover/card:text-orange-500 group-hover/card:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white group-hover/card:text-orange-600 dark:group-hover/card:text-orange-400 transition-colors">
                    স্মার্ট প্রগ্রেস ট্র্যাকিং
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    ক্লাসের উপস্থিতি, মডেল টেস্টের মার্কস ও দুর্বল বিষয়ের প্রগ্রেস রিপোর্ট সহজে পর্যালোচনা।
                  </p>
                </div>

              </div>

              {/* Cute CTA Button */}
              <div className="mt-6 sm:mt-8 pt-1 sm:pt-2">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 sm:gap-2.5 px-4.5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-800 text-white font-bold sm:font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-102 transition-all duration-300"
                >
                  <span>ফ্রি একাউন্ট খুলুন</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Image on Right - Glossy Glass Container */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative p-2.5 sm:p-3.5 rounded-[36px] sm:rounded-[44px] bg-white/85 dark:bg-[#111318]/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-[#262b34] shadow-xl shadow-slate-200/50 dark:shadow-black/50 group">
                
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
                    <Award className="w-3.5 h-3.5 text-amber-300" />
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
      <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28 dark:bg-[#090a0d]">
        <div className="absolute -right-40 top-1/4 h-96 w-96 rounded-full bg-orange-500/[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -left-40 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/[0.05] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header - Clean, Direct & Professional */}
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              যাদের সান্নিধ্যে{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
                তোমার স্বপ্নপূরণ
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষ মেডিকেল কলেজের অভিজ্ঞ মেন্টরদের নিবিড় তত্ত্বাবধানে বিষয়ভিত্তিক পাঠদান।
            </p>
          </div>

          {/* Cute Instructors Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {configuredInstructorCards.map((teacher, idx) => (
              <div
                key={idx}
                className="group relative p-2 sm:p-3.5 rounded-[22px] sm:rounded-[30px] bg-white/90 dark:bg-[#111318]/80 backdrop-blur-xl border sm:border-2 border-slate-200/90 dark:border-[#262b34] hover:border-orange-500/60 dark:hover:border-orange-400/60 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
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

                {/* Information Body: Name, University + Department, Teaching Subject Below */}
                <div className="w-full px-1.5 pt-3 pb-2 flex flex-col items-center text-center flex-1 justify-between">
                  <div>
                    {/* Teacher Name */}
                    <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                      {teacher.name}
                    </h3>

                    {/* University & Studying Subject (e.g. ঢাকা বিশ্ববিদ্যালয়, রসায়ন বিভাগ) */}
                    {(teacher.institution || teacher.department) && (
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 leading-snug break-words">
                        {teacher.institution && teacher.department
                          ? `${teacher.institution}, ${teacher.department}`
                          : teacher.institution || teacher.department}
                      </p>
                    )}
                  </div>

                  {/* Teaching Subject (সে কোন সাবজেক্টে পড়ায় - একটু নিচে ক্লিয়ার ব্যাজ হিসেবে) */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] sm:text-[11px] font-bold border border-orange-200/60 dark:border-orange-800/60 leading-tight">
                        {teacher.subjects.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. 3-STEP ADMISSION PROCESS (Cute Cosmic Glass Aesthetic) */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle cute ambient glows */}
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-orange-500/6 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 bg-amber-500/6 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - Clean, Direct & Professional */}
          <div className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              ভর্তি হতে মাত্র{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
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
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-[#111318]/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-[#262b34] hover:border-orange-500/70 dark:hover:border-orange-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5 border border-orange-200/70 dark:border-orange-800/60 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                রেজিস্ট্রেশন করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                নাম ও মোবাইল নম্বর দিয়ে মাত্র ১ মিনিটে বিনামূল্যে একটি স্টুডেন্ট অ্যাকাউন্ট খুলুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-[#111318]/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-[#262b34] hover:border-amber-500/70 dark:hover:border-amber-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-200/70 dark:border-amber-800/60 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                কোর্স ও ব্যাচ পছন্দ করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                তোমার পছন্দের শ্রেণি অনুযায়ী কোর্স নির্বাচন করে চলতি ব্যাচে সহজে ভর্তি সম্পন্ন করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="group relative p-6 sm:p-7 rounded-[32px] bg-white/85 dark:bg-[#111318]/80 backdrop-blur-xl border-2 border-slate-200/90 dark:border-[#262b34] hover:border-orange-500/70 dark:hover:border-orange-400/70 shadow-lg shadow-slate-200/40 dark:shadow-black/40 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5 border border-orange-200/70 dark:border-orange-800/60 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Video className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
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
        
        {/* Subtle cute ambient glows */}
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500/6 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-40 w-96 h-96 bg-amber-500/6 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - Clean, Direct & Professional */}
          <div className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              সচরাচর{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:via-amber-300 dark:to-orange-400">
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
                      ? 'bg-white/95 dark:bg-[#111318]/90 border-orange-500/70 dark:border-orange-400/70 shadow-lg shadow-orange-500/10'
                      : 'bg-white/80 dark:bg-[#111318]/75 border-slate-200/80 dark:border-[#262b34] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md shadow-orange-950/25'
                          : 'bg-slate-100 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rotate-180'
                        : 'bg-slate-100/80 dark:bg-[#1a1d24] text-slate-400'
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
      <section className="relative w-full overflow-hidden border-t border-[#262b34] bg-black py-20 text-center text-white sm:py-28">
        <div className="pointer-events-none absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-orange-400/25 animate-[spin_18s_linear_infinite]" />
        <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <Target className="pointer-events-none absolute left-8 top-10 h-20 w-20 text-white/[0.10] sm:left-16 sm:h-28 sm:w-28" />
        <Sparkles className="pointer-events-none absolute bottom-10 right-10 h-16 w-16 text-orange-300/[0.16] sm:right-20" />
        <BookOpen className="pointer-events-none absolute right-[15%] top-10 h-14 w-14 rotate-12 text-orange-200/[0.10] sm:h-20 sm:w-20" />
        <GraduationCap className="pointer-events-none absolute bottom-8 left-[14%] h-16 w-16 -rotate-12 text-white/[0.09] sm:h-24 sm:w-24" />
        <Trophy className="pointer-events-none absolute right-[7%] bottom-12 h-12 w-12 -rotate-6 text-amber-300/[0.11] sm:h-16 sm:w-16" />

        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Title */}
          <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-tight">
            আজই শুরু হোক তোমার{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-300">
              সেরা প্রস্তুতি!
            </span>
          </h2>

          <p className="mt-4 text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            কোনো প্রকার সংশয় ছাড়াই আজই বিনামূল্যে রেজিস্ট্রেশন করে পূর্ণাঙ্গ সিলেবাস, ক্লাস রুটিন ও ফ্রি ডেমো ক্লাস দেখে নাও।
          </p>

          {/* Cute CTA Buttons */}
          <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <Link
              href="/register"
              className="group px-4 py-2 sm:px-7 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold sm:font-black text-xs sm:text-base shadow-lg sm:shadow-xl shadow-orange-950/25 hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-2.5"
            >
              <span>বিনামূল্যে একাউন্ট খুলুন</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/courses"
              className="px-4 py-2 sm:px-7 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold sm:font-black text-xs sm:text-base border border-white/20 sm:border-2 backdrop-blur-md hover:border-orange-400/40 hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-2.5"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>সকল কোর্স দেখুন</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 11. FOOTER (Matching Bottom Banner) */}
      <footer className="relative bg-[#090a0d] text-slate-400 py-12 text-xs border-t border-[#181b20]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#181b20]">
            <div>
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base mb-3">
                <SiteLogo size="sm" showText={false} />
                <span className="tracking-tight">Grav Academy</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                ক্লাস ৬ থেকে ১২ শ্রেণির শিক্ষার্থীদের জন্য আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম।
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-orange-400/90">কোর্সসমূহ</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="hover:text-orange-400 transition-colors">Class 6 - 8 Foundation</Link></li>
                <li><Link href="/courses" className="hover:text-orange-400 transition-colors">Class 9 - 10 SSC Special</Link></li>
                <li><Link href="/courses" className="hover:text-orange-400 transition-colors">Class 11 - 12 HSC Prep</Link></li>
                <li><Link href="/free-classes" className="hover:text-orange-400 transition-colors">ফ্রি ক্লাস ও সেমিনার</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-orange-400/90">কুইক লিংকস</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-orange-400 transition-colors">লগইন</Link></li>
                <li><Link href="/register" className="hover:text-orange-400 transition-colors">রেজিস্ট্রেশন</Link></li>
                <li><Link href="/courses" className="hover:text-orange-400 transition-colors">সকল ব্যাচ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px] text-orange-400/90">যোগাযোগ ও হেল্পলাইন</h4>
              <p className="leading-relaxed mb-2">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত যেকোনো সহায়তায়:</p>
              <p className="text-white font-bold text-sm text-orange-300">📞 16910 / 01700-000000</p>
              <p className="text-slate-400 mt-1">ইমেইল: support@gravacademy.com</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Grav Academy. সর্বস্বত্ব সংরক্ষিত।</div>
            <div className="text-orange-400/60 font-medium">Bangladeshi Academic Coaching Platform</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
