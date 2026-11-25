'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PermissionRouteGuard from '@/components/common/PermissionRouteGuard';
import { api } from '@/lib/api';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';

type Course = { _id: string; title: string; gradeLevel?: string; subject?: string; slug?: string };

function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canSeeList = hasPermission(user, PERMISSIONS.COURSES_VIEW) || hasPermission(user, PERMISSIONS.COURSES_UPDATE) || hasPermission(user, PERMISSIONS.COURSES_DELETE);
  useEffect(() => {
    if (!canSeeList) { setLoading(false); return; }
    api.get('/courses').then((response) => setCourses(response.data?.data || []))
      .catch(() => setError('কোর্স লোড করা যায়নি।'))
      .finally(() => setLoading(false));
  }, [canSeeList]);
  const removeCourse = async (course: Course) => {
    if (!window.confirm(`ডিলিট করবেন: ${course.title}?`)) return;
    try { await api.delete(`/courses/${course._id}`); setCourses((items) => items.filter((item) => item._id !== course._id)); }
    catch { setError('কোর্স ডিলিট করা যায়নি।'); }
  };
  return <main className="ga-page mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <Link href="/employee" className="text-sm font-semibold text-orange-600">← ড্যাশবোর্ড</Link>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-extrabold">কোর্সসমূহ</h1><div className="flex gap-3">{hasPermission(user, PERMISSIONS.CLASSES_MANAGE) && <Link href="/employee/classes" className="rounded-xl border px-4 py-2 text-sm font-bold">ক্লাস ম্যানেজ</Link>}{hasPermission(user, PERMISSIONS.COURSES_CREATE) && <Link href="/employee/courses/new" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white">নতুন কোর্স</Link>}</div></div>
    {!canSeeList ? null : loading ? <p className="mt-6">লোড হচ্ছে…</p> : error ? <p className="mt-6 text-rose-600">{error}</p> : courses.length === 0 ? <p className="mt-6 text-slate-500">কোনো কোর্স নেই।</p> :
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <article key={course._id} className="ga-card p-5">
        <h2 className="font-bold">{course.title}</h2><p className="mt-2 text-sm text-slate-500">{[course.gradeLevel, course.subject].filter(Boolean).join(' · ')}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">{hasPermission(user, PERMISSIONS.COURSES_VIEW) && <Link href={`/courses/${course.slug || course._id}`} className="text-orange-600">বিস্তারিত দেখুন →</Link>}{hasPermission(user, PERMISSIONS.COURSES_UPDATE) && <Link href={`/employee/courses/${course._id}/edit`} className="text-orange-600">এডিট</Link>}{hasPermission(user, PERMISSIONS.COURSES_DELETE) && <button type="button" onClick={() => void removeCourse(course)} className="text-rose-600">ডিলিট</button>}</div>
      </article>)}</div>}
  </main>;
}

export default function EmployeeCoursesPage() {
  return <PermissionRouteGuard anyOf={[PERMISSIONS.COURSES_VIEW, PERMISSIONS.COURSES_CREATE, PERMISSIONS.COURSES_UPDATE, PERMISSIONS.COURSES_DELETE, PERMISSIONS.CLASSES_MANAGE]}><CourseList /></PermissionRouteGuard>;
}
