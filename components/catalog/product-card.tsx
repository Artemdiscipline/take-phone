'use client';

import Image from 'next/image';
import { Check, Heart, Plus } from 'lucide-react';

import { useRequest } from '@/components/order/request-store';
import { AppLink } from '@/components/site/app-link';
import { isStaticPreview, withBase } from '@/lib/build-mode';
import type { CatalogListing, CatalogProduct } from '@/lib/catalog/types';
import { formatFreshness, formatPrice } from '@/lib/format';
import { terms } from '@/lib/site';
import { AvailabilityLabel } from './availability';
import { CashPriceNote } from './cash-price-note';

export function ProductCard({
  listing,
  variant: fixedVariant,
  priority = false,
}: {
  listing: CatalogListing;
  /**
   * Показать именно этот вариант, а не позицию целиком.
   *
   * Используется на странице модели: там каждый вариант (память, цвет, SIM)
   * идёт отдельной карточкой, поэтому и заголовок, и наличие, и цена — его
   * собственные, а не сводные по позиции.
   */
  variant?: CatalogProduct;
  priority?: boolean;
}) {
  const { add, has, toggleFavourite, isFavourite, lastAdded } = useRequest();

  // Без явного варианта карточка добавляет вариант по умолчанию: доступный и
  // самый выгодный.
  const variant = fixedVariant
    ?? listing.variants.find((item) => item.id === listing.defaultVariantId)
    ?? listing.variants[0];

  const inRequest = has(variant.matchKey);
  const favourite = isFavourite(listing.slug);
  const soldOut = fixedVariant ? variant.availability === 'out_of_stock' : listing.availability === 'out_of_stock';
  const availability = fixedVariant ? variant.availability : listing.availability;
  const price = fixedVariant ? variant.price : listing.price;
  const oldPrice = fixedVariant ? variant.oldPrice : listing.oldPrice;
  const hasSimChoice = fixedVariant ? false : listing.hasSimChoice;

  /*
    На странице модели варианты идут отдельными карточками, и различие бывает
    только в типе связи: «46 мм, глубокий чёрный» с GPS и с Cellular выглядели
    бы одинаково. Поэтому в режиме варианта тип связи попадает в заголовок, а
    ссылка ведёт сразу на нужный вариант.
  */
  const showSimInTitle = Boolean(fixedVariant) && listing.variants.length > 1;
  const title = fixedVariant
    ? showSimInTitle ? `${variant.title}, ${variant.simLabel}` : variant.title
    : listing.title;

  const href = fixedVariant && showSimInTitle
    ? `/product/${listing.slug}?sim=${encodeURIComponent(variant.sim)}`
    : `/product/${listing.slug}`;

  return (
    <article className="product-card group relative">
      <button
        type="button"
        onClick={() => toggleFavourite(listing.slug)}
        aria-label={favourite ? 'Убрать из избранного' : 'Добавить в избранное'}
        aria-pressed={favourite}
        className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-line bg-paper/90 transition hover:bg-paper"
      >
        <Heart
          className={`size-4 transition ${favourite ? 'fill-accent text-accent' : 'text-ink-faint'}`}
          aria-hidden
        />
      </button>

      <AppLink
        href={href}
        className="block rounded-t-[15px] outline-none"
        aria-label={`Открыть ${listing.title}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-t-[15px] bg-surface">
          <Image
            src={withBase(listing.images[0])}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            style={{ objectFit: 'contain' }}
            className="product-card__image object-contain p-2 sm:p-3"
          />
        </div>
      </AppLink>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Переносится на две строки на узких карточках, а не рвётся посередине. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <AvailabilityLabel availability={availability} className="whitespace-nowrap" />
          <span
            className="whitespace-nowrap text-[11px] text-ink-faint"
            suppressHydrationWarning
          >
            {formatFreshness(listing.updatedAt, isStaticPreview)}
          </span>
        </div>

        <h3 className="mt-3 hyphens-auto break-words text-[15px] font-medium leading-snug tracking-[-0.01em]">
          <AppLink href={href} className="transition hover:text-accent">
            {title}
          </AppLink>
        </h3>

        <p className="mt-1.5 text-[13px] text-ink-soft">
          {listing.caseSizeLabel ?? listing.memoryLabel}
          {listing.category === 'mac'
            ? listing.configuration ? ` · ${listing.configuration}` : ''
            : hasSimChoice ? ' · eSIM или 2 SIM' : ` · ${variant.simLabel}`}
        </p>

        {availability === 'to_order' && (
          <p className="mt-3 rounded-lg bg-order-soft px-2.5 py-1.5 text-[12px] text-order">
            Под заказ — дешевле на {formatPrice(terms.preorderDiscount)}
          </p>
        )}

        <div className="product-card__buy mt-auto pt-5">
          <div className="min-w-0">
            <CashPriceNote className="mb-2" />
            {oldPrice && (
              <p className="text-[12px] text-ink-faint line-through">
                {formatPrice(oldPrice)}
              </p>
            )}
            <p className="text-[19px] font-semibold tracking-[-0.02em]">
              {hasSimChoice && <span className="text-ink-faint">от </span>}
              {formatPrice(price)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => add(listing, variant)}
            disabled={soldOut}
            aria-label={inRequest
              ? `${title} уже в заявке`
              : `Добавить ${title} в заявку`}
            className={`product-card__buy-action grid size-11 shrink-0 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint ${
              inRequest ? 'bg-stock-soft text-stock' : 'bg-plum text-white hover:bg-plum-soft'
            }`}
          >
            {inRequest
              ? <Check className={`size-4 shrink-0 ${lastAdded === variant.matchKey ? 'added-pop' : ''}`} aria-hidden />
              : <Plus className="size-4 shrink-0" aria-hidden />}
            {/* Видна только в узкой раскладке — см. .product-card__buy-label. */}
            <span className="product-card__buy-label">
              {soldOut ? 'Нет в наличии' : inRequest ? 'В заявке' : 'В заявку'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
