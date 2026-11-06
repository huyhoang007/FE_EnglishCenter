/**
 * CourseManagementView — Quản trị khóa học (route `/admin/courses`)
 * -----------------------------------------------------------
 * Đã thay toàn bộ mock bằng API thật của Dev 2:
 *   GET  /api/v1/courses                     → bảng + bộ lọc + phân trang
 *   POST /api/v1/admin/courses               → modal tạo khóa học
 *   PUT  /api/v1/admin/courses/{id}          → sửa + toggle trạng thái
 *   GET  /api/v1/certificates                → dropdown chứng chỉ
 *
 * Nội dung khóa học (bài học / từ vựng / bài tập) được quản lý ở trang chi tiết
 * `/admin/courses/:id` (AdminCourseDetailView + CourseContentModal).
 *
 *
 * Layout giữ nguyên AdminLayout mới: bo góc 16px, viền slate-200/80,
 * font Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
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
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils/format';
import {
  parseCertificateScale,
  validateScoreOnScale,
} from '@/shared/utils/certificateScale';
import {
  createCourse,
  fetchCourses,
  updateCourse,
} from '@/shared/api/courseService';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  CEFR_OPTIONS,
  cefrLabel,
  cefrShortLabel,
  toFormLevel,
} from '@/shared/constants/cefrLevels';
import type {
  CourseDto,
  CourseStatus,
  UpdateCoursePayload,
} from '@/shared/types/catalog.types';

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
  const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);

  // Quản lý nội dung (bài học / từ vựng / bài tập: thêm, sửa, xoá) ở trang chi tiết khóa học.
  const navigate = useNavigate();
  const openContents = (c: CourseDto) => navigate(`/admin/courses/${c.courseId}`);

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
          onManageContents={openContents}
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
              onManageContents={openContents}
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

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Lưu trữ khóa học"
        description={`Bạn có chắc chắn muốn chuyển khóa học "${archiveTarget?.title}" sang trạng thái Lưu trữ?`}
        confirmLabel="Lưu trữ khóa học"
        cancelLabel="Huỷ"
        confirmVariant="danger"
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
                {c.level ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700"
                    title={cefrLabel(c.level)}
                  >
                    {cefrShortLabel(c.level)}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
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
            <span
              className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold"
              title={cefrLabel(course.level)}
            >
              <Layers3 className="w-3 h-3" />
              {cefrShortLabel(course.level)}
            </span>
          )}
          {course.targetScore != null && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <Target className="w-3 h-3" />
              Mục tiêu {course.targetScore}+
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
  certificates: {
    certificateId: string;
    certificateName: string;
    description?: string | null;
  }[];
}> = ({ open, onClose, editing, certificates }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const emptyForm = {
    code: '',
    title: '',
    description: '',
    level: '',
    price: '',
    entryScore: '',
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
            level: toFormLevel(editing.level),
            price: editing.price != null ? String(editing.price) : '',
            entryScore:
              editing.entryScore != null ? String(editing.entryScore) : '',
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

  // Thang điểm của chứng chỉ đang chọn (IELTS 0 – 9 bước 0.5, TOEIC 10 – 990 bước 5...)
  const selectedCertificate = certificates.find(
    (c) => c.certificateId === form.certificateId,
  );
  const scale = parseCertificateScale(selectedCertificate?.description);
  const hasScore = Boolean(form.entryScore.trim() || form.targetScore.trim());
  const priceValue = Number(form.price);

  // Validate khớp `CreateCourseRequest` + `CourseRules` của backend
  const errors = {
    code: editing
      ? ''
      : !form.code.trim()
        ? 'Mã khóa học là bắt buộc'
        : form.code.trim().length < 3 || form.code.trim().length > 50
          ? 'Mã khóa học phải từ 3 đến 50 ký tự'
          : !/^[A-Za-z0-9_-]+$/.test(form.code.trim())
            ? 'Chỉ gồm chữ không dấu, số, dấu - và _'
            : '',
    title: !form.title.trim()
      ? 'Tiêu đề là bắt buộc'
      : form.title.trim().length < 3
        ? 'Tiêu đề phải có ít nhất 3 ký tự'
        : form.title.trim().length > 255
          ? 'Tối đa 255 ký tự'
          : '',
    price: !form.price.trim()
      ? ''
      : !Number.isFinite(priceValue) || priceValue < 0
        ? 'Giá phải ≥ 0'
        : !Number.isInteger(priceValue)
          ? 'Học phí phải là số nguyên (VND)'
          : priceValue > 100_000_000
            ? 'Học phí tối đa 100.000.000 VND'
            : '',
    certificateId:
      hasScore && !form.certificateId
        ? 'Chọn chứng chỉ trước khi nhập điểm'
        : '',
    targetScore: validateScoreOnScale('Điểm mục tiêu', form.targetScore, scale),
    // Điểm đầu vào < điểm mục tiêu (VD khóa 4.0 → 5.0), dùng để gợi ý khóa vừa sức cho học viên
    entryScore:
      validateScoreOnScale('Điểm đầu vào', form.entryScore, scale) ||
      (form.entryScore && form.targetScore && Number(form.entryScore) >= Number(form.targetScore)
        ? 'Điểm đầu vào phải nhỏ hơn điểm mục tiêu'
        : ''),
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
      entryScore: form.entryScore ? Number(form.entryScore) : undefined,
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
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">
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

      <form onSubmit={handleSubmit} noValidate className="space-y-3 pt-1">
        {/* Bố cục 3 cột để form vừa 1 màn hình, không phải cuộn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        <div className="sm:col-span-2">
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
        </div>
        </div>

        <Field label="Mô tả">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn về chương trình…"
            className={cn(inputCls(false), 'h-auto py-2 resize-none')}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Chứng chỉ" error={touched ? errors.certificateId : ''}>
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
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className={cn(inputCls(false), 'bg-white')}
            >
              {CEFR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              {/* Fallback an toàn: nếu khóa học cũ có giá trị tự do không khớp CEFR */}
              {form.level &&
                !CEFR_OPTIONS.some((o) => o.value === form.level) && (
                  <option value={form.level}>
                    {form.level} (Giá trị cũ)
                  </option>
                )}
            </select>
          </Field>

          {editing && (
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
          )}

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

          <Field label="Điểm đầu vào" error={touched ? errors.entryScore : ''}>
            <input
              type="number"
              min={scale?.min ?? 0}
              max={scale?.max}
              step={scale?.step ?? 'any'}
              value={form.entryScore}
              onChange={(e) => setForm({ ...form, entryScore: e.target.value })}
              placeholder={scale ? `${scale.min} – ${scale.max}` : 'Chọn chứng chỉ trước'}
              className={cn(inputCls(Boolean(errors.entryScore && touched)), 'bg-white')}
            />
          </Field>

          <Field label="Điểm mục tiêu" error={touched ? errors.targetScore : ''}>
            <input
              type="number"
              min={scale?.min ?? 0}
              max={scale?.max}
              step={scale?.step ?? 'any'}
              value={form.targetScore}
              onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
              placeholder={scale ? `${scale.min} – ${scale.max}` : 'Chọn chứng chỉ trước'}
              className={cn(inputCls(Boolean(errors.targetScore && touched)), 'bg-white')}
            />
          </Field>

          <div className={editing ? 'sm:col-span-3' : ''}>
          <Field label="Ảnh thumbnail (URL)" error={touched ? errors.thumbnailUrl : ''}>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://…"
              className={inputCls(Boolean(errors.thumbnailUrl && touched))}
            />
          </Field>
          </div>
        </div>

        {!editing && (
          <p className="text-[11px] text-slate-400">
            Khóa học mới được tạo ở trạng thái <b>Bản nháp</b>. Thêm nội dung rồi chuyển sang “Đang mở” để bán.
          </p>
        )}

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
        <DetailCell
          label="Trình độ"
          value={course.level ? cefrLabel(course.level) : 'Không phân cấp'}
        />
        <DetailCell
          label="Điểm mục tiêu"
          value={course.targetScore != null ? `${course.targetScore}+` : '—'}
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