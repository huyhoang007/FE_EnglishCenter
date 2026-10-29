/**
 * Study Schedule types — lịch học cá nhân (Dev 5, TASK-D5-01)
 * -----------------------------------------------------------
 * Khớp DTO BE: StudyScheduleRequest / StudyScheduleResponse
 * API: /api/v1/users/me/study-schedules (chỉ USER / STUDENT)
 * Mốc thời gian là chuỗi ISO-8601 UTC, FE hiển thị theo giờ máy (D5-19).
 */

/** pending: chờ học · done: đã học · skipped: bỏ qua · cancelled: hủy (chữ thường, khớp BE) */
export type StudyStatus = 'pending' | 'done' | 'skipped' | 'cancelled';

/** Lặp lại lịch học (chữ thường, khớp BE) */
export type StudyRepeatRule = 'none' | 'daily' | 'weekly';

export interface StudySchedule {
  scheduleId: string;
  title: string;
  lessonContentId: string | null;
  scheduledTime: string;
  repeatRule: StudyRepeatRule;
  reminderMinutesBefore: number;
  status: StudyStatus;
  reminderSentAt: string | null;
  createdAt: string;
}

/** Body tạo / sửa lịch học — giờ học phải ở tương lai */
export interface StudySchedulePayload {
  title: string;
  scheduledTime: string;
  repeatRule?: StudyRepeatRule;
  /** 0 - 1440 phút, BE mặc định 15 */
  reminderMinutesBefore?: number;
  lessonContentId?: string;
}
