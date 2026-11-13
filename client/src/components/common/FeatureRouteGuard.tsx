'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';

function featureForPath(pathname: string): string | null {
  if (pathname.startsWith('/admin/finance') || pathname.startsWith('/dashboard/payments')) return 'finance';
  if (pathname.startsWith('/admin/users')) return 'userManagement';
  if (pathname.startsWith('/admin/audit-logs')) return 'auditLogs';
  if (pathname.startsWith('/admin/admissions') || pathname.startsWith('/employee')) return 'admissions';
  if (pathname.includes('/assignments')) return 'assignments';
  if (pathname.includes('/exams')) return 'exams';
  if (pathname.startsWith('/admin/courses') || pathname.startsWith('/courses') || pathname.startsWith('/classes')) return 'courses';
  if (pathname.startsWith('/admin/batches') || pathname.startsWith('/classroom')) return 'batches';
  if (pathname.startsWith('/free-classes')) return 'freeClasses';
  if (pathname.startsWith('/jobs') || pathname.startsWith('/admin/jobs')) return 'jobs';
  return null;
}

export default function FeatureRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { loading, isFeatureEnabled } = useSiteSettings();
  const feature = featureForPath(pathname);

  if (loading || !feature || isFeatureEnabled(feature, user?.role === 'superadmin')) return <>{children}</>;
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 text-center">
      <div><h1 className="text-xl font-bold">এই ফিচারটি এখনো প্রকাশ করা হয়নি</h1><p className="text-sm text-slate-500 mt-2">Superadmin এই ফিচারটি প্রকাশ করলে এখানে দেখা যাবে।</p></div>
    </div>
  );
}
