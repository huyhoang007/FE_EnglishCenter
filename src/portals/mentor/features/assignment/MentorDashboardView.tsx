/**
 * MentorDashboardView — Mentor landing page
 * -----------------------------------------------------------
 * Thẻ KPI + danh sách submissions gần đây.
 * UI thật (không phải skeleton) nhưng dữ liệu vẫn mock.
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ArrowRight, FileText, Mic, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const KPI = [
  { label: 'Pending reviews', value: 12, icon: FileText, accent: 'amber' },
  { label: 'Active students', value: 48, icon: Users, accent: 'blue' },
  { label: 'Speaking submissions', value: 6, icon: Mic, accent: 'violet' },
  { label: 'Avg. rating', value: '4.8', icon: Star, accent: 'emerald' },
] as const;

const RECENT = [
  { id: 's1', learner: 'Linh Pham', type: 'Writing Task 2', course: 'IELTS 7.5+', submittedAt: '2h ago' },
  { id: 's2', learner: 'Huy Nguyen', type: 'Speaking Part 2', course: 'IELTS 7.5+', submittedAt: '4h ago' },
  { id: 's3', learner: 'An Tran', type: 'Writing Task 1', course: 'TOEIC 700+', submittedAt: 'Yesterday' },
  { id: 's4', learner: 'Minh Le', type: 'Speaking Part 1', course: 'IELTS 6.5', submittedAt: '2 days ago' },
];

const MentorDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            Mentor workspace
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Good morning, here is your queue
          </h1>
        </div>
        <Link to="/mentor/grading">
          <Button variant="primary" size="md" rightIcon={ArrowRight}>
            Open grading queue
          </Button>
        </Link>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="!p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${accent}-50 text-${accent}-600`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* Recent submissions */}
      <Card>
        <h2 className="text-base font-bold text-slate-900">Recent submissions</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {RECENT.map((s) => (
            <li
              key={s.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">
                  {s.learner} — {s.type}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.course} · {s.submittedAt}
                </p>
              </div>
              <Badge variant="ielts" size="sm">
                {s.type.startsWith('Writing') ? 'Writing' : 'Speaking'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default MentorDashboardView;
