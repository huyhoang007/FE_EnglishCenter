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
import { Link } from 'react-router-dom';
import { CheckCircle2, FileQuestion, Search, TriangleAlert } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  fetchAdminExams,
  type ExamSummaryDto,
} from '@/shared/api/examService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { ADMIN_ROUTES } from '@/shared/constants/routes';

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
   * Chỉ hiện đề ĐÃ CÔNG BÁI (`published`).
   *
   * Mặc định `false` → hiện MỌI trạng thái (nháp / đã công bố / lưu trữ).
   * Lý do: đề tạo ở module Quản lý đề thi LUÔN ở trạng thái nháp, phải
   * bấm "Công khai đề" mới làm được cho học viên. Nếu chỉ lấy `published`
   * thì Admin thấy đề ở trang Quản lý đề thi nhưng picker báo "chưa có đề nào"
   * → rất khó hiểu. Đề nháp hiện nhưng KHÔNG chọn được (BE cũng chặn khi lưu).
   */
  publishedOnly?: boolean;
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
  publishedOnly = false,
}) => {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const [keyword, setKeyword] = useState('');
  /** Tên nhóm radio duy nhất — tránh 2 picker trên cùng trong đánh nhầm. */
  const radioGroupName = useId();

  /**
   * Lấy đề của khóa học này.
   *
   * <p>BE lọc theo `course_id` — đề tạo ở module Quản lý đề thi với phạm vi
   * "Kiểm tra đầu vào" (trial) thì KHÔNG gắn khóa học → không xuất hiện.
   * Vì vậy lấy thêm danh sách đề toàn hệ thống và ghép lại: đề của khóa học
   * này được ưu tiên lên đầu, các đề khác để dưới (vẫn gắn được vì
   * `CourseServiceImpl.resolveExam` chỉ chặn khi đề thuộc KHÁC khóa).
   */
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
      publishedOnly ? 'published' : 'all',
    ],
    queryFn: () =>
      fetchAdminExams({
        courseId,
        ...(publishedOnly ? { status: 'published' } : {}),
        size: 100,
      }),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });

  /** Đề toàn hệ thống — fallback cho đề không gắn khóa học (phạm vi trial). */
  const {
    data: allExamPage,
    isLoading: isLoadingAll,
  } = useQuery({
    queryKey: [...QUERY_KEYS.catalog.course(courseId), 'exams', 'system-wide'],
    queryFn: () =>
      fetchAdminExams({
        ...(publishedOnly ? { status: 'published' } : {}),
        size: 200,
      }),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });

  /** `fetchAdminExams` trả `PageResponse` (không wrapper) → lấy mảng `data`. */
  const exams: ExamSummaryDto[] = useMemo(() => {
    const courseExams = examPage?.data ?? [];
    const systemExams = allExamPage?.data ?? [];
    if (systemExams.length === 0) return courseExams;

    // Gộp, loại trùng, ưu tiên đề thuộc khóa học này lên đầu.
    const seen = new Set<string>();
    const merged: ExamSummaryDto[] = [];
    for (const exam of [...courseExams, ...systemExams]) {
      if (seen.has(exam.examId)) continue;
      seen.add(exam.examId);
      merged.push(exam);
    }
    return merged.sort((a, b) => {
      const aOwn = a.courseId === courseId ? 0 : 1;
      const bOwn = b.courseId === courseId ? 0 : 1;
      return aOwn - bOwn;
    });
  }, [examPage, allExamPage, courseId]);

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

  if (isLoading || isLoadingAll) {
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
        <div className="space-y-2">
          <EmptyState
            title={t('content.homework.examListEmpty')}
            className="py-6"
          />
          <Link
            to={ADMIN_ROUTES.exams}
            className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-xs font-bold text-[#0052CC] border border-[#0052CC]/30 bg-blue-50/50 hover:bg-blue-50 transition-colors"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            {t('content.homework.examManageLink')}
          </Link>
        </div>
      ) : filteredExams.length === 0 ? (
        <EmptyState title={t('content.homework.examNoResult')} className="py-6" />
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
          {filteredExams.map((exam) => {
            const checked = selectedExamId === exam.examId;
            /**
             * Đề nào gắn được vào bài tập?
             *
             * <ul>
             *   <li>Phải {@code published} — học viên mở lượt thi được, và BE
             *       ({@code CourseServiceImpl.resolveExam}) cũng từ chối khi lưu;</li>
             *   <li>Đề phạm vi {@code course} phải thuộc ĐÚNG khóa học này — đề của
             *       khóa khác thì {@code ExamAccessPolicy} yêu cầu enrollment khóa
             *       đó, học viên của khóa này không mở được;</li>
             *   <li>Đề phạm vi {@code trial} (không gắn khóa học) được phép nếu
             *       {@code isFree} — đề trả phí thì học viên phải mua mới làm được.</li>
             * </ul>
             * Đề không hợp lệ vẫn HIỂN THỊ (để Admin biết đề tồn tại) nhưng không
             * bấm chọn được.
             */
            const published = exam.status === 'published';
            const isOwnCourseExam = exam.examScope !== 'course'
              ? true
              : exam.courseId === courseId;
            const isFreeTrial = exam.examScope !== 'trial'
              ? true
              : exam.isFree !== false;
            /**
             * Đề giữa kỳ / cuối kỳ có điều kiện tiên quyết (đạt quiz / đạt giữa kỳ +
             * đủ bài tập của khóa). Gắn vào bài tập tạo vòng lặp khoá: bài tập chưa
             * nộp → đề mở không được → không nộp được bài tập. BE cũng chặn.
             */
            const isSequential = exam.examType === 'midterm' || exam.examType === 'final';
            const selectable =
              published && isOwnCourseExam && isFreeTrial && !isSequential;

            return (
              <li
                key={exam.examId}
                className={cn(
                  'rounded-xl border bg-white px-3 py-2.5 transition-colors',
                  checked
                    ? 'border-[#0052CC]/50 bg-blue-50/40'
                    : 'border-slate-200/80 hover:border-[#0052CC]/40',
                  !selectable && 'opacity-70',
                )}
              >
                <label
                  className={cn(
                    'flex items-start gap-2.5',
                    selectable ? 'cursor-pointer' : 'cursor-not-allowed',
                  )}
                >
                  <input
                    type="radio"
                    name={radioGroupName}
                    checked={checked}
                    disabled={!selectable}
                    onChange={() => onSelect(exam.examId)}
                    aria-label={exam.examTitle}
                    className="mt-0.5 w-4 h-4 border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30 cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {exam.examTitle}
                    </p>
                    {!selectable && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                        <TriangleAlert className="w-3 h-3 shrink-0" />
                        {!published
                          ? t('content.homework.examNotPublishedHint')
                          : !isOwnCourseExam
                            ? t('content.homework.examOtherCourseHint')
                            : isSequential
                              ? t('content.homework.examSequentialHint')
                              : t('content.homework.examPaidHint')}
                      </p>
                    )}
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
                      {/* Đề không thuộc khóa học này → vẫn gắn được nhưng nên
                          cảnh báo Admin vì học viên có thể không mở được. */}
                      {exam.courseId !== courseId && exam.examScope === 'course' && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold text-amber-600">
                            {t('content.homework.examOtherCourse')}
                          </span>
                        </>
                      )}
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

      {/* ---------- Link sang trang Quản lý đề thi ---------- */}
      {exams.length > 0 && (
        <Link
          to={ADMIN_ROUTES.exams}
          className="inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-xl text-[11px] font-bold text-[#0052CC] border border-[#0052CC]/25 bg-blue-50/40 hover:bg-blue-50 transition-colors"
        >
          <FileQuestion className="w-3.5 h-3.5" />
          {t('content.homework.examManageLink')}
        </Link>
      )}
    </div>
  );
};

export default ExamPicker;
