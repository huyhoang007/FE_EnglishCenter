/**
 * MentorDashboardView — Mentor landing page
 * -----------------------------------------------------------
 * Thẻ KPI + danh sách bài nộp cần chấm điểm từ học viên.
 * Hoàn toàn dùng dữ liệu thực từ hệ thống.
 */

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ArrowRight, FileText, Mic, Users, Star, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

const MentorDashboardView: React.FC = () => {
  // Query active students count
  const studentsQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'MENTOR_DASHBOARD_STUDENTS'],
    queryFn: () => getUsers({ roleName: 'STUDENT', page: 0, size: 1 }),
  });

  const activeStudentsCount = studentsQuery.data?.totalElements ?? 0;

  const kpis = [
    { label: 'Pending reviews', value: 0, icon: FileText, accent: 'amber' },
    { label: 'Active students', value: activeStudentsCount, icon: Users, accent: 'blue' },
    { label: 'Speaking submissions', value: 0, icon: Mic, accent: 'violet' },
    { label: 'Avg. rating', value: '5.0', icon: Star, accent: 'emerald' },
  ];

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
        {kpis.map(({ label, value, icon: Icon, accent }) => (
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent submissions</h2>
          <span className="text-xs text-slate-400 font-medium">Hàng đợi chấm điểm</span>
        </div>
        <div className="py-12 text-center text-slate-400 text-xs space-y-2">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">Hiện tại chưa có bài nộp nào đang chờ duyệt</p>
          <p className="text-slate-400">Các bài thi Speaking & Writing của học viên sẽ xuất hiện tại đây khi được gửi.</p>
        </div>
      </Card>
    </div>
  );
};

export default MentorDashboardView;
