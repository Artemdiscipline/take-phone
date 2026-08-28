import { AVAILABILITY_LABELS } from '@/lib/catalog/normalize';
import type { Availability } from '@/lib/catalog/types';

const STYLES: Record<Availability, { dot: string; text: string; chip: string }> = {
  in_stock: {
    dot: 'bg-stock',
    text: 'text-stock',
    chip: 'bg-stock-soft text-stock',
  },
  to_order: {
    dot: 'bg-order',
    text: 'text-order',
    chip: 'bg-order-soft text-order',
  },
  out_of_stock: {
    dot: 'bg-ink-faint',
    text: 'text-ink-faint',
    chip: 'bg-surface-2 text-ink-faint',
  },
};

export function AvailabilityLabel({
  availability,
  className = '',
}: {
  availability: Availability;
  className?: string;
}) {
  const style = STYLES[availability];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${style.text} ${className}`}>
      <span className={`status-dot ${style.dot}`} aria-hidden />
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}

export function AvailabilityChip({ availability }: { availability: Availability }) {
  const style = STYLES[availability];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${style.chip}`}>
      <span className={`status-dot ${style.dot}`} aria-hidden />
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}
