import axiosClient, { type BeResponse, type PageResponse } from './axiosClient';

const BASE = '/api/v1';

export interface EnrollmentDto {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  enrolledDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

/**
 * Admin: Get all enrollments with filters
 */
export async function fetchAllEnrollments(params: {
  studentId?: string;
  courseId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<EnrollmentDto>> {
  const { data } = await axiosClient.get<PageResponse<EnrollmentDto>>(
    `${BASE}/admin/enrollments`,
    { params }
  );
  return data;
}

/**
 * Admin: Get enrollments for a specific student
 */
export async function fetchStudentEnrollments(studentId: string): Promise<EnrollmentDto[]> {
  const { data } = await axiosClient.get<BeResponse<EnrollmentDto[]>>(
    `${BASE}/admin/students/${studentId}/enrollments`
  );
  return data?.result ?? [];
}

/**
 * Get my enrollments (student)
 */
export async function fetchMyEnrollments(page = 0): Promise<PageResponse<EnrollmentDto>> {
  const { data } = await axiosClient.get<BeResponse<PageResponse<EnrollmentDto>>>(
    `${BASE}/me/enrollments`,
    { params: { page, size: 12, sort: 'enrolledDate,desc' } }
  );
  return data?.result ?? { data: [], currentPage: 0, pageSize: 12, totalPages: 0, totalElements: 0 };
}
