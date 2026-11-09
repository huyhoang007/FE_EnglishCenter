/**
 * Schedule Service — gọi Backend (Dev 5)
 * -----------------------------------------------------------
 * Không còn slot công khai "mentor mở, ai vào thì vào": buổi học nằm trong gói kèm 1-1
 * mentor tạo cho 1 học viên sau khi tư vấn (theo lộ trình, VD 12 buổi), học viên trả 1 lần cả gói.
 *
 * Booking (buổi học):
 *   PUT    /api/v1/bookings/{id}/cancel             → Booking (STUDENT, MENTOR)
 *   GET    /api/v1/me/schedule?type=                → PageResponse<Booking> (STUDENT)
 *   GET    /api/v1/mentor/schedule?type=            → PageResponse<Booking> (MENTOR)
 *   PUT    /api/v1/mentor/bookings/{id}/status      → Booking (MENTOR)
 *   GET    /api/v1/admin/bookings?status=           → PageResponse<Booking> (ADMIN)
 *   PUT    /api/v1/admin/bookings/{id}/cancel       → Booking (ADMIN)
 * Gói kèm 1-1:
 *   POST   /api/v1/mentor/mentoring-plans           → MentoringPlan (MENTOR)
 *   GET    /api/v1/mentor/mentoring-plans           → PageResponse<MentoringPlan> (MENTOR)
 *   PUT    /api/v1/mentor/mentoring-plans/{id}/cancel → MentoringPlan (MENTOR, gói chưa thanh toán)
 *   GET    /api/v1/me/mentoring-plans               → MentoringPlan[] (USER, STUDENT)
 *   POST   /api/v1/me/mentoring-plans/{id}/checkout → SessionPaymentOrder (đơn SePay cả gói)
 *   PUT    /api/v1/me/mentoring-plans/{id}/reject   → MentoringPlan
 * Tư vấn lộ trình:
 *   POST   /api/v1/me/consultation-requests          → Consultation (để lại SĐT + lịch rảnh)
 *   GET    /api/v1/me/consultation-requests/latest   → Consultation | null
 *   GET    /api/v1/mentor/consultation-requests?mine= → PageResponse<Consultation>
 *   PUT    /api/v1/mentor/consultation-requests/{id}/claim  → Consultation
 *   PUT    /api/v1/mentor/consultation-requests/{id}/status → Consultation
 *   PUT    /api/v1/mentor/bookings/{id}/reschedule   → Booking (mentor dời lịch)
 *   POST   /api/v1/me/bookings/{id}/reschedule-request        → Booking (học viên xin dời)
 *   PUT    /api/v1/mentor/bookings/{id}/reschedule-request/reject → Booking (mentor từ chối)
 *   GET    /api/v1/mentor/students?keyword=          → PageResponse<StudentOverview>
 *   GET    /api/v1/mentor/students/{id}              → StudentOverview
 *   GET    /api/v1/mentor/students/{id}/level-tests  → PageResponse<AttemptSummary>
 *   GET    /api/v1/mentor/students/{id}/level-tests/{attemptId} → AttemptResult
 * Thanh toán (SePay — API của Dev 4):
 *   GET    /api/v1/payments/orders/{orderCode}         → SessionPaymentOrder
 *   POST   /api/v1/payments/orders/{orderCode}/cancel  → SessionPaymentOrder
 * Thời gian gửi / nhận dạng ISO-8601 UTC.
 */

import { apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  AdminBookingFilter,
  ApiResponse,
  AttemptResult,
  AttemptSummary,
  AvailableSlot,
  Booking,
  BookingStatus,
  Consultation,
  ConsultationStatus,
  CreateMentoringPlanPayload,
  MentoringPlan,
  PageResponse,
  RescheduleBookingPayload,
  RescheduleRequestPayload,
  ScheduleListType,
  SessionPaymentOrder,
  StudentOverview,
} from '@/shared/types';

/* ---------------- Booking ---------------- */

export const cancelBookingApi = (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/bookings/${bookingId}/cancel`, { reason: reason || undefined });

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

/** Mentor dời 1 buổi (trước giờ học ≥ 2 giờ), BE giữ nguyên thời lượng và báo học viên */
export const rescheduleBookingApi = (bookingId: string, payload: RescheduleBookingPayload): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/mentor/bookings/${bookingId}/reschedule`, payload);

