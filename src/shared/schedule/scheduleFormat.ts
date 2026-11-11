/**
 * scheduleFormat — hiển thị thời gian & trạng thái lịch hẹn (Dev 5)
 * -----------------------------------------------------------
 * BE trả thời gian ISO-8601 UTC, các hàm dưới đây đổi sang giờ máy người dùng (TASK D5-19).
 */

import type { BadgeVariant } from '@/shared/components/Badge';
import type {
  AvailableSlot,
  BookingStatus,
  ConsultationStatus,
  DayOfWeek,
  MentoringPlanStatus,
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
/** Mentor phải dời lịch trước giờ học ít nhất bao nhiêu giờ (khớp BE app.booking.reschedule-deadline-hours) */
export const RESCHEDULE_DEADLINE_HOURS = 2;

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

/* ---------------- Link phòng học online (khớp BE @MeetingUrl) ---------------- */

/** Domain nền tảng họp online được phép — host trùng khớp hoặc là subdomain (VD us05web.zoom.us) */
export const MEETING_URL_ALLOWED_DOMAINS = [
  'meet.google.com',
  'zoom.us',
  'zoom.com',
  'teams.microsoft.com',
  'teams.live.com',
  'discord.com',
  'discord.gg',
] as const;

/**
 * Kiểm tra link phòng học; để trống thì hợp lệ (mentor cập nhật sau).
 * So khớp theo hostname để chặn link giả kiểu meet.google.com.evil.com hoặc facebook.com/?q=zoom.us.
 */
export const validateMeetingUrl = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'Link không hợp lệ, cần dạng https://...';
  }
  if (url.protocol !== 'https:') return 'Link phải bắt đầu bằng https://';
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const ok = MEETING_URL_ALLOWED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  return ok ? null : 'Chỉ nhận link Google Meet, Zoom, Microsoft Teams hoặc Discord';
};

/* ---------------- Lịch rảnh hằng tuần của học viên (V26) ---------------- */

/** Thứ tự hiển thị: Thứ 2 → Chủ Nhật */
export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'T2',
  TUESDAY: 'T3',
  WEDNESDAY: 'T4',
  THURSDAY: 'T5',
  FRIDAY: 'T6',
  SATURDAY: 'T7',
  SUNDAY: 'CN',
};

/** Date.getDay(): 0 = Chủ Nhật */
const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/** Thứ trong tuần của 1 ngày (giờ máy người dùng) */
export const dayOfWeekOf = (date: Date): DayOfWeek => JS_DAY_TO_DAY_OF_WEEK[date.getDay()];

/** "T2 19:00 – 21:00" */
export const formatSlot = (slot: AvailableSlot): string => `${DAY_OF_WEEK_SHORT[slot.day]} ${slot.from} – ${slot.to}`;

/** Sắp theo Thứ 2 → CN rồi theo giờ bắt đầu */
export const sortSlots = (slots: AvailableSlot[]): AvailableSlot[] =>
  [...slots].sort(
    (a, b) => DAY_OF_WEEK_ORDER.indexOf(a.day) - DAY_OF_WEEK_ORDER.indexOf(b.day) || a.from.localeCompare(b.from),
  );

/** Lỗi của 1 khung giờ rảnh (null = hợp lệ) */
export const validateSlot = (slot: AvailableSlot): string | null => {
  if (!slot.from || !slot.to) return 'Nhập đủ giờ bắt đầu và kết thúc';
  if (slot.to <= slot.from) return 'Giờ kết thúc phải sau giờ bắt đầu';
  return null;
};

/**
 * Buổi học (giờ máy người dùng) có nằm trọn trong 1 khung rảnh của học viên không.
 * Lịch rảnh lưu theo giờ Việt Nam; người dùng hệ thống ở Việt Nam nên so trực tiếp với giờ máy.
 * Chưa có lịch rảnh → coi như hợp lệ (không cảnh báo).
 */
export const isWithinSlots = (startIso: string, endIso: string, slots: AvailableSlot[]): boolean => {
  if (slots.length === 0) return true;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (!isSameDay(start, end)) return false;
  const day = dayOfWeekOf(start);
  const from = formatTime(startIso);
  const to = formatTime(endIso);
  return slots.some((s) => s.day === day && s.from <= from && to <= s.to);
};

/**
 * Tự sinh `count` buổi theo lịch rảnh, bắt đầu từ ngày `startDate` ("YYYY-MM-DD").
 * Mỗi khung rảnh = 1 buổi, dài `minutes` phút tính từ đầu khung (khung ngắn hơn thì lấy hết khung).
 * Bỏ qua khung đã qua giờ, dừng khi đủ buổi hoặc quá 90 ngày tới.
 */
export const generateSessionsFromSlots = (
  startDate: string,
  count: number,
  slots: AvailableSlot[],
  minutes: number,
): { date: string; startTime: string; endTime: string }[] => {
  const result: { date: string; startTime: string; endTime: string }[] = [];
  if (slots.length === 0 || count <= 0) return result;
  const sorted = sortSlots(slots);
  const lastDay = addDays(startOfDay(new Date()), SCHEDULE_MAX_DAYS_AHEAD);
  for (let day = new Date(`${startDate}T00:00`); day <= lastDay && result.length < count; day = addDays(day, 1)) {
    const date = toDateInput(day.toISOString());
    for (const slot of sorted.filter((s) => s.day === dayOfWeekOf(day))) {
      if (result.length >= count) break;
      const startAt = new Date(`${date}T${slot.from}`);
      if (startAt.getTime() <= Date.now()) continue;
      const slotEnd = new Date(`${date}T${slot.to}`);
      const endAt = new Date(Math.min(startAt.getTime() + minutes * 60000, slotEnd.getTime()));
      result.push({ date, startTime: slot.from, endTime: formatTime(endAt.toISOString()) });
    }
  }
  return result;
};
