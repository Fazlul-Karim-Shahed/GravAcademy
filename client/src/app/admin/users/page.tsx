'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import {
  ShieldAlert,
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Key,
} from 'lucide-react';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  status: string;
  createdAt: string;
  customPermissions: string[];
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<string>('student');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedRole !== 'all') params.role = selectedRole;
      if (search) params.search = search;

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.put(`/users/${editingUser._id}/role`, {
        role: newRole,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `✅ Role for ${editingUser.name} updated to ${newRole.toUpperCase()}!`,
        });
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user role.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-slate-800 bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-slate-900/60">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" /> Platform Governance
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            User Roles & RBAC Manager
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Manage student registrations, promote users to Admin or Teacher, configure role permissions, and track security operations.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by name or email..."
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="guardian">Guardian</option>
            <option value="employee">Employee</option>
          </select>

          <Button size="sm" variant="secondary" onClick={fetchUsers}>
            Search
          </Button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total Users: {users.length}
        </span>
      </div>

      {/* Users Table */}
      <Card className="border border-slate-800 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Current Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Joined Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Loading registered accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No accounts match the current query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                        {u.name.slice(0, 2)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-semibold uppercase text-[10px] ${
                          u.role === 'superadmin'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : u.role === 'admin'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : u.role === 'teacher'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : u.role === 'guardian'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : u.role === 'employee'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setNewRole(u.role);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EDIT ROLE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Modify Role & Authority
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Updating authority for <strong className="text-white">{editingUser.name}</strong> ({editingUser.email})
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assign Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="student">Student (Default learning portal)</option>
                  <option value="teacher">Teacher (Course & lesson manager)</option>
                  <option value="admin">Admin (Operational manager)</option>
                  <option value="guardian">Guardian (Parent monitor)</option>
                  <option value="employee">Employee (Support staff)</option>
                  <option value="superadmin">Superadmin (Full platform authority)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Role updates are strictly recorded in the audit logs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Confirm Role Change
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
