import type { OrderStatus } from '@/shared/types/sepay.types';
import { ORDER_COLORS, ORDER_LABELS } from '@/shared/utils/payment';
export function PaymentStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ORDER_COLORS[status]}`}>{ORDER_LABELS[status]}</span>;
}
