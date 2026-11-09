'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatBDDate } from '@/lib/dateUtils';
import { Card } from '@/components/ui';
import {
  Briefcase,
  Clock,
  UserCheck,
  AlertCircle,
  Wallet,
  UserPlus,
} from 'lucide-react';

interface EnrollmentRow {
  _id: string;
  studentId?: { name?: string };
  batchId?: { name?: string };
  paymentStatus?: string;
  status?: string;
  createdAt: string;
}

export default function EmployeePanelPage() {
  const [pendingEnrollments, setPendingEnrollments] = useState<EnrollmentRow[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, recentRes] = await Promise.all([
        api.get('/enrollments/admin-list', { params: { paymentStatus: 'unpaid', limit: 5 } }),
        api.get('/enrollments/admin-list', { params: { limit: 20 } }),
      ]);

      setPendingEnrollments(pendingRes.data?.data || []);
      setPendingTotal(pendingRes.data?.total || 0);

      const todayStr = new Date().toDateString();
      const recent: EnrollmentRow[] = recentRes.data?.data || [];
      setTodayCount(recent.filter((e) => new Date(e.createdAt).toDateString() === todayStr).length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-slate-800 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Briefcase className="w-3.5 h-3.5" /> Staff Operations
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Operational Support Portal
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Manage student enrollment verifications, verify document submissions, and coordinate batch logistics according to your assigned permissions.
          </p>
        </div>

        {/* Quick action links to areas Employee has backend permission for */}
        <div className="flex flex-wrap gap-2 mt-5">
          <Link
            href="/admin/admissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> নতুন ভর্তি করুন
          </Link>
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" /> ফাইন্যান্স ম্যানেজমেন্ট
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Enrollments
            </span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{loading ? '—' : `${pendingTotal} জন`}</div>
          <span className="text-xs text-cyan-400 mt-1 block">পেমেন্ট ভেরিফিকেশন বাকি</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              আজকের নতুন ভর্তি
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{loading ? '—' : `${todayCount} জন`}</div>
          <span className="text-xs text-slate-500 mt-1 block">সকল ব্যাচ মিলিয়ে</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              আপনার এক্সেস
            </span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white">Admissions + Finance (Collect)</div>
          <span className="text-xs text-emerald-400 mt-1 block">পারমিশন অনুযায়ী সীমিত</span>
        </Card>
      </div>

      {/* Operations Table */}
      <Card className="border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">পেমেন্ট ভেরিফিকেশন বাকি থাকা ভর্তি</h3>
          <span className="text-xs text-slate-400">সর্বশেষ ৫টি</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">লোড হচ্ছে...</div>
          ) : pendingEnrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              কোনো পেমেন্ট-বাকি ভর্তি নেই — সবকিছু আপ-টু-ডেট!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Requested Batch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {pendingEnrollments.map((e) => (
                  <tr key={e._id}>
                    <td className="py-3 px-4 font-semibold text-white">{e.studentId?.name || '—'}</td>
                    <td className="py-3 px-4">{e.batchId?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">
                        পেমেন্ট বাকি
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/admin/finance"
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors inline-block"
                      >
                        যাচাই করুন
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
