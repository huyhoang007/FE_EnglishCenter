/**
 * MyCoursesView — Trang Tổng quan "Khóa học của tôi"
 * -----------------------------------------------------------
 * Kết hợp phong cách Study Dashboard (Hình 1) và Thư viện phân loại (Hình 2):
 *   1. Welcome banner + 3 thẻ thống kê ngang nhỏ gọn (Header & Stats).
 *   2. Thanh Tabs phân loại cấp độ: [Tất cả] [Nền tảng TOEIC] [TOEIC Cấp tốc] [IELTS Chuyên sâu]
 *      + Thanh tìm kiếm (Search bar) + Dropdown chọn "Khóa học hiện tại".
 *   3. Lưới hiển thị danh sách khóa học (Course Grid 2-3 cột):
 *      - Ảnh thumbnail 16:9
 *      - Tên khóa học + Giảng viên
 *      - Thanh tiến độ %
 *      - Bài học tiếp theo
 *      - Nút "Tiếp tục học" điều hướng sang CoursePlayerView (/my-courses/:slug/learn)
 *      - Highlight viền xanh cho khóa học đang học tích cực nhất
 *
 * Bảng màu: Chuẩn Brand Primary Blue (#0052CC), nền xám/trắng nhạt, text slate.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  Play,
  TrendingUp,
  CheckCircle2,
  Calendar,
  X,
  Layers,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import {
  MOCK_ENROLLED_COURSES,
  MOCK_LEARNING_STATS,
} from '@/mocks';
import type { EnrolledCourse } from '@/shared/types';

/* ============================================================
 *  Types & Categories
 * ============================================================ */
type CourseCategoryTab =
  | 'all'
  | 'toeic-foundation'
  | 'toeic-speed'
  | 'ielts-intensive';

interface CategoryTabConfig {
  id: CourseCategoryTab;
  label: string;
}

const CATEGORY_TABS: CategoryTabConfig[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'toeic-foundation', label: 'Nền tảng TOEIC' },
  { id: 'toeic-speed', label: 'TOEIC Cấp tốc' },
  { id: 'ielts-intensive', label: 'IELTS Chuyên sâu' },
];

/* ============================================================
 *  Component: MyCoursesView
 * ============================================================ */
