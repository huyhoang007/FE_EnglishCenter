/**
 * BookingManagementView — Admin quản lý lịch hẹn 1-1 (Dev 5 — TASK D5-14)
 * -----------------------------------------------------------
 * Xem, lọc theo trạng thái và hủy các lịch hẹn bất thường (không áp dụng thời hạn hủy).
 */

import React, { useState } from 'react';
import { CalendarDays, RotateCcw, X, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { formatVND } from '@/shared/utils';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatDate,
  formatTime,
  isActiveBooking,
  useAdminBookings,
  useAdminCancelBooking,
} from '@/shared/schedule';
import type { Booking, BookingStatus } from '@/shared/types';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[];

export const BookingManagementView: React.FC = () => {
  const toast = useToast();
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');

  const bookingsQuery = useAdminBookings({ status, page, size: PAGE_SIZE });
  const cancelMutation = useAdminCancelBooking();
  const bookings = bookingsQuery.data?.data ?? [];

  const handleCloseCancel = () => {
    setCancelling(null);
    setReason('');
    cancelMutation.reset();
  };

  const handleConfirmCancel = () => {
    if (!cancelling) return;
    cancelMutation.mutate(
      { bookingId: cancelling.bookingId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Đã hủy lịch hẹn');
          handleCloseCancel();
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* ================= TITLE BAR ================= */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bookings</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Lịch hẹn 1-1 giữa học viên và mentor. Admin có thể hủy lịch hẹn bất thường.
        </p>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookingStatus | '');
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setPage(0);
            }}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <span className="ml-auto text-xs text-slate-500">
            Tổng: <span className="font-bold text-slate-700">{bookingsQuery.data?.totalElements ?? 0}</span> lịch hẹn
          </span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {bookingsQuery.isLoading && (
          <p className="py-14 text-center text-slate-400 text-xs">Đang tải lịch hẹn…</p>
        )}
        {bookingsQuery.isError && (
          <p className="py-14 text-center text-rose-600 text-xs">{getErrorMessage(bookingsQuery.error)}</p>
        )}
        {!bookingsQuery.isLoading && !bookingsQuery.isError && bookings.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">Chưa có lịch hẹn nào</p>
          </div>
        )}
        {bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 pl-5 pr-3 font-bold">Học viên</th>
                  <th className="py-3 px-3 font-bold">Mentor</th>
                  <th className="py-3 px-3 font-bold">Thời gian</th>
                  <th className="py-3 px-3 font-bold">Học phí</th>
                  <th className="py-3 px-3 font-bold">Trạng thái</th>
                  <th className="py-3 px-3 font-bold">Ngày đặt</th>
                  <th className="py-3 pr-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50/60">
                    <td className="py-3 pl-5 pr-3 font-bold text-slate-900">{b.studentName}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{b.mentorName}</td>
                    <td className="py-3 px-3 text-slate-700 tabular-nums">
                      {formatDate(b.startTime)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{formatVND(b.price)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={BOOKING_STATUS_VARIANT[b.status]} size="sm">
                        {BOOKING_STATUS_LABEL[b.status]}
                      </Badge>
                      {b.cancelReason && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[180px]">{b.cancelReason}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {b.createdAt ? formatDate(b.createdAt) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {isActiveBooking(b.status) && (
                        <button
                          type="button"
                          onClick={() => setCancelling(b)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Hủy lịch hẹn"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-slate-100">
          <Pagination currentPage={page} totalPages={bookingsQuery.data?.totalPages ?? 0} onChange={setPage} />
        </div>
      </div>

      {/* ================= MODAL: CANCEL BOOKING ================= */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Hủy lịch hẹn</h3>
              <button
                type="button"
                onClick={handleCloseCancel}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-700">
              Hủy buổi giữa học viên <span className="font-bold">{cancelling.studentName}</span> và mentor{' '}
              <span className="font-bold">{cancelling.mentorName}</span> lúc {formatDate(cancelling.startTime)} ·{' '}
              {formatTime(cancelling.startTime)}? Cả hai bên sẽ nhận được thông báo.
            </p>
            <label className="block space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Lý do (không bắt buộc)</span>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC]"
              />
            </label>
            {cancelMutation.isError && (
              <p className="text-xs text-rose-600 font-semibold">{getErrorMessage(cancelMutation.error)}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={handleCloseCancel}>
                Đóng
              </Button>
              <Button variant="danger" size="md" isLoading={cancelMutation.isPending} onClick={handleConfirmCancel}>
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagementView;
