'use client';

import { AlertTriangle, CheckCircle2, Database, RefreshCw } from 'lucide-react';

import type { SourceId, SyncRun } from '@/lib/catalog/types';
import { formatDateTime, formatRelative } from '@/lib/format';

/**
 * Состояние источников и журнал запусков.
 *
 * Если данные демонстрационные, интерфейс так и пишет — «Демо-данные» — и не
 * утверждает, что настоящая синхронизация подключена.
 */
export function SyncSection({
  mode,
  storage,
  runs,
  sourceLabels,
  sourceUrls,
  busy,
  onSync,
}: {
  mode: 'fixtures' | 'live';
  storage: 'd1' | 'memory';
  runs: SyncRun[];
  sourceLabels: Record<string, string>;
  sourceUrls: Record<string, string>;
  busy: boolean;
  onSync: () => void;
}) {
  const lastRun = runs[0] ?? null;
  const sources = (Object.keys(sourceLabels) as SourceId[]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-sm font-medium">
            {mode === 'fixtures' ? 'Источники в демо-режиме' : 'Источники подключены'}
          </p>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-ink-soft">
            {mode === 'fixtures'
              ? 'Каталог собран из демонстрационного набора в репозитории. Настоящий сбор данных начнётся, когда будут согласованы прайс-листы поставщиков.'
              : 'Каталог читается из согласованных прайс-листов поставщиков.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={busy}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-plum px-4 text-[13px] font-medium text-white transition hover:bg-plum-soft disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${busy ? 'spin' : ''}`} aria-hidden />
          {busy ? 'Синхронизируем…' : 'Синхронизировать'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {sources.map((source) => {
          const result = lastRun?.results.find((item) => item.source === source);

          return (
            <article key={source} className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{sourceLabels[source]}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  result?.mode === 'live' ? 'bg-stock-soft text-stock' : 'bg-order-soft text-order'
                }`}>
                  {result?.mode === 'live' ? 'Прайс-лист' : 'Демо-данные'}
                </span>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[13px]">
                {result?.ok
                  ? (
                    <>
                      <CheckCircle2 className="size-3.5 shrink-0 text-stock" aria-hidden />
                      <span className="text-stock">Ответил</span>
                    </>
                  )
                  : (
                    <>
                      <AlertTriangle className="size-3.5 shrink-0 text-order" aria-hidden />
                      <span className="text-order">Ошибка</span>
                    </>
                  )}
              </p>

              <dl className="mt-3 space-y-1 text-[12px] text-ink-soft">
                <div className="flex justify-between gap-2">
                  <dt>Позиций</dt>
                  <dd>{result?.offers ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Обновлено</dt>
                  <dd>{lastRun ? formatRelative(lastRun.finishedAt) : '—'}</dd>
                </div>
              </dl>

              {result?.error && (
                <p className="mt-3 rounded-lg bg-order-soft p-2.5 text-[12px] leading-relaxed text-order">
                  {result.error}
                </p>
              )}

              <a
                href={sourceUrls[source]}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-[12px] text-accent transition hover:opacity-70"
              >
                {sourceUrls[source]?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-accent" aria-hidden />
          <p className="text-sm font-medium">Хранилище</p>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          {storage === 'd1'
            ? 'Cloudflare D1. Заявки, наценки и журнал синхронизации переживают перезапуск.'
            : 'Память процесса. Подходит для локальной разработки: данные исчезают при перезапуске. Для рабочего стенда нужен биндинг D1.'}
        </p>
      </section>

      <section>
        <p className="field-label">История запусков</p>
        <div className="mt-3 space-y-3">
          {runs.length === 0
            ? (
              <p className="rounded-2xl bg-surface p-5 text-sm text-ink-soft">
                Синхронизация ещё не запускалась.
              </p>
            )
            : runs.map((run) => (
              <article key={run.id} className="rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">{formatDateTime(run.finishedAt)}</p>
                  <p className="text-[13px] text-ink-soft">
                    {run.totalOffers} предложений → {run.totalProducts} вариантов
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {run.results.map((result) => (
                    <div
                      key={result.source}
                      className={`rounded-xl p-3.5 text-[13px] ${
                        result.ok ? 'bg-stock-soft' : 'bg-order-soft'
                      }`}
                    >
                      <p className={`flex items-center gap-1.5 font-medium ${
                        result.ok ? 'text-stock' : 'text-order'
                      }`}>
                        {result.ok
                          ? <CheckCircle2 className="size-3.5" aria-hidden />
                          : <AlertTriangle className="size-3.5" aria-hidden />}
                        {sourceLabels[result.source] ?? result.source}
                      </p>
                      <p className="mt-1.5 text-ink-soft">
                        {result.ok
                          ? `${result.offers} позиций · ${result.durationMs} мс`
                          : result.error}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