/** Học viên xin dời 1 buổi (V28) — mentor nhận thông báo, quyết định dời hay từ chối */
export const requestRescheduleApi = (bookingId: string, payload: RescheduleRequestPayload): Promise<ApiResponse<Booking>> =>
  apiPost<Booking>(`/api/v1/me/bookings/${bookingId}/reschedule-request`, payload);

/** Mentor từ chối yêu cầu dời lịch (buổi giữ nguyên giờ) */
export const rejectRescheduleRequestApi = (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> =>
  apiPut<Booking>(`/api/v1/mentor/bookings/${bookingId}/reschedule-request/reject`, { reason: reason || undefined });

/* ---------------- Gói kèm 1-1 ---------------- */

export const createMentoringPlanApi = (payload: CreateMentoringPlanPayload): Promise<ApiResponse<MentoringPlan>> =>
  apiPost<MentoringPlan>('/api/v1/mentor/mentoring-plans', payload);

export const getMentorPlansApi = (page = 0, size = 10): Promise<ApiResponse<PageResponse<MentoringPlan>>> =>
  apiGet<PageResponse<MentoringPlan>>('/api/v1/mentor/mentoring-plans', { params: { page, size } });

export const cancelMentoringPlanApi = (planId: string, reason?: string): Promise<ApiResponse<MentoringPlan>> =>
  apiPut<MentoringPlan>(`/api/v1/mentor/mentoring-plans/${planId}/cancel`, { reason: reason || undefined });

export const getMyPlansApi = (): Promise<ApiResponse<MentoringPlan[]>> =>
  apiGet<MentoringPlan[]>('/api/v1/me/mentoring-plans');

export const checkoutPlanApi = (planId: string): Promise<ApiResponse<SessionPaymentOrder>> =>
  apiPost<SessionPaymentOrder>(`/api/v1/me/mentoring-plans/${planId}/checkout`);

export const rejectPlanApi = (planId: string, reason?: string): Promise<ApiResponse<MentoringPlan>> =>
  apiPut<MentoringPlan>(`/api/v1/me/mentoring-plans/${planId}/reject`, { reason: reason || undefined });

/* ---------------- Tư vấn lộ trình ---------------- */

export const requestConsultationApi = (
  phone: string,
  availableSlots: AvailableSlot[],
  note?: string,
): Promise<ApiResponse<Consultation>> =>
  apiPost<Consultation>('/api/v1/me/consultation-requests', { phone, availableSlots, note: note || undefined });

export const getMyConsultationApi = (): Promise<ApiResponse<Consultation | null>> =>
  apiGet<Consultation | null>('/api/v1/me/consultation-requests/latest');

export const getMentorConsultationsApi = (
  mine: boolean,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<Consultation>>> =>
  apiGet<PageResponse<Consultation>>('/api/v1/mentor/consultation-requests', { params: { mine, page, size } });

export const claimConsultationApi = (requestId: string): Promise<ApiResponse<Consultation>> =>
  apiPut<Consultation>(`/api/v1/mentor/consultation-requests/${requestId}/claim`);

export const updateConsultationStatusApi = (
  requestId: string,
  status: Extract<ConsultationStatus, 'contacted' | 'closed'>,
): Promise<ApiResponse<Consultation>> =>
  apiPut<Consultation>(`/api/v1/mentor/consultation-requests/${requestId}/status`, { status });

export const searchStudentsApi = (
  keyword: string,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<StudentOverview>>> =>
  apiGet<PageResponse<StudentOverview>>('/api/v1/mentor/students', {
    params: { keyword: keyword || undefined, page, size },
  });

export const getStudentOverviewApi = (studentId: string): Promise<ApiResponse<StudentOverview>> =>
  apiGet<StudentOverview>(`/api/v1/mentor/students/${studentId}`);

export const getStudentLevelTestsApi = (
  studentId: string,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<AttemptSummary>>> =>
  apiGet<PageResponse<AttemptSummary>>(`/api/v1/mentor/students/${studentId}/level-tests`, { params: { page, size } });

export const getStudentLevelTestResultApi = (
  studentId: string,
  attemptId: string,
): Promise<ApiResponse<AttemptResult>> =>
  apiGet<AttemptResult>(`/api/v1/mentor/students/${studentId}/level-tests/${attemptId}`);

/* ---------------- Thanh toán (SePay) ---------------- */

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
