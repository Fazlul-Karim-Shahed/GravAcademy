'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function EmployeePanelPage() {
  const { user } = useAuth();

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
      </div>

      {/* Task Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Enrollments
            </span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">4 Requests</div>
          <span className="text-xs text-cyan-400 mt-1 block">Awaiting payment verification</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Student Inquiries
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">2 Open</div>
          <span className="text-xs text-slate-500 mt-1 block">Class 10 Physics batch</span>
        </Card>

        <Card className="border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Attendance Records
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">Updated</div>
          <span className="text-xs text-emerald-400 mt-1 block">Today&apos;s sessions recorded</span>
        </Card>
      </div>

      {/* Operations Table */}
      <Card className="border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Student Inquiries & Verification</h3>
          <span className="text-xs text-slate-400">Restricted operational access</span>
        </div>

        <div className="overflow-x-auto">
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
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Mehedi Hasan</td>
                <td className="py-3 px-4">Class 10 Physics Masterclass</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">
                    Pending Verification
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                    Verify
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Nusrat Jahan</td>
                <td className="py-3 px-4">Class 6 Bangla — Batch 1</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                    Approved
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-slate-500">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
