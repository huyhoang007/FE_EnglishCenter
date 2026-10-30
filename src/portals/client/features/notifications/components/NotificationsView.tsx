/**
 * NotificationsView — trang tất cả thông báo (Dev 5 — TASK-D5-02)
 * -----------------------------------------------------------
 * - Danh sách đầy đủ, phân trang (GET /api/v1/notifications?page=&size=).
 * - Bấm 1 thông báo: đánh dấu đã đọc rồi chuyển tới trang liên quan (nếu có).
 * - "Đánh dấu tất cả đã đọc" (PUT /api/v1/notifications/read-all).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { AppNotification } from '@/shared/types';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPage,
  useUnreadNotificationCount,
} from '@/shared/notifications/useNotifications';
import {
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
  getNotificationLink,
  notificationTimeAgo,
} from '@/shared/notifications/notificationLink';

const PAGE_SIZE = 20;

export const NotificationsView: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const role = useAuthStore((s) => s.role);
  const [page, setPage] = useState(0);

  const pageQuery = useNotificationPage(page, PAGE_SIZE);
  const unreadQuery = useUnreadNotificationCount();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications: AppNotification[] = pageQuery.data?.data ?? [];
  const totalPages = pageQuery.data?.totalPages ?? 0;
  const totalElements = pageQuery.data?.totalElements ?? 0;
  const unread = unreadQuery.data ?? 0;

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) markOne.mutate(n.notificationId);
    const link = getNotificationLink(n.type, role, n.title);
    if (link) navigate(link);
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            <Bell className="w-3.5 h-3.5" />
            Thông báo
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tất cả thông báo
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {totalElements} thông báo · <span className="font-bold text-slate-800">{unread}</span> chưa đọc
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="md"
            leftIcon={CheckCheck}
            isLoading={markAll.isPending}
            onClick={handleMarkAll}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </header>

      {/* ============== DANH SÁCH ============== */}
      {pageQuery.isLoading ? (
        <Card className="flex justify-center py-10 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </Card>
      ) : pageQuery.isError ? (
        <ErrorState message={getErrorMessage(pageQuery.error)} onRetry={() => pageQuery.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState title="Chưa có thông báo nào" description="Thông báo về lịch học, thanh toán và kết quả bài làm sẽ hiện ở đây." />
      ) : (
        <Card noPadding>
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const hasLink = !!getNotificationLink(n.type, role, n.title);
              return (
                <li key={n.notificationId}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-5 py-4 flex gap-4 transition-colors hover:bg-slate-50',
                      !n.isRead && 'bg-blue-50/50',
                    )}
                  >
                    <span
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0"
                      aria-hidden="true"
                    >
                      {NOTIFICATION_TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('text-sm text-slate-900', !n.isRead ? 'font-extrabold' : 'font-semibold')}>
                          {n.title}
                        </p>
                        <Badge variant="neutral" size="sm">
                          {NOTIFICATION_TYPE_LABEL[n.type] ?? 'Chung'}
                        </Badge>
                        {!n.isRead && (
                          <Badge variant="primary" size="sm">
                            Mới
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">
                        {n.message}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {notificationTimeAgo(n.createdAt)} · {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {hasLink && <ChevronRight className="w-4 h-4 text-slate-400 self-center shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default NotificationsView;
