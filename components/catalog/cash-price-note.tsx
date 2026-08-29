import { Banknote } from 'lucide-react';

export function CashPriceNote({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-stock-soft px-2.5 py-1 text-[11px] font-medium leading-none text-stock ${className}`}
    >
      <Banknote className="size-3" aria-hidden />
      Цена при оплате наличными
    </span>
  );
}
