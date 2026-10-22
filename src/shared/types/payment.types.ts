/**
 * PayOS Payment Domain Types
 * -----------------------------------------------------------
 * Chuẩn hóa theo tích hợp cổng thanh toán PayOS (Open Banking /
 * VietQR tự động đối soát — Napas247).
 *
 * Mapping với Backend Dev 4:
 *   - orderCode            → Server tạo khi POST /api/payments/create
 *   - qrCode               → Trả về chuỗi VietQR (payload) từ PayOS
 *   - status               → Server cập nhật khi nhận IPN webhook
 *   - confirmationCode     → CONF-YYYYMMDD-XXXX do server cấp
 *   - enrollmentId         → Auto tạo khi status=PAID
 */

import type { ApiResponse } from '@/shared/types';

/* ============================================================
 *  1. Trạng thái đơn hàng (khớp với vòng đời PayOS)
 * ============================================================ */
export type PayOSStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

/* ============================================================
 *  2. PayOSPaymentData — payload trả về từ POST /api/payments/create
 * ============================================================ */
export interface PayOSPaymentData {
  /** Mã đơn hàng số nguyên duy nhất (VD: 2026101188) */
  orderCode: number;
  /** Số tiền VND (VD: 3490000) */
  amount: number;
  /** Nội dung CK chuẩn PayOS — bắt buộc giữ nguyên (VD: "PREP 2026101188") */
  description: string;
  /** Số tài khoản nhận (VD: "0000123456789") */
  accountNumber: string;
  /** Tên chủ tài khoản thụ hưởng (VD: "CONG TY CP CONG NGHE PREPMASTER AI") */
  accountName: string;
  /** Mã BIN ngân hàng thụ hưởng — VD: "970415" (VietinBank) / "970422" (MB Bank) */
  bin: string;
  /** Tên ngân hàng hiển thị — mapping từ bin */
  bankName: string;
  /** Chuỗi VietQR raw (dùng để render QR + verify) */
  qrCode: string;
  /** ID liên kết thanh toán từ PayOS */
  paymentLinkId: string;
  /** Trạng thái hiện tại */
  status: PayOSStatus;
  /** ISO datetime — thời điểm hết hạn giữ chỗ (mặc định +15 phút) */
  expiredAt: string;
  /** Checkout URL sang trang PayOS (dùng cho mobile) */
  checkoutUrl?: string;
}

/* ============================================================
 *  3. PayOSTransaction — record đầy đủ kèm confirmation
 * ============================================================ */
export interface PayOSTransaction extends PayOSPaymentData {
  /** Mã đơn hàng nội bộ (ORD-YYYYMMDD-XXXX) — mapping với orderCode */
  internalOrderId: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  createdAt: string;
  paidAt?: string;
  /** Mã xác nhận do server cấp (CONF-20261011-XXXX) */
  confirmationCode?: string;
  /** Enrollment ID được tạo tự động khi PAID */
  enrollmentId?: string;
}

/* ============================================================
 *  4. Request / Response shapes (khớp Backend Dev 4)
 * ============================================================ */

/** Cổng thanh toán khả dụng trong modal checkout. */
export type PaymentMethod = 'VIETQR' | 'VNPAY';

export type CreatePayOSOrderRequest = {
  courseId: string;
  courseTitle: string;
  amount: number;
};

export type CreatePayOSOrderResponse = ApiResponse<PayOSPaymentData>;

export type SimulatePayOSWebhookRequest = {
  orderCode: number;
  /** Mặc định: 'PAID' (giả lập ngân hàng báo tiền về) */
  status?: PayOSStatus;
};

export type SimulatePayOSWebhookResponse = ApiResponse<{
  transaction: PayOSTransaction;
  confirmationCode: string;
  enrollmentId: string;
}>;

export type GetPayOSOrderResponse = ApiResponse<PayOSTransaction>;

/* ============================================================
 *  5. Constants
 * ============================================================ */
export const PAYOS_HOLD_MINUTES = 15;
export const PAYOS_BANK_BIN = {
  VIETINBANK: '970415',
  MB_BANK: '970422',
} as const;
export const PAYOS_BANK_NAME: Record<string, string> = {
  '970415': 'VietinBank',
  '970422': 'MB Bank',
};
export const PAYOS_RECEIVER_ACCOUNT = '0000123456789';
export const PAYOS_RECEIVER_NAME = 'CONG TY CP CONG NGHE PREPMASTER AI';
