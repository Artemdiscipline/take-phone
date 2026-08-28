import { terms } from '@/lib/site';
import type {
  Availability,
  MarkupRuleLevel,
  MarkupRules,
  SourceOffer,
} from './types';

/** Fallback markup when no specific rule matches. */
export const DEFAULT_GLOBAL_MARKUP = 5_000;

export const defaultMarkupRules: MarkupRules = {
  global: DEFAULT_GLOBAL_MARKUP,
  byCategory: {},
  byModel: {},
  byProduct: {},
};

export function modelKey(brand: string, model: string): string {
  return `${brand} ${model}`.toLowerCase().trim();
}

/**
 * Markup priority: product → model → category → global.
 * Returns both the value and the level so the staff panel can show which rule
 * actually applied.
 */
export function resolveMarkup(
  rules: MarkupRules,
  target: { matchKey: string; brand: string; model: string; category: SourceOffer['category'] },
): { markup: number; level: MarkupRuleLevel } {
  const product = rules.byProduct[target.matchKey];
  if (product !== undefined) return { markup: product, level: 'product' };

  const model = rules.byModel[modelKey(target.brand, target.model)];
  if (model !== undefined) return { markup: model, level: 'model' };

  const category = rules.byCategory[target.category];
  if (category !== undefined) return { markup: category, level: 'category' };

  return { markup: rules.global, level: 'global' };
}

/**
 * Picks the offer the shop would actually buy from: the cheapest in-stock line,
 * falling back to the cheapest to-order line when nothing is on the shelf.
 */
export function pickBestOffer(offers: SourceOffer[]): SourceOffer | null {
  const byPrice = (a: SourceOffer, b: SourceOffer) => a.purchasePrice - b.purchasePrice;

  const inStock = offers.filter((offer) => offer.availability === 'in_stock');
  if (inStock.length > 0) return [...inStock].sort(byPrice)[0];

  const toOrder = offers.filter((offer) => offer.availability === 'to_order');
  if (toOrder.length > 0) return [...toOrder].sort(byPrice)[0];

  return null;
}

/** Aggregated availability across all offers for one product. */
export function resolveAvailability(offers: SourceOffer[]): Availability {
  if (offers.some((offer) => offer.availability === 'in_stock')) return 'in_stock';
  if (offers.some((offer) => offer.availability === 'to_order')) return 'to_order';
  return 'out_of_stock';
}

/**
 * Public price = cheapest available purchase price + applied markup.
 * To-order devices carry a fixed discount, which is what the buyer sees.
 */
export function computePublicPrice(
  purchasePrice: number,
  markup: number,
  availability: Availability,
  options: { preorderDiscountEnabled?: boolean } = {},
): number {
  const { preorderDiscountEnabled = true } = options;
  const base = purchasePrice + markup;

  if (availability === 'to_order' && preorderDiscountEnabled) {
    return Math.max(0, base - terms.preorderDiscount);
  }

  return base;
}

/** Card payments carry a processing surcharge. */
export function applyCardFee(total: number): number {
  return Math.round(total * (1 + terms.cardFeeRate));
}

export function cardFeeAmount(total: number): number {
  return applyCardFee(total) - total;
}
