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

/**
 * Способ связи устройства.
 *
 * Для телефонов это тип SIM, для Apple Watch — наличие сотового модуля:
 * поле одно и то же, поэтому фильтр «связь» работает в обеих категориях.
 */
export type SimType =
  | 'nano+esim'
  | 'dual-sim'
  | 'esim'
  | 'gps'
  | 'gps-cellular'
  | 'unknown';

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
  /** Адрес модели внутри категории: `iphone-17-pro-max`. */
  modelSlug: string;
  generation: string;
  memory: number;
  color: string;
  sim: SimType;
  /** Диаметр корпуса в миллиметрах — только у часов. */
  caseSize?: number;
  /** Комплектация: ремешок у часов, набор аксессуаров у остальных категорий. */
  configuration?: string;
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
  /** «49 мм», «46mm», 42 — приводится к числу нормализатором. */
  caseSize?: string | number;
  configuration?: string;
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
  /** Дублирует `model`; отдельное имя нужно группировке моделей. */
  modelName: string;
  /** Ключ модельной плашки: `iphone-17-pro-max`. */
  modelSlug: string;
  generation: string;
  memory: number;
  /** Публичное имя объёма памяти. Совпадает с `memory`. */
  storage: number;
  memoryLabel: string;
  color: string;
  colorHex: string;
  sim: SimType;
  /** Публичное имя типа связи. Совпадает с `sim`. */
  simType: SimType;
  simLabel: string;
  /** Диаметр корпуса в миллиметрах — только у часов. */
  caseSize?: number;
  caseSizeLabel?: string;
  /** Комплектация: ремешок у часов. */
  configuration?: string;
  category: CategoryId;
  /** Сегмент адреса категории: `iphone`, `apple-watch`. */
  categorySlug: string;
  title: string;
  images: string[];
  /** Основное изображение. Совпадает с `images[0]`. */
  image: string;
  price: number;
  oldPrice?: number;
  availability: Availability;
  city: string;
  updatedAt: string;
  /** Number of stock lines behind the entry — used only for internal metrics. */
  offerCount: number;
}

/**
 * Публичная позиция каталога: одна модель + память + цвет.
 *
 * Раньше каждый тип SIM был отдельной карточкой, и покупатель видел два
 * внешне одинаковых товара с одинаковым адресом (buildSlug не учитывает SIM).
 * Теперь варианты SIM собраны внутрь позиции, а выбор делается на странице
 * товара — там же меняются цена и наличие.
 */
export interface CatalogListing {
  id: string;
  slug: string;
  brand: string;
  model: string;
  modelName: string;
  modelSlug: string;
  generation: string;
  memory: number;
  storage: number;
  memoryLabel: string;
  color: string;
  colorHex: string;
  caseSize?: number;
  caseSizeLabel?: string;
  configuration?: string;
  category: CategoryId;
  categorySlug: string;
  title: string;
  images: string[];
  image: string;
  /** Варианты по типу SIM, от доступных и дешёвых к остальным. */
  variants: CatalogProduct[];
  /** Вариант, который показывается по умолчанию. */
  defaultVariantId: string;
  /** Минимальная цена среди доступных вариантов. */
  price: number;
  oldPrice?: number;
  /** Лучший статус среди вариантов. */
  availability: Availability;
  /** true, когда у позиции больше одного типа SIM. */
  hasSimChoice: boolean;
  city: string;
  updatedAt: string;
}

/**
 * Модельная плашка каталога: `iPhone 17 Pro Max` со всеми своими вариантами.
 *
 * Собирается из данных по `modelSlug`, а не описывается вручную, поэтому новая
 * модель в прайс-листе сама появляется в категории.
 */
export interface CatalogModelGroup {
  id: string;
  category: CategoryId;
  categorySlug: string;
  modelSlug: string;
  modelName: string;
  href: string;
  image: string;
  /** Минимальная цена среди доступных вариантов; null — если доступных нет. */
  price: number | null;
  /** Сколько позиций каталога стоит за плашкой. */
  listingCount: number;
  /** Сколько отдельных вариантов (память/цвет/SIM/размер) внутри. */
  variantCount: number;
  availability: Availability;
  /** Объёмы памяти или размеры корпуса — короткая подпись под названием. */
  optionSummary: string;
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
