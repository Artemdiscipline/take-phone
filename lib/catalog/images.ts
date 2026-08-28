import type { CategoryId } from './types';

/**
 * Official product photography stored in `public/assets`.
 *
 * Sources publish their own photos, but hotlinking them is unreliable and would
 * leak the origin. Offers are therefore matched to locally stored press images
 * by model + finish; anything unmatched falls back to a neutral placeholder.
 */
const PRODUCT_IMAGES: Record<string, string> = {
  'iphone 17 pro max|deep blue': '/assets/products/iphone-17-pro-max-deepblue.webp',
  'iphone 17 pro max|cosmic orange': '/assets/products/iphone-17-pro-max-cosmicorange.webp',
  'iphone 17 pro max|silver': '/assets/products/iphone-17-pro-max-silver.webp',
  'iphone 17 pro|deep blue': '/assets/products/iphone-17-pro-deepblue.webp',
  'iphone 17 pro|cosmic orange': '/assets/products/iphone-17-pro-cosmicorange.webp',
  'iphone 17 pro|silver': '/assets/products/iphone-17-pro-silver.webp',
  'iphone 17|lavender': '/assets/products/iphone-17-lavender.webp',
  'iphone 17|mist blue': '/assets/products/iphone-17-mistblue.webp',
  'iphone 17|sage': '/assets/products/iphone-17-sage.webp',
  'iphone 17|white': '/assets/products/iphone-17-white.webp',
  'iphone 17|black': '/assets/products/iphone-17-black.webp',
  'iphone air|sky blue': '/assets/products/iphone-air-skyblue.webp',
  'iphone air|cloud white': '/assets/products/iphone-air-cloudwhite.webp',
  'iphone air|light gold': '/assets/products/iphone-air-lightgold.webp',
  'iphone air|space black': '/assets/products/iphone-air-spaceblack.webp',
};

export const CATEGORY_IMAGES: Partial<Record<CategoryId, string>> = {
  iphone: '/assets/products/iphone-17-pro-max-deepblue.webp',
  mac: '/assets/categories/mac.webp',
  ipad: '/assets/categories/ipad.webp',
  watch: '/assets/categories/watch.webp',
  airpods: '/assets/categories/airpods.webp',
};

export const HERO_IMAGE = '/assets/hero/iphone-17-pro-lineup.webp';

export function resolveProductImage(model: string, color: string): string | null {
  return PRODUCT_IMAGES[`${model.toLowerCase()}|${color.toLowerCase()}`] ?? null;
}

/** All stored finishes for a model — powers the colour picker on the detail page. */
export function imagesForModel(model: string): string[] {
  const prefix = `${model.toLowerCase()}|`;
  return Object.entries(PRODUCT_IMAGES)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}
