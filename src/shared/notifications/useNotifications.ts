/**
 * useNotifications — hooks TanStack Query cho thông báo (dùng chung 3 portal)
 * -----------------------------------------------------------
 * - Chỉ gọi API khi đã đăng nhập thật bằng BE (token demo bắt đầu bằng "mock." thì bỏ qua).
 * - Realtime qua WebSocket STOMP (useNotificationRealtime): có thông báo mới thì tải lại ngay.
 * - Vẫn tự cập nhật mỗi 30 giây để dự phòng khi mất kết nối WebSocket.
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import {
  getMyNotificationsApi,
  getUnreadCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from './notificationService';
import { connectNotificationSocket } from './notificationSocket';

const POLL_INTERVAL_MS = 30_000;

/** true nếu đang đăng nhập bằng tài khoản BE thật */
export function useCanCallNotificationApi(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  return !!accessToken && !accessToken.startsWith('mock.');
}

/**
 * Nhận thông báo realtime qua WebSocket (/ws-connect, topic /topic/notifications/{userId}).
 * Có thông báo mới thì tải lại số chưa đọc + danh sách; thông báo lịch hẹn thì tải lại cả lịch.
 * Gọi 1 lần ở component luôn hiển thị khi đăng nhập (NotificationBell).
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const enabled = useCanCallNotificationApi();

  useEffect(() => {
    if (!enabled || !accessToken || !userId) return undefined;
    return connectNotificationSocket(accessToken, userId, (payload) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
      if ((payload as { type?: string } | null)?.type === 'mentor_session') {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all });
      }
    });
  }, [enabled, accessToken, userId, queryClient]);
}

export function useUnreadNotificationCount() {
  const enabled = useCanCallNotificationApi();
  return useQuery({
    queryKey: QUERY_KEYS.notification.unreadCount,
    queryFn: async () => unwrapOrThrow(await getUnreadCountApi()),
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

/** Danh sách 10 thông báo mới nhất — chỉ tải khi mở dropdown (open = true) */
export function useNotificationList(open: boolean) {
  const enabled = useCanCallNotificationApi() && open;
  return useQuery({
    queryKey: QUERY_KEYS.notification.list,
    queryFn: async () => unwrapOrThrow(await getMyNotificationsApi(0, 10)),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      unwrapOrThrow(await markNotificationReadApi(notificationId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrapOrThrow(await markAllNotificationsReadApi()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all }),
  });
}
