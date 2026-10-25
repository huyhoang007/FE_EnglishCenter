/**
 * Exam Grading Service — Mentor/Admin chấm Writing/Speaking (Dev 3)
 * -----------------------------------------------------------
 *   GET /api/v1/mentor/exam-attempts/pending?page=&size=                       → PageResponse<AttemptSummary>
 *   GET /api/v1/mentor/exam-attempts/{attemptId}                               → AttemptResult (đủ đáp án)
 *   PUT /api/v1/mentor/exam-attempts/{attemptId}/answers/{questionId}/grade    → AttemptResult
 */

import { apiGet, apiPut } from '@/shared/api/axiosClient';
import type { ApiResponse, AttemptResult, AttemptSummary, PageResponse } from '@/shared/types';

const BASE = '/api/v1/mentor/exam-attempts';

export interface GradeAnswerPayload {
  attemptId: string;
  questionId: string;
  score: number;
  feedback?: string;
}

export const getPendingAttemptsApi = (page = 0, size = 20): Promise<ApiResponse<PageResponse<AttemptSummary>>> =>
  apiGet<PageResponse<AttemptSummary>>(`${BASE}/pending`, { params: { page, size } });

export const getAttemptForGradingApi = (attemptId: string): Promise<ApiResponse<AttemptResult>> =>
  apiGet<AttemptResult>(`${BASE}/${attemptId}`);

export const gradeAnswerApi = ({
  attemptId,
  questionId,
  score,
  feedback,
}: GradeAnswerPayload): Promise<ApiResponse<AttemptResult>> =>
  apiPut<AttemptResult>(`${BASE}/${attemptId}/answers/${questionId}/grade`, { score, feedback });
