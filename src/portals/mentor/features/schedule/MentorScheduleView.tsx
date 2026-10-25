/**
 * MentorScheduleView — Lịch dạy 1-1 của Mentor (Dev 5 — TASK D5-02, D5-03, D5-04, D5-11, D5-13)
 * -----------------------------------------------------------
 * - Mở khung giờ rảnh (slot) theo ngày và giờ.
 * - Quản lý slot chưa kết thúc: sửa, đóng / mở lại, xóa (chỉ khi chưa có học viên đặt).
 * - Lịch dạy sắp tới / đã qua: hủy buổi, ghi nhận "Đã dạy" / "Vắng mặt" sau giờ bắt đầu.
 * Thời gian nhập theo giờ máy, gửi BE dạng UTC.
 */

import React, { useState } from 'react';
import { CalendarPlus, Clock, Edit2, Lock, Trash2, Unlock, Video, X, XCircle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils/cn';
import { formatVND } from '@/shared/utils';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  SLOT_STATUS_LABEL,
  SLOT_STATUS_VARIANT,
  formatDayLabel,
  formatTime,
  isActiveBooking,
  toDateInput,
  toTimeInput,
  toUtcIso,
  useCancelBooking,
  useCreateSlot,
  useDeleteSlot,
  useMentorSchedule,
  useMySlots,
  useUpdateBookingStatus,
  useUpdateSlot,
} from '@/shared/schedule';
import type { Booking, MentorScheduleSlot, ScheduleListType } from '@/shared/types';

const INPUT_CLASS =
  'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0052CC]';
const LABEL_CLASS = 'text-xs text-slate-500 font-semibold uppercase tracking-wider';

const MentorScheduleView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          Mentor workspace
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Lịch dạy 1-1
        </h1>
      </header>

      <CreateSlotCard />
      <MySlotsCard />
      <TeachingScheduleCard />
    </div>
  );
};

/* ============================================================
 *  Mở khung giờ mới
 * ============================================================ */
const CreateSlotCard: React.FC = () => {
  const toast = useToast();
  const createMutation = useCreateSlot();
  const [form, setForm] = useState({
    date: toDateInput(new Date().toISOString()),
    startTime: '19:00',
    endTime: '20:00',
    meetingUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        startTime: toUtcIso(form.date, form.startTime),
        endTime: toUtcIso(form.date, form.endTime),
        meetingUrl: form.meetingUrl.trim() || undefined,
      },
      {
        onSuccess: () => toast.success('Đã mở khung giờ mới'),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Mở khung giờ mới</h2>
        <span className="text-xs text-slate-400 font-medium">Học phí tính theo hourly rate của bạn</span>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[160px_120px_120px_1fr_auto] gap-3 items-end">
        <label className="space-y-1">
          <span className={LABEL_CLASS}>Ngày</span>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL_CLASS}>Bắt đầu</span>
          <input
            type="time"
            required
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL_CLASS}>Kết thúc</span>
          <input
            type="time"
            required
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL_CLASS}>Link phòng học</span>
          <input
            type="url"
            maxLength={500}
            placeholder="https://meet.google.com/..."
            value={form.meetingUrl}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <Button type="submit" variant="primary" size="md" leftIcon={CalendarPlus} isLoading={createMutation.isPending}>
          Mở slot
        </Button>
      </form>
    </Card>
  );
};

/* ============================================================
 *  Khung giờ của tôi (chưa kết thúc)
 * ============================================================ */
