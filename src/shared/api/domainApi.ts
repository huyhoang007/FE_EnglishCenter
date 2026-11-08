import axiosClient, { type BeResponse } from './axiosClient';
import type { ApiResponse } from '@/shared/types';
import type { AuthDto, ChangePasswordDto, CreateMentorDto, CreateMentorResponseDto, MentorDto, MentorStatsDto, PageResponse, ProfileUpdateDto, RoleDto, UpdateMentorDto, UserDto } from './apiTypes';
import { toUser } from './apiTypes';

function ok<T>(data: T, message = 'Success'): ApiResponse<T> { return { success: true, message, data }; }

// Gmail SMTP delivery can exceed the shared API timeout.
const ACTIVATION_EMAIL_TIMEOUT_MS = 200_000;

/**
 * Render Free plan: service bị "spin down" sau 15 phút không có traffic.
 * Lần request đầu tiên phải khởi động lại container (cold start).
 *
 * Số đo thực tế trên `englishcenter-api.onrender.com`:
 *   - `GET /api/v1/courses` (lần đầu, sau 15' idle) → 82.0s
 *   - `POST /api/v1/auth/login` (lần đầu, sau 15' idle) → 180.5s
 *   - các request sau (container đã warm) → 1-2s
 *
 * → Timeout phải lớn hơn 180s, đặt 200s cho an toàn.
 */
const COLD_START_TIMEOUT_MS = 200_000;

/**
 * "Warm-up" backend Render.
 *
 * Render Free spin down sau 15 phút idle → request đầu tiên phải khởi động
 * lại container (đo thực tế: 82s với GET, tới 180s với POST login).
 *
 * Gọi hàm này NGAY khi mở trang đăng nhập để container bắt đầu khởi động
 * trong lúc người dùng còn đang nhập email/mật khẩu → lúc bấm "Đăng nhập"
 * thì backend đã warm và trả về trong 1-2s.
 *
 * Endpoint dùng: `GET /api/v1/courses` (public, GET → an toàn, không tạo data).
 *
 * ⚠️ Luôn trả về `void` và nuốt lỗi — warm-up là best-effort, không được
 * chặn luồng đăng nhập (ví dụ khi dev chạy FE mà không chạy BE).
 */
export async function warmUpBackend(): Promise<void> {
  try {
    await axiosClient.get('/api/v1/courses', { timeout: COLD_START_TIMEOUT_MS });
  } catch {
    // Bỏ qua: lỗi ở đây không ảnh hưởng luồng đăng nhập.
  }
}

