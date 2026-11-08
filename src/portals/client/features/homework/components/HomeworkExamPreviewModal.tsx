/**
 * HomeworkExamPreviewModal — XEM TRƯỚC ĐỀ THI của bài tập trắc nghiệm
 * -----------------------------------------------------------
 * Vấn đề: bài tập loại `multiple_choice` chỉ có nút "Nộp bài" → học viên
 * không biết đề có bao nhiêu câu, mỗi câu hỏi gì, mất bao lâu → dễ bấm
 * nhầm rồi hết lượt.
 *
 * → Modal này cho học viên xem toàn bộ đề (câu hỏi + lựa chọn) TRƯỚC khi
 *   bấm "Bắt đầu làm bài", rồi quay lại bài tập để nộp.
 *
 * Cố ý KHÔNG dùng `QuestionItem` của module Exam: component đó cho chọn
 * đáp án → học viên tưởng đang làm bài, click nhầm rồi mất lượt. Ở đây ta
 * hiển thị READ-ONLY (chỉ đọc, không tương tác).
 */

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
} from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useExamDetail } from '@/portals/client/features/exams/hooks/useExams';
import { QUESTION_TYPE_LABEL, type ExamQuestion } from '@/shared/types';

export interface HomeworkExamPreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** Id của đề thi (course_content.exam_id). */
  examId?: string | null;
  /** Tên đề (fallback khi API lỗi). */
  examTitle?: string | null;
}

export const HomeworkExamPreviewModal: React.FC<
  HomeworkExamPreviewModalProps
> = ({ open, onClose, examId, examTitle }) => {
  const { data, isLoading, isError, error, refetch } = useExamDetail(
    open && examId ? examId : '',
  );

  /** Câu hỏi gộp từ các section + câu không thuộc section, đúng thứ tự hiển thị. */
  const questions: ExamQuestion[] = React.useMemo(() => {
    if (!data) return [];
    const all = [
      ...data.sections.flatMap((s) => s.questions ?? []),
      ...(data.unsectionedQuestions ?? []),
    ];
    return all.sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0));
  }, [data]);

  const totalPoints = React.useMemo(
    () => questions.reduce((sum, q) => sum + (q.points ?? 0), 0),
    [questions],
  );

  const title = data?.exam?.examTitle ?? examTitle ?? 'Đề thi';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Xem trước đề — chưa làm bài, không mất lượt"
      icon={FileText}
      maxWidth="lg"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message ?? 'Không tải được đề thi.'}
          onRetry={() => refetch()}
        />
      ) : !examId ? (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            Bài tập này chưa được liên kết đề thi. Vui lòng liên hệ mentor.
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            Đề thi chưa có câu hỏi nào được công bố. Vui lòng liên hệ mentor.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ---- Tóm tắt đề ---- */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="sm" icon={ListChecks}>
              {questions.length} câu hỏi
            </Badge>
            {data?.exam?.durationMinutes != null && (
              <Badge variant="neutral" size="sm" icon={Clock}>
                {data.exam.durationMinutes} phút
              </Badge>
            )}
            {totalPoints > 0 && (
              <Badge variant="neutral" size="sm">
                Tổng {totalPoints} điểm
              </Badge>
            )}
            {data?.exam?.recommendedLevel && (
              <Badge variant="neutral" size="sm">
                {data.exam.recommendedLevel}
              </Badge>
            )}
          </div>

          {data?.exam?.description && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {data.exam.description}
              </p>
            </div>
          )}

          {/* ---- Danh sách câu hỏi (READ-ONLY) ---- */}
          <div className="space-y-3">
            {questions.map((q) => (
              <PreviewQuestion key={q.questionId} question={q} />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button leftIcon={CheckCircle2} onClick={onClose}>
              Quay lại bài tập
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HomeworkExamPreviewModal;

/* =========================================================
 * Câu hỏi xem trước — chỉ hiển thị, KHÔNG cho chọn đáp án
 * ========================================================= */
const PreviewQuestion: React.FC<{ question: ExamQuestion }> = ({
  question,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex items-start gap-2.5 mb-3">
      <span className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 bg-slate-900 text-white">
        {question.displayNumber}
      </span>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
          {question.questionText}
        </p>
        <div className="flex items-center gap-2">
          <Badge size="sm">{QUESTION_TYPE_LABEL[question.questionType]}</Badge>
          <span className="text-[11px] text-slate-400">{question.points} điểm</span>
        </div>
      </div>
    </div>

    {question.imageUrl && (
      <img
        src={question.imageUrl}
        alt=""
        className="ml-9 mb-3 rounded-xl max-h-64"
      />
    )}
    {question.audioUrl && (
      <audio
        controls
        src={question.audioUrl}
        className="ml-9 mb-3 w-[calc(100%-2.25rem)]"
      />
    )}

    {question.options && question.options.length > 0 && (
      <div className="ml-9 space-y-2">
        {question.options.map((opt, idx) => (
          <div
            key={opt.optionId}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60"
          >
            <span className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="min-w-0 text-sm text-slate-700 [overflow-wrap:anywhere]">
              {opt.optionText}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);
