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
import type { CatalogProduct } from '@/lib/catalog/types';

export interface RequestItem {
  matchKey: string;
  slug: string;
  title: string;
  memoryLabel: string;
  color: string;
  image: string;
  price: number;
  availability: CatalogProduct['availability'];
}

interface Snapshot {
  items: RequestItem[];
  favourites: string[];
}

/* --------------------------------------------------------- external store */

const ITEMS_KEY = 'take-phone.request';
const FAVOURITES_KEY = 'take-phone.favourites';

const EMPTY: Snapshot = { items: [], favourites: [] };

/**
 * The request lives in `localStorage`, which makes it external state: the
 * server renders the empty snapshot, and the browser swaps in the stored one
 * through `useSyncExternalStore` instead of a post-hydration `setState`.
 */
let snapshot: Snapshot = EMPTY;
let restored = false;
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Private mode or storage disabled — the request still works in-session.
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignored for the same reason.
  }
}

function restore(): void {
  if (restored) return;
  restored = true;

  const items = read<RequestItem[]>(ITEMS_KEY, []);
  const favourites = read<string[]>(FAVOURITES_KEY, []);
  if (items.length === 0 && favourites.length === 0) return;

  snapshot = { items, favourites };
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

/* ------------------------------------------------------------- provider */

interface RequestState extends Snapshot {
  isOpen: boolean;
  /** Set briefly after an item is added so the badge can animate. */
  lastAdded: string | null;
  add: (product: CatalogProduct) => void;
  remove: (matchKey: string) => void;
  clear: () => void;
  has: (matchKey: string) => boolean;
  toggleFavourite: (matchKey: string) => void;
  isFavourite: (matchKey: string) => boolean;
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

  const add = useCallback((product: CatalogProduct) => {
    if (!snapshot.items.some((item) => item.matchKey === product.matchKey)) {
      commit({
        ...snapshot,
        items: [...snapshot.items, {
          matchKey: product.matchKey,
          slug: product.slug,
          title: product.title,
          memoryLabel: product.memoryLabel,
          color: product.color,
          image: product.images[0],
          price: product.price,
          availability: product.availability,
        }],
      });
    }

    setLastAdded(product.matchKey);
  }, []);

  const value = useMemo<RequestState>(() => ({
    items,
    favourites,
    isOpen,
    lastAdded,
    add,
    remove: (matchKey) => commit({
      ...snapshot,
      items: snapshot.items.filter((item) => item.matchKey !== matchKey),
    }),
    clear: () => commit({ ...snapshot, items: [] }),
    has: (matchKey) => items.some((item) => item.matchKey === matchKey),
    toggleFavourite: (matchKey) => commit({
      ...snapshot,
      favourites: snapshot.favourites.includes(matchKey)
        ? snapshot.favourites.filter((key) => key !== matchKey)
        : [...snapshot.favourites, matchKey],
    }),
    isFavourite: (matchKey) => favourites.includes(matchKey),
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
