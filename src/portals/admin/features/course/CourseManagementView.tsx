/**
 * CourseManagementView — Quản trị khóa học (route `/admin/courses`)
 * -----------------------------------------------------------
 * Đã thay toàn bộ mock bằng API thật của Dev 2:
 *   GET  /api/v1/courses                     → bảng + bộ lọc + phân trang
 *   POST /api/v1/admin/courses               → modal tạo khóa học
 *   PUT  /api/v1/admin/courses/{id}          → sửa + toggle trạng thái
 *   POST /api/v1/admin/courses/{id}/contents → modal thêm bài học
 *   GET  /api/v1/certificates                → dropdown chứng chỉ
 *
 * Lưu ý: `contentData` gửi lên là JSON **string** (backend normalize vào
 * cột JSONB), còn khi đọc về backend đã parse sẵn thành object.
 *
 * Layout giữ nguyên AdminLayout mới: bo góc 16px, viền slate-200/80,
 * font Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Eye,
  Layers3,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils/format';
import {
  createCourse,
  createCourseContent,
  fetchCourseContents,
  fetchCourses,
  updateCourse,
} from '@/shared/api/courseService';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  ContentType,
  CourseDto,
  CourseStatus,
  HomeworkSubmissionType,
  UpdateCoursePayload,
} from '@/shared/types/catalog.types';
import { ExamPicker } from './components/ExamPicker';
import { VocabularyBankPicker } from './components/VocabularyBankPicker';
import { buildVocabularyTitle } from '@/shared/api/courseContentBuilder';

/** Backend trả status lowercase — map sang nhãn tiếng Việt + màu. */
const STATUS_META: Record<
  CourseStatus,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  active: { label: 'Đang mở', variant: 'success' },
  draft: { label: 'Nháp', variant: 'warning' },
  archived: { label: 'Lưu trữ', variant: 'neutral' },
};

const PAGE_SIZE = 12;

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  lesson: 'Bài học',
  vocabulary: 'Từ vựng',
  homework: 'Bài tập',
};

