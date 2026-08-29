'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { isStaticPreview } from '@/lib/build-mode';
import { colorRu } from '@/lib/catalog/normalize';
import type { CatalogListing } from '@/lib/catalog/types';
import { formatFreshness } from '@/lib/format';
import { ProductCard } from './product-card';
import { ProductGridSkeleton } from './product-skeleton';

type SortOrder = 'default' | 'price-asc' | 'price-desc';

interface Filters {
  query: string;
  generation: string;
  memory: string;
  color: string;
  onlyAvailable: boolean;
  sort: SortOrder;
}

const EMPTY_FILTERS: Filters = {
  query: '',
  generation: 'all',
  memory: 'all',
  color: 'all',
  onlyAvailable: false,
  sort: 'default',
};

export function CatalogBrowser({
  initialListings,
  initialQuery = '',
  demoData = false,
}: {
  initialListings: CatalogListing[];
  initialQuery?: string;
  /** Каталог собран из демонстрационного набора — говорим об этом честно. */
  demoData?: boolean;
}) {
  const [listings, setListings] = useState(initialListings);
  const [serverListings, setServerListings] = useState(initialListings);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, query: initialQuery });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Рендер с сервера важнее последнего клиентского запроса. Правка во время
  // рендера избавляет от лишнего прохода через очередь эффектов.
  if (serverListings !== initialListings) {
    setServerListings(initialListings);
    setListings(initialListings);
  }

  const refresh = useCallback(async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/catalog', { cache: 'no-store' });
      if (!response.ok) throw new Error('bad status');

      const payload = await response.json() as { listings?: CatalogListing[] };
      if (!Array.isArray(payload.listings)) throw new Error('bad payload');

      setListings(payload.listings);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  const options = useMemo(() => ({
    generations: unique(listings.map((listing) => listing.generation)),
    memories: unique(listings.map((listing) => String(listing.memory)))
      .sort((a, b) => Number(a) - Number(b)),
    colors: unique(listings.map((listing) => listing.color)),
  }), [listings]);

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    const result = listings.filter((listing) => {
      if (filters.generation !== 'all' && listing.generation !== filters.generation) return false;
      if (filters.memory !== 'all' && String(listing.memory) !== filters.memory) return false;
      if (filters.color !== 'all' && listing.color !== filters.color) return false;
      if (filters.onlyAvailable && listing.availability !== 'in_stock') return false;

      if (query) {
        const haystack = [
          listing.title,
          listing.model,
          listing.memoryLabel,
          listing.color,
          colorRu(listing.color) ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    if (filters.sort === 'price-asc') return [...result].sort((a, b) => a.price - b.price);
    if (filters.sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [listings, filters]);

  const activeCount = countActive(filters);
  const lastUpdate = listings.map((listing) => listing.updatedAt).sort().at(-1);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="flex h-12 flex-1 items-center gap-2.5 rounded-xl bg-surface px-4">
            <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
            <input
              value={filters.query}
              onChange={(event) => update('query', event.target.value)}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-faint"
              placeholder="Модель, память или цвет"
              aria-label="Поиск по каталогу"
              type="search"
            />
            {filters.query && (
              <button type="button" onClick={() => update('query', '')} aria-label="Очистить поиск">
                <X className="size-4 text-ink-faint" aria-hidden />
              </button>
            )}
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium transition hover:bg-surface-2 lg:flex-none"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Фильтры
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-plum text-[11px] text-white">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => update('onlyAvailable', !filters.onlyAvailable)}
              aria-pressed={filters.onlyAvailable}
              className={`h-12 shrink-0 rounded-xl px-4 text-sm font-medium transition ${
                filters.onlyAvailable
                  ? 'bg-accent-soft text-accent'
                  : 'bg-surface text-ink-soft hover:bg-surface-2'
              }`}
            >
              Только в наличии
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div
            id="catalog-filters"
            className="collapse-open mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <SelectFilter
              label="Модель"
              value={filters.generation}
              onChange={(value) => update('generation', value)}
              options={[{ value: 'all', label: 'Все модели' },
                ...options.generations.map((value) => ({ value, label: `iPhone ${value}` }))]}
            />
            <SelectFilter
              label="Память"
              value={filters.memory}
              onChange={(value) => update('memory', value)}
              options={[{ value: 'all', label: 'Любая' },
                ...options.memories.map((value) => ({
                  value,
                  label: Number(value) >= 1024 ? `${Number(value) / 1024} ТБ` : `${value} ГБ`,
                }))]}
            />
            <SelectFilter
              label="Цвет"
              value={filters.color}
              onChange={(value) => update('color', value)}
              options={[{ value: 'all', label: 'Любой' },
                ...options.colors.map((value) => ({ value, label: colorRu(value) ?? value }))]}
            />
            <SelectFilter
              label="Сортировка"
              icon={<ArrowUpDown className="size-4 text-ink-faint" aria-hidden />}
              value={filters.sort}
              onChange={(value) => update('sort', value as SortOrder)}
              options={[
                { value: 'default', label: 'По наличию' },
                { value: 'price-asc', label: 'Сначала дешевле' },
                { value: 'price-desc', label: 'Сначала дороже' },
              ]}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-ink-soft">
          {visible.length > 0
            ? `${visible.length} ${plural(visible.length, 'позиция', 'позиции', 'позиций')}`
            : 'Ничего не найдено'}
          {lastUpdate && (
            <span className="text-ink-faint">
              {' '}· обновлено {formatFreshness(lastUpdate, isStaticPreview)}
            </span>
          )}
          {demoData && (
            <span
              className="ml-2 inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-faint"
              title="В демоверсии показана механика автоматического обновления каталога"
            >
              Демонстрационные данные
            </span>
          )}
        </p>

        {/* В статической витрине обновлять нечего — серверного маршрута нет. */}
        {!isStaticPreview && (
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft transition hover:bg-surface disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${status === 'loading' ? 'spin' : ''}`} aria-hidden />
            {status === 'loading' ? 'Обновляем…' : 'Обновить цены'}
          </button>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-order/30 bg-order-soft p-4 text-sm text-order sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            Не удалось обновить цены. Показан последний загруженный список.
          </span>
          <button
            type="button"
            onClick={refresh}
            className="shrink-0 rounded-lg bg-order px-3 py-1.5 text-[13px] font-medium text-white"
          >
            Повторить
          </button>
        </div>
      )}

      <div className="mt-4">
        {status === 'loading' && listings.length === 0
          ? <ProductGridSkeleton count={8} />
          : visible.length > 0
            ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((listing, index) => (
                  <ProductCard key={listing.id} listing={listing} priority={index < 4} />
                ))}
              </div>
            )
            : (
              <div className="card flex flex-col items-center px-6 py-16 text-center">
                <Search className="size-6 text-ink-faint" aria-hidden />
                <p className="mt-4 text-base font-medium">Ничего не найдено</p>
                <p className="mt-1.5 max-w-[360px] text-sm text-ink-soft">
                  Попробуйте изменить параметры или сбросить фильтры — возможно, нужная
                  модель есть под заказ.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-5 rounded-xl bg-plum px-5 py-2.5 text-sm font-medium text-white transition hover:bg-plum-soft"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-xl bg-surface px-4 text-sm">
      {icon}
      <span className="shrink-0 text-ink-faint">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-medium outline-none"
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function countActive(filters: Filters): number {
  let count = 0;
  if (filters.generation !== 'all') count += 1;
  if (filters.memory !== 'all') count += 1;
  if (filters.color !== 'all') count += 1;
  if (filters.sort !== 'default') count += 1;
  return count;
}

function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
