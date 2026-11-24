'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['employee', 'admin', 'superadmin']}>{children}</ProtectedRoute>;
}
