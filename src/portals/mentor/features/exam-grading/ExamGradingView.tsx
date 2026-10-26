/**
 * ExamGradingView — Hàng đợi bài thi chờ chấm Writing/Speaking + panel chấm (Dev 3)
 * -----------------------------------------------------------
 * Cũ nhất trước. Admin thấy mọi đề; mentor chỉ thấy đề thuộc khóa mình phụ trách (backend lọc).
 * URL: /mentor/exam-grading
 */

import React, { useState } from 'react';
import { ClipboardCheck, RotateCcw } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { ATTEMPT_STATUS_LABEL } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { detectScale, toSkill } from '@/shared/constants/examScales';
import { useAttemptForGrading, useGradingExamInfo, usePendingAttempts } from './hooks/useExamGrading';
import { EssayGradeForm } from './EssayGradeForm';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const ExamGradingView: React.FC = () => {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queue = usePendingAttempts(page);
  const detail = useAttemptForGrading(selectedId);
  const essays = (detail.data?.answers ?? []).filter((a) => a.questionType === 'essay');
  const examInfo = useGradingExamInfo(detail.data?.attempt.examId);
  const scale = detectScale(examInfo.data?.exam.certificateName);
  /** Kỹ năng của câu theo section (Writing / Speaking) để chọn thang chấm */
  const skillOf = (sectionId?: string) =>
    toSkill((detail.data?.sectionScores ?? []).find((s) => s.sectionId === sectionId)?.sectionType);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Chấm bài thi Writing / Speaking</h1>
        <p className="text-sm text-slate-500 mt-1">
          Phần trắc nghiệm đã được chấm tự động; chỉ còn các câu tự luận chờ bạn.
        </p>
      </div>

      <div className="grid lg:grid-cols-[360px,1fr] gap-5 items-start">
        <Card noPadding>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800">Hàng đợi ({queue.data?.totalElements ?? 0})</span>
            <Button size="sm" variant="ghost" leftIcon={RotateCcw} onClick={() => queue.refetch()}>
              Làm mới
            </Button>
          </div>
          {queue.isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : queue.isError ? (
            <ErrorState className="m-4" message={queue.error.message} onRetry={() => queue.refetch()} />
          ) : (queue.data?.data.length ?? 0) === 0 ? (
            <EmptyState className="m-4" title="Không còn bài nào chờ chấm" />
          ) : (
            <>
              <ul>
                {queue.data?.data.map((a) => (
                  <li key={a.attemptId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.attemptId)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50',
                        selectedId === a.attemptId && 'bg-primary-tint',
                      )}
                    >
                      <p className="font-bold text-sm text-slate-800">{a.studentName ?? a.studentEmail}</p>
                      <p className="text-xs text-slate-500 truncate">{a.examTitle}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Nộp {a.endTime ? formatDateTime(a.endTime) : '—'} · {ATTEMPT_STATUS_LABEL[a.status]}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {queue.data && (
                <Pagination
                  className="py-3"
                  currentPage={queue.data.currentPage}
                  totalPages={queue.data.totalPages}
                  onChange={setPage}
                />
              )}
            </>
          )}
        </Card>

        <Card className="space-y-4">
          {!selectedId ? (
            <div className="py-16 text-center text-sm text-slate-500">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" /> Chọn một bài trong hàng đợi để chấm.
            </div>
          ) : detail.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-48" />
            </div>
          ) : detail.isError || !detail.data ? (
            <ErrorState message={detail.error?.message} onRetry={() => detail.refetch()} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-slate-900">{detail.data.attempt.studentName}</h2>
                <Badge variant="primary">{detail.data.attempt.examTitle}</Badge>
                {scale.kind !== 'raw' && <Badge variant={scale.badge}>{scale.label}</Badge>}
                <Badge variant={detail.data.attempt.status === 'graded' ? 'success' : 'warning'}>
                  {ATTEMPT_STATUS_LABEL[detail.data.attempt.status]}
                </Badge>
                <span className="ml-auto text-sm font-bold text-slate-700">
                  Tổng hiện tại: {detail.data.attempt.score}/{detail.data.attempt.maxScore}
                </span>
              </div>
              {essays.length === 0 && <p className="text-sm text-slate-500">Bài này không có câu tự luận.</p>}
              {essays.map((answer) => (
                <EssayGradeForm
                  key={`${selectedId}-${answer.questionId}-${scale.kind}`}
                  attemptId={selectedId}
                  answer={answer}
                  scale={scale}
                  skill={skillOf(answer.sectionId)}
                />
              ))}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExamGradingView;
