/**
 * VocabularyBankPicker — CHỌN BỘ TỪ VỰNG TỪ KHO CHUNG
 * -----------------------------------------------------------
 * Dùng cho nội dung khóa học có `contentType = 'vocabulary'`.
 *
 * API thật (Backend):
 *   GET /api/v1/vocabulary-sets                  → duyệt kho từ vựng CHUNG
 *   GET /api/v1/courses/{courseId}/vocabularies  → các bộ đã gán cho khóa học
 *
 * Component CHỈ lo phần chọn — không tự lưu. Việc gán thật sự diễn ra
 * khi form nội dung khóa học submit (`vocabularySetIds` + `content_data.setIds`).
 *
 * UX (2 khu vực tách biệt — tránh add trùng):
 *   1. "Đã chọn" — mỗi bộ 1 dòng, CHỈ có nút X (xoá). Không có checkbox
 *      để tick lại → không thể add trùng một bộ đã chọn.
 *   2. "Kho từ vựng chung" — CHỈ hiện các bộ CHƯA chọn. Bộ đã chọn bị ẩn
 *      khỏi danh sách này → không có đường để add lần nữa.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Plus, Search, X } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  fetchCourseVocabularies,
  fetchVocabularyBank,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

/* =========================================================
 * Props
 * ========================================================= */
export interface VocabularyBankPickerProps {
  /** Id các bộ đang được TICK (state của form cha). */
  selectedIds: string[];
  /**
   * Gọi khi tick / bỏ tick 1 bộ.
   *
   * @param setId  Id bộ từ vựng trong kho chung.
   * @param title  Tên bộ (để form cha hiển thị preview gọn, không phải UUID).
   */
  onToggle: (setId: string, title: string) => void;
  /** Khóa học — dùng để đánh dấu bộ "đã có trong khóa học". */
  courseId?: string;
  /** Ẩn phần danh sách bộ đã chọn (dùng khi muốn giao diện gọn). */
  hideSelectedList?: boolean;
}

/* =========================================================
 * Component
 * ========================================================= */
export const VocabularyBankPicker: React.FC<VocabularyBankPickerProps> = ({
  selectedIds,
  onToggle,
  courseId,
  hideSelectedList = false,
}) => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');

  /* ---------- Kho từ vựng chung ---------- */
  const {
    data: bankSets = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularyBank,
    queryFn: () => fetchVocabularyBank(),
    staleTime: 60_000,
  });

  /* ---------- Bộ đã gán cho khóa học (để đánh dấu) ---------- */
  const { data: courseSets = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularies(courseId ?? ''),
    queryFn: () => fetchCourseVocabularies(courseId!),
    enabled: Boolean(courseId),
  });

  /* ---------- Lọc theo từ khoá (client-side) ---------- */
  const filteredSets = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return bankSets;
    return bankSets.filter(
      (set) =>
        set.title.toLowerCase().includes(kw) ||
        (set.description ?? '').toLowerCase().includes(kw) ||
        set.words.some(
          (w) =>
            w.word.toLowerCase().includes(kw) ||
            w.meaning.toLowerCase().includes(kw),
        ),
    );
  }, [bankSets, keyword]);

  /** Các bộ ĐÃ CHỌN (theo thứ tự tick). */
  const selectedSets = useMemo(
    () => bankSets.filter((s) => selectedIds.includes(s.setId)),
    [bankSets, selectedIds],
  );

  /**
   * Các bộ CÒN LẠI trong kho — BỎ HẾT bộ đã chọn.
   *
   * → người dùng không thể tick lại một bộ đã chọn; muốn bỏ thì bấm X ở
   *   khu vực "Đã chọn" (bộ sẽ quay lại danh sách kho).
   */
  const availableSets = useMemo(
    () => filteredSets.filter((s) => !selectedIds.includes(s.setId)),
    [filteredSets, selectedIds],
  );

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
      {/* ================= ĐÃ CHỌN (chỉ xoá) ================= */}
      {!hideSelectedList && (
        <div className="rounded-xl border border-[#0052CC]/25 bg-blue-50/50 p-3 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('content.vocab.bankSelected')}{' '}
            <span className="rounded-md bg-[#0052CC] px-1.5 py-0.5 text-[10px] text-white tabular-nums">
              {selectedSets.length}
            </span>
          </p>

          {selectedSets.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              {t('content.vocab.bankSelectedEmpty')}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {selectedSets.map((set) => (
                <li
                  key={set.setId}
                  className="flex items-center gap-2 rounded-lg bg-white border border-[#0052CC]/20 px-2.5 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 truncate flex-1">
                    {set.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {t('content.vocab.libraryWords', {
                      count: set.wordCount,
                    })}
                  </span>
                  {/* Nút X — bỏ chọn (bộ sẽ quay lại danh sách kho bên dưới). */}
                  <button
                    type="button"
                    onClick={() => onToggle(set.setId, set.title)}
                    title={t('content.vocab.bankRemove')}
                    aria-label={`${t('content.vocab.bankRemove')} — ${set.title}`}
                    className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ================= KHO TỪ VỰNG CHUNG (chỉ thêm) ================= */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
        {/* ---- Ô tìm kiếm ---- */}
        <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('content.vocab.bankSearch')}
            className="bg-transparent outline-none w-full text-xs placeholder:text-slate-400 text-slate-700"
            aria-label={t('content.vocab.bankSearch')}
          />
        </div>

        {bankSets.length === 0 ? (
          <EmptyState title={t('content.vocab.bankEmpty')} className="py-6" />
        ) : availableSets.length === 0 ? (
          <EmptyState
            title={
              keyword
                ? t('content.vocab.bankNoResult')
                : t('content.vocab.bankAllSelected')
            }
            className="py-6"
          />
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {availableSets.map((set) => {
              const assigned = courseSets.some((s) => s.setId === set.setId);

              return (
                <li
                  key={set.setId}
                  className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 transition-colors hover:border-[#0052CC]/40 hover:bg-blue-50/30"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {set.title}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold">
                          {t('content.vocab.libraryWords', {
                            count: set.wordCount,
                          })}
                        </span>
                        {assigned && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-semibold text-emerald-600">
                              {t('content.vocab.bankAssigned')}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    {/* Nút "+" — thêm bộ này vào nội dung. */}
                    <button
                      type="button"
                      onClick={() => onToggle(set.setId, set.title)}
                      title={t('content.vocab.bankAdd')}
                      aria-label={`${t('content.vocab.bankAdd')} — ${set.title}`}
                      className="mt-0.5 inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#0052CC] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#0040A8] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t('content.vocab.bankAdd')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VocabularyBankPicker;
