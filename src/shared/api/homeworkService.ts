/**
 * Homework Service — API cho tính năng BÀI TẬP (Dev 2.5)
 * -----------------------------------------------------------
 *   GET  /api/v1/homework-submissions/me                          → HomeworkSubmission[]
 *   GET  /api/v1/homework-submissions/homework/{id}/mine          → HomeworkSubmission[]
 *   POST /api/v1/homework-submissions                             → HomeworkSubmission
 *   GET  /api/v1/mentor/homework-submissions?pendingOnly=&page=   → Page<HomeworkSubmission>
 *   GET  /api/v1/mentor/homework-submissions/{id}                 → HomeworkSubmission
 *   PUT  /api/v1/mentor/homework-submissions/{id}/grade           → HomeworkSubmission
 *   GET  /api/v1/mentor/homework-submissions/{id}/history         → GradeHistory[]
 *   POST /api/v1/uploads/signature                                → UploadSignature
 */

import { apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type { ApiResponse, PageResponse } from '@/shared/types';
import type {
  AnswerItemRequest,
  AttemptDetail,
  AttemptResult,
} from '@/shared/types';
import type {
  GradeHomeworkPayload,
  HomeworkGradeHistory,
  HomeworkSubmission,
  SubmitHomeworkPayload,
  UploadSignature,
  UploadSignaturePayload,
} from '@/shared/types/homework.types';

/** Nộp bài tập. */
export const submitHomeworkApi = (
  payload: SubmitHomeworkPayload,
): Promise<ApiResponse<HomeworkSubmission>> =>
  apiPost<HomeworkSubmission>('/api/v1/homework-submissions', payload);

/** Bài nộp của tôi (mọi bài tập). */
export const getMyHomeworkSubmissionsApi = (): Promise<
  ApiResponse<HomeworkSubmission[]>
> => apiGet<HomeworkSubmission[]>('/api/v1/homework-submissions/me');

/** Bài nộp của tôi cho một bài tập cụ thể (rỗng = chưa nộp). */
export const getMyHomeworkSubmissionApi = (
  homeworkContentId: string,
): Promise<ApiResponse<HomeworkSubmission[]>> =>
  apiGet<HomeworkSubmission[]>(
    `/api/v1/homework-submissions/homework/${homeworkContentId}/mine`,
  );

/** Hàng đợi chấm của mentor. */
export const getMentorHomeworkQueueApi = (
  page = 0,
  size = 20,
  pendingOnly = true,
): Promise<ApiResponse<PageResponse<HomeworkSubmission>>> =>
  apiGet<PageResponse<HomeworkSubmission>>('/api/v1/mentor/homework-submissions', {
    params: { page, size, pendingOnly },
  });

/** Chi tiết bài nộp (kèm lịch sử chấm) cho mentor. */
export const getHomeworkSubmissionForGradingApi = (
  submissionId: string,
): Promise<ApiResponse<HomeworkSubmission>> =>
  apiGet<HomeworkSubmission>(
    `/api/v1/mentor/homework-submissions/${submissionId}`,
  );

/** Mentor chấm / sửa điểm. */
export const gradeHomeworkApi = (
  submissionId: string,
  payload: GradeHomeworkPayload,
): Promise<ApiResponse<HomeworkSubmission>> =>
  apiPut<HomeworkSubmission>(
    `/api/v1/mentor/homework-submissions/${submissionId}/grade`,
    payload,
  );

/** Lịch sử chấm. */
export const getHomeworkGradeHistoryApi = (
  submissionId: string,
): Promise<ApiResponse<HomeworkGradeHistory[]>> =>
  apiGet<HomeworkGradeHistory[]>(
    `/api/v1/mentor/homework-submissions/${submissionId}/history`,
  );

/** Xin chữ ký upload từ BE (API secret không bao giờ ra FE). */
export const createUploadSignatureApi = (
  payload: UploadSignaturePayload,
): Promise<ApiResponse<UploadSignature>> =>
  apiPost<UploadSignature>('/api/v1/uploads/signature', payload);

/* =========================================================
 * Bài tắc nghiệm — luồng làm bài riêng cho bài tập
 * (không đi qua phòng thi của module Exam)
 * ========================================================= */

/** Mở lượt thi cho bài tập trắc nghiệm. */
export const startHomeworkAttemptApi = (
  homeworkContentId: string,
): Promise<ApiResponse<AttemptDetail>> =>
  apiPost<AttemptDetail>(
    `/api/v1/homework/${homeworkContentId}/attempt`,
  );

/** Tải lượt thi (để tiếp tục làm bài). */
export const getHomeworkAttemptApi = (
  attemptId: string,
): Promise<ApiResponse<AttemptDetail>> =>
  apiGet<AttemptDetail>(`/api/v1/homework/attempts/${attemptId}`);

/** Nộp bài trắc nghiệm — BE chấm tự động và tạo luôn bài nộp. */
export const submitHomeworkAttemptApi = (
  attemptId: string,
  answers: AnswerItemRequest[],
): Promise<ApiResponse<AttemptResult>> =>
  apiPost<AttemptResult>(
    `/api/v1/homework/attempts/${attemptId}/submit`,
    answers.length > 0 ? answers : undefined,
  );
