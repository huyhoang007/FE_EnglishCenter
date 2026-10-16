/**
 * MyCoursesView — Danh sách "Khóa học của tôi" (Prep.vn Capsule Cards)
 * -----------------------------------------------------------
 *  - Thẻ khóa học dạng bo tròn lớn (rounded-3xl), p-7, shadow-md
 *  - 2 kiểu: Gradient nổi bật (xanh dương / xanh lá) + Trắng học viên
 *  - Thanh tiến độ dày dặn, bo 2 đầu
 *  - Hộp "Bài tiếp theo" bg-slate-50 rounded-2xl
 *  - CTA viên thuốc bg-[#0052CC] h-11
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Play,
  Trophy,
  BookOpen,
  Clock,
  AlertCircle,
  Filter,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import {
  MOCK_ENROLLED_COURSES,
  MOCK_LEARNING_STATS,
} from '@/mocks';
import { CERT_LABEL } from '@/shared/types';
import type {
  EnrolledCourse,
  MyCoursesFilter,
} from '@/shared/types';
import type { CertificateType } from '@/shared/types';

const CERT_BADGE: Record<CertificateType, 'ielts' | 'toeic' | 'vstep'> = {
  IELTS: 'ielts',
  TOEIC: 'toeic',
  VSTEP: 'vstep',
};

/* ============================================================
 *  Component chính
 * ============================================================ */
export const MyCoursesView: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MyCoursesFilter>('all');

  const filtered = useMemo<EnrolledCourse[]>(() => {
    if (filter === 'all') return MOCK_ENROLLED_COURSES;
    if (filter === 'in-progress') {
      return MOCK_ENROLLED_COURSES.filter(
        (c) => c.progress.status === 'IN_PROGRESS',
      );
    }
    return MOCK_ENROLLED_COURSES.filter(
      (c) => c.progress.status === 'COMPLETED',
    );
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            <GraduationCap className="w-3.5 h-3.5 text-[#0052CC]" />
            Phòng học của học viên
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Khóa học của tôi
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Theo dõi tiến độ học tập và tiếp tục các bài giảng đang diễn ra.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          leftIcon={Trophy}
          onClick={() => navigate('/exams/ielts-mock-01')}
        >
          Luyện đề thi cuối kỳ
        </Button>
      </header>

      {/* ============== STATS ============== */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        aria-label="Thống kê học tập"
      >
        <StatCard
          icon={BookOpen}
          label="Khóa học đang học"
          value={MOCK_LEARNING_STATS.inProgressCourses}
          unit="khóa học"
          accentHint="Hãy duy trì đều đặn mỗi ngày"
        />
        <StatCard
          icon={Clock}
          label="Thời lượng đã học"
          value={MOCK_LEARNING_STATS.studiedHours}
          unit="giờ"
          accentHint="Tương đương 4 tuần luyện tập"
        />
        <StatCard
          icon={AlertCircle}
          label="Bài tập cần hoàn thành"
          value={MOCK_LEARNING_STATS.pendingHomeworks}
          unit="bài tập"
          accentHint="Có bài đang chờ nộp trước 23:59 CN"
          warning
        />
      </section>

      {/* ============== FILTER BAR ============== */}
      <section
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        aria-label="Bộ lọc khóa học"
      >
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-slate-200 shadow-sm self-start sm:self-auto">
          <FilterButton
            active={filter === 'all'}
            label="Tất cả khóa học"
            onClick={() => setFilter('all')}
            count={MOCK_ENROLLED_COURSES.length}
            icon={Filter}
          />
          <FilterButton
            active={filter === 'in-progress'}
            label="Đang học"
            onClick={() => setFilter('in-progress')}
            count={
              MOCK_ENROLLED_COURSES.filter(
                (c) => c.progress.status === 'IN_PROGRESS',
              ).length
            }
          />
          <FilterButton
            active={filter === 'completed'}
            label="Đã hoàn thành"
            onClick={() => setFilter('completed')}
            count={
              MOCK_ENROLLED_COURSES.filter(
                (c) => c.progress.status === 'COMPLETED',
              ).length
            }
            icon={CheckCircle2}
          />
        </div>
        <p className="text-xs text-slate-500">
          Hiển thị{' '}
          <span className="font-bold text-slate-700">{filtered.length}</span> /
          {MOCK_ENROLLED_COURSES.length} khóa học
        </p>
      </section>

      {/* ============== COURSE GRID ============== */}
      {filtered.length === 0 ? (
        <EmptyState
          onReset={() => setFilter('all')}
          isCompletedFilter={filter === 'completed'}
        />
      ) : (
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          aria-label="Danh sách khóa học"
        >
          {filtered.map((ec) => (
            <CourseCard
              key={ec.course.id}
              enrolled={ec}
              onContinue={() =>
                navigate(
                  `/study/${ec.course.slug}?lesson=${ec.nextLesson.id}`,
                )
              }
            />
          ))}
        </section>
      )}
    </div>
  );
};

/* ============================================================
 *  Stat Card — viên thuốc phẳng
 * ============================================================ */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  accentHint: string;
  warning?: boolean;
}
const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  accentHint,
  warning = false,
}) => {
  return (
    <div
      className={cn(
        'relative rounded-3xl bg-white border border-slate-200',
        'p-6 flex items-start gap-4',
        'shadow-sm hover:shadow-md transition-shadow',
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
          warning
            ? 'bg-amber-50 text-amber-600'
            : 'bg-blue-50 text-[#0052CC]',
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {value}
          </span>
          <span className="text-sm font-semibold text-slate-500">{unit}</span>
          {warning && (
            <Badge variant="warning" size="sm" className="ml-1">
              Cảnh báo
            </Badge>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{accentHint}</p>
      </div>
    </div>
  );
};

/* ============================================================
 *  Filter Button — pill
 * ============================================================ */
interface FilterButtonProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  icon?: React.ElementType;
}
const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  label,
  count,
  onClick,
  icon: Icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold transition-all',
      active
        ? 'bg-[#0052CC] text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900',
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold',
        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
      )}
    >
      {count}
    </span>
  </button>
);

