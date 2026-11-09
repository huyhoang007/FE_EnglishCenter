/**
 * useSchedule — hooks TanStack Query cho lịch 1-1, gói kèm 1-1 và tư vấn lộ trình (Client / Mentor / Admin — Dev 5)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 * Thay đổi xong thì tải lại toàn bộ dữ liệu lịch + thông báo (BE tự tạo thông báo).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import type {
  AdminBookingFilter,
  AvailableSlot,
  CreateMentoringPlanPayload,
  RescheduleBookingPayload,
  RescheduleRequestPayload,
  ScheduleListType,
} from '@/shared/types';
import {
  adminCancelBookingApi,
  cancelBookingApi,
  cancelMentoringPlanApi,
  cancelSessionPaymentApi,
  checkoutPlanApi,
  claimConsultationApi,
  createMentoringPlanApi,
  getAdminBookingsApi,
  getMentorConsultationsApi,
  getMentorPlansApi,
  getMentorScheduleApi,
  getMyConsultationApi,
  getMyPlansApi,
  getMyScheduleApi,
  getSessionPaymentApi,
  getStudentLevelTestResultApi,
  getStudentLevelTestsApi,
  getStudentOverviewApi,
  rejectPlanApi,
  requestConsultationApi,
  rejectRescheduleRequestApi,
  requestRescheduleApi,
  rescheduleBookingApi,
  searchStudentsApi,
  updateBookingStatusApi,
  updateConsultationStatusApi,
} from './scheduleService';

/** Tải lại toàn bộ dữ liệu lịch + thông báo sau khi thay đổi */
function useInvalidateSchedule() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
  };
}

/* ---------------- Học viên ---------------- */

/** Lịch của học viên đang đăng nhập (chỉ STUDENT) */
export function useMySchedule(type: ScheduleListType, page: number, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mySchedule(type, page),
    queryFn: async () => unwrapOrThrow(await getMyScheduleApi(type, page)),
    enabled,
  });
}

/** Các gói kèm 1-1 của học viên (USER / STUDENT) */
export function useMyPlans(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.myPlans,
    queryFn: async () => unwrapOrThrow(await getMyPlansApi()),
    enabled,
  });
}

/** Học viên bấm thanh toán cả gói → đơn SePay (dùng orderCode để mở QR) */
export function useCheckoutPlan() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (planId: string) => unwrapOrThrow(await checkoutPlanApi(planId)),
    onSuccess: invalidate,
  });
}

export function useRejectPlan() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { planId: string; reason?: string }) =>
      unwrapOrThrow(await rejectPlanApi(vars.planId, vars.reason)),
    onSuccess: invalidate,
  });
}

/** Yêu cầu tư vấn gần nhất của học viên (null = chưa gửi) */
export function useMyConsultation(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.myConsultation,
    queryFn: async () => unwrapOrThrow(await getMyConsultationApi()),
    enabled,
  });
}

/** Học viên để lại SĐT nhờ mentor tư vấn lộ trình */
export function useRequestConsultation() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { phone: string; availableSlots: AvailableSlot[]; note?: string }) =>
      unwrapOrThrow(await requestConsultationApi(vars.phone, vars.availableSlots, vars.note)),
    onSuccess: invalidate,
  });
}

/** Thời gian giữa 2 lần kiểm tra trạng thái thanh toán */
const PAYMENT_POLL_MS = 3000;

/**
 * Đơn SePay (buổi kèm / cả gói): tự kiểm tra lại mỗi 3 giây khi còn PENDING,
 * dừng khi đơn đã PAID / CANCELLED / EXPIRED / REVIEW_REQUIRED.
 */
export function useSessionPayment(orderCode: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.sessionPayment(orderCode ?? ''),
    queryFn: async () => unwrapOrThrow(await getSessionPaymentApi(orderCode as string)),
    enabled: !!orderCode,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? PAYMENT_POLL_MS : false),
  });
}

/** Học viên hủy đơn thanh toán đang chờ */
export function useCancelSessionPayment() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (orderCode: string) => unwrapOrThrow(await cancelSessionPaymentApi(orderCode)),
    onSuccess: invalidate,
  });
}

/** Học viên hoặc mentor của lịch hẹn hủy 1 buổi đã thanh toán */
export function useCancelBooking() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reason?: string }) =>
      unwrapOrThrow(await cancelBookingApi(vars.bookingId, vars.reason)),
    onSuccess: invalidate,
  });
}

