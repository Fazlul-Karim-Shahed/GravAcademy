'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  BookOpen,
  Video,
  FileCheck2,
  LayoutDashboard,
  User,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

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

  const navItems = [
    {
      label: 'হোম',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'কোর্সসমূহ',
      href: '/courses',
      icon: BookOpen,
      isActive: pathname.startsWith('/courses'),
    },
    {
      label: 'ফ্রি ক্লাস',
      href: '/free-classes',
      icon: Video,
      isActive: pathname.startsWith('/free-classes'),
    },
    {
      label: user ? 'ড্যাশবোর্ড' : 'একাউন্ট',
      href: getDashboardLink(),
      icon: user ? LayoutDashboard : User,
      isActive:
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/teacher') ||
        pathname.startsWith('/guardian') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 h-16 w-full items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all relative ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {item.isActive && (
                <span className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full -translate-y-1.5" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  item.isActive
                    ? 'bg-blue-50 dark:bg-blue-500/15 scale-110'
                    : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
