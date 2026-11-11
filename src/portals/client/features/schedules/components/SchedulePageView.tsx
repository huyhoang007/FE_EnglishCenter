/**
 * SchedulePageView — Mentor 1-1 của học viên (Dev 5)
 * -----------------------------------------------------------
 * Không còn tự chọn slot công khai của mentor. Luồng mới:
 *   test level → để lại SĐT nhờ mentor tư vấn → mentor gọi / email tư vấn, chốt lộ trình
 *   → mentor tạo gói kèm 1-1 (VD 12 buổi, các khung giờ cụ thể) → học viên thanh toán 1 lần cả gói (SePay)
 *   → các buổi được xác nhận, hiện ở "Lịch của tôi".
 * Phần 1: Buổi học sắp diễn ra (booking gần nhất + nút vào phòng học)
 * Phần 2: Gói kèm 1-1 của tôi (thanh toán / từ chối gói chờ thanh toán, tiến độ gói đang học)
 * Phần 3: Tư vấn lộ trình (để lại SĐT)
 * Phần 4: Lịch của tôi (sắp tới / đã qua) — hủy buổi đã thanh toán trước hạn
 * Learner (USER) cũng vào được trang này để thanh toán gói mentor tạo cho mình (sau khi trả tiền thành STUDENT).
 * Thời gian BE trả dạng UTC, hiển thị theo giờ máy người dùng.
 */

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  X,
  ShieldCheck,
  Copy,
  ArrowRight,
  RefreshCw,
  XCircle,
  AlertTriangle,
  CreditCard,
  Route,
  CalendarClock,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMentor } from '@/shared/api/domainApi';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useCanCallNotificationApi } from '@/shared/notifications/useNotifications';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  PLAN_STATUS_LABEL,
  PLAN_STATUS_VARIANT,
  durationMinutes,
  formatDayLabel,
  formatTime,
  isActiveBooking,
  isWithinSlots,
  RESCHEDULE_DEADLINE_HOURS,
  scheduleDateBounds,
  toDateInput,
  toUtcIso,
  useRequestReschedule,
  validateSessionTime,
  useCancelBooking,
  useCancelSessionPayment,
  useCheckoutPlan,
  useMyConsultation,
  useMyPlans,
  useMySchedule,
  useRejectPlan,
  useSessionPayment,
} from '@/shared/schedule';
import type { Booking, MentoringPlan, ScheduleListType, SessionPaymentStatus } from '@/shared/types';
import type { MentorDto } from '@/shared/api/apiTypes';
import { PaymentStatusBadge } from '@/portals/client/features/checkout/components/PaymentStatusBadge';
import { ConsultationRequestCard } from './ConsultationRequestCard';

/* ============================================================
 *  Component chính
 * ============================================================ */
