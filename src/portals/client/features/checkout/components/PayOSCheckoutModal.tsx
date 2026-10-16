/**
 * PayOSCheckoutModal — Gold Flow #3 (chuẩn PayOS)
 * -----------------------------------------------------------
 * Cổng thanh toán tự động PayOS — VietQR / Napas247.
 *
 * Layout: 2 cột
 *   - Trái:  Thông tin ngân hàng thụ hưởng + nút Copy 1-click
 *   - Phải:  Khung VietQR có hiệu ứng scan chờ webhook
 *
 * Tính năng Demo cho buổi báo cáo:
 *   - Bộ đếm ngược 15:00 (giữ chỗ)
 *   - Chỉ báo "Webhook: Đang lắng nghe IPN" với chấm pulse
 *   - Nút "Giả lập PayOS Webhook" → spinner 1s → status=PAID →
 *     sinh confirmationCode + enrollmentId → success screen
 *
 * Khi success, props.onSuccess() được gọi để:
 *   - Cập nhật enrollment store
 *   - Đóng modal
 *   - Đổi CTA thành "Đã ghi danh - Vào học ngay"
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ShieldCheck,
  Copy,
  QrCode,
  Check,
  Clock,
  AlertCircle,
  ExternalLink,
  Banknote,
  Loader2,
  Sparkles,
  PartyPopper,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';
import type { Course } from '@/shared/types';
import { formatVND } from '@/shared/utils';
import { useEnrollmentStore } from '@/shared/stores';
import {
  PAYOS_BANK_BIN,
  PAYOS_BANK_NAME,
  PAYOS_HOLD_MINUTES,
  PAYOS_RECEIVER_ACCOUNT,
  PAYOS_RECEIVER_NAME,
  type PayOSPaymentData,
  type PayOSStatus,
} from '@/shared/types';

export interface PayOSCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  /** Callback sau khi thanh toán thành công (đã enroll) */
  onSuccess?: (payload: {
    orderCode: number;
    confirmationCode: string;
    enrollmentId: string;
  }) => void;
}

/* ============================================================
 *  Helpers
 * ============================================================ */

/** Sinh orderCode số nguyên kiểu PayOS: YYYYMMDDxxx */
const generateOrderCode = (): number => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  // 3 chữ số random — vẫn đảm bảo số nguyên < 2^53
  const rnd = Math.floor(Math.random() * 900 + 100);
  return Number(`${ymd}${rnd}`);
};

/** Sinh confirmation code: CONF-YYYYMMDD-XXXX */
const generateConfirmationCode = (): string => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `CONF-${ymd}-${rnd}`;
};

/** Sinh enrollmentId: ENR-YYYYMMDD-XXXXX */
const generateEnrollmentId = (): string => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `ENR-${ymd}-${rnd}`;
};

