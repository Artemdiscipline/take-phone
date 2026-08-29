'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ExternalLink, Minus, Plus, Search, X } from 'lucide-react';

import { withBase } from '@/lib/build-mode';
import { AVAILABILITY_LABELS } from '@/lib/catalog/normalize';
import { modelKey } from '@/lib/catalog/pricing';
import type { MarkupRules, StaffProductView } from '@/lib/catalog/types';
import { formatPrice, formatRelative } from '@/lib/format';
import { terms } from '@/lib/site';

const MARKUP_LEVEL_LABELS: Record<StaffProductView['markupRule'], string> = {
  product: 'товара',
  model: 'модели',
  category: 'категории',
  global: 'глобальная',
};

/**
 * Закрытый раздел: закупочные цены, поставщики и ссылки на исходные карточки.
 * Ничего из этого не попадает в публичный API каталога.
 */
export function CatalogSection({
  views,
  rules,
  sourceLabels,
  sourceUrls,
  busy,
  onSetMarkup,
}: {
  views: StaffProductView[];
  rules: MarkupRules;
  sourceLabels: Record<string, string>;
  sourceUrls: Record<string, string>;
  busy: string | null;
  onSetMarkup: (level: string, key: string, value: number | null) => void;
}) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return views;

    return views.filter((view) =>
      `${view.product.title} ${view.product.simLabel}`.toLowerCase().includes(needle));
  }, [views, query]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="field-label">Глобальная наценка</p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Применяется, если нет правила для товара, модели или категории.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-paper p-1.5">
          <button
            type="button"
            onClick={() => onSetMarkup('global', 'global', Math.max(0, rules.global - 500))}
            className="grid size-9 place-items-center rounded-lg bg-surface transition hover:bg-surface-2"
            aria-label="Уменьшить глобальную наценку"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <strong className="min-w-[104px] text-center text-base font-semibold">
            {formatPrice(rules.global)}
          </strong>
          <button
            type="button"
            onClick={() => onSetMarkup('global', 'global', rules.global + 500)}
            className="grid size-9 place-items-center rounded-lg bg-surface transition hover:bg-surface-2"
            aria-label="Увеличить глобальную наценку"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <label className="mt-4 flex h-12 items-center gap-2.5 rounded-xl bg-surface px-4">
        <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-faint"
          placeholder="Найти товар"
          aria-label="Поиск по товарам"
          type="search"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">
            <X className="size-4 text-ink-faint" aria-hidden />
          </button>
        )}
      </label>

      <div className="mt-4 space-y-3">
        {visible.map((view) => (
          <ProductRow
            key={view.product.id}
            view={view}
            sourceLabels={sourceLabels}
            sourceUrls={sourceUrls}
            busy={busy}
            onSetMarkup={onSetMarkup}
          />
        ))}
      </div>
    </div>
  );
}

function ProductRow({
  view,
  sourceLabels,
  sourceUrls,
  busy,
  onSetMarkup,
}: {
  view: StaffProductView;
  sourceLabels: Record<string, string>;
  sourceUrls: Record<string, string>;
  busy: string | null;
  onSetMarkup: (level: string, key: string, value: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { product, offers, bestOffer, markup, markupRule } = view;

  const minPurchase = Math.min(...offers.map((offer) => offer.purchasePrice));

  return (
    <article className="rounded-2xl border border-line">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image src={withBase(product.images[0])} alt="" fill sizes="56px" className="object-contain p-1.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <p className="mt-1 text-[12px] text-ink-faint">
            {product.simLabel} · {offers.length} предложений ·{' '}
            {AVAILABILITY_LABELS[product.availability].toLowerCase()}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
          <p className="text-[12px] text-ink-faint">
            закупка {bestOffer ? formatPrice(bestOffer.purchasePrice) : '—'}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="collapse-open border-t border-line p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="pb-2 font-normal">Поставщик</th>
                  <th className="pb-2 font-normal">Наличие</th>
                  <th className="pb-2 font-normal">Обновлено</th>
                  <th className="pb-2 text-right font-normal">Закупка</th>
                  <th className="pb-2 text-right font-normal">Карточка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {offers.map((offer) => {
                  const best = offer.id === bestOffer?.id;

                  return (
                    <tr key={offer.id} className={best ? 'bg-accent-soft/60' : undefined}>
                      <td className="py-2.5 font-medium">
                        {sourceLabels[offer.source] ?? offer.source}
                        {best && (
                          <span className="ml-2 text-[11px] font-medium text-accent">
                            выбран
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-ink-soft">{AVAILABILITY_LABELS[offer.availability]}</td>
                      <td className="py-2.5 text-ink-faint">{formatRelative(offer.updatedAt)}</td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatPrice(offer.purchasePrice)}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={offer.sourceUrl || sourceUrls[offer.source]}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent transition hover:opacity-70"
                        >
                          Открыть
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-4 text-[13px]">
              <p className="field-label">Расчёт цены</p>
              <dl className="mt-3 space-y-1.5 text-ink-soft">
                <Line term="Минимальная закупка" value={formatPrice(minPurchase)} />
                <Line
                  term="Взято у поставщика"
                  value={bestOffer ? formatPrice(bestOffer.purchasePrice) : '—'}
                />
                <Line term={`Наценка (${MARKUP_LEVEL_LABELS[markupRule]})`} value={`+${formatPrice(markup)}`} />
                {product.availability === 'to_order' && (
                  <Line term="Скидка «под заказ»" value={`−${formatPrice(terms.preorderDiscount)}`} />
                )}
                <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
                  <dt>Цена Take Phone</dt>
                  <dd>{formatPrice(product.price)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-surface p-4">
              <p className="field-label">Наценка для этого товара</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy === `markup:${product.matchKey}`}
                  onClick={() => onSetMarkup('product', product.matchKey, Math.max(0, markup - 500))}
                  className="grid size-9 place-items-center rounded-lg bg-paper transition hover:bg-surface-2"
                  aria-label="Уменьшить наценку товара"
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <strong className="min-w-[96px] text-center text-sm font-semibold">
                  {formatPrice(markup)}
                </strong>
                <button
                  type="button"
                  disabled={busy === `markup:${product.matchKey}`}
                  onClick={() => onSetMarkup('product', product.matchKey, markup + 500)}
                  className="grid size-9 place-items-center rounded-lg bg-paper transition hover:bg-surface-2"
                  aria-label="Увеличить наценку товара"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                <button
                  type="button"
                  onClick={() => onSetMarkup('model', modelKey(product.brand, product.model), markup)}
                  className="rounded-lg bg-paper px-2.5 py-1.5 transition hover:bg-surface-2"
                >
                  Применить ко всей модели
                </button>
                {markupRule === 'product' && (
                  <button
                    type="button"
                    onClick={() => onSetMarkup('product', product.matchKey, null)}
                    className="rounded-lg bg-paper px-2.5 py-1.5 text-ink-soft transition hover:bg-surface-2"
                  >
                    Сбросить правило
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Line({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
