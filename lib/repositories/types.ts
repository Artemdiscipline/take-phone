import type {
  CategoryId,
  MarkupRules,
  SourceId,
  SourceOffer,
  SyncRun,
} from '@/lib/catalog/types';

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'transfer' | 'cash' | 'card';

/** Статусы заявки в том порядке, в котором они обычно сменяются. */
export const ORDER_STATUSES = [
  'new',
  'in_progress',
  'contacted',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  contacted: 'Связались с клиентом',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

/** Позиция заявки. Хранится развёрнуто, чтобы заявка не зависела от каталога. */
export interface OrderItem {
  /** matchKey варианта: бренд + модель + память + цвет + SIM. */
  productKey: string;
  productSlug: string;
  title: string;
  model: string;
  memory: number;
  memoryLabel: string;
  color: string;
  simType: string;
  simLabel: string;
  price: number;
  availability: string;
  quantity: number;
}

export interface OrderRequest {
  name: string;
  phone: string;
  comment?: string;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  items: OrderItem[];
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  /** Комментарий сотрудника, оставленный вместе со сменой статуса. */
  note?: string;
}

export interface StoredOrder extends OrderRequest {
  id: string;
  /** Человеческий номер заявки, который называют покупателю. */
  publicNumber: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  /** Надбавка за оплату картой; 0 для остальных способов. */
  cardFee: number;
  total: number;
  /** Предоплата за бронирование при самовывозе. Не списана, а согласуется. */
  reservationPrepayment: number;
  status: OrderStatus;
  staffComment: string;
  history: OrderStatusEvent[];
  /**
   * Как заявка ушла в магазин. `stored` — сохранена только в базе, никуда
   * не отправлена: так и говорим покупателю, не выдумывая Telegram.
   */
  delivered: 'stored' | 'webhook' | 'telegram';
}

export interface OrderUpdate {
  status?: OrderStatus;
  staffComment?: string;
  /** Заметка, попадающая в историю вместе со сменой статуса. */
  note?: string;
}

export interface MarkupOverride {
  level: 'product' | 'model' | 'category';
  key: string;
  value: number | null;
}

/**
 * Контракт хранилища.
 *
 * `MemoryCatalogRepository` обслуживает локальную разработку и статическое
 * превью, `D1CatalogRepository` — рабочий деплой. Всё остальное приложение
 * знает только этот интерфейс.
 */
export interface CatalogRepository {
  replaceOffers(source: SourceId, offers: SourceOffer[]): Promise<void>;
  listOffers(): Promise<SourceOffer[]>;

  getMarkupRules(): Promise<MarkupRules>;
  setGlobalMarkup(value: number): Promise<MarkupRules>;
  setMarkupOverride(override: MarkupOverride): Promise<MarkupRules>;

  recordSyncRun(run: SyncRun): Promise<void>;
  listSyncRuns(limit?: number): Promise<SyncRun[]>;

  createOrder(
    order: Omit<StoredOrder, 'id' | 'publicNumber' | 'createdAt' | 'updatedAt' | 'history'>,
  ): Promise<StoredOrder>;
  listOrders(limit?: number): Promise<StoredOrder[]>;
  getOrder(id: string): Promise<StoredOrder | null>;
  updateOrder(id: string, update: OrderUpdate): Promise<StoredOrder | null>;
}

export type { CategoryId, MarkupRules, SourceId, SourceOffer, SyncRun };
