/**
 * ExamPicker — CHỌN ĐỀ THI / BÀI KIỂM TRA ĐỊNH NGHĄA SẴN
 * -----------------------------------------------------------
 * Dùng cho nội dung khóa học có `contentType = 'homework'`.
 *
 * API thật (Backend):
 *   GET /api/v1/admin/exams?courseId=…&status=…  → danh sách đề thi
 *
 * Component CHỈ lo phần chọn — không tự lưu. Việc gắn đề vào nội dung
 * khóa học diễn ra khi form submit (`examId` + `content_data.examId`).
 */

import React, { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileQuestion, Search } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  fetchAdminExams,
  type ExamSummaryDto,
} from '@/shared/api/examService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

/* =========================================================
 * Props
 * ========================================================= */
export interface ExamPickerProps {
  /** Khóa học — chỉ lấy đề thuộc khóa học này. */
  courseId: string;
  /** Id đề đang được chọn. */
  selectedExamId?: string;
  /** Gọi khi chọn / bỏ chọn đề. */
  onSelect: (examId: string) => void;
  /**
   * Cho phép chọn đề ở mọi trạng thái (draft/published/archived).
   * Mặc định `true` → hiện tất cả đề của khóa học (admin thấy đề đã setup
   * sẵn, kể cả đang nháp). Truyền `false` để chỉ hiện đề `published`.
   */
  includeAllStatuses?: boolean;
}

/* =========================================================
 * Helpers
 * ========================================================= */

/** Nhãn trạng thái đề (i18n). */
const useStatusLabel = () => {
  const { t } = useTranslation();
  return (status?: ExamSummaryDto['status']): string => {
    switch (status) {
      case 'published':
        return t('content.homework.examStatusPublished');
      case 'draft':
        return t('content.homework.examStatusDraft');
      case 'archived':
        return t('content.homework.examStatusArchived');
      default:
        return '—';
    }
  };
};

/* =========================================================
 * Component
 * ========================================================= */
export const ExamPicker: React.FC<ExamPickerProps> = ({
  courseId,
  selectedExamId,
  onSelect,
  includeAllStatuses = true,
}) => {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const [keyword, setKeyword] = useState('');
  /** Tên nhóm radio duy nhất — tránh 2 picker trên cùng trong đánh nhầm. */
  const radioGroupName = useId();

  const {
    data: examPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      ...QUERY_KEYS.catalog.course(courseId),
      'exams',
      includeAllStatuses ? 'all' : 'published',
    ],
    queryFn: () =>
      fetchAdminExams({
        courseId,
        ...(includeAllStatuses ? {} : { status: 'published' }),
        size: 100,
      }),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
  /** `fetchAdminExams` trả `PageResponse` (không wrapper) → lấy mảng `data`. */
  const exams: ExamSummaryDto[] = useMemo(
    () => examPage?.data ?? [],
    [examPage],
  );

  /* ---------- Lọc theo từ khoá (client-side) ---------- */
  const filteredExams = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return exams;
    return exams.filter(
      (exam) =>
        exam.examTitle.toLowerCase().includes(kw) ||
        (exam.examCode ?? '').toLowerCase().includes(kw) ||
        (exam.description ?? '').toLowerCase().includes(kw),
    );
  }, [exams, keyword]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* ---------- Ô tìm kiếm ---------- */}
      <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('content.homework.examSearch')}
          className="bg-transparent outline-none w-full text-xs placeholder:text-slate-400 text-slate-700"
          aria-label={t('content.homework.examSearch')}
        />
      </div>

      <p className="text-[11px] text-slate-500">
        {t('content.homework.examSelectHint')}
      </p>

      {/* ---------- Danh sách đề ---------- */}
      {exams.length === 0 ? (
        <EmptyState
          title={t('content.homework.examListEmpty')}
          className="py-6"
        />
      ) : filteredExams.length === 0 ? (
        <EmptyState title={t('content.homework.examNoResult')} className="py-6" />
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {filteredExams.map((exam) => {
            const checked = selectedExamId === exam.examId;

            return (
              <li
                key={exam.examId}
                className={cn(
                  'rounded-xl border bg-white px-3 py-2.5 transition-colors',
                  checked
                    ? 'border-[#0052CC]/50 bg-blue-50/40'
                    : 'border-slate-200/80 hover:border-[#0052CC]/40',
                )}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name={radioGroupName}
                    checked={checked}
                    onChange={() => onSelect(exam.examId)}
                    aria-label={exam.examTitle}
                    className="mt-0.5 w-4 h-4 border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {exam.examTitle}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {exam.examCode && (
                        <span className="font-mono font-semibold">
                          {exam.examCode}
                        </span>
                      )}
                      {exam.totalQuestions ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold">
                            {t('content.homework.examQuestions', {
                              count: exam.totalQuestions,
                            })}
                          </span>
                        </>
                      ) : null}
                      {exam.durationMinutes ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold">
                            {t('content.homework.examDuration', {
                              count: exam.durationMinutes,
                            })}
                          </span>
                        </>
                      ) : null}
                      <span className="text-slate-300">·</span>
                      <span
                        className={cn(
                          'font-semibold',
                          exam.status === 'published'
                            ? 'text-emerald-600'
                            : 'text-slate-400',
                        )}
                      >
                        {statusLabel(exam.status)}
                      </span>
                    </p>
                  </div>
                  {checked && (
                    <CheckCircle2 className="w-4 h-4 text-[#0052CC] shrink-0 mt-0.5" />
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {exams.length === 0 && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
          <FileQuestion className="w-3 h-3" />
          {t('content.homework.examListEmpty')}
        </p>
      )}
    </div>
  );
};

export default ExamPicker;
