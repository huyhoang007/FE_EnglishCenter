/**
 * AvailableSlotChips — hiện lịch rảnh hằng tuần của học viên (Dev 5, V26)
 * -----------------------------------------------------------
 * Dùng ở: thẻ tư vấn của học viên, danh sách yêu cầu tư vấn / hồ sơ học viên của mentor, form tạo gói.
 * Giờ là giờ Việt Nam (khung lặp lại mỗi tuần).
 */

import React from 'react';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { AvailableSlot } from '@/shared/types';
import { formatSlot, sortSlots } from './scheduleFormat';

export const AvailableSlotChips: React.FC<{
  slots: AvailableSlot[] | null | undefined;
  /** Nhãn đứng trước, mặc định "Lịch rảnh" */
  label?: string;
  className?: string;
}> = ({ slots, label = 'Lịch rảnh', className }) => {
  const list = sortSlots(slots ?? []);
  return (
    <div className={cn('flex items-start gap-2 flex-wrap text-sm', className)}>
      <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold shrink-0 h-6">
        <CalendarClock className="w-4 h-4" /> {label}:
      </span>
      {list.length === 0 ? (
        <span className="text-slate-400 h-6 inline-flex items-center">Chưa gửi</span>
      ) : (
        list.map((slot) => (
          <span
            key={`${slot.day}-${slot.from}-${slot.to}`}
            className="inline-flex items-center h-6 px-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold"
          >
            {formatSlot(slot)}
          </span>
        ))
      )}
    </div>
  );
};

export default AvailableSlotChips;
