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

  // Реальные официальные фотографии Apple. Для вариантов одной линейки
  // используется общий студийный кадр: он честнее выдуманной «фотографии» и
  // всегда целиком помещается в карточку.
  'iphone 16 pro max|black titanium': '/assets/products/iphone-16-pro-family.jpg',
  'iphone 16 pro max|natural titanium': '/assets/products/iphone-16-pro-family.jpg',
  'iphone 16 pro max|desert titanium': '/assets/products/iphone-16-pro-family.jpg',
  'iphone 16 pro|black titanium': '/assets/products/iphone-16-pro-family.jpg',
  'iphone 16 pro|natural titanium': '/assets/products/iphone-16-pro-family.jpg',
  'iphone 16 plus|ultramarine': '/assets/products/iphone-16-plus-ultramarine.jpg',
  'iphone 16 plus|teal': '/assets/products/iphone-16-plus-teal.jpg',
  'iphone 16|ultramarine': '/assets/products/iphone-16-ultramarine.jpg',
  'iphone 16|teal': '/assets/products/iphone-16-teal.jpg',
  'iphone 16|black': '/assets/products/iphone-16-black.jpg',
  'iphone 16|pink': '/assets/products/iphone-16-pink.jpg',
  'iphone 16e|black': '/assets/products/iphone-16e-family.jpg',
  'iphone 16e|white': '/assets/products/iphone-16e-family.jpg',

  'apple watch ultra 2|natural titanium': '/assets/products/watch-ultra-2.jpg',
  'apple watch ultra 2|black titanium': '/assets/products/watch-ultra-2.jpg',
  'apple watch series 10|jet black': '/assets/products/watch-series-10.jpg',
  'apple watch series 10|rose gold': '/assets/products/watch-series-10.jpg',
  'apple watch series 10|silver': '/assets/products/watch-series-10.jpg',
  'apple watch se 2|midnight': '/assets/products/watch-se-2.jpg',
  'apple watch se 2|starlight': '/assets/products/watch-se-2.jpg',

  'macbook air 13 m4|sky blue': '/assets/products/macbook-air-m4.jpg',
  'macbook air 13 m4|midnight': '/assets/products/macbook-air-m4.jpg',
  'macbook air 15 m4|sky blue': '/assets/products/macbook-air-m4.jpg',
  'macbook pro 14 m4|space black': '/assets/products/macbook-pro-m4.jpg',
  'macbook pro 14 m4 pro|space black': '/assets/products/macbook-pro-m4.jpg',
  'macbook pro 16 m4 pro|silver': '/assets/products/macbook-pro-m4.jpg',
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