/* ============================================================
 *  Course Card — Capsule Card chuẩn Prep.vn
 * ============================================================ */
interface CourseCardProps {
  enrolled: EnrolledCourse;
  onContinue: () => void;
}
const CourseCard: React.FC<CourseCardProps> = ({ enrolled, onContinue }) => {
  const { course, progress, nextLesson, mentor } = enrolled;
  const isCompleted = progress.status === 'COMPLETED';
  const percent = progress.percent;

  // Kiểu 1: Thẻ Gradient (nổi bật) — dùng cho khóa học IELTS/TOEIC flagship
  const isFlagship = course.certificate === 'IELTS';
  const gradientClass = cn(
    'rounded-3xl p-7 overflow-hidden relative',
    'transition-all duration-300',
    isFlagship
      ? 'bg-gradient-to-br from-[#0052CC] to-[#0066FF] text-white shadow-md hover:shadow-xl hover:-translate-y-1'
      : 'bg-gradient-to-br from-[#00A859] to-[#00C853] text-white shadow-md hover:shadow-xl hover:-translate-y-1',
  );

  if (isFlagship || isCompleted) {
    return (
      <div className={gradientClass}>
        {/* Decorative blur nhẹ */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-3">
          <Badge
            variant={CERT_BADGE[course.certificate]}
            size="md"
            className="bg-white/15 text-white border-white/30 backdrop-blur-sm"
          >
            {course.certificate}
          </Badge>
          {isCompleted && (
            <Badge
              variant="success"
              size="md"
              icon={CheckCircle2}
              className="bg-white/15 text-white border-white/30 backdrop-blur-sm"
            >
              Hoàn thành
            </Badge>
          )}
        </div>
        <h2 className="relative mt-5 text-xl sm:text-2xl font-extrabold leading-snug line-clamp-2">
          {course.title}
        </h2>
        <p className="relative mt-2 text-sm text-white/85 line-clamp-2">
          {mentor.fullName} · {mentor.title}
        </p>

        {/* Progress bar dày dặn */}
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-white/85 inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Tiến độ học tập
            </span>
            <span className="font-extrabold text-white tabular-nums">
              {percent}%
            </span>
          </div>
          <div
            className="h-3 rounded-full bg-white/20 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* CTA: nút tròn mũi tên trắng ở góc dưới */}
        <div className="relative mt-7 flex items-center justify-between">
          <div className="text-xs text-white/80">
            {isCompleted ? 'Đã hoàn thành' : 'Tiếp tục lộ trình của bạn'}
          </div>
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              'w-12 h-12 rounded-full bg-white text-[#0052CC]',
              'inline-flex items-center justify-center',
              'shadow-lg hover:scale-105 active:scale-95 transition-transform',
            )}
            aria-label={isCompleted ? 'Xem lại khóa học' : 'Tiếp tục học'}
          >
            <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // Kiểu 2: Thẻ Trắng Học viên
  return (
    <div
      className={cn(
        'rounded-3xl bg-white border border-slate-200',
        'p-7 shadow-md hover:shadow-xl hover:-translate-y-1',
        'transition-all duration-300',
      )}
    >
      {/* Tag nổi chứng chỉ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={CERT_BADGE[course.certificate]} size="md">
          {course.certificate}
        </Badge>
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">
          {CERT_LABEL[course.certificate]}
        </span>
      </div>

      {/* Tiêu đề + Mentor */}
      <h2 className="mt-5 text-lg sm:text-xl font-extrabold text-slate-900 leading-snug line-clamp-2">
        {course.title}
      </h2>
      <div className="mt-3 flex items-center gap-2.5">
        <img
          src={mentor.avatarUrl}
          alt={mentor.fullName}
          className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm"
        />
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-bold text-slate-800 truncate">
            {mentor.fullName}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold truncate">
            {mentor.title}
          </p>
        </div>
      </div>

      {/* Progress bar dày dặn */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-600 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#0052CC]" />
            Đã hoàn thành
          </span>
          <span className="font-extrabold text-[#0052CC] tabular-nums">
            {percent}%
          </span>
        </div>
        <div
          className="h-3 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#0052CC] rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Hộp "Bài tiếp theo" */}
      <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
        <span
          className="w-9 h-9 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center shrink-0 shadow-sm"
          aria-hidden="true"
        >
          <Play className="w-4 h-4 text-[#0052CC] fill-[#0052CC]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Bài tiếp theo
          </p>
          <p className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-2">
            Bài {String(nextLesson.order).padStart(2, '0')} — {nextLesson.title}
          </p>
        </div>
      </div>

      {/* CTA viên thuốc */}
      <button
        type="button"
        onClick={onContinue}
        className={cn(
          'mt-6 w-full h-11 px-6 rounded-full',
          'bg-[#0052CC] hover:bg-[#0040A8] text-white text-sm font-bold',
          'inline-flex items-center justify-center gap-2',
          'shadow-sm hover:shadow-md transition-all',
        )}
      >
        {isCompleted ? 'Xem lại khóa học' : 'Tiếp tục học ngay'}
        <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
};

/* ============================================================
 *  Empty State
 * ============================================================ */
interface EmptyStateProps {
  isCompletedFilter: boolean;
  onReset: () => void;
}
const EmptyState: React.FC<EmptyStateProps> = ({
  isCompletedFilter,
  onReset,
}) => (
  <Card className="rounded-3xl text-center py-16">
    <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
      <BookOpen className="w-7 h-7 text-slate-400" />
    </div>
    <h3 className="text-lg font-extrabold text-slate-900">
      {isCompletedFilter
        ? 'Bạn chưa hoàn thành khóa học nào'
        : 'Chưa có khóa học nào trong mục này'}
    </h3>
    <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
      Hãy khám phá thêm các khóa luyện thi IELTS, TOEIC, VSTEP và bắt đầu
      hành trình chinh phục chứng chỉ của bạn.
    </p>
    <Button
      variant="outline"
      size="md"
      className="mt-5"
      onClick={onReset}
    >
      Xem tất cả khóa học
    </Button>
  </Card>
);

export default MyCoursesView;
