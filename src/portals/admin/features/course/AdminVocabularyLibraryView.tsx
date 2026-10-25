/**
 * AdminVocabularyLibraryView — Trang KHO TỪ VỰNG CHUNG (Global Vocabulary Bank)
 * -----------------------------------------------------------
 * Route: `/admin/vocabularies`
 *
 * Mô hình mới (tách 2 luồng):
 *   - LUỒNG 1 (trang này): tạo / sửa / xoá bộ từ vựng trong KHO CHUNG.
 *     Bộ từ vựng KHÔNG gắn vào khóa học nào lúc tạo.
 *   - LUỒNG 2 (trang chi tiết khóa học): tick chọn bộ trong kho chung để
 *     gán vào khóa học → `VocabularyAssignPanel`.
 *
 * API thật (Backend) — KHÔNG dùng mock data:
 *   GET    /api/v1/vocabulary-sets          → duyệt kho chung
 *   POST   /api/v1/vocabulary-sets          → tạo bộ mới
 *   PUT    /api/v1/vocabulary-sets/{setId}  → sửa bộ
 *   DELETE /api/v1/vocabulary-sets/{setId}  → xoá bộ khỏi kho chung
 *
 * Token Bearer được `axiosClient.ts` tự động đính kèm cho mọi request.
 */

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  deleteVocabularySet,
  fetchVocabularyBank,
  type VocabularySet,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { VocabularySetEditorModal } from './components/VocabularySetEditorModal';

/* =========================================================
 * View
 * ========================================================= */
