'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['teacher']}>{children}</ProtectedRoute>;
}
