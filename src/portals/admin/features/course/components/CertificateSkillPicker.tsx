/**
 * CertificateSkillPicker — Chọn kỹ năng (certificate_part) cho bài tập (Dev 2.5)
 * -----------------------------------------------------------
 * Bài tập có thể gắn với một kỹ năng của chứng chỉ (FK
 * `course_content.certificate_part_id`) để biết bài đo lường kỹ năng nào.
 *
 * Dùng API sẵn có của team (KHÔNG sửa module Certificate):
 *   GET /api/v1/certificates        → danh sách chứng chỉ (KHÔNG kèm parts)
 *   GET /api/v1/certificates/{id}   → chi tiết + danh sách kỹ năng (parts)
 *
 * Vì endpoint danh sách không trả `parts`, ta gọi thêm endpoint chi tiết
 * cho từng chứng chỉ rồi gộp thành một danh sách phẳng.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ChevronDown, Loader2, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { apiGet } from '@/shared/api/axiosClient';
import type {
  CertificateDto,
  CertificatePartDto,
} from '@/shared/types/catalog.types';

export interface CertificateSkillPickerProps {
  /** Id kỹ năng đang chọn (rỗng = chưa gắn). */
  value: string;
  onChange: (certificatePartId: string) => void;
  disabled?: boolean;
}

interface SkillOption {
  part: CertificatePartDto;
  certificateName: string;
  label: string;
}

export const CertificateSkillPicker: React.FC<CertificateSkillPickerProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  // Danh sách chứng chỉ.
  const certQuery = useQuery({
    queryKey: ['certificates', 'skill-picker'],
    queryFn: async () => {
      const res = await apiGet<CertificateDto[]>('/api/v1/certificates');
      if (!res.success) throw new Error(res.message || 'Không tải được chứng chỉ');
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  // Chi tiết từng chứng chỉ (có `parts`).
  const detailQuery = useQuery({
    queryKey: ['certificates', 'skill-picker', 'details', certQuery.data?.map((c) => c.certificateId) ?? []],
    queryFn: async () => {
      const list = certQuery.data ?? [];
      const details = await Promise.all(
        list.map(async (cert) => {
          const res = await apiGet<CertificateDto>(`/api/v1/certificates/${cert.certificateId}`);
          return res.success ? res.data : null;
        }),
      );
      return details.filter((d): d is CertificateDto => d != null);
    },
    enabled: (certQuery.data?.length ?? 0) > 0,
    staleTime: 5 * 60_000,
  });

  // Gom tất cả kỹ năng của mọi chứng chỉ thành một danh sách phẳng.
  const options = useMemo<SkillOption[]>(() => {
    const out: SkillOption[] = [];
    for (const cert of detailQuery.data ?? []) {
      for (const part of cert.parts ?? []) {
        out.push({
          part,
          certificateName: cert.certificateName,
          label: `${part.partName} — ${cert.certificateName}`,
        });
      }
    }
    return out;
  }, [detailQuery.data]);

  const selected = options.find((o) => o.part.partId === value);

  const isLoading = certQuery.isLoading || detailQuery.isLoading;
  const isError = certQuery.isError || detailQuery.isError;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-sm text-left',
          'focus:outline-none focus:ring-2 focus:ring-[#0052CC]/15 focus:border-[#0052CC]',
          disabled && 'opacity-60 cursor-not-allowed',
          !disabled && 'hover:border-slate-300',
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Award className="w-4 h-4 text-slate-400 shrink-0" />
          <span
            className={cn(
              'truncate',
              selected ? 'text-slate-800' : 'text-slate-400',
            )}
          >
            {selected ? selected.label : 'Chưa gắn kỹ năng chứng chỉ'}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {selected && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600"
          title="Bỏ gắn kỹ năng"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {open && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải kỹ năng…
              </div>
            ) : isError ? (
              <div className="px-3 py-4 text-xs text-rose-600">
                Không tải được danh sách kỹ năng.
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400">
                Chưa có kỹ năng chứng chỉ nào.
              </div>
            ) : (
              <ul className="py-1">
                {options.map((o) => (
                  <li key={o.part.partId}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.part.partId);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs hover:bg-slate-50',
                        o.part.partId === value &&
                          'bg-primary-tint font-bold text-[#0052CC]',
                      )}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CertificateSkillPicker;
