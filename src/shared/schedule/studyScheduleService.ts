/**
 * Study Schedule Service — lịch học cá nhân (Dev 5 — TASK-D5-01)
 * -----------------------------------------------------------
 * Chỉ USER / STUDENT:
 *   GET    /api/v1/users/me/study-schedules?status=&page=&size=  → PageResponse<StudySchedule>
 *          (mặc định từ đầu hôm nay UTC tới 30 ngày sau, sắp theo giờ học)
 *   POST   /api/v1/users/me/study-schedules                      → StudySchedule
 *   PUT    /api/v1/users/me/study-schedules/{id}                 → StudySchedule
 *   PUT    /api/v1/users/me/study-schedules/{id}/status          → StudySchedule
 *   DELETE /api/v1/users/me/study-schedules/{id}
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  PageResponse,
  StudySchedule,
  StudySchedulePayload,
  StudyStatus,
} from '@/shared/types';

const BASE_URL = '/api/v1/users/me/study-schedules';

export const getMyStudySchedulesApi = (
  status: StudyStatus | undefined,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<StudySchedule>>> =>
  apiGet<PageResponse<StudySchedule>>(BASE_URL, { params: { status, page, size } });

export const createStudyScheduleApi = (
  payload: StudySchedulePayload,
): Promise<ApiResponse<StudySchedule>> => apiPost<StudySchedule>(BASE_URL, payload);

export const updateStudyScheduleApi = (
  scheduleId: string,
  payload: StudySchedulePayload,
): Promise<ApiResponse<StudySchedule>> => apiPut<StudySchedule>(`${BASE_URL}/${scheduleId}`, payload);

export const updateStudyStatusApi = (
  scheduleId: string,
  status: StudyStatus,
): Promise<ApiResponse<StudySchedule>> =>
  apiPut<StudySchedule>(`${BASE_URL}/${scheduleId}/status`, { status });

export const deleteStudyScheduleApi = (scheduleId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${BASE_URL}/${scheduleId}`);
