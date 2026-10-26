/**
 * certificateService — Dev 2 Certificate REST APIs
 * -----------------------------------------------------------
 *   GET  /api/v1/certificates           → danh sách chứng chỉ (IELTS, TOEIC…)
 *   GET  /api/v1/certificates/{id}      → chi tiết + các kỹ năng/parts
 *   POST /api/v1/admin/certificates           → [Admin] tạo chứng chỉ
 *   PUT  /api/v1/admin/certificates/{id}      → [Admin] cập nhật
 *
 * Tất cả endpoint đều trả `ApiResponse<T>` → unwrap `result`.
 */

import axiosClient, { type BeResponse } from './axiosClient';
import { toApiError } from './courseService';
import type {
  CertificateDto,
  CreateCertificatePayload,
  UpdateCertificatePayload,
} from '@/shared/types/catalog.types';

const BASE = '/api/v1';

/** GET /api/v1/certificates — dùng cho dropdown/bộ lọc ở sàn khóa học. */
export async function fetchCertificates(): Promise<CertificateDto[]> {
  try {
    const { data } = await axiosClient.get<BeResponse<CertificateDto[]>>(
      `${BASE}/certificates`,
    );
    return data?.result ?? [];
  } catch (err) {
    throw toApiError(err, 'Không tải được danh mục chứng chỉ');
  }
}

/** GET /api/v1/certificates/{certificateId} */
export async function fetchCertificateById(
  certificateId: string,
): Promise<CertificateDto> {
  try {
    const { data } = await axiosClient.get<BeResponse<CertificateDto>>(
      `${BASE}/certificates/${certificateId}`,
    );
    if (!data?.result) throw new Error('Không tìm thấy chứng chỉ');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Không tìm thấy chứng chỉ');
  }
}

/** POST /api/v1/admin/certificates */
export async function createCertificate(
  payload: CreateCertificatePayload,
): Promise<CertificateDto> {
  try {
    const { data } = await axiosClient.post<BeResponse<CertificateDto>>(
      `${BASE}/admin/certificates`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Tạo chứng chỉ thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Tạo chứng chỉ thất bại');
  }
}

/** PUT /api/v1/admin/certificates/{certificateId} */
export async function updateCertificate(
  certificateId: string,
  payload: UpdateCertificatePayload,
): Promise<CertificateDto> {
  try {
    const { data } = await axiosClient.put<BeResponse<CertificateDto>>(
      `${BASE}/admin/certificates/${certificateId}`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Cập nhật chứng chỉ thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Cập nhật chứng chỉ thất bại');
  }
}

/** DELETE /api/v1/admin/certificates/{certificateId} */
export async function deleteCertificate(certificateId: string): Promise<void> {
  try {
    await axiosClient.delete(`${BASE}/admin/certificates/${certificateId}`);
  } catch (err) {
    throw toApiError(err, 'Xoá chứng chỉ thất bại');
  }
}