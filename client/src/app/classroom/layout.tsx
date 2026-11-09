'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
