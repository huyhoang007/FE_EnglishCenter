/**
 * axiosClient — HTTP client chuẩn hoá
 * -----------------------------------------------------------
 * Khi tích hợp Backend thật, đây là nơi cấu hình baseURL,
 * headers, interceptors và refresh-token rotation.
 *
 * Hiện tại axios đã được cài (xem package.json) nhưng chưa có
 * backend thật → giữ instance này làm single source-of-truth
 * để các service sau này import trực tiếp.
 */

import axios from 'axios';

export const API_BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ??
  'http://localhost:8081';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự gắn Authorization nếu có token trong localStorage
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('prepmaster-ai-auth');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          state?: { accessToken?: string };
        };
        const token = parsed.state?.accessToken;
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      /* ignore — token không hợp lệ thì bỏ qua */
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosClient;
