/**
 * Admin Practice Exam Service — kho đề luyện tập AI (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 *   GET    /api/v1/practice-exams?type=&keyword=&page=&size=  → PageResponse<PracticeExam>
 *   POST   /api/v1/admin/practice-exams                       → PracticeExam
 *   PUT    /api/v1/admin/practice-exams/{id}                  → PracticeExam
 *   DELETE /api/v1/admin/practice-exams/{id}                  → (6026 nếu đề đã có bài làm)
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  PageResponse,
  PracticeExam,
  PracticeExamPayload,
  PracticeExamType,
} from '@/shared/types';

const ADMIN_BASE = '/api/v1/admin/practice-exams';

export interface AdminPracticeExamFilter {
  type?: PracticeExamType | '';
  keyword?: string;
  page?: number;
  size?: number;
}

export const getPracticeExamsApi = (
  filter: AdminPracticeExamFilter = {},
): Promise<ApiResponse<PageResponse<PracticeExam>>> =>
  apiGet<PageResponse<PracticeExam>>('/api/v1/practice-exams', {
    params: {
      type: filter.type || undefined,
      keyword: filter.keyword?.trim() || undefined,
      page: filter.page ?? 0,
      size: filter.size ?? 10,
    },
  });

export const createPracticeExamApi = (payload: PracticeExamPayload): Promise<ApiResponse<PracticeExam>> =>
  apiPost<PracticeExam>(ADMIN_BASE, payload);

export const updatePracticeExamApi = (
  practiceExamId: string,
  payload: PracticeExamPayload,
): Promise<ApiResponse<PracticeExam>> => apiPut<PracticeExam>(`${ADMIN_BASE}/${practiceExamId}`, payload);

export const deletePracticeExamApi = (practiceExamId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${ADMIN_BASE}/${practiceExamId}`);
