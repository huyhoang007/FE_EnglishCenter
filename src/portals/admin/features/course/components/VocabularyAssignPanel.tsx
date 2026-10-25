/**
 * VocabularyAssignPanel — GÁN BỘ TỪ VỰNG CHUNG VÀO KHÓA HỌC
 * -----------------------------------------------------------
 * API thật (Backend):
 *   GET    /api/v1/vocabulary-sets                      → duyệt kho chung
 *   GET    /api/v1/courses/{courseId}/vocabularies      → các bộ đang gán
 *   PUT    /api/v1/vocabulary-sets/courses/{courseId}    → lưu danh sách tick
 *   DELETE /api/v1/vocabulary-sets/courses/{courseId}/{setId} → gỡ 1 bộ
 *
 * ĐÂY là UI cho LUỒNG 2 (Assign Word to Course):
 *   - Admin/Mentor duyệt KHO TỪ VỰNG CHUNG.
 *   - Tick chọn các bộ phù hợp → bấm "Lưu" để gán vào khóa học.
 *   - Bộ KHÔNG tick sẽ bị GỠ khỏi khóa học (vẫn còn trong kho chung).
 *
 * Luồng tạo từ vựng mới nằm ở `VocabularySetEditorModal` (tách rời).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Link2,
  Pencil,
  Plus,
  Search,
  Unlink,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  assignCourseVocabularySets,
  fetchCourseVocabularies,
  fetchVocabularyBank,
  unassignCourseVocabularySet,
  type VocabularySet,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

/* =========================================================
 * Props
 * ========================================================= */
export interface VocabularyAssignPanelProps {
  /** Khóa học đang gán từ vựng. */
  courseId: string;
  /** Tên khóa học — hiển thị trong phụ đề. */
  courseTitle?: string;
  /** Mở modal tạo/sửa bộ trong kho chung (nút "+ Tạo bộ mới"). */
  onCreateSet?: () => void;
  /** Mở modal sửa 1 bộ đã có trong kho chung. */
  onEditSet?: (set: VocabularySet) => void;
}

/* =========================================================
 * Component
 * ========================================================= */
export const VocabularyAssignPanel: React.FC<
  VocabularyAssignPanelProps
