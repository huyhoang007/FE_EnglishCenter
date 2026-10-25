/**
 * PageResponse — dạng dữ liệu BE trả cho các API danh sách có phân trang.
 * Trang bắt đầu từ 0 (Spring Pageable): gửi ?page=0&size=20.
 */
// Dùng chung đúng 1 định nghĩa với axiosClient (tránh export trùng tên trong barrel '@/shared')
export type { PageResponse } from '@/shared/api/axiosClient';

/** Tham số phân trang gửi lên BE */
export interface PageParams {
  page?: number;
  size?: number;
  /** Vd 'createdAt,desc' */
  sort?: string;
}
