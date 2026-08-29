import { resolveProductImage } from './images';
import {
  buildSlug,
  colorHex,
  colorRu,
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
  CatalogProduct,
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

    const product: CatalogProduct = {
      id: matchKey,
      slug: buildSlug({
        model: reference.model,
        memory: reference.memory,
        color: reference.color,
      }),
      matchKey,
      brand: reference.brand,
      model: reference.model,
      generation: reference.generation,
      memory: reference.memory,
      memoryLabel: formatMemory(reference.memory),
      color: reference.color,
      colorHex: colorHex(reference.color),
      sim: reference.sim,
      simLabel: SIM_LABELS[reference.sim],
      category: reference.category,
      title: `${reference.model} ${formatMemory(reference.memory)} ${reference.color}`,
      images: resolveImages(reference),
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

    if (colorLabel) product.title = `${reference.model} ${formatMemory(reference.memory)}, ${colorLabel}`;

    views.push({ product, offers: group, bestOffer, markup, markupRule: level });
  }

  return views.sort(compareProducts);
}

function resolveImages(offer: SourceOffer): string[] {
  const local = resolveProductImage(offer.model, offer.color);
  if (local) return [local];
  if (offer.images.length > 0) return offer.images;
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

const GENERATION_ORDER = ['Pro Max', 'Pro', 'Air', '17', '16'];

function compareProducts(a: StaffProductView, b: StaffProductView): number {
  const availabilityRank = (view: StaffProductView) =>
    view.product.availability === 'in_stock' ? 0 : view.product.availability === 'to_order' ? 1 : 2;

  const byAvailability = availabilityRank(a) - availabilityRank(b);
  if (byAvailability !== 0) return byAvailability;

  const rank = (value: string) => {
    const index = GENERATION_ORDER.indexOf(value);
    return index === -1 ? GENERATION_ORDER.length : index;
  };

  const byGeneration = rank(a.product.generation) - rank(b.product.generation);
  if (byGeneration !== 0) return byGeneration;

  return a.product.price - b.product.price;
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
      generation: reference.generation,
      memory: reference.memory,
      memoryLabel: reference.memoryLabel,
      color: reference.color,
      colorHex: reference.colorHex,
      category: reference.category,
      title: reference.title,
      images: reference.images,
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

  return listings.sort(compareListings);
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

function compareListings(a: CatalogListing, b: CatalogListing): number {
  const rank = (listing: CatalogListing) =>
    listing.availability === 'in_stock' ? 0 : listing.availability === 'to_order' ? 1 : 2;

  const byAvailability = rank(a) - rank(b);
  if (byAvailability !== 0) return byAvailability;

  const generationRank = (value: string) => {
    const index = GENERATION_ORDER.indexOf(value);
    return index === -1 ? GENERATION_ORDER.length : index;
  };

  const byGeneration = generationRank(a.generation) - generationRank(b.generation);
  if (byGeneration !== 0) return byGeneration;

  return a.price - b.price;
}
