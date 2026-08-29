import { aggregateOffers, buildListings, buildModelGroups } from '@/lib/catalog/aggregate';
import { categoryIdBySlug, categorySlug as toCategorySlug } from '@/lib/catalog/categories';
import type {
  CatalogFilters,
  CatalogListing,
  CatalogModelGroup,
  CategoryId,
  StaffProductView,
  SyncRun,
} from '@/lib/catalog/types';
import { env } from '@/lib/env';
import { getRepository, getRepositoryKind } from '@/lib/repositories';
import type { RepositoryKind } from '@/lib/repositories';
import { createSourceAdapters } from '@/lib/sources/registry';

/** Как долго собранные предложения считаются свежими до повторной синхронизации. */
const FRESHNESS_MS = 5 * 60_000;

export interface PublicCatalog {
  listings: CatalogListing[];
  /** Самая поздняя отметка обновления по каталогу. */
  updatedAt: string | null;
  /** true, пока каталог собран из демонстрационного набора. */
  demoData: boolean;
}

/**
 * Гарантирует, что в хранилище есть предложения: запускает синхронизацию, если
 * данных нет или они устарели. Ошибка отдельного источника не очищает каталог —
 * его прошлые предложения остаются на месте.
 */
async function ensureOffers(): Promise<void> {
  const repository = await getRepository();
  const [lastRun] = await repository.listSyncRuns(1);

  if (lastRun) {
    const age = Date.now() - new Date(lastRun.finishedAt).getTime();
    if (age < FRESHNESS_MS) return;
  }

  await runSync();
}

/**
 * Прогоняет все адаптеры источников и сохраняет результат.
 *
 * В режиме `fixtures` читается демонстрационный набор, в `live` — настроенные
 * прайс-листы. Упавший источник попадает в журнал и сохраняет прошлые данные.
 */
export async function runSync(): Promise<SyncRun> {
  const repository = await getRepository();
  const adapters = createSourceAdapters();
  const startedAt = new Date().toISOString();

  await Promise.all(adapters.map(async (adapter) => {
    try {
      const offers = await adapter.fetchProducts();
      await repository.replaceOffers(adapter.id, offers);
    } catch {
      // Статус уже записан адаптером; прошлые предложения не трогаем.
    }
  }));

  const offers = await repository.listOffers();
  const rules = await repository.getMarkupRules();
  const views = aggregateOffers(offers, rules);

  const run: SyncRun = {
    id: `sync-${Date.now().toString(36)}`,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalOffers: offers.length,
    totalProducts: views.length,
    results: adapters.map((adapter) => adapter.getLastSyncStatus() ?? {
      source: adapter.id,
      ok: false,
      offers: 0,
      durationMs: 0,
      error: 'Синхронизация не запускалась',
      mode: adapter.mode,
    }),
  };

  await repository.recordSyncRun(run);
  return run;
}

async function loadViews(): Promise<StaffProductView[]> {
  await ensureOffers();

  const repository = await getRepository();
  const [offers, rules] = await Promise.all([
    repository.listOffers(),
    repository.getMarkupRules(),
  ]);

  return aggregateOffers(offers, rules);
}

/** Публичный каталог. Никаких поставщиков и закупочных цен. */
export async function getPublicCatalog(): Promise<PublicCatalog> {
  const views = await loadViews();
  const listings = buildListings(views);

  return {
    listings,
    updatedAt: listings.map((listing) => listing.updatedAt).sort().at(-1) ?? null,
    demoData: env.catalogMode === 'fixtures',
  };
}

/** Категории, в которых сейчас есть хотя бы одна позиция. */
export async function getPopulatedCategories(): Promise<CategoryId[]> {
  const { listings } = await getPublicCatalog();
  return [...new Set(listings.map((listing) => listing.category))];
}

export interface CategoryCatalog {
  category: CategoryId;
  categorySlug: string;
  /** Модельные плашки категории — первое, что видит покупатель. */
  models: CatalogModelGroup[];
  /** Все позиции категории — список под плашками. */
  listings: CatalogListing[];
  demoData: boolean;
}

/**
 * Каталог одной категории.
 *
 * Плашки не описаны вручную: они собираются из `modelSlug` тех позиций, что
 * реально пришли из прайс-листов, поэтому новая модель появляется сама.
 */
