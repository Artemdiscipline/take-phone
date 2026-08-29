import { CATEGORY_ORDER, categoryHref, categoryLabel } from '@/lib/catalog/categories';
import type { CategoryId } from '@/lib/catalog/types';

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Основная навигация.
 *
 * Разделы — отдельные страницы, а не якоря на главной. На одной странице
 * невозможно дать ссылку на конкретную модель или условия гарантии, а именно
 * такие ссылки менеджер отправляет покупателю и по ним же приходит поиск.
 * Главная при этом остаётся длинной витриной: её блоки — короткие анонсы,
 * ведущие в эти страницы.
 */
export const mainNav: NavLink[] = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/service', label: 'Гарантия и сервис' },
  { href: '/service#trade-in', label: 'Trade-in' },
  { href: '/delivery', label: 'Доставка и оплата' },
  { href: '/contacts', label: 'Контакты' },
];

export interface CategoryEntry {
  id: CategoryId;
  label: string;
  /**
   * Адрес есть только у заполненных категорий. Пустая категория не должна
   * вести в каталог iPhone — покупатель ждал бы Mac, а попал бы к телефонам.
   */
  href: string | null;
  ready: boolean;
  note: string;
}

/**
 * Меню каталога.
 *
 * Готовность берётся из данных: категория активна, если в ней есть хотя бы
 * одна позиция. Список категорий приходит со страницы (серверный рендер), а не
 * зашит в клиентском компоненте — иначе появление Mac в прайс-листе пришлось
 * бы дублировать правкой кода.
 */
export function buildCategoryMenu(populated: CategoryId[]): CategoryEntry[] {
  const ready = new Set(populated);

  return CATEGORY_ORDER.map((id) => ({
    id,
    label: categoryLabel(id),
    href: ready.has(id) ? categoryHref(id) : null,
    ready: ready.has(id),
    note: ready.has(id) ? 'Выбрать модель' : 'Скоро',
  }));
}
