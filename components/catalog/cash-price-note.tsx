import { Banknote } from 'lucide-react';

export function CashPriceNote({ className = '' }: { className?: string }) {
  return (
    <span
      className={`cash-note inline-flex w-fit items-center gap-1.5 rounded-full bg-stock-soft px-2.5 py-1 text-[11px] font-medium leading-tight text-stock ${className}`}
    >
      <Banknote className="size-3 shrink-0" aria-hidden />
      {/*
        На узкой карточке «Цена при оплате наличными» занимает три строки,
        поэтому там остаётся «Цена наличными» — см. .cash-note__long.
      */}
      <span>
        <span className="cash-note__word">Цена </span>
        <span className="cash-note__long">при оплате </span>наличными
      </span>
    </span>
  );
}
