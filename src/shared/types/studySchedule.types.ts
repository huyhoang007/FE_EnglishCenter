/**
 * Study Schedule types — lịch học của học viên (Dev 5)
 * -----------------------------------------------------------
 * Học viên không tự tạo lịch nữa: lịch học = các buổi kèm 1-1 mentor xếp trong gói.
 * API: GET /api/v1/users/me/study-schedules → PageResponse<Booking> (xem schedule.types.ts)
 * Mốc thời gian là chuỗi ISO-8601 UTC, FE hiển thị theo giờ máy (D5-19).
 */

import type { BookingStatus } from './schedule.types';

/** Trạng thái lọc của Study Schedule: chỉ buổi đã thanh toán (bỏ 'pending' = chờ thanh toán) */
export type StudyScheduleStatus = Exclude<BookingStatus, 'pending'>;
