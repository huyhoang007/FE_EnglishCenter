/**
 * CertificateSkillPicker — Chọn kỹ năng (certificate_part) cho bài tập
 * -----------------------------------------------------------
 * Bài tập có thể gắn với một kỹ năng của chứng chỉ (FK
 * `course_content.certificate_part_id`) để biết bài đo lường kỹ năng nào.
 *
 *   - Khóa học có chứng chỉ  → chỉ hiện kỹ năng của chứng chỉ đó
 *     (GET /api/v1/certificates/{id}), 1 request duy nhất.
 *   - Khóa học chưa gắn chứng chỉ → không cho chọn (backend cũng chặn).
 *
 * Dùng `<select>` gốc thay vì dropdown tự vẽ: dropdown `absolute` nằm trong
 * modal `overflow-y-auto` bị cắt mất, phải cuộn modal mới thấy hết lựa chọn.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiGet } from '@/shared/api/axiosClient';
import type { CertificateDto } from '@/shared/types/catalog.types';
import { Select } from './form/formControls';

export interface CertificateSkillPickerProps {
  /** Id kỹ năng đang chọn (rỗng = chưa gắn). */
  value: string;
  onChange: (certificatePartId: string) => void;
  /** Chứng chỉ của khóa học — chỉ liệt kê kỹ năng thuộc chứng chỉ này. */
  certificateId?: string | null;
  disabled?: boolean;
}

export const CertificateSkillPicker: React.FC<CertificateSkillPickerProps> = ({
  value,
  onChange,
  certificateId,
  disabled,
}) => {
  const detailQuery = useQuery({
    queryKey: ['certificates', 'skill-picker', certificateId],
    queryFn: async () => {
      const res = await apiGet<CertificateDto>(`/api/v1/certificates/${certificateId}`);
      if (!res.success) throw new Error(res.message || 'Không tải được kỹ năng của chứng chỉ');
      return res.data;
    },
    enabled: Boolean(certificateId),
    staleTime: 5 * 60_000,
  });

  if (!certificateId) {
    return (
      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        Khóa học chưa gắn chứng chỉ nên chưa chọn được kỹ năng. Hãy gắn chứng chỉ ở phần sửa khóa học.
      </p>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải kỹ năng...
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <p className="text-xs text-rose-600 py-2">
        {detailQuery.error instanceof Error ? detailQuery.error.message : 'Không tải được kỹ năng'}
      </p>
    );
  }

  const parts = detailQuery.data?.parts ?? [];

  return (
    <Select
      value={value}
      disabled={disabled || parts.length === 0}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">
        {parts.length === 0 ? 'Chứng chỉ chưa có kỹ năng nào' : 'Chưa gắn kỹ năng'}
      </option>
      {parts.map((part) => (
        <option key={part.partId} value={part.partId}>
          {part.partName}
        </option>
      ))}
    </Select>
  );
};

export default CertificateSkillPicker;
