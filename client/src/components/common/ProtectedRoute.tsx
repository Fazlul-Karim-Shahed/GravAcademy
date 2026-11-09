'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to view this section. Omit to allow any logged-in user. */
  allowedRoles?: Array<'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee'>;
}

/**
 * Client-side route guard: redirects to /login while auth is loading or the
 * viewer isn't authenticated, and blocks the page content for the wrong role.
 * Backend permission checks remain the real security boundary — this only
 * avoids exposing the UI shell of pages a visitor shouldn't be browsing.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/login');
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-2xl border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
