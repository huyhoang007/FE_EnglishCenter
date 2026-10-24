import type { OrderStatus } from '../types/sepay.types';
export const ORDER_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn', REVIEW_REQUIRED: 'Cần đối soát',
};
export const ORDER_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-blue-50 text-blue-700', PAID: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-600', EXPIRED: 'bg-slate-100 text-slate-600',
  REVIEW_REQUIRED: 'bg-amber-50 text-amber-800',
};
export function remainingSeconds(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 1000)) : 0;
}
export function canShowPaymentQr(status: OrderStatus, expiresAt: string, now = Date.now()) {
  return status === 'PENDING' && remainingSeconds(expiresAt, now) > 0;
}
export function paymentError(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string } | null;
  return err?.response?.data?.message || err?.message || 'Không thể kết nối. Vui lòng thử lại.';
}
export function paymentDate(value: string | null): string {
  if (!value) return '—';
  // The backend's legacy LocalDateTime payment/enrollment fields are stored in UTC.
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
}
export function courseVideo(url: string | null): { url: string; embed: boolean } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    let youtubeId: string | null = null;
    if (host === 'youtu.be') youtubeId = parsed.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      youtubeId = parsed.searchParams.get('v') || (/^\/(?:embed|shorts)\/([\w-]+)$/.exec(parsed.pathname)?.[1] ?? null);
    }
    if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) return { url: `https://www.youtube-nocookie.com/embed/${youtubeId}`, embed: true };
    return { url: parsed.href, embed: false };
  } catch { return null; }
}