/** Component dropdown chọn trạng thái khóa học trực tiếp */
export const StatusSelect: React.FC<{
  status: CourseStatus;
  disabled?: boolean;
  onChange: (next: CourseStatus) => void;
}> = ({ status, disabled, onChange }) => (
  <div className="relative inline-flex items-center">
    <select
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as CourseStatus)}
      className={cn(
        'h-7 pl-2.5 pr-6 rounded-lg text-[11px] font-bold border outline-none cursor-pointer appearance-none transition-all shadow-2xs',
        status === 'active' &&
          'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70 focus:border-emerald-500',
        status === 'draft' &&
          'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70 focus:border-amber-500',
        status === 'archived' &&
          'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200/70 focus:border-slate-500',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <option value="active">Đang mở</option>
      <option value="draft">Bản nháp</option>
      <option value="archived">Lưu trữ</option>
    </select>
    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 pointer-events-none opacity-60 text-current" />
  </div>
);

/* =========================================================
 * View
 * ========================================================= */
export const CourseManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<CourseDto | null>(null);
  const [contentCourse, setContentCourse] = useState<CourseDto | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);

  /* ---------- Queries ---------- */
  const queryParams = {
    keyword: keyword || undefined,
    certificateId: certFilter || undefined,
    status: (statusFilter || undefined) as CourseStatus | undefined,
    page,
    size: PAGE_SIZE,
  };

  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.courses(queryParams),
    queryFn: () => fetchCourses(queryParams),
  });

  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  /** Admin nhìn thấy mọi trạng thái, nên không lọc `status: 'active'`. */
  const courses = pageData?.data ?? [];

  /* ---------- Debounce keyword ---------- */
  const timerRef = React.useRef<number | undefined>(undefined);
  const applyKeyword = (value: string) => {
    setKeywordInput(value);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setKeyword(value);
      setPage(0);
    }, 400);
  };

  const resetFilters = () => {
    setKeyword('');
    setKeywordInput('');
    setCertFilter('');
    setStatusFilter('');
    setPage(0);
  };

  /* ---------- Mutations ---------- */
  const invalidateCourses = () =>
    queryClient.invalidateQueries({ queryKey: ['catalog', 'courses'] });

  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CourseDto | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      courseId,
      status,
    }: {
      courseId: string;
      status: CourseStatus;
    }) => {
      setBusyCourseId(courseId);
      return updateCourse(courseId, { status });
    },
    onSuccess: (updated) => {
      toast.success(
        `Đã chuyển trạng thái "${updated.title}" sang ${STATUS_META[updated.status].label.toLowerCase()}`,
      );
      invalidateCourses();
      setArchiveTarget(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại'),
    onSettled: () => {
      setBusyCourseId(null);
    },
  });

  /* ---------- Stats (chỉ tính trên trang hiện tại + tổng) ---------- */
  const total = pageData?.totalElements ?? 0;
  const draftCount = courses.filter((c) => c.status === 'draft').length;
  const activeCount = courses.filter((c) => c.status === 'active').length;
  const avgPrice = courses.length
    ? Math.round(
        courses.reduce((s, c) => s + (c.price ?? 0), 0) / courses.length,
      )
    : 0;

  const hasFilter = Boolean(keyword || certFilter || statusFilter);

  return (
    <div className="space-y-6">
      {/* ============ 1. STATS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Tổng khóa học"
          value={total.toLocaleString('vi-VN')}
          subtext="Toàn hệ thống"
          icon={BookOpen}
          colorScheme="blue"
          trendPoints={[16, 18, 19, 21, 21, 22, 23, 24]}
        />
        <StatCard
          title="Đang mở"
          value={activeCount.toLocaleString('vi-VN')}
          subtext="Trang này"
          icon={CheckCircle2}
          colorScheme="emerald"
          trendPoints={[5, 6, 7, 7, 8, 8, 9, activeCount || 9]}
        />
        <StatCard
          title="Bản nháp"
          value={draftCount.toLocaleString('vi-VN')}
          subtext="Chờ duyệt"
          icon={Clock}
          colorScheme="amber"
          trendPoints={[4, 5, 3, 2, 4, 3, 2, draftCount || 2]}
        />
        <StatCard
          title="Học phí TB"
          value={formatVND(avgPrice)}
          subtext="Trang này"
          icon={DollarSign}
          colorScheme="purple"
          trendPoints={[2.8, 3, 3.2, 3.1, 3.4, 3.5, 3.6, 3.7]}
        />
        <StatCard
          title="Có Mentor"
          value={courses.filter((c) => c.mentorName).length}
          subtext="Khóa VOD không cần"
          icon={Users}
          colorScheme="cyan"
          trendPoints={[2, 3, 3, 4, 4, 5, 5, 6]}
        />
      </div>

      {/* ============ 2. TITLE BAR ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý khóa học
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Danh mục, chương trình học và trạng thái mở bán.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              title="Dạng lưới"
              aria-label="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'table'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              title="Dạng bảng"
              aria-label="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => {
              setEditingCourse(null);
              setIsCreateOpen(true);
            }}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Tạo khóa học
          </Button>
        </div>
      </div>

      {/* ============ 3. FILTER BAR ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => applyKeyword(e.target.value)}
              placeholder="Tìm theo tên hoặc mã khóa học…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm khóa học"
            />
          </div>

          <select
            value={certFilter}
            onChange={(e) => {
              setCertFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc chứng chỉ"
          >
            <option value="">Tất cả chứng chỉ</option>
            {certificates.map((c) => (
              <option key={c.certificateId} value={c.certificateId}>
                {c.certificateName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang mở</option>
            <option value="draft">Nháp</option>
            <option value="archived">Lưu trữ</option>
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ============ 4. CONTENT ============ */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : courses.length === 0 ? (
        <EmptyState
          title="Chưa có khóa học nào"
          description={
            hasFilter
              ? 'Thử bỏ bớt bộ lọc để xem tất cả khóa học.'
              : 'Tạo khóa học đầu tiên để bắt đầu.'
          }
          {...(hasFilter
            ? { actionLabel: 'Đặt lại bộ lọc', onAction: resetFilters }
            : {})}
        />
      ) : viewMode === 'table' ? (
        <CourseTable
          courses={courses}
          onView={setDetailCourse}
          onEdit={(c) => {
            setEditingCourse(c);
            setIsCreateOpen(true);
          }}
          onManageContents={setContentCourse}
          onStatusChange={(c, next) =>
            updateStatusMutation.mutate({ courseId: c.courseId, status: next })
          }
          onArchive={(c) => setArchiveTarget(c)}
          busyCourseId={busyCourseId}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((c) => (
            <AdminCourseCard
              key={c.courseId}
              course={c}
              onView={setDetailCourse}
              onEdit={(x) => {
                setEditingCourse(x);
                setIsCreateOpen(true);
              }}
              onManageContents={setContentCourse}
              onStatusChange={(next) =>
                updateStatusMutation.mutate({ courseId: c.courseId, status: next })
              }
              onArchive={() => setArchiveTarget(c)}
              disabled={busyCourseId === c.courseId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageData && !isLoading && !isError && (
        <Pagination
          currentPage={pageData.currentPage}
          totalPages={pageData.totalPages}
          onChange={setPage}
          className="pt-2"
        />
      )}

      {/* ============ MODALS ============ */}
      <CourseFormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        editing={editingCourse}
        certificates={certificates}
      />

      <CourseDetailModal
        course={detailCourse}
        onClose={() => setDetailCourse(null)}
      />

      <ContentModal course={contentCourse} onClose={() => setContentCourse(null)} />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Lưu trữ khóa học"
        description={`Bạn có chắc chắn muốn chuyển khóa học "${archiveTarget?.title}" sang trạng thái Lưu trữ?`}
        confirmLabel="Lưu trữ khóa học"
        cancelLabel="Huỷ"
        variant="danger"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (archiveTarget) {
            updateStatusMutation.mutate({
              courseId: archiveTarget.courseId,
              status: 'archived',
            });
          }
        }}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};

/* =========================================================
 * Table view
 * ========================================================= */
const CourseTable: React.FC<{
  courses: CourseDto[];
  onView: (c: CourseDto) => void;
  onEdit: (c: CourseDto) => void;
  onManageContents: (c: CourseDto) => void;
  onStatusChange: (c: CourseDto, next: CourseStatus) => void;
  onArchive: (c: CourseDto) => void;
  busyCourseId: string | null;
}> = ({
  courses,
  onView,
  onEdit,
  onManageContents,
  onStatusChange,
  onArchive,
  busyCourseId,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
            <th className="py-3.5 px-4 font-bold">Khóa học</th>
            <th className="py-3.5 px-3 font-bold">Chứng chỉ</th>
            <th className="py-3.5 px-3 font-bold">Trình độ</th>
            <th className="py-3.5 px-3 font-bold">Mentor</th>
            <th className="py-3.5 px-3 font-bold">Học phí</th>
            <th className="py-3.5 px-3 font-bold">Trạng thái</th>
            <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((c) => (
            <tr
              key={c.courseId}
              className="hover:bg-slate-50/60 transition-colors"
            >
              <td className="py-3 px-4 max-w-[280px]">
                <Link
                  to={`/admin/courses/${c.courseId}`}
                  className="font-bold text-slate-900 block truncate hover:text-[#0052CC] transition-colors"
                >
                  {c.title}
                </Link>
                <span className="font-mono text-[10px] text-slate-400">
                  {c.code}
                </span>
              </td>
              <td className="py-3 px-3">
                {c.certificateName ? (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-100 whitespace-nowrap">
                    {c.certificateName}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                {c.level ?? '—'}
              </td>
              <td className="py-3 px-3 text-slate-700 max-w-[150px] truncate">
                {c.mentorName ?? <span className="text-slate-300">VOD</span>}
              </td>
              <td className="py-3 px-3 font-bold text-[#0052CC] whitespace-nowrap">
                {formatVND(c.price ?? 0)}
              </td>
              <td className="py-3 px-3">
                <StatusSelect
                  status={c.status}
                  disabled={busyCourseId === c.courseId}
                  onChange={(next) => onStatusChange(c, next)}
                />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onManageContents(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                    title="Quản lý bài học"
                    aria-label="Quản lý bài học"
                  >
                    <Layers3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onView(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                    title="Xem chi tiết"
                    aria-label="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa khóa học"
                    aria-label="Sửa khóa học"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {c.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => onArchive(c)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Lưu trữ khóa học"
                      aria-label="Lưu trữ khóa học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* =========================================================
 * Grid view
 * ========================================================= */
const AdminCourseCard: React.FC<{
  course: CourseDto;
  onView: (c: CourseDto) => void;
  onEdit: (c: CourseDto) => void;
  onManageContents: (c: CourseDto) => void;
  onStatusChange: (next: CourseStatus) => void;
  onArchive: () => void;
  disabled?: boolean;
}> = ({
  course,
  onView,
  onEdit,
  onManageContents,
  onStatusChange,
  onArchive,
  disabled,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      <div className="relative h-24 bg-gradient-to-r from-[#0052CC] to-indigo-700 p-4 flex items-start justify-between text-white">
        <div className="min-w-0">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider">
            {course.certificateName ?? 'General'}
          </span>
          <p className="text-[11px] font-mono opacity-80 mt-1 truncate">
            {course.code}
          </p>
        </div>
        <StatusSelect
          status={course.status}
          disabled={disabled}
          onChange={onStatusChange}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
            {course.description ?? 'Chưa có mô tả'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {course.level && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
              <Layers3 className="w-3 h-3" />
              {course.level}
            </span>
          )}
          {course.targetScore != null && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <Target className="w-3 h-3" />
              Band {course.targetScore}+
            </span>
          )}
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-blue-50 text-[#0052CC] text-[10px] font-bold border border-blue-100">
            <Users className="w-3 h-3" />
            {course.mentorName ? 'Có mentor' : 'VOD'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Học phí
            </p>
            <p className="text-sm font-black text-[#0052CC]">
              {formatVND(course.price ?? 0)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onManageContents(course)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
              title="Quản lý bài học"
              aria-label="Quản lý bài học"
            >
              <Layers3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onView(course)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
              title="Xem chi tiết"
              aria-label="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(course)}
              className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
              title="Sửa khóa học"
              aria-label="Sửa khóa học"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {course.status !== 'archived' && (
              <button
                type="button"
                onClick={onArchive}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                title="Lưu trữ khóa học"
                aria-label="Lưu trữ khóa học"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * Modal: Create / Edit course
 * ========================================================= */
const CourseFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  editing: CourseDto | null;
  certificates: { certificateId: string; certificateName: string }[];
}> = ({ open, onClose, editing, certificates }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const emptyForm = {
    code: '',
    title: '',
    description: '',
    level: 'INTERMEDIATE',
    price: '',
    targetScore: '',
    thumbnailUrl: '',
    certificateId: '',
    status: 'draft' as CourseStatus,
  };

  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  // Nạp dữ liệu khóa học đang sửa vào form (1 lần cho mỗi lần mở)
  const loadedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      loadedFor.current = null;
      return;
    }
    const id = editing?.courseId ?? 'new';
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setTouched(false);
    setForm(
      editing
        ? {
            code: editing.code ?? '',
            title: editing.title ?? '',
            description: editing.description ?? '',
            level: editing.level ?? 'INTERMEDIATE',
            price: editing.price != null ? String(editing.price) : '',
            targetScore:
              editing.targetScore != null ? String(editing.targetScore) : '',
            thumbnailUrl: editing.thumbnailUrl ?? '',
            certificateId: editing.certificateId ?? '',
            status: editing.status ?? 'draft',
          }
        : emptyForm,
    );
  }, [open, editing]);

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success('Đã tạo khóa học');
      queryClient.invalidateQueries({ queryKey: ['catalog', 'courses'] });
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCoursePayload }) =>
      updateCourse(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật khóa học');
      queryClient.invalidateQueries({ queryKey: ['catalog', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'certificates'] });
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại'),
  });

  // Validate theo ràng buộc @NotBlank/@Size/@DecimalMin của backend
  const errors = {
    code: !form.code.trim()
      ? 'Mã khóa học là bắt buộc'
      : form.code.trim().length > 50
        ? 'Tối đa 50 ký tự'
        : '',
    title: !form.title.trim()
      ? 'Tiêu đề là bắt buộc'
      : form.title.trim().length > 255
        ? 'Tối đa 255 ký tự'
        : '',
    price: form.price && Number(form.price) < 0 ? 'Giá phải ≥ 0' : '',
    targetScore:
      form.targetScore && Number(form.targetScore) < 0
        ? 'Điểm mục tiêu phải ≥ 0'
        : '',
    thumbnailUrl:
      form.thumbnailUrl && form.thumbnailUrl.length > 500
        ? 'URL tối đa 500 ký tự'
        : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;

    const shared = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      level: form.level.trim() || undefined,
      price: form.price ? Number(form.price) : undefined,
      targetScore: form.targetScore ? Number(form.targetScore) : undefined,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      certificateId: form.certificateId || undefined,
    };

    if (editing) {
      // UpdateCourseRequest không có `code` (mã là khoá tĩnh)
      updateMutation.mutate({
        id: editing.courseId,
        payload: { ...shared, status: form.status },
      });
    } else {
      createMutation.mutate({ code: form.code.trim(), ...shared });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Cập nhật khóa học' : 'Tạo khóa học mới'}
            </h3>
            <p className="text-xs text-slate-500">
              {editing
                ? editing.title
                : 'Thiết lập thông tin chương trình và học phí'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Field label="Mã khóa học" required={!editing} error={touched ? errors.code : ''}>
          <input
            type="text"
            required
            disabled={Boolean(editing)}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="VD: IELTS-75-INT"
            className={inputCls(Boolean(editing))}
          />
        </Field>

        <Field label="Tiêu đề" required error={touched ? errors.title : ''}>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="VD: IELTS Intensive Mastery 7.5+"
            className={inputCls(Boolean(errors.title && touched))}
          />
        </Field>

        <Field label="Mô tả">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn về chương trình…"
            className={cn(inputCls(false), 'h-auto py-2 resize-none')}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Chứng chỉ">
            <select
              value={form.certificateId}
              onChange={(e) => setForm({ ...form, certificateId: e.target.value })}
              className={cn(inputCls(false), 'bg-white')}
            >
              <option value="">— Không —</option>
              {certificates.map((c) => (
                <option key={c.certificateId} value={c.certificateId}>
                  {c.certificateName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Trình độ">
            <input
              type="text"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              placeholder="INTERMEDIATE"
              className={inputCls(false)}
            />
          </Field>

          {editing ? (
            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as CourseStatus })
                }
                className={cn(inputCls(false), 'bg-white font-medium')}
              >
                <option value="draft">Bản nháp</option>
                <option value="active">Đang mở</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </Field>
          ) : (
            <Field label="Trạng thái ban đầu">
              <input
                type="text"
                disabled
                value="Bản nháp"
                className={inputCls(true)}
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Học phí (VND)" error={touched ? errors.price : ''}>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="3490000"
              className={cn(inputCls(Boolean(errors.price && touched)), 'bg-white')}
            />
          </Field>

          <Field label="Điểm mục tiêu" error={touched ? errors.targetScore : ''}>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.targetScore}
              onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
              placeholder="7.5"
              className={cn(inputCls(Boolean(errors.targetScore && touched)), 'bg-white')}
            />
          </Field>
        </div>

        <Field label="Ảnh thumbnail (URL)" error={touched ? errors.thumbnailUrl : ''}>
          <input
            type="url"
            value={form.thumbnailUrl}
            onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
            placeholder="https://…"
            className={inputCls(Boolean(errors.thumbnailUrl && touched))}
          />
        </Field>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPending}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            {editing ? 'Lưu thay đổi' : 'Tạo khóa học'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

/* =========================================================
 * Modal: Course detail
 * ========================================================= */
const CourseDetailModal: React.FC<{
  course: CourseDto | null;
  onClose: () => void;
}> = ({ course, onClose }) => {
  if (!course) return null;
  const meta = STATUS_META[course.status] ?? {
    label: course.status,
    variant: 'neutral' as const,
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Thông tin khóa học</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
          {course.certificateName ?? 'General'}
        </span>
        <h4 className="font-extrabold text-slate-900 text-base">{course.title}</h4>
        <p className="text-xs text-slate-500 font-mono">{course.code}</p>
      </div>

      {course.description && (
        <p className="text-sm text-slate-600 leading-relaxed pt-1">
          {course.description}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <DetailCell label="Mã khóa học" value={course.code} mono />
        <DetailCell label="Học phí" value={formatVND(course.price ?? 0)} accent />
        <DetailCell label="Trình độ" value={course.level ?? '—'} />
        <DetailCell
          label="Điểm mục tiêu"
          value={course.targetScore != null ? `Band ${course.targetScore}+` : '—'}
        />
        <DetailCell label="Chứng chỉ" value={course.certificateName ?? '—'} />
        <DetailCell label="Kỹ năng" value={course.certificatePartName ?? '—'} />
        <DetailCell label="Mentor" value={course.mentorName ?? 'Khóa VOD'} />
        <DetailCell label="Trạng thái" value={meta.label} />
      </dl>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={onClose}
        className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
      >
        Đóng
      </Button>
    </ModalShell>
  );
};

/* =========================================================
 * Modal: Manage course contents
 * ========================================================= */
const ContentModal: React.FC<{
  course: CourseDto | null;
  onClose: () => void;
}> = ({ course, onClose }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const emptyForm = {
    contentType: 'lesson' as ContentType,
    title: '',
    description: '',
    contentOrder: '0',
    /* --- lesson --- */
    isPreview: false,
    videoUrl: '',
    durationMinutes: '',
    /* --- vocabulary --- */
    setIds: [] as string[],
    /** Tên bộ từ vựng (setId → title) — dùng để dựng tiêu đề tự động. */
    setTitles: {} as Record<string, string>,
    /* --- homework --- */
    submissionType: 'text' as HomeworkSubmissionType,
    examId: '',
    instructions: '',
    dueDate: '',
    maxScore: '',
    passingScore: '',
    timeLimitMinutes: '',
    maxAttempts: '',
    attachmentUrl: '',
  };
  const [form, setForm] = useState(emptyForm);
  const lastCourseId = React.useRef<string | null>(null);

  // Reset form mỗi lần mở modal cho khóa học khác
  React.useEffect(() => {
    if (course && lastCourseId.current !== course.courseId) {
      lastCourseId.current = course.courseId;
      setForm(emptyForm);
    }
    if (!course) lastCourseId.current = null;
  }, [course]);

  const { data: contents = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.catalog.contents(course?.courseId ?? ''),
    queryFn: () => fetchCourseContents(course!.courseId),
    enabled: Boolean(course?.courseId),
  });

  /** Đổi loại nội dung → reset các field riêng của loại cũ. */
  const handleTypeChange = (next: ContentType) => {
    setForm((f) => ({
      ...emptyForm,
      contentType: next,
      // Tiêu đề / mô tả / thứ tự KHÔNG áp dụng cho nội dung 'vocabulary'
      // (nội dung này chỉ là con trỏ tới các bộ trong kho chung) → reset luôn.
      title: next === 'vocabulary' ? '' : f.title,
      description: next === 'vocabulary' ? '' : f.description,
      contentOrder: next === 'vocabulary' ? '0' : f.contentOrder,
    }));
  };

  /** Tick / bỏ tick 1 bộ từ vựng trong kho chung. */
  const toggleSet = (setId: string, title: string) => {
    setForm((f) => {
      const setTitles = { ...f.setTitles };
      if (f.setIds.includes(setId)) {
        delete setTitles[setId];
      } else {
        setTitles[setId] = title;
      }
      return {
        ...f,
        setTitles,
        setIds: f.setIds.includes(setId)
          ? f.setIds.filter((id) => id !== setId)
          : [...f.setIds, setId],
      };
    });
  };
  const createMutation = useMutation({
    mutationFn: () => {
      if (!course) throw new Error('Chưa chọn khóa học');
      // Nội dung 'vocabulary' không có tiêu đề do admin gõ → không bắt buộc.
      const isVocabulary = form.contentType === 'vocabulary';
      if (!isVocabulary && !form.title.trim()) {
        throw new Error('Tiêu đề là bắt buộc');
      }

      // contentData gửi lên là JSON **string** — shape đúng theo contentType.
      let contentData = '{}';
      let vocabularySetIds: string[] | undefined;
      let examId: string | undefined;
      // Tiêu đề gửi lên — với 'vocabulary' ta tự dựng từ tên các bộ đã tick.
      let title = form.title.trim();

      if (form.contentType === 'lesson') {
        contentData = JSON.stringify({
          isPreview: form.isPreview,
          videoUrl: form.videoUrl.trim() || undefined,
          durationMinutes: form.durationMinutes
            ? Number(form.durationMinutes)
            : undefined,
        });
      } else if (isVocabulary) {
        if (form.setIds.length === 0) {
          throw new Error('Cần chọn ít nhất một bộ từ vựng');
        }
        vocabularySetIds = form.setIds;
        contentData = JSON.stringify({ setIds: form.setIds });
        title = buildVocabularyTitle(
          form.setIds,
          form.setTitles,
          CONTENT_TYPE_LABEL.vocabulary,
        );
      } else {
        if (
          form.submissionType === 'multiple_choice' &&
          !form.examId.trim()
        ) {
          throw new Error('Hãy chọn đề thi để liên kết');
        }
        examId =
          form.submissionType === 'multiple_choice'
            ? form.examId.trim()
            : undefined;
        contentData = JSON.stringify({
          submissionType: form.submissionType,
          instructions: form.instructions.trim() || undefined,
          dueDate: form.dueDate || undefined,
          maxScore: form.maxScore ? Number(form.maxScore) : undefined,
          passingScore: form.passingScore
            ? Number(form.passingScore)
            : undefined,
          timeLimitMinutes: form.timeLimitMinutes
            ? Number(form.timeLimitMinutes)
            : undefined,
          maxAttempts: form.maxAttempts
            ? Number(form.maxAttempts)
            : undefined,
          attachmentUrl: form.attachmentUrl.trim() || undefined,
          examId,
          rubric: [],
        });
      }

      return createCourseContent(course.courseId, {
        contentType: form.contentType,
        title,
        description: form.description.trim() || undefined,
        contentOrder: Number(form.contentOrder) || 0,
        vocabularySetIds,
        examId,
        contentData,
      });
    },
    onSuccess: () => {
      toast.success('Đã thêm nội dung');
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalog.contents(course!.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalog.vocabularies(course!.courseId),
      });
      setForm((f) => ({
        ...f,
        title: '',
        description: '',
        videoUrl: '',
        durationMinutes: '',
        setIds: [],
        setTitles: {},
        examId: '',
        instructions: '',
        dueDate: '',
        maxScore: '',
        passingScore: '',
        timeLimitMinutes: '',
        maxAttempts: '',
        attachmentUrl: '',
      }));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Thêm thất bại'),
  });

  if (!course) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Nội dung khóa học
          </h3>
          <p className="text-xs text-slate-500 truncate">{course.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* --- Form thêm nội dung --- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Loại nội dung">
            <select
              value={form.contentType}
              onChange={(e) => handleTypeChange(e.target.value as ContentType)}
              className={cn(inputCls(false), 'bg-white')}
            >
              {(Object.keys(CONTENT_TYPE_LABEL) as ContentType[]).map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>

          {/*
            * Nội dung 'vocabulary' chỉ là CON TRỎ tới các bộ trong kho từ
            * vựng chung → không có tiêu đề / mô tả / thứ tự riêng.
            * Thứ tự hiển thị do `course_vocabulary_sets.display_order` quản lý.
            */}
          {form.contentType !== 'vocabulary' && (
            <>
              <Field label="Tiêu đề" required>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Task 1 Overview"
                  className={inputCls(false)}
                />
              </Field>

              <Field label="Mô tả">
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={inputCls(false)}
                />
              </Field>
            </>
          )}

          {/* ============ FORM ĐỘNG THEO LOẠI NỘI DUNG ============ */}
          {form.contentType === 'lesson' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thứ tự">
                  <input
                    type="number"
                    value={form.contentOrder}
                    onChange={(e) =>
                      setForm({ ...form, contentOrder: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
                <Field label="Thời lượng (phút)">
                  <input
                    type="number"
                    min="0"
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationMinutes: e.target.value,
                      })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
              </div>

              <Field label="Video URL (MP4 hoặc YouTube)">
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm({ ...form, videoUrl: e.target.value })
                  }
                  placeholder="https://…"
                  className={inputCls(false)}
                />
              </Field>

              {/* Checkbox học thử */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPreview}
                  onChange={(e) =>
                    setForm({ ...form, isPreview: e.target.checked })
                  }
                  className="mt-0.5 rounded border-amber-300 text-[#0052CC]"
                />
                <span className="text-xs text-amber-900 leading-snug">
                  <strong className="font-bold">Bài học thử (miễn phí)</strong>
                  <br />
                  <span className="text-amber-700">
                    Ai cũng xem được video bài này mà không cần ghi danh.
                  </span>
                </span>
              </label>
            </>
          )}

          {/* ---- TỪ VỰNG: chọn bộ trong KHO TỪ VỰNG CHUNG ---- */}
          {form.contentType === 'vocabulary' && (
            <>
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn bộ từ vựng từ kho chung
                </p>
                <p className="text-[11px] text-slate-500">
                  Tìm trong kho từ vựng chung và tick chọn các bộ muốn liên
                  kết vào khóa học này.
                </p>
                <VocabularyBankPicker
                  selectedIds={form.setIds}
                  onToggle={toggleSet}
                  courseId={course.courseId}
                />
              </div>
            </>
          )}

          {/* ---- BÀI TẬP: chọn đề thi / bài kiểm tra định nghĩa sẵn ---- */}
          {form.contentType === 'homework' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thứ tự">
                  <input
                    type="number"
                    value={form.contentOrder}
                    onChange={(e) =>
                      setForm({ ...form, contentOrder: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
                <Field label="Hình thức nộp">
                  <select
                    value={form.submissionType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        submissionType: e.target
                          .value as HomeworkSubmissionType,
                      })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  >
                    <option value="text">Tự luận (gõ trả lời)</option>
                    <option value="file">Nộp file</option>
                    <option value="multiple_choice">
                      Trắc nghiệm (phòng thi)
                    </option>
                  </select>
                </Field>
              </div>

              {form.submissionType === 'multiple_choice' && (
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chọn đề thi / bài kiểm tra
                  </p>
                  <ExamPicker
                    courseId={course.courseId}
                    selectedExamId={form.examId}
                    onSelect={(examId) =>
                      setForm({ ...form, examId })
                    }
                  />
                </div>
              )}

              <Field label="Hướng dẫn">
                <textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  rows={3}
                  placeholder="Học viên cần làm gì?"
                  className={cn(inputCls(false), 'h-auto py-2 bg-white')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Hạn nộp">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
                <Field label="Thời gian làm bài (phút)">
                  <input
                    type="number"
                    min="0"
                    value={form.timeLimitMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        timeLimitMinutes: e.target.value,
                      })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Điểm tối đa">
                  <input
                    type="number"
                    min="0"
                    value={form.maxScore}
                    onChange={(e) =>
                      setForm({ ...form, maxScore: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
                <Field label="Điểm đạt (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.passingScore}
                    onChange={(e) =>
                      setForm({ ...form, passingScore: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Số lần làm tối đa">
                  <input
                    type="number"
                    min="0"
                    value={form.maxAttempts}
                    onChange={(e) =>
                      setForm({ ...form, maxAttempts: e.target.value })
                    }
                    className={cn(inputCls(false), 'bg-white')}
                  />
                </Field>
                <Field label="Link tài liệu">
                  <input
                    type="url"
                    value={form.attachmentUrl}
                    onChange={(e) =>
                      setForm({ ...form, attachmentUrl: e.target.value })
                    }
                    placeholder="https://… (pdf)"
                    className={inputCls(false)}
                  />
                </Field>
              </div>
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            fullWidth
            isLoading={createMutation.isPending}
            leftIcon={Plus}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            Thêm nội dung
          </Button>
        </form>

        {/* --- Danh sách nội dung hiện có --- */}
        <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-4 max-h-[440px] overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Hiện có ({contents.length})
          </p>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              Chưa có nội dung nào. Thêm bài học đầu tiên ở bên trái.
            </p>
          ) : (
            <ul className="space-y-2">
              {contents.map((c) => (
                <li
                  key={c.contentId}
                  className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200"
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                      c.isPreview
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-[#E0F2FE] text-[#0052CC]',
                    )}
                  >
                    {c.isPreview ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {CONTENT_TYPE_LABEL[c.contentType] ?? c.contentType} · #
                      {c.contentOrder}
                    </p>
                  </div>
                  {c.isPreview && (
                    <Badge variant="warning" size="sm">
                      Thử
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

/* =========================================================
 * Shared form atoms
 * ========================================================= */
const inputCls = (invalid: boolean) =>
  cn(
    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
    'placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
    invalid
      ? 'border-rose-300 focus:border-rose-400'
      : 'border-slate-200 focus:border-[#0052CC]',
  );

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
  </div>
);

const DetailCell: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}> = ({ label, value, mono, accent }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
    <dt className="text-slate-400 font-semibold uppercase text-[10px]">{label}</dt>
    <dd
      className={cn(
        'font-bold mt-1 truncate',
        mono && 'font-mono',
        accent ? 'text-[#0052CC]' : 'text-slate-800',
      )}
    >
      {value}
    </dd>
  </div>
);

const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}> = ({ children, onClose, maxWidth = 'max-w-lg' }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      className={cn(
        'bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-100',
        'max-h-[90vh] overflow-y-auto',
        maxWidth,
      )}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);

export default CourseManagementView;