'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { formatDateTime, formatPrice, formatRelative } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from '@/lib/repositories/types';
import type { OrderStatus, StoredOrder } from '@/lib/repositories/types';
import { cardFeeLabel, site } from '@/lib/site';
import { OrderStatusBadge } from './order-status';

type SortOrder = 'newest' | 'oldest';

export function OrdersSection({
  orders,
  status,
  onRefresh,
  onUpdate,
  busyId,
}: {
  orders: StoredOrder[];
  status: 'idle' | 'loading' | 'error';
  onRefresh: () => void;
  onUpdate: (id: string, update: { status?: OrderStatus; staffComment?: string; note?: string }) => Promise<void>;
  busyId: string | null;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => summarise(orders), [orders]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (!needle) return true;

      const haystack = [
        order.publicNumber,
        order.name,
        order.phone,
        order.phone.replace(/\D/g, ''),
      ].join(' ').toLowerCase();

      return haystack.includes(needle);
    });

    return [...filtered].sort((a, b) => sort === 'newest'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt));
  }, [orders, query, statusFilter, sort]);

  const open = orders.find((order) => order.id === openId) ?? null;

  if (open) {
    return (
      <OrderDetail
        order={open}
        busy={busyId === open.id}
        onBack={() => setOpenId(null)}
        onUpdate={(update) => onUpdate(open.id, update)}
      />
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric value={String(stats.new)} label="новых" tone={stats.new > 0 ? 'accent' : 'default'} />
        <Metric value={String(stats.inWork)} label="в работе" />
        <Metric value={String(stats.completed)} label="завершено" />
        <Metric value={String(stats.today)} label="заявок сегодня" />
        <Metric value={formatPrice(stats.newAmount)} label="сумма новых" />
      </div>

      <div className="mt-6 flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="flex h-12 flex-1 items-center gap-2.5 rounded-xl bg-surface px-4">
          <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            placeholder="Номер, имя или телефон"
            aria-label="Поиск по заявкам"
            type="search"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">
              <X className="size-4 text-ink-faint" aria-hidden />
            </button>
          )}
        </label>

        {/* На узком экране фильтры переносятся, а не выдавливают страницу вбок. */}
        <div className="flex flex-wrap gap-2">
          <label className="flex h-12 min-w-[150px] flex-1 items-center gap-2 rounded-xl bg-surface px-4 text-sm lg:flex-none">
            <span className="shrink-0 text-ink-faint">Статус</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
              className="min-w-0 flex-1 bg-transparent font-medium outline-none"
              aria-label="Фильтр по статусу"
            >
              <option value="all">Все</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>
              ))}
            </select>
          </label>

          <label className="flex h-12 min-w-[150px] flex-1 items-center gap-2 rounded-xl bg-surface px-4 text-sm lg:flex-none">
            <span className="shrink-0 text-ink-faint">Сортировка</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              className="min-w-0 flex-1 bg-transparent font-medium outline-none"
              aria-label="Сортировка заявок"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={status === 'loading'}
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface transition hover:bg-surface-2 disabled:opacity-60"
            aria-label="Обновить список заявок"
          >
            <RefreshCw className={`size-4 ${status === 'loading' ? 'spin' : ''}`} aria-hidden />
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-order-soft p-3.5 text-[13px] text-order">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Не удалось обновить список. Показаны последние загруженные заявки.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {status === 'loading' && orders.length === 0
          ? Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="skeleton h-[76px] rounded-2xl" aria-hidden />
          ))
          : visible.length === 0
            ? (
              <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
                <Inbox className="mx-auto size-6 text-ink-faint" aria-hidden />
                <p className="mt-4 text-sm font-medium">
                  {orders.length === 0 ? 'Заявок пока нет' : 'Ничего не найдено'}
                </p>
                <p className="mt-1.5 text-[13px] text-ink-soft">
                  {orders.length === 0
                    ? 'Оформите заявку на публичной части сайта — она появится здесь.'
                    : 'Измените поиск или фильтр по статусу.'}
                </p>
              </div>
            )
            : visible.map((order) => (
              <OrderRow key={order.id} order={order} onOpen={() => setOpenId(order.id)} />
            ))}
      </div>
    </div>
  );
}

function OrderRow({ order, onOpen }: { order: StoredOrder; onOpen: () => void }) {
  const device = order.items[0]?.title ?? '—';
  const extra = order.items.length > 1 ? ` +${order.items.length - 1}` : '';

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Открыть заявку ${order.publicNumber} от ${order.name}`}
      className={`flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition hover:border-line-strong sm:flex-row sm:items-center ${
        order.status === 'new' ? 'border-accent/40 bg-accent-soft/40' : 'border-line'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-[13px] font-medium">{order.publicNumber}</span>
          <OrderStatusBadge status={order.status} />
          <span className="text-[12px] text-ink-faint">{formatRelative(order.createdAt)}</span>
        </div>
        <p className="mt-1.5 truncate text-sm font-medium">{order.name} · {order.phone}</p>
        <p className="mt-0.5 truncate text-[13px] text-ink-soft">{device}{extra}</p>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <p className="text-base font-semibold">{formatPrice(order.total)}</p>
        <p className="text-[12px] text-ink-faint">
          {order.delivery === 'pickup' ? 'самовывоз' : 'доставка'} ·{' '}
          {order.payment === 'card' ? 'карта' : order.payment === 'cash' ? 'наличные' : 'перевод'}
        </p>
      </div>
    </button>
  );
}

