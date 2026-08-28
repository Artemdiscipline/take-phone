import { aggregateOffers, toPublicProducts } from '@/lib/catalog/aggregate';
import type {
  CatalogFilters,
  CatalogProduct,
  StaffProductView,
  SyncRun,
} from '@/lib/catalog/types';
import { env } from '@/lib/env';
import { getRepository } from '@/lib/repositories';
import { createSourceAdapters } from '@/lib/sources/registry';

/** How long aggregated offers are considered fresh before a re-sync. */
const FRESHNESS_MS = 5 * 60_000;

export interface PublicCatalog {
  products: CatalogProduct[];
  /** Newest offer timestamp across the catalogue. */
  updatedAt: string | null;
}

/**
 * Makes sure the store holds offers, running a synchronisation when the data is
 * missing or stale. Errors from individual sources never empty the catalogue —
 * the previous offers of a failing source are kept.
 */
async function ensureOffers(): Promise<void> {
  const repository = getRepository();
  const [lastRun] = await repository.listSyncRuns(1);

  if (lastRun) {
    const age = Date.now() - new Date(lastRun.finishedAt).getTime();
    if (age < FRESHNESS_MS) return;
  }

  await runSync();
}

/**
 * Runs every source adapter and stores the result.
 *
 * In `fixtures` mode this reads the bundled demo dataset; in `live` mode it
 * reads the configured price-list endpoints. Sources that fail are reported and
 * keep their previously stored offers.
 */
export async function runSync(): Promise<SyncRun> {
  const repository = getRepository();
  const adapters = createSourceAdapters();
  const startedAt = new Date().toISOString();

  await Promise.all(adapters.map(async (adapter) => {
    try {
      const offers = await adapter.fetchProducts();
      await repository.replaceOffers(adapter.id, offers);
    } catch {
      // Status is captured by the adapter; previous offers stay in place.
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
  const repository = getRepository();
  const [offers, rules] = await Promise.all([
    repository.listOffers(),
    repository.getMarkupRules(),
  ]);

  return aggregateOffers(offers, rules);
}

/** Public catalogue. Contains no source or wholesale information. */
export async function getPublicCatalog(): Promise<PublicCatalog> {
  const views = await loadViews();
  const products = toPublicProducts(views);

  return {
    products,
    updatedAt: products.map((product) => product.updatedAt).sort().at(-1) ?? null,
  };
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const { products } = await getPublicCatalog();
  return products.find((product) => product.slug === slug) ?? null;
}

/** Other finishes and capacities of the same model. */
export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> {
  const { products } = await getPublicCatalog();

  const sameModel = products.filter(
    (candidate) => candidate.model === product.model && candidate.id !== product.id,
  );
  const otherModels = products.filter(
    (candidate) => candidate.model !== product.model && candidate.availability === 'in_stock',
  );

  return [...sameModel, ...otherModels].slice(0, limit);
}

/** Every stored finish of a model, used by the colour picker. */
export async function getModelVariants(product: CatalogProduct): Promise<CatalogProduct[]> {
  const { products } = await getPublicCatalog();
  return products.filter((candidate) => candidate.model === product.model);
}

export interface StaffOverview {
  mode: 'fixtures' | 'live';
  views: StaffProductView[];
  runs: SyncRun[];
  rules: Awaited<ReturnType<ReturnType<typeof getRepository>['getMarkupRules']>>;
  orders: Awaited<ReturnType<ReturnType<typeof getRepository>['listOrders']>>;
}

/** Full internal picture — only ever rendered behind the staff session check. */
export async function getStaffOverview(): Promise<StaffOverview> {
  const views = await loadViews();
  const repository = getRepository();
  const [runs, rules, orders] = await Promise.all([
    repository.listSyncRuns(5),
    repository.getMarkupRules(),
    repository.listOrders(20),
  ]);

  return { mode: env.catalogMode, views, runs, rules, orders };
}

/** Server-side filtering, mirrored by the client for instant interaction. */
export function filterProducts(
  products: CatalogProduct[],
  filters: CatalogFilters,
): CatalogProduct[] {
  const query = filters.query?.trim().toLowerCase() ?? '';

  const filtered = products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.generation && product.generation !== filters.generation) return false;
    if (filters.memory && product.memory !== filters.memory) return false;
    if (filters.color && product.color !== filters.color) return false;
    if (filters.onlyAvailable && product.availability !== 'in_stock') return false;

    if (query) {
      const haystack = `${product.title} ${product.model} ${product.memoryLabel} ${product.color}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  if (filters.sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
  return filtered;
}
