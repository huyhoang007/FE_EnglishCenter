/**
 * Authentication Domain Types
 * --------------------------------
 * Định nghĩa các kiểu dữ liệu cho module Authentication,
 * tuân thủ chuẩn DTO ApiResponse<T> của dự án.
 */

import type { ApiResponse } from '@/shared/types/apiResponse';

/** Các vai trò người dùng trong hệ thống PrepMaster AI
 *  - GUEST: Khách vãng lai, chưa đăng nhập (chỉ xem nội dung public).
 *  - USER: Người dùng đã đăng ký, chưa mua gói khóa học.
 *  - STUDENT: Học viên chính thức (đã mua khóa học).
 *  - MENTOR: Giảng viên / người chấm bài.
 *  - ADMIN: Quản trị hệ thống.
 */
export type UserRole = 'GUEST' | 'USER' | 'STUDENT' | 'MENTOR' | 'ADMIN';

/** Thông tin người dùng trả về sau khi đăng nhập */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  avatarUrl?: string;
  /** Nguyện vọng + trình độ hiện tại (USER / STUDENT) */
  targetCertificateId?: string | null;
  targetScore?: number | null;
  currentLevel?: string | null;
  currentScore?: number | null;
}

/** Payload đăng nhập (gửi lên Backend) */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** Payload đăng ký tài khoản học viên mới */
export type TargetExam = 'IELTS' | 'TOEIC';

export type CurrentLevel =
  | 'BEGINNER'
  | 'ELEMENTARY'
  | 'INTERMEDIATE'
  | 'UPPER_INTERMEDIATE'
  | 'ADVANCED';

/**
 * Payload đăng ký tài khoản mới (luồng email):
 * chỉ khai email + họ tên (+ SĐT). Mật khẩu được đặt qua link kích hoạt
 * ở trang /set-password — backend KHÔNG nhận password ở bước này nữa.
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  /** Số điện thoại (tuỳ chọn) — backend `RegisterRequest` có `phone` (10-11 số). */
  phone?: string;
  targetExam?: TargetExam;
  currentLevel?: CurrentLevel;
}

/** Kết quả kiểm tra token kích hoạt (GET thông tin cho trang /set-password) */
export interface ActivationInfo {
  email: string;
  fullName: string;
}

/** Cấu trúc Auth trả về khi đăng nhập / đăng ký thành công */
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn?: number; // seconds
}

/** Response của endpoint /auth/login & /auth/register */
export type AuthResponse = ApiResponse<AuthData>;

/** Response của endpoint /auth/me */
export type MeResponse = ApiResponse<AuthUser>;

/** Response của endpoint /auth/refresh */
export type RefreshTokenResponse = ApiResponse<{ accessToken: string; expiresIn: number }>;
