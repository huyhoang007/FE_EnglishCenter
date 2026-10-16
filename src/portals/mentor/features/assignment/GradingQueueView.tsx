/**
 * GradingQueueView — Kanban board cho mentor
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { CheckCircle2, Clock, Edit3 } from 'lucide-react';

interface Submission {
  id: string;
  learner: string;
  title: string;
  course: string;
}

const COLUMNS = [
  {
    key: 'pending',
    title: 'Pending',
    accent: 'amber',
    icon: Clock,
    items: [
      { id: 'p1', learner: 'Linh Pham', title: 'Writing Task 2 — Opinion Essay', course: 'IELTS 7.5+' },
      { id: 'p2', learner: 'Huy Nguyen', title: 'Speaking Part 2 — Cue Card', course: 'IELTS 7.5+' },
    ] as Submission[],
  },
  {
    key: 'reviewing',
    title: 'In Review',
    accent: 'blue',
    icon: Edit3,
    items: [
      { id: 'r1', learner: 'An Tran', title: 'Writing Task 1 — Line Graph', course: 'IELTS 7.5+' },
    ] as Submission[],
  },
  {
    key: 'completed',
    title: 'Completed',
    accent: 'emerald',
    icon: CheckCircle2,
    items: [
      { id: 'c1', learner: 'Minh Le', title: 'Speaking Part 1 — Interview', course: 'IELTS 6.5' },
      { id: 'c2', learner: 'Thao Vu', title: 'Writing Task 2 — Discussion', course: 'IELTS 7.0' },
    ] as Submission[],
  },
];

const GradingQueueView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          Assignment workspace
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Grading Queue
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map(({ key, title, icon: Icon, items }) => (
          <Card key={key} className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              </div>
              <Badge variant="neutral" size="sm">
                {items.length}
              </Badge>
            </div>
            <ul className="space-y-2.5">
              {items.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 hover:border-slate-300 hover:bg-white transition-colors cursor-pointer"
                >
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {s.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {s.learner} · {s.course}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GradingQueueView;
