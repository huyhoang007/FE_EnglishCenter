/**
 * Format helpers dùng chung toàn hệ thống
 * -----------------------------------------------------------
 * Tách ra khỏi mock data để có thể dùng ở mọi nơi.
 */

/** Format số VND: 3490000 → "3.490.000 ₫" */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Format số có dấu phân cách hàng nghìn */
export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('vi-VN').format(n);

/** Định dạng ngày kiểu Việt Nam dd/MM/yyyy */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Đếm số từ trong chuỗi (bỏ qua khoảng trắng thừa) */
export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Làm tròn về 0.5 gần nhất (round-half-up) — quy tắc làm tròn chung của:
 * - VSTEP.3–5 overall (Bộ GD&ĐT)
 * - IELTS Overall
 * - TOEFL iBT thang 1–6 (từ 21/01/2026)
 *
 * Tương đương quy tắc .25/.75:
 *   phần thập phân < .25 → về .0 | [.25, .75) → về .5 | >= .75 → lên 1.0
 * Ví dụ: 7.125 → 7.0 | 7.375 → 7.5 | 6.75 → 7.0
 */
export const roundToHalfStep = (rawScore: number): number => {
  if (Number.isNaN(rawScore)) return 0;
  const intPart = Math.floor(rawScore);
  const decimal = Math.round((rawScore - intPart) * 1000) / 1000;

  if (decimal < 0.25) return intPart;
  if (decimal < 0.75) return intPart + 0.5;
  return intPart + 1.0;
};

/** Làm tròn về bước nhảy cho trước (dùng cho thang điểm có bước nhảy tuỳ biến). */
export const roundToStep = (value: number, step: number): number => {
  if (!step || step <= 0) return value;
  return Math.round(value / step) * step;
};
