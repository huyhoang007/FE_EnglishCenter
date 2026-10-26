/**
 * Admin Exam Service — quản lý đề, section, câu hỏi (Dev 3 — Exam / Test Management)
 * -----------------------------------------------------------
 *   GET    /api/v1/admin/exams?keyword=&status=&page=&size=     → PageResponse<ExamSummary>
 *   GET    /api/v1/admin/exams/{examId}                         → ExamDetail (kèm đáp án đúng)
 *   POST   /api/v1/admin/exams                                  → ExamDetail (luôn ở trạng thái nháp)
 *   DELETE /api/v1/admin/exams/{examId}
 *   POST   /api/v1/admin/exams/{examId}/publish | /unpublish    → ExamDetail
 *   POST   /api/v1/admin/exams/{examId}/archive | /restore      → ExamDetail (lưu trữ / khôi phục về nháp, 5024)
 *   POST   /api/v1/admin/exams/{examId}/sections                → ExamSection
 *   DELETE /api/v1/admin/exams/{examId}/sections/{sectionId}
 *   POST   /api/v1/admin/exams/{examId}/questions               → ExamQuestion
 *   DELETE /api/v1/admin/exams/{examId}/questions/{questionId}
 * Sửa cấu trúc chỉ được khi đề là nháp và chưa có lượt thi (backend chặn với 5005 / 5006).
 */

import { apiDelete, apiGet, apiPost } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  DifficultyLevel,
  ExamDetail,
  ExamQuestion,
  ExamScope,
  ExamSection,
  ExamStatus,
  ExamSummary,
  ExamType,
  PageResponse,
  QuestionType,
} from '@/shared/types';

const BASE = '/api/v1/admin/exams';

export interface AdminExamFilter {
  keyword?: string;
  status?: ExamStatus | '';
  page?: number;
  size?: number;
}

export interface CreateExamRequest {
  examScope: ExamScope;
  certificateId?: string;
  courseId?: string;
  examCode?: string;
  examType?: ExamType;
  examTitle: string;
  description?: string;
  durationMinutes: number;
  passingScore?: number;
  maxAttempts?: number;
  showAnswers?: boolean;
  showScore?: boolean;
  isFree?: boolean;
  price?: number;
  difficultyLevel?: DifficultyLevel;
  recommendedLevel?: string;
}

export interface CreateSectionRequest {
  title: string;
  sectionType?: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
}

export interface QuestionOptionInput {
  optionText: string;
  isCorrect?: boolean;
}

export interface CreateQuestionRequest {
  questionType: QuestionType;
  questionText: string;
  points?: number;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  sectionId?: string;
  timeLimitSeconds?: number;
  options?: QuestionOptionInput[];
}

export const getAdminExamsApi = (filter: AdminExamFilter = {}): Promise<ApiResponse<PageResponse<ExamSummary>>> =>
  apiGet<PageResponse<ExamSummary>>(BASE, {
    params: {
      keyword: filter.keyword?.trim() || undefined,
      status: filter.status || undefined,
      page: filter.page ?? 0,
      size: filter.size ?? 10,
    },
  });

export const getAdminExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiGet<ExamDetail>(`${BASE}/${examId}`);

export const createExamApi = (payload: CreateExamRequest): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(BASE, payload);

export const deleteExamApi = (examId: string): Promise<ApiResponse<void>> => apiDelete<void>(`${BASE}/${examId}`);

export const publishExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(`${BASE}/${examId}/publish`);

export const unpublishExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(`${BASE}/${examId}/unpublish`);

export const archiveExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(`${BASE}/${examId}/archive`);

export const restoreExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(`${BASE}/${examId}/restore`);

export const createSectionApi = (examId: string, payload: CreateSectionRequest): Promise<ApiResponse<ExamSection>> =>
  apiPost<ExamSection>(`${BASE}/${examId}/sections`, payload);

export const deleteSectionApi = (examId: string, sectionId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${BASE}/${examId}/sections/${sectionId}`);

export const addQuestionApi = (examId: string, payload: CreateQuestionRequest): Promise<ApiResponse<ExamQuestion>> =>
  apiPost<ExamQuestion>(`${BASE}/${examId}/questions`, payload);

export const removeQuestionApi = (examId: string, questionId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${BASE}/${examId}/questions/${questionId}`);
