/**
 * MentorScheduleView — Lịch dạy 1-1 của Mentor (Dev 5)
 * -----------------------------------------------------------
 * Không còn "mở slot công khai, ai vào thì vào". Lịch dạy gắn với lộ trình của từng học viên:
 * - Gói kèm 1-1: mentor tạo sau khi tư vấn chốt lộ trình (VD 12 buổi, các khung giờ cụ thể),
 *   học viên thanh toán 1 lần cả gói thì các buổi mới được xác nhận. Gói chưa thanh toán thì hủy được.
 * - Lịch dạy sắp tới / đã qua: hủy buổi, ghi nhận "Đã dạy" / "Vắng mặt" sau giờ bắt đầu.
 * - Dời lịch (V26): mentor bận thì dời buổi sang giờ khác, trước giờ học ít nhất 2 giờ, giữ nguyên thời lượng.
 * - Học viên xin dời (V28): buổi có yêu cầu hiện lý do + giờ mong muốn; mentor bấm Dời lịch (điền sẵn giờ học viên muốn,
 *   dời xong yêu cầu tự xóa) hoặc Từ chối (buổi giữ nguyên giờ, báo học viên).
 *   Hiện lịch rảnh của học viên + cảnh báo nếu giờ mới nằm ngoài (không chặn). BE báo học viên.
 * Thời gian nhập theo giờ máy, gửi BE dạng UTC; chỉ xếp trong 90 ngày tới, mỗi buổi 30 – 180 phút.
 */

import React, { useState } from 'react';
import { AlertTriangle, CalendarClock, CalendarPlus, ChevronDown, ChevronUp, Route, Users, Video, X, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import { formatVND } from '@/shared/utils';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  PLAN_STATUS_LABEL,
  PLAN_STATUS_VARIANT,
  RESCHEDULE_DEADLINE_HOURS,
  AvailableSlotChips,
  durationMinutes,
  formatDayLabel,
  formatTime,
  isActiveBooking,
  isWithinSlots,
  scheduleDateBounds,
  toDateInput,
  toTimeInput,
  toUtcIso,
  useCancelBooking,
  useCancelMentoringPlan,
  useMentorPlans,
  useMentorSchedule,
  useRejectRescheduleRequest,
  useRescheduleBooking,
  useStudentOverview,
  useUpdateBookingStatus,
  validateSessionTime,
} from '@/shared/schedule';
import type { Booking, MentoringPlan, ScheduleListType } from '@/shared/types';
import { CreatePlanModal } from './CreatePlanModal';

const LABEL_CLASS = 'text-xs text-slate-500 font-semibold uppercase tracking-wider';

const MentorScheduleView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Mentor workspace</p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Lịch dạy 1-1</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Lịch dạy được xếp theo lộ trình của từng học viên sau khi tư vấn. Vào{' '}
            <Link to={CLIENT_ROUTES.mentorStudents} className="font-bold text-[#0052CC] hover:underline">
              Học viên & tư vấn
            </Link>{' '}
            để xem điểm test level và nhận yêu cầu tư vấn.
          </p>
        </div>
      </header>

      <MentoringPlansCard />
      <TeachingScheduleCard />
    </div>
  );
};

/* ============================================================
 *  Gói kèm 1-1 mentor đã tạo
 * ============================================================ */