export async function getCategoryCatalog(slug: string): Promise<CategoryCatalog | null> {
  const category = categoryIdBySlug(slug);
  if (!category) return null;

  const { listings, demoData } = await getPublicCatalog();
  const scoped = listings.filter((listing) => listing.category === category);

  return {
    category,
    categorySlug: toCategorySlug(category),
    models: buildModelGroups(scoped),
    listings: scoped,
    demoData,
  };
}

export interface ModelCatalog {
  category: CategoryId;
  categorySlug: string;
  model: CatalogModelGroup;
  /** Позиции только этой модели. */
  listings: CatalogListing[];
  demoData: boolean;
}

/** Каталог одной модели: `/catalog/iphone/iphone-17-pro-max`. */
export async function getModelCatalog(
  categorySlugValue: string,
  modelSlug: string,
): Promise<ModelCatalog | null> {
  const category = await getCategoryCatalog(categorySlugValue);
  if (!category) return null;

  const model = category.models.find((group) => group.modelSlug === modelSlug);
  if (!model) return null;

  return {
    category: category.category,
    categorySlug: category.categorySlug,
    model,
    listings: category.listings.filter((listing) => listing.modelSlug === modelSlug),
    demoData: category.demoData,
  };
}

/** Параметры для предгенерации страниц моделей — их же требует статический экспорт. */
export async function getModelRouteParams(): Promise<{ category: string; model: string }[]> {
  const { listings } = await getPublicCatalog();

  return buildModelGroups(listings).map((group) => ({
    category: group.categorySlug,
    model: group.modelSlug,
  }));
}

export async function getListingBySlug(slug: string): Promise<CatalogListing | null> {
  const { listings } = await getPublicCatalog();
  return listings.find((listing) => listing.slug === slug) ?? null;
}

/** Другие цвета и объёмы той же модели. */
export async function getRelatedListings(
  listing: CatalogListing,
  limit = 4,
): Promise<CatalogListing[]> {
  const { listings } = await getPublicCatalog();

  const sameModel = listings.filter(
    (candidate) => candidate.model === listing.model && candidate.slug !== listing.slug,
  );
  const otherModels = listings.filter(
    (candidate) => candidate.model !== listing.model
      // Похожее должно оставаться в той же категории: к часам не предлагаем телефон.
      && candidate.category === listing.category
      && candidate.availability === 'in_stock',
  );

  return [...sameModel, ...otherModels].slice(0, limit);
}

/** Все позиции той же модели — для переключателей памяти и цвета. */
export async function getModelListings(listing: CatalogListing): Promise<CatalogListing[]> {
  const { listings } = await getPublicCatalog();
  return listings.filter((candidate) => candidate.model === listing.model);
}

export interface StaffOverview {
  mode: 'fixtures' | 'live';
  storage: RepositoryKind;
  views: StaffProductView[];
  runs: SyncRun[];
  rules: Awaited<ReturnType<Awaited<ReturnType<typeof getRepository>>['getMarkupRules']>>;
  orders: Awaited<ReturnType<Awaited<ReturnType<typeof getRepository>>['listOrders']>>;
}

/** Полный внутренний срез — рендерится только за проверкой сессии сотрудника. */
export async function getStaffOverview(): Promise<StaffOverview> {
  const views = await loadViews();
  const repository = await getRepository();

  const [runs, rules, orders, storage] = await Promise.all([
    repository.listSyncRuns(5),
    repository.getMarkupRules(),
    repository.listOrders(100),
    getRepositoryKind(),
  ]);

  return { mode: env.catalogMode, storage, views, runs, rules, orders };
}

/** Фильтрация на сервере; клиент повторяет её для мгновенной реакции. */
export function filterListings(
  listings: CatalogListing[],
  filters: CatalogFilters,
): CatalogListing[] {
  const query = filters.query?.trim().toLowerCase() ?? '';

  const filtered = listings.filter((listing) => {
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.generation && listing.generation !== filters.generation) return false;
    if (filters.memory && listing.memory !== filters.memory) return false;
    if (filters.color && listing.color !== filters.color) return false;
    if (filters.onlyAvailable && listing.availability !== 'in_stock') return false;

    if (query) {
      const haystack = `${listing.title} ${listing.model} ${listing.memoryLabel} ${listing.color}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  if (filters.sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
  return filtered;
}
