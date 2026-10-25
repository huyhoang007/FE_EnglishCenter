/**
 * ExamTimer — đồng hồ đếm ngược phòng thi (Dev 3)
 * Vàng khi còn < 5 phút, đỏ nhấp nháy khi còn < 1 phút.
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { formatDuration } from '../utils/examRoom';

export const ExamTimer: React.FC<{ secondsLeft: number }> = ({ secondsLeft }) => {
  const isUrgent = secondsLeft < 5 * 60;
  const isCritical = secondsLeft < 60;
  const tone = isCritical ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-emerald-400';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl border shrink-0',
        isCritical
          ? 'bg-rose-50 border-rose-300 animate-pulse'
          : isUrgent
            ? 'bg-amber-50 border-amber-300'
            : 'bg-slate-900 border-slate-900',
      )}
      role="timer"
      aria-live="polite"
    >
      <Clock className={cn('w-4 h-4', tone)} />
      <div className="leading-none">
        <p className={cn('text-[9px] font-extrabold uppercase tracking-widest', isUrgent ? tone : 'text-slate-400')}>
          {isCritical ? 'Sắp hết giờ!' : isUrgent ? 'Cảnh báo' : 'Thời gian còn'}
        </p>
        <p className={cn('font-mono font-extrabold text-lg tabular-nums', tone)}>{formatDuration(secondsLeft)}</p>
      </div>
    </div>
  );
};

export default ExamTimer;
