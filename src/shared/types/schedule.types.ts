/**
 * Schedule & Booking types — khớp DTO BE (Dev 5, TASK D5-01 → D5-14)
 * API: /api/v1/me/schedule, /api/v1/mentor/schedule, /api/v1/bookings/{id}/cancel, ...
 * Không còn slot công khai: buổi học nằm trong gói kèm 1-1 (MentoringPlan) mentor tạo sau khi tư vấn.
 * Mọi mốc thời gian là chuỗi ISO-8601 UTC (vd "2026-10-25T12:30:00Z"),
 * FE hiển thị theo múi giờ máy người dùng (TASK D5-19).
 */

/** Trạng thái lịch hẹn (chữ thường, khớp BE) */
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/** upcoming: sắp tới, past: đã qua */
export type ScheduleListType = 'upcoming' | 'past';

export interface Booking {
  bookingId: string;
  scheduleId: string;
  /** Gói kèm 1-1 chứa buổi này */
  planId: string | null;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  price: number;
  meetingUrl: string | null;
  /** Buổi này học gì (mentor ghi khi tạo gói) */
  topic: string | null;
  status: BookingStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  rescheduledFromId: string | null;
  /** Học viên xin dời lịch (V28): null = không có yêu cầu đang chờ */
  rescheduleRequestedAt: string | null;
  /** Giờ học viên mong muốn (có thể trống) */
  reschedulePreferredTime: string | null;
  rescheduleRequestNote: string | null;
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
  orderType: 'COURSE' | 'MENTOR_SESSION' | 'MENTOR_PLAN';
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

/* ---------------- Gói kèm 1-1 theo lộ trình (Dev 5, V21) ---------------- */

/** pending_payment: chờ học viên thanh toán cả gói · active: đã thanh toán · completed · cancelled */
export type MentoringPlanStatus = 'pending_payment' | 'active' | 'completed' | 'cancelled';

export interface MentoringPlan {
  planId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  learningPathId: string | null;
  learningPathName: string | null;
  consultationId: string | null;
  title: string;
  note: string | null;
  totalSessions: number;
  completedSessions: number;
  totalPrice: number;
  status: MentoringPlanStatus;
  cancelReason: string | null;
  paidAt: string | null;
  createdAt: string | null;
  /** Mã đơn SePay đang chờ (khi đã bấm thanh toán) */
  paymentOrderCode: string | null;
  /** Các buổi của gói, theo giờ bắt đầu (link phòng học chỉ có sau khi thanh toán) */
  sessions: Booking[];
}

/** 1 buổi khi mentor tạo gói — giờ ISO-8601 UTC */
export interface PlanSessionPayload {
  startTime: string;
  endTime: string;
  /** Nội dung buổi, tối đa 255 ký tự */
  topic?: string;
}

/** POST /api/v1/me/bookings/{id}/reschedule-request — học viên xin dời, mentor quyết định */
export interface RescheduleRequestPayload {
  preferredStartTime?: string;
  note: string;
}

/** PUT /api/v1/mentor/bookings/{id}/reschedule — chỉ gửi giờ bắt đầu mới, BE giữ nguyên thời lượng */
export interface RescheduleBookingPayload {
  newStartTime: string;
  reason?: string;
}

/** POST /api/v1/mentor/mentoring-plans */
export interface CreateMentoringPlanPayload {
  studentId: string;
  learningPathId?: string;
  consultationId?: string;
  title: string;
  note?: string;
  meetingUrl?: string;
  sessions: PlanSessionPayload[];
}

/* ---------------- Tư vấn lộ trình (Dev 5, V21) ---------------- */

/** Thứ trong tuần — khớp java.time.DayOfWeek */
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

/** 1 khung giờ rảnh hằng tuần, giờ Việt Nam dạng "HH:mm" (V26) */
export interface AvailableSlot {
  day: DayOfWeek;
  from: string;
  to: string;
}

/** pending: chưa mentor nào nhận · contacted: mentor đang liên hệ · agreed: đã chốt gói · closed */
export type ConsultationStatus = 'pending' | 'contacted' | 'agreed' | 'closed';

export interface Consultation {
  requestId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  phone: string;
  note: string | null;
  /** Lịch rảnh hằng tuần học viên gửi kèm SĐT */
  availableSlots: AvailableSlot[];
  status: ConsultationStatus;
  mentorId: string | null;
  mentorName: string | null;
  targetCertificateId: string | null;
  targetCertificateName: string | null;
  targetScore: number | null;
  currentLevel: string | null;
  currentScore: number | null;
  createdAt: string | null;
  lastUpdated: string | null;
}

/** Học viên mentor tìm được để xem điểm test level */
export interface StudentOverview {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  /** USER (Learner) | STUDENT */
  role: string;
  targetCertificateId: string | null;
  targetCertificateName: string | null;
  targetScore: number | null;
  currentLevel: string | null;
  currentScore: number | null;
  levelTestCount: number;
  consultationStatus: ConsultationStatus | null;
  /** Lịch rảnh của yêu cầu tư vấn gần nhất (rỗng nếu chưa gửi) */
  availableSlots: AvailableSlot[];
}

/** Bộ lọc booking của Admin */
export interface AdminBookingFilter {
  status?: BookingStatus | '';
  page?: number;
  size?: number;
}
