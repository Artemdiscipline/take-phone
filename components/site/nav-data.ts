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
  href: string;
  /** Only `iphone` has a working catalogue in this version. */
  ready: boolean;
  note: string;
}

export const categories: CategoryEntry[] = [
  { id: 'iphone', label: 'iPhone', href: '/catalog', ready: true, note: 'Каталог открыт' },
  { id: 'mac', label: 'Mac', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'ipad', label: 'iPad', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'watch', label: 'Apple Watch', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'airpods', label: 'AirPods', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'samsung', label: 'Samsung', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'gaming', label: 'Игровая техника', href: '/catalog', ready: false, note: 'Подключаем' },
  { id: 'electronics', label: 'Другая электроника', href: '/catalog', ready: false, note: 'Подключаем' },
];
