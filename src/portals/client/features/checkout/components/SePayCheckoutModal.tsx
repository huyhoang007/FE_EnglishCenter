import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { cancelPaymentOrder, fetchPaymentOrder, paymentKeys } from '@/shared/api/paymentService';
import { Button } from '@/shared/components/Button';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { formatVND } from '@/shared/utils/format';
import { canShowPaymentQr, paymentError, remainingSeconds } from '@/shared/utils/payment';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export function SePayCheckoutModal({ orderCode, onClose }: { orderCode: string; onClose: () => void }) {
  const userId = useAuthStore(s => s.user?.id ?? '');
  const fetchProfile = useAuthStore(s => s.fetchMyProfile);
  const client = useQueryClient();
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const notified = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [qrError, setQrError] = useState(false);
  const order = useQuery({
    queryKey: paymentKeys.order(userId, orderCode),
    queryFn: ({ signal }) => fetchPaymentOrder(orderCode, signal),
    enabled: Boolean(userId && orderCode), staleTime: 0, retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: query => query.state.data?.status === 'PENDING' ? 3000 : false,
  });
  const cancel = useMutation({
    mutationFn: () => cancelPaymentOrder(orderCode),
    onSuccess: data => {
      client.setQueryData(paymentKeys.order(userId, orderCode), data);
      setConfirmCancel(false);
      void client.invalidateQueries({ queryKey: paymentKeys.all });
    },
    onError: () => { void order.refetch(); },
  });
  useEffect(() => {
    if (order.data?.status !== 'PAID' || notified.current) return;
    notified.current = true;
    void client.invalidateQueries({ queryKey: ['enrollments'] });
    void client.invalidateQueries({ queryKey: ['catalog'] });
    void client.invalidateQueries({ queryKey: paymentKeys.all });
    void fetchProfile().catch(() => { /* Enrollment remains authoritative if profile refresh is temporarily unavailable. */ });
  }, [order.data?.status, client, fetchProfile]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]') ?? []);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(timer); document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow; previousFocus?.focus();
    };
  }, []);
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setCopyMessage('Đã sao chép.'); }
    catch { setCopyMessage('Không sao chép được. Bạn có thể chọn và sao chép nội dung bên dưới.'); }
  }
  const data = order.data;
  const seconds = data ? remainingSeconds(data.expiresAt, now) : 0;
  const showQr = data && !order.isError && canShowPaymentQr(data.status, data.expiresAt, now);
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/60 p-4 flex items-center justify-center" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sepay-checkout-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto outline-none">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div><p className="text-xs font-bold text-blue-700 uppercase">SePay · Chuyển khoản ngân hàng</p><h2 id="sepay-checkout-title" className="font-extrabold text-xl text-slate-900 mt-1">Thanh toán khóa học</h2></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng thanh toán"><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          {order.isPending && <Skeleton className="h-64" />}
          {order.isError && <ErrorState message={paymentError(order.error)} onRetry={() => void order.refetch()} />}
          {data && <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{data.courseTitle}</h3><p className="text-xs text-slate-500 mt-1">Đơn {data.orderCode}</p><p className="font-extrabold text-2xl text-blue-700 mt-2">{formatVND(data.amount)}</p></div><PaymentStatusBadge status={data.status} /></div>
            {showQr && <div className="grid sm:grid-cols-2 gap-5 items-start">
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                {data.qrUrl && !qrError ? <img src={data.qrUrl} alt={`QR thanh toán đơn ${data.orderCode}`} className="w-full max-w-60 mx-auto rounded-lg" onError={() => setQrError(true)} /> : <p className="text-sm text-slate-600 py-10">Không tải được QR. Bạn có thể chuyển khoản theo thông tin bên cạnh.</p>}
                <p className="font-bold text-sm text-blue-700 mt-3">Còn {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</p>
              </div>
              <div className="space-y-4 text-sm">
                <div><p className="text-xs text-slate-500">Ngân hàng</p><p className="font-bold">{data.bankCode}</p></div>
                <div><p className="text-xs text-slate-500">Chủ tài khoản</p><p className="font-bold break-words">{data.accountName}</p></div>
                {[[data.accountNumber, 'Số tài khoản'], [data.transferContent, 'Nội dung chuyển khoản']].map(([value, label]) => <div key={label}><p className="text-xs text-slate-500">{label}</p><div className="flex items-center justify-between gap-2"><span className="font-mono font-bold break-all select-all">{value}</span><Button variant="ghost" size="icon" aria-label={`Sao chép ${label.toLowerCase()}`} onClick={() => void copy(value)}><Copy className="w-4 h-4" /></Button></div></div>)}
                <p className="text-xs text-slate-600">Chuyển đúng <strong>{formatVND(data.amount)}</strong> và giữ nguyên nội dung để xác nhận đúng đơn hàng.</p>
              </div>
            </div>}
            {data.status === 'PENDING' && <p className="text-sm text-slate-600 flex items-start gap-2"><ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />{seconds > 0 ? 'Đơn sẽ tự cập nhật sau khi ngân hàng xác nhận tiền vào. Đóng cửa sổ vẫn giữ đơn trong lịch sử.' : 'Đã hết thời gian hiển thị QR. Đang kiểm tra trạng thái đơn; vui lòng không chuyển khoản thêm.'}</p>}
            {data.status === 'PAID' && <div className="rounded-xl bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="w-8 h-8 mb-2" /><h3 className="font-bold">Thanh toán đã được xác nhận</h3><p className="text-sm mt-1">Khóa học đã được mở trong Khóa học của tôi.</p><Link onClick={onClose} to={`/my-courses/${data.courseId}/learn`} className="inline-flex mt-4 rounded-xl bg-emerald-700 text-white px-4 py-2 font-bold text-sm">Vào học ngay</Link></div>}
            {data.status === 'REVIEW_REQUIRED' && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Khoản chuyển cần được kiểm tra. Vui lòng không chuyển thêm; liên hệ hỗ trợ và cung cấp mã đơn <strong>{data.orderCode}</strong>.</p>}
            {(data.status === 'CANCELLED' || data.status === 'EXPIRED') && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Đơn này đã {data.status === 'CANCELLED' ? 'hủy' : 'hết hạn'}. Nếu đã chuyển tiền, hãy liên hệ hỗ trợ với mã đơn này. Bạn có thể quay lại khóa học để tạo đơn mới.</p>}
            {confirmCancel && data.status === 'PENDING' && <div className="border border-amber-200 rounded-xl bg-amber-50 p-4 space-y-3"><p className="text-sm text-amber-900">Chỉ hủy nếu bạn chưa chuyển tiền. Hủy đơn không hoàn lại khoản tiền đã chuyển.</p><div className="flex gap-2"><Button variant="danger" isLoading={cancel.isPending} onClick={() => cancel.mutate()}>Xác nhận hủy đơn</Button><Button variant="outline" disabled={cancel.isPending} onClick={() => setConfirmCancel(false)}>Giữ đơn</Button></div></div>}
            {cancel.isError && <p role="alert" className="text-sm text-rose-700">{paymentError(cancel.error)}</p>}
            <p role="status" aria-live="polite" className="text-xs text-slate-500">{copyMessage}</p>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><Button variant="outline" leftIcon={RefreshCw} disabled={order.isFetching} onClick={() => void order.refetch()}>Kiểm tra trạng thái</Button>{data.status === 'PENDING' && !confirmCancel && <Button variant="ghost" onClick={() => setConfirmCancel(true)}>Hủy đơn</Button>}<Link to="/payments" onClick={onClose} className="text-sm font-bold text-blue-700 px-3 py-2">Lịch sử thanh toán</Link></div>
          </>}
        </div>
      </div>
    </div>, document.body,
  );
}
