import { defaultMarkupRules } from '@/lib/catalog/pricing';
import type {
  MarkupRules,
  SourceId,
  SourceOffer,
  SyncRun,
} from '@/lib/catalog/types';
import type {
  CatalogRepository,
  MarkupOverride,
  StoredOrder,
} from './types';

/**
 * In-memory repository used until a database is provisioned.
 *
 * State lives for the lifetime of the server instance: on Cloudflare Workers
 * that means a single isolate, so markup edits and orders are not durable. This
 * is intentional for the demo and is surfaced in the staff panel.
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

  async createOrder(order: Omit<StoredOrder, 'id' | 'createdAt'>): Promise<StoredOrder> {
    const stored: StoredOrder = {
      ...order,
      id: `TP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    state().orders.unshift(stored);
    state().orders.splice(100);
    return stored;
  }

  async listOrders(limit = 20): Promise<StoredOrder[]> {
    return state().orders.slice(0, limit);
  }
}

function clampMarkup(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(200_000, Math.round(value)));
}
