/**
 * Learning Path Service — gọi Backend (Dev 5 — TASK-D5-03)
 * -----------------------------------------------------------
 *   GET  /api/v1/learning-paths?certificateId=         → PageResponse<LearningPath>
 *   GET  /api/v1/learning-paths/{pathId}               → LearningPath
 *   POST /api/v1/users/me/learning-paths/{id}/enroll   → LearningPathProgress (STUDENT)
 *   GET  /api/v1/users/me/learning-paths/progress      → LearningPathProgress[] (STUDENT)
 *   GET  /api/v1/certificates                          → PageResponse<CertificateSummary> (Dev 2, dùng để lọc)
 */

import { apiGet, apiPost } from '@/shared/api/axiosClient';
import type {
  ApiResponse,
  CertificateSummary,
  LearningPath,
  LearningPathProgress,
  PageResponse,
} from '@/shared/types';

export const getLearningPathsApi = (
  certificateId?: string,
  page = 0,
  size = 50,
): Promise<ApiResponse<PageResponse<LearningPath>>> =>
  apiGet<PageResponse<LearningPath>>('/api/v1/learning-paths', {
    params: { certificateId: certificateId || undefined, page, size },
  });

export const getLearningPathApi = (pathId: string): Promise<ApiResponse<LearningPath>> =>
  apiGet<LearningPath>(`/api/v1/learning-paths/${pathId}`);

export const enrollLearningPathApi = (pathId: string): Promise<ApiResponse<LearningPathProgress>> =>
  apiPost<LearningPathProgress>(`/api/v1/users/me/learning-paths/${pathId}/enroll`);

export const getMyLearningPathProgressApi = (): Promise<ApiResponse<LearningPathProgress[]>> =>
  apiGet<LearningPathProgress[]>('/api/v1/users/me/learning-paths/progress');

export const getCertificatesApi = (): Promise<ApiResponse<PageResponse<CertificateSummary>>> =>
  apiGet<PageResponse<CertificateSummary>>('/api/v1/certificates', { params: { size: 100 } });
