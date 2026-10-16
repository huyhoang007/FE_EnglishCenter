/**
 * env — biến môi trường tập trung
 * -----------------------------------------------------------
 * Đọc và chuẩn hoá các biến Vite (VITE_*) cùng defaults an toàn.
 * Mọi nơi cần env đều import từ đây để tránh gọi thẳng import.meta.env.
 */

const env = (import.meta as { env?: Record<string, string> }).env ?? {};

export const ENV = {
  apiUrl: env.VITE_API_URL ?? 'http://localhost:8081',
  appEnv: env.VITE_APP_ENV ?? 'development',
  appName: env.VITE_APP_NAME ?? 'PrepMaster',
  payOsClientId: env.VITE_PAYOS_CLIENT_ID ?? '',
  payOsApiKey: env.VITE_PAYOS_API_KEY ?? '',
  payOsChecksumKey: env.VITE_PAYOS_CHECKSUM_KEY ?? '',
} as const;

export type EnvShape = typeof ENV;
