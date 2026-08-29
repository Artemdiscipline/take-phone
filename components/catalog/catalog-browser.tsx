'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { isStaticPreview } from '@/lib/build-mode';
import { colorRu, configurationRu, formatCaseSize, formatMemory } from '@/lib/catalog/normalize';
import type { CatalogListing, CatalogProduct } from '@/lib/catalog/types';
import { formatFreshness } from '@/lib/format';
import { ProductCard } from './product-card';
import { ProductGridSkeleton } from './product-skeleton';

type SortOrder = 'default' | 'price-asc' | 'price-desc';

/** Идентификаторы фильтров. Показываются только те, у которых есть выбор. */
type FacetId = 'model' | 'memory' | 'caseSize' | 'color' | 'sim' | 'configuration';

interface Filters {
  query: string;
  onlyAvailable: boolean;
  sort: SortOrder;
  facets: Record<FacetId, string>;
}

/**
 * Одна карточка списка.
 *
 * В общем списке позиция показывается свёрнутой: варианты SIM собраны внутрь,
 * иначе в каталоге появлялись пары внешне одинаковых карточек. На странице
 * модели, наоборот, каждый вариант — отдельная карточка: там покупатель уже
 * выбрал модель и сравнивает именно память, цвет и SIM.
 */
interface Entry {
  key: string;
  listing: CatalogListing;
  variant: CatalogProduct;
  /** Показывать ли характеристики выбранного варианта, а не позиции целиком. */
  asVariant: boolean;
  price: number;
  availability: CatalogListing['availability'];
}

/** Ограничение выборки: страница категории и страница модели показывают своё. */
export interface CatalogScope {
  categorySlug?: string;
  modelSlug?: string;
}

/**
 * Строка поиска из адреса.
 *
 * В обычной сборке её читает сервер и передаёт в `initialQuery`. В статической
 * витрине страница собрана заранее и про query ничего не знает, поэтому адрес
 * приходится читать в браузере. `useSyncExternalStore` — ровно тот случай:
 * источник внешний, а серверный снимок остаётся прежним, так что гидратация
 * не расходится.
 */
