/**
 * Schedule Service — gọi Backend (Dev 5 — TASK D5-02 → D5-14)
 * -----------------------------------------------------------
 * Mentor (slot):
 *   POST   /api/v1/mentor/availability              → MentorScheduleSlot
 *   GET    /api/v1/mentor/availability              → PageResponse<MentorScheduleSlot>
 *   PUT    /api/v1/mentor/availability/{id}         → MentorScheduleSlot
 *   DELETE /api/v1/mentor/availability/{id}
 * Public:
 *   GET    /api/v1/mentors/{mentorId}/availability?from=&to= → MentorScheduleSlot[]
 * Booking:
 *   POST   /api/v1/bookings                         → Booking (STUDENT)
 *   PUT    /api/v1/bookings/{id}/cancel             → Booking (STUDENT, MENTOR)
 *   PUT    /api/v1/bookings/{id}/reschedule         → Booking (STUDENT)
 *   GET    /api/v1/me/schedule?type=                → PageResponse<Booking> (STUDENT)
 *   GET    /api/v1/mentor/schedule?type=            → PageResponse<Booking> (MENTOR)
 *   PUT    /api/v1/mentor/bookings/{id}/status      → Booking (MENTOR)
 *   GET    /api/v1/admin/bookings?status=           → PageResponse<Booking> (ADMIN)
 *   PUT    /api/v1/admin/bookings/{id}/cancel       → Booking (ADMIN)
 * Thanh toán buổi kèm (SePay — API của Dev 4):
 *   GET    /api/v1/payments/orders/{orderCode}         → SessionPaymentOrder
 *   POST   /api/v1/payments/orders/{orderCode}/cancel  → SessionPaymentOrder (hủy đơn → booking bị hủy, slot mở lại)
 * Thời gian gửi / nhận dạng ISO-8601 UTC.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  AdminBookingFilter,
  ApiResponse,
  Booking,
  BookingStatus,
  CreateSlotPayload,
  MentorScheduleSlot,
  PageResponse,
  ScheduleListType,
  SessionPaymentOrder,
  UpdateSlotPayload,
} from '@/shared/types';

/* ---------------- Mentor: slot ---------------- */

export const createSlotApi = (payload: CreateSlotPayload): Promise<ApiResponse<MentorScheduleSlot>> =>
  apiPost<MentorScheduleSlot>('/api/v1/mentor/availability', payload);

export const getMySlotsApi = (
  page = 0,
  size = 20,
): Promise<ApiResponse<PageResponse<MentorScheduleSlot>>> =>
  apiGet<PageResponse<MentorScheduleSlot>>('/api/v1/mentor/availability', { params: { page, size } });

export const updateSlotApi = (
  scheduleId: string,
  payload: UpdateSlotPayload,
): Promise<ApiResponse<MentorScheduleSlot>> =>
  apiPut<MentorScheduleSlot>(`/api/v1/mentor/availability/${scheduleId}`, payload);

export const deleteSlotApi = (scheduleId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`/api/v1/mentor/availability/${scheduleId}`);

/* ---------------- Public: lịch trống của mentor ---------------- */

export const getMentorAvailabilityApi = (
  mentorId: string,
  from: string,
  to: string,
): Promise<ApiResponse<MentorScheduleSlot[]>> =>
  apiGet<MentorScheduleSlot[]>(`/api/v1/mentors/${mentorId}/availability`, { params: { from, to } });

/* ---------------- Booking ---------------- */

export const bookSlotApi = (scheduleId: string): Promise<ApiResponse<Booking>> =>
  apiPost<Booking>('/api/v1/bookings', { scheduleId });

export const cancelBookingApi = (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/bookings/${bookingId}/cancel`, { reason: reason || undefined });

export const rescheduleBookingApi = (
  bookingId: string,
  newScheduleId: string,
): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/bookings/${bookingId}/reschedule`, { newScheduleId });

export const getMyScheduleApi = (
  type: ScheduleListType,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<Booking>>> =>
  apiGet<PageResponse<Booking>>('/api/v1/me/schedule', { params: { type, page, size } });

export const getMentorScheduleApi = (
  type: ScheduleListType,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<Booking>>> =>
  apiGet<PageResponse<Booking>>('/api/v1/mentor/schedule', { params: { type, page, size } });

export const updateBookingStatusApi = (
  bookingId: string,
  status: Extract<BookingStatus, 'completed' | 'no_show'>,
): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/mentor/bookings/${bookingId}/status`, { status });

/* ---------------- Thanh toán buổi kèm (SePay) ---------------- */

export const getSessionPaymentApi = (orderCode: string): Promise<ApiResponse<SessionPaymentOrder>> =>
  apiGet<SessionPaymentOrder>(`/api/v1/payments/orders/${encodeURIComponent(orderCode)}`);

export const cancelSessionPaymentApi = (orderCode: string): Promise<ApiResponse<SessionPaymentOrder>> =>
  apiPost<SessionPaymentOrder>(`/api/v1/payments/orders/${encodeURIComponent(orderCode)}/cancel`);

/* ---------------- Admin ---------------- */

export const getAdminBookingsApi = (
  filter: AdminBookingFilter,
): Promise<ApiResponse<PageResponse<Booking>>> =>
  apiGet<PageResponse<Booking>>('/api/v1/admin/bookings', {
    params: { status: filter.status || undefined, page: filter.page ?? 0, size: filter.size ?? 20 },
  });

export const adminCancelBookingApi = (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/admin/bookings/${bookingId}/cancel`, { reason: reason || undefined });
