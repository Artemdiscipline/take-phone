'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Heart, Plus } from 'lucide-react';

import { useRequest } from '@/components/order/request-store';
import { formatPrice, formatRelative } from '@/lib/format';
import { terms } from '@/lib/site';
import type { CatalogProduct } from '@/lib/catalog/types';
import { AvailabilityLabel } from './availability';

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const { add, has, toggleFavourite, isFavourite, lastAdded } = useRequest();
  const inRequest = has(product.matchKey);
  const favourite = isFavourite(product.matchKey);
  const soldOut = product.availability === 'out_of_stock';

  return (
    <article className="product-card group relative">
      <button
        type="button"
        onClick={() => toggleFavourite(product.matchKey)}
        aria-label={favourite ? 'Убрать из избранного' : 'Добавить в избранное'}
        aria-pressed={favourite}
        className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-line bg-paper/90 transition hover:bg-paper"
      >
        <Heart
          className={`size-4 transition ${favourite ? 'fill-accent text-accent' : 'text-ink-faint'}`}
          aria-hidden
        />
      </button>

      <Link
        href={`/product/${product.slug}`}
        className="block rounded-t-[15px] outline-none"
        aria-label={`Открыть ${product.title}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-t-[15px] bg-surface">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="product-card__image object-contain p-6"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Wraps to two lines on narrow cards instead of breaking mid-label. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <AvailabilityLabel availability={product.availability} className="whitespace-nowrap" />
          <span className="whitespace-nowrap text-[11px] text-ink-faint">
            {formatRelative(product.updatedAt)}
          </span>
        </div>

        <h3 className="mt-3 text-[15px] font-medium leading-snug tracking-[-0.01em]">
          <Link href={`/product/${product.slug}`} className="transition hover:text-accent">
            {product.title}
          </Link>
        </h3>

        <p className="mt-1.5 text-[13px] text-ink-soft">
          {product.memoryLabel} · {product.simLabel}
        </p>

        {product.availability === 'to_order' && (
          <p className="mt-3 rounded-lg bg-order-soft px-2.5 py-1.5 text-[12px] text-order">
            Под заказ — дешевле на {formatPrice(terms.preorderDiscount)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.oldPrice && (
              <p className="text-[12px] text-ink-faint line-through">{formatPrice(product.oldPrice)}</p>
            )}
            <p className="text-[19px] font-semibold tracking-[-0.02em]">{formatPrice(product.price)}</p>
          </div>

          <button
            type="button"
            onClick={() => add(product)}
            disabled={soldOut}
            aria-label={inRequest ? `${product.title} уже в заявке` : `Добавить ${product.title} в заявку`}
            className={`grid size-11 shrink-0 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint ${
              inRequest ? 'bg-stock-soft text-stock' : 'bg-plum text-white hover:bg-plum-soft'
            }`}
          >
            {inRequest
              ? <Check className={`size-4 ${lastAdded === product.matchKey ? 'added-pop' : ''}`} aria-hidden />
              : <Plus className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}
