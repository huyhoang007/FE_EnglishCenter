/**
 * Exam Service — học viên làm bài (Dev 3 — Exam / Test Management)
 * -----------------------------------------------------------
 *   GET  /api/v1/exams?examType=&examScope=&level=&keyword=&page=&size=  → PageResponse<ExamSummary>
 *   GET  /api/v1/exams/{examId}                                          → ExamDetail (outline + quyền làm bài)
 *   POST /api/v1/exams/{examId}/attempts                                 → AttemptDetail (bắt đầu / tiếp tục)
 *   GET  /api/v1/attempts/{attemptId}                                    → AttemptDetail
 *   PUT  /api/v1/attempts/{attemptId}/answers                            → AttemptDetail (autosave)
 *   POST /api/v1/attempts/{attemptId}/submit                             → AttemptResult (5013 đã nộp, 5014 hết giờ)
 *   GET  /api/v1/me/exam-attempts?page=                                  → PageResponse<AttemptSummary>
 *   GET  /api/v1/me/exam-attempts/{attemptId}/result                     → AttemptResult
 *   GET  /api/v1/me/proficiency?certificateId=                           → Proficiency[] (năng lực theo bài kiểm tra đầu vào)
 */

import { apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type {
  AnswerItemRequest,
  ApiResponse,
  AttemptDetail,
  AttemptResult,
  AttemptSummary,
  ExamDetail,
  ExamScope,
  ExamSummary,
  ExamType,
  PageResponse,
  Proficiency,
} from '@/shared/types';

export interface ExamListFilter {
  keyword?: string;
  examType?: ExamType | '';
  examScope?: ExamScope | '';
  level?: string;
  certificateId?: string;
  page?: number;
  size?: number;
}

/** Lỗi giữ lại mã backend (VD "5014") để phòng thi xử lý hết giờ / đã nộp. */
export class ExamApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ExamApiError';
  }
}

/** Như unwrapOrThrow nhưng giữ errorCode. */
export function unwrapExam<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new ExamApiError(res.message || 'Yêu cầu thất bại', res.errorCode);
  return res.data;
}

export const getExamsApi = (filter: ExamListFilter = {}): Promise<ApiResponse<PageResponse<ExamSummary>>> =>
  apiGet<PageResponse<ExamSummary>>('/api/v1/exams', {
    params: {
      keyword: filter.keyword?.trim() || undefined,
      examType: filter.examType || undefined,
      examScope: filter.examScope || undefined,
      level: filter.level?.trim() || undefined,
      certificateId: filter.certificateId || undefined,
      page: filter.page ?? 0,
      size: filter.size ?? 12,
    },
  });

export const getExamDetailApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiGet<ExamDetail>(`/api/v1/exams/${examId}`);

export const startAttemptApi = (examId: string): Promise<ApiResponse<AttemptDetail>> =>
  apiPost<AttemptDetail>(`/api/v1/exams/${examId}/attempts`);

export const getAttemptApi = (attemptId: string): Promise<ApiResponse<AttemptDetail>> =>
  apiGet<AttemptDetail>(`/api/v1/attempts/${attemptId}`);

export const saveAnswersApi = (
  attemptId: string,
  answers: AnswerItemRequest[],
): Promise<ApiResponse<AttemptDetail>> => apiPut<AttemptDetail>(`/api/v1/attempts/${attemptId}/answers`, { answers });

export const submitAttemptApi = (
  attemptId: string,
  answers: AnswerItemRequest[],
): Promise<ApiResponse<AttemptResult>> =>
  apiPost<AttemptResult>(`/api/v1/attempts/${attemptId}/submit`, answers.length > 0 ? { answers } : undefined);

export const getMyAttemptsApi = (page = 0, size = 10): Promise<ApiResponse<PageResponse<AttemptSummary>>> =>
  apiGet<PageResponse<AttemptSummary>>('/api/v1/me/exam-attempts', { params: { page, size } });

export const getAttemptResultApi = (attemptId: string): Promise<ApiResponse<AttemptResult>> =>
  apiGet<AttemptResult>(`/api/v1/me/exam-attempts/${attemptId}/result`);

export const getMyProficiencyApi = (certificateId?: string): Promise<ApiResponse<Proficiency[]>> =>
  apiGet<Proficiency[]>('/api/v1/me/proficiency', { params: { certificateId: certificateId || undefined } });
