/**
 * Schedule & Booking types — khớp DTO BE (Dev 5, TASK D5-01 → D5-14)
 * API: /api/v1/mentor/availability, /api/v1/mentors/{id}/availability, /api/v1/bookings, ...
 * Mọi mốc thời gian là chuỗi ISO-8601 UTC (vd "2026-10-25T12:30:00Z"),
 * FE hiển thị theo múi giờ máy người dùng (TASK D5-19).
 */

/** Trạng thái slot của mentor (chữ thường, khớp BE) */
export type ScheduleSlotStatus = 'available' | 'booked' | 'cancelled' | 'completed';

/** Trạng thái lịch hẹn (chữ thường, khớp BE) */
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/** upcoming: sắp tới, past: đã qua */
export type ScheduleListType = 'upcoming' | 'past';

export interface MentorScheduleSlot {
  scheduleId: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  status: ScheduleSlotStatus;
  price: number;
  /** null khi học viên xem lịch trống */
  meetingUrl: string | null;
}

export interface Booking {
  bookingId: string;
  scheduleId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  price: number;
  meetingUrl: string | null;
  status: BookingStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  rescheduledFromId: string | null;
  createdAt: string | null;
  /** Mã đơn SePay đang chờ thanh toán — chỉ có khi status = 'pending' */
  paymentOrderCode: string | null;
}

/* ---------------- Thanh toán buổi kèm 1-1 (SePay của Dev 4) ---------------- */

/** Trạng thái đơn SePay (chữ hoa, khớp BE PaymentOrderStatus) */
export type SessionPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'REVIEW_REQUIRED';

/** Đơn SePay của buổi kèm — GET /api/v1/payments/orders/{orderCode} (PaymentOrderResponse) */
export interface SessionPaymentOrder {
  orderId: string;
  orderCode: string;
  orderType: 'COURSE' | 'MENTOR_SESSION';
  bookingId: string | null;
  /** Tên đơn, vd "Buổi kèm 1-1 với mentor ..." */
  courseTitle: string;
  amount: number;
  currency: string;
  status: SessionPaymentStatus;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  /** Nội dung chuyển khoản bắt buộc (= orderCode) */
  transferContent: string;
  /** Ảnh QR VietQR, chỉ có khi PENDING */
  qrUrl: string | null;
}

/** Mentor mở slot */
export interface CreateSlotPayload {
  startTime: string;
  endTime: string;
  meetingUrl?: string;
}

/** Mentor sửa / đóng / mở lại slot */
export interface UpdateSlotPayload extends CreateSlotPayload {
  status: 'available' | 'cancelled';
}

/** Bộ lọc booking của Admin */
export interface AdminBookingFilter {
  status?: BookingStatus | '';
  page?: number;
  size?: number;
}
