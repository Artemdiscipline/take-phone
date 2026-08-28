/** Identifiers of the wholesale sources. Never exposed to the public site. */
export type SourceId = 'first-apple' | 'ice-apple' | 'phone24';

export type Availability = 'in_stock' | 'to_order' | 'out_of_stock';

export type CategoryId =
  | 'iphone'
  | 'mac'
  | 'ipad'
  | 'watch'
  | 'airpods'
  | 'samsung'
  | 'gaming'
  | 'electronics';

export type SimType = 'nano+esim' | 'dual-sim' | 'esim' | 'unknown';

/**
 * A single offer as published by one source, after normalisation.
 * `purchasePrice` is wholesale data and must stay on the server.
 */
export interface SourceOffer {
  /** Stable id: `${source}:${externalId}`. */
  id: string;
  externalId: string;
  source: SourceId;
  brand: string;
  model: string;
  generation: string;
  memory: number;
  color: string;
  sim: SimType;
  category: CategoryId;
  images: string[];
  purchasePrice: number;
  /** Reference retail price at the source, when published. */
  oldPrice?: number;
  availability: Availability;
  city: string;
  sourceUrl: string;
  updatedAt: string;
  /** Deduplication key — see `buildMatchKey`. */
  matchKey: string;
}

/** Raw payload shape an adapter receives before normalisation. */
export interface RawOffer {
  externalId: string;
  title: string;
  memory?: string | number;
  color?: string;
  sim?: string;
  price: number | string;
  oldPrice?: number | string;
  availability?: string | boolean;
  image?: string;
  images?: string[];
  url?: string;
  city?: string;
  updatedAt?: string;
}

/** Public catalogue entry. Contains no wholesale or source information. */
export interface CatalogProduct {
  id: string;
  slug: string;
  matchKey: string;
  brand: string;
  model: string;
  generation: string;
  memory: number;
  memoryLabel: string;
  color: string;
  colorHex: string;
  sim: SimType;
  simLabel: string;
  category: CategoryId;
  title: string;
  images: string[];
  price: number;
  oldPrice?: number;
  availability: Availability;
  city: string;
  updatedAt: string;
  /** Number of stock lines behind the entry — used only for internal metrics. */
  offerCount: number;
}

/** Everything the staff panel needs about one public product. */
export interface StaffProductView {
  product: CatalogProduct;
  offers: SourceOffer[];
  bestOffer: SourceOffer | null;
  markup: number;
  markupRule: MarkupRuleLevel;
}

export type MarkupRuleLevel = 'product' | 'model' | 'category' | 'global';

export interface MarkupRules {
  global: number;
  byCategory: Partial<Record<CategoryId, number>>;
  /** Keyed by `${brand} ${model}` in lowercase. */
  byModel: Record<string, number>;
  /** Keyed by product `matchKey`. */
  byProduct: Record<string, number>;
}

export interface SyncSourceResult {
  source: SourceId;
  ok: boolean;
  offers: number;
  durationMs: number;
  error?: string;
  mode: 'fixtures' | 'live';
}

export interface SyncRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  totalOffers: number;
  totalProducts: number;
  results: SyncSourceResult[];
}

export interface CatalogFilters {
  category?: CategoryId;
  query?: string;
  generation?: string;
  memory?: number;
  color?: string;
  onlyAvailable?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'popular';
}
