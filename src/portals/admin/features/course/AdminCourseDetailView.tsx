/**
 * AdminCourseDetailView — Chi tiết khóa học (route `/admin/courses/:id`)
 * -----------------------------------------------------------
 * API thật (Backend):
 *   GET /api/v1/courses/{courseId}                 → thông tin khóa học
 *   GET /api/v1/courses/{courseId}/contents        → bài học + bài tập
 *   GET /api/v1/courses/{courseId}/vocabularies    → các bộ từ vựng đã gán
 *
 * Trang này là điểm neo cho nút "Quản lý từ vựng" → mở
 * `VocabularyManagementModal` (gán bộ từ vựng chung vào khóa học).
 *
 * Layout bám sát Admin Layout: sidebar xanh (#0052CC), bảng phẳng,
 * bo góc hiện đại (rounded-2xl), viền slate-200/80.
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Layers3,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { formatVND } from '@/shared/utils/format';
import { cefrLabel } from '@/shared/constants/cefrLevels';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  deleteCourseContent,
  fetchCourseById,
  fetchCourseContents,
} from '@/shared/api/courseService';
import { fetchCourseVocabularies } from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  ContentType,
  CourseContentDto,
  CourseStatus,
} from '@/shared/types/catalog.types';
import { CourseContentModal } from './components/CourseContentModal';
import { CourseContentDetailModal } from './components/CourseContentDetailModal';
import {
  CONTENT_TYPE_META,
  buildSummaryChips,
  chipClass,
} from './contentSummary';

/* =========================================================
 * Meta
 * ========================================================= */
const STATUS_META: Record<
  CourseStatus,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  active: { label: 'Đang mở', variant: 'success' },
  draft: { label: 'Nháp', variant: 'warning' },
  archived: { label: 'Lưu trữ', variant: 'neutral' },
};

/* =========================================================
 * View
 * ========================================================= */
