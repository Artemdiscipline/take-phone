import Image from 'next/image';
import { ArrowRight, MessageCircle } from 'lucide-react';

import { AvailabilityLabel } from '@/components/catalog/availability';
import { HERO_IMAGE } from '@/lib/catalog/images';
import type { CatalogListing } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';
import { AppLink } from '@/components/site/app-link';
import { withBase } from '@/lib/build-mode';
import { CashPriceNote } from '@/components/catalog/cash-price-note';

/**
 * First screen. The price and availability shown here come from the same
 * catalogue data as the cards below — no separate marketing numbers.
 */
export function Hero({ featured }: { featured: CatalogListing | null }) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="shell grid items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-14">
        <div className="hero-enter">
          <p className="eyebrow">Актуальный каталог · {site.city}</p>

          <h1 className="h1 mt-4">
            {featured ? featured.model : 'iPhone в наличии'}
            <span className="block text-accent">
              {featured?.availability === 'in_stock' ? 'в наличии сегодня' : 'под заказ и в наличии'}
            </span>
          </h1>

          <p className="lede mt-5 max-w-[480px]">
            Цены и наличие в каталоге обновляются автоматически. Вы выбираете устройство,
            менеджер Take Phone подтверждает заказ и удобный способ получения.
          </p>

          {featured && (
            <div className="mt-7">
              <CashPriceNote className="mb-3" />
              <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                <span className="text-[28px] font-semibold leading-none tracking-[-0.035em]">
                  от {formatPrice(featured.price)}
                </span>
                <AvailabilityLabel availability={featured.availability} className="pb-1" />
                <span className="pb-1 text-[12px] text-ink-faint">
                  {featured.memoryLabel}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <AppLink
              href="/catalog/iphone"
              className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-plum px-6 text-sm font-medium text-white transition hover:bg-plum-soft"
            >
              Смотреть каталог
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </AppLink>
            <a
              href={site.telegramManager}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-paper px-6 text-sm font-medium transition hover:border-line-strong"
            >
              <MessageCircle className="size-4" aria-hidden />
              Спросить менеджера
            </a>
          </div>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface lg:aspect-[16/9]">
          <Image
            src={withBase(HERO_IMAGE)}
            alt="Линейка iPhone 17 Pro"
            fill
            sizes="(max-width: 1024px) 100vw, 720px"
            priority
            className="hero-photo object-cover"
          />
        </div>
      </div>
    </section>
  );
}
