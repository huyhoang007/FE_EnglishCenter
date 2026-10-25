/**
 * Admin Learning Path Service (Dev 5 — TASK-D5-03)
 * -----------------------------------------------------------
 *   GET    /api/v1/learning-paths?certificateId=&page=&size= → PageResponse<LearningPath>
 *   POST   /api/v1/admin/learning-paths                      → LearningPath
 *   PUT    /api/v1/admin/learning-paths/{id}                 → LearningPath (thay toàn bộ danh sách chặng)
 *   DELETE /api/v1/admin/learning-paths/{id}                 → (6022 nếu đã có học viên ghi danh)
 *
 * Dữ liệu cho dropdown khi thêm chặng:
 *   GET /api/v1/courses          (Dev 2, fetchCourses trong shared/api) — chặng COURSE
 *   GET /api/v1/admin/exams      (Dev 3)  — chặng EXAM
 *   GET /api/v1/practice-exams   (Dev 5)  — chặng PRACTICE_EXAM
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  ExamOption,
  LearningPath,
  LearningPathPayload,
  PageResponse,
  PracticeExam,
} from '@/shared/types';

const ADMIN_BASE = '/api/v1/admin/learning-paths';
/** Đủ lớn để dropdown có toàn bộ lựa chọn của 1 trung tâm */
const OPTION_SIZE = 200;

export interface AdminLearningPathFilter {
  certificateId?: string;
  page?: number;
  size?: number;
}

export const getLearningPathsApi = (
  filter: AdminLearningPathFilter = {},
): Promise<ApiResponse<PageResponse<LearningPath>>> =>
  apiGet<PageResponse<LearningPath>>('/api/v1/learning-paths', {
    params: {
      certificateId: filter.certificateId || undefined,
      page: filter.page ?? 0,
      size: filter.size ?? 10,
    },
  });

export const createLearningPathApi = (payload: LearningPathPayload): Promise<ApiResponse<LearningPath>> =>
  apiPost<LearningPath>(ADMIN_BASE, payload);

export const updateLearningPathApi = (
  learningPathId: string,
  payload: LearningPathPayload,
): Promise<ApiResponse<LearningPath>> => apiPut<LearningPath>(`${ADMIN_BASE}/${learningPathId}`, payload);

export const deleteLearningPathApi = (learningPathId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${ADMIN_BASE}/${learningPathId}`);

/* ---------- Lựa chọn cho từng loại chặng ---------- */

export const getExamOptionsApi = (): Promise<ApiResponse<PageResponse<ExamOption>>> =>
  apiGet<PageResponse<ExamOption>>('/api/v1/admin/exams', { params: { page: 0, size: OPTION_SIZE } });

export const getPracticeOptionsApi = (): Promise<ApiResponse<PageResponse<PracticeExam>>> =>
  apiGet<PageResponse<PracticeExam>>('/api/v1/practice-exams', { params: { page: 0, size: OPTION_SIZE } });