export async function loginRequest(email: string, password: string) {
  const { data } = await axiosClient.post<BeResponse<AuthDto>>('/api/v1/auth/login', { email, password }, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  if (!data.result) throw new Error(data.message || 'Đăng nhập thất bại');
  return ok({ ...data.result, user: toUser(data.result.user) }, data.message);
}

/** Đăng ký: tạo tài khoản CHƯA kích hoạt với mật khẩu người dùng nhập + gửi email chứa link xác minh. */
export async function registerRequest(payload: { email: string; password: string; fullName: string; phone?: string }) {
  const { data } = await axiosClient.post<BeResponse<UserDto>>('/api/v1/auth/register', payload, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  if (!data.result) throw new Error(data.message || 'Đăng ký thất bại');
  return ok(toUser(data.result), data.message);
}

/** Kiểm tra token kích hoạt từ link email (trang /activate). */
export async function verifyActivationTokenRequest(token: string) {
  const { data } = await axiosClient.post<BeResponse<{ email: string; fullName: string }>>(
    '/api/v1/auth/verify-activation-token', { token }, { timeout: COLD_START_TIMEOUT_MS });
  if (!data.result) throw new Error(data.message || 'Link kích hoạt không hợp lệ');
  return ok(data.result, data.message);
}

/** Hoàn tất kích hoạt: xác minh token từ link email → kích hoạt + trả phiên JWT (auto-login). */
export async function activateAccountRequest(token: string) {
  const { data } = await axiosClient.post<BeResponse<AuthDto>>('/api/v1/auth/activate', { token }, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  if (!data.result) throw new Error(data.message || 'Kích hoạt tài khoản thất bại');
  return ok({ ...data.result, user: toUser(data.result.user) }, data.message);
}

/** Gửi lại email kích hoạt cho tài khoản chưa active (luôn thành công phía client). */
export async function resendActivationRequest(email: string) {
  const { data } = await axiosClient.post<BeResponse<null>>('/api/v1/auth/resend-activation', { email }, {
    timeout: ACTIVATION_EMAIL_TIMEOUT_MS,
  });
  return ok(null, data.message || 'Đã gửi lại email kích hoạt');
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await axiosClient.post<BeResponse<AuthDto>>('/api/v1/auth/refresh', { refreshToken }, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  if (!data.result) throw new Error(data.message || 'Refresh thất bại');
  return ok(data.result, data.message);
}

export const logoutRequest = () => axiosClient.post('/api/v1/auth/logout');
export const changePasswordRequest = (payload: ChangePasswordDto) => axiosClient.post('/api/v1/auth/change-password', payload);

export async function getProfile() {
  const { data } = await axiosClient.get<BeResponse<UserDto>>('/api/v1/account/me');
  if (!data.result) throw new Error(data.message || 'Không lấy được hồ sơ');
  return toUser(data.result);
}
export async function updateProfile(payload: ProfileUpdateDto) {
  const { data } = await axiosClient.put<BeResponse<UserDto>>('/api/v1/account/me', payload);
  if (!data.result) throw new Error(data.message || 'Cập nhật hồ sơ thất bại');
  return toUser(data.result);
}

export async function getUsers(params: { keyword?: string; roleName?: string; isActive?: boolean; page?: number; size?: number }) {
  const { data } = await axiosClient.get<PageResponse<UserDto>>('/api/v1/admin/users', { params });
  return { ...data, data: data.data.map(toUser) };
}
export const getUser = async (id: string) => (await axiosClient.get<BeResponse<UserDto>>(`/api/v1/admin/users/${id}`)).data.result;
export const updateUserStatus = (id: string, isActive: boolean) => axiosClient.put(`/api/v1/admin/users/${id}/status`, { isActive });
export const assignRole = (id: string, roleName: string) => axiosClient.post(`/api/v1/admin/users/${id}/roles`, { roleName });
export const getRoles = async () => (await axiosClient.get<BeResponse<RoleDto[]>>('/api/v1/admin/roles')).data.result ?? [];
export const createMentor = async (payload: CreateMentorDto) =>
  (await axiosClient.post<BeResponse<CreateMentorResponseDto>>('/api/v1/admin/mentors', payload, {
    timeout: ACTIVATION_EMAIL_TIMEOUT_MS,
  })).data.result;
export const updateMentor = async (id: string, payload: UpdateMentorDto) => (await axiosClient.put<BeResponse<MentorDto>>(`/api/v1/admin/mentors/${id}`, payload)).data.result;
export const revokeMentor = (id: string) => axiosClient.delete(`/api/v1/admin/mentors/${id}`);

/** Admin: danh sách mentor (cả active / inactive), lọc + phân trang ở server */
export async function getAdminMentors(params: {
  keyword?: string;
  department?: string;
  specialization?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}) {
  const { data } = await axiosClient.get<PageResponse<MentorDto>>('/api/v1/admin/mentors', { params });
  return data;
}
export const getAdminMentorStats = async () =>
  (await axiosClient.get<BeResponse<MentorStatsDto>>('/api/v1/admin/mentors/stats')).data.result;

export async function getMentors(params: { specialization?: string; minRate?: number; maxRate?: number; page?: number; size?: number }) {
  const { data } = await axiosClient.get<PageResponse<MentorDto>>('/api/v1/mentors', { params });
  return data;
}
export const getMentor = async (id: string) => (await axiosClient.get<BeResponse<MentorDto>>(`/api/v1/mentors/${id}`)).data.result;
