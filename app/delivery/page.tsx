import type { Metadata } from 'next';
import { Banknote, CreditCard, Store, Truck, Wallet } from 'lucide-react';
import { AppLink } from '@/components/site/app-link';

import { formatPrice } from '@/lib/format';
import { site, terms } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Доставка и оплата',
  description:
    'Самовывоз на Герцена, 84к2 и доставка по Тюмени. Оплата переводом, наличными '
    + 'или банковской картой (+13,5%). Онлайн-оплата на сайте не требуется.',
};

export default function DeliveryPage() {
  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Доставка и оплата</span>
      </nav>

      <header className="mt-4 max-w-[680px]">
        <h1 className="h2">Доставка и оплата</h1>
        <p className="lede mt-3">
          Оплата на сайте не проводится. Менеджер подтверждает наличие и итоговую цену,
          после чего вы выбираете, как получить и оплатить устройство.
        </p>
      </header>

      <div className="mt-10 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-line p-6 sm:p-8">
          <Store className="size-5 text-accent" aria-hidden />
          <h2 className="h3 mt-6">Самовывоз</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {site.addressFull}. {site.workingHours}.
          </p>
          <p className="mt-4 rounded-xl bg-surface p-4 text-[13px] leading-relaxed text-ink-soft">
            Чтобы устройство точно дождалось вас, его можно забронировать.
            Бронирование — предоплата {formatPrice(terms.reservationPrepayment)},
            она засчитывается в стоимость покупки. Менеджер согласует её при
            подтверждении заявки.
          </p>
        </article>

        <article className="rounded-2xl border border-line p-6 sm:p-8">
          <Truck className="size-5 text-accent" aria-hidden />
          <h2 className="h3 mt-6">Доставка по Тюмени</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Доставляем по городу. Сроки, интервал и стоимость менеджер согласует
            при подтверждении заявки — они зависят от адреса и наличия устройства.
          </p>
        </article>
      </div>

      <section className="mt-4 rounded-2xl bg-surface p-6 sm:p-8">
        <h2 className="h3">Способы оплаты</h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <PaymentCard
            icon={<Wallet className="size-4" aria-hidden />}
            title="Перевод"
            note="При получении, без доплаты"
          />
          <PaymentCard
            icon={<Banknote className="size-4" aria-hidden />}
            title="Наличные"
            note="В магазине, без доплаты"
          />
          <PaymentCard
            icon={<CreditCard className="size-4" aria-hidden />}
            title="Банковская карта"
            note="К стоимости добавляется 13,5%"
          />
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
          Комиссия при оплате картой рассчитывается автоматически: сумма заявки
          умножается на 1,135. В форме заявки итог сразу пересчитывается, когда
          вы выбираете карту.
        </p>
      </section>
    </div>
  );
}

function PaymentCard({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-paper p-5">
      <span className="text-accent">{icon}</span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 text-[12px] text-ink-faint">{note}</p>
    </div>
  );
}
