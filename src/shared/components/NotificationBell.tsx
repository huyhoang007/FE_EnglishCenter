/**
 * NotificationBell — chuông thông báo dùng chung cho Client / Mentor / Admin
 * -----------------------------------------------------------
 * - Badge số chưa đọc (tự cập nhật mỗi 30 giây).
 * - Bấm chuông: mở danh sách 10 thông báo mới nhất.
 * - Bấm 1 thông báo: đánh dấu đã đọc rồi chuyển tới trang liên quan. Nút "Đọc tất cả": đánh dấu hết.
 * - Nội dung hiện đầy đủ (không cắt chữ). "Xem tất cả thông báo" → trang /notifications.
 * Logic gọi API nằm ở @/shared/notifications (service + hooks).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { getErrorMessage } from '@/shared/api/axiosClient';
import type { AppNotification } from '@/shared/types';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import {
  NOTIFICATION_TYPE_ICON,
  getNotificationLink,
  notificationTimeAgo,
} from '@/shared/notifications/notificationLink';
import {
  useCanCallNotificationApi,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useNotificationRealtime,
  useUnreadNotificationCount,
} from '@/shared/notifications/useNotifications';

export interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const canCallApi = useCanCallNotificationApi();
  const navigate = useNavigate();
  const role = useAuthStore((st) => st.role);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Realtime qua WebSocket (TASK-D5-02); bell có mặt ở cả 3 portal nên mở kết nối ở đây
  useNotificationRealtime();
  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotificationList(open);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = unreadQuery.data ?? 0;
  const notifications: AppNotification[] = listQuery.data?.data ?? [];

  const handleClickItem = (n: AppNotification) => {
    if (!n.isRead) markOne.mutate(n.notificationId);
    const link = getNotificationLink(n.type, role);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate(CLIENT_ROUTES.notifications);
  };

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full hover:bg-slate-100 transition-colors inline-flex items-center justify-center"
        aria-label="Thông báo"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Thông báo</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:underline disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {!canCallApi && (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">
                Đăng nhập bằng tài khoản thật để xem thông báo.
              </p>
            )}

            {canCallApi && listQuery.isLoading && (
              <div className="px-4 py-6 flex justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {canCallApi && listQuery.isError && (
              <p className="px-4 py-6 text-sm text-red-600 text-center">
                {getErrorMessage(listQuery.error)}
              </p>
            )}

            {canCallApi && listQuery.isSuccess && notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">Chưa có thông báo nào.</p>
            )}

            {notifications.length > 0 && (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.notificationId}
                    onClick={() => handleClickItem(n)}
                    className={cn(
                      'px-4 py-3 flex gap-3 cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50',
                      !n.isRead && 'bg-blue-50/50',
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                      {NOTIFICATION_TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm text-slate-900', !n.isRead ? 'font-bold' : 'font-medium')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed whitespace-pre-line break-words">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{notificationTimeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0052CC] mt-1.5 shrink-0" aria-label="Chưa đọc" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canCallApi && (
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full px-4 py-2.5 border-t border-slate-100 text-sm font-semibold text-[#0052CC] hover:bg-slate-50 inline-flex items-center justify-center gap-1"
            >
              Xem tất cả thông báo
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