export const MyCoursesView: React.FC = () => {
  const navigate = useNavigate();
  const { user, userName } = useAuthStore();

  // State bộ lọc
  const [activeTab, setActiveTab] = useState<CourseCategoryTab>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>('all');

  // Lọc khóa học theo Tab, Search và Dropdown
  const filteredCourses = useMemo(() => {
    return MOCK_ENROLLED_COURSES.filter((item) => {
      const { course } = item;

      // 1. Lọc theo Dropdown "Khóa học hiện tại"
      if (selectedCourseSlug !== 'all' && course.slug !== selectedCourseSlug) {
        return false;
      }

      // 2. Lọc theo Tabs phân loại
      if (activeTab === 'toeic-foundation') {
        const isToeicFoundation =
          course.certificate === 'TOEIC' && course.slug.includes('foundation');
        if (!isToeicFoundation) return false;
      } else if (activeTab === 'toeic-speed') {
        const isToeicSpeed =
          course.certificate === 'TOEIC' &&
          (course.slug.includes('cap-toc') || course.slug.includes('speed'));
        if (!isToeicSpeed) return false;
      } else if (activeTab === 'ielts-intensive') {
        if (course.certificate !== 'IELTS') return false;
      }

      // 3. Lọc theo từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const term = searchKeyword.toLowerCase();
        const matchTitle = course.title.toLowerCase().includes(term);
        const matchMentor = item.mentor.fullName.toLowerCase().includes(term);
        const matchCert = course.certificate.toLowerCase().includes(term);
        if (!matchTitle && !matchMentor && !matchCert) return false;
      }

      return true;
    });
  }, [activeTab, searchKeyword, selectedCourseSlug]);

  // Đếm số lượng cho từng Tab
  const tabCounts = useMemo(() => {
    return {
      all: MOCK_ENROLLED_COURSES.length,
      'toeic-foundation': MOCK_ENROLLED_COURSES.filter(
        (c) =>
          c.course.certificate === 'TOEIC' &&
          c.course.slug.includes('foundation'),
      ).length,
      'toeic-speed': MOCK_ENROLLED_COURSES.filter(
        (c) =>
          c.course.certificate === 'TOEIC' &&
          (c.course.slug.includes('cap-toc') || c.course.slug.includes('speed')),
      ).length,
      'ielts-intensive': MOCK_ENROLLED_COURSES.filter(
        (c) => c.course.certificate === 'IELTS',
      ).length,
    };
  }, []);

  // Điều hướng sang trang Phòng Học Player
  const handleContinueStudy = (slug: string, lessonId?: string) => {
    const targetUrl = lessonId
      ? `/my-courses/${slug}/learn?lesson=${lessonId}`
      : `/my-courses/${slug}/learn`;
    navigate(targetUrl);
  };

  const displayName = userName || user?.fullName || 'Nguyễn Thị Tiến';

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ============================================================
       *  1. PHẦN HEADER & THỐNG KÊ (Tham khảo Hình 1 - Study Dashboard)
       * ============================================================ */}

      {/* 1.1 Welcome Banner nhỏ gọn */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/95 via-sky-50/70 to-indigo-50/50 border border-blue-100 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 border border-blue-200 text-[#0052CC] text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                Lộ trình học viên
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Chào mừng trở lại, {displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Bạn đã hoàn thành <strong className="text-[#0052CC] font-bold">78%</strong> mục tiêu học tập tuần này. Hãy tiếp tục duy trì đà bứt phá nhé!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Calendar}
              onClick={() => navigate('/schedule')}
              className="rounded-full bg-white text-xs font-bold text-slate-700 hover:text-[#0052CC] shadow-xs"
            >
              Lịch học tuần này
            </Button>
          </div>
        </div>
      </section>

      {/* 1.2 Dải 3 thẻ thống kê nhỏ (Cards) nằm ngang xếp cạnh nhau */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-label="Thống kê học tập"
      >
        {/* Card 1: Khóa học đang học */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Khóa học đang học
            </p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {MOCK_ENROLLED_COURSES.length}{' '}
              <span className="text-xs font-medium text-slate-500">khóa học</span>
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Đang tham gia học tích cực
            </p>
          </div>
        </div>

        {/* Card 2: Thời lượng đã học */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Thời lượng đã học
            </p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              37.0{' '}
              <span className="text-xs font-medium text-slate-500">giờ</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              Tăng +4.5h tuần này
            </p>
          </div>
        </div>

        {/* Card 3: Bài tập cần hoàn thành */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Bài tập cần nộp
              </p>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800">
                Cảnh báo
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {MOCK_LEARNING_STATS.pendingHomeworks}{' '}
              <span className="text-xs font-medium text-slate-500">bài tập</span>
            </p>
            <p className="text-[11px] text-amber-700 font-medium truncate mt-0.5">
              Hạn nộp: 23:59 Chủ Nhật
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
       *  2. PHẦN BỘ LỌC & PHÂN LOẠI (Tham khảo Hình 2 - Khóa học của tôi)
       * ============================================================ */}
      <section className="space-y-4 pt-1">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* 2.1 Thanh Tabs phân loại cấp độ */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'h-10 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-2 border',
                    isActive
                      ? 'bg-[#EFF6FF] border-[#0052CC] text-[#0052CC] shadow-2xs'
                      : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                      isActive
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2.2 Khu vực bên phải: Search Bar + Dropdown Khóa học */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative flex items-center min-w-[240px] sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm khóa học..."
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 transition-all font-medium"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown "Khóa học hiện tại" */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCourseSlug}
                onChange={(e) => setSelectedCourseSlug(e.target.value)}
                aria-label="Chọn khóa học hiện tại"
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0052CC] cursor-pointer appearance-none truncate"
              >
                <option value="all">Khóa học hiện tại: Tất cả</option>
                {MOCK_ENROLLED_COURSES.map((ec) => (
                  <option key={ec.course.id} value={ec.course.slug}>
                    [{ec.course.certificate}] {ec.course.title}
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       *  3. PHẦN DANH SÁCH KHÓA HỌC (Course Grid 2-3 cột)
       * ============================================================ */}
      {filteredCourses.length === 0 ? (
        <Card className="rounded-3xl text-center py-16 border border-slate-200/90">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Không tìm thấy khóa học phù hợp
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn tab phân loại khác để xem danh sách.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('all');
              setSearchKeyword('');
              setSelectedCourseSlug('all');
            }}
            className="mt-4 rounded-full font-bold text-xs"
          >
            Xóa bộ lọc
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((enrolledCourse, idx) => {
            const { course, progress, mentor, nextLesson } = enrolledCourse;
            // Khóa đang học tích cực nhất (ưu tiên khóa có % cao nhất hoặc index 0)
            const isFeaturedActive = idx === 0 && activeTab === 'all' && selectedCourseSlug === 'all';

            return (
              <div
                key={course.id}
                className={cn(
                  'group rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden',
                  isFeaturedActive
                    ? 'border-[#0052CC] ring-2 ring-[#0052CC]/20 shadow-md'
                    : 'border-slate-200/90 shadow-xs hover:border-[#0052CC]/50 hover:shadow-md hover:-translate-y-0.5',
                )}
              >
                {/* 3.1 Cover Thumbnail 16:9 */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  {/* Badges góc trên */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white/95 backdrop-blur-md text-[#0052CC] text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {course.certificate}
                    </span>
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                      {course.level}
                    </span>
                  </div>

                  {isFeaturedActive && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#0052CC] text-white text-[10px] font-extrabold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Đang học gần đây
                      </span>
                    </div>
                  )}

                  {/* Tiến độ overlay góc dưới ảnh */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-bold drop-shadow-sm">
                    <span className="text-[11px] font-semibold text-slate-100">
                      Tiến độ
                    </span>
                    <span className="font-extrabold text-white tabular-nums">
                      {progress.percent}%
                    </span>
                  </div>
                </div>

                {/* 3.2 Nội dung Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Tên khóa học */}
                    <h2
                      onClick={() => handleContinueStudy(course.slug, nextLesson.id)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug line-clamp-2 cursor-pointer"
                    >
                      {course.title}
                    </h2>

                    {/* Giảng viên */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={mentor.avatarUrl}
                        alt={mentor.fullName}
                        className="w-7 h-7 rounded-full bg-slate-100 object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {mentor.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {mentor.title}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div
                        className="h-2 rounded-full bg-slate-100 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progress.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full bg-[#0052CC] rounded-full transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Đã học {progress.completedLessonIds.length} bài</span>
                        <span>{course.totalLessons} bài</span>
                      </div>
                    </div>

                    {/* Hộp bài tiếp theo */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5">
                        <Play className="w-3 h-3 fill-[#0052CC]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Bài tiếp theo
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                          Bài {String(nextLesson.order).padStart(2, '0')}: {nextLesson.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3.3 Nút CTA "Tiếp tục học" */}
                  <button
                    type="button"
                    onClick={() => handleContinueStudy(course.slug, nextLesson.id)}
                    className={cn(
                      'w-full h-11 px-5 rounded-full text-xs sm:text-sm font-bold',
                      'inline-flex items-center justify-center gap-2',
                      'transition-all duration-200 active:scale-[0.99]',
                      isFeaturedActive
                        ? 'bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-xs hover:shadow-md'
                        : 'bg-slate-900 hover:bg-[#0052CC] text-white shadow-xs hover:shadow-md',
                    )}
                  >
                    <span>Tiếp tục học</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoursesView;
