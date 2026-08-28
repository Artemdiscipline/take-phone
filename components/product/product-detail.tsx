'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ProductCard } from '@/components/catalog/product-card';
import { useRequest } from '@/components/order/request-store';
import { colorRu, formatMemory } from '@/lib/catalog/normalize';
import type { CatalogProduct } from '@/lib/catalog/types';
import { formatPrice, formatRelative } from '@/lib/format';
import { site, terms } from '@/lib/site';

export function ProductDetail({
  product,
  variants,
  related,
}: {
  product: CatalogProduct;
  variants: CatalogProduct[];
  related: CatalogProduct[];
}) {
  const router = useRouter();
  const { add, has, toggleFavourite, isFavourite, open } = useRequest();
  const [activeImage, setActiveImage] = useState(0);

  const inRequest = has(product.matchKey);
  const favourite = isFavourite(product.matchKey);
  const soldOut = product.availability === 'out_of_stock';

  const memories = dedupe(variants.map((variant) => variant.memory))
    .sort((a, b) => a - b);
  const colors = dedupe(variants.map((variant) => variant.color));

  const gallery = dedupe([
    product.images[0],
    ...variants.map((variant) => variant.images[0]),
  ]).slice(0, 5);

  const goTo = (next: CatalogProduct | undefined) => {
    if (next && next.slug !== product.slug) router.push(`/product/${next.slug}`);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
            <Image
              src={gallery[activeImage] ?? product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              priority
              className="object-contain p-8 sm:p-12"
            />
          </div>

          {gallery.length > 1 && (
            <ul className="mt-3 flex gap-2" aria-label="Фотографии устройства">
              {gallery.map((image, index) => (
                <li key={image}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Фотография ${index + 1}`}
                    aria-pressed={index === activeImage}
                    className={`relative block size-[68px] overflow-hidden rounded-xl border bg-surface transition ${
                      index === activeImage ? 'border-accent' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <Image src={image} alt="" fill sizes="68px" className="object-contain p-2" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <AvailabilityChip availability={product.availability} />
            <span className="text-[12px] text-ink-faint">
              Цена обновлена {formatRelative(product.updatedAt)}
            </span>
          </div>

          <h1 className="h2 mt-4">{product.model}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {product.memoryLabel} · {colorRu(product.color) ?? product.color} · {product.simLabel}
          </p>

          <div className="mt-7 flex items-end gap-3">
            <span className="text-[32px] font-semibold leading-none tracking-[-0.035em]">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="pb-1 text-[15px] text-ink-faint line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          {product.availability === 'to_order' && (
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
                  const target = variants.find(
                    (variant) => variant.memory === memory && variant.color === product.color,
                  ) ?? variants.find((variant) => variant.memory === memory);
                  const active = memory === product.memory;

                  return (
                    <button
                      key={memory}
                      type="button"
                      onClick={() => goTo(target)}
                      aria-pressed={active}
                      className={`h-11 rounded-xl border px-4 text-sm font-medium transition ${
                        active ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:border-line-strong'
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
                  const target = variants.find(
                    (variant) => variant.color === color && variant.memory === product.memory,
                  ) ?? variants.find((variant) => variant.color === color);
                  const active = color === product.color;

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

          <div className="mt-8 flex gap-2">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                add(product);
                open();
              }}
              className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-plum px-6 text-sm font-medium text-white transition hover:bg-plum-soft disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint"
            >
              {inRequest ? <Check className="size-4" aria-hidden /> : null}
              {soldOut ? 'Нет в наличии' : inRequest ? 'В заявке — открыть' : 'Оставить заявку'}
            </button>

            <button
              type="button"
              onClick={() => toggleFavourite(product.matchKey)}
              aria-label={favourite ? 'Убрать из избранного' : 'Добавить в избранное'}
              aria-pressed={favourite}
              className="grid size-13 place-items-center rounded-xl border border-line transition hover:border-line-strong"
            >
              <Heart className={`size-4 ${favourite ? 'fill-accent text-accent' : 'text-ink-soft'}`} aria-hidden />
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
            Бронирование при самовывозе — предоплата {formatPrice(terms.reservationPrepayment)}.
            Она засчитывается в стоимость устройства.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-12 lg:mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h3">Похожие устройства</h2>
            <Link href="/catalog" className="text-sm text-accent transition hover:opacity-70">
              Весь каталог
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </>
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