export const AdminCourseDetailView: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  /** Modal quản lý nội dung (bài học / từ vựng / bài tập). */
  const [contentOpen, setContentOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('lesson');
  /** Nội dung đang sửa — `null` nghĩa là thêm mới. */
  const [editingContent, setEditingContent] =
    useState<CourseContentDto | null>(null);
  /** Nội dung đang chọn để xoá. */
  const [deleteTargetContent, setDeleteTargetContent] =
    useState<CourseContentDto | null>(null);
  /** Nội dung đang chọn để XEM CHI TIẾT. */
  const [detailTargetContent, setDetailTargetContent] =
    useState<CourseContentDto | null>(null);

  const deleteContentMutation = useMutation({
    mutationFn: (contentId: string) => deleteCourseContent(contentId),
    onSuccess: () => {
      toast.success('Đã xoá nội dung thành công');
      setDeleteTargetContent(null);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalog.contents(id),
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Xoá nội dung khóa học thất bại',
      );
    },
  });

  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.course(id),
    queryFn: () => fetchCourseById(id),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: contents = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.contents(id),
    queryFn: () => fetchCourseContents(id),
    enabled: Boolean(id),
  });

  const { data: vocabularies = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularies(id),
    queryFn: () => fetchCourseVocabularies(id),
    enabled: Boolean(id),
  });

  const lessonCount = contents.filter((c) => c.contentType === 'lesson').length;
  const homeworkCount = contents.filter(
    (c) => c.contentType === 'homework',
  ).length;
  const vocabCount = contents.filter(
    (c) => c.contentType === 'vocabulary',
  ).length;

  /**
   * Lọc bảng theo loại nội dung.
   *
   * `null` = hiện tất cả. Có 3 loại nên 3 tab + "Tất cả" là đủ — không cần
   * bộ lọc phức tạp hơn (tìm kiếm, sắp xếp) vì khóa học thường chỉ vài chục
   * nội dung.
   */
  const [typeFilter, setTypeFilter] = useState<ContentType | null>(null);

  /** Số lượng theo từng loại (dùng cho badge trên tab). */
  const typeCount: Record<ContentType, number> = {
    lesson: lessonCount,
    vocabulary: vocabCount,
    homework: homeworkCount,
  };

  /** Nội dung hiển thị sau khi lọc + sắp xếp theo thứ tự. */
  const visibleContents = useMemo(
    () =>
      contents
        .filter((c) => !typeFilter || c.contentType === typeFilter)
        .slice()
        .sort((a, b) => (a.contentOrder ?? 0) - (b.contentOrder ?? 0)),
    [contents, typeFilter],
  );

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ---------- Error / Not found ---------- */
  if (isError || !course) {
    return (
      <div className="space-y-5">
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/admin/courses')}
          className="font-bold"
        >
          {t('admin.course.backToList')}
        </Button>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : t('admin.course.notFoundHint')
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusMeta = STATUS_META[course.status] ?? {
    label: course.status,
    variant: 'neutral' as const,
  };

  return (
    <div className="space-y-6">
      {/* ============ 1. BACK + TITLE ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0052CC] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('admin.course.backToList')}
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
            {course.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 font-mono">
            {course.code}
          </p>
        </div>

        {/* Gán bộ từ vựng giờ làm trong "Nội dung khóa học" (loại Bộ từ vựng). */}
      </div>

      {/* ============ 2. HERO CARD ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#0052CC] to-indigo-700 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider">
              {course.certificateName ?? 'General'}
            </span>
            <Badge variant={statusMeta.variant} size="sm">
              {statusMeta.label}
            </Badge>
          </div>
          <p className="text-sm opacity-90 mt-2.5 leading-relaxed max-w-3xl">
            {course.description ?? t('admin.course.noDescription')}
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          <StatCell
            icon={BookOpen}
            label={t('admin.course.price')}
            value={formatVND(course.price ?? 0)}
            accent
          />
          <StatCell
            icon={Layers3}
            label={t('admin.course.level')}
            value={course.level ?? '—'}
          />
          <StatCell
            icon={Target}
            label={t('admin.course.targetScore')}
            value={
              course.targetScore != null
                ? `Band ${course.targetScore}+`
                : '—'
            }
          />
          <StatCell
            icon={GraduationCap}
            label={t('admin.course.mentor')}
            value={course.mentorName ?? 'VOD'}
          />
        </div>
      </div>

      {/* ============ 3. CONTENT TABS (summary) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Vocabulary card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {vocabularies.length}
            </span>
          </div>
          <p className="font-extrabold text-slate-900 text-sm mt-3">
            {t('admin.course.tabVocabulary')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t('admin.course.vocabularyCount', {
              count: vocabularies.length,
            })}
          </p>
        </div>

        {/* Lessons card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {lessonCount}
            </span>
          </div>
          <p className="font-extrabold text-slate-900 text-sm mt-3">
            {t('admin.course.tabLessons')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t('admin.course.lessonCount', { count: lessonCount })}
          </p>
        </div>

        {/* Homework card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {homeworkCount}
            </span>
          </div>
          <p className="font-extrabold text-slate-900 text-sm mt-3">
            {t('admin.course.tabHomework')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t('admin.course.homeworkCount', { count: homeworkCount })}
          </p>
        </div>
      </div>

      {/* ============ 4. COURSE CONTENT (bài học / từ vựng / bài tập) ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
              <Layers3 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 text-sm">
                {t('content.modal.createTitle')}
              </p>
              <p className="text-[11px] text-slate-500">
                {t('content.modal.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(['lesson', 'vocabulary', 'homework'] as ContentType[]).map(
              (type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => {
                    setContentType(type);
                    setEditingContent(null);
                    setContentOpen(true);
                  }}
                  className="font-bold"
                >
                  {t(`content.type.${type}`)}
                </Button>
              ),
            )}
          </div>
        </div>

        {contents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Layers3 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">
              {t('content.list.emptyTitle')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {t('content.list.emptyDescription')}
            </p>
          </div>
        ) : (
          <>
            {/* ---- Bộ lọc theo loại ---- */}
            <div className="flex items-center gap-1.5 px-5 pt-3.5 pb-3 flex-wrap">
              <FilterChip
                active={typeFilter === null}
                onClick={() => setTypeFilter(null)}
                label={t('content.list.filterAll')}
                count={contents.length}
              />
              {(['lesson', 'vocabulary', 'homework'] as ContentType[]).map(
                (type) => {
                  const meta = CONTENT_TYPE_META[type];
                  const FilterIcon = meta.icon;
                  return (
                    <FilterChip
                      key={type}
                      active={typeFilter === type}
                      onClick={() => setTypeFilter(type)}
                      label={meta.label}
                      count={typeCount[type]}
                      icon={FilterIcon}
                    />
                  );
                },
              )}
            </div>

            {visibleContents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs font-bold text-slate-600">
                  {t('content.list.filterEmpty')}
                </p>
              </div>
            ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3 pl-5 pr-3 font-bold">
                    {t('content.list.titleCol')}
                  </th>
                  <th className="py-3 px-3 font-bold">
                    {t('content.list.typeCol')}
                  </th>
                  <th className="py-3 px-3 font-bold">
                    {t('content.list.detailCol')}
                  </th>
                  <th className="py-3 px-3 font-bold">
                    {t('content.form.contentOrder')}
                  </th>
                  <th className="py-3 pr-5 pl-3 font-bold text-right">
                    {t('content.list.actionsCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleContents.map((item) => {
                  const meta = CONTENT_TYPE_META[item.contentType];
                  const TypeIcon = meta.icon;
                  const chips = buildSummaryChips(item);
                  return (
                    <tr
                      key={item.contentId}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* ---- Tiêu đề + mô tả ---- */}
                      <td className="py-3.5 pl-5 pr-3 max-w-[280px]">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                              meta.iconClass,
                            )}
                          >
                            <TypeIcon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate leading-tight">
                              {item.title || '—'}
                            </span>
                            {item.description && (
                              <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ---- Loại ---- */}
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold',
                            meta.badgeClass,
                          )}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>

                      {/* ---- Chi tiết (chips metadata) ---- */}
                      <td className="py-3.5 px-3 max-w-[320px]">
                        {chips.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {chips.map((chip, i) => {
                              const ChipIcon = chip.icon;
                              return (
                                <span
                                  key={`${chip.label}-${i}`}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold max-w-[160px]',
                                    chipClass(chip.tone),
                                  )}
                                  title={chip.label}
                                >
                                  {ChipIcon && (
                                    <ChipIcon className="w-3 h-3 shrink-0" />
                                  )}
                                  <span className="truncate">{chip.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* ---- Thứ tự ---- */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-[11px] font-bold font-mono text-slate-600">
                          {item.contentOrder ?? 0}
                        </span>
                      </td>

                      {/* ---- Thao tác ---- */}
                      <td className="py-3.5 pr-5 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailTargetContent(item)}
                            className="font-bold"
                          >
                            {t('content.list.detailAction')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setContentType(item.contentType);
                              setEditingContent(item);
                              setContentOpen(true);
                            }}
                            className="font-bold"
                          >
                            {t('common.edit')}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetContent(item)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Xoá nội dung"
                            aria-label="Xoá nội dung"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </>
        )}
      </div>

      {/* ============ 5. MODALS ============ */}
      <CourseContentDetailModal
        open={Boolean(detailTargetContent)}
        onClose={() => setDetailTargetContent(null)}
        content={detailTargetContent}
        onEdit={(content) => {
          setDetailTargetContent(null);
          setContentType(content.contentType);
          setEditingContent(content);
          setContentOpen(true);
        }}
      />

      <CourseContentModal
        open={contentOpen}
        onClose={() => {
          setContentOpen(false);
          setEditingContent(null);
        }}
        courseId={course.courseId}
        courseTitle={course.title}
        defaultContentType={contentType}
        editing={editingContent}
        nextContentOrder={
          contents.reduce((max, c) => Math.max(max, c.contentOrder ?? 0), 0) + 1
        }
        certificateId={course.certificateId}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetContent)}
        title="Xoá nội dung bài học"
        description={`Bạn có chắc chắn muốn xoá nội dung "${deleteTargetContent?.title}" khỏi khóa học?`}
        confirmLabel="Xác nhận xoá"
        cancelLabel="Huỷ"
        confirmVariant="danger"
        isLoading={deleteContentMutation.isPending}
        onConfirm={() => {
          if (deleteTargetContent) {
            deleteContentMutation.mutate(deleteTargetContent.contentId);
          }
        }}
        onClose={() => setDeleteTargetContent(null)}
      />
    </div>
  );
};

/* =========================================================
 * Filter chip — lọc bảng nội dung theo loại
 * ========================================================= */
const FilterChip: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ElementType;
}> = ({ active, onClick, label, count, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors',
      active
        ? 'bg-[#0052CC] text-white shadow-sm'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
    {label}
    <span
      className={cn(
        'rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums',
        active ? 'bg-white/20 text-white' : 'bg-white text-slate-500',
      )}
    >
      {count}
    </span>
  </button>
);

/* =========================================================
 * Stat cell
 * ========================================================= */
const StatCell: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}> = ({ icon: Icon, label, value, accent }) => (
  <div className="p-5">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
        {label}
      </p>
    </div>
    <p
      className={cn(
        'font-black text-sm truncate',
        accent ? 'text-[#0052CC]' : 'text-slate-900',
      )}
    >
      {value}
    </p>
  </div>
);

export default AdminCourseDetailView;
