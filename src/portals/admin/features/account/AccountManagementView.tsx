/**
 * AccountManagementView — Admin accounts list (UI thật, mock data)
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Search, Plus } from 'lucide-react';

const ACCOUNTS = [
  { id: 'u1', name: 'Nguyễn Văn A', email: 'student@prepmaster.ai', role: 'STUDENT', status: 'active' as const, joined: '2025-09-12' },
  { id: 'u2', name: 'Mentor David', email: 'mentor@prepmaster.ai', role: 'MENTOR', status: 'active' as const, joined: '2025-04-22' },
  { id: 'u3', name: 'Trần Thị B', email: 'ttb@prepmaster.ai', role: 'STUDENT', status: 'inactive' as const, joined: '2025-08-03' },
  { id: 'u4', name: 'Admin Master', email: 'admin@prepmaster.ai', role: 'ADMIN', status: 'active' as const, joined: '2024-12-01' },
  { id: 'u5', name: 'Phạm Văn C', email: 'pvc@prepmaster.ai', role: 'STUDENT', status: 'active' as const, joined: '2026-01-15' },
];

const AccountManagementView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            User lifecycle
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Account Management
          </h1>
        </div>
        <Button variant="primary" size="md" leftIcon={Plus}>
          Invite user
        </Button>
      </header>

      <Card className="!p-4">
        <div className="flex items-center gap-2 px-3 h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 mb-4 max-w-md">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, role…"
            className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-bold">Name</th>
                <th className="py-2 pr-3 font-bold">Email</th>
                <th className="py-2 pr-3 font-bold">Role</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 pr-3 font-bold">Joined</th>
                <th className="py-2 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ACCOUNTS.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="py-3 pr-3 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{u.email}</td>
                  <td className="py-3 pr-3">
                    <Badge
                      variant={u.role === 'ADMIN' ? 'ai' : u.role === 'MENTOR' ? 'primary' : 'neutral'}
                      size="sm"
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge
                      variant={u.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{u.joined}</td>
                  <td className="py-3 text-right">
                    <button className="text-xs font-semibold text-[#0052CC] hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AccountManagementView;
