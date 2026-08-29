import { ORDER_STATUS_LABELS } from '@/lib/repositories/types';
import type { OrderStatus } from '@/lib/repositories/types';

/** Цвета статусов: новые заметны, отменённые приглушены. */
const STATUS_STYLES: Record<OrderStatus, string> = {
  new: 'bg-accent-soft text-accent',
  in_progress: 'bg-order-soft text-order',
  contacted: 'bg-order-soft text-order',
  confirmed: 'bg-stock-soft text-stock',
  completed: 'bg-stock-soft text-stock',
  cancelled: 'bg-surface-2 text-ink-faint',
};

export function OrderStatusBadge({
  status,
  className = '',
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
