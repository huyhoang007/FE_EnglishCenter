/**
 * MentorDashboardView — Trang tổng quan của mentor (Dev 5)
 * -----------------------------------------------------------
 * Trang mentor thấy ngay sau khi đăng nhập (URL client: /mentor-dashboard; portal cũ: /mentor).
 * Chỉ gọi các API mentor đã có quyền, dữ liệu thật từ BE:
 *   GET /api/v1/mentor/bookings?type=upcoming          → buổi dạy sắp tới
 *   GET /api/v1/mentor/consultation-requests?mine=     → yêu cầu tư vấn mới / tôi phụ trách
 *   GET /api/v1/mentor/mentoring-plans                 → gói kèm 1-1 chờ học viên thanh toán
 *   GET (hàng đợi chấm bài thi Writing / Speaking)     → bài thi chờ chấm
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Headset,
  Inbox,
  Phone,
  UserCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatDayLabel,
  formatTime,
  useMentorConsultations,
  useMentorPlans,
  useMentorSchedule,
} from '@/shared/schedule';
import { usePendingAttempts } from '@/portals/mentor/features/exam-grading';

/** Số dòng tối đa mỗi khối danh sách */
const PREVIEW_SIZE = 5;

const formatVnd = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} ₫`;

const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const MentorDashboardView: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const userName = useAuthStore((s) => s.userName);

  const upcomingQuery = useMentorSchedule('upcoming', 0);
  const newConsultQuery = useMentorConsultations(false, 0);
  const myConsultQuery = useMentorConsultations(true, 0);
  const plansQuery = useMentorPlans(0);
  const gradingQuery = usePendingAttempts(0);

  const upcoming = (upcomingQuery.data?.data ?? []).slice(0, PREVIEW_SIZE);
  const newConsults = (newConsultQuery.data?.data ?? []).slice(0, PREVIEW_SIZE);
  const pendingPlans = (plansQuery.data?.data ?? []).filter((p) => p.status === 'pending_payment').slice(0, PREVIEW_SIZE);
  const gradingAttempts = (gradingQuery.data?.data ?? []).slice(0, PREVIEW_SIZE);

  const count = (n: number | undefined, loading: boolean) => (loading ? '…' : (n ?? 0).toLocaleString('vi-VN'));

  return (
    <div className="space-y-6">
      {/* ============ Lời chào ============ */}
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Mentor workspace</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {greeting()}, {user?.fullName || userName || 'Mentor'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">Tổng quan lịch dạy, yêu cầu tư vấn và bài cần chấm của bạn.</p>
      </header>

      {/* ============ KPI ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <StatCard
          title="Buổi dạy sắp tới"
          value={count(upcomingQuery.data?.totalElements, upcomingQuery.isLoading)}
          subtext="Đã xác nhận / chờ thanh toán"
          icon={CalendarClock}
          colorScheme="blue"
        />
        <StatCard
          title="Yêu cầu tư vấn mới"
          value={count(newConsultQuery.data?.totalElements, newConsultQuery.isLoading)}
          subtext="Chưa mentor nào nhận"
          icon={Headset}
          colorScheme="amber"
        />
        <StatCard
          title="Tư vấn tôi phụ trách"
          value={count(myConsultQuery.data?.totalElements, myConsultQuery.isLoading)}
          subtext="Học viên đã nhận tư vấn"
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Bài thi chờ chấm"
          value={count(gradingQuery.data?.totalElements, gradingQuery.isLoading)}
          subtext="Writing / Speaking"
          icon={ClipboardCheck}
          colorScheme="purple"
        />
      </div>

      {/* ============ Danh sách ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Buổi dạy sắp tới */}
        <Section
          title="Buổi dạy sắp tới"
          icon={CalendarClock}
          linkTo={CLIENT_ROUTES.teachingSchedule}
          linkLabel="Xem lịch dạy"
          isLoading={upcomingQuery.isLoading}
          error={upcomingQuery.isError ? getErrorMessage(upcomingQuery.error) : null}
          onRetry={() => upcomingQuery.refetch()}
          emptyText="Chưa có buổi dạy nào sắp tới."
          isEmpty={upcoming.length === 0}
        >
          {upcoming.map((b) => (
            <li key={b.bookingId} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {formatDayLabel(b.startTime)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}
                </p>
                <p className="text-xs text-slate-500 truncate">Học viên {b.studentName}</p>
              </div>
              <Badge variant={BOOKING_STATUS_VARIANT[b.status]} size="sm">
                {BOOKING_STATUS_LABEL[b.status]}
              </Badge>
            </li>
          ))}
        </Section>

        {/* Yêu cầu tư vấn mới */}
        <Section
          title="Yêu cầu tư vấn mới"
          icon={Headset}
          linkTo={CLIENT_ROUTES.mentorStudents}
          linkLabel="Nhận tư vấn"
          isLoading={newConsultQuery.isLoading}
          error={newConsultQuery.isError ? getErrorMessage(newConsultQuery.error) : null}
          onRetry={() => newConsultQuery.refetch()}
          emptyText="Không có yêu cầu tư vấn mới."
          isEmpty={newConsults.length === 0}
        >
          {newConsults.map((c) => (
            <li key={c.requestId} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{c.studentName}</p>
                <p className="text-xs text-slate-500 truncate">
                  {c.targetCertificateName
                    ? `Mục tiêu ${c.targetCertificateName}${c.targetScore != null ? ` ${c.targetScore}` : ''}`
                    : 'Chưa đặt mục tiêu'}
                  {c.currentLevel ? ` · Trình độ ${c.currentLevel}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] shrink-0">
                <Phone className="w-3.5 h-3.5" /> {c.phone}
              </span>
            </li>
          ))}
        </Section>

        {/* Bài thi chờ chấm */}
        <Section
          title="Bài thi chờ chấm"
          icon={ClipboardCheck}
          linkTo={CLIENT_ROUTES.examGrading}
          linkLabel="Vào chấm bài"
          isLoading={gradingQuery.isLoading}
          error={gradingQuery.isError ? getErrorMessage(gradingQuery.error) : null}
          onRetry={() => gradingQuery.refetch()}
          emptyText="Không còn bài thi nào chờ chấm."
          isEmpty={gradingAttempts.length === 0}
        >
          {gradingAttempts.map((a) => (
            <li key={a.attemptId} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{a.studentName ?? a.studentEmail ?? 'Học viên'}</p>
                <p className="text-xs text-slate-500 truncate">{a.examTitle}</p>
              </div>
              {a.endTime && (
                <span className="text-xs text-slate-400 shrink-0">Nộp {formatDayLabel(a.endTime)}</span>
              )}
            </li>
          ))}
        </Section>

        {/* Gói kèm 1-1 chờ thanh toán */}
        <Section
          title="Gói kèm 1-1 chờ thanh toán"
          icon={Wallet}
          linkTo={CLIENT_ROUTES.teachingSchedule}
          linkLabel="Quản lý gói"
          isLoading={plansQuery.isLoading}
          error={plansQuery.isError ? getErrorMessage(plansQuery.error) : null}
          onRetry={() => plansQuery.refetch()}
          emptyText="Không có gói nào đang chờ học viên thanh toán."
          isEmpty={pendingPlans.length === 0}
        >
          {pendingPlans.map((p) => (
            <li key={p.planId} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                <p className="text-xs text-slate-500 truncate">
                  {p.studentName} · {p.totalSessions} buổi
                </p>
              </div>
              <span className="text-sm font-bold text-slate-800 shrink-0">{formatVnd(p.totalPrice)}</span>
            </li>
          ))}
        </Section>
      </div>
    </div>
  );
};

/* ---------- Khung 1 khối danh sách ---------- */
const Section: React.FC<{
  title: string;
  icon: LucideIcon;
  linkTo: string;
  linkLabel: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, linkTo, linkLabel, isLoading, error, onRetry, isEmpty, emptyText, children }) => (
  <Card className="flex flex-col">
    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Icon className="w-4 h-4 text-[#0052CC]" /> {title}
      </h2>
      <Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:underline shrink-0"
      >
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
    {isLoading ? (
      <div className="space-y-2 pt-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    ) : error ? (
      <ErrorState className="mt-3" message={error} onRetry={onRetry} />
    ) : isEmpty ? (
      <div className="py-10 text-center text-slate-400 text-xs space-y-2">
        <Inbox className="w-7 h-7 text-slate-300 mx-auto" />
        <p className="font-semibold text-slate-500">{emptyText}</p>
      </div>
    ) : (
      <ul className="divide-y divide-slate-100">{children}</ul>
    )}
  </Card>
);

export default MentorDashboardView;
