import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { fetchMyOrders, fetchMyPayments, paymentKeys } from '@/shared/api/paymentService';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { formatVND } from '@/shared/utils/format';
import { paymentDate, paymentError } from '@/shared/utils/payment';
import { SePayCheckoutModal } from './SePayCheckoutModal';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export function PaymentHistoryView() {
  const userId = useAuthStore(s => s.user?.id ?? '');
  const [tab, setTab] = useState<'orders' | 'transactions'>('orders');
  const [page, setPage] = useState(0);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const orders = useQuery({
    queryKey: paymentKeys.orders(userId, page), queryFn: ({ signal }) => fetchMyOrders(page, signal),
    enabled: Boolean(userId) && tab === 'orders', staleTime: 0,
    refetchInterval: query => query.state.data?.data.some(o => o.status === 'PENDING') ? 10000 : false,
  });
  const history = useQuery({
    queryKey: paymentKeys.history(userId, page), queryFn: ({ signal }) => fetchMyPayments(page, signal),
    enabled: Boolean(userId) && tab === 'transactions', staleTime: 0,
  });
  const active = tab === 'orders' ? orders : history;
  return <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-blue-700 font-bold uppercase flex items-center gap-2"><Receipt className="w-4 h-4" />Thanh toán SePay</p><h1 className="text-3xl font-extrabold text-slate-900 mt-2">Đơn hàng & thanh toán</h1><p className="text-sm text-slate-500 mt-2">Xem lại đơn mua khóa học, tiếp tục thanh toán và theo dõi giao dịch.</p></div><Button variant="outline" leftIcon={RefreshCw} disabled={active.isFetching} onClick={() => void active.refetch()}>Làm mới</Button></div>
    <div className="flex gap-2" role="tablist" aria-label="Lịch sử thanh toán">{(['orders', 'transactions'] as const).map(value => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setPage(0); }} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === value ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{value === 'orders' ? 'Đơn hàng' : 'Giao dịch đã ghi nhận'}</button>)}</div>
    {active.isPending ? <Skeleton className="h-64" /> : active.isError ? <ErrorState message={paymentError(active.error)} onRetry={() => void active.refetch()} /> : <>
      {tab === 'orders' && orders.data && (orders.data.data.length ? <div className="space-y-3">{orders.data.data.map(order => <article key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><Link className="font-bold text-slate-900 hover:text-blue-700" to={`/courses/${order.courseId}`}>{order.courseTitle}</Link><p className="text-xs text-slate-500 mt-1">{order.orderCode} · {paymentDate(order.createdAt)}</p><p className="font-bold text-blue-700 mt-2">{formatVND(order.amount)}</p></div><div className="flex flex-wrap items-center gap-3"><PaymentStatusBadge status={order.status} /><Button variant="outline" onClick={() => setOrderCode(order.orderCode)}>{order.status === 'PENDING' ? 'Tiếp tục thanh toán' : 'Xem đơn'}</Button></div></article>)}</div> : <EmptyState title="Bạn chưa có đơn hàng" description="Chọn một khóa học để bắt đầu." actionLabel="Khám phá khóa học" onAction={() => window.location.assign('/courses')} />)}
      {tab === 'transactions' && history.data && (history.data.data.length ? <div className="space-y-3">{history.data.data.map(transaction => <article key={transaction.transactionId} className="rounded-2xl bg-white border border-slate-200 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold text-slate-900">{formatVND(transaction.amount)}</p><p className="text-xs text-slate-500 mt-1">{paymentDate(transaction.paymentDate || transaction.createdAt)} · {transaction.paymentMethod}</p></div><span className="text-sm font-bold text-emerald-700">{transaction.transactionStatus === 'success' ? 'Thành công' : transaction.transactionStatus === 'failed' ? 'Không thành công' : 'Đang xử lý'}</span></div><p className="text-xs text-slate-500 mt-3 break-all">Mã giao dịch: {transaction.transactionId}</p>{transaction.providerReference && <p className="text-xs text-slate-500 mt-1">Tham chiếu: {transaction.providerReference}</p>}<Link to={`/courses/${transaction.courseId}`} className="text-sm font-bold text-blue-700 inline-block mt-3">Xem khóa học</Link></article>)}</div> : <EmptyState title="Chưa có giao dịch được ghi nhận" description="Đơn đang chờ thanh toán hoặc cần đối soát nằm trong mục Đơn hàng." />)}
      {active.data && <Pagination currentPage={active.data.currentPage} totalPages={active.data.totalPages} onChange={setPage} />}
    </>}
    {orderCode && <SePayCheckoutModal key={`${userId}:${orderCode}`} orderCode={orderCode} onClose={() => setOrderCode(null)} />}
  </section>;
}
