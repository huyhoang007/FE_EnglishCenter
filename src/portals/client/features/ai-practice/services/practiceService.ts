/**
 * Practice Service — gọi Backend (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 *   GET  /api/v1/practice-exams?type=&keyword=           → PageResponse<PracticeExam>
 *   GET  /api/v1/practice-exams/{examId}                 → PracticeExam
 *   POST /api/v1/practice-exams/{examId}/submit          → PracticeAnswer (STUDENT)
 *   POST /api/v1/practice-exams/answers/{id}/ai-evaluate → PracticeEvaluation (STUDENT, 10 - 60 giây)
 *   GET  /api/v1/practice-exams/evaluations/{id}         → PracticeEvaluation
 *   GET  /api/v1/practice-exams/me/answers               → PracticeAnswer[] (STUDENT)
 */

import { apiGet, apiPost } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  PageResponse,
  PracticeAnswer,
  PracticeEvaluation,
  PracticeExam,
  PracticeExamType,
} from '@/shared/types';

const BASE = '/api/v1/practice-exams';

/** AI chấm có thể mất tới 60 giây phía BE → FE chờ 90 giây */
const AI_TIMEOUT_MS = 90_000;

export const getPracticeExamsApi = (
  type?: PracticeExamType,
  keyword?: string,
  page = 0,
  size = 50,
): Promise<ApiResponse<PageResponse<PracticeExam>>> =>
  apiGet<PageResponse<PracticeExam>>(BASE, {
    params: { type: type || undefined, keyword: keyword || undefined, page, size },
  });

export const getPracticeExamApi = (examId: string): Promise<ApiResponse<PracticeExam>> =>
  apiGet<PracticeExam>(`${BASE}/${examId}`);

export const submitPracticeAnswerApi = (
  examId: string,
  content: string,
): Promise<ApiResponse<PracticeAnswer>> =>
  apiPost<PracticeAnswer>(`${BASE}/${examId}/submit`, { content });

export const evaluatePracticeAnswerApi = (answerId: string): Promise<ApiResponse<PracticeEvaluation>> =>
  apiPost<PracticeEvaluation>(`${BASE}/answers/${answerId}/ai-evaluate`, undefined, {
    timeout: AI_TIMEOUT_MS,
  });

export const getPracticeEvaluationApi = (evaluationId: string): Promise<ApiResponse<PracticeEvaluation>> =>
  apiGet<PracticeEvaluation>(`${BASE}/evaluations/${evaluationId}`);

export const getMyPracticeAnswersApi = (): Promise<ApiResponse<PracticeAnswer[]>> =>
  apiGet<PracticeAnswer[]>(`${BASE}/me/answers`);
