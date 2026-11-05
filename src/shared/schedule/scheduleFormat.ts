/**
 * scheduleFormat — hiển thị thời gian & trạng thái lịch hẹn (Dev 5)
 * -----------------------------------------------------------
 * BE trả thời gian ISO-8601 UTC, các hàm dưới đây đổi sang giờ máy người dùng (TASK D5-19).
 */

import type { BadgeVariant } from '@/shared/components/Badge';
import type {
  BookingStatus,
  ConsultationStatus,
  MentoringPlanStatus,
  StudyRepeatRule,
  StudyStatus,
} from '@/shared/types';

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_FULL = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** "19:30" theo giờ máy người dùng */
export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "25/10/2026" */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** "T2" / "CN" */
export const weekdayShort = (date: Date): string => WEEKDAY_SHORT[date.getDay()];

/** "Thứ 2" / "Chủ Nhật" */
export const weekdayFull = (date: Date): string => WEEKDAY_FULL[date.getDay()];

/** 0h00 của ngày (giờ máy người dùng) */
export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Cộng thêm n ngày */
export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Cùng 1 ngày theo giờ máy người dùng */
export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Hôm nay" / "Ngày mai" / "Thứ 6, 25/10/2026" */
export const formatDayLabel = (iso: string): string => {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return 'Hôm nay';
  if (isSameDay(date, addDays(today, 1))) return 'Ngày mai';
  return `${weekdayFull(date)}, ${formatDate(iso)}`;
};

/** Số phút giữa 2 mốc */
export const durationMinutes = (startIso: string, endIso: string): number =>
  Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);

/** Ngày "yyyy-MM-dd" + giờ "HH:mm" (giờ máy người dùng) → ISO UTC gửi BE */
export const toUtcIso = (date: string, time: string): string => new Date(`${date}T${time}`).toISOString();

/** ISO UTC → giá trị cho <input type="date"> */
export const toDateInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** ISO UTC → giá trị cho <input type="time"> */
export const toTimeInput = (iso: string): string => formatTime(iso);

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  completed: 'Đã học',
  cancelled: 'Đã hủy',
  no_show: 'Vắng mặt',
};

export const BOOKING_STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'neutral',
  no_show: 'danger',
};

/* ---------------- Giới hạn xếp lịch (khớp BE app.schedule.*) ---------------- */

/** Chỉ xếp buổi trong N ngày tới (BE: app.schedule.max-days-ahead) */
export const SCHEDULE_MAX_DAYS_AHEAD = 90;
/** Mỗi buổi dài từ … tới … phút (BE: app.schedule.min/max-session-minutes) */
export const SESSION_MIN_MINUTES = 30;
export const SESSION_MAX_MINUTES = 180;

/** min / max cho <input type="date">: hôm nay → hôm nay + 90 ngày */
export const scheduleDateBounds = (): { min: string; max: string } => {
  const today = startOfDay(new Date());
  return {
    min: toDateInput(today.toISOString()),
    max: toDateInput(addDays(today, SCHEDULE_MAX_DAYS_AHEAD).toISOString()),
  };
};

/** Kiểm tra 1 buổi trước khi gửi BE; trả về lỗi tiếng Việt hoặc null */
export const validateSessionTime = (date: string, start: string, end: string): string | null => {
  if (!date || !start || !end) return 'Nhập đủ ngày, giờ bắt đầu và kết thúc';
  const startAt = new Date(`${date}T${start}`);
  const endAt = new Date(`${date}T${end}`);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return 'Ngày giờ không hợp lệ';
  if (startAt.getTime() <= Date.now()) return 'Giờ bắt đầu phải ở tương lai';
  if (startAt.getTime() > addDays(startOfDay(new Date()), SCHEDULE_MAX_DAYS_AHEAD + 1).getTime()) {
    return `Chỉ được xếp lịch trong ${SCHEDULE_MAX_DAYS_AHEAD} ngày tới`;
  }
  const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
  if (minutes <= 0) return 'Giờ kết thúc phải sau giờ bắt đầu';
  if (minutes < SESSION_MIN_MINUTES || minutes > SESSION_MAX_MINUTES) {
    return `Mỗi buổi dài từ ${SESSION_MIN_MINUTES} đến ${SESSION_MAX_MINUTES} phút`;
  }
  return null;
};

export const PLAN_STATUS_LABEL: Record<MentoringPlanStatus, string> = {
  pending_payment: 'Chờ thanh toán',
  active: 'Đang học',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const PLAN_STATUS_VARIANT: Record<MentoringPlanStatus, BadgeVariant> = {
  pending_payment: 'warning',
  active: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

export const CONSULTATION_STATUS_LABEL: Record<ConsultationStatus, string> = {
  pending: 'Chờ mentor nhận',
  contacted: 'Mentor đang liên hệ',
  agreed: 'Đã chốt lộ trình',
  closed: 'Đã kết thúc',
};

export const CONSULTATION_STATUS_VARIANT: Record<ConsultationStatus, BadgeVariant> = {
  pending: 'warning',
  contacted: 'primary',
  agreed: 'success',
  closed: 'neutral',
};

/** Booking còn hiệu lực: được hủy */
export const isActiveBooking = (status: BookingStatus): boolean =>
  status === 'pending' || status === 'confirmed';

/* ---------------- Lịch học cá nhân (TASK-D5-01) ---------------- */

export const STUDY_STATUS_LABEL: Record<StudyStatus, string> = {
  pending: 'Chờ học',
  done: 'Đã học',
  skipped: 'Bỏ qua',
  cancelled: 'Đã hủy',
};

export const STUDY_STATUS_VARIANT: Record<StudyStatus, BadgeVariant> = {
  pending: 'primary',
  done: 'success',
  skipped: 'warning',
  cancelled: 'neutral',
};

export const REPEAT_RULE_LABEL: Record<StudyRepeatRule, string> = {
  none: 'Không lặp',
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
};
