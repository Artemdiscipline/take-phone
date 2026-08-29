import { CATEGORY_ORDER, categorySlug as toCategorySlug, modelHref } from './categories';
import { CATEGORY_IMAGES, resolveModelImage, resolveProductImage } from './images';
import {
  buildModelSlug,
  buildSlug,
  colorHex,
  colorRu,
  configurationRu,
  formatCaseSize,
  formatMemory,
  SIM_LABELS,
} from './normalize';
import {
  computePublicPrice,
  pickBestOffer,
  resolveAvailability,
  resolveMarkup,
} from './pricing';
import type {
  Availability,
  CatalogListing,
  CatalogModelGroup,
  CatalogProduct,
  CategoryId,
  MarkupRules,
  SourceOffer,
  StaffProductView,
} from './types';

const PLACEHOLDER_IMAGE = '/assets/products/placeholder.svg';

/**
 * Collapses raw source offers into the public catalogue.
 *
 * One public product = one `matchKey` (brand + model + memory + colour + SIM).
 * Individual offers are preserved so the staff panel can still show where the
 * device would be bought.
 */
export function aggregateOffers(
  offers: SourceOffer[],
  rules: MarkupRules,
  options: { preorderDiscountEnabled?: boolean } = {},
): StaffProductView[] {
  const groups = new Map<string, SourceOffer[]>();

  for (const offer of offers) {
    const group = groups.get(offer.matchKey);
    if (group) group.push(offer);
    else groups.set(offer.matchKey, [offer]);
  }

  const views: StaffProductView[] = [];

  for (const [matchKey, group] of groups) {
    const reference = group[0];
    const bestOffer = pickBestOffer(group);
    const availability = resolveAvailability(group);
    const { markup, level } = resolveMarkup(rules, {
      matchKey,
      brand: reference.brand,
      model: reference.model,
      category: reference.category,
    });

    // Without an available offer there is no purchase price to build on, so the
    // product is listed as out of stock at its last known price level.
    const purchasePrice = bestOffer?.purchasePrice
      ?? Math.min(...group.map((offer) => offer.purchasePrice));

    const price = computePublicPrice(purchasePrice, markup, availability, options);
    const oldPrice = pickOldPrice(group, price);
    const colorLabel = colorRu(reference.color);

    const images = resolveImages(reference);
    const modelSlug = reference.modelSlug || buildModelSlug(reference.model);

    const product: CatalogProduct = {
      id: matchKey,
      slug: buildSlug({
        model: reference.model,
        memory: reference.memory,
        color: reference.color,
        caseSize: reference.caseSize,
        configuration: reference.configuration,
      }),
      matchKey,
      brand: reference.brand,
      model: reference.model,
      modelName: reference.model,
      modelSlug,
      generation: reference.generation,
      memory: reference.memory,
      storage: reference.memory,
      memoryLabel: formatMemory(reference.memory),
      color: reference.color,
      colorHex: colorHex(reference.color),
      sim: reference.sim,
      simType: reference.sim,
      simLabel: SIM_LABELS[reference.sim],
      caseSize: reference.caseSize,
      caseSizeLabel: reference.caseSize ? formatCaseSize(reference.caseSize) : undefined,
      configuration: reference.configuration,
      category: reference.category,
      categorySlug: toCategorySlug(reference.category),
      title: buildTitle(reference, colorLabel),
      images,
      image: images[0],
      price,
      oldPrice,
      availability,
      city: reference.city,
      updatedAt: group
        .map((offer) => offer.updatedAt)
        .sort()
        .at(-1) ?? reference.updatedAt,
      offerCount: group.length,
    };

    views.push({ product, offers: group, bestOffer, markup, markupRule: level });
  }

  return views.sort(makeComparator(views, (view) => ({
    availability: view.product.availability,
    category: view.product.category,
    model: view.product.model,
    generation: view.product.generation,
    price: view.product.price,
  })));
}

