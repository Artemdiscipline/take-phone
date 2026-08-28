'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { AVAILABILITY_LABELS } from '@/lib/catalog/normalize';
import { modelKey } from '@/lib/catalog/pricing';
import type { MarkupRules, StaffProductView, SyncRun } from '@/lib/catalog/types';
import { formatDateTime, formatPrice, formatRelative } from '@/lib/format';
import type { StoredOrder } from '@/lib/repositories/types';

type Tab = 'catalog' | 'sync' | 'orders';

const MARKUP_LEVEL_LABELS: Record<StaffProductView['markupRule'], string> = {
  product: 'товара',
  model: 'модели',
  category: 'категории',
  global: 'глобальная',
};

export interface StaffOverviewData {
  mode: 'fixtures' | 'live';
  views: StaffProductView[];
  runs: SyncRun[];
  rules: MarkupRules;
  orders: StoredOrder[];
}

export function StaffPanel({
  initialData,
  sourceLabels,
  demoAccess,
}: {
  initialData: StaffOverviewData;
  sourceLabels: Record<string, string>;
  demoAccess: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>('catalog');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { mode, views, runs, orders } = data;
  const globalMarkup = data.rules.global;
  const lastRun = runs[0] ?? null;
  const failing = lastRun?.results.filter((result) => !result.ok) ?? [];

  /**
   * Runs a mutation, then reloads the internal snapshot so the panel reflects
   * the new state immediately instead of waiting for a full page render.
   */
  const call = async (action: string, request: () => Promise<Response>) => {
    setBusy(action);
    setNotice(null);

    try {
      const response = await request();
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        setNotice(payload.error ?? 'Не удалось выполнить действие');
        return;
      }

      const overview = await fetch('/api/staff/overview', { cache: 'no-store' });
      if (overview.ok) {
        setData(await overview.json() as StaffOverviewData);
      } else {
        // Session most likely expired — let the server decide what to show.
        router.refresh();
      }
    } catch {
      setNotice('Нет связи с сервером');
    } finally {
      setBusy(null);
    }
  };

  const setMarkup = (level: string, key: string, value: number | null) =>
    call(`markup:${key}`, () => fetch('/api/staff/markup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, key, value }),
    }));

  const logout = async () => {
    await fetch('/api/staff/session', { method: 'DELETE' });
    router.refresh();
  };

  const inStock = views.filter((view) => view.product.availability === 'in_stock').length;

  return (
    <div className="py-8 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h3">Панель сотрудника</h1>
            {mode === 'fixtures'
              ? (
                <span className="rounded-full bg-order-soft px-2.5 py-1 text-[11px] font-medium text-order">
                  Демо-данные
                </span>
              )
              : (
                <span className="rounded-full bg-stock-soft px-2.5 py-1 text-[11px] font-medium text-stock">
                  Реальные прайс-листы
                </span>
              )}
          </div>
          <p className="mt-2 max-w-[640px] text-sm text-ink-soft">
            Здесь видно, у кого выгоднее выкупить устройство и какая наценка применена.
            Покупателю эти данные не показываются нигде на сайте.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={busy === 'sync'}
            onClick={() => call('sync', () => fetch('/api/staff/sync', { method: 'POST' }))}
            className="flex h-11 items-center gap-2 rounded-xl bg-plum px-4 text-[13px] font-medium text-white transition hover:bg-plum-soft disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${busy === 'sync' ? 'spin' : ''}`} aria-hidden />
            {busy === 'sync' ? 'Синхронизируем…' : 'Синхронизировать'}
          </button>

          <button
            type="button"
            onClick={() => { void logout(); }}
            className="grid size-11 place-items-center rounded-xl border border-line transition hover:border-line-strong"
            aria-label="Выйти из панели"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      {demoAccess && (
        <p className="mt-5 rounded-xl bg-order-soft p-3.5 text-[12px] leading-relaxed text-order">
          Вход выполнен по демонстрационному паролю. Задайте <code>STAFF_PASSWORD</code>{' '}
          и <code>STAFF_SESSION_SECRET</code> перед запуском.
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-xl bg-order-soft p-3.5 text-[13px] text-order">{notice}</p>
      )}

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric value={String(views.length)} label="товаров в каталоге" />
        <Metric value={String(inStock)} label="в наличии сейчас" />
        <Metric
          value={lastRun ? `${lastRun.results.filter((r) => r.ok).length}/${lastRun.results.length}` : '—'}
          label="источников ответили"
          tone={failing.length > 0 ? 'warn' : 'ok'}
        />
        <Metric
          value={lastRun ? formatRelative(lastRun.finishedAt) : '—'}
          label="последняя синхронизация"
        />
      </div>

      <div className="mt-8 flex gap-1 border-b border-line">
        {([
          ['catalog', 'Каталог и наценка'],
          ['sync', 'Синхронизация'],
          ['orders', `Заявки${orders.length ? ` · ${orders.length}` : ''}`],
        ] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value}
            className={`-mb-px border-b-2 px-4 py-3 text-sm transition ${
              tab === value
                ? 'border-accent font-medium text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
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
                onClick={() => setMarkup('global', 'global', Math.max(0, globalMarkup - 500))}
                className="grid size-9 place-items-center rounded-lg bg-surface transition hover:bg-surface-2"
                aria-label="Уменьшить глобальную наценку"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <strong className="min-w-[104px] text-center text-base font-semibold">
                {formatPrice(globalMarkup)}
              </strong>
              <button
                type="button"
                onClick={() => setMarkup('global', 'global', globalMarkup + 500)}
                className="grid size-9 place-items-center rounded-lg bg-surface transition hover:bg-surface-2"
                aria-label="Увеличить глобальную наценку"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {views.map((view) => (
              <ProductRow
                key={view.product.id}
                view={view}
                sourceLabels={sourceLabels}
                busy={busy}
                onSetMarkup={setMarkup}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'sync' && (
        <div className="mt-6 space-y-4">
          {failing.length > 0 && (
            <div className="rounded-2xl border border-order/30 bg-order-soft p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-order">
                <AlertTriangle className="size-4" aria-hidden />
                Ошибки источников
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-order">
                {failing.map((result) => (
                  <li key={result.source}>
                    <strong>{sourceLabels[result.source] ?? result.source}</strong> — {result.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {runs.length === 0
            ? <p className="rounded-2xl bg-surface p-6 text-sm text-ink-soft">Синхронизация ещё не запускалась.</p>
            : runs.map((run) => (
              <article key={run.id} className="rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">{formatDateTime(run.finishedAt)}</p>
                  <p className="text-[13px] text-ink-soft">
                    {run.totalOffers} предложений → {run.totalProducts} товаров
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {run.results.map((result) => (
                    <div
                      key={result.source}
                      className={`rounded-xl p-3.5 text-[13px] ${result.ok ? 'bg-stock-soft' : 'bg-order-soft'}`}
                    >
                      <p className={`flex items-center gap-1.5 font-medium ${result.ok ? 'text-stock' : 'text-order'}`}>
                        {result.ok
                          ? <CheckCircle2 className="size-3.5" aria-hidden />
                          : <AlertTriangle className="size-3.5" aria-hidden />}
                        {sourceLabels[result.source] ?? result.source}
                      </p>
                      <p className="mt-1.5 text-ink-soft">
                        {result.ok
                          ? `${result.offers} позиций · ${result.durationMs} мс · режим ${result.mode === 'live' ? 'прайс-лист' : 'демо'}`
                          : result.error}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="mt-6 space-y-3">
          {orders.length === 0
            ? (
              <p className="rounded-2xl bg-surface p-6 text-sm text-ink-soft">
                Заявок пока нет. Оформите тестовую заявку на публичной части сайта —
                она появится здесь.
              </p>
            )
            : orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{order.name} · {order.phone}</p>
                    <p className="mt-1 text-[12px] text-ink-faint">
                      {formatDateTime(order.createdAt)} · заявка {order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{formatPrice(order.total)}</p>
                    <p className="text-[12px] text-ink-faint">
                      {order.delivery === 'pickup' ? 'самовывоз' : 'доставка'} ·{' '}
                      {order.payment === 'card' ? 'карта +13,5%' : order.payment === 'cash' ? 'наличные' : 'перевод'}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px] text-ink-soft">
                  {order.items.map((item) => (
                    <li key={item.matchKey} className="flex justify-between gap-4">
                      <span>{item.title}</span>
                      <span className="shrink-0">{formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>

                {order.comment && (
                  <p className="mt-3 rounded-xl bg-surface p-3 text-[13px] text-ink-soft">{order.comment}</p>
                )}

                {order.delivered === 'demo' && (
                  <p className="mt-3 text-[12px] text-order">
                    Канал доставки заявок не подключён — сообщение менеджеру не отправлялось.
                  </p>
                )}
              </article>
            ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({
  view,
  sourceLabels,
  busy,
  onSetMarkup,
}: {
  view: StaffProductView;
  sourceLabels: Record<string, string>;
  busy: string | null;
  onSetMarkup: (level: string, key: string, value: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { product, offers, bestOffer, markup, markupRule } = view;

  return (
    <article className="rounded-2xl border border-line">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image src={product.images[0]} alt="" fill sizes="56px" className="object-contain p-1.5" />
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
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="pb-2 font-normal">Поставщик</th>
                  <th className="pb-2 font-normal">Наличие</th>
                  <th className="pb-2 font-normal">Обновлено</th>
                  <th className="pb-2 text-right font-normal">Закупка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {offers.map((offer) => {
                  const best = offer.id === bestOffer?.id;

                  return (
                    <tr key={offer.id} className={best ? 'bg-accent-soft/60' : undefined}>
                      <td className="py-2.5 font-medium">
                        {sourceLabels[offer.source] ?? offer.source}
                        {best && <span className="ml-2 text-[11px] font-medium text-accent">лучший вариант</span>}
                      </td>
                      <td className="py-2.5 text-ink-soft">{AVAILABILITY_LABELS[offer.availability]}</td>
                      <td className="py-2.5 text-ink-faint">{formatRelative(offer.updatedAt)}</td>
                      <td className="py-2.5 text-right font-semibold">{formatPrice(offer.purchasePrice)}</td>
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
                <div className="flex justify-between">
                  <dt>Закупка</dt>
                  <dd>{bestOffer ? formatPrice(bestOffer.purchasePrice) : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Наценка ({MARKUP_LEVEL_LABELS[markupRule]})</dt>
                  <dd>+{formatPrice(markup)}</dd>
                </div>
                {product.availability === 'to_order' && (
                  <div className="flex justify-between">
                    <dt>Скидка «под заказ»</dt>
                    <dd>−{formatPrice(1000)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
                  <dt>На сайте</dt>
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

function Metric({
  value,
  label,
  tone = 'default',
}: {
  value: string;
  label: string;
  tone?: 'default' | 'ok' | 'warn';
}) {
  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className={`text-xl font-semibold tracking-[-0.02em] ${
        tone === 'warn' ? 'text-order' : tone === 'ok' ? 'text-stock' : ''
      }`}>
        {value}
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">{label}</p>
    </div>
  );
}
