import { defaultMarkupRules } from '@/lib/catalog/pricing';
import type {
  MarkupRules,
  SourceId,
  SourceOffer,
  SyncRun,
} from '@/lib/catalog/types';
import { buildOrderId, buildPublicNumber } from './order-number';
import type {
  CatalogRepository,
  MarkupOverride,
  OrderUpdate,
  StoredOrder,
} from './types';

/**
 * Хранилище в памяти процесса.
 *
 * Используется локально и в статическом превью. Данные живут до перезапуска,
 * поэтому для рабочего деплоя подключается `D1CatalogRepository` — выбор
 * делается в `lib/repositories/index.ts`.
 */
interface MemoryState {
  offers: Map<SourceId, SourceOffer[]>;
  rules: MarkupRules;
  runs: SyncRun[];
  orders: StoredOrder[];
}

const globalKey = Symbol.for('take-phone.memory-repository');
type GlobalWithState = typeof globalThis & { [globalKey]?: MemoryState };

function state(): MemoryState {
  const scope = globalThis as GlobalWithState;

  scope[globalKey] ??= {
    offers: new Map(),
    rules: structuredClone(defaultMarkupRules),
    runs: [],
    orders: [],
  };

  return scope[globalKey];
}

export class MemoryCatalogRepository implements CatalogRepository {
  readonly kind = 'memory' as const;

  async replaceOffers(source: SourceId, offers: SourceOffer[]): Promise<void> {
    state().offers.set(source, offers);
  }

  async listOffers(): Promise<SourceOffer[]> {
    return [...state().offers.values()].flat();
  }

  async getMarkupRules(): Promise<MarkupRules> {
    return structuredClone(state().rules);
  }

  async setGlobalMarkup(value: number): Promise<MarkupRules> {
    state().rules.global = clampMarkup(value);
    return this.getMarkupRules();
  }

  async setMarkupOverride(override: MarkupOverride): Promise<MarkupRules> {
    const rules = state().rules;
    const bucket = override.level === 'product'
      ? rules.byProduct
      : override.level === 'model'
        ? rules.byModel
        : rules.byCategory;

    if (override.value === null) {
      delete (bucket as Record<string, number>)[override.key];
    } else {
      (bucket as Record<string, number>)[override.key] = clampMarkup(override.value);
    }

    return this.getMarkupRules();
  }

  async recordSyncRun(run: SyncRun): Promise<void> {
    const runs = state().runs;
    runs.unshift(run);
    runs.splice(20);
  }

  async listSyncRuns(limit = 10): Promise<SyncRun[]> {
    return state().runs.slice(0, limit);
  }

  async createOrder(
    order: Omit<StoredOrder, 'id' | 'publicNumber' | 'createdAt' | 'updatedAt' | 'history'>,
  ): Promise<StoredOrder> {
    const id = buildOrderId();
    const createdAt = new Date();
    const timestamp = createdAt.toISOString();

    const stored: StoredOrder = {
      ...order,
      id,
      publicNumber: buildPublicNumber(createdAt, id),
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [{ status: order.status, at: timestamp }],
    };

    state().orders.unshift(stored);
    state().orders.splice(200);
    return structuredClone(stored);
  }

  async listOrders(limit = 100): Promise<StoredOrder[]> {
    return structuredClone(state().orders.slice(0, limit));
  }

  async getOrder(id: string): Promise<StoredOrder | null> {
    const found = state().orders.find((order) => order.id === id);
    return found ? structuredClone(found) : null;
  }

  async updateOrder(id: string, update: OrderUpdate): Promise<StoredOrder | null> {
    const order = state().orders.find((candidate) => candidate.id === id);
    if (!order) return null;

    const now = new Date().toISOString();

    if (update.status && update.status !== order.status) {
      order.status = update.status;
      order.history = [...order.history, { status: update.status, at: now, note: update.note }];
    }

    if (update.staffComment !== undefined) {
      order.staffComment = update.staffComment;
    }

    order.updatedAt = now;
    return structuredClone(order);
  }
}

function clampMarkup(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(200_000, Math.round(value)));
}
