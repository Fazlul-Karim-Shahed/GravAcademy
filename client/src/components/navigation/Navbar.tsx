'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block leading-tight">
              গ্র্যাভ একাডেমি
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
              ক্লাস ৬ – ১২ একাডেমিক কেয়ার
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            সকল কোর্স
          </Link>
          <Link href="/free-classes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ফ্রি ক্লাস</span>
          </Link>
          {user && (
            <Link href={getDashboardLink()} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              ড্যাশবোর্ড
            </Link>
          )}
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
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block leading-tight">
                  {user.role === 'admin' || user.role === 'superadmin'
                    ? 'এডমিন'
                    : user.role === 'teacher'
                    ? 'শিক্ষক'
                    : user.role === 'guardian'
                    ? 'অভিভাবক'
                    : 'শিক্ষার্থী'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
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
    </header>
  );
};