/** Tạo QR placeholder dạng SVG (VietQR style, không cần thư viện ngoài) */
const generatePayOSQrSvg = (payload: string): string => {
  const size = 25;
  let cells = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // hash dựa trên payload
      const v =
        (x * 31 + y * 17 + payload.charCodeAt((x + y) % payload.length)) % 5;
      const isFinder =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      const isFinderBorder =
        isFinder &&
        ((x === 0 || x === 6 || x === size - 1 || x === size - 7) ||
          (y === 0 || y === 6 || y === size - 1 || y === size - 7));
      const isFinderCenter =
        isFinder && x >= 2 && x <= 4 && y >= 2 && y <= 4;
      const isData = v < 2 && !isFinder;
      if (isData || isFinderBorder || isFinderCenter) {
        cells += `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#0F172A"/>`;
      }
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 ${size * 8} ${size * 8}">${cells}</svg>`,
  )}`;
};

/* ============================================================
 *  Component
 * ============================================================ */

export const PayOSCheckoutModal: React.FC<PayOSCheckoutModalProps> = ({
  open,
  onOpenChange,
  course,
  onSuccess,
}) => {
  const enroll = useEnrollmentStore((s) => s.enroll);
  const isEnrolled = useEnrollmentStore((s) => Boolean(s.enrolled[course.id]));

  /** Khởi tạo payment data khi mở modal (mô phỏng POST /api/payments/create) */
  const [payment, setPayment] = useState<PayOSPaymentData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PAYOS_HOLD_MINUTES * 60);
  const [status, setStatus] = useState<PayOSStatus>('PENDING');
  const [reconciling, setReconciling] = useState(false);
  const [paid, setPaid] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [enrollmentId, setEnrollmentId] = useState<string>('');
  const [copyKey, setCopyKey] = useState<'' | 'account' | 'name' | 'desc'>('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -------- Tạo payment data khi mở -------- */
  useEffect(() => {
    if (!open) return;
    const orderCode = generateOrderCode();
    const description = `PREP ${orderCode}`;
    const expiredAt = new Date(
      Date.now() + PAYOS_HOLD_MINUTES * 60_000,
    ).toISOString();
    setPayment({
      orderCode,
      amount: course.price,
      description,
      accountNumber: PAYOS_RECEIVER_ACCOUNT,
      accountName: PAYOS_RECEIVER_NAME,
      bin: PAYOS_BANK_BIN.VIETINBANK,
      bankName: PAYOS_BANK_NAME[PAYOS_BANK_BIN.VIETINBANK],
      // payload VietQR raw — chuỗi này sẽ được backend gọi PayOS API tạo QR
      qrCode: `vietqr://${PAYOS_BANK_BIN.VIETINBANK}/${PAYOS_RECEIVER_ACCOUNT}/${course.price}/${description}`,
      paymentLinkId: `plink_${orderCode}_${Date.now()}`,
      status: 'PENDING',
      expiredAt,
      checkoutUrl: `https://pay.payos.vn/web/${orderCode}`,
    });
    setSecondsLeft(PAYOS_HOLD_MINUTES * 60);
    setStatus('PENDING');
    setPaid(false);
    setReconciling(false);
    setConfirmationCode('');
    setEnrollmentId('');
  }, [open, course.price, course.id]);

  /* -------- Countdown -------- */
  useEffect(() => {
    if (!open) return;
    if (paid) return;
    if (secondsLeft <= 0) {
      setStatus('EXPIRED');
      return;
    }
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [open, secondsLeft, paid]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  /* -------- QR image -------- */
  const qrImageUrl = useMemo(() => {
    if (!payment) return '';
    return generatePayOSQrSvg(
      `${payment.qrCode}|${payment.orderCode}|${payment.amount}`,
    );
  }, [payment]);

  /* -------- Copy 1-click -------- */
  const handleCopy = async (
    text: string,
    key: 'account' | 'name' | 'desc',
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyKey(key);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyKey(''), 1800);
    } catch {
      /* ignore */
    }
  };

  /* -------- Simulate Webhook (Demo) -------- */
  const handleSimulateWebhook = async () => {
    if (!payment) return;
    setReconciling(true);
    // Mô phỏng: 1s đối soát IPN
    await new Promise((r) => setTimeout(r, 1000));
    setReconciling(false);
    setStatus('PAID');
    setPaid(true);
    const conf = generateConfirmationCode();
    const enrId = generateEnrollmentId();
    setConfirmationCode(conf);
    setEnrollmentId(enrId);
    // Kích hoạt enrollment (Dev 4 nghiệp vụ)
    enroll({
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
      orderId: `ORD-${payment.orderCode}`,
      amount: payment.amount,
    });
    onSuccess?.({
      orderCode: payment.orderCode,
      confirmationCode: conf,
      enrollmentId: enrId,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payos-title"
    >
      <div
        className={cn(
          'w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-card shadow-elevation border border-slate-200 animate-in zoom-in-95 relative',
          paid && 'ring-2 ring-status-success/30',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============= HEADER ============= */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-input bg-gradient-to-br from-primary to-ai flex items-center justify-center shadow-ai-glow shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="payos-title"
                    className="text-base font-extrabold text-slate-900 leading-tight"
                  >
                    PayOS
                  </h2>
                  <Badge variant="ai" size="sm">
                    VietQR · Napas247
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Cổng thanh toán tự động — Đối soát trong vài giây
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-input border font-mono text-xs font-bold',
                  secondsLeft < 60
                    ? 'bg-status-danger-bg border-red-200 text-status-danger'
                    : secondsLeft < 5 * 60
                      ? 'bg-status-warning-bg border-amber-200 text-status-warning'
                      : 'bg-primary-tint border-primary/20 text-primary',
                )}
                title="Thời gian giữ chỗ thanh toán"
              >
                <Clock className="w-3.5 h-3.5" />
                {timeStr}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
                disabled={reconciling}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ============= SUCCESS OVERLAY ============= */}
        {paid && payment && (
          <div className="absolute inset-0 z-20 bg-white/97 backdrop-blur-sm flex flex-col items-center justify-center text-center px-8 py-10 animate-in fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-status-success-bg flex items-center justify-center mb-4 animate-in zoom-in-95">
                <PartyPopper className="w-12 h-12 text-status-success" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-ai-gradient flex items-center justify-center shadow-ai-glow animate-bounce">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Thanh toán thành công!
            </h3>
            <p className="text-slate-600 mt-2 max-w-md text-sm leading-relaxed">
              Khóa học{' '}
              <span className="font-bold text-slate-900">
                "{course.title}"
              </span>{' '}
              đã được mở khóa. Bạn có thể vào học ngay bây giờ.
            </p>

            <div className="mt-5 w-full max-w-sm rounded-input border border-status-success/30 bg-status-success-bg/50 p-4 space-y-1.5 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mã xác nhận</span>
                <span className="font-mono font-bold text-status-success">
                  {confirmationCode}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mã ghi danh</span>
                <span className="font-mono font-bold text-slate-800">
                  {enrollmentId}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Số tiền</span>
                <span className="font-bold text-slate-800">
                  {formatVND(payment.amount)}
                </span>
              </div>
            </div>

            <Button
              variant="success"
              size="lg"
              className="mt-6 min-w-[240px]"
              rightIcon={ExternalLink}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Vào phòng học ngay
            </Button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-3 text-xs text-slate-500 hover:text-slate-700"
            >
              Đóng & xem chi tiết khóa học
            </button>
          </div>
        )}

        {/* ============= BODY ============= */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-5">
          {/* ============ LEFT — Bank info ============ */}
          <div className="space-y-4 min-w-0">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                Thông tin chuyển khoản
              </p>

              <div className="rounded-input border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                {/* Course title */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Khóa học
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {course.title}
                  </p>
                </div>

                {/* Amount */}
                <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Số tiền thanh toán
                  </p>
                  <p
                    className="font-bold text-primary"
                    style={{ fontSize: '22px', lineHeight: '1.1' }}
                  >
                    {formatVND(payment?.amount ?? course.price)}
                  </p>
                </div>

                {/* Bank */}
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Ngân hàng thụ hưởng
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary-tint flex items-center justify-center text-primary font-extrabold text-[10px]">
                      {payment?.bankName?.includes('Vietin')
                        ? 'VTB'
                        : 'MBB'}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {payment?.bankName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        BIN {payment?.bin}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account number */}
                <CopyRow
                  label="Số tài khoản"
                  value={payment?.accountNumber ?? ''}
                  copied={copyKey === 'account'}
                  onCopy={() =>
                    handleCopy(payment?.accountNumber ?? '', 'account')
                  }
                />

                {/* Account name */}
                <CopyRow
                  label="Chủ tài khoản"
                  value={payment?.accountName ?? ''}
                  copied={copyKey === 'name'}
                  onCopy={() =>
                    handleCopy(payment?.accountName ?? '', 'name')
                  }
                />

                {/* Description — QUAN TRỌNG */}
                <div className="rounded-md bg-status-danger-bg border border-red-200 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-status-danger">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <p className="text-[10px] font-extrabold uppercase tracking-wider">
                        Nội dung (BẮT BUỘC)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(payment?.description ?? '', 'desc')
                      }
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors',
                        copyKey === 'desc'
                          ? 'bg-status-success text-white'
                          : 'bg-white text-status-danger border border-red-200 hover:bg-red-50',
                      )}
                    >
                      {copyKey === 'desc' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono font-extrabold text-status-danger text-base break-all">
                    {payment?.description}
                  </p>
                  <p className="text-[10px] text-status-danger leading-snug">
                    Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự
                    động kích hoạt khóa học trong 3 giây.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============ RIGHT — QR + Webhook ============ */}
          <div className="space-y-3 min-w-0">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                Quét mã VietQR
              </p>

              <div className="relative rounded-input border-2 border-primary/30 bg-white p-3 shadow-ai-glow">
                {/* Scan animation */}
                {!paid && (
                  <div
                    className="absolute inset-2 rounded-md pointer-events-none overflow-hidden"
                    aria-hidden
                  >
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2.2s_ease-in-out_infinite]" />
                  </div>
                )}

                {/* VietQR + Napas header */}
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <span className="text-primary flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-sm" />
                    VietQR
                  </span>
                  <span className="text-status-danger flex items-center gap-1">
                    <span className="w-2 h-2 bg-status-danger rounded-sm" />
                    Napas247
                  </span>
                </div>

                <img
                  src={qrImageUrl}
                  alt="VietQR PayOS"
                  className="w-full aspect-square rounded-md"
                />

                <p className="text-[10px] text-slate-500 text-center mt-2 leading-snug">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã thanh toán không cần
                  nhập tay
                </p>
              </div>
            </div>

            {/* Open in app */}
            {payment?.checkoutUrl && !paid && (
              <a
                href={payment.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-[11px] text-primary font-semibold hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Mở trang PayOS trên thiết bị khác
              </a>
            )}

            {/* Already enrolled badge */}
            {isEnrolled && !paid && (
              <div className="rounded-input bg-status-success-bg border border-status-success/30 p-2.5 flex items-center gap-2 text-[11px] text-status-success font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Bạn đã ghi danh khóa học này
              </div>
            )}
          </div>
        </div>

        {/* ============= FOOTER — Webhook Simulator ============= */}
        <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50/60 to-white px-5 py-4 space-y-3">
          {/* Webhook status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              {status === 'PENDING' && !paid ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success" />
                </>
              ) : paid ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success" />
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300" />
              )}
            </span>
            <span className="text-slate-600 font-semibold">
              Webhook:{' '}
              {paid
                ? 'Đã nhận tín hiệu IPN từ PayOS — Đối soát thành công'
                : status === 'EXPIRED'
                  ? 'Đã hết hạn giữ chỗ'
                  : 'Đang lắng nghe tín hiệu IPN từ PayOS…'}
            </span>
            {payment && (
              <span className="ml-auto text-slate-400 font-mono text-[10px]">
                orderCode: {payment.orderCode}
              </span>
            )}
          </div>

          {/* Demo button */}
          <Button
            variant="ai"
            size="lg"
            fullWidth
            isLoading={reconciling}
            disabled={reconciling || paid || isEnrolled || status === 'EXPIRED'}
            onClick={handleSimulateWebhook}
            leftIcon={!reconciling ? Zap : undefined}
          >
            {reconciling
              ? 'Đang đối soát với PayOS…'
              : paid
                ? 'Đã thanh toán'
                : isEnrolled
                  ? 'Khóa học đã được ghi danh'
                  : status === 'EXPIRED'
                    ? 'Phiên thanh toán đã hết hạn'
                    : 'Giả lập PayOS Webhook (Đã nhận tiền thành công)'}
          </Button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            Bằng việc thanh toán, bạn đồng ý với{' '}
            <span className="text-primary font-semibold cursor-pointer hover:underline">
              Điều khoản dịch vụ
            </span>{' '}
            của PrepMaster AI · Giao dịch được bảo vệ bởi PayOS & Napas247.
          </p>
        </div>
      </div>

      {/* Inline keyframes cho hiệu ứng scan */}
      <style>{`
        @keyframes scan {
          0%   { transform: translateY(0);   opacity: 0.0; }
          15%  { opacity: 1; }
          50%  { transform: translateY(180px); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(360px); opacity: 0.0; }
        }
      `}</style>
    </div>
  );
};

/* ============================================================
 *  CopyRow — internal sub component
 * ============================================================ */
interface CopyRowProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}
const CopyRow: React.FC<CopyRowProps> = ({ label, value, copied, onCopy }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {label}
        </p>
        <p className="font-mono font-bold text-slate-800 text-sm truncate">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors shrink-0',
          copied
            ? 'bg-status-success text-white'
            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary hover:border-primary/30',
        )}
        title="Sao chép"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Đã sao chép
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Sao chép
          </>
        )}
      </button>
    </div>
  );
};

export default PayOSCheckoutModal;
