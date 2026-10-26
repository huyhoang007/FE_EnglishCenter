/**
 * ExamStatusPill — nhãn trạng thái đề dễ đọc: nền nhạt, chữ đậm đủ tương phản, có chấm màu (Dev 3)
 */

import React from 'react';
import { EXAM_STATUS_LABEL, type ExamStatus } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

const STYLE: Record<ExamStatus, { pill: string; dot: string }> = {
  draft: { pill: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
  published: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  archived: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
};

export const ExamStatusPill: React.FC<{ status: ExamStatus; className?: string }> = ({ status, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap',
      STYLE[status].pill,
      className,
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full', STYLE[status].dot)} aria-hidden="true" />
    {EXAM_STATUS_LABEL[status]}
  </span>
);

export default ExamStatusPill;
