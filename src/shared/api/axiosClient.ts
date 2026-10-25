import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/shared/types/apiResponse';

/**
 * Base URL của Backend Dev 2.
 *
 * Mặc định dùng đường dẫn tương đối `/api/v1` để đi qua dev proxy của
 * Vite (xem `vite.config.js`) — tránh CORS và không phụ thuộc hostname.
 * Khi build production, đặt `VITE_API_URL` thành domain thật (VD:
 * https://api.prepmaster.com) qua biến môi trường.
 */
export const API_BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '';

export interface BeResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

export interface PageResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  data: T[];
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_STORAGE_KEY = 'prepmaster-ai-auth';
let refreshPromise: Promise<string | null> | null = null;

function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw).state ?? {}) : {};
  } catch {
    return {};
  }
}

function writeTokens(accessToken: string, refreshToken?: string) {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state = { ...parsed.state, accessToken, ...(refreshToken ? { refreshToken } : {}) };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* auth state will be replaced on the next login */
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore storage failures */
  }
}

async function refreshAccessToken() {
  const refreshToken = readAuth().refreshToken as string | undefined;
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = axios
      .post<BeResponse<{ accessToken: string; refreshToken?: string }>>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .then(({ data }) => {
        const tokens = data.result;
        if (!tokens?.accessToken) return null;
        writeTokens(tokens.accessToken, tokens.refreshToken);
        return tokens.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readAuth().accessToken as string | undefined;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';
    const isAuthEndpoint = url.includes('/api/v1/auth/');
    if (status !== 401 || !config || config._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }
    config._retry = true;
    const token = await refreshAccessToken();
    if (!token) {
      clearAuth();
      return Promise.reject(error);
    }
    config.headers.Authorization = `Bearer ${token}`;
    return axiosClient(config);
  },
);

/* =====================================================================
 * Helper gọi API kiểu "không ném lỗi" (Dev 5 — schedule, notification,
 * learning path, AI practice). Dùng chung axiosClient + interceptor ở trên.
 *   apiGet / apiPost / apiPut / apiDelete → luôn trả ApiResponse<T> { success, message, data, errorCode? }
 *   BE ApiResponse { code: 1000, message, result } → data = result
 *   BE PageResponse { currentPage, ..., data }      → data = cả object
 * ===================================================================== */

/** Mã thành công của BE (ApiResponse.code) */
const SUCCESS_CODE = 1000;

function toApiResponse<T>(body: unknown): ApiResponse<T> {
  if (body && typeof body === 'object' && 'code' in body) {
    const r = body as { code: number; message?: string; result?: T };
    return {
      success: r.code === SUCCESS_CODE,
      message: r.message ?? '',
      data: r.result as T,
      errorCode: r.code === SUCCESS_CODE ? undefined : String(r.code),
    };
  }
  // PageResponse hoặc dữ liệu thô
  return { success: true, message: '', data: body as T };
}

function toErrorResponse<T>(err: unknown): ApiResponse<T> {
  const error = err as AxiosError<{ code?: number; message?: string }>;
  if (!error.response) {
    return {
      success: false,
      message:
        error.code === 'ECONNABORTED'
          ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại'
          : 'Không kết nối được máy chủ. Kiểm tra Backend đã chạy chưa',
      data: null as T,
      errorCode: 'NETWORK_ERROR',
    };
  }
  const status = error.response.status;
  const body = error.response.data;
  const fallback =
    status === 401
      ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
      : status === 403
        ? 'Bạn không có quyền thực hiện thao tác này'
        : `Lỗi máy chủ (HTTP ${status})`;
  return {
    success: false,
    message: body?.message || fallback,
    data: null as T,
    // Mã lỗi BE (vd "6013"), không có thì dùng HTTP_xxx
    errorCode: body?.code ? String(body.code) : `HTTP_${status}`,
  };
}

async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const res = await axiosClient.request(config);
    return toApiResponse<T>(res.data);
  } catch (err) {
    return toErrorResponse<T>(err);
  }
}

export interface ApiRequestOptions {
  params?: Record<string, unknown>;
  /** Ghi đè timeout (ms), vd AI chấm bài cần lâu hơn */
  timeout?: number;
}

export const apiGet = <T>(url: string, options: ApiRequestOptions = {}) =>
  request<T>({ method: 'GET', url, ...options });

export const apiPost = <T>(url: string, body?: unknown, options: ApiRequestOptions = {}) =>
  request<T>({ method: 'POST', url, data: body, ...options });

export const apiPut = <T>(url: string, body?: unknown, options: ApiRequestOptions = {}) =>
  request<T>({ method: 'PUT', url, data: body, ...options });

export const apiDelete = <T>(url: string, options: ApiRequestOptions = {}) =>
  request<T>({ method: 'DELETE', url, ...options });

/**
 * Dùng trong queryFn của TanStack Query: success → trả data, thất bại → ném Error(message)
 * để useQuery chuyển sang trạng thái isError.
 */
export function unwrapOrThrow<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.message || 'Yêu cầu thất bại');
  }
  return res.data;
}

/** Lấy message từ lỗi bất kỳ (dùng khi hiển thị error của useQuery/useMutation) */
export const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Đã có lỗi xảy ra, vui lòng thử lại';

export default axiosClient;
