/**
 * StudyScheduleView — Lịch học của người học (Dev 5)
 * -----------------------------------------------------------
 * Chỉ USER / STUDENT (BE chặn role khác). Vào từ dropdown avatar → "Study Schedule".
 * Học viên KHÔNG tự tạo lịch nữa: lịch học = các buổi kèm 1-1 mentor xếp trong gói đã thanh toán.
 * - Danh sách 30 ngày tới (mặc định của BE), lọc theo trạng thái buổi, phân trang.
 * - Buổi đã xác nhận: "Vào phòng" (có link) và "Xin dời lịch" (dùng chung popup với trang Mentor 1-1,
 *   trước giờ học ít nhất RESCHEDULE_DEADLINE_HOURS giờ). Hủy buổi làm ở trang Mentor 1-1.
 * BE tự gửi thông báo nhắc trước giờ học (BookingReminderJob).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarClock, Clock, UserRound, Video } from 'lucide-react';
import { RescheduleRequestModal } from '@/portals/client/features/schedules';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Feedback';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  RESCHEDULE_DEADLINE_HOURS,
  durationMinutes,
  formatDayLabel,
  formatTime,
  useMyStudySchedules,
} from '@/shared/schedule';
import type { Booking, StudyScheduleStatus } from '@/shared/types';

/** Tab lọc trạng thái ('' = tất cả) */
const STATUS_TABS: [StudyScheduleStatus | '', string][] = [
  ['', 'Tất cả'],
  ['confirmed', 'Sắp học'],
  ['completed', BOOKING_STATUS_LABEL.completed],
  ['no_show', BOOKING_STATUS_LABEL.no_show],
  ['cancelled', BOOKING_STATUS_LABEL.cancelled],
];

const StudyScheduleView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            <CalendarClock className="w-3.5 h-3.5" />
            Study Schedule
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lịch học của tôi
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
            Các buổi kèm 1-1 mentor đã xếp cho bạn. Hệ thống sẽ gửi thông báo nhắc trước giờ học.
          </p>
        </div>
        <Link to={CLIENT_ROUTES.schedule} className="shrink-0">
          <Button variant="outline" size="sm" rightIcon={ArrowRight}>
            Quản lý ở Mentor 1-1
          </Button>
        </Link>
      </header>

      <ScheduleListCard />
    </div>
  );
};

/* ============================================================
 *  Danh sách buổi học (30 ngày tới)
 * ============================================================ */
const ScheduleListCard: React.FC = () => {
  const [status, setStatus] = useState<StudyScheduleStatus | ''>('');
  const [page, setPage] = useState(0);
  const [requesting, setRequesting] = useState<Booking | null>(null);

  const listQuery = useMyStudySchedules(status || undefined, page);
  const sessions = listQuery.data?.data ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Lịch sắp tới</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Từ hôm nay đến 30 ngày tới</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(0);
              }}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-semibold transition-colors',
                status === value ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {listQuery.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải lịch học…</p>
      ) : listQuery.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(listQuery.error)}</p>
      ) : sessions.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-slate-400 text-xs">Chưa có buổi học nào trong 30 ngày tới.</p>
          <Link to={CLIENT_ROUTES.schedule} className="text-xs font-semibold text-[#0052CC] hover:underline">
            Đăng ký kèm 1-1 với mentor
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {sessions.map((item) => (
            <SessionRow key={item.bookingId} session={item} onRequestReschedule={() => setRequesting(item)} />
          ))}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={listQuery.data?.totalPages ?? 0} onChange={setPage} />

      {requesting && <RescheduleRequestModal booking={requesting} onClose={() => setRequesting(null)} />}
    </Card>
  );
};

/* ============================================================
 *  1 buổi học
 * ============================================================ */
const SessionRow: React.FC<{ session: Booking; onRequestReschedule: () => void }> = ({
  session,
  onRequestReschedule,
}) => {
  const now = Date.now();
  // Chỉ buổi đã xác nhận, chưa kết thúc mới vào phòng được
  const canJoin = session.status === 'confirmed' && !!session.meetingUrl && new Date(session.endTime).getTime() > now;
  // Xin dời: buổi đã xác nhận, chưa bắt đầu; sát giờ (dưới N giờ) thì khóa nút giống trang Mentor 1-1
  const canReschedule = session.status === 'confirmed' && new Date(session.startTime).getTime() > now;
  const tooLate = new Date(session.startTime).getTime() - now <= RESCHEDULE_DEADLINE_HOURS * 3600 * 1000;

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-900 tabular-nums">
            {formatDayLabel(session.startTime)} · {formatTime(session.startTime)} – {formatTime(session.endTime)}
          </p>
          <Badge variant={BOOKING_STATUS_VARIANT[session.status]} size="sm">
            {BOOKING_STATUS_LABEL[session.status]}
          </Badge>
          {session.rescheduleRequestedAt && session.status === 'confirmed' && (
            <Badge variant="warning" size="sm">
              Đang xin dời lịch
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <UserRound className="w-3 h-3" />
            Mentor {session.mentorName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationMinutes(session.startTime, session.endTime)} phút
          </span>
          {session.topic && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">{session.topic}</span>
            </span>
          )}
        </p>
        {session.status === 'cancelled' && session.cancelReason && (
          <p className="text-xs text-slate-400 mt-0.5">Lý do hủy: {session.cancelReason}</p>
        )}
      </div>

      {(canJoin || canReschedule) && (
        <div className="flex items-center gap-2 shrink-0">
          {canJoin && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Video}
              onClick={() => window.open(session.meetingUrl as string, '_blank')}
            >
              Vào phòng
            </Button>
          )}
          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={CalendarClock}
              disabled={tooLate}
              title={
                tooLate
                  ? `Chỉ xin dời trước giờ học ít nhất ${RESCHEDULE_DEADLINE_HOURS} giờ`
                  : `Gửi yêu cầu cho mentor, trước giờ học ít nhất ${RESCHEDULE_DEADLINE_HOURS} giờ`
              }
              onClick={onRequestReschedule}
            >
              {session.rescheduleRequestedAt ? 'Sửa yêu cầu dời' : 'Xin dời lịch'}
            </Button>
          )}
        </div>
      )}
    </li>
  );
};

export default StudyScheduleView;