function OrderDetail({
  order,
  busy,
  onBack,
  onUpdate,
}: {
  order: StoredOrder;
  busy: boolean;
  onBack: () => void;
  onUpdate: (update: { status?: OrderStatus; staffComment?: string; note?: string }) => Promise<void>;
}) {
  const [comment, setComment] = useState(order.staffComment);
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(order.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер обмена может быть недоступен — номер и так виден и кликабелен.
    }
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Ко всем заявкам
      </button>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-medium">{order.publicNumber}</p>
                <p className="mt-1 text-[12px] text-ink-faint">
                  Создана {formatDateTime(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${order.phone.replace(/[^\d+]/g, '')}`}
                className="flex h-10 items-center gap-2 rounded-xl bg-plum px-4 text-[13px] font-medium text-white transition hover:bg-plum-soft"
              >
                <Phone className="size-3.5" aria-hidden />
                {order.phone}
              </a>
              <button
                type="button"
                onClick={copyPhone}
                className="flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-[13px] transition hover:border-line-strong"
              >
                {copied ? <Check className="size-3.5 text-stock" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copied ? 'Скопировано' : 'Скопировать'}
              </button>
              <a
                href={site.telegramManager}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-[13px] transition hover:border-line-strong"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Telegram
              </a>
            </div>

            <p className="mt-4 text-sm font-medium">{order.name}</p>

            {order.comment && (
              <p className="mt-3 rounded-xl bg-surface p-3.5 text-[13px] leading-relaxed text-ink-soft">
                {order.comment}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-line p-5">
            <p className="field-label">Состав заявки</p>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.productKey} className="flex justify-between gap-4 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {item.memoryLabel} · {item.color} · {item.simLabel}
                      {item.quantity > 1 && ` · ${item.quantity} шт.`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatPrice(item.price)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px]">
              <SummaryLine term="Стоимость устройств" value={formatPrice(order.subtotal)} />
              {order.cardFee > 0 && (
                <SummaryLine term={`Комиссия карты ${cardFeeLabel}`} value={`+${formatPrice(order.cardFee)}`} />
              )}
              <SummaryLine term="Итого" value={formatPrice(order.total)} strong />
              <SummaryLine
                term="Получение"
                value={order.delivery === 'pickup' ? 'Самовывоз' : 'Доставка по Тюмени'}
              />
              <SummaryLine
                term="Оплата"
                value={order.payment === 'card'
                  ? 'Банковская карта'
                  : order.payment === 'cash' ? 'Наличные' : 'Перевод'}
              />
              {order.reservationPrepayment > 0 && (
                <SummaryLine
                  term="Предоплата за бронь"
                  value={`${formatPrice(order.reservationPrepayment)} — согласовать`}
                />
              )}
            </dl>

            {order.delivered === 'stored' && (
              <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
                Заявка сохранена в базе. Внешний канал уведомлений не подключён,
                поэтому сообщение никуда не отправлялось.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-line p-5">
            <p className="field-label">Статус</p>
            <div className="mt-3 grid gap-2">
              {ORDER_STATUSES.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy || value === order.status}
                  onClick={() => onUpdate({ status: value })}
                  aria-pressed={value === order.status}
                  className={`flex h-10 items-center justify-between rounded-xl border px-3.5 text-[13px] transition disabled:cursor-default ${
                    value === order.status
                      ? 'border-accent bg-accent-soft font-medium text-accent'
                      : 'border-line hover:border-line-strong disabled:opacity-60'
                  }`}
                >
                  {ORDER_STATUS_LABELS[value]}
                  {value === order.status && <Check className="size-3.5" aria-hidden />}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line p-5">
            <label htmlFor="staff-comment" className="field-label">Комментарий сотрудника</label>
            <textarea
              id="staff-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Что уже сделано, о чём договорились"
              className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-accent"
            />
            <button
              type="button"
              disabled={busy || comment === order.staffComment}
              onClick={() => onUpdate({ staffComment: comment })}
              className="mt-3 h-10 w-full rounded-xl bg-plum text-[13px] font-medium text-white transition hover:bg-plum-soft disabled:opacity-50"
            >
              {busy ? 'Сохраняем…' : 'Сохранить комментарий'}
            </button>
          </section>

          <section className="rounded-2xl border border-line p-5">
            <p className="field-label">История</p>
            <ol className="mt-3 space-y-3">
              {order.history.map((event, index) => (
                <li key={`${event.at}-${index}`} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <div>
                    <p className="font-medium">{ORDER_STATUS_LABELS[event.status]}</p>
                    <p className="text-[12px] text-ink-faint">{formatDateTime(event.at)}</p>
                    {event.note && <p className="mt-1 text-ink-soft">{event.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({
  term,
  value,
  strong = false,
}: {
  term: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'font-semibold' : 'text-ink-soft'}`}>
      <dt>{term}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function Metric({
  value,
  label,
  tone = 'default',
}: {
  value: string;
  label: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className={`text-xl font-semibold tracking-[-0.02em] ${tone === 'accent' ? 'text-accent' : ''}`}>
        {value}
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">{label}</p>
    </div>
  );
}

function summarise(orders: StoredOrder[]) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return {
    new: orders.filter((order) => order.status === 'new').length,
    inWork: orders.filter(
      (order) => order.status === 'in_progress' || order.status === 'contacted' || order.status === 'confirmed',
    ).length,
    completed: orders.filter((order) => order.status === 'completed').length,
    today: orders.filter((order) => new Date(order.createdAt) >= startOfDay).length,
    newAmount: orders
      .filter((order) => order.status === 'new')
      .reduce((sum, order) => sum + order.total, 0),
  };
}