const MentoringPlansCard: React.FC = () => {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<MentoringPlan | null>(null);
  const plansQuery = useMentorPlans(page);
  const cancelMutation = useCancelMentoringPlan();
  const plans = plansQuery.data?.data ?? [];

  const handleCancel = (reason: string) => {
    if (!cancelling) return;
    cancelMutation.mutate(
      { planId: cancelling.planId, reason },
      {
        onSuccess: () => {
          toast.success('Đã hủy gói kèm 1-1');
          setCancelling(null);
        },
      },
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Gói kèm 1-1 theo lộ trình</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Học phí tính theo hourly rate của bạn · học viên trả 1 lần cả gói
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={CalendarPlus} onClick={() => setCreating(true)}>
          Tạo gói kèm 1-1
        </Button>
      </div>

      {plansQuery.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải gói kèm…</p>
      ) : plansQuery.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(plansQuery.error)}</p>
      ) : plans.length === 0 ? (
        <p className="py-10 text-center text-slate-400 text-xs">
          Chưa có gói nào. Tư vấn học viên xong thì tạo gói gồm các buổi đã chốt.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {plans.map((plan) => {
            const open = expanded === plan.planId;
            return (
              <li key={plan.planId} className="py-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{plan.title}</p>
                      <Badge variant={PLAN_STATUS_VARIANT[plan.status]} size="sm">
                        {PLAN_STATUS_LABEL[plan.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Users className="w-3 h-3" /> {plan.studentName}
                      {plan.learningPathName && (
                        <>
                          <Route className="w-3 h-3 ml-1" /> {plan.learningPathName}
                        </>
                      )}
                      <span>
                        · {plan.completedSessions}/{plan.totalSessions} buổi · {formatVND(plan.totalPrice)}
                      </span>
                    </p>
                    {plan.cancelReason && <p className="text-[11px] text-slate-500 mt-0.5">Lý do hủy: {plan.cancelReason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={open ? ChevronUp : ChevronDown}
                      onClick={() => setExpanded(open ? null : plan.planId)}
                    >
                      Các buổi
                    </Button>
                    {plan.status === 'pending_payment' && (
                      <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setCancelling(plan)}>
                        Hủy gói
                      </Button>
                    )}
                  </div>
                </div>
                {open && (
                  <ul className="mt-2 ml-1 space-y-1">
                    {plan.sessions.map((s, i) => (
                      <li key={s.bookingId} className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-400 w-7">#{i + 1}</span>
                        <span className="tabular-nums font-semibold text-slate-800">
                          {formatDayLabel(s.startTime)} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </span>
                        <Badge variant={BOOKING_STATUS_VARIANT[s.status]} size="sm">
                          {BOOKING_STATUS_LABEL[s.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={plansQuery.data?.totalPages ?? 0} onChange={setPage} />

      {creating && <CreatePlanModal onClose={() => setCreating(false)} />}
      {cancelling && (
        <ConfirmModal
          title="Hủy gói kèm 1-1"
          message={`Hủy gói "${cancelling.title}" của ${cancelling.studentName}? Mọi buổi trong gói sẽ bị hủy.`}
          confirmLabel="Xác nhận hủy"
          withReason
          isLoading={cancelMutation.isPending}
          errorMessage={cancelMutation.isError ? getErrorMessage(cancelMutation.error) : null}
          onConfirm={handleCancel}
          onClose={() => {
            setCancelling(null);
            cancelMutation.reset();
          }}
        />
      )}
    </Card>
  );
};

/* ============================================================
 *  Lịch dạy (booking của học viên)
 * ============================================================ */
const TeachingScheduleCard: React.FC = () => {
  const toast = useToast();
  const [listType, setListType] = useState<ScheduleListType>('upcoming');
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const rejectMutation = useRejectRescheduleRequest();
  const scheduleQuery = useMentorSchedule(listType, page);
  const statusMutation = useUpdateBookingStatus();
  const cancelMutation = useCancelBooking();
  const bookings = scheduleQuery.data?.data ?? [];

  const handleStatus = (booking: Booking, status: 'completed' | 'no_show') => {
    statusMutation.mutate(
      { bookingId: booking.bookingId, status },
      {
        onSuccess: () => toast.success(status === 'completed' ? 'Đã ghi nhận buổi học' : 'Đã ghi nhận học viên vắng mặt'),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleCancel = (reason: string) => {
    if (!cancelling) return;
    cancelMutation.mutate(
      { bookingId: cancelling.bookingId, reason },
      {
        onSuccess: () => {
          toast.success('Đã hủy lịch hẹn');
          setCancelling(null);
        },
      },
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-slate-900">Lịch dạy</h2>
        <div className="flex gap-2">
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
                'h-8 px-3 rounded-lg text-xs font-semibold transition-colors',
                listType === type ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {scheduleQuery.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải lịch dạy…</p>
      ) : scheduleQuery.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(scheduleQuery.error)}</p>
      ) : bookings.length === 0 ? (
        <p className="py-10 text-center text-slate-400 text-xs">
          {listType === 'upcoming' ? 'Chưa có buổi dạy nào sắp tới (gói chưa thanh toán sẽ hiện ở trạng thái Chờ thanh toán).' : 'Chưa có buổi dạy nào.'}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {bookings.map((b) => {
            const active = isActiveBooking(b.status);
            const started = new Date(b.startTime).getTime() <= Date.now();
            // Chỉ dời được trước giờ học ít nhất RESCHEDULE_DEADLINE_HOURS giờ
            const canReschedule =
              new Date(b.startTime).getTime() - Date.now() > RESCHEDULE_DEADLINE_HOURS * 3600 * 1000;
            return (
              <li key={b.bookingId} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatDayLabel(b.startTime)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>
                    <Badge variant={BOOKING_STATUS_VARIANT[b.status]} size="sm">
                      {BOOKING_STATUS_LABEL[b.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Học viên {b.studentName} · {formatVND(b.price)}
                    {b.cancelReason ? ` · Lý do hủy: ${b.cancelReason}` : ''}
                  </p>
                  {b.topic && <p className="text-xs text-slate-700 mt-0.5">Nội dung: {b.topic}</p>}
                  {active && b.rescheduleRequestedAt && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1.5">
                      <p className="font-bold flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Học viên xin dời
                        {b.reschedulePreferredTime
                          ? ` sang ${formatDayLabel(b.reschedulePreferredTime)} · ${formatTime(b.reschedulePreferredTime)}`
                          : ' (chưa chọn giờ, hãy liên hệ học viên)'}
                      </p>
                      {b.rescheduleRequestNote && <p>Lý do: {b.rescheduleRequestNote}</p>}
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={CalendarClock}
                          disabled={!canReschedule}
                          onClick={() => setRescheduling(b)}
                        >
                          Dời lịch
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRejecting(b)}>
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {active && (
                  <div className="flex items-center gap-2 shrink-0">
                    {b.meetingUrl && (
                      <Button variant="secondary" size="sm" leftIcon={Video} onClick={() => window.open(b.meetingUrl as string, '_blank')}>
                        Vào phòng
                      </Button>
                    )}
                    {started ? (
                      // Chỉ buổi đã thanh toán (confirmed) mới ghi nhận kết quả được
                      b.status === 'confirmed' && <>
                        <Button variant="success" size="sm" disabled={statusMutation.isPending} onClick={() => handleStatus(b, 'completed')}>
                          Đã dạy
                        </Button>
                        <Button variant="outline" size="sm" disabled={statusMutation.isPending} onClick={() => handleStatus(b, 'no_show')}>
                          Vắng mặt
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={CalendarClock}
                          disabled={!canReschedule}
                          title={canReschedule ? 'Dời buổi sang giờ khác' : `Chỉ dời được trước giờ học ít nhất ${RESCHEDULE_DEADLINE_HOURS} giờ`}
                          onClick={() => setRescheduling(b)}
                        >
                          Dời lịch
                        </Button>
                        {/* Buổi của gói chưa thanh toán: hủy cả gói ở mục Gói kèm 1-1 */}
                        {b.status === 'confirmed' && (
                          <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setCancelling(b)}>
                            Hủy
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={scheduleQuery.data?.totalPages ?? 0} onChange={setPage} />

      {rescheduling && <RescheduleModal booking={rescheduling} onClose={() => setRescheduling(null)} />}
      {rejecting && (
        <ConfirmModal
          title="Từ chối yêu cầu dời lịch"
          message={`Giữ nguyên buổi ${formatDayLabel(rejecting.startTime)} · ${formatTime(rejecting.startTime)} với học viên ${rejecting.studentName}? Học viên sẽ nhận thông báo.`}
          confirmLabel="Từ chối yêu cầu"
          withReason
          isLoading={rejectMutation.isPending}
          errorMessage={rejectMutation.isError ? getErrorMessage(rejectMutation.error) : null}
          onConfirm={(reason) =>
            rejectMutation.mutate(
              { bookingId: rejecting.bookingId, reason },
              {
                onSuccess: () => {
                  toast.success('Đã từ chối yêu cầu dời lịch');
                  setRejecting(null);
                },
              },
            )
          }
          onClose={() => {
            setRejecting(null);
            rejectMutation.reset();
          }}
        />
      )}
      {cancelling && (
        <ConfirmModal
          title="Hủy lịch hẹn"
          message={`Hủy buổi với học viên ${cancelling.studentName} lúc ${formatDayLabel(cancelling.startTime)} · ${formatTime(cancelling.startTime)}?`}
          confirmLabel="Xác nhận hủy"
          withReason
          isLoading={cancelMutation.isPending}
          errorMessage={cancelMutation.isError ? getErrorMessage(cancelMutation.error) : null}
          onConfirm={handleCancel}
          onClose={() => {
            setCancelling(null);
            cancelMutation.reset();
          }}
        />
      )}
    </Card>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */
/**
 * Mentor dời 1 buổi: chọn ngày + giờ bắt đầu mới, giờ kết thúc tự tính theo thời lượng cũ (BE cũng giữ nguyên).
 * Hiện lịch rảnh của học viên, giờ mới ngoài lịch rảnh thì cảnh báo nhưng vẫn cho dời.
 */
const RescheduleModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
  const toast = useToast();
  const rescheduleMutation = useRescheduleBooking();
  const overviewQuery = useStudentOverview(booking.studentId);
  const slots = overviewQuery.data?.availableSlots ?? [];
  const bounds = scheduleDateBounds();
  const minutes = durationMinutes(booking.startTime, booking.endTime);

  // Học viên đã xin dời kèm giờ mong muốn → điền sẵn giờ đó
  const initial = booking.reschedulePreferredTime ?? booking.startTime;
  const [date, setDate] = useState(toDateInput(initial));
  const [startTime, setStartTime] = useState(toTimeInput(initial));
  const [reason, setReason] = useState(booking.rescheduleRequestNote ? 'Theo yêu cầu của học viên' : '');

  const newStartIso = date && startTime ? toUtcIso(date, startTime) : '';
  const newEndIso = newStartIso ? new Date(new Date(newStartIso).getTime() + minutes * 60000).toISOString() : '';
  const endTime = newEndIso ? toTimeInput(newEndIso) : '';
  const sameTime = newStartIso === new Date(booking.startTime).toISOString();
  const timeError = !newStartIso
    ? 'Chọn ngày và giờ bắt đầu mới'
    : sameTime
      ? 'Giờ mới đang trùng giờ hiện tại'
      : validateSessionTime(date, startTime, endTime);
  const outside = !timeError && !isWithinSlots(newStartIso, newEndIso, slots);

  const handleSubmit = () => {
    if (timeError) return;
    rescheduleMutation.mutate(
      { bookingId: booking.bookingId, newStartTime: newStartIso, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã dời lịch, học viên sẽ nhận thông báo');
          onClose();
        },
      },
    );
  };

  return (
    <ModalShell title="Dời lịch buổi học" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Học viên <b>{booking.studentName}</b> · hiện tại{' '}
          <b>
            {formatDayLabel(booking.startTime)} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </b>
          {booking.topic ? ` · ${booking.topic}` : ''}
        </p>
        <AvailableSlotChips slots={slots} label="Lịch rảnh học viên" />
        <div className="grid grid-cols-[1fr_110px_110px] gap-2 items-end">
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Ngày mới</span>
            <input
              type="date"
              min={bounds.min}
              max={bounds.max}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Bắt đầu</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Kết thúc</span>
            <input
              value={endTime}
              readOnly
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500"
            />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Giữ nguyên thời lượng {minutes} phút (học phí không đổi). Chỉ dời được trước giờ học ít nhất{' '}
          {RESCHEDULE_DEADLINE_HOURS} giờ.
        </p>
        {timeError && <p className="text-xs text-rose-600 font-semibold">{timeError}</p>}
        {outside && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 flex gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>Giờ mới nằm ngoài lịch rảnh của học viên. Vẫn dời được, nhưng hãy chắc chắn đã báo trước với học viên.</p>
          </div>
        )}
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Lý do (gửi kèm thông báo cho học viên)</span>
          <textarea
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Mentor có việc đột xuất"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC]"
          />
        </label>
        {rescheduleMutation.isError && (
          <p className="text-xs text-rose-600 font-semibold">{getErrorMessage(rescheduleMutation.error)}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={CalendarClock}
            disabled={Boolean(timeError)}
            isLoading={rescheduleMutation.isPending}
            onClick={handleSubmit}
          >
            Dời lịch
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

/** Hộp thoại xác nhận, có thể kèm ô nhập lý do */
const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  withReason?: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}> = ({ title, message, confirmLabel, withReason, isLoading, errorMessage, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-sm text-slate-700">{message}</p>
      {withReason && (
        <label className="block space-y-1 mt-3">
          <span className={LABEL_CLASS}>Lý do (không bắt buộc)</span>
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC]"
          />
        </label>
      )}
      {errorMessage && <p className="mt-3 text-xs text-rose-600 font-semibold">{errorMessage}</p>}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" size="md" onClick={onClose}>
          Đóng
        </Button>
        <Button variant="danger" size="md" isLoading={isLoading} onClick={() => onConfirm(reason.trim())}>
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
};

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div>{children}</div>
    </div>
  </div>
);

export default MentorScheduleView;
