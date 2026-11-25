'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminJobsPage from '@/app/admin/jobs/page';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

type Job = { _id: string; title: string; organizationName: string; slug: string; status: string };

function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/jobs', { params: { limit: 100 } }).then((response) => setJobs(response.data.data || [])).catch(() => setError('তালিকা লোড করা যায়নি।'));
  }, []);
  return <main className="ga-page mx-auto max-w-6xl px-4 py-10"><h1 className="mb-6 text-2xl font-bold">জব সার্কুলার</h1>{error && <p role="alert">{error}</p>}<div className="space-y-3">{jobs.map((job) => <div key={job._id} className="ga-card p-4"><div className="font-bold">{job.title}</div><div className="mt-1 text-sm text-slate-500">{job.organizationName} · {job.status}</div>{job.status === 'published' && <Link className="mt-2 inline-block text-sm text-orange-600" href={`/jobs/${job.slug}`}>বিস্তারিত দেখুন</Link>}</div>)}</div></main>;
}

export default function EmployeeJobsPage() {
  const { user } = useAuth();
  return <PermissionRouteGuard anyOf={[PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOBS_MANAGE]}>{hasPermission(user, PERMISSIONS.JOBS_MANAGE) ? <AdminJobsPage /> : <JobList />}</PermissionRouteGuard>;
}
