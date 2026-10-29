/**
 * HomeworkExamView — màn làm bài TRẮC NGHIỆM cho bài tập (Dev 2.5)
 * -----------------------------------------------------------
 * URL: /homework/attempts/:attemptId
 *
 * Màn này là bản RIÊNG cho bài tập, KHÔNG dùng lại `ExamRoomView` của module Exam:
 *   - điều hướng về lại đúng bài tập sau khi nộp;
 *   - hiển thị điểm theo thang của bài tập;
 *   - không đụng vào code của team.
 *
 * Dùng lại component hiển thị câu hỏi (`QuestionItem`) và tiện ích chấm điểm
 * (`examRoom.ts`) của module Exam — chỉ đọc, không sửa.
 */

import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { QUESTION_TYPE_LABEL, type ExamQuestion } from '@/shared/types';
import { QuestionItem } from '@/portals/client/features/exams/components/QuestionItem';
import { isAnswered, type DraftAnswer } from '@/portals/client/features/exams/utils/examRoom';
import {
  useHomeworkAttempt,
  useSubmitHomeworkAttempt,
} from '../hooks/useHomeworkExam';

export const HomeworkExamView: React.FC<{ attemptId?: string }> = ({
  attemptId: attemptIdProp,
}) => {
  const params = useParams<{ attemptId: string }>();
  const attemptId = attemptIdProp ?? params.attemptId ?? '';
  const navigate = useNavigate();
  const query = useHomeworkAttempt(attemptId);
  const submitMutation = useSubmitHomeworkAttempt(attemptId);

  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState('');
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const attempt = query.data;

  /** Toàn bộ câu hỏi theo thứ tự hiển thị. */
  const questions: ExamQuestion[] = useMemo(() => {
    if (!attempt?.exam) return [];
    const all = [
      ...attempt.exam.sections.flatMap((s) => s.questions ?? []),
      ...(attempt.exam.unsectionedQuestions ?? []),
    ];
    return all.sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0));
  }, [attempt?.exam]);

  /** Đáp án đã lưu trên server → nạp vào state khi mở lại lượt thi. */
  const savedAnswers = useMemo(() => {
    const initial: Record<string, DraftAnswer> = {};
    for (const a of attempt?.answers ?? []) {
      initial[a.questionId] = {
        selectedOptionId: a.selectedOptionId ?? null,
        answerText: a.answerText ?? null,
      };
    }
    return initial;
  }, [attempt?.answers]);

  /** State hiện tại (đã sửa) ưu tiên đáp án lưu trên server. */
  const currentAnswers = useMemo(
    () => ({ ...savedAnswers, ...answers }),
    [savedAnswers, answers],
  );

  const answeredCount = questions.filter((q) =>
    isAnswered(q, currentAnswers[q.questionId]),
  ).length;

  const handleChange = (questionId: string, value: DraftAnswer) => {
    setActiveQuestionId(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const payload = questions.map((q) => {
      const draft = currentAnswers[q.questionId];
      return {
        questionId: q.questionId,
        selectedOptionId: draft?.selectedOptionId ?? null,
        answerText: draft?.answerText ?? null,
      };
    });
    try {
      await submitMutation.mutateAsync(payload);
      setConfirmOpen(false);
      navigate(CLIENT_ROUTES.course());
    } catch {
      /* lỗi hiển thị qua toast trong hook */
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (query.isError || !attempt) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate(CLIENT_ROUTES.course())}
        >
          Quay lại khóa học
        </Button>
        <ErrorState
          message={query.error?.message ?? 'Không tải được bài làm.'}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  // Đã nộp rồi → không cho làm lại ở màn này.
  if (attempt.status !== 'in_progress') {
    return (
      <div className="space-y-4">
        <Card className="text-center space-y-3 py-10">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
          <p className="font-extrabold text-slate-900">Bài nộp đã được ghi nhận</p>
          <p className="text-sm text-slate-500">
            Bạn đã nộp bài này. Quay lại khóa học để xem điểm và nhận xét.
          </p>
          <Button
            onClick={() => navigate(CLIENT_ROUTES.course())}
            leftIcon={ArrowLeft}
          >
            Quay lại khóa học
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* ---- Header ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0052CC] flex items-center justify-center text-white shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0052CC]">
            Bài tập trắc nghiệm
          </p>
          <p className="font-bold text-sm text-slate-900 truncate">
            {attempt.examTitle}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            {answeredCount}/{questions.length} câu
          </Badge>
          <Badge variant="neutral" size="sm">
            {attempt.remainingSeconds > 0
              ? `${Math.floor(attempt.remainingSeconds / 60)} phút`
              : 'Hết giờ'}
          </Badge>
        </div>
      </div>

      {/* ---- Danh sách câu hỏi ---- */}
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionItem
            key={q.questionId}
            ref={(el) => {
              questionRefs.current[q.questionId] = el;
            }}
            question={q}
            value={currentAnswers[q.questionId]}
            onChange={(v) => handleChange(q.questionId, v)}
            isActive={activeQuestionId === q.questionId}
          />
        ))}
      </div>

      {/* ---- Thanh nộp bài (mobile) ---- */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center gap-3">
        <span className="text-xs text-slate-600 flex-1 min-w-0 leading-tight">
          <span className="block text-sm font-bold text-slate-900 tabular-nums">
            {answeredCount}/{questions.length}
          </span>
          câu đã làm
        </span>
        <Button leftIcon={Send} onClick={() => setConfirmOpen(true)}>
          Nộp bài
        </Button>
      </div>

      {/* ---- Nút nộp bài (desktop) ---- */}
      <div className="hidden lg:flex justify-end">
        <Button leftIcon={Send} onClick={() => setConfirmOpen(true)}>
          Nộp bài
        </Button>
      </div>

      {/* ---- Xác nhận nộp ---- */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitMutation.isPending && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Xác nhận nộp bài?
            </h3>
            <p className="text-sm text-slate-600">
              Bạn đã làm{' '}
              <b>
                {answeredCount}/{questions.length}
              </b>{' '}
              câu. Sau khi nộp sẽ không sửa được nữa.
            </p>
            {submitMutation.isError && (
              <p className="text-sm text-rose-600 font-semibold">
                {submitMutation.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={submitMutation.isPending}
              >
                Tiếp tục làm
              </Button>
              <Button
                leftIcon={submitMutation.isPending ? Loader2 : Send}
                isLoading={submitMutation.isPending}
                onClick={handleSubmit}
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkExamView;
