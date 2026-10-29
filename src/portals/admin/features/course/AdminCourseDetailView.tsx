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

import React, { useState } from 'react';
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
import { VocabularyManagementModal } from './components/VocabularyManagementModal';

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

  const [vocabOpen, setVocabOpen] = useState(false);
  /** Modal quản lý nội dung (bài học / từ vựng / bài tập). */
  const [contentOpen, setContentOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('lesson');
  /** Nội dung đang sửa — `null` nghĩa là thêm mới. */
  const [editingContent, setEditingContent] =
    useState<CourseContentDto | null>(null);
  /** Nội dung đang chọn để xoá. */
  const [deleteTargetContent, setDeleteTargetContent] =
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

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={`/admin/courses/${course.courseId}/vocabularies`}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:border-[#0052CC]/40 hover:text-[#0052CC] transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {t('admin.course.manageVocabularyLink')}
          </Link>

          <Button
            variant="primary"
            size="md"
            leftIcon={Sparkles}
            onClick={() => setVocabOpen(true)}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            {t('admin.course.manageVocabulary')}
          </Button>
        </div>
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
        <button
          type="button"
          onClick={() => setVocabOpen(true)}
          className="text-left bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-[#0052CC]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
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
        </button>

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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3 px-5 font-bold">
                    {t('content.list.titleCol')}
                  </th>
                  <th className="py-3 px-3 font-bold">
                    {t('content.list.typeCol')}
                  </th>
                  <th className="py-3 px-3 font-bold">
                    {t('content.form.contentOrder')}
                  </th>
                  <th className="py-3 px-5 font-bold text-right">
                    {t('content.list.actionsCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contents.map((item) => (
                  <tr key={item.contentId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 max-w-[320px]">
                      <span className="font-bold text-slate-900 block truncate">
                        {item.title || '—'}
                      </span>
                      {item.description && (
                        <span className="text-[10px] text-slate-500 block truncate">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          item.contentType === 'lesson' &&
                            'bg-emerald-50 text-emerald-600',
                          item.contentType === 'vocabulary' &&
                            'bg-blue-50 text-[#0052CC]',
                          item.contentType === 'homework' &&
                            'bg-amber-50 text-amber-600',
                        )}
                      >
                        {t(`content.type.${item.contentType}`)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {item.contentOrder ?? 0}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ 5. MODALS ============ */}
      <VocabularyManagementModal
        open={vocabOpen}
        onClose={() => setVocabOpen(false)}
        courseId={course.courseId}
        courseTitle={course.title}
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
        nextContentOrder={contents.length + 1}
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