/**
 * Название позиции.
 *
 * У телефона это модель, объём и цвет; у часов — модель, размер корпуса,
 * цвет и ремешок. Русское название цвета используется, когда оно известно.
 */
function buildTitle(offer: SourceOffer, colorLabel: string | undefined): string {
  const color = colorLabel ?? offer.color;

  if (offer.category === 'watch') {
    const parts = [offer.model, formatCaseSize(offer.caseSize ?? 0), color];
    if (offer.configuration) parts.push(configurationRu(offer.configuration));
    return `${parts[0]} ${parts[1]}, ${parts.slice(2).join(', ')}`;
  }

  if (offer.category === 'mac') {
    return [offer.model, formatMemory(offer.memory), offer.configuration, color]
      .filter(Boolean)
      .join(', ');
  }

  return `${offer.model} ${formatMemory(offer.memory)}, ${color}`;
}

function resolveImages(offer: SourceOffer): string[] {
  const local = resolveProductImage(offer.model, offer.color);
  if (local) return [local];
  if (offer.images.length > 0) return offer.images;
  const categoryImage = CATEGORY_IMAGES[offer.category];
  if (categoryImage) return [categoryImage];
  return [PLACEHOLDER_IMAGE];
}

/**
 * Shows a strike-through price only when a source publishes a higher retail
 * reference than the Take Phone price — never an invented "discount".
 */
function pickOldPrice(offers: SourceOffer[], price: number): number | undefined {
  const references = offers
    .map((offer) => offer.oldPrice)
    .filter((value): value is number => typeof value === 'number' && value > price);

  if (references.length === 0) return undefined;
  return Math.max(...references);
}

/**
 * Порядок линеек внутри категории.
 *
 * Список описывает не конкретные модели, а именно линейки, поэтому новая
 * модель («iPhone 18 Pro») занимает место сама, без правки кода. Незнакомая
 * линейка уходит в конец своей серии.
 */
const CATEGORY_TIERS: Partial<Record<CategoryId, { order: string[]; tierFirst: boolean }>> = {
  // У телефонов главное — номер серии: 17 Pro идёт выше, чем 16 Pro Max.
  iphone: { order: ['Pro Max', 'Pro', 'Air', 'Plus', '', 'e'], tierFirst: false },
  // У часов наоборот: Ultra остаётся флагманом независимо от номера Series.
  watch: { order: ['Ultra', 'Series', 'SE'], tierFirst: true },
};

interface ModelRank {
  /** Номер серии: 17 у «iPhone 17 Pro», 11 у «Apple Watch Series 11». */
  series: number;
  /** Позиция линейки в `CATEGORY_TIERS`. */
  tier: number;
}

function rankModel(category: CategoryId, model: string, generation: string): ModelRank {
  const config = CATEGORY_TIERS[category];
  const numbers = model.match(/\d+/g);

  return {
    // Модель без номера («iPhone Air») считается частью текущей серии:
    // Infinity поднял бы её выше флагмана, ноль — уронил бы в самый низ.
    series: numbers ? Number.parseInt(numbers.at(-1) as string, 10) : Number.NaN,
    tier: config ? indexOrLast(config.order, generation) : 0,
  };
}

