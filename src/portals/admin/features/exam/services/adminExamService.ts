/**
 * Admin Exam Service — quản lý đề, section, câu hỏi (Dev 3 — Exam / Test Management)
 * -----------------------------------------------------------
 *   GET    /api/v1/admin/exams?keyword=&status=&page=&size=     → PageResponse<ExamSummary>
 *   GET    /api/v1/admin/exams/{examId}                         → ExamDetail (kèm đáp án đúng)
 *   POST   /api/v1/admin/exams                                  → ExamDetail (luôn ở trạng thái nháp)
 *   PUT    /api/v1/admin/exams/{examId}                         → ExamDetail (trường không gửi = giữ nguyên)
 *   DELETE /api/v1/admin/exams/{examId}
 *   POST   /api/v1/admin/exams/{examId}/publish | /unpublish    → ExamDetail
 *   POST   /api/v1/admin/exams/{examId}/archive | /restore      → ExamDetail (lưu trữ / khôi phục về nháp, 5024)
 *   POST   /api/v1/admin/exams/{examId}/sections                → ExamSection
 *   PUT    /api/v1/admin/exams/{examId}/sections/{sectionId}    → ExamSection
 *   DELETE /api/v1/admin/exams/{examId}/sections/{sectionId}
 *   POST   /api/v1/admin/exams/{examId}/questions               → ExamQuestion
 *   DELETE /api/v1/admin/exams/{examId}/questions/{questionId}
 * Sửa cấu trúc chỉ được khi đề là nháp và chưa có lượt thi (backend chặn với 5005 / 5006).
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
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
  /** Không truyền: mọi đề trừ đề luyện tập AI (practice) */
  examScope?: ExamScope;
  certificateId?: string;
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

/**
 * Sửa thông tin đề — BE: UpdateExamRequest, trường không gửi = giữ nguyên.
 * Đổi chứng chỉ chỉ được khi đề là nháp và chưa có lượt thi (5005 / 5006).
 */
export interface UpdateExamRequest {
  certificateId?: string;
  /** true = bỏ gắn chứng chỉ (vì certificateId không gửi nghĩa là giữ nguyên) */
  clearCertificate?: boolean;
  examTitle?: string;
  description?: string;
  durationMinutes?: number;
}

export interface UpdateSectionRequest {
  title?: string;
  sectionOrder?: number;
  durationMinutes?: number;
}

/** Sửa nội dung hiển thị — được cả khi đề đã có lượt thi (BE chặn đổi loại, thứ tự, phần thi của chứng chỉ) */
export interface UpdateSectionContentRequest {
  title?: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
}

export interface CreateSectionRequest {
  title: string;
  sectionType?: string;
  /** Phần thi của chứng chỉ (Dev 2) — thang điểm của section lấy theo phần này */
  certificatePartId?: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
  /** Thời lượng riêng của section (phút) — BE: CreateExamSectionRequest.durationMinutes, tối thiểu 1 */
  durationMinutes?: number;
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
      examScope: filter.examScope || undefined,
      certificateId: filter.certificateId || undefined,
      page: filter.page ?? 0,
      size: filter.size ?? 10,
    },
  });

export const getAdminExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiGet<ExamDetail>(`${BASE}/${examId}`);

export const createExamApi = (payload: CreateExamRequest): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(BASE, payload);

export const updateExamApi = (examId: string, payload: UpdateExamRequest): Promise<ApiResponse<ExamDetail>> =>
  apiPut<ExamDetail>(`${BASE}/${examId}`, payload);

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

export const updateSectionApi = (
  examId: string,
  sectionId: string,
  payload: UpdateSectionRequest | UpdateSectionContentRequest,
): Promise<ApiResponse<ExamSection>> => apiPut<ExamSection>(`${BASE}/${examId}/sections/${sectionId}`, payload);

export const deleteSectionApi = (examId: string, sectionId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${BASE}/${examId}/sections/${sectionId}`);

export const addQuestionApi = (examId: string, payload: CreateQuestionRequest): Promise<ApiResponse<ExamQuestion>> =>
  apiPost<ExamQuestion>(`${BASE}/${examId}/questions`, payload);

/** Sửa nội dung hiển thị của câu — được cả khi đã có học viên trả lời (BE chặn đổi đáp án, điểm, dạng câu) */
export interface UpdateQuestionContentRequest {
  questionText?: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export const updateQuestionApi = (
  examId: string,
  questionId: string,
  payload: UpdateQuestionContentRequest,
): Promise<ApiResponse<ExamQuestion>> => apiPut<ExamQuestion>(`${BASE}/${examId}/questions/${questionId}`, payload);

/** Lưu cả bộ đề trong một giao dịch: câu nào lỗi thì không lưu gì */
export interface ImportExamContentRequest {
  sections: { section: CreateSectionRequest; questions: Omit<CreateQuestionRequest, 'sectionId'>[] }[];
  questions: Omit<CreateQuestionRequest, 'sectionId'>[];
}

export const importExamContentApi = (
  examId: string,
  payload: ImportExamContentRequest,
): Promise<ApiResponse<{ sectionCount: number; questionCount: number }>> =>
  apiPost<{ sectionCount: number; questionCount: number }>(`${BASE}/${examId}/content`, payload, { timeout: 60_000 });

/** Nhân bản đề (phần thi, câu hỏi, đáp án) thành một đề nháp mới */
export const cloneExamApi = (examId: string): Promise<ApiResponse<ExamDetail>> =>
  apiPost<ExamDetail>(`${BASE}/${examId}/clone`);

export const removeQuestionApi = (examId: string, questionId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`${BASE}/${examId}/questions/${questionId}`);

/* ---------- AI đọc file đề (PDF / Word / text) — POST /api/v1/admin/ai-import ---------- */

export interface AiImportRequest {
  /** EXAM: đề thi; PRACTICE: đề luyện Writing / Speaking (AI Practice) */
  target: 'EXAM' | 'PRACTICE';
  certificateName?: string;
  /** Tên các phần thi được dùng sau [SECTION] */
  sections?: string[];
  fileName?: string;
  /** PDF mã hoá base64 */
  fileBase64?: string;
  /** Nội dung chữ đã trích từ .docx / .txt */
  text?: string;
}

export interface AiPracticeDraft {
  title: string;
  description: string;
  examType: 'WRITING' | 'SPEAKING';
  bankName?: string;
}

export interface AiImportResponse {
  /** EXAM: nội dung theo mẫu nhập đề */
  content?: string;
  /** PRACTICE: các đề luyện */
  prompts?: AiPracticeDraft[];
}

/** AI (Claude) đọc cả bộ đề có thể mất vài phút */
export const aiImportApi = (payload: AiImportRequest): Promise<ApiResponse<AiImportResponse>> =>
  apiPost<AiImportResponse>('/api/v1/admin/ai-import', payload, { timeout: 300_000 });
