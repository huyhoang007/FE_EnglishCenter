/**
 * Admin Learning Path Service (Dev 5 — TASK-D5-03)
 * -----------------------------------------------------------
 *   GET    /api/v1/learning-paths?certificateId=&page=&size= → PageResponse<LearningPath>
 *   POST   /api/v1/admin/learning-paths                      → LearningPath
 *   PUT    /api/v1/admin/learning-paths/{id}                 → LearningPath (thay toàn bộ danh sách chặng)
 *   DELETE /api/v1/admin/learning-paths/{id}                 → (6022 nếu đã có học viên ghi danh)
 * Mentor (Dev 5): cùng payload ở /api/v1/mentor/learning-paths (chỉ sửa / xóa lộ trình mình tạo).
 *
 * Dữ liệu cho dropdown khi thêm chặng:
 *   GET /api/v1/courses          (Dev 2, fetchCourses trong shared/api) — chặng COURSE
 *   GET /api/v1/admin/exams      (Dev 3)  — chặng EXAM
 *   GET /api/v1/admin/exams?examScope=practice&status=published — chặng PRACTICE_EXAM
 *       (đề luyện tập AI tạo ở trang AI Practice nằm trong module Exam, không còn ở /practice-exams)
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  ExamOption,
  LearningPath,
  LearningPathPayload,
  PageResponse,
} from '@/shared/types';

const ADMIN_BASE = '/api/v1/admin/learning-paths';
const MENTOR_BASE = '/api/v1/mentor/learning-paths';

/** admin: Admin Portal · mentor: mentor tạo lộ trình của mình (trang Learning Paths) */
export type LearningPathManageMode = 'admin' | 'mentor';
const baseOf = (mode: LearningPathManageMode) => (mode === 'mentor' ? MENTOR_BASE : ADMIN_BASE);
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

export const createLearningPathApi = (
  payload: LearningPathPayload,
  mode: LearningPathManageMode = 'admin',
): Promise<ApiResponse<LearningPath>> => apiPost<LearningPath>(baseOf(mode), payload);

export const updateLearningPathApi = (
  learningPathId: string,
  payload: LearningPathPayload,
  mode: LearningPathManageMode = 'admin',
): Promise<ApiResponse<LearningPath>> => apiPut<LearningPath>(`${baseOf(mode)}/${learningPathId}`, payload);

export const deleteLearningPathApi = (
  learningPathId: string,
  mode: LearningPathManageMode = 'admin',
): Promise<ApiResponse<void>> => apiDelete<void>(`${baseOf(mode)}/${learningPathId}`);

/* ---------- Lựa chọn cho từng loại chặng ---------- */

export const getExamOptionsApi = (): Promise<ApiResponse<PageResponse<ExamOption>>> =>
  apiGet<PageResponse<ExamOption>>('/api/v1/admin/exams', { params: { page: 0, size: OPTION_SIZE } });

/** Đề luyện tập AI đã xuất bản (cùng nguồn với trang AI Practice) */
export const getPracticeOptionsApi = (): Promise<ApiResponse<PageResponse<ExamOption>>> =>
  apiGet<PageResponse<ExamOption>>('/api/v1/admin/exams', {
    params: { examScope: 'practice', status: 'published', page: 0, size: OPTION_SIZE },
  });
