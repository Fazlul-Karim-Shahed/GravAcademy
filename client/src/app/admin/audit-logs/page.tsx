'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatBDDateTime } from '@/lib/dateUtils';
import { ArrowLeft, ShieldCheck, Search, AlertCircle, RefreshCw } from 'lucide-react';

interface AuditLogRow {
  _id: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  USER_ROLE_AND_PERMISSIONS_CHANGE: 'ইউজার রোল/পারমিশন পরিবর্তন',
  GUARDIAN_STUDENT_LINK_UPDATE: 'অভিভাবক-শিক্ষার্থী সংযোগ আপডেট',
  STAFF_ACCOUNT_CREATED: 'নতুন স্টাফ অ্যাকাউন্ট তৈরি',
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadLogs();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/audit-logs');
      if (res.data?.success) {
        setLogs(res.data.data || []);
      } else {
        setError(res.data?.message || 'লগ লোড করা যায়নি');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'লগ লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (log.actorEmail || '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resourceType.toLowerCase().includes(q) ||
      (log.resourceId || '').toLowerCase().includes(q) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(q)
    );
  });

  if (user && user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">শুধুমাত্র সুপারএডমিন অ্যাক্সেস</h2>
          <p className="text-xs text-slate-500 mb-6">অডিট লগ দেখার অনুমতি শুধুমাত্র সুপারএডমিনের আছে।</p>
          <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ডে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                অডিট লগ (Audit Log)
              </h1>
              <p className="text-xs text-slate-500 mt-1">সর্বশেষ ১০০টি সেনসিটিভ অ্যাকশনের রেকর্ড</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadLogs}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ইমেইল, অ্যাকশন, রিসোর্স বা মেটাডেটা খুঁজুন..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">সব অ্যাকশন</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a] || a}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-medium">লোড হচ্ছে...</div>
          ) : error ? (
            <div className="text-center py-16 text-rose-500 text-xs font-bold">{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-medium">কোনো লগ পাওয়া যায়নি</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="py-3 px-4">সময়</th>
                    <th className="py-3 px-4">অ্যাকশন</th>
                    <th className="py-3 px-4">করেছেন</th>
                    <th className="py-3 px-4">রিসোর্স</th>
                    <th className="py-3 px-4">বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatBDDateTime(log.createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">
                        {log.actorEmail || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.resourceType}
                        {log.resourceId && <span className="text-slate-400"> #{log.resourceId.slice(-6)}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs">
                        <pre className="whitespace-pre-wrap break-words text-[10px] font-mono">
                          {JSON.stringify(log.metadata || {}, null, 0)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
