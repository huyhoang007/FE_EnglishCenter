/**
 * HTTP Client (placeholder)
 * -----------------------------------------------------------
 * Sẽ thay thế bằng axios instance cấu hình sẵn baseURL, headers,
 * interceptors, refresh-token rotation. Hiện tại các API mock
 * trong từng feature/service trả Promise<ApiResponse<T>>.
 *
 * Convention cho mọi API service:
 *   export const xxxApi = async (payload): Promise<ApiResponse<T>> => { ... }
 */

import type { ApiResponse } from '@/shared/types';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Bỏ qua refresh token rotation cho endpoint công khai */
  skipAuth?: boolean;
}

/** Base URL (chỉ dùng khi wire backend thật) */
export const API_BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '/api';

/** Hàm fetch chuẩn hoá — sẽ triển khai đầy đủ khi có backend thật */
export async function httpRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, skipAuth: _skipAuth, headers, ...rest } = options;
  void _skipAuth;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    return {
      success: false,
      message: `HTTP ${res.status}`,
      data: null as T,
      errorCode: `HTTP_${res.status}`,
    };
  }
  return (await res.json()) as ApiResponse<T>;
}
