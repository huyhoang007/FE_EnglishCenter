import { errorResponse, successResponse, type ApiResponse } from '@/shared/types/apiResponse';
import type { ActivationInfo, AuthData, AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '@/shared/types/auth.types';
import {
  activateAccountRequest,
  changePasswordRequest,
  getProfile,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendActivationRequest,
  verifyActivationTokenRequest,
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

/**
 * Đăng ký bằng email — KHÔNG auto-login nữa.
 * Backend tạo tài khoản chưa kích hoạt và gửi email chứa link đặt mật khẩu;
 * người dùng hoàn tất tại trang /set-password (activateApi).
 */
export const registerApi = async (payload: RegisterRequest): Promise<ApiResponse<null>> => {
  try {
    const cleanPhone = payload.phone?.trim() ? payload.phone.trim() : undefined;
    await registerRequest({
      email: payload.email.trim(),
      fullName: payload.fullName.trim(),
      phone: cleanPhone,
    });
    return successResponse(null, 'Vui lòng kiểm tra email để đặt mật khẩu và kích hoạt tài khoản');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Đăng ký tài khoản thất bại.'), 'REGISTER_FAILED');
  }
};

/** Kiểm tra token kích hoạt từ link email (trang /set-password). */
export const verifyActivationTokenApi = async (token: string): Promise<ApiResponse<ActivationInfo>> => {
  try {
    const res = await verifyActivationTokenRequest(token);
    return successResponse(res.data, res.message || 'Link hợp lệ');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Link kích hoạt không hợp lệ hoặc đã hết hạn.'), 'ACTIVATION_TOKEN_INVALID');
  }
};

/** Đặt mật khẩu + kích hoạt tài khoản; thành công trả phiên JWT (auto-login). */
export const activateApi = async (token: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await activateAccountRequest(token, password);
    const data = res.data;
    return successResponse({ ...data, user: data.user } as AuthData, res.message || 'Kích hoạt tài khoản thành công');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Kích hoạt tài khoản thất bại.'), 'ACTIVATE_FAILED');
  }
};

/** Gửi lại email kích hoạt (luồng pending registration). */
export const resendActivationApi = async (email: string): Promise<ApiResponse<null>> => {
  try {
    await resendActivationRequest(email);
    return successResponse(null, 'Đã gửi lại email kích hoạt. Vui lòng kiểm tra hộp thư.');
  } catch (error) {
    return errorResponse(getErrorMessage(error, 'Gửi lại email thất bại, vui lòng thử lại sau.'), 'RESEND_FAILED');
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