/* ---------------- Mentor ---------------- */

/** Lịch dạy của mentor đang đăng nhập */
export function useMentorSchedule(type: ScheduleListType, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mentorSchedule(type, page),
    queryFn: async () => unwrapOrThrow(await getMentorScheduleApi(type, page)),
  });
}

/** Mentor ghi nhận kết quả buổi học: completed / no_show */
export function useUpdateBookingStatus() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; status: 'completed' | 'no_show' }) =>
      unwrapOrThrow(await updateBookingStatusApi(vars.bookingId, vars.status)),
    onSuccess: invalidate,
  });
}

/** Mentor dời 1 buổi sang giờ khác (giữ nguyên thời lượng) */
export function useRescheduleBooking() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string } & RescheduleBookingPayload) =>
      unwrapOrThrow(
        await rescheduleBookingApi(vars.bookingId, { newStartTime: vars.newStartTime, reason: vars.reason }),
      ),
    onSuccess: invalidate,
  });
}

/** Học viên xin dời 1 buổi (V28) */
export function useRequestReschedule() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string } & RescheduleRequestPayload) =>
      unwrapOrThrow(
        await requestRescheduleApi(vars.bookingId, {
          preferredStartTime: vars.preferredStartTime,
          note: vars.note,
        }),
      ),
    onSuccess: invalidate,
  });
}

/** Mentor từ chối yêu cầu dời lịch */
export function useRejectRescheduleRequest() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reason?: string }) =>
      unwrapOrThrow(await rejectRescheduleRequestApi(vars.bookingId, vars.reason)),
    onSuccess: invalidate,
  });
}

export function useMentorPlans(page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mentorPlans(page),
    queryFn: async () => unwrapOrThrow(await getMentorPlansApi(page)),
  });
}

export function useCreateMentoringPlan() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (payload: CreateMentoringPlanPayload) => unwrapOrThrow(await createMentoringPlanApi(payload)),
    onSuccess: invalidate,
  });
}

export function useCancelMentoringPlan() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { planId: string; reason?: string }) =>
      unwrapOrThrow(await cancelMentoringPlanApi(vars.planId, vars.reason)),
    onSuccess: invalidate,
  });
}

/** mine = false: yêu cầu chưa ai nhận; mine = true: tôi phụ trách */
export function useMentorConsultations(mine: boolean, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mentorConsultations(mine, page),
    queryFn: async () => unwrapOrThrow(await getMentorConsultationsApi(mine, page)),
  });
}

export function useClaimConsultation() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (requestId: string) => unwrapOrThrow(await claimConsultationApi(requestId)),
    onSuccess: invalidate,
  });
}

export function useUpdateConsultationStatus() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { requestId: string; status: 'contacted' | 'closed' }) =>
      unwrapOrThrow(await updateConsultationStatusApi(vars.requestId, vars.status)),
    onSuccess: invalidate,
  });
}

/** Mentor tìm học viên theo tên / email / SĐT */
export function useStudentSearch(keyword: string, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.students(keyword, page),
    queryFn: async () => unwrapOrThrow(await searchStudentsApi(keyword, page)),
  });
}

export function useStudentOverview(studentId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.student(studentId ?? ''),
    queryFn: async () => unwrapOrThrow(await getStudentOverviewApi(studentId as string)),
    enabled: !!studentId,
  });
}

export function useStudentLevelTests(studentId: string | null, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.studentLevelTests(studentId ?? '', page),
    queryFn: async () => unwrapOrThrow(await getStudentLevelTestsApi(studentId as string, page)),
    enabled: !!studentId,
  });
}

export function useStudentLevelTestResult(studentId: string | null, attemptId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.studentLevelTest(studentId ?? '', attemptId ?? ''),
    queryFn: async () => unwrapOrThrow(await getStudentLevelTestResultApi(studentId as string, attemptId as string)),
    enabled: !!studentId && !!attemptId,
  });
}

/* ---------------- Admin ---------------- */

export function useAdminBookings(filter: AdminBookingFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.adminBookings(filter),
    queryFn: async () => unwrapOrThrow(await getAdminBookingsApi(filter)),
  });
}

export function useAdminCancelBooking() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reason?: string }) =>
      unwrapOrThrow(await adminCancelBookingApi(vars.bookingId, vars.reason)),
    onSuccess: invalidate,
  });
}
