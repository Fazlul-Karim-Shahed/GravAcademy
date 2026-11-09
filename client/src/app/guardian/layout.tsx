'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['guardian']}>{children}</ProtectedRoute>;
}
