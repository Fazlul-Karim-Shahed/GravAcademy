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
  applicantUserId?: { _id: string; name: string; userId: string; phone?: string; email?: string };
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
      setNotice(res.data?.message || 'Request approved.');
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {requests.map((request) => <div key={request._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0"><div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0"><UserRound className="w-5 h-5" /></div><div className="min-w-0"><h2 className="text-sm font-black truncate">{request.name}</h2><p className="text-[11px] text-slate-500 mt-0.5">{request.phone || request.email || 'Contact not provided'}</p></div></div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${request.status === 'pending' ? 'bg-amber-50 text-amber-700' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{request.status}</span>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800"><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{request.batchId?.name || 'Batch unavailable'}</p><p className="text-[11px] text-slate-500 mt-1">{request.batchId?.courseId?.title || 'Course'} {request.gradeLevel ? `• ${request.gradeLevel}` : ''}</p></div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500"><span>{request.schoolOrCollege || 'School not provided'}</span>{request.guardianName && <span>Guardian: {request.guardianName}</span>}</div>
              {request.message && <div className="flex items-start gap-1.5 mt-3 text-[11px] text-slate-500"><MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{request.message}</span></div>}
              {request.status === 'pending' && <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800"><button type="button" disabled={busyId === request._id} onClick={() => approve(request._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-60">{busyId === request._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve</button><Link href={`/admin/admissions?requestId=${request._id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold"><Edit3 className="w-3.5 h-3.5" /> Edit</Link><button type="button" disabled={busyId === request._id} onClick={() => reject(request._id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold"><X className="w-3.5 h-3.5" /> Reject</button></div>}
            </div>)}
          </div>
        )}
      </div>
    </div>
  );
}