> = ({ courseId, courseTitle, onCreateSet, onEditSet }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  /** Từ khoá tìm kiếm trong kho chung. */
  const [keyword, setKeyword] = useState('');
  /** Id các bộ đang TICK (trạng thái cục bộ, chưa lưu). */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /** Đã khởi tạo `selectedIds` từ server cho courseId hiện tại chưa. */
  const hydratedFor = useRef<string | null>(null);

  /* ---------- Kho từ vựng chung ---------- */
  const {
    data: bankSets = [],
    isLoading: bankLoading,
    isError: bankError,
    error: bankErrorObj,
    refetch: refetchBank,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularyBank,
    queryFn: () => fetchVocabularyBank(),
    staleTime: 60_000,
  });

  /* ---------- Bộ đang gán cho khóa học ---------- */
  const {
    data: courseSets = [],
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrorObj,
    refetch: refetchCourseSets,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularies(courseId),
    queryFn: () => fetchCourseVocabularies(courseId),
    enabled: Boolean(courseId),
  });

  /* ---------- Hydrate tick từ server (1 lần / courseId, không đè tick của user) ---------- */
  useEffect(() => {
    if (!courseId || courseLoading) return;
    if (hydratedFor.current === courseId) return;
    hydratedFor.current = courseId;
    setSelectedIds(courseSets.map((s) => s.setId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseLoading, courseSets]);

  /* ---------- Lọc kho chung theo từ khoá ---------- */
  const filteredSets = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return bankSets;
    return bankSets.filter(
      (set) =>
        set.title.toLowerCase().includes(kw) ||
        (set.description ?? '').toLowerCase().includes(kw) ||
        set.words.some((w) => w.word.toLowerCase().includes(kw)),
    );
  }, [bankSets, keyword]);

  /* ---------- Mutations ---------- */
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.vocabularies(courseId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.vocabularyBank,
    });
  };

  const assignMutation = useMutation({
    mutationFn: (setIds: string[]) => assignCourseVocabularySets(courseId, setIds),
    onSuccess: () => {
      toast.success(t('vocab.bank.assignSaved'));
      invalidate();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('vocab.bank.assignFailed'),
      ),
  });

  const unassignMutation = useMutation({
    mutationFn: (setId: string) => unassignCourseVocabularySet(courseId, setId),
    onSuccess: (_data, setId) => {
      toast.success(t('vocab.bank.unassigned'));
      // Đồng bộ tick: bộ vừa gỡ không còn được chọn.
      setSelectedIds((prev) => prev.filter((id) => id !== setId));
      invalidate();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('vocab.bank.assignFailed'),
      ),
  });

  /* ---------- Handlers ---------- */
  const toggleSet = (setId: string) => {
    setSelectedIds((prev) =>
      prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId],
    );
  };

  const handleSave = () => {
    assignMutation.mutate(selectedIds);
  };

  const handleUnassign = (setId: string) => {
    unassignMutation.mutate(setId);
  };

  /** Số bộ đang được gán (server) vs đang tick (client). */
  const dirty =
    selectedIds.length !== courseSets.length ||
    selectedIds.some((id) => !courseSets.some((s) => s.setId === id));

  const isLoading = bankLoading || courseLoading;
  const isError = bankError || courseError;
  const errorObj = bankErrorObj ?? courseErrorObj;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#0052CC]" />
            {t('vocab.bank.assignToCourse')}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {courseTitle ? `${courseTitle} · ` : ''}
            {t('vocab.bank.assignHint')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Ô tìm kiếm */}
          <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 focus-within:bg-white focus-within:border-[#0052CC] transition-colors sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('vocab.bank.searchPlaceholder')}
              className="bg-transparent outline-none w-full text-xs placeholder:text-slate-400 text-slate-700"
              aria-label={t('vocab.bank.searchPlaceholder')}
            />
          </div>

          {onCreateSet && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={Plus}
              onClick={onCreateSet}
              className="shrink-0 font-bold"
            >
              {t('vocab.bank.createNew')}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={CheckCircle2}
            onClick={handleSave}
            disabled={!dirty || assignMutation.isPending}
            isLoading={assignMutation.isPending}
            className="shrink-0 font-bold bg-[#0052CC] hover:bg-[#0040A8]"
          >
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* ============ TỔNG QUAN ============ */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-semibold text-slate-500">
        <span>
          {t('vocab.bank.sets', { count: filteredSets.length })}
        </span>
        <span className="text-slate-300">·</span>
        <span>
          {t('vocab.bank.words', {
            count: filteredSets.reduce((sum, s) => sum + s.wordCount, 0),
          })}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-[#0052CC]">
          {t('vocab.bank.assignEmpty')} → {selectedIds.length}
        </span>
      </div>

      {/* ============ BODY ============ */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={errorObj instanceof Error ? errorObj.message : undefined}
          onRetry={() => {
            void refetchBank();
            void refetchCourseSets();
          }}
          className="py-10"
        />
      ) : filteredSets.length === 0 ? (
        <EmptyState
          title={
            bankSets.length === 0
              ? t('vocab.bank.emptyTitle')
              : t('vocab.bank.noResultTitle')
          }
          description={
            bankSets.length === 0 ? t('vocab.bank.emptyDescription') : undefined
          }
          className="py-10"
        />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredSets.map((set) => {
            const checked = selectedIds.includes(set.setId);
            const assigned = courseSets.some((s) => s.setId === set.setId);

            return (
              <li
                key={set.setId}
                className={cn(
                  'rounded-2xl border bg-white p-4 transition-colors',
                  checked
                    ? 'border-[#0052CC]/50 bg-blue-50/30'
                    : 'border-slate-200/80 hover:border-[#0052CC]/40',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Ô tick */}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSet(set.setId)}
                    aria-label={set.title}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {set.title}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold">
                            {t('vocab.bank.words', { count: set.wordCount })}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span
                            className={cn(
                              'font-semibold',
                              set.usedInCourseCount > 0
                                ? 'text-emerald-600'
                                : 'text-slate-400',
                            )}
                          >
                            {set.usedInCourseCount > 0
                              ? t('vocab.bank.usedInCourses', {
                                  count: set.usedInCourseCount,
                                })
                              : t('vocab.bank.unused')}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onEditSet && (
                          <button
                            type="button"
                            onClick={() => onEditSet(set)}
                            title={t('vocab.action.editRow')}
                            aria-label={t('vocab.action.editRow')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {assigned && (
                          <button
                            type="button"
                            onClick={() => handleUnassign(set.setId)}
                            disabled={unassignMutation.isPending}
                            title={t('content.vocab.libraryUnlink')}
                            aria-label={t('content.vocab.libraryUnlink')}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mô tả */}
                    {set.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                        {set.description}
                      </p>
                    )}

                    {/* Người tạo */}
                    {set.createdByUserName && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                        <BookOpen className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {t('vocab.bank.createdBy', {
                            name: set.createdByUserName,
                          })}
                        </span>
                      </p>
                    )}

                    {/* Xem trước vài từ đầu */}
                    {set.words.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {set.words.slice(0, 6).map((word, i) => (
                          <span
                            key={`${word.word}-${i}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] font-semibold text-slate-600"
                          >
                            {word.word}
                          </span>
                        ))}
                        {set.words.length > 6 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-bold text-[#0052CC]">
                            +{set.words.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default VocabularyAssignPanel;
