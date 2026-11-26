'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

interface EmployeeClassroomPermissionGuardProps {
  children: React.ReactNode;
  anyOf: PermissionKey[];
}

/**
 * Classroom routes are shared by students, teachers, admins and employees.
 * Other roles keep their existing classroom rules; employees must also have
 * the explicit operational permission before a nested page can render.
 */
export default function EmployeeClassroomPermissionGuard({
  children,
  anyOf,
}: EmployeeClassroomPermissionGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const denied = user?.role === 'employee' && !anyOf.some((permission) => hasPermission(user, permission));

  useEffect(() => {
    if (!loading && denied) router.replace('/employee');
  }, [denied, loading, router]);

  if (loading || denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-2xl border-2 border-orange-500/20 border-t-orange-600" />
      </div>
    );
  }

  return <>{children}</>;
}
