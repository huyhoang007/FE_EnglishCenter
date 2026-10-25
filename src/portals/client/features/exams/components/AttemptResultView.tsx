/**
 * AttemptResultView — Kết quả lượt thi (Dev 3)
 * -----------------------------------------------------------
 * Điểm tổng, điểm theo section, từng câu kèm đáp án và nhận xét.
 * Hiển thị theo cấu hình show_score / show_answers của đề (backend đã lọc sẵn).
 * API: GET /api/v1/me/exam-attempts/{attemptId}/result
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Hourglass, MinusCircle, Target, XCircle } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { ATTEMPT_STATUS_LABEL } from '@/shared/types';
import { useAttemptResult } from '../hooks/useExams';
import { formatDuration } from '../utils/examRoom';
import { AnswerReviewItem } from './AnswerReviewItem';

interface AttemptResultViewProps {
  attemptId: string;
}

export const AttemptResultView: React.FC<AttemptResultViewProps> = ({ attemptId }) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useAttemptResult(attemptId);

  const backButton = (
    <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => navigate(CLIENT_ROUTES.examHistory)}>
      Lịch sử thi
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-5">
        {backButton}
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const { attempt } = data;
  const isPending = attempt.pendingManualGrading === true;

  return (
    <div className="space-y-5">
      {backButton}

      <Card className="grid md:grid-cols-[auto,1fr] gap-6 items-center">
        <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-white p-6 text-center min-w-[180px]">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Điểm</p>
          {data.scoreVisible ? (
            <>
              <p className="text-5xl font-extrabold text-slate-900 tabular-nums mt-2">{attempt.score}</p>
              <p className="text-sm text-slate-400 font-bold">
                / {attempt.maxScore} · {attempt.percentage}%
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-3">Đề không công bố điểm</p>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">{attempt.examTitle}</h1>
            <Badge
              variant={attempt.status === 'graded' ? 'success' : attempt.status === 'expired' ? 'warning' : 'primary'}
            >
              {ATTEMPT_STATUS_LABEL[attempt.status]}
            </Badge>
            {attempt.passed === true && <Badge variant="success">Đạt</Badge>}
            {attempt.passed === false && <Badge variant="danger">Chưa đạt</Badge>}
          </div>
          {isPending && (
            <p className="text-sm text-ai font-semibold flex items-center gap-1.5">
              <Hourglass className="w-4 h-4" /> Phần Writing/Speaking đang chờ mentor chấm, điểm sẽ cập nhật sau.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={Check} label="Đúng" value={data.correctCount ?? '—'} />
            <Stat icon={XCircle} label="Sai" value={data.incorrectCount ?? '—'} />
            <Stat icon={MinusCircle} label="Bỏ trống" value={data.unansweredCount} />
            <Stat icon={Clock} label="Thời gian" value={formatDuration(attempt.timeSpentSeconds ?? 0)} />
          </div>
        </div>
      </Card>

      {data.sectionScores && data.sectionScores.length > 0 && (
        <Card>
          <h2 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Điểm theo phần
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.sectionScores.map((s) => (
              <div key={s.sectionId} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="ai" size="sm">{s.sectionType}</Badge>
                  <span className="text-sm font-extrabold text-slate-900">
                    {s.earnedScore}/{s.maxScore}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{s.title}</p>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, s.percentage)}%` }} />
                </div>
                {s.pendingManualGrading && <p className="text-xs text-ai font-semibold">Chờ mentor chấm</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="font-extrabold text-slate-900">Chi tiết bài làm</h2>
        {data.answers.length === 0 && (
          <p className="text-sm text-slate-500">Đề không công bố chi tiết bài làm.</p>
        )}
        {data.answers.map((a) => (
          <AnswerReviewItem key={a.questionId} answer={a} isScoreVisible={data.scoreVisible} />
        ))}
      </Card>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="rounded-xl border border-slate-200 p-3 text-center">
    <Icon className="w-4 h-4 mx-auto text-slate-400" />
    <p className="text-base font-extrabold text-slate-900 tabular-nums mt-1">{value}</p>
    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
  </div>
);

export default AttemptResultView;
