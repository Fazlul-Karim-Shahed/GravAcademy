'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Employee is included because its role legitimately uses /admin/finance and
  // /admin/admissions (own backend permissions already gate what it can actually do
  // there — this guard only keeps fully unauthenticated/unrelated roles out).
  const pathname = usePathname();
  const teacherCurriculumAccess = /^\/admin\/batches\/[^/]+\/curriculum(?:\/.*)?$/.test(pathname);
  const allowedRoles = teacherCurriculumAccess
    ? ['superadmin', 'admin', 'employee', 'teacher'] as const
    : ['superadmin', 'admin', 'employee'] as const;
  return <ProtectedRoute allowedRoles={[...allowedRoles]}>{children}</ProtectedRoute>;
}
