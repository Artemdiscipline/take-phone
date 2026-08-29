import type { CategoryId } from './types';
import { CATEGORY_LABELS } from './normalize';

/**
 * Адреса категорий каталога.
 *
 * Внутренний идентификатор и сегмент адреса намеренно разведены: покупателю
 * понятнее `/catalog/apple-watch`, а в данных категория называется `watch`.
 * Всё остальное совпадает, поэтому таблица короткая, но одна на весь проект —
 * иначе ссылка и разбор адреса рано или поздно разъедутся.
 */
export const CATEGORY_SLUGS: Record<CategoryId, string> = {
  iphone: 'iphone',
  watch: 'apple-watch',
  ipad: 'ipad',
  mac: 'mac',
  airpods: 'airpods',
  samsung: 'samsung',
  gaming: 'gaming',
  electronics: 'other',
};

/** Порядок категорий в меню каталога — от самых спрашиваемых к остальным. */
export const CATEGORY_ORDER: CategoryId[] = [
  'iphone',
  'watch',
  'ipad',
  'mac',
  'airpods',
  'samsung',
  'gaming',
  'electronics',
];

const BY_SLUG: Record<string, CategoryId> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([id, slug]) => [slug, id as CategoryId]),
) as Record<string, CategoryId>;

export function categoryIdBySlug(slug: string): CategoryId | null {
  return BY_SLUG[slug] ?? null;
}

export function categorySlug(id: CategoryId): string {
  return CATEGORY_SLUGS[id];
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_LABELS[id];
}

/** Адрес страницы категории. */
export function categoryHref(id: CategoryId): string {
  return `/catalog/${CATEGORY_SLUGS[id]}`;
}

/** Адрес страницы модели внутри категории. */
export function modelHref(id: CategoryId, modelSlug: string): string {
  return `/catalog/${CATEGORY_SLUGS[id]}/${modelSlug}`;
}

/**
 * Родительный падеж для заголовков вида «Выберите модель iPhone».
 * Латинские названия не склоняются, поэтому запись нужна только для русских.
 */
const CATEGORY_GENITIVE: Partial<Record<CategoryId, string>> = {
  gaming: 'игровой техники',
  electronics: 'другой электроники',
};

export function categoryGenitive(id: CategoryId): string {
  return CATEGORY_GENITIVE[id] ?? CATEGORY_LABELS[id];
}