export const AdminVocabularyLibraryView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  /** Từ khoá tìm kiếm trong kho chung. */
  const [keyword, setKeyword] = useState('');
  /** Modal tạo / sửa bộ. */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<VocabularySet | null>(null);
  /** Bộ đang chờ xoá khỏi kho chung. */
  const [deleteTarget, setDeleteTarget] = useState<VocabularySet | null>(null);

  /* ---------- Query: kho từ vựng chung ---------- */
  const {
    data: sets = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularyBank,
    queryFn: () => fetchVocabularyBank(),
    staleTime: 60_000,
  });

  /* ---------- Lọc theo từ khoá (client-side, kho chung thường nhỏ) ---------- */
  const filteredSets = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return sets;
    return sets.filter(
      (set) =>
        set.title.toLowerCase().includes(kw) ||
        (set.description ?? '').toLowerCase().includes(kw) ||
        set.words.some(
          (w) =>
            w.word.toLowerCase().includes(kw) ||
            w.meaning.toLowerCase().includes(kw),
        ),
    );
  }, [sets, keyword]);

  /* ---------- Mutation: xoá bộ khỏi kho chung ---------- */
  const deleteMutation = useMutation({
    mutationFn: (setId: string) => deleteVocabularySet(setId),
    onSuccess: () => {
      toast.success(t('vocab.feedback.deleted'));
      setDeleteTarget(null);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalog.vocabularyBank,
      });
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('vocab.feedback.deleteFailed'),
      ),
  });

  /* ---------- Stats ---------- */
  const stats = useMemo(() => {
    const totalWords = sets.reduce((sum, s) => sum + s.wordCount, 0);
    const withAudio = sets.reduce(
      (sum, s) => sum + s.words.filter((w) => w.audioUrl).length,
      0,
    );
    const withIpa = sets.reduce(
      (sum, s) => sum + s.words.filter((w) => w.ipa).length,
      0,
    );
    return { totalSets: sets.length, totalWords, withAudio, withIpa };
  }, [sets]);

  /* ---------- Handlers ---------- */
  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (set: VocabularySet) => {
    setEditing(set);
    setEditorOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.setId);
  };

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------- Lỗi ---------- */
  if (isError) {
    return (
      <div className="space-y-5">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============ 1. TITLE + ACTIONS ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('vocab.bank.title')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('vocab.bank.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Ô tìm kiếm */}
          <div className="flex items-center gap-2 h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 focus-within:bg-white focus-within:border-[#0052CC] transition-colors sm:w-64">
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

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={openCreate}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            {t('vocab.bank.createNew')}
          </Button>
        </div>
      </div>

      {/* ============ 2. STAT CARDS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon={Layers3}
          label={t('vocab.bank.sets', { count: stats.totalSets })}
          value={stats.totalSets}
          subtext={t('vocab.stat.setsHint')}
          colorScheme="blue"
        />
        <StatCard
          icon={BookOpen}
          label={t('vocab.stat.total')}
          value={stats.totalWords}
          subtext={t('vocab.stat.totalHint')}
          colorScheme="emerald"
        />
        <StatCard
          icon={Volume2}
          label={t('vocab.stat.withAudio')}
          value={stats.withAudio}
          subtext={t('vocab.stat.withAudioHint')}
          colorScheme="purple"
        />
        <StatCard
          icon={Layers3}
          label={t('vocab.stat.withIpa')}
          value={stats.withIpa}
          subtext={t('vocab.stat.withIpaHint')}
          colorScheme="amber"
        />
      </div>

      {/* ============ 3. DANH SÁCH BỘ TRONG KHO CHUNG ============ */}
      {filteredSets.length === 0 ? (
        <EmptyState
          title={
            sets.length === 0
              ? t('vocab.bank.emptyTitle')
              : t('vocab.bank.noResultTitle')
          }
          description={
            sets.length === 0 ? t('vocab.bank.emptyDescription') : undefined
          }
          actionLabel={sets.length === 0 ? t('vocab.bank.createNew') : undefined}
          onAction={sets.length === 0 ? openCreate : undefined}
        />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredSets.map((set) => (
            <li
              key={set.setId}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
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
                  <button
                    type="button"
                    onClick={() => openEdit(set)}
                    title={t('vocab.action.editRow')}
                    aria-label={t('vocab.action.editRow')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(set)}
                    title={t('vocab.action.deleteRow')}
                    aria-label={t('vocab.action.deleteRow')}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mô tả */}
              {set.description && (
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  {set.description}
                </p>
              )}

              {/* Người tạo */}
              {set.createdByUserName && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                  <BookOpen className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">
                    {t('vocab.bank.createdBy', { name: set.createdByUserName })}
                  </span>
                </p>
              )}

              {/* Xem trước vài từ đầu */}
              {set.words.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {set.words.slice(0, 8).map((word, i) => (
                    <span
                      key={`${word.word}-${i}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] font-semibold text-slate-600"
                    >
                      {word.word}
                    </span>
                  ))}
                  {set.words.length > 8 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-bold text-[#0052CC]">
                      +{set.words.length - 8}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ============ 4. MODAL TẠO / SỬA BỘ ============ */}
      <VocabularySetEditorModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      {/* ============ 5. XÁC NHẬN XOÁ ============ */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('vocab.bank.confirmDeleteTitle')}
        description={
          deleteTarget
            ? t('vocab.bank.confirmDeleteBody', { title: deleteTarget.title })
            : undefined
        }
        confirmLabel={t('vocab.confirmDeleteConfirm')}
        cancelLabel={t('vocab.confirmDeleteCancel')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

/* =========================================================
 * Stat card — bo tròn rounded-2xl, viền mỏng, shadow nhẹ
 * ========================================================= */
const STAT_COLOR_MAP = {
  blue: { chip: 'bg-blue-50', value: 'text-[#0052CC]', sub: 'text-blue-600' },
  emerald: {
    chip: 'bg-emerald-50',
    value: 'text-emerald-600',
    sub: 'text-emerald-600',
  },
  purple: {
    chip: 'bg-purple-50',
    value: 'text-purple-600',
    sub: 'text-purple-600',
  },
  amber: {
    chip: 'bg-amber-50',
    value: 'text-amber-600',
    sub: 'text-amber-600',
  },
} as const;

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  subtext: string;
  colorScheme: keyof typeof STAT_COLOR_MAP;
}> = ({ icon: Icon, label, value, subtext, colorScheme }) => {
  const conf = STAT_COLOR_MAP[colorScheme];
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-3.5 transition-shadow hover:shadow-md">
      <div
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
          conf.chip,
          conf.value,
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          {value.toLocaleString('vi-VN')}
        </p>
        <p className={cn('text-xs font-bold mt-0.5 truncate', conf.sub)}>
          {subtext}
        </p>
      </div>
    </div>
  );
};

export default AdminVocabularyLibraryView;
