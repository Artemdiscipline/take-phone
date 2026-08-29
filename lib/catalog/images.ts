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

  /*
    Прошлые поколения и iPhone 17e: аккуратные векторные иллюстрации.
    Официальных снимков этих моделей в проекте нет, поэтому они нарисованы —
    выдавать рисунок за фотографию нельзя. Позиции помечены как
    демонстрационные вместе со всем демо-набором.
  */
  'iphone 16 pro max|black titanium': '/assets/products/iphone-16-pro-max-blacktitanium.svg',
  'iphone 16 pro max|natural titanium': '/assets/products/iphone-16-pro-max-naturaltitanium.svg',
  'iphone 16 pro max|desert titanium': '/assets/products/iphone-16-pro-max-deserttitanium.svg',
  'iphone 16 pro|black titanium': '/assets/products/iphone-16-pro-blacktitanium.svg',
  'iphone 16 pro|natural titanium': '/assets/products/iphone-16-pro-naturaltitanium.svg',
  'iphone 16 plus|ultramarine': '/assets/products/iphone-16-plus-ultramarine.svg',
  'iphone 16 plus|teal': '/assets/products/iphone-16-plus-teal.svg',
  'iphone 16|ultramarine': '/assets/products/iphone-16-ultramarine.svg',
  'iphone 16|teal': '/assets/products/iphone-16-teal.svg',
  'iphone 16|black': '/assets/products/iphone-16-black.svg',
  'iphone 16|pink': '/assets/products/iphone-16-pink.svg',
  'iphone 17e|black': '/assets/products/iphone-17e-black.svg',
  'iphone 17e|white': '/assets/products/iphone-17e-white.svg',

  /*
    Apple Watch: аккуратные векторные иллюстрации, а не фотографии.
    Официальных снимков для этой категории в проекте пока нет, а выдавать
    рисунок за фото нельзя — категория и в интерфейсе помечена как
    демонстрационная.
  */
  'apple watch ultra 3|natural titanium': '/assets/products/watch-ultra-natural-titanium.svg',
  'apple watch ultra 3|black titanium': '/assets/products/watch-ultra-black-titanium.svg',
  'apple watch series 11|jet black': '/assets/products/watch-series-jet-black.svg',
  'apple watch series 11|rose gold': '/assets/products/watch-series-rose-gold.svg',
  'apple watch series 11|silver': '/assets/products/watch-series-silver.svg',
  'apple watch se 3|midnight': '/assets/products/watch-se-midnight.svg',
  'apple watch se 3|starlight': '/assets/products/watch-se-starlight.svg',
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

/**
 * Любое изображение модели — для модельной плашки, когда у самой позиции
 * картинки нет. В карточке товара так делать нельзя: там цвет на фотографии
 * должен совпадать с выбранным.
 */
export function resolveModelImage(model: string): string | null {
  return imagesForModel(model)[0] ?? null;
}

/** All stored finishes for a model — powers the colour picker on the detail page. */
export function imagesForModel(model: string): string[] {
  const prefix = `${model.toLowerCase()}|`;
  return Object.entries(PRODUCT_IMAGES)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}
