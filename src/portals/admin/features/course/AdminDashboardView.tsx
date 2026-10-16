/**
 * AdminDashboardView — landing for /admin
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
} from 'lucide-react';

const KPI = [
  { label: 'Total users', value: '12,402', icon: Users, delta: '+8.2%' },
  { label: 'Active courses', value: '24', icon: BookOpen, delta: '+1' },
  { label: 'Monthly revenue', value: '₫ 1.84B', icon: DollarSign, delta: '+12.4%' },
  { label: 'Engagement', value: '74%', icon: Activity, delta: '+3.1%' },
];

const AdminDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          Overview
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Administration Dashboard
        </h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, value, icon: Icon, delta }) => (
          <Card key={label} className="!p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">
              {value}
            </p>
            <Badge variant="success" size="sm" className="mt-2">
              {delta} this month
            </Badge>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-base font-bold text-slate-900">System health</h2>
        <p className="text-sm text-slate-500 mt-1">
          All services are operating within nominal parameters.
        </p>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            { name: 'Authentication API', status: 'operational' },
            { name: 'Payment gateway (PayOS)', status: 'operational' },
            { name: 'Video streaming', status: 'degraded' },
            { name: 'AI evaluation queue', status: 'operational' },
          ].map((svc) => (
            <li
              key={svc.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <span className="font-semibold text-slate-700">{svc.name}</span>
              <Badge
                variant={svc.status === 'operational' ? 'success' : 'warning'}
                size="sm"
              >
                {svc.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboardView;
