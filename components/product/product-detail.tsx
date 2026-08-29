'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Check,
  Heart,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';

import { AvailabilityChip } from '@/components/catalog/availability';
import { CashPriceNote } from '@/components/catalog/cash-price-note';
import { ProductCard } from '@/components/catalog/product-card';
import { useRequest } from '@/components/order/request-store';
import { AppLink, useNavigate } from '@/components/site/app-link';
import { isStaticPreview, withBase } from '@/lib/build-mode';
import { colorRu, formatMemory } from '@/lib/catalog/normalize';
import type { CatalogListing, CatalogProduct } from '@/lib/catalog/types';
import { formatFreshness, formatPrice } from '@/lib/format';
import { site, terms } from '@/lib/site';

export function ProductDetail({
  listing,
  modelListings,
  related,
}: {
  listing: CatalogListing;
  modelListings: CatalogListing[];
  related: CatalogListing[];
}) {
  const navigate = useNavigate();
  const { add, has, toggleFavourite, isFavourite, open } = useRequest();

  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(listing.defaultVariantId);

  const variant = listing.variants.find((item) => item.id === variantId)
    ?? listing.variants[0];

  const inRequest = has(variant.matchKey);
  const favourite = isFavourite(listing.slug);
  const soldOut = variant.availability === 'out_of_stock';

  const memories = dedupe(modelListings.map((item) => item.memory)).sort((a, b) => a - b);
  const colors = dedupe(modelListings.map((item) => item.color));

  const gallery = dedupe([
    listing.images[0],
    ...modelListings.map((item) => item.images[0]),
  ]).slice(0, 5);

  const goTo = (next: CatalogListing | undefined) => {
    if (next && next.slug !== listing.slug) navigate(`/product/${next.slug}`);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
            <Image
              src={withBase(gallery[activeImage] ?? listing.images[0])}
              alt={listing.title}
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              priority
              style={{ objectFit: 'contain' }}
              className="object-contain p-3 sm:p-5"
            />
          </div>

          {gallery.length > 1 && (
            <ul className="scroll-x mt-3 flex gap-2" aria-label="Фотографии устройства">
              {gallery.map((image, index) => (
                <li key={image}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Фотография ${index + 1}`}
                    aria-pressed={index === activeImage}
                    className={`relative block size-[68px] shrink-0 overflow-hidden rounded-xl border bg-surface transition ${
                      index === activeImage ? 'border-accent' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <Image
                      src={withBase(image)}
                      alt=""
                      fill
                      sizes="68px"
                      style={{ objectFit: 'contain' }}
                      className="object-contain p-2"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <AvailabilityChip availability={variant.availability} />
            <span className="text-[12px] text-ink-faint" suppressHydrationWarning>
              Цена обновлена {formatFreshness(variant.updatedAt, isStaticPreview)}
            </span>
          </div>

          <h1 className="h2 mt-4">{listing.model}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {listing.memoryLabel} · {colorRu(listing.color) ?? listing.color}
            {listing.category === 'mac'
              ? listing.configuration ? ` · ${listing.configuration}` : ''
              : ` · ${variant.simLabel}`}
          </p>

          <CashPriceNote className="mt-7" />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-[32px] font-semibold leading-none tracking-[-0.035em]">
              {formatPrice(variant.price)}
            </span>
            {variant.oldPrice && (
              <span className="pb-1 text-[15px] text-ink-faint line-through">
                {formatPrice(variant.oldPrice)}
              </span>
            )}
          </div>

          {variant.availability === 'to_order' && (
            <p className="mt-3 rounded-xl bg-order-soft px-3.5 py-2.5 text-[13px] text-order">
              Устройство под заказ — цена уже включает скидку {formatPrice(terms.preorderDiscount)}.
              Срок поставки менеджер назовёт при подтверждении.
            </p>
          )}

          {memories.length > 1 && (
            <section className="mt-8">
              <p className="field-label">Память</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memories.map((memory) => {
                  const target = modelListings.find(
                    (item) => item.memory === memory && item.color === listing.color,
                  ) ?? modelListings.find((item) => item.memory === memory);
                  const active = memory === listing.memory;

                  return (
                    <button
                      key={memory}
                      type="button"
                      onClick={() => goTo(target)}
                      aria-pressed={active}
                      className={`h-11 rounded-xl border px-4 text-sm font-medium transition ${
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line hover:border-line-strong'
                      }`}
                    >
                      {formatMemory(memory)}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {colors.length > 1 && (
            <section className="mt-6">
              <p className="field-label">Цвет</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => {
                  const target = modelListings.find(
                    (item) => item.color === color && item.memory === listing.memory,
                  ) ?? modelListings.find((item) => item.color === color);
                  const active = color === listing.color;

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => goTo(target)}
                      aria-pressed={active}
                      className={`flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm transition ${
                        active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <span
                        className="size-4 rounded-full border border-black/10"
                        style={{ background: target?.colorHex ?? '#ddd' }}
                        aria-hidden
                      />
                      {colorRu(color) ?? color}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/*
            Раньше версии eSIM и 2 SIM были двумя карточками каталога с общим
            адресом. Теперь это выбор внутри товара: меняются цена и наличие.
          */}
          {listing.category !== 'mac' && listing.hasSimChoice && (
            <section className="mt-6">
              <p className="field-label">SIM-карты</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {listing.variants.map((option) => (
                  <SimOption
                    key={option.id}
                    variant={option}
                    active={option.id === variant.id}
                    onSelect={() => setVariantId(option.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 flex gap-2">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                add(listing, variant);
                open();
              }}
              className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-plum px-6 text-sm font-medium text-white transition hover:bg-plum-soft disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint"
            >
              {inRequest ? <Check className="size-4" aria-hidden /> : null}
              {soldOut ? 'Нет в наличии' : inRequest ? 'В заявке — открыть' : 'Оставить заявку'}
            </button>

            <button
              type="button"
              onClick={() => toggleFavourite(listing.slug)}
              aria-label={favourite ? 'Убрать из избранного' : 'Добавить в избранное'}
              aria-pressed={favourite}
              className="grid size-13 place-items-center rounded-xl border border-line transition hover:border-line-strong"
            >
              <Heart
                className={`size-4 ${favourite ? 'fill-accent text-accent' : 'text-ink-soft'}`}
                aria-hidden
              />
            </button>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
            Оплата на сайте не проводится. Менеджер подтверждает наличие, итоговую цену
            и способ получения.
          </p>

          <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
            <Row
              icon={<Store className="size-4" aria-hidden />}
              term="Самовывоз"
              value={`${site.addressFull}, ${site.workingHours.toLowerCase()}`}
            />
            <Row
              icon={<Truck className="size-4" aria-hidden />}
              term="Доставка"
              value="По Тюмени — условия уточняет менеджер"
            />
            <Row
              icon={<ShieldCheck className="size-4" aria-hidden />}
              term="Гарантия"
              value="До 5 лет, обслуживание в собственном сервисе"
            />
            <Row
              icon={<RefreshCw className="size-4" aria-hidden />}
              term="Trade-in"
              value="Принимаем устройства любых брендов в зачёт"
            />
          </dl>

          <p className="mt-5 rounded-xl bg-surface p-4 text-[12px] leading-relaxed text-ink-soft">
            Для бронирования устройства до вашего приезда может потребоваться
            предоплата {formatPrice(terms.reservationPrepayment)}. Менеджер согласует её
            при подтверждении заявки.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-12 lg:mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h3">Похожие устройства</h2>
            <AppLink href="/catalog" className="text-sm text-accent transition hover:opacity-70">
              Весь каталог
            </AppLink>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} listing={item} />)}
          </div>
        </section>
      )}
    </>
  );
}

function SimOption({
  variant,
  active,
  onSelect,
}: {
  variant: CatalogProduct;
  active: boolean;
  onSelect: () => void;
}) {
  const unavailable = variant.availability === 'out_of_stock';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-xl border p-3.5 text-left transition ${
        active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
      } ${unavailable ? 'opacity-60' : ''}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{variant.simLabel}</span>
        {active && <Check className="size-4 shrink-0 text-accent" aria-hidden />}
      </span>
      <CashPriceNote className="mt-2" />
      <span className="mt-1.5 block text-[13px] font-semibold">{formatPrice(variant.price)}</span>
      <span
        className={`mt-0.5 block text-[11px] ${
          variant.availability === 'in_stock'
            ? 'text-stock'
            : variant.availability === 'to_order'
              ? 'text-order'
              : 'text-ink-faint'
        }`}
      >
        {variant.availability === 'in_stock'
          ? 'В наличии'
          : variant.availability === 'to_order'
            ? 'Под заказ'
            : 'Нет в наличии'}
      </span>
    </button>
  );
}

function Row({
  icon,
  term,
  value,
}: {
  icon: React.ReactNode;
  term: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 py-3.5">
      <span className="mt-0.5 text-accent">{icon}</span>
      <dt className="w-[104px] shrink-0 text-ink-faint">{term}</dt>
      <dd className="flex-1 text-ink-soft">{value}</dd>
    </div>
  );
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}
