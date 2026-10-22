import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

export default axiosClient;
