/**
 * Study Schedule Service — lịch học của học viên (Dev 5)
 * -----------------------------------------------------------
 * Chỉ USER / STUDENT. Dữ liệu = các buổi kèm 1-1 mentor xếp (không tự tạo được nữa):
 *   GET /api/v1/users/me/study-schedules?status=&page=&size=  → PageResponse<Booking>
 *       (mặc định từ đầu hôm nay UTC tới 30 ngày sau, sắp theo giờ học)
 */

import { apiGet } from '@/shared/api/axiosClient';
import type { ApiResponse, Booking, PageResponse, StudyScheduleStatus } from '@/shared/types';

const BASE_URL = '/api/v1/users/me/study-schedules';

export const getMyStudySchedulesApi = (
  status: StudyScheduleStatus | undefined,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<Booking>>> =>
  apiGet<PageResponse<Booking>>(BASE_URL, { params: { status, page, size } });
