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
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight block leading-tight">
              Grav Academy
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal leading-tight">
              Class 6 – 12 Coaching
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Courses
          </Link>
          <Link href="/live-classes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Live Classes
          </Link>
          <Link href="/exams/take" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Exams
          </Link>
          {user && (
            <Link href={getDashboardLink()} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Dashboard
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
            title="Toggle Light / Dark Theme"
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
                <span className="text-sm font-semibold text-slate-900 dark:text-white block leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-medium block leading-tight">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Enroll as Student
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
