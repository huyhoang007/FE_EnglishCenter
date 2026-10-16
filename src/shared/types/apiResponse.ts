/**
 * Chuẩn DTO API Response dùng chung cho toàn bộ dự án English Center Platform.
 * Mọi endpoint Backend đều trả về theo cấu trúc ApiResponse<T>.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

/**
 * Helper tạo ApiResponse thành công — dùng cho mock data ở Frontend.
 */
export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Helper tạo ApiResponse thất bại — dùng cho mock lỗi (validate, auth fail...).
 */
export function errorResponse<T = null>(
  message: string,
  errorCode = 'UNKNOWN_ERROR',
  data: T = null as T,
): ApiResponse<T> {
  return {
    success: false,
    message,
    data,
    errorCode,
  };
}
