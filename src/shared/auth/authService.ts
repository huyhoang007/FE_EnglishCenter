import { errorResponse, successResponse, type ApiResponse } from '@/shared/types/apiResponse';
import type { AuthData, AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '@/shared/types/auth.types';
import {
  changePasswordRequest,
  getProfile,
  loginRequest,
  logoutRequest,
  registerRequest,
  refreshRequest,
} from '@/shared/api/domainApi';

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.response?.data?.message) {
      return String(err.response.data.message);
    }
    if (err.message) {
      return String(err.message);
    }
  }
  return fallback;
}

export const loginApi = async (payload: LoginRequest): Promise<AuthResponse> => {
  try {
    const res = await loginRequest(payload.email, payload.password);
    const data = res.data;
    return successResponse({ ...data, user: data.user } as AuthData, res.message || 'Đăng nhập thành công');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'), 'LOGIN_FAILED');
  }
};

export const registerApi = async (payload: RegisterRequest): Promise<AuthResponse> => {
  if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
    return errorResponse('Mật khẩu xác nhận không khớp', 'PASSWORD_MISMATCH');
  }
  try {
    const cleanPhone = payload.phone?.trim() ? payload.phone.trim() : undefined;
    await registerRequest({
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName.trim(),
      phone: cleanPhone,
    });
    return loginApi({ email: payload.email.trim(), password: payload.password });
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Đăng ký tài khoản thất bại.'), 'REGISTER_FAILED');
  }
};

export const logoutApi = async (): Promise<ApiResponse<null>> => {
  try {
    await logoutRequest();
    return successResponse(null, 'Đăng xuất thành công');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Đăng xuất thất bại'), 'LOGOUT_FAILED');
  }
};

export const getMyProfileApi = async (_accessToken?: string): Promise<ApiResponse<AuthUser>> => {
  try {
    return successResponse(await getProfile(), 'Lấy profile thành công');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Không lấy được profile'), 'PROFILE_FAILED');
  }
};

export const refreshTokenApi = async (refreshToken: string) => {
  try {
    return await refreshRequest(refreshToken);
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Refresh thất bại'), 'REFRESH_FAILED');
  }
};

export const changePasswordApi = async (currentPassword: string, newPassword: string) => {
  try {
    await changePasswordRequest({ currentPassword, newPassword });
    return successResponse(null, 'Đổi mật khẩu thành công');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Đổi mật khẩu thất bại'), 'PASSWORD_CHANGE_FAILED');
  }
};
