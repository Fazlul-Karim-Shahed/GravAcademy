'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

interface PermissionRouteGuardProps {
  children: React.ReactNode;
  /** The visitor needs at least one of these permissions to view the page. */
  anyOf: PermissionKey[];
  redirectTo?: string;
}

/**
 * Stops a user from seeing an operational screen when their role is allowed
 * into the employee area but the specific capability was revoked/not granted.
 * API authorization is still enforced by the server.
 */
export default function PermissionRouteGuard({ children, anyOf, redirectTo = '/employee' }: PermissionRouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const permitted = anyOf.some((permission) => hasPermission(user, permission));

  useEffect(() => {
    if (!loading && (!user || !permitted)) router.replace(redirectTo);
  }, [loading, user, permitted, redirectTo, router]);

  if (loading || !user || !permitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-2xl border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
