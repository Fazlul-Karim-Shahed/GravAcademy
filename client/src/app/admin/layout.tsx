'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Employee is included because its role legitimately uses /admin/finance and
  // /admin/admissions (own backend permissions already gate what it can actually do
  // there — this guard only keeps fully unauthenticated/unrelated roles out).
  return <ProtectedRoute allowedRoles={['superadmin', 'admin', 'employee']}>{children}</ProtectedRoute>;
}