function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function readUrlQuery(): string {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

const EMPTY_FACETS: Record<FacetId, string> = {
  model: 'all',
  memory: 'all',
  caseSize: 'all',
  color: 'all',
  sim: 'all',
  configuration: 'all',
};

const EMPTY_FILTERS: Filters = {
  query: '',
  onlyAvailable: false,
  sort: 'default',
  facets: EMPTY_FACETS,
};

export function CatalogBrowser({
  initialListings,
  initialQuery = '',
  demoData = false,
  scope,
  expandVariants = false,
  showSearch = true,
}: {
  initialListings: CatalogListing[];
  initialQuery?: string;
  /** Каталог собран из демонстрационного набора — говорим об этом честно. */
  demoData?: boolean;
  /** Какую часть каталога показывает страница. Нужен и после обновления цен. */
  scope?: CatalogScope;
  /** Каждый вариант — отдельная карточка (страница конкретной модели). */
  expandVariants?: boolean;
  showSearch?: boolean;
}) {
  const [listings, setListings] = useState(initialListings);
  const [serverListings, setServerListings] = useState(initialListings);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, query: initialQuery });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const urlQuery = useSyncExternalStore(
    subscribeToLocation,
    readUrlQuery,
    () => initialQuery,
  );
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);

  // Рендер с сервера важнее последнего клиентского запроса. Правка во время
  // рендера избавляет от лишнего прохода через очередь эффектов.
  if (serverListings !== initialListings) {
    setServerListings(initialListings);
    setListings(initialListings);
  }

  // Адрес изменился (переход из шапки или кнопка «назад») — подставляем запрос.
  // Ручные правки поля при этом не затираются: сравниваем именно с адресом.
  if (appliedQuery !== urlQuery) {
    setAppliedQuery(urlQuery);
    setFilters((current) => ({ ...current, query: urlQuery }));
  }

  const refresh = useCallback(async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/catalog', { cache: 'no-store' });
      if (!response.ok) throw new Error('bad status');

      const payload = await response.json() as { listings?: CatalogListing[] };
      if (!Array.isArray(payload.listings)) throw new Error('bad payload');

      // Ответ содержит весь каталог, а страница показывает свою часть —
      // без этого обновление цен на странице модели вывалило бы все товары.
      setListings(payload.listings.filter((listing) => inScope(listing, scope)));
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [scope]);

  const entries = useMemo(
    () => buildEntries(listings, expandVariants),
    [listings, expandVariants],
  );

  const facets = useMemo(() => buildFacets(entries), [entries]);

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    const result = entries.filter((entry) => {
      const { listing, variant } = entry;
      const { facets: selected } = filters;

      if (selected.model !== 'all' && listing.modelSlug !== selected.model) return false;
      if (selected.memory !== 'all' && String(listing.memory) !== selected.memory) return false;
      if (selected.caseSize !== 'all' && String(listing.caseSize ?? '') !== selected.caseSize) return false;
      if (selected.color !== 'all' && listing.color !== selected.color) return false;
      if (selected.configuration !== 'all' && (listing.configuration ?? '') !== selected.configuration) {
        return false;
      }

      // В свёрнутом списке позиция подходит, если подходит хотя бы один её вариант.
      if (selected.sim !== 'all') {
        const matches = entry.asVariant
          ? variant.sim === selected.sim
          : listing.variants.some((option) => option.sim === selected.sim);
        if (!matches) return false;
      }

      if (filters.onlyAvailable && entry.availability !== 'in_stock') return false;

      if (query) {
        const haystack = [
          listing.title,
          listing.modelName,
          listing.memoryLabel,
          listing.caseSizeLabel ?? '',
          listing.color,
          colorRu(listing.color) ?? '',
          listing.configuration ? configurationRu(listing.configuration) : '',
          variant.simLabel,
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    if (filters.sort === 'price-asc') return [...result].sort((a, b) => a.price - b.price);
    if (filters.sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [entries, filters]);

  const activeCount = countActive(filters);
  const lastUpdate = listings.map((listing) => listing.updatedAt).sort().at(-1);

  const setFacet = (id: FacetId, value: string) =>
    setFilters((current) => ({ ...current, facets: { ...current.facets, [id]: value } }));

  return (
    <div>
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {showSearch && (
            <label className="flex h-12 flex-1 items-center gap-2.5 rounded-xl bg-surface px-4">
              <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
              <input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))}
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-faint"
                placeholder="Модель, память или цвет"
                aria-label="Поиск по каталогу"
                type="search"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, query: '' }))}
                  aria-label="Очистить поиск"
                >
                  <X className="size-4 text-ink-faint" aria-hidden />
                </button>
              )}
            </label>
          )}

          <div className={`flex gap-2 ${showSearch ? '' : 'flex-1'}`}>
            {facets.length > 0 && (
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
            )}

            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({ ...current, onlyAvailable: !current.onlyAvailable }))}
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

        {filtersOpen && facets.length > 0 && (
          <div
            id="catalog-filters"
            className="collapse-open mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {facets.map((facet) => (
              <SelectFilter
                key={facet.id}
                label={facet.label}
                value={filters.facets[facet.id]}
                onChange={(value) => setFacet(facet.id, value)}
                options={[{ value: 'all', label: facet.anyLabel }, ...facet.options]}
              />
            ))}
            <SelectFilter
              label="Сортировка"
              icon={<ArrowUpDown className="size-4 text-ink-faint" aria-hidden />}
              value={filters.sort}
              onChange={(value) =>
                setFilters((current) => ({ ...current, sort: value as SortOrder }))}
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
            ? `${visible.length} ${expandVariants
              ? plural(visible.length, 'вариант', 'варианта', 'вариантов')
              : plural(visible.length, 'позиция', 'позиции', 'позиций')}`
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
                {visible.map((entry, index) => (
                  <ProductCard
                    key={entry.key}
                    listing={entry.listing}
                    variant={entry.asVariant ? entry.variant : undefined}
                    priority={index < 4}
                  />
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

function inScope(listing: CatalogListing, scope: CatalogScope | undefined): boolean {
  if (!scope) return true;
  if (scope.categorySlug && listing.categorySlug !== scope.categorySlug) return false;
  if (scope.modelSlug && listing.modelSlug !== scope.modelSlug) return false;
  return true;
}

function buildEntries(listings: CatalogListing[], expandVariants: boolean): Entry[] {
  if (!expandVariants) {
    return listings.map((listing) => {
      const variant = listing.variants.find((item) => item.id === listing.defaultVariantId)
        ?? listing.variants[0];

      return {
        key: listing.id,
        listing,
        variant,
        asVariant: false,
        price: listing.price,
        availability: listing.availability,
      };
    });
  }

  return listings.flatMap((listing) =>
    listing.variants.map((variant) => ({
      key: variant.id,
      listing,
      variant,
      asVariant: true,
      price: variant.price,
      availability: variant.availability,
    })));
}

interface Facet {
  id: FacetId;
  label: string;
  anyLabel: string;
  options: { value: string; label: string }[];
}

/**
 * Набор фильтров считается по самим данным.
 *
 * Фильтр с единственным значением бесполезен, поэтому он не появляется: на
 * странице модели сам собой исчезает выбор модели, у часов — объём памяти,
 * а у телефонов — размер корпуса.
 */
function buildFacets(entries: Entry[]): Facet[] {
  const models = uniqueBy(
    entries.map((entry) => ({ value: entry.listing.modelSlug, label: entry.listing.modelName })),
  );

  const memories = uniqueBy(
    entries
      .filter((entry) => entry.listing.memory > 0)
      .map((entry) => ({
        value: String(entry.listing.memory),
        label: formatMemory(entry.listing.memory),
        sort: entry.listing.memory,
      })),
  );

  const caseSizes = uniqueBy(
    entries
      .filter((entry) => entry.listing.caseSize)
      .map((entry) => ({
        value: String(entry.listing.caseSize),
        label: formatCaseSize(entry.listing.caseSize as number),
        sort: entry.listing.caseSize,
      })),
  );

  const colors = uniqueBy(
    entries.map((entry) => ({
      value: entry.listing.color,
      label: colorRu(entry.listing.color) ?? entry.listing.color,
    })),
  );

  const configurations = uniqueBy(
    entries
      .filter((entry) => entry.listing.configuration)
      .map((entry) => ({
        value: entry.listing.configuration as string,
        label: configurationRu(entry.listing.configuration as string),
      })),
  );

  const sims = uniqueBy(
    entries.flatMap((entry) =>
      (entry.asVariant ? [entry.variant] : entry.listing.variants).map((variant) => ({
        value: variant.sim,
        label: variant.simLabel,
      }))),
  );

  // «Тип SIM» у часов означает сотовый модуль — подпись подстраивается.
  const simLabel = sims.some((option) => option.value.startsWith('gps')) ? 'Связь' : 'Тип SIM';

  const all: Facet[] = [
    { id: 'model', label: 'Модель', anyLabel: 'Все модели', options: models },
    { id: 'memory', label: 'Память', anyLabel: 'Любая', options: memories },
    { id: 'caseSize', label: 'Корпус', anyLabel: 'Любой', options: caseSizes },
    { id: 'color', label: 'Цвет', anyLabel: 'Любой', options: colors },
    { id: 'configuration', label: 'Ремешок', anyLabel: 'Любой', options: configurations },
    { id: 'sim', label: simLabel, anyLabel: 'Любой', options: sims },
  ];

  return all.filter((facet) => facet.options.length > 1);
}

function uniqueBy(
  items: { value: string; label: string; sort?: number }[],
): { value: string; label: string }[] {
  const seen = new Map<string, { value: string; label: string; sort?: number }>();
  for (const item of items) if (!seen.has(item.value)) seen.set(item.value, item);

  return [...seen.values()]
    .sort((a, b) => a.sort !== undefined && b.sort !== undefined ? a.sort - b.sort : 0)
    .map(({ value, label }) => ({ value, label }));
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

function countActive(filters: Filters): number {
  let count = Object.values(filters.facets).filter((value) => value !== 'all').length;
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
