import type {
  CategoryId,
  MarkupRules,
  SourceId,
  SourceOffer,
  SyncRun,
} from '@/lib/catalog/types';

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'transfer' | 'cash' | 'card';

export interface OrderItem {
  matchKey: string;
  title: string;
  memoryLabel: string;
  color: string;
  price: number;
  availability: string;
}

export interface OrderRequest {
  name: string;
  phone: string;
  comment?: string;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  items: OrderItem[];
}

export interface StoredOrder extends OrderRequest {
  id: string;
  createdAt: string;
  subtotal: number;
  total: number;
  status: 'new' | 'confirmed' | 'closed';
  /** How the request was delivered to the shop. `demo` = nothing was sent. */
  delivered: 'demo' | 'webhook' | 'telegram';
}

export interface MarkupOverride {
  level: 'product' | 'model' | 'category';
  key: string;
  value: number | null;
}

/**
 * Storage contract. The in-memory implementation backs the demo; swapping in
 * D1, Postgres, Supabase or Neon means implementing this interface only.
 */
export interface CatalogRepository {
  replaceOffers(source: SourceId, offers: SourceOffer[]): Promise<void>;
  listOffers(): Promise<SourceOffer[]>;

  getMarkupRules(): Promise<MarkupRules>;
  setGlobalMarkup(value: number): Promise<MarkupRules>;
  setMarkupOverride(override: MarkupOverride): Promise<MarkupRules>;

  recordSyncRun(run: SyncRun): Promise<void>;
  listSyncRuns(limit?: number): Promise<SyncRun[]>;

  createOrder(order: Omit<StoredOrder, 'id' | 'createdAt'>): Promise<StoredOrder>;
  listOrders(limit?: number): Promise<StoredOrder[]>;
}

export type { CategoryId, MarkupRules, SourceId, SourceOffer, SyncRun };