const MySlotsCard: React.FC = () => {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<MentorScheduleSlot | null>(null);
  const [deleting, setDeleting] = useState<MentorScheduleSlot | null>(null);
  const slotsQuery = useMySlots(page);
  const updateMutation = useUpdateSlot();
  const deleteMutation = useDeleteSlot();
  const slots = slotsQuery.data?.data ?? [];

  // Đóng slot đang mở / mở lại slot đã đóng, giữ nguyên giờ và link
  const handleToggle = (slot: MentorScheduleSlot) => {
    updateMutation.mutate(
      {
        scheduleId: slot.scheduleId,
        payload: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          meetingUrl: slot.meetingUrl ?? undefined,
          status: slot.status === 'available' ? 'cancelled' : 'available',
        },
      },
      {
        onSuccess: () => toast.success(slot.status === 'available' ? 'Đã đóng khung giờ' : 'Đã mở lại khung giờ'),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.scheduleId, {
      onSuccess: () => {
        toast.success('Đã xóa khung giờ');
        setDeleting(null);
      },
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Khung giờ của tôi</h2>
        <span className="text-xs text-slate-400 font-medium">Chỉ sửa / xóa được khung giờ chưa có học viên đặt</span>
      </div>

      {slotsQuery.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải khung giờ…</p>
      ) : slotsQuery.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(slotsQuery.error)}</p>
      ) : slots.length === 0 ? (
        <p className="py-10 text-center text-slate-400 text-xs">Bạn chưa mở khung giờ nào.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {slots.map((slot) => {
            const editable = slot.status === 'available' || slot.status === 'cancelled';
            return (
              <li key={slot.scheduleId} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatDayLabel(slot.startTime)} · {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                    <Badge variant={SLOT_STATUS_VARIANT[slot.status]} size="sm">
                      {SLOT_STATUS_LABEL[slot.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {formatVND(slot.price)} · {slot.meetingUrl || 'Chưa có link phòng học'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 shrink-0">
                  <IconButton title="Sửa" disabled={!editable} onClick={() => setEditing(slot)} className="text-blue-600 hover:bg-blue-50">
                    <Edit2 className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton
                    title={slot.status === 'available' ? 'Đóng khung giờ' : 'Mở lại khung giờ'}
                    disabled={!editable || updateMutation.isPending}
                    onClick={() => handleToggle(slot)}
                    className="text-slate-500 hover:text-[#0052CC] hover:bg-slate-100"
                  >
                    {slot.status === 'available' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </IconButton>
                  <IconButton title="Xóa" disabled={!editable} onClick={() => setDeleting(slot)} className="text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={slotsQuery.data?.totalPages ?? 0} onChange={setPage} />

      {editing && <EditSlotModal slot={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmModal
          title="Xóa khung giờ"
          message={`Xóa khung giờ ${formatDayLabel(deleting.startTime)} · ${formatTime(deleting.startTime)} – ${formatTime(deleting.endTime)}?`}
          confirmLabel="Xóa"
          isLoading={deleteMutation.isPending}
          errorMessage={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : null}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleting(null);
            deleteMutation.reset();
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
          {listType === 'upcoming' ? 'Chưa có học viên nào đặt lịch sắp tới.' : 'Chưa có buổi dạy nào.'}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {bookings.map((b) => {
            const active = isActiveBooking(b.status);
            const started = new Date(b.startTime).getTime() <= Date.now();
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
                      <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => setCancelling(b)}>
                        Hủy
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={scheduleQuery.data?.totalPages ?? 0} onChange={setPage} />

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
const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  <button
    type="button"
    className={cn('p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none', className)}
    {...props}
  >
    {children}
  </button>
);

/** Sửa giờ / link của slot chưa có người đặt */
const EditSlotModal: React.FC<{ slot: MentorScheduleSlot; onClose: () => void }> = ({ slot, onClose }) => {
  const toast = useToast();
  const updateMutation = useUpdateSlot();
  const [form, setForm] = useState({
    date: toDateInput(slot.startTime),
    startTime: toTimeInput(slot.startTime),
    endTime: toTimeInput(slot.endTime),
    meetingUrl: slot.meetingUrl ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        scheduleId: slot.scheduleId,
        payload: {
          startTime: toUtcIso(form.date, form.startTime),
          endTime: toUtcIso(form.date, form.endTime),
          meetingUrl: form.meetingUrl.trim() || undefined,
          status: slot.status === 'cancelled' ? 'cancelled' : 'available',
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật khung giờ');
          onClose();
        },
      },
    );
  };

  return (
    <ModalShell title="Sửa khung giờ" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Ngày</span>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={INPUT_CLASS} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Bắt đầu</span>
            <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={INPUT_CLASS} />
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Kết thúc</span>
            <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={INPUT_CLASS} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Link phòng học</span>
          <input type="url" maxLength={500} value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} className={INPUT_CLASS} />
        </label>
        {updateMutation.isError && (
          <p className="text-xs text-rose-600 font-semibold">{getErrorMessage(updateMutation.error)}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button type="submit" variant="primary" size="md" leftIcon={Clock} isLoading={updateMutation.isPending}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
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
