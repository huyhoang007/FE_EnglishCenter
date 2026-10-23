/**
 * CourseMarketplacePage — Sàn khóa học (route `/courses`)
 * -----------------------------------------------------------
 * Nguồn dữ liệu THẬT từ Dev 2 backend:
 *   GET /api/v1/courses      → danh sách + phân trang (PageResponse)
 *   GET /api/v1/certificates → dropdown chứng chỉ (IELTS, TOEIC…)
 *
 * Bộ lọc map 1-1 với @RequestParam của CourseController:
 *   keyword · certificateId · level · targetScore · page
 *
 * Toàn bộ filter đồng bộ với URL query string để người dùng copy
 * link chia sẻ được.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  RotateCcw,
  SlidersHorizontal,
  GraduationCap,
  Target,
  Layers3,
  Clock,
  ArrowRight,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  EmptyState,
  ErrorState,
  Pagination,
  SkeletonCourseCard,
} from '@/shared/components/Feedback';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils/format';
import { fetchCourses } from '@/shared/api/courseService';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { CourseDto } from '@/shared/types/catalog.types';

/** Các mức trình độ — backend lưu `level` dạng string tự do. */
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  UPPER_INTERMEDIATE: 'Upper-Intermediate',
  ADVANCED: 'Advanced',
};

/** Map trạng thái backend (lowercase) → Badge variant của hệ thống. */
const STATUS_BADGE: Record<
  string,
  { variant: 'success' | 'warning' | 'neutral'; label: string }
> = {
  active: { variant: 'success', label: 'Đang mở' },
  draft: { variant: 'warning', label: 'Nháp' },
  archived: { variant: 'neutral', label: 'Lưu trữ' },
};

const PAGE_SIZE = 12;

/* =========================================================
 * Page
 * ========================================================= */
const CourseMarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Filter state, nguồn sự thật là URL ---
  const keyword = searchParams.get('keyword') ?? '';
  const certificateId = searchParams.get('certificateId') ?? '';
  const level = searchParams.get('level') ?? '';
  const targetScore = searchParams.get('targetScore') ?? '';
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0);

  // Input cục bộ cho ô tìm kiếm (debounce khi đẩy lên URL)
  const [keywordInput, setKeywordInput] = useState(keyword);
  useEffect(() => setKeywordInput(keyword), [keyword]);

  const patchParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    // Mọi thay đổi filter (trừ chính page) đưa về trang 0
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  // Debounce 400ms cho keyword
  useEffect(() => {
    if (keywordInput === keyword) return;
    const timer = window.setTimeout(
      () => patchParams({ keyword: keywordInput || null }),
      400,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  /* ---------- Queries ---------- */
  const queryParams = useMemo(
    () => ({
      keyword: keyword || undefined,
      certificateId: certificateId || undefined,
      level: level || undefined,
      targetScore: targetScore ? Number(targetScore) : undefined,
      status: 'active' as const,
      page,
      size: PAGE_SIZE,
    }),
    [keyword, certificateId, level, targetScore, page],
  );

  const {
    data: coursesPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.courses(queryParams),
    queryFn: () => fetchCourses(queryParams),
    placeholderData: keepPreviousData,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  const courses = coursesPage?.data ?? [];
  const hasActiveFilter = Boolean(keyword || certificateId || level || targetScore);

  const resetFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}
    >
      {/* ========== PAGE HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Course Catalog
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Khóa học chuẩn bị thi chứng chỉ
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
            Lọc theo chứng chỉ, trình độ đầu vào và điểm mục tiêu để tìm
            đúng lộ trình phù hợp.
          </p>
        </div>

        {coursesPage && (
          <p className="text-xs text-slate-500 font-semibold shrink-0">
            <span className="text-slate-900 font-bold">
              {coursesPage.totalElements}
            </span>{' '}
            khóa học
          </p>
        )}
      </div>

      {/* ========== FILTER BAR ========== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyword */}
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo tên khóa học hoặc mã…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm khóa học"
            />
          </div>

          {/* Certificate — nguồn thật từ GET /certificates */}
          <select
            value={certificateId}
            onChange={(e) => patchParams({ certificateId: e.target.value || null })}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo chứng chỉ"
          >
            <option value="">Tất cả chứng chỉ</option>
            {certificates.map((c) => (
              <option key={c.certificateId} value={c.certificateId}>
                {c.certificateName}
              </option>
            ))}
          </select>

          {/* Level */}
          <select
            value={level}
            onChange={(e) => patchParams({ level: e.target.value || null })}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo trình độ"
          >
            <option value="">Mọi trình độ</option>
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {LEVEL_LABEL[lv]}
              </option>
            ))}
          </select>

          {/* Target score */}
          <select
            value={targetScore}
            onChange={(e) => patchParams({ targetScore: e.target.value || null })}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo điểm mục tiêu"
          >
            <option value="">Mọi điểm mục tiêu</option>
            <option value="5.0">Band 5.0+</option>
            <option value="6.0">Band 6.0+</option>
            <option value="6.5">Band 6.5+</option>
            <option value="7.0">Band 7.0+</option>
            <option value="7.5">Band 7.5+</option>
            <option value="8.0">Band 8.0+</option>
          </select>

          {/* Reset */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCourseCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : courses.length === 0 ? (
        <EmptyState
          title="Không tìm thấy khóa học phù hợp"
          description={
            hasActiveFilter
              ? 'Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác.'
              : 'Chưa có khóa học nào được mở bán. Hãy quay lại sau.'
          }
          {...(hasActiveFilter
            ? { actionLabel: 'Xoá bộ lọc', onAction: resetFilters }
            : {})}
        />
      ) : (
        <>
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
              isFetching && 'opacity-60 transition-opacity',
            )}
          >
            {courses.map((c) => (
              <CourseCard key={c.courseId} course={c} />
            ))}
          </div>

          {coursesPage && (
            <Pagination
              className="mt-8"
              currentPage={coursesPage.currentPage}
              totalPages={coursesPage.totalPages}
              onChange={(p) => {
                patchParams({ page: p });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

/* =========================================================
 * CourseCard
 * ========================================================= */
const CourseCard: React.FC<{ course: CourseDto }> = ({ course }) => {
  const status = STATUS_BADGE[course.status] ?? {
    variant: 'neutral' as const,
    label: course.status,
  };

  return (
    <Link
      to={`/courses/${course.courseId}`}
      className={cn(
        'group bg-white rounded-2xl border border-slate-200/80 overflow-hidden',
        'shadow-xs hover:shadow-md hover:border-[#0052CC]/40',
        'transition-all flex flex-col',
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0052CC] to-indigo-600 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/40" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {course.certificateName && (
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/95 text-[#0052CC] font-extrabold text-[10px] uppercase tracking-wider backdrop-blur">
              {course.certificateName}
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3">
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] text-slate-400 font-bold">
            {course.code}
          </p>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {course.level && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
              <Layers3 className="w-3 h-3" />
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          )}
          {course.targetScore != null && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <Target className="w-3 h-3" />
              Band {course.targetScore}+
            </span>
          )}
          {course.mentorName && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-blue-50 text-[#0052CC] text-[10px] font-bold border border-blue-100">
              <GraduationCap className="w-3 h-3" />
              <span className="max-w-[110px] truncate">
                {course.mentorName}
              </span>
            </span>
          )}
        </div>

        {/* Footer: giá + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Học phí
            </p>
            <p className="text-sm font-black text-[#0052CC]">
              {formatVND(course.price ?? 0)}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-[#0052CC] transition-colors"
            aria-hidden="true"
          >
            Chi tiết
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseMarketplacePage;