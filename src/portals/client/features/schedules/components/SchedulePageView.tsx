/**
 * SchedulePageView — Lịch học & Đặt hẹn Giảng viên 1-1 (Dev 5 — TASK D5-20)
 * -----------------------------------------------------------
 * Phần 1: Buổi học sắp diễn ra (booking gần nhất của học viên + nút tham gia phòng học)
 * Phần 2: Đặt lịch kèm riêng 1-1 (chọn ngày trong 7 ngày tới, chọn khung giờ của mentor,
 *          tóm tắt → đặt lịch (booking "pending", BE giữ slot + tạo đơn SePay) → hộp thoại QR thanh toán thật,
 *          tự kiểm tra trạng thái đơn tới khi PAID). Khi đổi lịch thì dùng lại khu vực này.
 * Phần 3: Lịch của tôi (sắp tới / đã qua) — hủy và đổi lịch.
 * Mentor lấy từ ?mentorId= trên URL, không có thì lấy mentor đầu tiên trong danh sách.
 * Dải "Chọn giảng viên" cho học viên chuyển mentor (cập nhật ?mentorId=); khi đổi lịch thì khóa mentor cũ.
 * Thời gian BE trả dạng UTC, hiển thị theo giờ máy người dùng.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  Star,
  CheckCircle2,
  X,
  ShieldCheck,
  Copy,
  Check,
  Banknote,
  ArrowRight,
  User,
  RefreshCw,
  XCircle,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMentor, getMentors } from '@/shared/api/domainApi';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useCanCallNotificationApi } from '@/shared/notifications/useNotifications';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  addDays,
  durationMinutes,
  formatDate,
  formatDayLabel,
  formatTime,
  isActiveBooking,
  isSameDay,
  startOfDay,
  useBookSlot,
  useCancelBooking,
  useCancelSessionPayment,
  useMentorAvailability,
  useMySchedule,
  useRescheduleBooking,
  useSessionPayment,
  weekdayFull,
  weekdayShort,
} from '@/shared/schedule';
import type { Booking, MentorScheduleSlot, ScheduleListType, SessionPaymentStatus } from '@/shared/types';
import type { MentorDto } from '@/shared/api/apiTypes';

/** Số ngày hiển thị trên dải chọn ngày (tính từ hôm nay) */
const DAYS_TO_SHOW = 7;
/** Số mentor tải cho dải chọn giảng viên */
const MENTORS_TO_SHOW = 20;

/* ============================================================
 *  Component chính
 * ============================================================ */
export const SchedulePageView: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.role);
  const canCallApi = useCanCallNotificationApi();
  const isStudent = canCallApi && role === 'STUDENT';

  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<MentorScheduleSlot | null>(null);
  /** Mã đơn SePay đang mở hộp thoại thanh toán (null = đóng) */
  const [paymentOrderCode, setPaymentOrderCode] = useState<string | null>(null);
  /** Booking đang được đổi lịch (null = đặt lịch mới) */
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);
  const bookingSectionRef = useRef<HTMLElement>(null);

  // 7 ngày tới tính theo giờ máy người dùng, khoảng thời gian gửi BE dạng UTC
  const { days, rangeFrom, rangeTo } = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      days: Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(today, i)),
      rangeFrom: today.toISOString(),
      rangeTo: addDays(today, DAYS_TO_SHOW).toISOString(),
    };
  }, []);

  // Mentor: đang đổi lịch thì cố định mentor cũ, sau đó tới ?mentorId=, cuối cùng là mentor đầu tiên
  const { data: mentorsData } = useQuery({
    queryKey: QUERY_KEYS.mentor.directory({ page: 0 }),
    queryFn: () => getMentors({ page: 0, size: MENTORS_TO_SHOW }),
  });
  const mentorList = mentorsData?.data ?? [];
  const mentorId =
    rescheduling?.mentorId ?? searchParams.get('mentorId') ?? mentorsData?.data?.[0]?.userId;

  const { data: realMentor } = useQuery({
    queryKey: QUERY_KEYS.mentor.detail(mentorId ?? ''),
    queryFn: () => getMentor(mentorId as string),
    enabled: !!mentorId,
  });

  const mentorForBooking = useMemo(() => (realMentor ? toMentorCard(realMentor) : null), [realMentor]);

  // Lịch trống + đã đặt của mentor trong 7 ngày tới
  const availabilityQuery = useMentorAvailability(mentorId, rangeFrom, rangeTo);
  const slotsByDay = useMemo(() => {
    const all = availabilityQuery.data ?? [];
    return days.map((d) => all.filter((s) => isSameDay(new Date(s.startTime), d)));
  }, [availabilityQuery.data, days]);
  const slots = slotsByDay[selectedDay] ?? [];

  // Buổi học sắp diễn ra = booking gần nhất của học viên
  const upcomingQuery = useMySchedule('upcoming', 0, isStudent);
  const upcoming = upcomingQuery.data?.data?.[0];
  const { data: upcomingMentor } = useQuery({
    queryKey: QUERY_KEYS.mentor.detail(upcoming?.mentorId ?? ''),
    queryFn: () => getMentor(upcoming?.mentorId as string),
    enabled: !!upcoming,
  });

  const bookMutation = useBookSlot();
  const rescheduleMutation = useRescheduleBooking();

  /** Chuyển sang mentor khác: lưu vào URL để tải lại lịch trống của mentor đó */
  const handleSelectMentor = (id: string) => {
    if (rescheduling || id === mentorId) return;
    const next = new URLSearchParams(searchParams);
    next.set('mentorId', id);
    setSearchParams(next, { replace: true });
    setSelectedDay(0);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot: MentorScheduleSlot) => {
    if (slot.status !== 'available') return;
    setSelectedSlot(slot);
  };

  const handleStartReschedule = (booking: Booking) => {
    setRescheduling(booking);
    setSelectedDay(0);
    setSelectedSlot(null);
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelReschedule = () => {
    setRescheduling(null);
    setSelectedSlot(null);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduling || !selectedSlot) return;
    rescheduleMutation.mutate(
      { bookingId: rescheduling.bookingId, newScheduleId: selectedSlot.scheduleId },
      {
        onSuccess: () => {
          toast.success('Đổi lịch thành công');
          setRescheduling(null);
          setSelectedSlot(null);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  // Đặt lịch: BE tạo booking "pending", giữ slot và tạo đơn SePay → mở hộp thoại QR của đơn đó
  const handleBookAndPay = () => {
    if (!selectedSlot) return;
    bookMutation.mutate(selectedSlot.scheduleId, {
      onSuccess: (booking) => {
        setSelectedSlot(null);
        if (booking.paymentOrderCode) setPaymentOrderCode(booking.paymentOrderCode);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          Lịch học & Đặt hẹn
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lịch học và đặt hẹn Giảng viên 1-1
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Theo dõi buổi học sắp tới và đặt lịch kèm riêng với giảng viên
          chuyên môn cao theo khung giờ phù hợp với bạn.
        </p>
      </header>

      {/* ============== SECTION 1: BUỔI HỌC SẮP DIỄN RA ============== */}
      <section aria-label="Buổi học sắp diễn ra">
        <SectionHeader
          title="Buổi học sắp diễn ra"
          subtitle="Buổi hẹn gần nhất với giảng viên của bạn"
        />
        {!upcoming ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-6">
              {!isStudent
                ? 'Đăng nhập bằng tài khoản học viên để xem lịch học của bạn.'
                : upcomingQuery.isLoading
                  ? 'Đang tải lịch học…'
                  : upcomingQuery.isError
                    ? getErrorMessage(upcomingQuery.error)
                    : 'Bạn chưa có buổi học nào sắp diễn ra.'}
            </p>
          </Card>
        ) : (
          <Card hoverable className="relative overflow-hidden p-0">
            <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-ai/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
              {/* Time block */}
              <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-48 shrink-0">
                <Badge variant="primary" size="md" icon={Clock}>
                  {formatDayLabel(upcoming.startTime)}
                </Badge>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  {formatTime(upcoming.startTime)}
                  <span className="text-slate-400 font-bold text-base mx-1">
                    –
                  </span>
                  {formatTime(upcoming.endTime)}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {durationMinutes(upcoming.startTime, upcoming.endTime)} phút · Phòng học trực tuyến
                </p>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px self-stretch bg-slate-200" />

              {/* Mentor + topic */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={upcomingMentor ? toMentorCard(upcomingMentor).avatarUrl : avatarOf(upcoming.mentorName)}
                    alt={upcoming.mentorName}
                    className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-md"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Giảng viên hướng dẫn
                    </p>
                    <p className="font-extrabold text-slate-900 truncate">
                      Thầy {upcoming.mentorName}
                    </p>
                    {upcomingMentor && (
                      <p className="text-xs text-ai font-semibold truncate">
                        {toMentorCard(upcomingMentor).title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">
                    Nội dung buổi kèm
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    Buổi kèm riêng 1-1 · {BOOKING_STATUS_LABEL[upcoming.status]}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="shrink-0 flex flex-col items-stretch md:items-end gap-2">
                <Button
                  variant="success"
                  size="lg"
                  leftIcon={Video}
                  rightIcon={ArrowRight}
                  disabled={!upcoming.meetingUrl}
                  onClick={() => upcoming.meetingUrl && window.open(upcoming.meetingUrl, '_blank')}
                  className="relative"
                >
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
                  </span>
                  Tham gia phòng học trực tuyến
                </Button>
                <p className="text-[11px] text-slate-500 text-center md:text-right">
                  {upcoming.meetingUrl
                    ? 'Vui lòng vào phòng trước giờ hẹn 5 phút'
                    : 'Giảng viên chưa cập nhật link phòng học'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* ============== SECTION 2: ĐẶT LỊCH KÈM RIÊNG 1-1 ============== */}
      <section aria-label="Đặt lịch kèm riêng 1-1" ref={bookingSectionRef} className="scroll-mt-28">
        <SectionHeader
          title={rescheduling ? 'Đổi lịch kèm riêng 1-1' : 'Đặt lịch kèm riêng 1-1'}
          subtitle={
            rescheduling
              ? 'Chọn khung giờ mới của cùng giảng viên để đổi buổi học'
              : 'Chọn ngày trong tuần và khung giờ phù hợp để đặt buổi kèm riêng'
          }
        />

        {!mentorForBooking ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-6">
              Chưa có giảng viên nào để đặt lịch.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
            {/* ==== LEFT: Chọn mentor + Mentor card + Date strip + Slot grid ==== */}
            <div className="space-y-5 min-w-0">
              {!rescheduling && mentorList.length > 1 && (
                <MentorPicker
                  mentors={mentorList}
                  selectedId={mentorId}
                  onSelect={handleSelectMentor}
                />
              )}

              <Card>
                <div className="flex items-start gap-4">
                  <img
                    src={mentorForBooking.avatarUrl}
                    alt={mentorForBooking.fullName}
                    className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Thầy {mentorForBooking.fullName}
                      </h3>
                      <Badge variant="ai" size="sm" icon={Sparkles}>
                        Top Mentor
                      </Badge>
                    </div>
                    <p className="text-xs text-ai font-semibold mt-0.5">
                      {mentorForBooking.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {mentorForBooking.bio}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Star
                          className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                        />
                        {mentorForBooking.rating.toFixed(1)}
                        <span className="text-slate-500 font-medium">
                          ({mentorForBooking.ratingCount.toLocaleString('vi-VN')} đánh giá)
                        </span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-extrabold text-primary">
                        {formatVND(mentorForBooking.pricePerHour)}/giờ
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Date strip */}
              <Card>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">
                  Chọn ngày học trong tuần
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {days.map((d, idx) => {
                    const active = idx === selectedDay;
                    return (
                      <button
                        key={d.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDay(idx);
                          setSelectedSlot(null);
                        }}
                        className={cn(
                          'shrink-0 w-16 h-20 rounded-input border flex flex-col items-center justify-center transition-all',
                          active
                            ? 'border-primary bg-primary-tint ring-2 ring-primary/20'
                            : 'border-slate-200 bg-white hover:border-slate-300',
                        )}
                      >
                        <span
                          className={cn(
                            'text-[10px] font-extrabold uppercase tracking-wider',
                            active ? 'text-primary' : 'text-slate-400',
                          )}
                        >
                          {weekdayShort(d)}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-extrabold mt-1',
                            active ? 'text-primary' : 'text-slate-800',
                          )}
                        >
                          {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] mt-0.5',
                            active ? 'text-primary font-bold' : 'text-slate-400',
                          )}
                        >
                          {slotsByDay[idx]?.filter((s) => s.status === 'available').length ?? 0}{' '}
                          khung giờ
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Slot grid */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Khung giờ mở · {weekdayFull(days[selectedDay])}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-slate-200" />
                      Đã có người đặt
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-status-success" />
                      Còn trống
                    </span>
                  </div>
                </div>

                {availabilityQuery.isLoading ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Đang tải khung giờ…
                  </p>
                ) : availabilityQuery.isError ? (
                  <p className="text-sm text-status-danger text-center py-6">
                    {getErrorMessage(availabilityQuery.error)}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Giảng viên chưa mở khung giờ cho ngày này.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {slots.map((slot) => {
                      const active = selectedSlot?.scheduleId === slot.scheduleId;
                      const booked = slot.status !== 'available';
                      return (
                        <button
                          key={slot.scheduleId}
                          type="button"
                          disabled={booked}
                          onClick={() => handleSelectSlot(slot)}
                          className={cn(
                            'h-14 rounded-input border flex items-center justify-center gap-1.5 font-bold text-sm transition-all',
                            booked
                              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                              : active
                                ? 'border-status-success bg-status-success-bg text-status-success ring-2 ring-status-success/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-status-success/40 hover:bg-status-success-bg/40',
                          )}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="tabular-nums">
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </span>
                          {booked && (
                            <span className="ml-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                              Đã đặt
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* ==== RIGHT: Tóm tắt đặt lịch ==== */}
            <aside className="lg:sticky lg:top-[112px] rounded-card border border-slate-200/80 bg-white shadow-elevation h-fit">
              <div className="p-5 border-b border-slate-100">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  {rescheduling ? 'Tóm tắt đổi lịch' : 'Tóm tắt đặt lịch'}
                </p>
                <h3 className="mt-1 text-base font-extrabold text-slate-900">
                  Phiên kèm riêng 1-1
                </h3>
              </div>

              <div className="p-5 space-y-4">
                <SummaryRow
                  label="Giảng viên"
                  value={`Thầy ${mentorForBooking.fullName}`}
                  icon={User}
                />
                {rescheduling && (
                  <SummaryRow
                    label="Lịch hiện tại"
                    value={`${formatDate(rescheduling.startTime)} · ${formatTime(rescheduling.startTime)} – ${formatTime(rescheduling.endTime)}`}
                    icon={RefreshCw}
                  />
                )}
                <SummaryRow
                  label="Ngày học"
                  value={
                    selectedSlot
                      ? `${weekdayFull(new Date(selectedSlot.startTime))}, ${formatDate(selectedSlot.startTime)}`
                      : 'Chưa chọn ngày'
                  }
                  icon={Calendar}
                />
                <SummaryRow
                  label="Khung giờ"
                  value={
                    selectedSlot
                      ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`
                      : 'Chưa chọn giờ'
                  }
                  icon={Clock}
                />
                <SummaryRow
                  label="Hình thức"
                  value="Trực tuyến (Video call)"
                  icon={Video}
                />

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Học phí</span>
                  <span className="text-lg font-extrabold text-primary">
                    {formatVND(selectedSlot?.price ?? mentorForBooking.pricePerHour)}
                  </span>
                </div>

                {rescheduling ? (
                  <>
                    <Button
                      variant="ai"
                      size="lg"
                      fullWidth
                      rightIcon={ArrowRight}
                      disabled={!selectedSlot}
                      isLoading={rescheduleMutation.isPending}
                      onClick={handleConfirmReschedule}
                    >
                      Xác nhận đổi lịch
                    </Button>
                    <Button variant="ghost" size="md" fullWidth onClick={handleCancelReschedule}>
                      Hủy đổi lịch
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ai"
                    size="lg"
                    fullWidth
                    rightIcon={ArrowRight}
                    disabled={!selectedSlot || !isStudent}
                    isLoading={bookMutation.isPending}
                    onClick={handleBookAndPay}
                  >
                    Xác nhận & Thanh toán học phí
                  </Button>
                )}
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  {isStudent
                    ? 'Slot được giữ trong thời hạn thanh toán (15 phút). Thanh toán xong hệ thống tự xác nhận và gửi thông báo cho bạn và giảng viên.'
                    : 'Đăng nhập bằng tài khoản học viên để đặt lịch.'}
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* ============== SECTION 3: LỊCH CỦA TÔI ============== */}
      {isStudent && (
        <MyBookingsSection onReschedule={handleStartReschedule} onPay={setPaymentOrderCode} />
      )}

      {/* ============== THANH TOÁN SEPAY (QR thật, tự xác nhận qua webhook) ============== */}
      {paymentOrderCode && (
        <SessionPaymentModal orderCode={paymentOrderCode} onClose={() => setPaymentOrderCode(null)} />
      )}
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

/** Dải chọn giảng viên — bấm 1 mentor để xem lịch trống của mentor đó */
const MentorPicker: React.FC<{
  mentors: MentorDto[];
  selectedId?: string;
  onSelect: (mentorId: string) => void;
}> = ({ mentors, selectedId, onSelect }) => (
  <Card>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">
      Chọn giảng viên ({mentors.length})
    </p>
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {mentors.map((m) => {
        const card = toMentorCard(m);
        const active = m.userId === selectedId;
        return (
          <button
            key={m.userId}
            type="button"
            onClick={() => onSelect(m.userId)}
            aria-pressed={active}
            className={cn(
              'shrink-0 w-48 text-left flex items-center gap-3 p-3 rounded-xl border transition-all',
              active
                ? 'border-[#0052CC] bg-blue-50/60 ring-2 ring-[#0052CC]/15'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <img
              src={card.avatarUrl}
              alt={card.fullName}
              className="w-10 h-10 rounded-full bg-slate-100 shrink-0"
            />
            <div className="min-w-0">
              <p className={cn('text-sm truncate', active ? 'font-extrabold text-[#0052CC]' : 'font-bold text-slate-900')}>
                {card.fullName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{card.title}</p>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">{formatVND(card.pricePerHour)}/giờ</p>
            </div>
          </button>
        );
      })}
    </div>
  </Card>
);

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

const SummaryRow: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-2.5">
    <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
        {value}
      </p>
    </div>
  </div>
);

/* ============================================================
 *  MyBookingsSection — Lịch của tôi (sắp tới / đã qua), hủy & đổi lịch
 * ============================================================ */
const MyBookingsSection: React.FC<{
  onReschedule: (booking: Booking) => void;
  /** Mở lại hộp thoại thanh toán của booking đang chờ thanh toán */
  onPay: (orderCode: string) => void;
}> = ({ onReschedule, onPay }) => {
  const [listType, setListType] = useState<ScheduleListType>('upcoming');
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const query = useMySchedule(listType, page, true);
  const bookings = query.data?.data ?? [];

  return (
    <section aria-label="Lịch của tôi">
      <SectionHeader
        title="Lịch của tôi"
        subtitle="Các buổi kèm 1-1 bạn đã đặt. Có thể hủy hoặc đổi lịch trước giờ học theo quy định"
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
                  <p className="text-xs text-slate-600 mt-0.5">
                    Thầy {b.mentorName} · {formatVND(b.price)}
                  </p>
                  {b.cancelReason && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Lý do hủy: {b.cancelReason}</p>
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
                    {b.status === 'pending' && b.paymentOrderCode && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={CreditCard}
                        onClick={() => onPay(b.paymentOrderCode as string)}
                      >
                        Thanh toán
                      </Button>
                    )}
                    {/* Chỉ đổi lịch buổi đã thanh toán (BE chặn booking pending) */}
                    {b.status === 'confirmed' && (
                      <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={() => onReschedule(b)}>
                        Đổi lịch
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setCancelling(b)}>
                      Hủy
                    </Button>
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
    </section>
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
            <Row label="Giảng viên" value={`Thầy ${booking.mentorName}`} />
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
  PAID: 'Đã nhận thanh toán. Buổi kèm 1-1 của bạn đã được xác nhận, xem lại trong mục Lịch của tôi.',
  CANCELLED: 'Bạn đã hủy thanh toán. Lịch hẹn đã được hủy và slot được mở lại cho người khác.',
  EXPIRED: 'Đơn đã hết hạn thanh toán. Lịch hẹn đã được hủy, vui lòng chọn slot và đặt lại.',
  REVIEW_REQUIRED:
    'Giao dịch chưa khớp (sai số tiền hoặc chuyển sau khi đơn hết hạn). Quản trị viên sẽ kiểm tra và liên hệ bạn.',
};

const SessionPaymentModal: React.FC<{ orderCode: string; onClose: () => void }> = ({
  orderCode,
  onClose,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const paymentQuery = useSessionPayment(orderCode);
  const cancelMutation = useCancelSessionPayment();
  const order = paymentQuery.data;
  const status = order?.status;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Đồng hồ đếm ngược hạn thanh toán
  useEffect(() => {
    if (status !== 'PENDING') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Đơn kết thúc (PAID / hết hạn / hủy) → tải lại lịch + thông báo
  useEffect(() => {
    if (status && status !== 'PENDING') {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'availability'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
    }
  }, [status, queryClient]);

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
        toast.success('Đã hủy thanh toán và lịch hẹn');
        paymentQuery.refetch();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-card shadow-elevation border border-slate-200 overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-primary-tint/50 to-ai/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-ai-gradient flex items-center justify-center shadow-ai-glow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Thanh toán học phí 1-1</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Chuyển khoản VietQR · SePay tự động xác nhận
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {paymentQuery.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Đang tải thông tin thanh toán…</p>
        ) : paymentQuery.isError || !order ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-sm text-status-danger font-semibold">{getErrorMessage(paymentQuery.error)}</p>
            <Button variant="ghost" size="md" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : order.status !== 'PENDING' ? (
          <div className="p-8 text-center">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                order.status === 'PAID' ? 'bg-status-success-bg' : 'bg-status-danger-bg',
              )}
            >
              {order.status === 'PAID' ? (
                <CheckCircle2 className="w-9 h-9 text-status-success" />
              ) : (
                <AlertTriangle className="w-9 h-9 text-status-danger" />
              )}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {order.status === 'PAID' ? 'Đặt lịch thành công!' : 'Lịch hẹn chưa được xác nhận'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">{PAYMENT_DONE_MESSAGE[order.status]}</p>
            <Button variant="primary" size="md" className="mt-6" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trái — thông tin chuyển khoản */}
              <div className="space-y-3">
                <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3 space-y-1.5">
                  <Row label="Đơn hàng" value={order.courseTitle} />
                  <Row label="Mã đơn" value={order.orderCode} mono />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Số tiền</p>
                  <p className="text-2xl font-extrabold text-primary tabular-nums">{formatVND(order.amount)}</p>
                </div>
                <Row label="Ngân hàng · Chủ tài khoản" value={`${order.bankCode} · ${order.accountName}`} />
                <CopyLine
                  label="Số tài khoản"
                  value={order.accountNumber}
                  copied={copiedField === 'account'}
                  onCopy={() => handleCopy('account', order.accountNumber)}
                />
                <CopyLine
                  label="Nội dung (bắt buộc)"
                  value={order.transferContent}
                  copied={copiedField === 'content'}
                  onCopy={() => handleCopy('content', order.transferContent)}
                  highlight
                />
              </div>

              {/* Phải — QR */}
              <div className="rounded-input border-2 border-primary/30 bg-white p-3 text-center">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <span className="text-primary inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-sm" />
                    VietQR
                  </span>
                  <span className="text-status-danger inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {countdown}
                  </span>
                </div>
                {order.qrUrl && <img src={order.qrUrl} alt="Mã QR thanh toán" className="w-full aspect-square" />}
                <p className="text-[10px] text-slate-500 mt-2 leading-snug">
                  Quét bằng ứng dụng ngân hàng, giữ nguyên số tiền và nội dung chuyển khoản
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center gap-2">
              <Banknote className="w-4 h-4 text-status-success" />
              <span className="text-xs text-slate-600 flex-1 min-w-[180px]">
                Hệ thống tự kiểm tra mỗi vài giây và xác nhận ngay khi nhận được chuyển khoản.
              </span>
              <Button
                variant="ghost"
                size="md"
                isLoading={cancelMutation.isPending}
                onClick={handleCancelPayment}
              >
                Hủy thanh toán
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={RefreshCw}
                isLoading={paymentQuery.isFetching}
                onClick={() => paymentQuery.refetch()}
              >
                Kiểm tra trạng thái
              </Button>
            </div>
          </>
        )}
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
  highlight?: boolean;
}> = ({ label, value, copied, onCopy, highlight }) => (
  <div
    className={cn(
      'rounded-md p-2.5 flex items-center justify-between gap-2',
      highlight
        ? 'bg-status-danger-bg border border-red-200'
        : 'bg-slate-50 border border-slate-200/70',
    )}
  >
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          'text-[10px] font-extrabold uppercase tracking-widest',
          highlight ? 'text-status-danger' : 'text-slate-500',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-mono font-bold text-sm truncate',
          highlight ? 'text-status-danger' : 'text-slate-800',
        )}
      >
        {value}
      </p>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold shrink-0',
        copied
          ? 'bg-status-success text-white'
          : highlight
            ? 'bg-white text-status-danger border border-red-200 hover:bg-red-50'
            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary',
      )}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Sao chép
        </>
      )}
    </button>
  </div>
);

export default SchedulePageView;