function indexOrLast(order: string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

/**
 * Сравнение моделей внутри одной категории: сначала более новые и старшие.
 * `fallbackSeries` подставляется моделям без номера в названии.
 */
function compareModels(
  category: CategoryId,
  a: { model: string; generation: string },
  b: { model: string; generation: string },
  fallbackSeries: number,
): number {
  const config = CATEGORY_TIERS[category];
  const left = rankModel(category, a.model, a.generation);
  const right = rankModel(category, b.model, b.generation);

  const seriesOf = (rank: ModelRank) => Number.isNaN(rank.series) ? fallbackSeries : rank.series;
  const bySeries = seriesOf(right) - seriesOf(left);
  const byTier = left.tier - right.tier;

  if (config?.tierFirst) return byTier !== 0 ? byTier : bySeries;
  return bySeries !== 0 ? bySeries : byTier;
}

/** Самый большой номер серии в наборе — им «догоняются» модели без номера. */
function maxSeries(category: CategoryId, models: { model: string; generation: string }[]): number {
  const numbers = models
    .map((item) => rankModel(category, item.model, item.generation).series)
    .filter((value) => !Number.isNaN(value));

  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

/**
 * Порядок карточек: сначала доступные, затем — более новые и старшие модели,
 * внутри модели — дешевле вперёд. Порядок моделей считается по данным
 * (см. `compareModels`), а не по списку конкретных названий.
 */
function makeComparator<T>(
  items: T[],
  pick: (item: T) => {
    availability: Availability;
    category: CategoryId;
    model: string;
    generation: string;
    price: number;
  },
): (a: T, b: T) => number {
  const described = items.map(pick);
  const fallback = maxSeries(described[0]?.category ?? 'iphone', described);

  return (a, b) => {
    const left = pick(a);
    const right = pick(b);

    const rank = (value: Availability) =>
      value === 'in_stock' ? 0 : value === 'to_order' ? 1 : 2;

    const byAvailability = rank(left.availability) - rank(right.availability);
    if (byAvailability !== 0) return byAvailability;

    if (left.category !== right.category) {
      return CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category);
    }

    const byModel = compareModels(left.category, left, right, fallback);
    if (byModel !== 0) return byModel;

    return left.price - right.price;
  };
}

/** Everything the browser is allowed to see. */
export function toPublicProducts(views: StaffProductView[]): CatalogProduct[] {
  return views.map((view) => view.product);
}

/**
 * Собирает публичные позиции каталога из вариантов.
 *
 * Ключ позиции — slug (модель + память + цвет). Варианты внутри различаются
 * типом SIM: именно из-за них в каталоге раньше появлялись пары одинаковых
 * на вид карточек с общим адресом.
 */
export function buildListings(views: StaffProductView[]): CatalogListing[] {
  const groups = new Map<string, CatalogProduct[]>();

  for (const view of views) {
    const group = groups.get(view.product.slug);
    if (group) group.push(view.product);
    else groups.set(view.product.slug, [view.product]);
  }

  const listings: CatalogListing[] = [];

  for (const [slug, group] of groups) {
    const variants = [...group].sort(compareVariants);
    const reference = variants[0];
    const available = variants.filter((variant) => variant.availability !== 'out_of_stock');
    const priced = available.length > 0 ? available : variants;

    listings.push({
      id: slug,
      slug,
      brand: reference.brand,
      model: reference.model,
      modelName: reference.modelName,
      modelSlug: reference.modelSlug,
      generation: reference.generation,
      memory: reference.memory,
      storage: reference.storage,
      memoryLabel: reference.memoryLabel,
      color: reference.color,
      colorHex: reference.colorHex,
      caseSize: reference.caseSize,
      caseSizeLabel: reference.caseSizeLabel,
      configuration: reference.configuration,
      category: reference.category,
      categorySlug: reference.categorySlug,
      title: reference.title,
      images: reference.images,
      image: reference.image,
      variants,
      defaultVariantId: reference.id,
      price: Math.min(...priced.map((variant) => variant.price)),
      oldPrice: pickListingOldPrice(priced),
      availability: bestAvailability(variants),
      hasSimChoice: variants.length > 1,
      city: reference.city,
      updatedAt: variants.map((variant) => variant.updatedAt).sort().at(-1) ?? reference.updatedAt,
    });
  }

  return listings.sort(makeComparator(listings, (listing) => ({
    availability: listing.availability,
    category: listing.category,
    model: listing.model,
    generation: listing.generation,
    price: listing.price,
  })));
}

/** Доступные и более дешёвые варианты идут первыми — такой и показывается. */
function compareVariants(a: CatalogProduct, b: CatalogProduct): number {
  const rank = (product: CatalogProduct) =>
    product.availability === 'in_stock' ? 0 : product.availability === 'to_order' ? 1 : 2;

  const byAvailability = rank(a) - rank(b);
  if (byAvailability !== 0) return byAvailability;

  return a.price - b.price;
}

function bestAvailability(variants: CatalogProduct[]): Availability {
  if (variants.some((variant) => variant.availability === 'in_stock')) return 'in_stock';
  if (variants.some((variant) => variant.availability === 'to_order')) return 'to_order';
  return 'out_of_stock';
}

function pickListingOldPrice(variants: CatalogProduct[]): number | undefined {
  const cheapest = variants.reduce((best, variant) => variant.price < best.price ? variant : best);
  return cheapest.oldPrice;
}

/**
 * Собирает модельные плашки категории.
 *
 * Группировка идёт по `modelSlug`, то есть по данным: как только в прайс-листе
 * появляется новая модель, в категории появляется новая плашка — ничего
 * дописывать в коде не нужно.
 */
export function buildModelGroups(listings: CatalogListing[]): CatalogModelGroup[] {
  const groups = new Map<string, CatalogListing[]>();

  for (const listing of listings) {
    const key = `${listing.categorySlug}/${listing.modelSlug}`;
    const group = groups.get(key);
    if (group) group.push(listing);
    else groups.set(key, [listing]);
  }

  const result: CatalogModelGroup[] = [];

  for (const [key, group] of groups) {
    const reference = pickGroupReference(group);
    const available = group.filter((listing) => listing.availability !== 'out_of_stock');

    result.push({
      id: key,
      category: reference.category,
      categorySlug: reference.categorySlug,
      modelSlug: reference.modelSlug,
      modelName: reference.modelName,
      href: modelHref(reference.category, reference.modelSlug),
      image: reference.images[0] ?? resolveModelImage(reference.model) ?? PLACEHOLDER_IMAGE,
      // «от … ₽» считается по самому дешёвому доступному варианту; если
      // доступных нет, цену не показываем вовсе — она была бы недостижимой.
      price: available.length > 0 ? Math.min(...available.map((listing) => listing.price)) : null,
      listingCount: group.length,
      variantCount: group.reduce((sum, listing) => sum + listing.variants.length, 0),
      availability: bestAvailability(group.flatMap((listing) => listing.variants)),
      optionSummary: buildOptionSummary(group),
    });
  }

  const generations = new Map(listings.map((listing) => [listing.modelSlug, listing.generation]));
  const named = (group: CatalogModelGroup) => ({
    model: group.modelName,
    generation: generations.get(group.modelSlug) ?? '',
  });

  const fallback = maxSeries(result[0]?.category ?? 'iphone', result.map(named));

  return result.sort((a, b) => {
    if (a.category !== b.category) {
      return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    }

    return compareModels(a.category, named(a), named(b), fallback);
  });
}

/**
 * Картинку плашке даёт доступный и самый дешёвый вариант: покупатель видит
 * то, что действительно можно забрать сегодня.
 */
function pickGroupReference(group: CatalogListing[]): CatalogListing {
  const ranked = [...group].sort((a, b) => {
    const rank = (listing: CatalogListing) =>
      listing.availability === 'in_stock' ? 0 : listing.availability === 'to_order' ? 1 : 2;

    const byAvailability = rank(a) - rank(b);
    return byAvailability !== 0 ? byAvailability : a.price - b.price;
  });

  return ranked[0];
}

/** Короткая подпись плашки: объёмы памяти или размеры корпуса. */
function buildOptionSummary(group: CatalogListing[]): string {
  const sizes = [...new Set(group.map((listing) => listing.caseSize).filter(Boolean))]
    .sort((a, b) => (a as number) - (b as number));

  if (sizes.length > 0) return sizes.map((size) => formatCaseSize(size as number)).join(' · ');

  const memories = [...new Set(group.map((listing) => listing.memory).filter(Boolean))]
    .sort((a, b) => a - b);

  const summary = memories.map((memory) => formatMemory(memory)).join(' · ');
  return group[0]?.category === 'mac' && summary ? `SSD ${summary}` : summary;
}
