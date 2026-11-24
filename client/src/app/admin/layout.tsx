'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const teacherCurriculumAccess = /^\/admin\/batches\/[^/]+\/curriculum(?:\/.*)?$/.test(pathname);
  const employeeOperationsAccess = /^\/admin\/(admissions|finance)(?:\/|$)/.test(pathname);
  const allowedRoles = teacherCurriculumAccess
    ? ['superadmin', 'admin', 'teacher'] as const
    : employeeOperationsAccess
      ? ['superadmin', 'admin', 'employee'] as const
      : ['superadmin', 'admin'] as const;
  return <ProtectedRoute allowedRoles={[...allowedRoles]}>{children}</ProtectedRoute>;
}
