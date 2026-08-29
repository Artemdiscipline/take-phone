import type { CategoryId } from '@/lib/catalog/types';

export interface NavLink {
  href: string;
  label: string;
}

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
   * Адрес есть только у готовых категорий. Неготовая категория не должна
   * вести в каталог iPhone — покупатель ждал бы Mac, а попал бы к телефонам.
   */
  href: string | null;
  ready: boolean;
  note: string;
}

export const categories: CategoryEntry[] = [
  { id: 'iphone', label: 'iPhone', href: '/catalog', ready: true, note: 'Каталог открыт' },
  { id: 'mac', label: 'Mac', href: null, ready: false, note: 'Скоро' },
  { id: 'ipad', label: 'iPad', href: null, ready: false, note: 'Скоро' },
  { id: 'watch', label: 'Apple Watch', href: null, ready: false, note: 'Скоро' },
  { id: 'airpods', label: 'AirPods', href: null, ready: false, note: 'Скоро' },
  { id: 'samsung', label: 'Samsung', href: null, ready: false, note: 'Скоро' },
  { id: 'gaming', label: 'Игровая техника', href: null, ready: false, note: 'Скоро' },
  { id: 'electronics', label: 'Другая электроника', href: null, ready: false, note: 'Скоро' },
];
