/**
 * useSchedule — hooks TanStack Query cho lịch hẹn 1-1 (dùng chung Client / Mentor / Admin — Dev 5)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 * Đặt / hủy / đổi lịch xong thì tải lại lịch + thông báo (BE tự tạo thông báo).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import type {
  AdminBookingFilter,
  CreateSlotPayload,
  ScheduleListType,
  UpdateSlotPayload,
} from '@/shared/types';
import {
  adminCancelBookingApi,
  bookSlotApi,
  cancelBookingApi,
  cancelSessionPaymentApi,
  createSlotApi,
  deleteSlotApi,
  getAdminBookingsApi,
  getMentorAvailabilityApi,
  getMentorScheduleApi,
  getMyScheduleApi,
  getMySlotsApi,
  getSessionPaymentApi,
  rescheduleBookingApi,
  updateBookingStatusApi,
  updateSlotApi,
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

/** Lịch trống + đã đặt của 1 mentor trong khoảng [from, to) */
export function useMentorAvailability(mentorId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.availability(mentorId ?? '', from, to),
    queryFn: async () => unwrapOrThrow(await getMentorAvailabilityApi(mentorId as string, from, to)),
    enabled: !!mentorId,
  });
}

/** Lịch của học viên đang đăng nhập (chỉ STUDENT) */
export function useMySchedule(type: ScheduleListType, page: number, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mySchedule(type, page),
    queryFn: async () => unwrapOrThrow(await getMyScheduleApi(type, page)),
    enabled,
  });
}

export function useBookSlot() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (scheduleId: string) => unwrapOrThrow(await bookSlotApi(scheduleId)),
    onSuccess: invalidate,
  });
}

export function useRescheduleBooking() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; newScheduleId: string }) =>
      unwrapOrThrow(await rescheduleBookingApi(vars.bookingId, vars.newScheduleId)),
    onSuccess: invalidate,
  });
}

/** Thời gian giữa 2 lần kiểm tra trạng thái thanh toán */
const PAYMENT_POLL_MS = 3000;

/**
 * Đơn SePay của buổi kèm 1-1: tự kiểm tra lại mỗi 3 giây khi còn PENDING,
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

/** Học viên hủy thanh toán: BE hủy đơn, hủy booking pending và mở lại slot */
export function useCancelSessionPayment() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (orderCode: string) => unwrapOrThrow(await cancelSessionPaymentApi(orderCode)),
    onSuccess: invalidate,
  });
}

/** Học viên hoặc mentor của lịch hẹn hủy */
export function useCancelBooking() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reason?: string }) =>
      unwrapOrThrow(await cancelBookingApi(vars.bookingId, vars.reason)),
    onSuccess: invalidate,
  });
}

/* ---------------- Mentor ---------------- */

export function useMySlots(page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule.mentorSlots(page),
    queryFn: async () => unwrapOrThrow(await getMySlotsApi(page)),
  });
}

export function useCreateSlot() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (payload: CreateSlotPayload) => unwrapOrThrow(await createSlotApi(payload)),
    onSuccess: invalidate,
  });
}

export function useUpdateSlot() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (vars: { scheduleId: string; payload: UpdateSlotPayload }) =>
      unwrapOrThrow(await updateSlotApi(vars.scheduleId, vars.payload)),
    onSuccess: invalidate,
  });
}

export function useDeleteSlot() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (scheduleId: string) => unwrapOrThrow(await deleteSlotApi(scheduleId)),
    onSuccess: invalidate,
  });
}

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
