'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const teacherCurriculumAccess = /^\/admin\/batches\/[^/]+\/curriculum(?:\/.*)?$/.test(pathname);
  const employeeAdmissionsAccess = /^\/admin\/admissions(?:\/|$)/.test(pathname);
  const employeeFinanceAccess = /^\/admin\/finance(?:\/|$)/.test(pathname) && Boolean(user?.effectivePermissions?.includes('finance.view'));
  const employeeOperationsAccess = employeeAdmissionsAccess || employeeFinanceAccess;
  const allowedRoles = teacherCurriculumAccess
    ? ['superadmin', 'admin', 'teacher'] as const
    : employeeOperationsAccess
      ? ['superadmin', 'admin', 'employee'] as const
      : ['superadmin', 'admin'] as const;
  return <ProtectedRoute allowedRoles={[...allowedRoles]}>{children}</ProtectedRoute>;
}
