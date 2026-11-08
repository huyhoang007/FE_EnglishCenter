/**
 * HomeworkExamStatsPanel — Bảng thống kê kết quả làm bài TRẮC NGHIỆM (Nhóm A)
 * -----------------------------------------------------------
 * Bài trắc nghiệm được HỆ THỐNG chấm tự động → mentor KHÔNG thao tác chấm.
 * Màn hình này chỉ hiển thị bảng thống kê để mentor nắm điểm yếu chung:
 *   - Điểm trung bình / tỉ lệ đạt
 *   - Kết quả từng học viên
 *   - Câu nào học viên sai nhiều nhất (điểm yếu)
 */

import React from 'react';
import { BarChart3, TrendingDown, Users } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { cn } from '@/shared/utils/cn';
import { useHomeworkExamStats } from './hooks/useHomeworkGrading';

interface HomeworkExamStatsPanelProps {
  homeworkContentId: string;
}

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const HomeworkExamStatsPanel: React.FC<HomeworkExamStatsPanelProps> = ({
  homeworkContentId,
}) => {
  const stats = useHomeworkExamStats(homeworkContentId);

  if (stats.isLoading) {
    return (
      <Card className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </Card>
    );
  }
  if (stats.isError || !stats.data) {
    return (
      <ErrorState
        message={stats.error?.message}
        onRetry={() => stats.refetch()}
      />
    );
  }

  const data = stats.data;
  const weakQuestions = (data.questionStats ?? [])
    .filter((q) => (q.correctRate ?? 0) < 70)
    .sort((a, b) => (a.correctRate ?? 0) - (b.correctRate ?? 0));

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0052CC]" />
            Thống kê kết quả làm bài
          </h3>
          <Badge variant="primary" size="sm">
            Hệ thống tự chấm — không cần chấm tay
          </Badge>
          <span className="ml-auto text-xs font-bold text-slate-600">
            {data.homeworkTitle}
          </span>
        </div>

        {/* Chỉ số tổng */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Học viên đã nộp
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {data.totalSubmissions}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Điểm trung bình
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {data.averageScore ?? 0}
              <span className="text-xs font-bold text-slate-400">
                /{data.maxScore ?? 0}
              </span>
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tỉ lệ đạt
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {data.averagePercentage ?? 0}%
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Đạt / Không đạt
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              <span className="text-emerald-600">{data.passedCount}</span>
              <span className="text-slate-300"> / </span>
              <span className="text-rose-600">{data.failedCount}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Bảng kết quả từng học viên */}
      <Card noPadding>
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-sm text-slate-800">
            Kết quả từng học viên ({data.studentResults?.length ?? 0})
          </span>
        </div>
        {(data.studentResults?.length ?? 0) === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Chưa có học viên nào nộp bài này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Học viên
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Điểm
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tỉ lệ
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kết quả
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nộp lúc
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.studentResults?.map((r) => (
                  <tr key={r.studentId ?? r.submittedDate}>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {r.studentName ?? r.studentEmail ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {r.score ?? 0}/{r.maxScore ?? 0}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              (r.percentage ?? 0) >= 50
                                ? 'bg-emerald-500'
                                : 'bg-rose-500',
                            )}
                            style={{ width: `${Math.min(r.percentage ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {r.percentage ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={r.passed ? 'success' : 'danger'}
                        size="sm"
                      >
                        {r.passed ? 'Đạt' : 'Chưa đạt'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500">
                      {formatDateTime(r.submittedDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Điểm yếu chung — câu sai nhiều */}
      {weakQuestions.length > 0 && (
        <Card className="space-y-2.5">
          <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            Điểm yếu chung ({weakQuestions.length} câu tỉ lệ đúng dưới 70%)
          </p>
          <ul className="space-y-2">
            {weakQuestions.slice(0, 10).map((q) => (
              <li
                key={q.questionId}
                className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 space-y-1"
              >
                <p className="text-xs font-bold text-slate-800">
                  Câu {q.displayNumber}.{' '}
                  <span className="font-normal text-slate-600">
                    {q.questionText}
                  </span>
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                  <Badge variant="danger" size="sm">
                    Đúng {q.correctRate ?? 0}%
                  </Badge>
                  <span>Đúng: {q.correctCount}</span>
                  <span>Sai: {q.incorrectCount}</span>
                  <span>Bỏ trống: {q.unansweredCount}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default HomeworkExamStatsPanel;
