/**
 * Auth Service — gọi Backend thật (English Center BE)
 * -----------------------------------------------------------
 * Endpoints sử dụng:
 *   POST /api/v1/auth/register   → BE trả ApiResponse<UserResponse> (KHÔNG kèm token)
 *   POST /api/v1/auth/login      → BE trả ApiResponse<TokenResponse>
 *   POST /api/v1/auth/refresh    → BE trả ApiResponse<TokenResponse>
 *   POST /api/v1/auth/logout     → BE trả ApiResponse<Void>
 *   GET  /api/v1/users/me        → BE trả ApiResponse<UserResponse>
 *
 * BE trả cấu trúc: { code: 1000, message, result: T } (Spring Boot)
 * FE quy ước:       { success, message, data: T, errorCode? }
 * → Module này có adapter `unwrapApiResponse()` để map tự động.
 *
 * Đăng ký thành công (BE chỉ trả UserResponse, không trả token) → tự động
 * gọi tiếp /auth/login để lấy token → coi như user vừa đăng ký xong đã đăng nhập.
 */

import {
  errorResponse,
  successResponse,
  type ApiResponse,
} from '@/shared/types/apiResponse';
import type {
  AuthData,
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@/shared/types/auth.types';

/* ====================== Cấu hình HTTP ====================== */
const API_BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ??
  'http://localhost:8081';

const REQUEST_TIMEOUT_MS = 15000;

/** Map từ BE Spring ApiResponse (code/result) sang FE ApiResponse (success/data). */
function unwrapApiResponse<T>(raw: unknown): ApiResponse<T> {
  const r = raw as { code?: number; message?: string; result?: T; data?: T };
  if (r && typeof r === 'object' && 'code' in r && 'result' in r) {
    return {
      success: r.code === 1000,
      message: r.message ?? '',
      data: r.result as T,
    };
  }
  // Nếu BE trả thẳng ApiResponse shape của FE (cho error handler) thì pass-through
  if (r && typeof r === 'object' && 'success' in r) {
    return r as unknown as ApiResponse<T>;
  }
  return {
    success: true,
    message: '',
    data: r as T,
  };
}

interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
}

async function http<T>(endpoint: string, opts: HttpOptions = {}): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (opts.accessToken) {
      headers['Authorization'] = `Bearer ${opts.accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: opts.method ?? 'POST',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? controller.signal,
    });

    // BE trả lỗi vẫn có body JSON dạng ApiResponse {code, message, result}
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = { code: res.status, message: `HTTP ${res.status}`, result: null };
    }

    if (!res.ok) {
      const wrapped = unwrapApiResponse<T>(raw);
      return {
        success: false,
        message: wrapped.message || `HTTP ${res.status}`,
        data: null as T,
        errorCode: `HTTP_${res.status}`,
      };
    }

    return unwrapApiResponse<T>(raw);
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === 'AbortAbort';
    const message = isAbort
      ? 'Yêu cầu bị timeout, vui lòng thử lại'
      : err instanceof Error
        ? `Không kết nối được Backend (${err.message})`
        : 'Lỗi không xác định';
    return {
      success: false,
      message,
      data: null as T,
      errorCode: 'NETWORK_ERROR',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* ====================== Shape nội bộ ====================== */

/** Shape BE trả từ /auth/login và /auth/refresh */
interface TokenResponseBE {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
}

/** Shape BE trả từ /auth/register và /users/me */
interface UserResponseBE {
  userId: number;
  email: string;
  fullName: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  roles: string[];
}

/** Chuyển UserResponseBE → AuthUser FE */
function toAuthUser(u: UserResponseBE): AuthUser {
  const role: UserRole =
    (u.roles?.[0]?.toUpperCase() as UserRole) ?? 'STUDENT';
  return {
    id: String(u.userId),
    fullName: u.fullName,
    email: u.email,
    role,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      u.email,
    )}`,
  };
}

function tokenToAuthData(
  token: TokenResponseBE,
  user: AuthUser,
): AuthData {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    user,
    expiresIn: token.expiresIn,
  };
}

/* ====================== API thật (BE) ====================== */