export const SchedulePageView: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  const canCallApi = useCanCallNotificationApi();
  const isStudent = canCallApi && role === 'STUDENT';
  const isLearner = canCallApi && (role === 'STUDENT' || role === 'USER');

  /** Mã đơn SePay đang mở hộp thoại thanh toán (null = đóng) */
  const [paymentOrderCode, setPaymentOrderCode] = useState<string | null>(null);

  // Buổi học sắp diễn ra = booking gần nhất của học viên
  const upcomingQuery = useMySchedule('upcoming', 0, isStudent);
  const upcoming = upcomingQuery.data?.data?.find((b) => b.status === 'confirmed');
  const { data: upcomingMentor } = useQuery({
    queryKey: QUERY_KEYS.mentor.detail(upcoming?.mentorId ?? ''),
    queryFn: () => getMentor(upcoming?.mentorId as string),
    enabled: !!upcoming,
  });

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          Mentor 1-1
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lộ trình kèm 1-1 với mentor
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Mentor xem kết quả test level, tư vấn lộ trình cho bạn qua điện thoại / email, rồi xếp lịch các buổi theo lộ
          trình đã chốt. Bạn thanh toán 1 lần cả gói để giữ lịch.
        </p>
      </header>

      {/* ============== SECTION 1: BUỔI HỌC SẮP DIỄN RA ============== */}
      {isStudent && (
        <section aria-label="Buổi học sắp diễn ra">
          <SectionHeader title="Buổi học sắp diễn ra" subtitle="Buổi kèm gần nhất với mentor của bạn" />
          {!upcoming ? (
            <Card>
              <p className="text-sm text-slate-500 text-center py-6">
                {upcomingQuery.isLoading
                  ? 'Đang tải lịch học…'
                  : upcomingQuery.isError
                    ? getErrorMessage(upcomingQuery.error)
                    : 'Bạn chưa có buổi học nào sắp diễn ra.'}
              </p>
            </Card>
          ) : (
            <Card hoverable className="relative overflow-hidden p-0">
              <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-48 shrink-0">
                  <Badge variant="primary" size="md" icon={Clock}>
                    {formatDayLabel(upcoming.startTime)}
                  </Badge>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                    {formatTime(upcoming.startTime)}
                    <span className="text-slate-400 font-bold text-base mx-1">–</span>
                    {formatTime(upcoming.endTime)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {durationMinutes(upcoming.startTime, upcoming.endTime)} phút · Phòng học trực tuyến
                  </p>
                  {upcoming.topic && <p className="text-sm text-slate-700 font-semibold">{upcoming.topic}</p>}
                </div>
                <div className="hidden md:block w-px self-stretch bg-slate-200" />
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <img
                    src={upcomingMentor ? toMentorCard(upcomingMentor).avatarUrl : avatarOf(upcoming.mentorName)}
                    alt={upcoming.mentorName}
                    className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-md"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Mentor</p>
                    <p className="font-extrabold text-slate-900 truncate">{upcoming.mentorName}</p>
                    {upcomingMentor && (
                      <p className="text-xs text-ai font-semibold truncate">{toMentorCard(upcomingMentor).title}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-stretch md:items-end gap-2">
                  <Button
                    variant="success"
                    size="lg"
                    leftIcon={Video}
                    rightIcon={ArrowRight}
                    disabled={!upcoming.meetingUrl}
                    onClick={() => upcoming.meetingUrl && window.open(upcoming.meetingUrl, '_blank')}
                  >
                    Vào phòng học
                  </Button>
                  <p className="text-[11px] text-slate-500 text-center md:text-right">
                    {upcoming.meetingUrl ? 'Vui lòng vào phòng trước giờ hẹn 5 phút' : 'Mentor chưa cập nhật link phòng học'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* ============== SECTION 2: GÓI KÈM 1-1 ============== */}
      {isLearner ? (
        <MyPlansSection onPay={setPaymentOrderCode} />
      ) : (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">Đăng nhập bằng tài khoản học viên để xem lộ trình 1-1.</p>
        </Card>
      )}

      {/* ============== SECTION 3: TƯ VẤN LỘ TRÌNH ============== */}
      {isLearner && <ConsultationRequestCard />}

      {/* ============== SECTION 4: LỊCH CỦA TÔI ============== */}
      {isStudent && <MyBookingsSection />}

      {/* ============== THANH TOÁN SEPAY (QR thật, tự xác nhận qua webhook) ============== */}
      {paymentOrderCode && (
        <SessionPaymentModal orderCode={paymentOrderCode} onClose={() => setPaymentOrderCode(null)} />
      )}
    </div>
  );
};

/* ============================================================
 *  MyPlansSection — Gói kèm 1-1 mentor tạo cho học viên
 * ============================================================ */
const MyPlansSection: React.FC<{ onPay: (orderCode: string) => void }> = ({ onPay }) => {
  const toast = useToast();
  const plansQuery = useMyPlans(true);
  // Lịch rảnh đã gửi khi xin tư vấn → cảnh báo buổi nằm ngoài lịch rảnh trước khi thanh toán
  const consultationQuery = useMyConsultation(true);
  const mySlots = consultationQuery.data?.availableSlots ?? [];
  const checkoutMutation = useCheckoutPlan();
  const [rejecting, setRejecting] = useState<MentoringPlan | null>(null);
  const plans = plansQuery.data ?? [];

  const handlePay = (plan: MentoringPlan) => {
    if (plan.paymentOrderCode) {
      onPay(plan.paymentOrderCode);
      return;
    }
    checkoutMutation.mutate(plan.planId, {
      onSuccess: (order) => onPay(order.orderCode),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <section aria-label="Gói kèm 1-1 của tôi">
      <SectionHeader
        title="Gói kèm 1-1 của tôi"
        subtitle="Mentor tạo sau khi tư vấn chốt lộ trình. Xem kỹ ngày giờ và nội dung từng buổi, thanh toán cả gói để giữ lịch."
      />
      {plansQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">Đang tải…</p>
        </Card>
      ) : plansQuery.isError ? (
        <Card>
          <p className="text-sm text-status-danger text-center py-6">{getErrorMessage(plansQuery.error)}</p>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">
            Bạn chưa có gói kèm 1-1 nào. Để lại số điện thoại ở mục bên dưới để mentor tư vấn lộ trình.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const isPending = plan.status === 'pending_payment';
            const outsideCount = isPending
              ? plan.sessions.filter((s) => !isWithinSlots(s.startTime, s.endTime, mySlots)).length
              : 0;
            return (
            <Card key={plan.planId} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900">{plan.title}</h3>
                    <Badge variant={PLAN_STATUS_VARIANT[plan.status]} size="sm">
                      {PLAN_STATUS_LABEL[plan.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                    Mentor {plan.mentorName}
                    {plan.learningPathName && (
                      <>
                        <Route className="w-3 h-3 ml-1" /> {plan.learningPathName}
                      </>
                    )}
                    <span>
                      · {plan.totalSessions} buổi · <b>{formatVND(plan.totalPrice)}</b>
                    </span>
                  </p>
                  {plan.note && <p className="text-xs text-slate-500 mt-1">Ghi chú của mentor: {plan.note}</p>}
                  {plan.cancelReason && <p className="text-xs text-slate-500 mt-1">Lý do hủy: {plan.cancelReason}</p>}
                </div>
                {plan.status === 'pending_payment' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={CreditCard}
                      isLoading={checkoutMutation.isPending && checkoutMutation.variables === plan.planId}
                      onClick={() => handlePay(plan)}
                    >
                      Thanh toán cả gói
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setRejecting(plan)}>
                      Từ chối
                    </Button>
                  </div>
                )}
                {plan.status === 'active' && (
                  <p className="text-sm font-bold text-slate-700 shrink-0">
                    Đã học {plan.completedSessions}/{plan.totalSessions} buổi
                  </p>
                )}
              </div>
              {outsideCount > 0 && (
                <div className="rounded-input border border-amber-200 bg-amber-50 p-3 flex gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <b>{outsideCount} buổi</b> nằm ngoài lịch rảnh bạn đã gửi. Nếu chưa thỏa thuận giờ này với mentor, hãy bấm{' '}
                    <b>Từ chối</b> và ghi giờ mong muốn để mentor xếp lại.
                  </p>
                </div>
              )}
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {plan.sessions.map((s, i) => {
                  const outside = isPending && !isWithinSlots(s.startTime, s.endTime, mySlots);
                  return (
                    <li
                      key={s.bookingId}
                      className={cn(
                        'rounded-input border px-3 py-2 text-xs space-y-1',
                        outside ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200/70 bg-slate-50/50',
                      )}
                    >
                      <div>
                        <span className="font-bold text-slate-400 mr-1.5">#{i + 1}</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {formatDayLabel(s.startTime)} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </span>
                        {!isPending && (
                          <Badge variant={BOOKING_STATUS_VARIANT[s.status]} size="sm" className="ml-1.5">
                            {BOOKING_STATUS_LABEL[s.status]}
                          </Badge>
                        )}
                      </div>
                      <p className={cn('text-slate-600', !s.topic && 'italic text-slate-400')}>
                        {s.topic ?? 'Mentor chưa ghi nội dung buổi này'}
                      </p>
                      {outside && (
                        <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Ngoài lịch rảnh bạn đã gửi
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
            );
          })}
        </div>
      )}
      {rejecting && <RejectPlanModal plan={rejecting} onClose={() => setRejecting(null)} />}
    </section>
  );
};

/** Học viên từ chối gói chưa thanh toán (lý do không bắt buộc) */
const RejectPlanModal: React.FC<{ plan: MentoringPlan; onClose: () => void }> = ({ plan, onClose }) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const rejectMutation = useRejectPlan();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-card shadow-elevation border border-slate-200 p-5 space-y-3">
        <p className="text-sm font-extrabold text-slate-900">Từ chối gói "{plan.title}"?</p>
        <p className="text-xs text-slate-500">Mentor sẽ nhận thông báo và có thể tư vấn, xếp lại lịch khác cho bạn.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Lý do (VD: giờ học chưa phù hợp, muốn học tối T7)"
          className="w-full rounded-input border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary"
        />
        {rejectMutation.isError && (
          <p className="text-xs text-status-danger font-semibold">{getErrorMessage(rejectMutation.error)}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="danger"
            size="md"
            isLoading={rejectMutation.isPending}
            onClick={() =>
              rejectMutation.mutate(
                { planId: plan.planId, reason: reason.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success('Đã từ chối gói');
                    onClose();
                  },
                },
              )
            }
          >
            Từ chối gói
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 *  Helpers
 * ============================================================ */

/** Ảnh đại diện mặc định khi mentor chưa có avatar */
const avatarOf = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

/** Chuyển hồ sơ mentor từ BE sang dữ liệu hiển thị của thẻ giảng viên */
const toMentorCard = (mentor: MentorDto) => ({
  id: mentor.userId,
  fullName: mentor.fullName,
  title: mentor.specialization || mentor.department || 'Chuyên gia IELTS',
  avatarUrl: mentor.avatarUrl || avatarOf(mentor.email),
  rating: mentor.ratingAverage || 5.0,
  ratingCount: 120,
  pricePerHour: mentor.hourlyRate || 300000,
  bio:
    mentor.biography ||
    'Giảng viên giàu kinh nghiệm luyện thi chứng chỉ quốc tế IELTS/TOEIC/VSTEP tại PrepMaster.',
});

/* ============================================================
 *  Sub components
 * ============================================================ */

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="mb-3">
    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
      {title}
    </h2>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
  </div>
);

/* ============================================================
 *  MyBookingsSection — Lịch của tôi (sắp tới / đã qua), hủy buổi đã thanh toán
 * ============================================================ */
const MyBookingsSection: React.FC = () => {
  const [listType, setListType] = useState<ScheduleListType>('upcoming');
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [requesting, setRequesting] = useState<Booking | null>(null);
  const query = useMySchedule(listType, page, true);
  const bookings = query.data?.data ?? [];

  return (
    <section aria-label="Lịch của tôi">
      <SectionHeader
        title="Lịch của tôi"
        subtitle="Các buổi kèm 1-1 trong gói của bạn. Bận thì bấm Xin dời lịch để mentor xếp giờ khác, hoặc hủy buổi trước giờ học theo quy định"
      />
      <Card>
        <div className="flex gap-2 mb-4">
          {([
            ['upcoming', 'Sắp tới'],
            ['past', 'Đã qua'],
          ] as const).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setListType(type);
                setPage(0);
              }}
              className={cn(
                'h-9 px-4 rounded-input border text-xs font-extrabold transition-all',
                listType === type
                  ? 'border-primary bg-primary-tint text-primary ring-2 ring-primary/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <p className="text-sm text-slate-500 text-center py-6">Đang tải lịch…</p>
        ) : query.isError ? (
          <p className="text-sm text-status-danger text-center py-6">
            {getErrorMessage(query.error)}
          </p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            {listType === 'upcoming' ? 'Bạn chưa có buổi học nào sắp tới.' : 'Chưa có buổi học nào.'}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {bookings.map((b) => (
              <li
                key={b.bookingId}
                className="rounded-input border border-slate-200/70 bg-slate-50/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatDayLabel(b.startTime)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>
                    <Badge variant={BOOKING_STATUS_VARIANT[b.status]} size="sm">
                      {BOOKING_STATUS_LABEL[b.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Mentor {b.mentorName}</p>
                  {b.topic && <p className="text-xs text-slate-700 mt-0.5">Nội dung: {b.topic}</p>}
                  {b.cancelReason && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Lý do hủy: {b.cancelReason}</p>
                  )}
                  {b.rescheduleRequestedAt && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Đã xin dời
                      {b.reschedulePreferredTime
                        ? ` sang ${formatDayLabel(b.reschedulePreferredTime)} · ${formatTime(b.reschedulePreferredTime)}`
                        : ''}{' '}
                      — chờ mentor xác nhận
                    </p>
                  )}
                </div>
                {listType === 'upcoming' && isActiveBooking(b.status) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {b.meetingUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={Video}
                        onClick={() => window.open(b.meetingUrl as string, '_blank')}
                      >
                        Vào phòng
                      </Button>
                    )}
                    {/* Buổi của gói chưa thanh toán: thanh toán / từ chối cả gói ở mục Gói kèm 1-1 */}
                    {b.status === 'confirmed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={CalendarClock}
                          disabled={new Date(b.startTime).getTime() - Date.now() <= RESCHEDULE_DEADLINE_HOURS * 3600 * 1000}
                          title={`Gửi yêu cầu cho mentor, trước giờ học ít nhất ${RESCHEDULE_DEADLINE_HOURS} giờ`}
                          onClick={() => setRequesting(b)}
                        >
                          {b.rescheduleRequestedAt ? 'Sửa yêu cầu dời' : 'Xin dời lịch'}
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setCancelling(b)}>
                          Hủy
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <Pagination
          className="mt-4"
          currentPage={page}
          totalPages={query.data?.totalPages ?? 0}
          onChange={setPage}
        />
      </Card>

      {cancelling && <CancelBookingModal booking={cancelling} onClose={() => setCancelling(null)} />}
      {requesting && <RescheduleRequestModal booking={requesting} onClose={() => setRequesting(null)} />}
    </section>
  );
};

/* ============================================================
 *  RescheduleRequestModal — học viên xin mentor dời 1 buổi (V28)
 *  Chỉ là yêu cầu: lý do bắt buộc, giờ mong muốn tùy chọn (cùng thời lượng buổi cũ).
 *  Mentor nhận thông báo → dời lịch (yêu cầu tự xóa) hoặc từ chối (buổi giữ nguyên giờ).
 * ============================================================ */
export const RescheduleRequestModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
  const toast = useToast();
  const requestMutation = useRequestReschedule();
  const bounds = scheduleDateBounds();
  const minutes = durationMinutes(booking.startTime, booking.endTime);
  const [note, setNote] = useState(booking.rescheduleRequestNote ?? '');
  const [date, setDate] = useState(booking.reschedulePreferredTime ? toDateInput(booking.reschedulePreferredTime) : '');
  const [time, setTime] = useState(booking.reschedulePreferredTime ? formatTime(booking.reschedulePreferredTime) : '');
  const [touched, setTouched] = useState(false);

  // Giờ mong muốn: bỏ trống cả 2 ô = để mentor tự đề xuất
  const preferredIso = date && time ? toUtcIso(date, time) : '';
  const endTime = preferredIso ? formatTime(new Date(new Date(preferredIso).getTime() + minutes * 60000).toISOString()) : '';
  const noteError = !note.trim() ? 'Hãy ghi lý do để mentor sắp xếp' : '';
  const timeError =
    (date && !time) || (!date && time)
      ? 'Chọn đủ ngày và giờ, hoặc bỏ trống cả hai'
      : preferredIso
        ? validateSessionTime(date, time, endTime)
        : null;

  const handleSubmit = () => {
    setTouched(true);
    if (noteError || timeError) return;
    requestMutation.mutate(
      { bookingId: booking.bookingId, note: note.trim(), preferredStartTime: preferredIso || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu, mentor sẽ xác nhận giờ mới');
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-card shadow-elevation border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-900">Xin dời lịch</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3 space-y-1.5">
            <Row
              label="Buổi học"
              value={`${formatDayLabel(booking.startTime)} · ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
            />
            <Row label="Mentor" value={booking.mentorName} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Lý do *</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="VD: em bận thi giữa kỳ tối thứ 5"
              className={cn(
                'w-full rounded-input border p-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary',
                touched && noteError ? 'border-rose-400' : 'border-slate-200',
              )}
            />
            {touched && noteError && <p className="text-[11px] text-status-danger font-semibold">{noteError}</p>}
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
              Giờ mong muốn (không bắt buộc)
            </p>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input
                type="date"
                min={bounds.min}
                max={bounds.max}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 px-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-10 px-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {endTime ? `Buổi mới dự kiến ${time} – ${endTime} (giữ ${minutes} phút). ` : ''}
              Mentor sẽ xác nhận giờ mới hoặc liên hệ bạn.
            </p>
            {timeError && <p className="text-[11px] text-status-danger font-semibold">{timeError}</p>}
          </div>
          {requestMutation.isError && (
            <p className="text-xs text-status-danger font-semibold">{getErrorMessage(requestMutation.error)}</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="primary" size="md" leftIcon={CalendarClock} isLoading={requestMutation.isPending} onClick={handleSubmit}>
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 *  CancelBookingModal — xác nhận hủy lịch (lý do không bắt buộc)
 * ============================================================ */
const CancelBookingModal: React.FC<{ booking: Booking; onClose: () => void }> = ({
  booking,
  onClose,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelBooking();

  const handleConfirm = () => {
    cancelMutation.mutate(
      { bookingId: booking.bookingId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Đã hủy lịch hẹn');
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-card shadow-elevation border border-slate-200 overflow-hidden animate-in zoom-in-95">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-900">Hủy lịch hẹn</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3 space-y-1.5">
            <Row
              label="Buổi học"
              value={`${formatDayLabel(booking.startTime)} · ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
            />
            <Row label="Mentor" value={booking.mentorName} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
              Lý do (không bắt buộc)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-input border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>
          {cancelMutation.isError && (
            <p className="text-xs text-status-danger font-semibold">
              {getErrorMessage(cancelMutation.error)}
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" size="md" isLoading={cancelMutation.isPending} onClick={handleConfirm}>
            Xác nhận hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 *  SessionPaymentModal — thanh toán buổi kèm 1-1 qua SePay (Dev 4)
 *  - Lấy đơn GET /api/v1/payments/orders/{orderCode}, tự kiểm tra lại mỗi 3 giây khi còn PENDING.
 *  - Webhook SePay xác nhận → đơn PAID, booking "confirmed" (FE không tự đánh dấu đã thanh toán).
 *  - Hủy thanh toán → BE hủy đơn, hủy booking pending và mở lại slot.
 * ============================================================ */
const PAYMENT_DONE_MESSAGE: Record<Exclude<SessionPaymentStatus, 'PENDING'>, string> = {
  PAID: 'Đã nhận thanh toán. Các buổi kèm 1-1 trong gói đã được xác nhận, xem lại trong mục Lịch của tôi.',
  CANCELLED: 'Bạn đã hủy đơn thanh toán. Gói vẫn được giữ, bấm "Thanh toán cả gói" để tạo đơn mới.',
  EXPIRED: 'Đơn đã hết hạn thanh toán. Gói vẫn được giữ, bấm "Thanh toán cả gói" để tạo đơn mới.',
  REVIEW_REQUIRED:
    'Giao dịch chưa khớp (sai số tiền hoặc chuyển sau khi đơn hết hạn). Quản trị viên sẽ kiểm tra và liên hệ bạn.',
};

const SessionPaymentModal: React.FC<{ orderCode: string; onClose: () => void }> = ({
  orderCode,
  onClose,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fetchProfile = useAuthStore((s) => s.fetchMyProfile);
  const paymentQuery = useSessionPayment(orderCode);
  const cancelMutation = useCancelSessionPayment();
  const order = paymentQuery.data;
  const status = order?.status;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [qrError, setQrError] = useState(false);

  // Đồng hồ đếm ngược hạn thanh toán
  useEffect(() => {
    if (status !== 'PENDING') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Đơn kết thúc (PAID / hết hạn / hủy) → tải lại lịch + thông báo
  useEffect(() => {
    if (status && status !== 'PENDING') {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
      // Learner (USER) trả tiền gói thì BE nâng lên STUDENT → tải lại hồ sơ để mở menu Mentor 1-1
      if (status === 'PAID') void fetchProfile().catch(() => undefined);
    }
  }, [status, queryClient, fetchProfile]);

  const secondsLeft = order ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - now) / 1000)) : 0;
  const countdown = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleCancelPayment = () => {
    cancelMutation.mutate(orderCode, {
      onSuccess: () => {
        toast.success('Đã hủy đơn thanh toán');
        paymentQuery.refetch();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-payment-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl outline-none animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase">SePay · Chuyển khoản ngân hàng</p>
            <h2 id="session-payment-title" className="font-extrabold text-xl text-slate-900 mt-1">
              Thanh toán học phí 1-1
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng thanh toán">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {paymentQuery.isLoading && <Skeleton className="h-64" />}
          {paymentQuery.isError && <ErrorState message={getErrorMessage(paymentQuery.error)} onRetry={() => void paymentQuery.refetch()} />}
          {order && order.status !== 'PENDING' && (
            <div className="text-center">
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', order.status === 'PAID' ? 'bg-status-success-bg' : 'bg-status-danger-bg')}>
                {order.status === 'PAID' ? <CheckCircle2 className="w-9 h-9 text-status-success" /> : <AlertTriangle className="w-9 h-9 text-status-danger" />}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {order.status === 'PAID' ? 'Thanh toán thành công!' : 'Lịch học chưa được xác nhận'}
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">{PAYMENT_DONE_MESSAGE[order.status]}</p>
              <Button variant="primary" size="md" className="mt-6" onClick={onClose}>Đóng</Button>
            </div>
          )}
          {order?.status === 'PENDING' && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{order.courseTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">Đơn {order.orderCode}</p>
                  <p className="font-extrabold text-2xl text-blue-700 mt-2">{formatVND(order.amount)}</p>
                </div>
                <PaymentStatusBadge status={order.status} />
              </div>
              <div className="grid sm:grid-cols-2 gap-5 items-start">
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                  {order.qrUrl && !qrError ? (
                    <img src={order.qrUrl} alt={`QR thanh toán đơn ${order.orderCode}`} className="w-full max-w-60 mx-auto rounded-lg" onError={() => setQrError(true)} />
                  ) : (
                    <p className="text-sm text-slate-600 py-10">Không tải được QR. Bạn có thể chuyển khoản theo thông tin bên cạnh.</p>
                  )}
                  <p className="font-bold text-sm text-blue-700 mt-3">Còn {countdown}</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div><p className="text-xs text-slate-500">Ngân hàng</p><p className="font-bold">{order.bankCode}</p></div>
                  <div><p className="text-xs text-slate-500">Chủ tài khoản</p><p className="font-bold break-words">{order.accountName}</p></div>
                  <CopyLine label="Số tài khoản" value={order.accountNumber} copied={copiedField === 'account'} onCopy={() => handleCopy('account', order.accountNumber)} />
                  <CopyLine label="Nội dung chuyển khoản" value={order.transferContent} copied={copiedField === 'content'} onCopy={() => handleCopy('content', order.transferContent)} />
                  <p className="text-xs text-slate-600">Chuyển đúng <strong>{formatVND(order.amount)}</strong> và giữ nguyên nội dung để xác nhận đúng đơn hàng.</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 flex items-start gap-2"><ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />Hệ thống tự kiểm tra mỗi vài giây và xác nhận ngay khi nhận được chuyển khoản.</p>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" leftIcon={RefreshCw} isLoading={paymentQuery.isFetching} onClick={() => void paymentQuery.refetch()}>Kiểm tra trạng thái</Button>
                <Button variant="ghost" isLoading={cancelMutation.isPending} onClick={handleCancelPayment}>Hủy thanh toán</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
      {label}
    </p>
    <p
      className={cn(
        'text-sm font-bold text-slate-800 truncate',
        mono && 'font-mono',
      )}
    >
      {value}
    </p>
  </div>
);

const CopyLine: React.FC<{
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ label, value, copied, onCopy }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono font-bold break-all select-all">{value}</span>
      <button type="button" onClick={onCopy} aria-label={`Sao chép ${label.toLowerCase()}`} className="rounded-lg p-2 text-slate-500 hover:bg-white shrink-0">
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    {copied && <p role="status" className="text-xs text-emerald-600">Đã sao chép</p>}
  </div>
);

export default SchedulePageView;
