'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { LogOut } from 'lucide-react';

import type { MarkupRules, StaffProductView, SyncRun } from '@/lib/catalog/types';
import type { OrderStatus, StoredOrder } from '@/lib/repositories/types';
import { CatalogSection } from './catalog-section';
import { OrdersSection } from './orders-section';
import { SyncSection } from './sync-section';

type Tab = 'orders' | 'catalog' | 'sync';

export interface StaffOverviewData {
  mode: 'fixtures' | 'live';
  storage: 'd1' | 'memory';
  views: StaffProductView[];
  runs: SyncRun[];
  rules: MarkupRules;
  orders: StoredOrder[];
}

export function StaffPanel({
  initialData,
  sourceLabels,
  sourceUrls,
  demoAccess,
}: {
  initialData: StaffOverviewData;
  sourceLabels: Record<string, string>;
  sourceUrls: Record<string, string>;
  /** Вход выполнен по демонстрационному паролю. */
  demoAccess: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>('orders');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const newOrders = data.orders.filter((order) => order.status === 'new').length;

  /** Перечитывает внутренний срез, чтобы панель отражала свежее состояние. */
  const reload = useCallback(async (): Promise<boolean> => {
    const response = await fetch('/api/staff/overview', { cache: 'no-store' });

    if (!response.ok) {
      // Скорее всего истекла сессия — пусть решает сервер.
      if (response.status === 401) router.refresh();
      return false;
    }

    setData(await response.json() as StaffOverviewData);
    return true;
  }, [router]);

  const refreshOrders = useCallback(async () => {
    setStatus('loading');
    setNotice(null);

    try {
      setStatus(await reload() ? 'idle' : 'error');
    } catch {
      setStatus('error');
    }
  }, [reload]);

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

      await reload();
    } catch {
      setNotice('Нет связи с сервером');
    } finally {
      setBusy(null);
    }
  };

  const updateOrder = async (
    id: string,
    update: { status?: OrderStatus; staffComment?: string; note?: string },
  ) => {
    await call(id, () => fetch(`/api/staff/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    }));
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

  return (
    <div className="py-8 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h3">Панель сотрудника</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              data.mode === 'fixtures' ? 'bg-order-soft text-order' : 'bg-stock-soft text-stock'
            }`}>
              {data.mode === 'fixtures' ? 'Демо-данные' : 'Реальные прайс-листы'}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              data.storage === 'd1' ? 'bg-stock-soft text-stock' : 'bg-surface-2 text-ink-faint'
            }`}>
              {data.storage === 'd1' ? 'База D1' : 'Память процесса'}
            </span>
          </div>
          <p className="mt-2 max-w-[640px] text-sm text-ink-soft">
            Заявки покупателей, закупочные цены поставщиков и наценка. Покупателю
            эти данные не показываются нигде на сайте.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { void logout(); }}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line transition hover:border-line-strong"
          aria-label="Выйти из панели"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </header>

      {demoAccess && (
        <p className="mt-5 rounded-xl bg-order-soft p-3.5 text-[12px] leading-relaxed text-order">
          Вход выполнен по демонстрационному паролю. Перед публичным запуском
          задайте <code>STAFF_PASSWORD</code> и <code>STAFF_SESSION_SECRET</code>.
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-xl bg-order-soft p-3.5 text-[13px] text-order">{notice}</p>
      )}

      <div className="scroll-x mt-8 flex gap-1 border-b border-line">
        {([
          ['orders', `Заявки${newOrders > 0 ? ` · ${newOrders}` : ''}`],
          ['catalog', 'Каталог и поставщики'],
          ['sync', 'Синхронизация'],
        ] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
              tab === value
                ? 'border-accent font-medium text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <OrdersSection
          orders={data.orders}
          status={status}
          onRefresh={refreshOrders}
          onUpdate={updateOrder}
          busyId={busy}
        />
      )}

      {tab === 'catalog' && (
        <CatalogSection
          views={data.views}
          rules={data.rules}
          sourceLabels={sourceLabels}
          sourceUrls={sourceUrls}
          busy={busy}
          onSetMarkup={setMarkup}
        />
      )}

      {tab === 'sync' && (
        <SyncSection
          mode={data.mode}
          storage={data.storage}
          runs={data.runs}
          sourceLabels={sourceLabels}
          sourceUrls={sourceUrls}
          busy={busy === 'sync'}
          onSync={() => call('sync', () => fetch('/api/staff/sync', { method: 'POST' }))}
        />
      )}
    </div>
  );
}
