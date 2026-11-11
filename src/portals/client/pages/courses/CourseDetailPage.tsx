/**
 * CourseDetailPage — Chi tiết & Phòng học (route `/courses/:id`)
 * -----------------------------------------------------------
 * Dữ liệu THẬT từ Dev 2 backend:
 *   GET /api/v1/courses/{id}                 → thông tin khóa học
 *   GET /api/v1/courses/{id}/contents        → cây bài học (isPreview/isLocked)
 *   GET /api/v1/courses/{id}/vocabularies    → flashcard từ vựng
 *   GET /api/v1/courses/{id}/homework        → bài tập + rubric
 *
 * Quy tắc hiển thị do backend quyết định:
 *   - isPreview = true → mở được video (ai cũng xem được)
 *   - isLocked  = true → server KHÔNG trả videoUrl, bấm vào hiện
 *     modal yêu cầu đăng ký
 *   - BÀI TẬP: luôn khoá với người chưa mua khóa học — học thử KHÔNG nộp
 *     được bài, bấm vào sẽ mở modal yêu cầu mua khóa học.
 *
 * Layout mới: Header capsule + hero tối giản + lưới 8/4, bo góc 16px,
 * Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { createPaymentOrder, fetchEnrollmentStatus, paymentKeys } from '@/shared/api/paymentService';
import { SePayCheckoutModal } from '@/portals/client/features/checkout';
import { useToast } from '@/shared/components/Toast';
import { paymentError } from '@/shared/utils/payment';
import {
  ArrowLeft,
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  GraduationCap,
  Headphones,
  Home,
  Layers3,
  Lock,
  Mail,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Video,
  Volume2,
  X,
  ClipboardList,
  Phone,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/components/Feedback';
import { cn } from '@/shared/utils';
import { formatDateOnly, formatVND } from '@/shared/utils/format';
import { cefrLabel } from '@/shared/constants/cefrLevels';
import {
  fetchCourseById,
  fetchCourseContents,
  fetchCourseHomework,
  filterByType,
  resolveCourseId,
} from '@/shared/api/courseService';
import { TrackedVideoPlayer } from '@/portals/client/features/learning/components/TrackedVideoPlayer';
import {
  fetchCourseVocabularies,
  type CourseVocabularySet,
  type VocabularyWord,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import {
  HomeworkExamPreviewModal,
  HomeworkSubmitModal,
} from '@/portals/client/features/homework';
import { useMyHomeworkSubmissions } from '@/portals/client/features/homework/hooks/useHomework';
import type {
  CourseContentDto,
  CourseDto,
  HomeworkContentData,
  LessonContentData,
} from '@/shared/types/catalog.types';
import type { HomeworkSubmission } from '@/shared/types/homework.types';

type Tab = 'syllabus' | 'vocabulary' | 'homework' | 'exam';

/* =========================================================
 * Page
 * ========================================================= */
const CourseDetailPage: React.FC = () => {
  const identity = useAuthStore(s => s.user?.id ?? 'guest');
  return <CourseDetailContent key={identity} />;
};

const CourseDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuthStore();
  const viewerId = user?.id ?? 'guest';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [checkoutCode, setCheckoutCode] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('syllabus');
  const [lockedLesson, setLockedLesson] = useState<CourseContentDto | null>(
    null,
  );
  const [activeVideo, setActiveVideo] = useState<CourseContentDto | null>(null);

  /**
   * Backend nhận `@PathVariable UUID courseId` nên URL phải là UUID.
   * Nếu người dùng mở bằng slug (VD: /courses/ielts-intensive-mastery)
   * hoặc mã khóa học, ta tra cứu để đổi sang UUID trước khi gọi API —
   * nếu không sẽ nhận HTTP 500 từ Spring.
   */
  const {
    data: resolvedCourseId,
    isLoading: resolving,
    isError: resolveFailed,
    error: resolveErr,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.resolve(id ?? ''),
    queryFn: () => resolveCourseId(id),
    enabled: Boolean(id),
    retry: false,
  });

  const courseId = resolvedCourseId ?? null;

  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErr,
    refetch: refetchCourse,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.course(courseId ?? ''),
    queryFn: () => fetchCourseById(courseId!),
    enabled: Boolean(courseId),
  });

  const { data: contents = [], isLoading: contentsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.catalog.contents(courseId ?? ''), viewerId],
    queryFn: () => fetchCourseContents(courseId!),
    enabled: Boolean(courseId),
  });

  const { data: vocabularies = [], isLoading: vocabLoading } = useQuery({
    queryKey: [...QUERY_KEYS.catalog.vocabularies(courseId ?? ''), viewerId],
    queryFn: () => fetchCourseVocabularies(courseId!),
    enabled: Boolean(courseId),
  });

  const { data: homework = [], isLoading: hwLoading } = useQuery({
    queryKey: [...QUERY_KEYS.catalog.homework(courseId ?? ''), viewerId],
    queryFn: () => fetchCourseHomework(courseId!),
    enabled: Boolean(courseId),
  });

  /**
   * Nội dung "Bài thi cuối kỳ" (V29) — trỏ tới đề `final` trong kho đề thi.
   *
   * Backend trả kèm `examLockReason`:
   *   - `'lessons'` → chưa xem xong hết video của khóa;
   *   - `'mentor'`  → đề có phần tự luận, cần mua gói kèm 1-1 để mentor chấm.
   */
  const examContents = useMemo(
    () => contents.filter((i) => i.contentType === 'exam'),
    [contents],
  );

  /**
   * Tab "Bài tập" chỉ mở khi học viên ĐÃ MUA GÓI MENTOR 1-1.
   * Backend trả `homeworkEnabled` theo đúng người xem (mỗi học viên mua mentor
   * khác nhau) → học viên chưa mua thì tab bị ẨN HOÀN TOÀN.
   */
  const homeworkEnabled = course?.homeworkEnabled ?? false;

  /** Tên mentor hiển thị trên khóa: ưu tiên mentor 1-1 của người xem. */
  const displayMentorName =
    course?.viewerMentorName || course?.mentorName || null;

  // Tab đang mở bị ẩn (VD: vừa rút gói mentor) → lùi về tab Chương trình.
  useEffect(() => {
    if (!homeworkEnabled && tab === 'homework') {
      setTab('syllabus');
    }
  }, [homeworkEnabled, tab]);

  const enrollment = useQuery({
    queryKey: paymentKeys.enrollment(viewerId, courseId ?? ''),
    queryFn: ({ signal }) => fetchEnrollmentStatus(courseId!, signal),
    enabled: Boolean(isAuthenticated && courseId), staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const purchase = useMutation({
    mutationFn: () => createPaymentOrder(courseId!),
    onSuccess: order => {
      setCheckoutCode(order.orderCode);
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
    onError: error => {
      toast.error(paymentError(error));
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
  function buyCourse() {
    if (!isAuthenticated) { navigate('/login', { state: { from: `/courses/${id}` } }); return; }
    if (enrollment.data?.enrolled) { navigate(`/my-courses/${courseId}/learn`); return; }
    if (!['USER', 'STUDENT'].includes(role)) { toast.error('Chỉ tài khoản người học có thể mua khóa học.'); return; }
    if (!purchase.isPending && courseId) purchase.mutate();
  }
  const hasEnrollment = Boolean(enrollment.data?.enrolled);
  const purchaseDisabled = isAuthenticated && (enrollment.isPending || enrollment.isError || (!hasEnrollment && (!['USER', 'STUDENT'].includes(role) || course?.status !== 'active' || !course.price || course.price <= 0)));
  const lessons = filterByType(contents, 'lesson');

  /* ---------- Loading / Error ---------- */
  if (resolving || (courseLoading && !courseError)) {
    return <CourseDetailSkeleton />;
  }

  /**
   * URL hợp lệ nhưng không khớp khóa học nào (slug sai, hoặc course
   * đã bị xoá) — hiện thông báo rõ ràng thay vì lỗi 500.
   */
  if (resolveFailed || (!courseId && !resolving)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          message={
            resolveErr instanceof Error
              ? resolveErr.message
              : `Không tìm thấy khóa học với mã "${id ?? ''}".`
          }
          onRetry={() => navigate('/courses')}
        />
        <div className="text-center mt-5">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/courses')}
          >
            Về sàn khóa học
          </Button>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          message={
            courseErr instanceof Error
              ? courseErr.message
              : 'Không tải được thông tin khóa học'
          }
          onRetry={() => refetchCourse()}
        />
        <div className="text-center mt-5">
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => navigate('/courses')}>
            Về sàn khóa học
          </Button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const totalMinutes = lessons.reduce((sum, l) => {
    const d = l.contentData as LessonContentData | null;
    return sum + (Number(d?.durationMinutes ?? 0) || 0);
  }, 0);
  const hours = Math.floor(totalMinutes / 60);

  return (
    <div style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}>
      {/* =========================================================
       * HERO
       * ========================================================= */}
      <section className="bg-[#0F172A] text-white pt-7 pb-16 border-b border-slate-800 relative overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="inline-flex items-center gap-1 hover:text-white">
              <Home className="w-3.5 h-3.5" />
              Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/courses" className="hover:text-white">
              Khóa học
            </Link>
            {course.certificateName && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-300">{course.certificateName}</span>
              </>
            )}
          </nav>

          {/* Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {course.certificateName && (
              <span className="bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-bold px-3 py-1 rounded-md uppercase">
                {course.certificateName}
              </span>
            )}
            {course.level && (
              <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-md">
                {cefrLabel(course.level)}
              </span>
            )}
            {course.certificatePartName && (
              <span className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-bold px-3 py-1 rounded-md">
                {course.certificatePartName}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-3 mb-3 leading-tight max-w-4xl">
            {course.title}
          </h1>

          {course.description && (
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4 max-w-3xl">
              {course.description}
            </p>
          )}

          {/* Metrics — chỉ hiện số liệu thật từ backend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
            {lessons.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <strong className="font-bold text-white">{lessons.length}</strong>{' '}
                bài học
              </span>
            )}
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <strong className="font-bold text-white">{hours}</strong> giờ
              </span>
            )}
            {vocabularies.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <strong className="font-bold text-white">
                  {vocabularies.length}
                </strong>{' '}
                bộ từ vựng
              </span>
            )}
            {homeworkEnabled && homework.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <strong className="font-bold text-white">{homework.length}</strong>{' '}
                bài tập
              </span>
            )}
          </div>

          {displayMentorName && (
            <div className="mt-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <GraduationCap className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">
                Giảng viên phụ trách{' '}
                <span className="text-white font-bold">{displayMentorName}</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
       * WORKSPACE
       * ========================================================= */}
      <section className="bg-[#F8FAFC] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ========== LEFT — Nội dung học ========== */}
            <main className="lg:col-span-8 min-w-0 space-y-5">

              {/* Video player — chỉ mở khi bài học cho phép */}
              {activeVideo?.videoUrl && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5" />
                        Đang phát
                      </p>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                        {activeVideo.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveVideo(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0"
                      aria-label="Đóng video"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <VideoPlayer
                    url={activeVideo.videoUrl}
                    title={activeVideo.title}
                    contentId={activeVideo.contentId}
                    watchedSeconds={activeVideo.watchedSeconds ?? 0}
                    onCompleted={() => {
                      // Refresh danh sách nội dung để tick "hoàn thành" + mở khoá bài thi cuối kỳ.
                      void queryClient.invalidateQueries({
                        queryKey: QUERY_KEYS.catalog.contents(courseId ?? ''),
                      });
                    }}
                  />
                </div>
              )}

              {/* Tab bar + nội dung */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 overflow-x-auto">
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { key: 'syllabus' as const, label: 'Chương trình' },
                        {
                          key: 'vocabulary' as const,
                          label: `Từ vựng${vocabularies.length ? ` (${vocabularies.length})` : ''}`,
                        },
                        {
                          key: 'homework' as const,
                          label: `Bài tập${homework.length ? ` (${homework.length})` : ''}`,
                        },
                        {
                          key: 'exam' as const,
                          label: `Bài thi cuối kỳ${examContents.length ? ` (${examContents.length})` : ''}`,
                        },
                      ] as const
                    )
                      // Tab "Bài tập" bị ẨN HOÀN TOÀN khi học viên chưa mua gói
                      // mentor 1-1 (bài tập khóa học cần mentor chấm tay).
                      .filter((t) => t.key !== 'homework' || homeworkEnabled)
                      // Tab "Bài thi cuối kỳ" chỉ hiện khi khóa học có nội dung 'exam'.
                      .filter((t) => t.key !== 'exam' || examContents.length > 0)
                      .map((t) => {
                      const active = tab === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTab(t.key)}
                          className={cn(
                            'relative px-4 py-4 text-sm font-bold whitespace-nowrap transition-colors',
                            active
                              ? 'text-[#0052CC]'
                              : 'text-slate-500 hover:text-slate-800',
                          )}
                        >
                          {t.label}
                          {active && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0052CC] rounded-t" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  {tab === 'syllabus' &&
                    (contentsLoading ? (
                      <ContentsSkeleton />
                    ) : lessons.length === 0 ? (
                      <EmptyState
                        title="Chưa có bài học nào"
                        description="Chương trình học của khóa học đang được xây dựng. Bạn quay lại sau nhé."
                      />
                    ) : (
                      <LessonTree
                        lessons={lessons}
                        onPreview={(l) => setActiveVideo(l)}
                        onLocked={setLockedLesson}
                      />
                    ))}

                  {tab === 'vocabulary' &&
                    (vocabLoading ? (
                      <ContentsSkeleton />
                    ) : vocabularies.length === 0 ? (
                      <EmptyState
                        title="Chưa có từ vựng nào"
                        description="Bộ từ vựng của khóa học đang được bổ sung."
                      />
                    ) : (
                      <VocabularyGrid items={vocabularies} />
                    ))}

                  {tab === 'homework' &&
                    (hwLoading ? (
                      <ContentsSkeleton />
                    ) : homework.length === 0 ? (
                      <EmptyState
                        title="Chưa có bài tập về nhà"
                        description="Các bài tập sẽ được giao theo từng tuần học."
                      />
                    ) : (
                      <HomeworkList
                        items={homework}
                        hasEnrollment={hasEnrollment}
                        onLocked={(item) => setLockedLesson(item)}
                      />
                    ))}
                  {tab === 'exam' &&
                    (examContents.length === 0 ? (
                      <EmptyState
                        title="Chưa có bài thi cuối kỳ"
                        description="Khóa học chưa được gắn đề thi cuối kỳ."
                      />
                    ) : (
                      <FinalExamList
                        items={examContents}
                        hasEnrollment={hasEnrollment}
                        onLocked={(item) => setLockedLesson(item)}
                      />
                    ))}
                </div>
              </div>
            </main>

            {/* ========== RIGHT — Sticky pricing + add-on ========== */}
            <aside className="lg:col-span-4 sticky top-24 space-y-4">
              {/* Thẻ giá + CTA */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-md">
                {course.thumbnailUrl && (
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}

                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Học phí trọn khóa
                    </p>
                    <p className="font-extrabold text-3xl text-slate-900 leading-none mt-1">
                      {formatVND(course.price ?? 0)}
                    </p>
                    {course.targetScore != null && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                        <Target className="w-3.5 h-3.5" />
                        Mục tiêu Band {course.targetScore}+
                      </p>
                    )}
                  </div>

                  <Button fullWidth size="lg" isLoading={purchase.isPending} disabled={purchaseDisabled}
                    onClick={buyCourse} className="bg-[#0052CC] hover:bg-[#0040A8]">
                    {hasEnrollment ? 'Vào học ngay' : !isAuthenticated ? 'Đăng nhập để mua khóa học' : course.status !== 'active' || !course.price || course.price <= 0 ? 'Khóa học chưa mở bán' : 'Mua khóa học'}
                  </Button>
                  {enrollment.isError && isAuthenticated && <div role="alert" className="text-xs text-rose-700">{paymentError(enrollment.error)} <button type="button" onClick={() => void enrollment.refetch()} className="underline font-bold">Thử lại</button></div>}

                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                    Mở khóa học sau khi thanh toán được xác nhận
                  </p>
                </div>
              </div>

              {/* ========== ADD-ON MENTOR ========== */}
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white shadow-lg">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-[#7DD3FC]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7DD3FC]">
                  Dịch vụ kèm ngoài
                </p>
                <h3 className="text-lg font-extrabold mt-1.5 leading-snug">
                  Cần kèm 1-1 &amp; chấm bài Writing?
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Đặt lịch với Mentor để được chấm bài chi tiết theo rubric
                  Cambridge và sửa lỗi trực tiếp.
                </p>
                <Link
                  to={CLIENT_ROUTES.schedule}
                  className={cn(
                    'mt-5 inline-flex items-center justify-center gap-2 w-full',
                    'h-11 rounded-xl bg-white text-[#0F172A] font-bold text-sm',
                    'hover:bg-slate-100 transition-colors',
                  )}
                >
                  Đặt lịch với Mentor
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Help */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 shrink-0 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-[#0052CC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900">
                      Cần hỗ trợ?
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Email{' '}
                      <a
                        href="mailto:support@prepmaster.com"
                        className="text-[#0052CC] font-semibold hover:underline"
                      >
                        support@prepmaster.com
                      </a>{' '}
                      hoặc gọi{' '}
                      <a
                        href="tel:19006868"
                        className="text-[#0052CC] font-semibold hover:underline"
                      >
                        1900 6868
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ========== MODAL: bài học bị khóa ========== */}
      {checkoutCode && <SePayCheckoutModal key={`${viewerId}:${checkoutCode}`} orderCode={checkoutCode} onClose={() => setCheckoutCode(null)} />}
      {lockedLesson && (
        <Modal onClose={() => setLockedLesson(null)}>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 text-center">
            {lockedLesson.contentType === 'homework'
              ? 'Bài tập đang bị khoá'
              : lockedLesson.contentType === 'exam'
                ? 'Bài thi cuối kỳ đang bị khoá'
                : 'Bài học đang bị khoá'}
          </h3>
          <p className="text-sm text-slate-500 mt-2 text-center leading-relaxed">
            <span className="font-semibold text-slate-700">
              {lockedLesson.title}
            </span>{' '}
            {lockedLesson.contentType === 'homework'
              ? 'chỉ mở cho học viên đã mua khóa học. Bạn chưa thể nộp bài khi đang học thử miễn phí.'
              : lockedLesson.contentType === 'exam'
                ? lockedLesson.examLockReason === 'mentor'
                  ? 'có phần tự luận (Writing/Speaking) cần mentor chấm tay. Bạn cần mua gói kèm 1-1 để mở phần này.'
                  : `chỉ mở sau khi bạn xem xong tất cả video của khóa (đã xem ${lockedLesson.completedLessonCount ?? 0}/${lockedLesson.totalLessonCount ?? 0}).`
                : 'chỉ mở cho học viên đã ghi danh khóa học.'}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            {lockedLesson.contentType === 'exam' &&
            lockedLesson.examLockReason === 'mentor' ? (
              <Button
                variant="primary"
                fullWidth
                className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                onClick={() => {
                  setLockedLesson(null);
                  navigate(CLIENT_ROUTES.schedule);
                }}
              >
                Mở khoá mentor 1-1
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                onClick={() => {
                  setLockedLesson(null);
                  buyCourse();
                }}
              >
                {isAuthenticated
                  ? hasEnrollment
                    ? 'Vào học ngay'
                    : 'Đăng ký khóa học'
                  : 'Đăng nhập để tiếp tục'}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

/* =========================================================
 * VideoPlayer — hỗ trợ cả MP4 lẫn YouTube
 * ========================================================= */
const VideoPlayer: React.FC<{
  url: string;
  title: string;
  contentId: string;
  watchedSeconds?: number;
  onCompleted?: () => void;
}> = ({ url, title, contentId, watchedSeconds = 0, onCompleted }) => {
  const yt = getYoutubeEmbed(url);
  if (yt) {
    // YouTube không chặn tua được → dùng iframe như cũ (chỉ MP4 mới chống tua).
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={yt}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <TrackedVideoPlayer
      url={url}
      title={title}
      contentId={contentId}
      initialWatchedSeconds={watchedSeconds}
      onCompleted={onCompleted}
    />
  );
};

/** Rút link nhúng YouTube từ nhiều dạng URL phổ biến. */
function getYoutubeEmbed(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{6,})/,
    /(?:youtu\.be\/)([\w-]{6,})/,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

/* =========================================================
 * LessonTree — nhóm bài học theo parentContentId
 * ========================================================= */
const LessonTree: React.FC<{
  lessons: CourseContentDto[];
  onPreview: (l: CourseContentDto) => void;
  onLocked: (l: CourseContentDto) => void;
}> = ({ lessons, onPreview, onLocked }) => {
  const roots = lessons.filter((l) => !l.parentContentId);
  const orphans = lessons.filter((l) => l.parentContentId);
  // Bài học có cha nhưng cha không thuộc `lesson` → hiển thị như gốc
  const rootIds = new Set(roots.map((r) => r.contentId));
  const extra = orphans.filter((o) => !rootIds.has(o.parentContentId!));
  const topLevel = [...roots, ...extra];

  if (topLevel.length === 0) {
    return (
      <EmptyState
        title="Chưa có bài học nào"
        description="Chương trình học của khóa học đang được xây dựng."
      />
    );
  }

  return (
    <div className="space-y-3">
      {topLevel.map((node, idx) => (
        <LessonGroup
          key={node.contentId}
          node={node}
          all={lessons}
          defaultOpen={idx === 0}
          onPreview={onPreview}
          onLocked={onLocked}
        />
      ))}
    </div>
  );
};

const LessonGroup: React.FC<{
  node: CourseContentDto;
  all: CourseContentDto[];
  defaultOpen: boolean;
  onPreview: (l: CourseContentDto) => void;
  onLocked: (l: CourseContentDto) => void;
}> = ({ node, all, defaultOpen, onPreview, onLocked }) => {
  const [open, setOpen] = useState(defaultOpen);
  const children = all
    .filter((l) => l.parentContentId === node.contentId)
    .sort((a, b) => a.contentOrder - b.contentOrder);

  const count = children.length || 1;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 overflow-hidden transition-colors',
        open && 'border-slate-300 bg-slate-50/30',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50/40 hover:bg-slate-100/80 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900">{node.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {count} bài học
            {node.description ? ` · ${node.description}` : ''}
          </p>
        </div>
      </button>

      {open && children.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {children.map((l) => (
            <LessonRow key={l.contentId} lesson={l} onPreview={onPreview} onLocked={onLocked} />
          ))}
        </ul>
      )}
    </div>
  );
};

const LessonRow: React.FC<{
  lesson: CourseContentDto;
  onPreview: (l: CourseContentDto) => void;
  onLocked: (l: CourseContentDto) => void;
}> = ({ lesson, onPreview, onLocked }) => {
  const data = lesson.contentData as LessonContentData | null;
  const duration = Number(data?.durationMinutes ?? 0) || 0;

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          lesson.isLocked
            ? 'bg-slate-100 text-slate-400'
            : lesson.completed
              ? 'bg-emerald-50 text-emerald-600'
              : lesson.isPreview
                ? 'bg-amber-50 text-amber-600'
                : 'bg-[#E0F2FE] text-[#0052CC]',
        )}
      >
        {lesson.isLocked ? (
          <Lock className="w-3.5 h-3.5" />
        ) : lesson.completed ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <PlayCircle className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-sm truncate',
            lesson.isLocked ? 'text-slate-500' : 'text-slate-800',
          )}
        >
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {lesson.completed && !lesson.isLocked && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            HOÀN THÀNH
          </span>
        )}
        {lesson.isPreview && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
            HỌC THỬ
          </span>
        )}
        {lesson.isLocked && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
            KHOÁ
          </span>
        )}
        {duration > 0 && (
          <span className="text-xs text-slate-500 font-mono">{duration} ph</span>
        )}
        <button
          type="button"
          onClick={() =>
            lesson.isLocked ? onLocked(lesson) : onPreview(lesson)
          }
          className={cn(
            'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold transition-colors',
            lesson.isLocked
              ? 'text-slate-500 bg-slate-100 hover:bg-slate-200'
              : 'text-[#0052CC] bg-blue-50 hover:bg-blue-100',
          )}
        >
          {lesson.isLocked ? (
            <>
              <Lock className="w-3 h-3" />
              Mở khoá
            </>
          ) : (
            <>
              <PlayCircle className="w-3 h-3" />
              Học
            </>
          )}
        </button>
      </div>
    </li>
  );
};

/* =========================================================
 * FinalExamList — Bài thi cuối kỳ (V29)
 * -----------------------------------------------------------
 * Nội dung `contentType = 'exam'` → trỏ tới đề `final` trong kho đề thi.
 *
 * Trạng thái (do backend quyết định qua `examLockReason`):
 *   - `null`          → đã mở, học viên làm được;
 *   - `'lessons'`     → chưa xem xong hết video của khóa;
 *   - `'mentor'`      → đề có phần tự luận, cần mua gói kèm 1-1 để mentor chấm.
 * ========================================================= */
const FinalExamList: React.FC<{
  items: CourseContentDto[];
  hasEnrollment: boolean;
  onLocked: (l: CourseContentDto) => void;
}> = ({ items, hasEnrollment, onLocked }) => {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const locked = item.isLocked;
        const lockReason = item.examLockReason;
        const done = item.completedLessonCount ?? 0;
        const total = item.totalLessonCount ?? 0;

        return (
          <li
            key={item.contentId}
            className={cn(
              'rounded-2xl border bg-white p-4 transition-colors',
              locked ? 'border-slate-200/80' : 'border-[#0052CC]/30 bg-blue-50/30',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  locked
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-violet-50 text-violet-600',
                )}
              >
                {locked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Award className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">
                  {item.title}
                </p>
                {item.examTitle && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Đề: {item.examTitle}
                  </p>
                )}
                {item.description && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* ---------- Lý do khoá ---------- */}
                {locked && lockReason === 'lessons' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2 inline-flex items-center gap-1.5 font-semibold">
                    <Lock className="w-3 h-3 shrink-0" />
                    Xem xong {done}/{total} video của khóa để mở bài thi này.
                  </p>
                )}
                {locked && lockReason === 'mentor' && (
                  <p className="text-[11px] text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5 mt-2 inline-flex items-center gap-1.5 font-semibold">
                    <Lock className="w-3 h-3 shrink-0" />
                    Đề có phần tự luận (Writing/Speaking) — cần mở khoá mentor 1-1 để
                    mentor chấm tay.
                  </p>
                )}
                {locked && !lockReason && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-2 inline-flex items-center gap-1.5 font-semibold">
                    <Lock className="w-3 h-3 shrink-0" />
                    Bài thi chỉ mở cho học viên đã ghi danh khóa học.
                  </p>
                )}
                {item.requiresMentor && !locked && (
                  <p className="text-[11px] text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5 mt-2 inline-flex items-center gap-1.5 font-semibold">
                    <Users className="w-3 h-3 shrink-0" />
                    {item.hasMentorPlan === false
                      ? 'Phần tự luận sẽ được lưu nháp chờ nâng cấp gói Mentor 1-1 — bạn không cần làm lại bài.'
                      : 'Phần tự luận sẽ được mentor 1-1 của bạn chấm tay.'}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {locked ? (
                  <button
                    type="button"
                    onClick={() => onLocked(item)}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    Mở khoá
                  </button>
                ) : (
                  <Link
                    to={CLIENT_ROUTES.exam(item.examId ?? '')}
                    className={cn(
                      'inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[11px] font-bold transition-colors',
                      'text-white bg-[#0052CC] hover:bg-[#0040A8]',
                    )}
                  >
                    <PlayCircle className="w-3 h-3" />
                    Làm bài
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* =========================================================
 * VocabularyGrid — flashcard + nút loa phát audioUrl
 *
 * Dữ liệu đến từ `GET /api/v1/courses/{courseId}/vocabularies` → mảng
 * `CourseVocabularySet` (mỗi phần tử là 1 BỘ từ vựng đã gán cho khóa học,
 * chứa danh sách từ bên trong).
 * ========================================================= */
const VocabularyGrid: React.FC<{ items: CourseVocabularySet[] }> = ({
  items,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  /** Phát âm thanh từ điển Cambridge qua audioUrl. */
  const pronounce = (word: VocabularyWord) => {
    const audioUrl = word.audioUrl;
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => setPlayingId(null));
      setPlayingId(word.wordId || word.word);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
    } catch {
      setPlayingId(null);
    }
  };

  /** Tổng số từ của tất cả bộ đã gán. */
  const totalWords = items.reduce(
    (sum, set) => sum + (set.locked ? 0 : set.words.length),
    0,
  );

  return (
    <div className="space-y-8">
      {items.map((set) => (
        <section key={set.setId}>
          {/* ---- Header của bộ ---- */}
          <div className="mb-3.5">
            <h3 className="text-base font-extrabold text-slate-900">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                {set.description}
              </p>
            )}
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {set.locked
                ? 'Đăng ký khóa học để xem từ vựng'
                : `${set.words.length} từ`}
            </p>
            {set.isPreview && !set.locked && (
              <span className="inline-flex items-center h-5 px-2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 mt-1.5">
                HỌC THỬ
              </span>
            )}
          </div>

          {set.locked ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center">
              <p className="text-xs font-bold text-slate-600">
                Nội dung đang bị khoá
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Đăng ký khóa học để mở bộ từ vựng này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {set.words.map((word) => (
                <div
                  key={word.wordId || word.word}
                  className={cn(
                    'rounded-xl border border-slate-200 bg-white p-4',
                    'hover:border-[#0052CC]/40 hover:shadow-md transition-all group',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-lg text-slate-900 group-hover:text-[#0052CC] transition-colors">
                        {word.word}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {word.phonetic && (
                          <span className="text-xs text-slate-500 font-mono">
                            {word.phonetic}
                          </span>
                        )}
                        {word.partOfSpeech && (
                          <span className="text-[10px] text-slate-400 italic">
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>
                    </div>

                    {word.audioUrl && (
                      <button
                        type="button"
                        onClick={() => pronounce(word)}
                        className={cn(
                          'p-1.5 rounded-md shrink-0 transition-colors',
                          playingId === (word.wordId || word.word)
                            ? 'text-[#0052CC] bg-blue-100'
                            : 'text-slate-400 hover:text-[#0052CC] hover:bg-blue-50',
                        )}
                        aria-label={`Phát âm thanh ${word.word}`}
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {word.meaning && (
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      <span className="text-slate-400 text-xs font-normal mr-1">
                        Nghĩa:
                      </span>
                      {word.meaning}
                    </p>
                  )}

                  {word.example && (
                    <div className="relative pl-3 border-l-2 border-[#0052CC]/30 bg-slate-50 rounded-r-md py-2 pr-2">
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        {word.example}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Tổng kết */}
      {totalWords > 0 && (
        <p className="text-[11px] font-semibold text-slate-400 text-right">
          Tổng {totalWords} từ vựng
        </p>
      )}
    </div>
  );
};

/* =========================================================
 * HomeworkList — danh sách bài tập (dòng gọn) + mở modal chi tiết
 * ========================================================= */
const HomeworkList: React.FC<{
  items: CourseContentDto[];
  /** Học viên đã ghi danh khóa học hay chưa. */
  hasEnrollment: boolean;
  /** Mở modal yêu cầu mua khóa học (khi bài tập bị khoá). */
  onLocked: (item: CourseContentDto) => void;
}> = ({ items, hasEnrollment, onLocked }) => {
  const [activeHomework, setActiveHomework] = useState<CourseContentDto | null>(null);
  /** Bài trắc nghiệm đang mở modal XEM ĐỀ (trước khi bấm "Bắt đầu làm bài"). */
  const [previewExam, setPreviewExam] = useState<CourseContentDto | null>(null);

  // Bài nộp của học viên → hiển thị trạng thái (chờ chấm / đã đạt / chưa đạt).
  const { data: mySubmissions } = useMyHomeworkSubmissions();
  const statusByHomework = useMemo(() => {
    const map = new Map<string, HomeworkSubmission>();
    for (const s of mySubmissions ?? []) {
      if (!map.has(s.homeworkContentId)) map.set(s.homeworkContentId, s);
    }
    return map;
  }, [mySubmissions]);

  return (
  <div className="space-y-3">
    {items.map((item, i) => {
      const d = item.contentData as HomeworkContentData | null;
      const mySubmission = statusByHomework.get(item.contentId);
      const overdue = isPastDue(d?.dueDate);
      // Bài tập CHƯA mua khóa học → khoá hoàn toàn: không mở form nộp bài.
      const locked = !hasEnrollment || item.isLocked;

      const openItem = () => {
        if (locked) {
          onLocked(item);
          return;
        }
        setActiveHomework(item);
      };

      return (
        <div
          key={item.contentId}
          role="button"
          tabIndex={0}
          onClick={openItem}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openItem();
            }
          }}
          className={cn(
            'w-full text-left rounded-xl border bg-white transition-all px-4 py-3.5 group cursor-pointer',
            locked
              ? 'border-slate-200 bg-slate-50/70 hover:border-amber-300'
              : 'border-slate-200 hover:border-[#0052CC]/40 hover:shadow-sm',
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'w-7 h-7 rounded-lg text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5',
                locked ? 'bg-slate-200 text-slate-500' : 'bg-[#E0F2FE] text-[#0052CC]',
              )}
            >
              {locked ? <Lock className="w-3.5 h-3.5" /> : i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 truncate group-hover:text-[#0052CC] transition-colors">
                {item.title}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {locked ? (
                  <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-300">
                    <Lock className="w-3 h-3" />
                    KHOÁ
                  </span>
                ) : (
                  item.isPreview && (
                    <span className="inline-flex items-center h-5 px-2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      HỌC THỬ
                    </span>
                  )
                )}
                {d?.dueDate && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-semibold',
                      overdue ? 'text-rose-600' : 'text-slate-500',
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    Hạn nộp: {formatDateOnly(d.dueDate)}
                    {overdue && ' (đã quá hạn)'}
                  </span>
                )}
                {d?.maxScore != null && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Điểm tối đa: {d.maxScore}
                  </span>
                )}
                {d?.submissionType && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {d.submissionType === 'file'
                      ? `Nộp file ${
                          Array.isArray(d.allowedFileTypes) &&
                          d.allowedFileTypes.length > 0
                            ? d.allowedFileTypes
                                .map((t) => String(t).toUpperCase())
                                .join(', ')
                            : 'PDF'
                        }`
                      : d.submissionType === 'multiple_choice'
                        ? 'Trắc nghiệm'
                        : d.submissionType === 'audio'
                          ? 'Ghi âm'
                          : 'Nhập văn bản'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {locked ? (
                <Badge variant="neutral" size="sm">
                  Chưa mua khóa học
                </Badge>
              ) : mySubmission ? (
                <Badge
                  variant={
                    !mySubmission.graded
                      ? 'warning'
                      : mySubmission.passed
                        ? 'success'
                        : 'danger'
                  }
                  size="sm"
                >
                  {!mySubmission.graded
                    ? 'Chờ chấm'
                    : mySubmission.passed
                      ? `Đã đạt${mySubmission.score != null ? ` · ${mySubmission.score}` : ''}`
                      : `Chưa đạt${mySubmission.score != null ? ` · ${mySubmission.score}` : ''}`}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Chưa nộp
                </Badge>
              )}
              {/* Bài trắc nghiệm → có nút "Xem đề" để xem trước câu hỏi. */}
              {!locked && d?.submissionType === 'multiple_choice' && item.examId && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={FileText}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewExam(item);
                  }}
                >
                  Xem đề
                </Button>
              )}
              <Button
                size="sm"
                variant={locked ? 'outline' : mySubmission ? 'outline' : 'primary'}
                leftIcon={locked ? Lock : ClipboardList}
                onClick={(e) => {
                  e.stopPropagation();
                  openItem();
                }}
              >
                {locked
                  ? 'Mở khoá'
                  : mySubmission
                    ? 'Xem bài'
                    : d?.submissionType === 'multiple_choice'
                      ? 'Làm bài'
                      : 'Nộp bài'}
              </Button>
            </div>
          </div>
        </div>
      );
    })}

    {activeHomework && (
      <HomeworkSubmitModal
        open={Boolean(activeHomework)}
        onClose={() => setActiveHomework(null)}
        homework={activeHomework}
        readOnly={activeHomework.isLocked}
      />
    )}

    {previewExam && (
      <HomeworkExamPreviewModal
        open={Boolean(previewExam)}
        onClose={() => setPreviewExam(null)}
        examId={previewExam.examId}
        examTitle={previewExam.examTitle}
      />
    )}
  </div>
  );
};

/** Hạn nộp đã qua (ngày `yyyy-MM-dd` hết hạn cuối ngày). */
function isPastDue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const end = new Date(`${dueDate}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return end.getTime() <= Date.now();
}

/* =========================================================
 * Modal + Skeleton helpers
 * ========================================================= */
const Modal: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);

const ContentsSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

const CourseDetailSkeleton: React.FC = () => (
  <div
    className="min-h-[70vh]"
    style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}
  >
    <div className="bg-[#0F172A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-3 w-40 bg-slate-700" />
        <Skeleton className="h-9 w-2/3 bg-slate-700" />
        <Skeleton className="h-4 w-full max-w-2xl bg-slate-700" />
        <Skeleton className="h-4 w-80 bg-slate-700" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <div className="lg:col-span-4 space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default CourseDetailPage;
