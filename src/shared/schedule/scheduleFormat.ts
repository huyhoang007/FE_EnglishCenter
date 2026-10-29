/**
 * scheduleFormat — hiển thị thời gian & trạng thái lịch hẹn (Dev 5)
 * -----------------------------------------------------------
 * BE trả thời gian ISO-8601 UTC, các hàm dưới đây đổi sang giờ máy người dùng (TASK D5-19).
 */

import type { BadgeVariant } from '@/shared/components/Badge';
import type { BookingStatus, ScheduleSlotStatus, StudyRepeatRule, StudyStatus } from '@/shared/types';

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

export const SLOT_STATUS_LABEL: Record<ScheduleSlotStatus, string> = {
  available: 'Đang mở',
  booked: 'Đã có người đặt',
  cancelled: 'Đã đóng',
  completed: 'Đã dạy',
};

export const SLOT_STATUS_VARIANT: Record<ScheduleSlotStatus, BadgeVariant> = {
  available: 'success',
  booked: 'primary',
  cancelled: 'neutral',
  completed: 'neutral',
};

/** Booking còn hiệu lực: được hủy / đổi lịch */
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
