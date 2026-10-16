/**
 * PaymentCheckoutModal — Gold Flow #3
 * -----------------------------------------------------------
 * Modal thanh toán hiển thị khi bấm "Đăng ký khóa học ngay".
 *   - Thông tin đơn hàng (Mã đơn, Khóa học, Tổng tiền)
 *   - Chọn phương thức: VNPay hoặc VietQR
 *   - QR code + countdown giữ chỗ 15:00 phút
 *   - Nút "Mô phỏng Thanh toán thành công" → spinner 0.8s →
 *     cập nhật enrollment + đóng modal + đổi CTA sang "Vào học ngay"
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ShieldCheck,
  Copy,
  QrCode,
  CreditCard,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';
import type { Course } from '@/shared/types';
import { formatVND } from '@/shared/utils';
import type { PaymentMethod } from '@/shared/types';
import { useEnrollmentStore } from '@/shared/stores';

export interface PaymentCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
}

const HOLD_MINUTES = 15; // 15 phút giữ chỗ

/* Helper tạo QR placeholder (SVG đơn giản) — không phụ thuộc thư viện */
const generateQrSvg = (payload: string): string => {
  // Tạo grid 21x21 QR-like (chỉ mang tính trang trí)
  const size = 21;
  let cells = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // pseudo-random dựa trên payload
      const v = (x * 31 + y * 17 + payload.charCodeAt((x + y) % payload.length)) % 5;
      const isCornerFinder =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      const isCornerCenter =
        isCornerFinder &&
        ((x === 0 || x === 6 || x === size - 1 || x === size - 7) ||
          (y === 0 || y === 6 || y === size - 1 || y === size - 7) ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3));
      const isData = v < 2 && !isCornerCenter;
      if (isData || isCornerCenter) {
        cells += `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#0F172A"/>`;
      }
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168" viewBox="0 0 ${size * 8} ${size * 8}">${cells}</svg>`,
  )}`;
};

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  open,
  onOpenChange,
  course,
}) => {
  const enroll = useEnrollmentStore((s) => s.enroll);
  const isEnrolled = useEnrollmentStore((s) => Boolean(s.enrolled[course.id]));

  const [method, setMethod] = useState<PaymentMethod>('VIETQR');
  const [secondsLeft, setSecondsLeft] = useState(HOLD_MINUTES * 60);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId] = useState(
    () => `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-889`,
  );
  const [copied, setCopied] = useState(false);

  // Reset countdown khi mở modal
  useEffect(() => {
    if (open) {
      setSecondsLeft(HOLD_MINUTES * 60);
      setPaying(false);
      setSuccess(false);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [open, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const qrUrl = useMemo(
    () => generateQrQrFor(orderId, course.price),
    [orderId, course.price],
  );

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleSimulatePay = async () => {
    setPaying(true);
    // spinner 0.8s
    await new Promise((r) => setTimeout(r, 800));

    enroll({
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
      orderId,
      amount: course.price,
    });
    setPaying(false);
    setSuccess(true);

    // Đóng modal sau 1.2s để user thấy thông báo
    setTimeout(() => {
      onOpenChange(false);
    }, 1200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-card shadow-2xl border border-slate-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ====== HEADER ====== */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input bg-ai-gradient flex items-center justify-center shadow-ai-glow">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="payment-title"
                className="text-lg font-extrabold text-slate-900 leading-tight"
              >
                Thanh toán an toàn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã đơn hàng: <span className="font-mono font-bold text-slate-700">{orderId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Đóng"
            disabled={paying}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ====== SUCCESS OVERLAY ====== */}
        {success && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6 animate-in fade-in">
            <div className="w-20 h-20 rounded-full bg-status-success-bg flex items-center justify-center mb-4 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-status-success" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Kích hoạt Enrollment thành công!
            </h3>
            <p className="text-slate-600 mt-2 max-w-md">
              Bạn đã được ghi danh vào khóa học{' '}
              <span className="font-bold text-slate-900">{course.title}</span>.
              Nút bên ngoài đã được đổi thành <b>"Vào học ngay"</b>.
            </p>
            <Sparkles className="w-5 h-5 text-ai mt-4 animate-pulse" />
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          {/* ====== LEFT — ORDER + METHOD ====== */}
          <div className="space-y-5 min-w-0">
            {/* Order info */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                Thông tin đơn hàng
              </p>
              <div className="rounded-input border border-slate-200 bg-slate-50/50 p-4 flex items-center gap-3">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-16 h-16 rounded-md object-cover bg-slate-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <Badge variant="ielts" size="sm" className="mb-1">
                    {course.certificate}
                  </Badge>
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mentor {course.mentor.fullName} · {course.durationHours} giờ
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Thành tiền
                  </p>
                  <p className="font-extrabold text-slate-900">
                    {formatVND(course.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Method tabs */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                Phương thức thanh toán
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'VIETQR' as const, label: 'VietQR', desc: 'Quét QR ngân hàng', icon: QrCode },
                  { key: 'VNPAY' as const, label: 'VNPay', desc: 'Cổng VNPay', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = method === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-input border text-left transition-all',
                        active
                          ? 'border-primary bg-primary-tint ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
                          active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-bold text-sm',
                            active ? 'text-primary' : 'text-slate-800',
                          )}
                        >
                          {m.label}
                        </p>
                        <p className="text-[10px] text-slate-500">{m.desc}</p>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QR / QR placeholder */}
            {method === 'VIETQR' ? (
              <div className="rounded-input border border-slate-200 bg-gradient-to-br from-primary-tint/30 to-white p-4">
                <div className="flex items-center gap-4">
                  <div className="w-[152px] h-[152px] rounded-md bg-white border border-slate-200 p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={qrUrl}
                      alt="VietQR"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Quét QR bằng app ngân hàng
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">
                          Chủ TK
                        </span>
                        <span className="text-sm font-bold text-slate-800 flex-1">
                          PREPMASTER AI JSC
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">
                          Số TK
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-800 flex-1">
                          8888 6868 9999
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('888868689999')}
                          className="p-1 rounded text-slate-400 hover:text-primary hover:bg-white transition-colors"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">
                          Nội dung
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-800 flex-1">
                          {orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(orderId)}
                          className="p-1 rounded text-slate-400 hover:text-primary hover:bg-white transition-colors"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/80">
                        <span className="text-[10px] text-slate-500 w-12">
                          Số tiền
                        </span>
                        <span className="text-base font-extrabold text-status-danger flex-1">
                          {formatVND(course.price)}
                        </span>
                      </div>
                    </div>
                    {copied && (
                      <p className="text-[11px] text-status-success font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã sao chép
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-input border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Thanh toán qua cổng VNPay
                </p>
                <p className="text-xs text-slate-500">
                  Hỗ trợ thẻ ATM nội địa, Visa, MasterCard, JCB, QR Pay, MoMo
                  và các ví điện tử liên kết VNPay.
                </p>
              </div>
            )}

            {/* Simulate button */}
            <Button
              variant="ai"
              size="lg"
              fullWidth
              isLoading={paying}
              disabled={paying || success || isEnrolled}
              onClick={handleSimulatePay}
              rightIcon={!paying ? ArrowRight : undefined}
            >
              {paying
                ? 'Đang xử lý thanh toán…'
                : isEnrolled
                  ? 'Khóa học đã được ghi danh'
                  : 'Mô phỏng Thanh toán thành công (Simulate IPN/Callback)'}
            </Button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Bằng việc bấm thanh toán, bạn đồng ý với{' '}
              <span className="text-primary font-semibold cursor-pointer hover:underline">
                Điều khoản dịch vụ
              </span>{' '}
              của PrepMaster AI.
            </p>
          </div>

          {/* ====== RIGHT — ORDER SUMMARY ====== */}
          <aside className="rounded-input border border-slate-200 bg-slate-50/60 p-4 h-fit space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Tóm tắt thanh toán
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Giá gốc</span>
                <span className="text-slate-400 line-through">
                  {formatVND(course.originalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giá ưu đãi</span>
                <span className="font-bold text-slate-700">
                  {formatVND(course.price)}
                </span>
              </div>
              <div className="flex justify-between text-status-success">
                <span>Giảm giá</span>
                <span className="font-bold">
                  -{formatVND(course.originalPrice - course.price)}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Tổng thanh toán</span>
                <span className="text-lg font-extrabold text-status-danger">
                  {formatVND(course.price)}
                </span>
              </div>
            </div>

            {/* Countdown */}
            <div
              className={cn(
                'rounded-md p-3 flex items-center gap-2.5',
                secondsLeft < 60
                  ? 'bg-status-danger-bg border border-red-200'
                  : secondsLeft < 5 * 60
                    ? 'bg-status-warning-bg border border-amber-200'
                    : 'bg-primary-tint border border-primary/20',
              )}
            >
              <Clock
                className={cn(
                  'w-4 h-4 shrink-0',
                  secondsLeft < 60
                    ? 'text-status-danger animate-pulse'
                    : secondsLeft < 5 * 60
                      ? 'text-status-warning'
                      : 'text-primary',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Giữ chỗ còn
                </p>
                <p
                  className={cn(
                    'font-mono font-extrabold text-base leading-tight',
                    secondsLeft < 60
                      ? 'text-status-danger'
                      : secondsLeft < 5 * 60
                        ? 'text-status-warning'
                        : 'text-primary',
                  )}
                >
                  {timeStr}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-2">
              {[
                'Tự động kích hoạt sau thanh toán',
                'Hoàn tiền 100% trong 7 ngày',
                'Hỗ trợ 24/7 qua hotline',
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* Footer processing hint */}
        {paying && (
          <div className="border-t border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-600 bg-primary-tint/40">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <span>
              Đang gọi tới <span className="font-mono">POST /api/payments/ipn</span> ·
              Tạo enrollment record …
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* Helper tạo QR URL — gọi generateQrSvg với payload phong phú */
function generateQrQrFor(orderId: string, amount: number): string {
  const payload = `${orderId}|${amount}|VietQR|${Date.now()}`;
  return generateQrSvg(payload);
}

export default PaymentCheckoutModal;
