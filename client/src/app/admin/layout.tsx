'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const teacherCurriculumAccess = /^\/admin\/batches\/[^/]+\/curriculum(?:\/.*)?$/.test(pathname);
  const allowedRoles = teacherCurriculumAccess
    ? ['superadmin', 'admin', 'teacher'] as const
    : ['superadmin', 'admin'] as const;
  return <ProtectedRoute allowedRoles={[...allowedRoles]} unauthorizedRedirect="/employee">{children}</ProtectedRoute>;
}
