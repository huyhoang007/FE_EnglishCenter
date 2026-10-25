/**
 * Notification Service — gọi Backend (Dev 5 — TASK-D5-02)
 * -----------------------------------------------------------
 *   GET /api/v1/notifications              → PageResponse<AppNotification>
 *   GET /api/v1/notifications/unread-count → number
 *   PUT /api/v1/notifications/{id}/read    → AppNotification
 *   PUT /api/v1/notifications/read-all     → number (số thông báo vừa đánh dấu)
 */

import { apiGet, apiPut } from '@/shared/api/axiosClient';
import type { ApiResponse, AppNotification, PageResponse } from '@/shared/types';

const BASE = '/api/v1/notifications';

export const getMyNotificationsApi = (
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<AppNotification>>> =>
  apiGet<PageResponse<AppNotification>>(BASE, { params: { page, size } });

export const getUnreadCountApi = (): Promise<ApiResponse<number>> =>
  apiGet<number>(`${BASE}/unread-count`);

export const markNotificationReadApi = (notificationId: string): Promise<ApiResponse<AppNotification>> =>
  apiPut<AppNotification>(`${BASE}/${notificationId}/read`);

export const markAllNotificationsReadApi = (): Promise<ApiResponse<number>> =>
  apiPut<number>(`${BASE}/read-all`);
