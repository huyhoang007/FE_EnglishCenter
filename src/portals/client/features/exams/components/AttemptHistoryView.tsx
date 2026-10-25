/**
 * AttemptHistoryView — Lịch sử thi của học viên, mới nhất trước (Dev 3)
 * API: GET /api/v1/me/exam-attempts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { ATTEMPT_STATUS_LABEL, type AttemptSummary } from '@/shared/types';
import { useMyAttempts } from '../hooks/useExams';
import { formatDateTime } from '../utils/examRoom';

const STATUS_VARIANT = { in_progress: 'primary', submitted: 'ai', graded: 'success', expired: 'warning' } as const;

export const AttemptHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch } = useMyAttempts(page);

  const open = (a: AttemptSummary) =>
    navigate(a.status === 'in_progress' ? CLIENT_ROUTES.examAttempt(a.attemptId) : CLIENT_ROUTES.examResult(a.attemptId));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Lịch sử thi</h1>
      {isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Bạn chưa làm đề nào"
          description="Vào ngân hàng đề để chọn một đề và bắt đầu làm bài."
          actionLabel="Chọn đề để làm"
          onAction={() => navigate(CLIENT_ROUTES.exams)}
        />
      ) : (
        <>
          <Card noPadding className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Đề thi</th>
                  <th className="px-4 py-3">Lượt</th>
                  <th className="px-4 py-3">Bắt đầu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Điểm</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((a) => (
                  <tr key={a.attemptId} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.examTitle}</td>
                    <td className="px-4 py-3">#{a.attemptNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(a.startTime)}</td>
                    <td className="px-4 py-3">
                      <Badge size="sm" variant={STATUS_VARIANT[a.status]}>
                        {ATTEMPT_STATUS_LABEL[a.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {a.score !== undefined && a.score !== null ? `${a.score}/${a.maxScore}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant={a.status === 'in_progress' ? 'primary' : 'outline'} onClick={() => open(a)}>
                        {a.status === 'in_progress' ? 'Làm tiếp' : 'Xem kết quả'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AttemptHistoryView;
