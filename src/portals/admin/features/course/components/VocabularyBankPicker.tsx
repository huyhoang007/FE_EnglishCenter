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
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Search } from 'lucide-react';
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

  const selectedSets = useMemo(
    () => bankSets.filter((s) => selectedIds.includes(s.setId)),
    [bankSets, selectedIds],
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
      {/* ---------- Ô tìm kiếm ---------- */}
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

      {/* ---------- Danh sách bộ trong kho chung ---------- */}
      {bankSets.length === 0 ? (
        <EmptyState title={t('content.vocab.bankEmpty')} className="py-6" />
      ) : filteredSets.length === 0 ? (
        <EmptyState title={t('content.vocab.bankNoResult')} className="py-6" />
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {filteredSets.map((set) => {
            const checked = selectedIds.includes(set.setId);
            const assigned = courseSets.some((s) => s.setId === set.setId);

            return (
              <li
                key={set.setId}
                className={cn(
                  'rounded-xl border bg-white px-3 py-2.5 transition-colors',
                  checked
                    ? 'border-[#0052CC]/50 bg-blue-50/40'
                    : 'border-slate-200/80 hover:border-[#0052CC]/40',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(set.setId, set.title)}
                    aria-label={set.title}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30 cursor-pointer shrink-0"
                  />
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
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- Bộ đang chọn ---------- */}
      {!hideSelectedList && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
            {t('content.vocab.bankSelected')}{' '}
            <span className="text-[#0052CC]">({selectedSets.length})</span>
          </p>
          {selectedSets.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              {t('content.vocab.bankSelectedEmpty')}
            </p>
          ) : (
            <ul className="space-y-1">
              {selectedSets.map((set) => (
                <li
                  key={set.setId}
                  className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#0052CC] shrink-0" />
                  <span className="truncate">{set.title}</span>
                  <span className="ml-auto shrink-0 text-slate-400 font-normal">
                    <BookOpen className="w-3 h-3 inline" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyBankPicker;
