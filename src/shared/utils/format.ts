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
