/**
 * HTTP Client (placeholder)
 * -----------------------------------------------------------
 * ĐÃ LƯU Ý: file này chỉ còn là fallback cho các module cũ.
 * Toàn bộ API mới (Dev 2) dùng `axiosClient.ts` — có sẵn interceptor
 * gắn `Authorization: Bearer <token>` + refresh-token rotation.
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
export const HTTP_BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '';

/** Hàm fetch chuẩn hoá — ưu tiên dùng `axiosClient` cho request mới. */
export async function httpRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, skipAuth: _skipAuth, headers, ...rest } = options;
  void _skipAuth;
  const res = await fetch(`${HTTP_BASE_URL}${endpoint}`, {
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
