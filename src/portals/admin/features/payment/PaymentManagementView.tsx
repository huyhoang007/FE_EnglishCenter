import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { fetchAdminOrder, fetchAdminOrders, fetchWebhookEvents } from '@/shared/api/paymentService';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { createPortal } from 'react-dom';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { formatVND } from '@/shared/utils/format';
import { ORDER_LABELS, paymentDate, paymentError } from '@/shared/utils/payment';
import type { OrderStatus, WebhookEvent } from '@/shared/types/sepay.types';
import { PaymentStatusBadge } from '@/portals/client/features/checkout/components/PaymentStatusBadge';

const OUTCOMES: Record<string, string> = {
  PAID: 'Đã xác nhận và cấp quyền học', UNKNOWN_ORDER: 'Không khớp đơn hàng',
  IGNORED_OUTGOING: 'Bỏ qua giao dịch tiền ra', WRONG_ACCOUNT_OR_UNSUPPORTED_VA: 'Sai tài khoản nhận hoặc tài khoản ảo chưa hỗ trợ',
  EXTRA_TRANSFER_REVIEW_REQUIRED: 'Chuyển thêm tiền vào đơn đã thanh toán',
  AMOUNT_OR_ORDER_STATE_REVIEW_REQUIRED: 'Sai số tiền hoặc đơn đã hủy / hết hạn',
  RECEIVED: 'Đã tiếp nhận',
};
const WEBHOOK_PAGE_SIZE = 5;

