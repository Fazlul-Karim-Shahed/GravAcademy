'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { api } from '@/lib/api';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';

type Batch = { _id: string; name: string; status?: string; courseId?: { title?: string } };

function BatchList() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.BATCHES_MANAGE);
  const canView = hasPermission(user, PERMISSIONS.BATCHES_VIEW);
  const canDuplicate = hasPermission(user, PERMISSIONS.BATCHES_DUPLICATE);
  const canCurriculum = hasPermission(user, PERMISSIONS.LESSONS_MANAGE);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/batches').then((response) => setBatches(response.data?.data || []))
      .catch(() => setError('ব্যাচ লোড করা যায়নি।'))
      .finally(() => setLoading(false));
  }, []);
  const removeBatch = async (batch: Batch) => {
    if (!window.confirm(`ডিলিট করবেন: ${batch.name}?`)) return;
    try { await api.delete(`/batches/${batch._id}`); setBatches((items) => items.filter((item) => item._id !== batch._id)); }
    catch { setError('ব্যাচ ডিলিট করা যায়নি।'); }
  };
  return <main className="ga-page mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <Link href="/employee" className="text-sm font-semibold text-orange-600">← ড্যাশবোর্ড</Link>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-extrabold">ব্যাচসমূহ</h1>{canManage && <Link href="/employee/batches/new" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white">নতুন ব্যাচ</Link>}</div>
    {loading ? <p className="mt-6">লোড হচ্ছে…</p> : error ? <p className="mt-6 text-rose-600">{error}</p> : batches.length === 0 ? <p className="mt-6 text-slate-500">কোনো ব্যাচ নেই।</p> :
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{batches.map((batch) => <article key={batch._id} className="ga-card p-5">
        <h2 className="font-bold">{batch.name}</h2><p className="mt-2 text-sm text-slate-500">{[batch.courseId?.title, batch.status].filter(Boolean).join(' · ')}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">{canView && <Link href={`/classroom/${batch._id}`} className="text-orange-600">ক্লাসরুম →</Link>}{canCurriculum && <Link href={`/employee/batches/${batch._id}/curriculum`} className="text-orange-600">কারিকুলাম</Link>}{canDuplicate && <Link href={`/employee/batches/new?cloneFrom=${batch._id}`} className="text-orange-600">ডুপ্লিকেট</Link>}{canManage && <><Link href={`/employee/batches/${batch._id}/edit`} className="text-orange-600">এডিট</Link><button type="button" onClick={() => void removeBatch(batch)} className="text-rose-600">ডিলিট</button></>}</div>
      </article>)}</div>}
  </main>;
}

export default function EmployeeBatchesPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.BATCHES_VIEW, PERMISSIONS.BATCHES_MANAGE, PERMISSIONS.BATCHES_DUPLICATE, PERMISSIONS.LESSONS_MANAGE]}><BatchList /></PermissionRouteGuard>;
}
