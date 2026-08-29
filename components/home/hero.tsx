import Image from 'next/image';
import { ArrowRight, Check, MapPin, MessageCircle } from 'lucide-react';

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
            Смартфоны, компьютеры, часы, аудио и игровая техника. Вы выбираете
            устройство, менеджер Take Phone подтверждает наличие, цену и способ получения.
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
              href="/catalog"
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

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-ink-soft">
            {['20 категорий техники', 'Гарантия до 5 лет', 'Сервис в магазине'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-stock" strokeWidth={2.2} aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-visual-shell relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface lg:aspect-[16/9]">
          <Image
            src={withBase(HERO_IMAGE)}
            alt="Линейка iPhone 17 Pro"
            fill
            sizes="(max-width: 1024px) 100vw, 720px"
            priority
            className="hero-photo object-cover"
          />

          <div className="hero-availability-card absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/88 p-3.5 shadow-[0_18px_50px_-28px_rgba(38,20,46,0.55)] backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-auto sm:min-w-[260px]">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-stock-soft text-stock">
                <MapPin className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] text-ink-faint">Самовывоз в Тюмени</p>
                <p className="mt-0.5 text-sm font-semibold">{site.address}</p>
              </div>
            </div>
            <span className="status-dot bg-stock" aria-label="В наличии" />
          </div>
        </div>
      </div>
    </section>
  );
}