/**
 * POST /auth/login
 * BE trả TokenResponse → FE cần 1 lần gọi thêm /users/me để có thông tin user.
 * Để tiết kiệm round-trip, /auth/login của FE vẫn chỉ cần 1 call BE.
 * (User info sẽ được lấy qua /users/me ở trang Dashboard sau khi login thành công.)
 */
export const loginApi = async (payload: LoginRequest): Promise<AuthResponse> => {
  const res = await http<TokenResponseBE>('/api/v1/auth/login', {
    method: 'POST',
    body: { email: payload.email, password: payload.password },
  });

  if (!res.success || !res.data) {
    return errorResponse(res.message || 'Đăng nhập thất bại', res.errorCode);
  }

  const token = res.data;
  // Lấy thông tin user từ /users/me (cần access token)
  const meRes = await http<UserResponseBE>('/api/v1/users/me', {
    method: 'GET',
    accessToken: token.accessToken,
  });

  if (!meRes.success || !meRes.data) {
    return errorResponse(
      meRes.message || 'Không lấy được thông tin người dùng',
      meRes.errorCode,
    );
  }

  const user = toAuthUser(meRes.data);
  return successResponse(tokenToAuthData(token, user), 'Đăng nhập thành công');
};

/**
 * POST /auth/register
 * BE chỉ trả UserResponse (không kèm token) → tự gọi /auth/login để có token,
 * trả về AuthData đầy đủ như login.
 */
export const registerApi = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const regRes = await http<UserResponseBE>('/api/v1/auth/register', {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
    },
  });

  if (!regRes.success || !regRes.data) {
    return errorResponse(
      regRes.message || 'Đăng ký thất bại',
      regRes.errorCode ?? 'REGISTER_FAILED',
    );
  }

  // Tự động login luôn để lấy token
  return loginApi({ email: payload.email, password: payload.password });
};

/**
 * POST /auth/logout
 * Hiện tại BE là no-op (stateless JWT) → vẫn gọi cho đúng contract.
 */
export const logoutApi = async (): Promise<ApiResponse<null>> => {
  const res = await http<null>('/api/v1/auth/logout', { method: 'POST' });
  if (!res.success) {
    return errorResponse(res.message || 'Đăng xuất thất bại', res.errorCode);
  }
  return successResponse(null, 'Đăng xuất thành công');
};

/**
 * GET /users/me
 */
export const getMyProfileApi = async (
  accessToken: string,
): Promise<ApiResponse<AuthUser>> => {
  const res = await http<UserResponseBE>('/api/v1/users/me', {
    method: 'GET',
    accessToken,
  });
  if (!res.success || !res.data) {
    return errorResponse(res.message || 'Không lấy được profile', res.errorCode);
  }
  return successResponse(toAuthUser(res.data), 'Lấy profile thành công');
};

/**
 * POST /auth/refresh
 */
export const refreshTokenApi = async (
  refreshToken: string,
): Promise<ApiResponse<TokenResponseBE>> => {
  return http<TokenResponseBE>('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
};

/* ====================== Mock Demo Login (Student) ======================
 * Giữ 1 nút Student Demo để demo Gold Flow cho thầy mà không cần BE.
 * Mentor/Admin đã bỏ — chỉ dùng BE thật với role tương ứng.
 */
const MOCK_STUDENT: AuthUser = {
  id: 'usr_student_demo',
  fullName: 'Nguyễn Minh Anh (Demo)',
  email: 'student@englishhub.vn',
  role: 'STUDENT',
  avatarUrl:
    'https://api.dicebear.com/7.x/avataaars/svg?seed=student&backgroundColor=b6e3f4',
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const randomToken = (role: string) =>
  `mock.${role}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;

/** Mock Student Demo Login — dùng để demo Gold Flow, không gọi BE. */
export const mockStudentDemoApi = async (): Promise<AuthResponse> => {
  await delay(200);
  const data: AuthData = {
    accessToken: randomToken('student'),
    refreshToken: randomToken('student'),
    user: MOCK_STUDENT,
    expiresIn: 60 * 60,
  };
  return successResponse(data, 'Đăng nhập nhanh (Demo Student)');
};
