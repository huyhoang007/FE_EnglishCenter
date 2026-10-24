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
 *
 * Layout mới: Header capsule + hero tối giản + lưới 8/4, bo góc 16px,
 * Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useState } from 'react';
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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
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
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/components/Feedback';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils/format';
import {
  fetchCourseById,
  fetchCourseContents,
  fetchCourseHomework,
  fetchCourseVocabularies,
  filterByType,
  resolveCourseId,
} from '@/shared/api/courseService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  CourseContentDto,
  CourseDto,
  HomeworkContentData,
  LessonContentData,
  RubricCriterion,
  VocabularyContentData,
} from '@/shared/types/catalog.types';

type Tab = 'syllabus' | 'vocabulary' | 'homework';

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
              <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-md uppercase">
                {course.level}
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
                từ vựng
              </span>
            )}
            {homework.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <strong className="font-bold text-white">{homework.length}</strong>{' '}
                bài tập
              </span>
            )}
          </div>

          {course.mentorName && (
            <div className="mt-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <GraduationCap className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">
                Giảng viên phụ trách{' '}
                <span className="text-white font-bold">{course.mentorName}</span>
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
                  <VideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} />
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
                      ] as const
                    ).map((t) => {
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
                      <HomeworkList items={homework} />
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
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => {
                      if (activeVideo) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        const preview = lessons.find((l) => l.isPreview);
                        if (preview) {
                          setActiveVideo(preview);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          setLockedLesson(lessons[0] ?? null);
                        }
                      }
                    }}
                  >
                    Học thử miễn phí
                  </Button>

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
                  to="/mentors"
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
            Bài học đang bị khoá
          </h3>
          <p className="text-sm text-slate-500 mt-2 text-center leading-relaxed">
            <span className="font-semibold text-slate-700">
              {lockedLesson.title}
            </span>{' '}
            chỉ mở cho học viên đã ghi danh khóa học.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              variant="primary"
              fullWidth
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
              onClick={() => {
                setLockedLesson(null);
                buyCourse();
              }}
            >
              {isAuthenticated ? (hasEnrollment ? 'Vào học ngay' : 'Đăng ký khóa học') : 'Đăng nhập để tiếp tục'}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setLockedLesson(null);
                navigate('/register');
              }}
            >
              Tạo tài khoản miễn phí
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* =========================================================
 * VideoPlayer — hỗ trợ cả MP4 lẫn YouTube
 * ========================================================= */
const VideoPlayer: React.FC<{ url: string; title: string }> = ({
  url,
  title,
}) => {
  const yt = getYoutubeEmbed(url);
  if (yt) {
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
    <div className="aspect-video rounded-xl overflow-hidden bg-black">
      <video
        src={url}
        controls
        preload="metadata"
        className="w-full h-full"
        aria-label={title}
      >
        Trình duyệt của bạn không hỗ trợ phát video.
      </video>
    </div>
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
  const seq = (node.contentOrder ?? 0) + 1;

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
        <span className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0">
          {seq.toString().padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900">{node.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {count} bài học
            {node.description ? ` · ${node.description}` : ''}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform',
            open && 'rotate-180 text-slate-700',
          )}
        />
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
            : lesson.isPreview
              ? 'bg-amber-50 text-amber-600'
              : 'bg-[#E0F2FE] text-[#0052CC]',
        )}
      >
        {lesson.isLocked ? (
          <Lock className="w-3.5 h-3.5" />
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
 * VocabularyGrid — flashcard + nút loa phát audioUrl
 * ========================================================= */
const VocabularyGrid: React.FC<{ items: CourseContentDto[] }> = ({ items }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  /** Phát âm thanh từ điển Cambridge qua audioUrl. */
  const pronounce = (item: CourseContentDto) => {
    const data = item.contentData as VocabularyContentData | null;
    const audioUrl = data?.audioUrl;
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => setPlayingId(null));
      setPlayingId(item.contentId);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => {
        const d = item.contentData as VocabularyContentData | null;
        const word = d?.word ?? item.title;
        return (
          <div
            key={item.contentId}
            className={cn(
              'rounded-xl border border-slate-200 bg-white p-4',
              'hover:border-[#0052CC]/40 hover:shadow-md transition-all group',
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h4 className="font-extrabold text-lg text-slate-900 group-hover:text-[#0052CC] transition-colors">
                  {word}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {d?.phonetic && (
                    <span className="text-xs text-slate-500 font-mono">
                      {d.phonetic}
                    </span>
                  )}
                  {d?.partOfSpeech && (
                    <span className="text-[10px] text-slate-400 italic">
                      {d.partOfSpeech}
                    </span>
                  )}
                </div>
              </div>

              {d?.audioUrl && (
                <button
                  type="button"
                  onClick={() => pronounce(item)}
                  className={cn(
                    'p-1.5 rounded-md shrink-0 transition-colors',
                    playingId === item.contentId
                      ? 'text-[#0052CC] bg-blue-100'
                      : 'text-slate-400 hover:text-[#0052CC] hover:bg-blue-50',
                  )}
                  aria-label={`Phát âm thanh ${word}`}
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(d?.meaning || item.description) && (
              <p className="text-sm font-semibold text-slate-700 mb-3">
                <span className="text-slate-400 text-xs font-normal mr-1">
                  Nghĩa:
                </span>
                {d?.meaning ?? item.description}
              </p>
            )}

            {d?.example && (
              <div className="relative pl-3 border-l-2 border-[#0052CC]/30 bg-slate-50 rounded-r-md py-2 pr-2">
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  {d.example}
                </p>
                {d.exampleTranslation && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {d.exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================
 * HomeworkList — đề bài + rubric chấm điểm
 * ========================================================= */
const HomeworkList: React.FC<{ items: CourseContentDto[] }> = ({ items }) => (
  <div className="space-y-4">
    {items.map((item, i) => {
      const d = item.contentData as HomeworkContentData | null;
      const rubric = (d?.rubric ?? []) as RubricCriterion[];
      return (
        <div
          key={item.contentId}
          className="rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3.5 bg-slate-50/60 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0052CC] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {item.title}
                </p>
                {d?.dueDate && (
                  <p className="text-[11px] text-slate-500 mt-1 ml-8">
                    Hạn nộp: {d.dueDate}
                  </p>
                )}
              </div>
              {d?.maxScore != null && (
                <Badge variant="primary" size="sm">
                  {d.maxScore} điểm
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {(d?.instructions || item.description) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Đề bài
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {d?.instructions ?? item.description}
                </p>
              </div>
            )}

            {rubric.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Rubric chấm điểm
                </p>
                <ul className="space-y-2">
                  {rubric.map((r, ri) => (
                    <li
                      key={ri}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800">
                          {r.criterion}
                        </p>
                        {r.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </div>
                      {r.maxScore != null && (
                        <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 rounded px-1.5 py-0.5 shrink-0">
                          {r.maxScore}đ
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {d?.attachmentUrl && (
              <a
                href={d.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                Tải tài liệu đính kèm
              </a>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

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
