'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  GraduationCap,
  Video,
  FileText,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Compass,
  ChevronRight,
  User,
  Briefcase,
} from 'lucide-react';
import { getSharedAcademicClasses, AcademicClassItem, getClassSlug } from '@/lib/classes';
import { UserAvatar } from '@/components/common/UserAvatar';
import { SiteLogo } from '@/components/common/SiteLogo';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const [mounted, setMounted] = React.useState(false);
  const [classes, setClasses] = React.useState<AcademicClassItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const desktopDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = React.useState(false);
  const mobileDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const mobileDropdownTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
    getSharedAcademicClasses().then((data) => setClasses(data || []));

    const handleUpdate = () => {
      getSharedAcademicClasses().then((data) => setClasses(data || []));
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(target)) {
        setIsMobileDropdownOpen(false);
      }
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('grav_classes_updated', handleUpdate);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('grav_classes_updated', handleUpdate);
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  const handleMobileMouseEnter = () => {
    if (mobileDropdownTimeoutRef.current) {
      clearTimeout(mobileDropdownTimeoutRef.current);
      mobileDropdownTimeoutRef.current = null;
    }
    setIsMobileDropdownOpen(true);
  };

  const handleMobileMouseLeave = () => {
    mobileDropdownTimeoutRef.current = setTimeout(() => {
      setIsMobileDropdownOpen(false);
    }, 250);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'superadmin':
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'guardian':
        return '/guardian';
      case 'employee':
        return '/employee';
      default:
        return '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <SiteLogo size="md" showText={false} />
          <div className="hidden sm:block">
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block leading-tight">
              {settings.siteName || 'গ্র্যাভ একাডেমি'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
              {settings.siteTagline || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার'}
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {/* Courses with Mega Hover Dropdown */}
          <div
            ref={desktopDropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/courses"
              onClick={(e) => {
                // Allows click to toggle dropdown or navigate
                if (!isDropdownOpen) {
                  // If not open, first click opens dropdown
                  // e.preventDefault();
                }
              }}
              className={`inline-flex items-center gap-1.5 py-2 px-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                isDropdownOpen ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              <span>সকল কোর্স</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen((prev) => !prev);
                }}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label="কোর্স মেনু খুলুন"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>
            </Link>

            {/* Hover Flyout Panel (নেভিগেশন কপাট) */}
            {isDropdownOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 pt-2.5 w-[380px] sm:w-[440px] z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="relative rounded-[24px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden p-4">
                  {/* Subtle ambient lighting */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header info */}
                  <div className="relative z-10 flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        শ্রেণি অনুযায়ী ব্রাউজ করুন
                      </span>
                    </div>
                    <Link
                      href="/courses"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>সকল কোর্স</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Grid of Academic Classes */}
                  <div className="relative z-10 grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-0.5">
                    {classes.map((cls) => {
                      const slug = getClassSlug(cls);
                      return (
                        <Link
                          key={cls._id}
                          href={`/classes/${slug}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="group/item flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 hover:bg-blue-50/80 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600/60 transition-all duration-200"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="block text-xs font-black text-slate-800 dark:text-slate-100 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors truncate">
                              {cls.name}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium truncate">
                              {cls.subtitle || cls.description || 'কারিকুলাম ও ব্যাচ'}
                            </span>
                          </div>
                          <div className="w-6 h-6 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 group-hover/item:translate-x-0.5 transition-all shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Footer Action */}
                  <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
                    <span>লাইভ ক্লাস, লেকচার শিট ও মেগা মডেল টেস্ট</span>
                    <Link
                      href="/free-classes"
                      onClick={() => setIsDropdownOpen(false)}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>ফ্রি ডেমো</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/free-classes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ফ্রি ক্লাস</span>
          </Link>

          <Link href="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 font-bold">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>জব সার্কুলার</span>
          </Link>
        </nav>

        {/* User Account & Dark/Light Toggle */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
            aria-label="Toggle Theme"
            title="থিম পরিবর্তন করুন"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 shrink-0" />
              )
            ) : (
              <span className="w-4 h-4 block" />
            )}
          </button>

          {mounted && user ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Profile Avatar Button */}
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="rounded-2xl transition-transform hover:scale-105 focus:outline-none cursor-pointer"
                aria-label="ইউজার প্রোফাইল মেনু"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatarUrl}
                  role={user.role}
                  size="md"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-blue-900/10 dark:shadow-black/40 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Ambient accent blob */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/15 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* User Profile Summary */}
                  <div className="relative p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={user.name}
                        avatarUrl={user.avatarUrl}
                        role={user.role}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {user.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                            {user.role === 'admin' || user.role === 'superadmin'
                              ? 'এডমিন'
                              : user.role === 'teacher'
                              ? 'শিক্ষক'
                              : user.role === 'guardian'
                              ? 'অভিভাবক'
                              : 'শিক্ষার্থী'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compact User ID strip */}
                    {user.userId && (
                      <div className="mt-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          ইউজার আইডি
                        </span>
                        <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 tracking-wide select-all">
                          {user.userId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions / Menu Items */}
                  <div className="p-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="group/item flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60 group-hover/item:scale-105 transition-transform">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block leading-tight">আমার প্রোফাইল</span>
                          <span className="block text-[10px] text-slate-400 font-normal">ব্যক্তিগত ও অ্যাকাডেমিক তথ্য</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover/item:translate-x-0.5 group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-all" />
                    </Link>

                    <Link
                      href={getDashboardLink()}
                      onClick={() => setIsProfileOpen(false)}
                      className="group/item flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 group-hover/item:scale-105 transition-transform">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block leading-tight">ড্যাশবোর্ড</span>
                          <span className="block text-[10px] text-slate-400 font-normal">আমার ক্লাসরুম ও কোর্সসমূহ</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover/item:translate-x-0.5 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-all" />
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="group/logout w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-all text-xs font-bold text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60 group-hover/logout:scale-105 transition-transform">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block leading-tight">লগআউট</span>
                          <span className="block text-[10px] text-rose-400/80 font-normal">একাউন্ট থেকে সাইন-আউট</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-block px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                লগইন
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                ভর্তি হোন
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub Navigation Row (ছোট স্ক্রিনে ৩টি লিংক: সকল কোর্স, ফ্রি ক্লাস, জব সার্কুলার) */}
      <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 relative">
        <div className="flex items-center justify-center gap-5 sm:gap-6">
          
          {/* সকল কোর্স Link with Dropdown Trigger */}
          <div
            ref={mobileDropdownRef}
            className="static"
            onMouseEnter={handleMobileMouseEnter}
            onMouseLeave={handleMobileMouseLeave}
          >
            <Link
              href="/courses"
              onClick={(e) => {
                // Toggle on click/tap
                if (!isMobileDropdownOpen) {
                  // e.preventDefault();
                }
              }}
              className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 py-1 cursor-pointer ${
                pathname?.startsWith('/courses') || pathname?.startsWith('/classes') || isMobileDropdownOpen
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span>সকল কোর্স</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMobileDropdownOpen((prev) => !prev);
                }}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label="কোর্স মেনু খুলুন"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMobileDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>
            </Link>

            {/* Mobile Dropdown Menu (ঠিক ১ পিক্সেল নিচে স্ন্যাগ পজিশন) */}
            {isMobileDropdownOpen && (
              <div
                onMouseEnter={handleMobileMouseEnter}
                onMouseLeave={handleMobileMouseLeave}
                className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+1px)] w-[88vw] max-w-[420px] z-50 rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    শ্রেণি অনুযায়ী কারিকুলাম
                  </span>
                  <Link
                    href="/courses"
                    onClick={() => setIsMobileDropdownOpen(false)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>সকল কোর্স পেজ</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
                  {classes.map((cls) => {
                    const slug = getClassSlug(cls);
                    return (
                      <Link
                        key={cls._id}
                        href={`/classes/${slug}`}
                        onClick={() => setIsMobileDropdownOpen(false)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600/60 transition-all"
                      >
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {cls.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {cls.subtitle || 'কোর্স ও ব্যাচ'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* সেপারেটর ডট */}
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

          {/* ফ্রি ক্লাস Link */}
          <Link
            href="/free-classes"
            onClick={() => setIsMobileDropdownOpen(false)}
            className={`text-xs sm:text-sm font-semibold transition-colors py-1 ${
              pathname?.startsWith('/free-classes')
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            ফ্রি ক্লাস
          </Link>

          {/* সেপারেটর ডট */}
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

          {/* জব সার্কুলার Link */}
          <Link
            href="/jobs"
            onClick={() => setIsMobileDropdownOpen(false)}
            className={`text-xs sm:text-sm font-semibold transition-colors py-1 ${
              pathname?.startsWith('/jobs')
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            জব সার্কুলার
          </Link>
        </div>
      </div>
    </header>
  );
};
