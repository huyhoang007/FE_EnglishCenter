/**
 * ExamCard — thẻ đề trong ngân hàng đề (Dev 3)
 */

import React from 'react';
import { Clock, FileQuestion, Hourglass, Layers, Lock } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { useCertificateScale } from '../hooks/useCertificateScale';
import { EXAM_ERROR_CODE, EXAM_TYPE_LABEL, type ExamSummary } from '@/shared/types';
import { cn } from '@/shared/utils/cn';


interface ExamCardProps {
  exam: ExamSummary;
  onSelect: (examId: string) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, onSelect }) => {
  const scale = useCertificateScale(exam.certificateId, exam.certificateName);
  const locked = exam.accessible === false && !!exam.lockReason;
  const pending = String(exam.lockCode) === EXAM_ERROR_CODE.PREREQUISITE_PENDING_GRADING;
  const LockIcon = pending ? Hourglass : Lock;
  return (
    <Card
      hoverable
      className={cn('cursor-pointer flex flex-col gap-4', locked && 'bg-slate-50/70')}
      onClick={() => onSelect(exam.examId)}
      role="button"
      aria-label={`Xem đề ${exam.examTitle}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {exam.certificateName && <Badge variant={scale.badge} size="sm">{exam.certificateName}</Badge>}
        {exam.examType && <Badge variant="primary" size="sm">{EXAM_TYPE_LABEL[exam.examType]}</Badge>}
        {exam.recommendedLevel && <Badge variant="neutral" size="sm">Level {exam.recommendedLevel}</Badge>}
        {exam.requiresEnrollment && (
          <Badge variant="warning" size="sm" icon={Lock}>
            Học viên khóa học
          </Badge>
        )}
      </div>

      <div>
        <h3 className="font-extrabold text-slate-900 leading-snug">{exam.examTitle}</h3>
        {exam.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{exam.description}</p>}
      </div>

      {locked && (
        <p
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold',
            pending ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-amber-200 bg-amber-50 text-amber-800',
          )}
        >
          <LockIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{exam.lockReason}</span>
        </p>
      )}

      <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {exam.durationMinutes} phút
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
          {exam.totalQuestions} câu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          {exam.totalParts} phần
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm font-extrabold text-primary">
          {exam.courseTitle ?? 'Đề của khóa học'}
        </span>
        {exam.examCode && <span className="text-[11px] font-mono text-slate-400">{exam.examCode}</span>}
      </div>
    </Card>
  );
};

export default ExamCard;
