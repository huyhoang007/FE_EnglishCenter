/**
 * mentorHomeworkService — bài tập riêng của mentor (Dev 5, V27)
 * -----------------------------------------------------------
 *   GET    /api/v1/mentor/homeworks              → MentorHomework[]   (bài tập của tôi)
 *   POST   /api/v1/mentor/homeworks/ai-import    → HomeworkAiDraft    (AI đọc PDF, chưa lưu)
 *   POST   /api/v1/mentor/homeworks              → MentorHomework
 *   PUT    /api/v1/mentor/homeworks/{id}         → MentorHomework
 *   DELETE /api/v1/mentor/homeworks/{id}
 *   GET    /api/v1/me/homeworks/{id}             → CourseContentDto   (học viên mở bài từ lộ trình)
 * Nộp bài / chấm bài dùng lại homeworkService (Dev 2.5).
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/axiosClient';
import type { ApiResponse } from '@/shared/types';
import type { CourseContentDto } from '@/shared/types/catalog.types';
import type { HomeworkAiDraft, MentorHomework, MentorHomeworkPayload } from '@/shared/types/homework.types';

export const getMentorHomeworksApi = (): Promise<ApiResponse<MentorHomework[]>> =>
  apiGet<MentorHomework[]>('/api/v1/mentor/homeworks');

export const importHomeworkPdfApi = (fileBase64: string, fileName: string): Promise<ApiResponse<HomeworkAiDraft>> =>
  apiPost<HomeworkAiDraft>('/api/v1/mentor/homeworks/ai-import', { fileBase64, fileName });

export const createMentorHomeworkApi = (payload: MentorHomeworkPayload): Promise<ApiResponse<MentorHomework>> =>
  apiPost<MentorHomework>('/api/v1/mentor/homeworks', payload);

export const updateMentorHomeworkApi = (
  contentId: string,
  payload: MentorHomeworkPayload,
): Promise<ApiResponse<MentorHomework>> => apiPut<MentorHomework>(`/api/v1/mentor/homeworks/${contentId}`, payload);

export const deleteMentorHomeworkApi = (contentId: string): Promise<ApiResponse<void>> =>
  apiDelete<void>(`/api/v1/mentor/homeworks/${contentId}`);

export const getPathHomeworkApi = (contentId: string): Promise<ApiResponse<CourseContentDto>> =>
  apiGet<CourseContentDto>(`/api/v1/me/homeworks/${contentId}`);
