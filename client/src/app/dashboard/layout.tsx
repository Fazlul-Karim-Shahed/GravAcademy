'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>;
}
