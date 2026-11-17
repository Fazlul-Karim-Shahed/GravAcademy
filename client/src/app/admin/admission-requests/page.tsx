'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, Check, Clock3, Edit3, Loader2, MessageSquare, UserRound, X } from 'lucide-react';

interface AdmissionRequest {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  gradeLevel?: string;
  schoolOrCollege?: string;
  guardianName?: string;
  message?: string;
  status: string;
  createdAt: string;
  batchId?: { _id: string; name: string; status: string; capacity?: number; courseId?: { title?: string } };
  applicantGravId?: string;
  applicant?: { _id: string; name: string; gravId: string; phone?: string; email?: string };
}

export default function AdmissionRequestsPage() {
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/enrollment-requests/admin', { params: { status } });
      setRequests(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Request তালিকা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, [status]);

  const approve = async (id: string) => {
    setBusyId(id); setError('');
    try {
      const res = await api.post(`/enrollment-requests/${id}/approve`);
      const data = res.data?.data;
      const student = data?.student;
      const accountNote = data?.isNewUserCreated && student?.defaultPassword
        ? ` Login: ${student.gravId} / ${student.defaultPassword}`
        : '';
      const emailNote = data?.emailSent ? ' Email পাঠানো হয়েছে।' : '';
      setNotice(`${res.data?.message || 'Request approved.'}${accountNote}${emailNote}`);
      await loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Approve করা যায়নি।');
    } finally { setBusyId(''); }
  };

  const reject = async (id: string) => {
    setBusyId(id); setError('');
    try {
      const res = await api.post(`/enrollment-requests/${id}/reject`, { reviewNote: 'Rejected from request list' });
      setNotice(res.data?.message || 'Request rejected.');
      await loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reject করা যায়নি।');
    } finally { setBusyId(''); }
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">ভর্তি Requests</h1>
            <p className="text-xs text-slate-500 mt-1">Student applications review করুন এবং প্রয়োজন হলে form edit করে ভর্তি সম্পন্ন করুন।</p>
          </div>
          <Link href="/admin/admissions" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Manual Admission</Link>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit mb-5">
          {['pending', 'approved', 'rejected', 'all'].map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize ${status === value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{value}</button>)}
        </div>

        {notice && <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">{notice}</div>}
        {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">{error}</div>}

        {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 py-16 text-center"><Clock3 className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm font-bold">এই filter-এ কোনো request নেই</p><p className="text-xs text-slate-500 mt-1">নতুন student request এলে এখানে দেখা যাবে।</p></div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60">
                  <tr className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-5 py-4">Applicant</th>
                    <th className="px-5 py-4">Batch</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Details</th>
                    <th className="px-5 py-4">Received</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map((request) => <tr key={request._id} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[170px]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{request.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{request.gradeLevel || 'Grade not provided'}</p></div></div>
                    </td>
                    <td className="px-5 py-4"><p className="max-w-[190px] truncate text-xs font-bold text-slate-700 dark:text-slate-200">{request.batchId?.name || 'Batch unavailable'}</p><p className="mt-1 max-w-[190px] truncate text-[10px] text-slate-400">{request.batchId?.courseId?.title || 'Course'}</p></td>
                    <td className="px-5 py-4"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{request.phone || 'Phone নেই'}</p><p className="mt-1 max-w-[190px] truncate text-[10px] text-slate-400">{request.email || 'Email নেই'}</p></td>
                    <td className="px-5 py-4"><p className="text-xs text-slate-600 dark:text-slate-300">{request.schoolOrCollege || 'School নেই'}</p>{request.guardianName && <p className="mt-1 text-[10px] text-slate-400">Guardian: {request.guardianName}</p>}{request.message && <p className="mt-1 flex max-w-[170px] items-center gap-1 truncate text-[10px] text-slate-400"><MessageSquare className="h-3 w-3 shrink-0" />{request.message}</p>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(request.createdAt)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${request.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{request.status}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2">{request.status === 'pending' ? <><button type="button" aria-label={`Approve ${request.name}`} disabled={busyId === request._id} onClick={() => approve(request._id)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">{busyId === request._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve</button><Link href={`/admin/admissions?requestId=${request._id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Edit3 className="h-3.5 w-3.5" />Edit</Link><button type="button" aria-label={`Reject ${request.name}`} disabled={busyId === request._id} onClick={() => reject(request._id)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><X className="h-3.5 w-3.5" />Reject</button></> : <span className="text-[11px] text-slate-400">—</span>}</div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
