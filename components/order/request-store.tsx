'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CatalogListing, CatalogProduct } from '@/lib/catalog/types';

/**
 * Позиция заявки.
 *
 * Хранится развёрнуто: заявка должна оставаться читаемой, даже если товар
 * исчез из каталога между добавлением и отправкой.
 */
export interface RequestItem {
  productKey: string;
  productSlug: string;
  title: string;
  model: string;
  memory: number;
  memoryLabel: string;
  color: string;
  simType: string;
  simLabel: string;
  image: string;
  price: number;
  availability: CatalogProduct['availability'];
  quantity: number;
}

interface Snapshot {
  items: RequestItem[];
  favourites: string[];
}

/* --------------------------------------------------------- внешнее хранилище */

const ITEMS_KEY = 'take-phone.request';
const FAVOURITES_KEY = 'take-phone.favourites';

const EMPTY: Snapshot = { items: [], favourites: [] };

/**
 * Заявка живёт в `localStorage`, то есть это внешнее состояние: сервер
 * отрисовывает пустой снимок, а браузер подставляет сохранённый через
 * `useSyncExternalStore`, а не через setState после гидратации.
 */
let snapshot: Snapshot = EMPTY;
let restored = false;
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Приватный режим или отключённое хранилище — заявка работает в рамках сессии.
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Игнорируем по той же причине.
  }
}

function restore(): void {
  if (restored) return;
  restored = true;

  const items = read<RequestItem[]>(ITEMS_KEY, []).filter(isRequestItem);
  const favourites = read<string[]>(FAVOURITES_KEY, []);
  if (items.length === 0 && favourites.length === 0) return;

  snapshot = { items, favourites };
}

/** Отсекает записи от прежней версии формата, чтобы форма не падала. */
function isRequestItem(value: unknown): value is RequestItem {
  return typeof value === 'object'
    && value !== null
    && typeof (value as RequestItem).productKey === 'string'
    && typeof (value as RequestItem).price === 'number';
}

function subscribe(listener: () => void): () => void {
  restore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Snapshot): void {
  snapshot = next;
  write(ITEMS_KEY, next.items);
  write(FAVOURITES_KEY, next.favourites);
  for (const listener of listeners) listener();
}

/* ----------------------------------------------------------------- провайдер */

interface RequestState extends Snapshot {
  isOpen: boolean;
  /** Ставится ненадолго после добавления, чтобы счётчик мог анимироваться. */
  lastAdded: string | null;
  subtotal: number;
  add: (listing: CatalogListing, variant: CatalogProduct) => void;
  remove: (productKey: string) => void;
  clear: () => void;
  has: (productKey: string) => boolean;
  toggleFavourite: (slug: string) => void;
  isFavourite: (slug: string) => boolean;
  open: () => void;
  setOpen: (open: boolean) => void;
}

const RequestContext = createContext<RequestState | null>(null);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { items, favourites } = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(() => setLastAdded(null), 700);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  const add = useCallback((listing: CatalogListing, variant: CatalogProduct) => {
    if (!snapshot.items.some((item) => item.productKey === variant.matchKey)) {
      commit({
        ...snapshot,
        items: [...snapshot.items, {
          productKey: variant.matchKey,
          productSlug: listing.slug,
          title: listing.title,
          model: variant.model,
          memory: variant.memory,
          memoryLabel: variant.memoryLabel,
          color: variant.color,
          simType: variant.sim,
          simLabel: variant.simLabel,
          image: listing.images[0],
          price: variant.price,
          availability: variant.availability,
          quantity: 1,
        }],
      });
    }

    setLastAdded(variant.matchKey);
  }, []);

  const value = useMemo<RequestState>(() => ({
    items,
    favourites,
    isOpen,
    lastAdded,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add,
    remove: (productKey) => commit({
      ...snapshot,
      items: snapshot.items.filter((item) => item.productKey !== productKey),
    }),
    clear: () => commit({ ...snapshot, items: [] }),
    has: (productKey) => items.some((item) => item.productKey === productKey),
    toggleFavourite: (slug) => commit({
      ...snapshot,
      favourites: snapshot.favourites.includes(slug)
        ? snapshot.favourites.filter((key) => key !== slug)
        : [...snapshot.favourites, slug],
    }),
    isFavourite: (slug) => favourites.includes(slug),
    open: () => setIsOpen(true),
    setOpen: setIsOpen,
  }), [items, favourites, isOpen, lastAdded, add]);

  return <RequestContext value={value}>{children}</RequestContext>;
}

export function useRequest(): RequestState {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequest must be used inside RequestProvider');
  return context;
}