function webhookReceivedAt(event: WebhookEvent) {
  const value = /(?:Z|[+-]\d{2}:\d{2})$/i.test(event.received_at)
    ? event.received_at
    : `${event.received_at}Z`;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function PaymentManagementView() {
  const userId = useAuthStore(s => s.user?.id ?? '');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(0);
  const [eventPage, setEventPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const orders = useQuery({ queryKey: ['payments', userId, 'admin', status, page], queryFn: ({ signal }) => fetchAdminOrders(status, page, signal), staleTime: 0 });
  const detail = useQuery({ queryKey: ['payments', userId, 'admin-order', selected], queryFn: ({ signal }) => fetchAdminOrder(selected!, signal), enabled: Boolean(selected), staleTime: 0 });
  const events = useQuery({ queryKey: ['payments', userId, 'admin-events'], queryFn: ({ signal }) => fetchWebhookEvents(undefined, signal), enabled: showEvents, staleTime: 0 });
  const sortedEvents = [...(events.data ?? [])].sort((a, b) => webhookReceivedAt(b) - webhookReceivedAt(a));
  const totalEventPages = Math.ceil(sortedEvents.length / WEBHOOK_PAGE_SIZE);
  const currentEventPage = Math.min(eventPage, Math.max(0, totalEventPages - 1));
  const firstEventIndex = currentEventPage * WEBHOOK_PAGE_SIZE;
  const visibleEvents = sortedEvents.slice(firstEventIndex, firstEventIndex + WEBHOOK_PAGE_SIZE);
  function refresh() { void orders.refetch(); if (selected) void detail.refetch(); if (showEvents) void events.refetch(); }
  return <section className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2"><Receipt className="w-6 h-6 text-blue-700" />Quản lý thanh toán</h1><p className="text-sm text-slate-500 mt-2">Theo dõi đơn khóa học và đối soát thông báo giao dịch SePay.</p></div><Button variant="outline" leftIcon={RefreshCw} disabled={orders.isFetching || detail.isFetching || events.isFetching} onClick={refresh}>Làm mới</Button></div>
    <div className="flex flex-wrap justify-between gap-3"><label className="text-sm font-semibold flex gap-3 items-center">Trạng thái<select aria-label="Lọc trạng thái thanh toán" value={status} onChange={event => { setStatus(event.target.value as OrderStatus | ''); setPage(0); }} className="border border-slate-200 rounded-xl px-3 py-2 bg-white"><option value="">Tất cả</option>{Object.entries(ORDER_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><Button variant="outline" onClick={() => { setSelected(null); setEventPage(0); setShowEvents(true); }}>Thông báo SePay gần đây</Button></div>
    {orders.isPending ? <Skeleton className="h-64" /> : orders.isError ? <ErrorState message={paymentError(orders.error)} onRetry={() => void orders.refetch()} /> : orders.data?.data.length ? <><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Đơn hàng / khóa học', 'Học viên', 'Số tiền', 'Trạng thái', ''].map((title, i) => <th key={i} scope="col" className="px-5 py-4 whitespace-nowrap">{title}</th>)}</tr></thead><tbody>{orders.data.data.map(order => <tr key={order.orderId} className="border-t border-slate-100"><td className="px-5 py-4 min-w-52"><p className="font-bold">{order.orderCode}</p><p className="text-xs text-slate-500 mt-1">{order.courseTitle}</p><p className="text-xs text-slate-400 mt-1">{paymentDate(order.createdAt)}</p></td><td className="px-5 py-4 font-semibold break-words max-w-48">{order.studentName?.trim() || 'Chưa cập nhật tên'}</td><td className="px-5 py-4 whitespace-nowrap font-bold">{formatVND(order.amount)}</td><td className="px-5 py-4"><PaymentStatusBadge status={order.status} /></td><td className="px-5 py-4"><Button variant="outline" size="sm" onClick={() => { setSelected(order.orderId); setShowEvents(false); }}>Chi tiết</Button></td></tr>)}</tbody></table></div><Pagination currentPage={orders.data.currentPage} totalPages={orders.data.totalPages} onChange={setPage} /></> : <EmptyState title="Chưa có đơn phù hợp" />}
    {selected && createPortal(<Modal open onClose={() => setSelected(null)} title="Chi tiết đơn hàng" subtitle={detail.data?.orderCode} icon={Receipt} maxWidth="xl" bodyClassName="space-y-5">{detail.isPending ? <Skeleton className="h-28" /> : detail.isError ? <ErrorState message={paymentError(detail.error)} onRetry={() => void detail.refetch()} /> : detail.data && <><div className="grid sm:grid-cols-2 gap-4 text-sm"><div><p className="text-slate-500">Mã đơn</p><p className="font-bold">{detail.data.orderCode}</p></div><div><p className="text-slate-500">Khóa học</p><p className="font-bold">{detail.data.courseTitle}</p></div><div><p className="text-slate-500">Học viên</p><p className="font-bold break-words">{detail.data.studentName?.trim() || 'Chưa cập nhật tên'}</p></div><div><p className="text-slate-500">Email người mua</p><p className="font-bold break-all">{detail.data.studentEmail?.trim() || 'Chưa cập nhật'}</p></div><div><p className="text-slate-500">Số điện thoại</p><p className="font-bold break-words">{detail.data.studentPhone?.trim() || 'Chưa cập nhật'}</p></div><div><p className="text-slate-500">Số tiền</p><p className="font-bold">{formatVND(detail.data.amount)}</p></div><div><p className="text-slate-500">Trạng thái</p><PaymentStatusBadge status={detail.data.status} /></div><div><p className="text-slate-500">Tài khoản nhận</p><p>{detail.data.bankCode} · {detail.data.accountNumber}</p><p>{detail.data.accountName}</p></div><div><p className="text-slate-500">Đã xác nhận</p><p>{paymentDate(detail.data.paidAt)}</p></div></div>{detail.data.status === 'REVIEW_REQUIRED' && <p className="rounded-xl bg-amber-50 text-amber-900 p-4 text-sm">Đơn cần được kiểm tra theo giao dịch ngân hàng thực tế. Chưa có thao tác hoàn tiền hoặc tự đặt trạng thái đã thanh toán.</p>}</>}</Modal>, document.body)}
    {showEvents && !selected && createPortal(
      <Modal open onClose={() => setShowEvents(false)} title="Thông báo SePay gần đây" icon={Receipt} maxWidth="xl" bodyClassName="p-0">
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{sortedEvents.length} thông báo gần nhất</span></p>
          {events.isPending ? <Skeleton className="h-40" /> : events.isError ? <ErrorState message={paymentError(events.error)} onRetry={() => void events.refetch()} /> : !sortedEvents.length ? <p className="py-8 text-center text-sm text-slate-500">Chưa có thông báo giao dịch.</p> : <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Thông báo</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Mã SePay</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Mã đơn</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Thời gian nhận</th>
                    <th scope="col" className="px-4 py-3">Dữ liệu</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEvents.map(event => <tr key={event.sepay_id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-800">{OUTCOMES[event.outcome] || event.outcome}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">#{event.sepay_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{event.order_code || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{paymentDate(event.received_at)}</td>
                    <td className="px-4 py-3">
                      <details>
                        <summary className="cursor-pointer whitespace-nowrap text-xs font-bold text-blue-700">Xem payload</summary>
                        <pre className="mt-2 max-h-48 max-w-sm overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs">{event.raw_payload}</pre>
                      </details>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">Đang xem <span className="font-semibold text-slate-700">{firstEventIndex + 1}–{Math.min(firstEventIndex + WEBHOOK_PAGE_SIZE, sortedEvents.length)}</span> trên {sortedEvents.length} thông báo</p>
              <Pagination currentPage={currentEventPage} totalPages={totalEventPages} onChange={setEventPage} />
            </div>
          </>}
        </div>
      </Modal>,
      document.body,
    )}
  </section>;
}
