/**
 * CourseManagementView — Admin courses list
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Plus, TrendingUp } from 'lucide-react';

const COURSES = [
  { id: 'c1', title: 'IELTS Intensive Mastery 7.5+', cert: 'IELTS', students: 1842, price: '3.49M VND', status: 'published' as const },
  { id: 'c2', title: 'TOEIC 4-Skills 700+', cert: 'TOEIC', students: 932, price: '2.79M VND', status: 'published' as const },
  { id: 'c3', title: 'VSTEP B2 — C1 Pathway', cert: 'VSTEP', students: 412, price: '2.99M VND', status: 'draft' as const },
];

const CourseManagementView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            Catalog
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Course Management
          </h1>
        </div>
        <Button variant="primary" size="md" leftIcon={Plus}>
          New course
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {COURSES.map((c) => (
          <Card key={c.id} hoverable className="!p-5">
            <div className="flex items-center justify-between">
              <Badge variant="primary" size="sm">
                {c.cert}
              </Badge>
              <Badge
                variant={c.status === 'published' ? 'success' : 'warning'}
                size="sm"
              >
                {c.status}
              </Badge>
            </div>
            <h3 className="mt-3 font-extrabold text-base text-slate-900 leading-snug">
              {c.title}
            </h3>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-700">
                  {c.students.toLocaleString()}
                </span>
                students
              </div>
              <span className="font-bold text-slate-900">{c.price}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseManagementView;
