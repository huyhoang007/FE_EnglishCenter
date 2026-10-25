/**
 * examService — API đề thi (Exam) phía Admin
 * -----------------------------------------------------------
 * Backend (D3-02/D3-06) có sẵn:
 *   GET /api/v1/admin/exams?keyword=&examType=&status=&courseId=&…
 *      → PageResponse<ExamSummaryResponse>  (KHÔNG có wrapper ApiResponse)
 *   GET /api/v1/admin/exams/{examId}
 *      → ApiResponse<ExamDetailResponse>
 *
 * Bài tập trắc nghiệm (`submissionType = 'multiple_choice'`) cần liên kết
 * tới 1 đề thi có sẵn để học viên làm bài và được chấm tự động bởi
 * `ExamGrader` của backend.
 *
 * LƯU Ý: endpoint danh sách trả `PageResponse` thẳng (không bọc trong
 * `{ code, message, result }`) — khác với các endpoint `ApiResponse`.
 */

import axiosClient, { type BeResponse, type PageResponse } from './axiosClient';
import { toApiError } from './courseService';
import type { ExamScope, ExamStatus, ExamType } from '@/shared/types/exam.types';

const BASE = '/api/v1';

/**
 * Loại đề thi — khớp `ExamType` của backend (DB lưu lowercase).
 * Khai báo nguồn: `@/shared/types/exam.types` (dùng chung Client/Mentor/Admin).
 */
export type { ExamType, ExamStatus, ExamScope };

/**
 * Tóm tắt đề thi — bám sát `ExamSummaryResponse` của backend.
 *
 * Backend dùng `@JsonInclude(NON_NULL)` nên các field không có sẽ là
 * `undefined` sau khi parse — ta khai báo là optional cho khớp thực tế.
 */
export interface ExamSummaryDto {
  examId: string;
  examCode: string;
  examTitle: string;
  description?: string | null;
  examScope?: ExamScope;
  examType?: ExamType;
  status?: ExamStatus;
  courseId?: string | null;
  courseTitle?: string | null;
  durationMinutes?: number | null;
  totalQuestions?: number | null;
  passingScore?: number | null;
  maxAttempts?: number | null;
  isFree?: boolean | null;
  createdAt?: string | null;
  lastUpdated?: string | null;
}

/** Tham số lọc — map 1-1 với `@RequestParam` của `AdminExamController`. */
export interface ExamQueryParams {
  keyword?: string;
  examType?: ExamType;
  status?: ExamStatus;
  examScope?: ExamScope;
  courseId?: string;
  level?: string;
  difficulty?: string;
  isFree?: boolean;
  page?: number;
  size?: number;
}

/**
 * GET /api/v1/admin/exams
 *
 * @param page trang 0-based (backend `Pageable` mặc định `currentPage = 0`).
 */
export async function fetchAdminExams(
  params: ExamQueryParams = {},
): Promise<PageResponse<ExamSummaryDto>> {
  const { page = 0, size = 50, ...rest } = params;

  // Bỏ param rỗng để axios không gửi `?keyword=` vô nghĩa.
  const clean = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

  try {
    const { data } = await axiosClient.get<PageResponse<ExamSummaryDto>>(
      `${BASE}/admin/exams`,
      { params: { ...clean, page, size } },
    );
    return (
      data ?? { currentPage: 0, pageSize: size, totalPages: 0, totalElements: 0, data: [] }
    );
  } catch (err) {
    throw toApiError(err, 'Không tải được danh sách đề thi');
  }
}

/**
 * Lấy danh sách đề thi đã CÔNG BÁI thuộc 1 khóa học — dùng cho dropdown
 * "liên kết đề trắc nghiệm" trong form bài tập.
 *
 * Chỉ trả về đề `published` + `examScope = 'course'`:
 *   - `ExamServiceImpl.createExam` bắt buộc `course` scope phải có `courseId`
 *     (xem `CreateExamRequest`), nên lọc `courseId` là đủ.
 *   - Đề `trial` (thi thử theo chứng chỉ) không gắn khóa học → bị loại.
 */
export async function fetchPublishedCourseExams(
  courseId: string,
  size = 100,
): Promise<ExamSummaryDto[]> {
  const page = await fetchAdminExams({
    courseId,
    status: 'published',
    size,
  });
  return (page.data ?? []).filter(
    (exam) =>
      exam.status === 'published' &&
      exam.examScope === 'course' &&
      exam.courseId === courseId,
  );
}

/** GET /api/v1/admin/exams/{examId} — chi tiết đề (kèm đáp án). */
export async function fetchAdminExamDetail(
  examId: string,
): Promise<BeResponse<unknown>> {
  try {
    const { data } = await axiosClient.get<BeResponse<unknown>>(
      `${BASE}/admin/exams/${examId}`,
    );
    return data;
  } catch (err) {
    throw toApiError(err, 'Không tải được chi tiết đề thi');
  }
}
