import { buildModelSlug } from '@/lib/catalog/normalize';
import { defaultMarkupRules } from '@/lib/catalog/pricing';
import type {
  Availability,
  CategoryId,
  MarkupRules,
  SimType,
  SourceId,
  SourceOffer,
  SyncRun,
  SyncSourceResult,
} from '@/lib/catalog/types';
import { buildOrderId, buildPublicNumber } from './order-number';
import type {
  CatalogRepository,
  DeliveryMethod,
  MarkupOverride,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  OrderUpdate,
  PaymentMethod,
  StoredOrder,
} from './types';

/**
 * Постоянное хранилище на Cloudflare D1.
 *
 * Схема совпадает с `migrations/0001_initial.sql`; `ensureSchema()` выполняет
 * ту же DDL идемпотентно, чтобы демо поднималось без ручного применения
 * миграций. На рабочем стенде миграции всё равно стоит применить явно.
 */
export class D1CatalogRepository implements CatalogRepository {
  readonly kind = 'd1' as const;

  private ready: Promise<void> | null = null;

  constructor(private readonly db: D1Database) {}

  private async ensureSchema(): Promise<void> {
    this.ready ??= (async () => {
      for (const statement of SCHEMA) {
        await this.db.prepare(statement).run();
      }

      // CREATE TABLE IF NOT EXISTS не трогает уже созданную таблицу, поэтому
      // новые колонки добавляются отдельно. Повторный запуск падает на
      // «duplicate column» — это ожидаемо и означает, что колонка уже есть.
      for (const statement of ADDITIVE_COLUMNS) {
        try {
          await this.db.prepare(statement).run();
        } catch {
          // Колонка уже добавлена предыдущим запуском или миграцией.
        }
      }
    })();

    await this.ready;
  }

  /* ------------------------------------------------------------- предложения */

  async replaceOffers(source: SourceId, offers: SourceOffer[]): Promise<void> {
    await this.ensureSchema();

    const statements: D1PreparedStatement[] = [
      this.db.prepare('DELETE FROM source_offers WHERE source = ?').bind(source),
    ];

    for (const offer of offers) {
      statements.push(
        this.db.prepare(`
          INSERT INTO source_offers (
            id, source, external_id, match_key, brand, model, model_slug, generation,
            memory, color, sim, case_size, configuration, category, images,
            purchase_price, old_price, availability, city, source_url, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          offer.id, offer.source, offer.externalId, offer.matchKey, offer.brand,
          offer.model, offer.modelSlug, offer.generation, offer.memory, offer.color,
          offer.sim, offer.caseSize ?? null, offer.configuration ?? null,
          offer.category, JSON.stringify(offer.images), offer.purchasePrice,
          offer.oldPrice ?? null, offer.availability, offer.city, offer.sourceUrl,
          offer.updatedAt,
        ),
      );
    }

    await this.db.batch(statements);
  }

  async listOffers(): Promise<SourceOffer[]> {
    await this.ensureSchema();

    const { results } = await this.db
      .prepare('SELECT * FROM source_offers')
      .all<OfferRow>();

    return results.map(toOffer);
  }

  /* ------------------------------------------------------------------ наценки */

  async getMarkupRules(): Promise<MarkupRules> {
    await this.ensureSchema();

    const { results } = await this.db
      .prepare('SELECT level, rule_key, value FROM markup_rules')
      .all<{ level: string; rule_key: string; value: number }>();

    const rules: MarkupRules = {
      global: defaultMarkupRules.global,
      byCategory: {},
      byModel: {},
      byProduct: {},
    };

    for (const row of results) {
      if (row.level === 'global') rules.global = row.value;
      else if (row.level === 'category') rules.byCategory[row.rule_key as CategoryId] = row.value;
      else if (row.level === 'model') rules.byModel[row.rule_key] = row.value;
      else if (row.level === 'product') rules.byProduct[row.rule_key] = row.value;
    }

    return rules;
  }

  async setGlobalMarkup(value: number): Promise<MarkupRules> {
    await this.ensureSchema();
    await this.writeRule('global', 'global', clampMarkup(value));
    return this.getMarkupRules();
  }

  async setMarkupOverride(override: MarkupOverride): Promise<MarkupRules> {
    await this.ensureSchema();

    if (override.value === null) {
      await this.db
        .prepare('DELETE FROM markup_rules WHERE level = ? AND rule_key = ?')
        .bind(override.level, override.key)
        .run();
    } else {
      await this.writeRule(override.level, override.key, clampMarkup(override.value));
    }

    return this.getMarkupRules();
  }

  private async writeRule(level: string, key: string, value: number): Promise<void> {
    await this.db.prepare(`
      INSERT INTO markup_rules (level, rule_key, value, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (level, rule_key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(level, key, value, new Date().toISOString()).run();
  }

  /* ------------------------------------------------------------ синхронизация */

  async recordSyncRun(run: SyncRun): Promise<void> {
    await this.ensureSchema();

    await this.db.prepare(`
      INSERT INTO sync_runs (id, started_at, finished_at, total_offers, total_products, results)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      run.id, run.startedAt, run.finishedAt, run.totalOffers, run.totalProducts,
      JSON.stringify(run.results),
    ).run();

    // История нужна для показа, а не для архива — держим последние 50 запусков.
    await this.db.prepare(`
      DELETE FROM sync_runs WHERE id NOT IN (
        SELECT id FROM sync_runs ORDER BY finished_at DESC LIMIT 50
      )
    `).run();
  }

  async listSyncRuns(limit = 10): Promise<SyncRun[]> {
    await this.ensureSchema();

    const { results } = await this.db
      .prepare('SELECT * FROM sync_runs ORDER BY finished_at DESC LIMIT ?')
      .bind(limit)
      .all<SyncRunRow>();

    return results.map((row) => ({
      id: row.id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      totalOffers: row.total_offers,
      totalProducts: row.total_products,
      results: parseJson<SyncSourceResult[]>(row.results, []),
    }));
  }

  /* ------------------------------------------------------------------- заявки */

  async createOrder(
    order: Omit<StoredOrder, 'id' | 'publicNumber' | 'createdAt' | 'updatedAt' | 'history'>,
  ): Promise<StoredOrder> {
    await this.ensureSchema();

    const id = buildOrderId();
    const createdAt = new Date();
    const timestamp = createdAt.toISOString();
    const publicNumber = buildPublicNumber(createdAt, id);

    const statements: D1PreparedStatement[] = [
      this.db.prepare(`
        INSERT INTO orders (
          id, public_number, created_at, updated_at, customer_name, customer_phone,
          customer_comment, delivery_type, payment_type, subtotal, card_fee, total,
          reservation_prepayment, status, staff_comment, delivered
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, publicNumber, timestamp, timestamp, order.name, order.phone,
        order.comment ?? null, order.delivery, order.payment, order.subtotal,
        order.cardFee, order.total, order.reservationPrepayment, order.status,
        order.staffComment, order.delivered,
      ),
      this.db.prepare(`
        INSERT INTO order_status_events (order_id, status, created_at, note)
        VALUES (?, ?, ?, NULL)
      `).bind(id, order.status, timestamp),
    ];

    for (const item of order.items) {
      statements.push(
        this.db.prepare(`
          INSERT INTO order_items (
            order_id, product_key, product_slug, title, model, memory, memory_label,
            color, sim_type, sim_label, price, availability, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, item.productKey, item.productSlug, item.title, item.model, item.memory,
          item.memoryLabel, item.color, item.simType, item.simLabel, item.price,
          item.availability, item.quantity,
        ),
      );
    }

    await this.db.batch(statements);

    const created = await this.getOrder(id);
    if (!created) throw new Error('Заявка не сохранилась');
    return created;
  }

  async listOrders(limit = 100): Promise<StoredOrder[]> {
    await this.ensureSchema();

    const { results } = await this.db
      .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all<OrderRow>();

    if (results.length === 0) return [];

    const ids = results.map((row) => row.id);
    const [items, events] = await Promise.all([
      this.loadItems(ids),
      this.loadEvents(ids),
    ]);

    return results.map((row) => toOrder(row, items.get(row.id) ?? [], events.get(row.id) ?? []));
  }

  async getOrder(id: string): Promise<StoredOrder | null> {
    await this.ensureSchema();

    const row = await this.db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first<OrderRow>();

    if (!row) return null;

    const [items, events] = await Promise.all([
      this.loadItems([id]),
      this.loadEvents([id]),
    ]);

    return toOrder(row, items.get(id) ?? [], events.get(id) ?? []);
  }

  async updateOrder(id: string, update: OrderUpdate): Promise<StoredOrder | null> {
    await this.ensureSchema();

    const current = await this.getOrder(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];

    if (update.status && update.status !== current.status) {
      statements.push(
        this.db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
          .bind(update.status, now, id),
        this.db.prepare(`
          INSERT INTO order_status_events (order_id, status, created_at, note)
          VALUES (?, ?, ?, ?)
        `).bind(id, update.status, now, update.note ?? null),
      );
    }

    if (update.staffComment !== undefined) {
      statements.push(
        this.db.prepare('UPDATE orders SET staff_comment = ?, updated_at = ? WHERE id = ?')
          .bind(update.staffComment, now, id),
      );
    }

    if (statements.length > 0) await this.db.batch(statements);

    return this.getOrder(id);
  }

  private async loadItems(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
    const placeholders = orderIds.map(() => '?').join(', ');
    const { results } = await this.db
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`)
      .bind(...orderIds)
      .all<OrderItemRow>();

    const grouped = new Map<string, OrderItem[]>();

    for (const row of results) {
      const list = grouped.get(row.order_id) ?? [];
      list.push({
        productKey: row.product_key,
        productSlug: row.product_slug,
        title: row.title,
        model: row.model,
        memory: row.memory,
        memoryLabel: row.memory_label,
        color: row.color,
        simType: row.sim_type,
        simLabel: row.sim_label,
        price: row.price,
        availability: row.availability,
        quantity: row.quantity,
      });
      grouped.set(row.order_id, list);
    }

    return grouped;
  }

  private async loadEvents(orderIds: string[]): Promise<Map<string, OrderStatusEvent[]>> {
    const placeholders = orderIds.map(() => '?').join(', ');
    const { results } = await this.db
      .prepare(`SELECT * FROM order_status_events WHERE order_id IN (${placeholders}) ORDER BY id`)
      .bind(...orderIds)
      .all<OrderEventRow>();

    const grouped = new Map<string, OrderStatusEvent[]>();

    for (const row of results) {
      const list = grouped.get(row.order_id) ?? [];
      list.push({
        status: row.status as OrderStatus,
        at: row.created_at,
        note: row.note ?? undefined,
      });
      grouped.set(row.order_id, list);
    }

    return grouped;
  }
}

/* ------------------------------------------------------------------- строки */

interface OrderRow {
  id: string;
  public_number: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_phone: string;
  customer_comment: string | null;
  delivery_type: string;
  payment_type: string;
  subtotal: number;
  card_fee: number;
  total: number;
  reservation_prepayment: number;
  status: string;
  staff_comment: string;
  delivered: string;
}

interface OrderItemRow {
  order_id: string;
  product_key: string;
  product_slug: string;
  title: string;
  model: string;
  memory: number;
  memory_label: string;
  color: string;
  sim_type: string;
  sim_label: string;
  price: number;
  availability: string;
  quantity: number;
}

interface OrderEventRow {
  order_id: string;
  status: string;
  created_at: string;
  note: string | null;
}

interface OfferRow {
  id: string;
  source: string;
  external_id: string;
  match_key: string;
  brand: string;
  model: string;
  model_slug: string | null;
  generation: string;
  memory: number;
  color: string;
  sim: string;
  case_size: number | null;
  configuration: string | null;
  category: string;
  images: string;
  purchase_price: number;
  old_price: number | null;
  availability: string;
  city: string;
  source_url: string;
  updated_at: string;
}

interface SyncRunRow {
  id: string;
  started_at: string;
  finished_at: string;
  total_offers: number;
  total_products: number;
  results: string;
}

function toOrder(row: OrderRow, items: OrderItem[], history: OrderStatusEvent[]): StoredOrder {
  return {
    id: row.id,
    publicNumber: row.public_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.customer_name,
    phone: row.customer_phone,
    comment: row.customer_comment ?? undefined,
    delivery: row.delivery_type as DeliveryMethod,
    payment: row.payment_type as PaymentMethod,
    subtotal: row.subtotal,
    cardFee: row.card_fee,
    total: row.total,
    reservationPrepayment: row.reservation_prepayment,
    status: row.status as OrderStatus,
    staffComment: row.staff_comment,
    delivered: row.delivered as StoredOrder['delivered'],
    items,
    history,
  };
}

function toOffer(row: OfferRow): SourceOffer {
  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source as SourceId,
    brand: row.brand,
    model: row.model,
    // База может быть заполнена до появления колонки — тогда ключ модели
    // восстанавливается из названия, а не теряется.
    modelSlug: row.model_slug || buildModelSlug(row.model),
    generation: row.generation,
    memory: row.memory,
    color: row.color,
    sim: row.sim as SimType,
    caseSize: row.case_size ?? undefined,
    configuration: row.configuration ?? undefined,
    category: row.category as CategoryId,
    images: parseJson<string[]>(row.images, []),
    purchasePrice: row.purchase_price,
    oldPrice: row.old_price ?? undefined,
    availability: row.availability as Availability,
    city: row.city,
    sourceUrl: row.source_url,
    updatedAt: row.updated_at,
    matchKey: row.match_key,
  };
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clampMarkup(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(200_000, Math.round(value)));
}

/** DDL, повторяющая migrations/0001_initial.sql. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    public_number TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_comment TEXT,
    delivery_type TEXT NOT NULL,
    payment_type TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    card_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    reservation_prepayment INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    staff_comment TEXT NOT NULL DEFAULT '',
    delivered TEXT NOT NULL DEFAULT 'stored'
  )`,
  'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)',
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_key TEXT NOT NULL,
    product_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    memory INTEGER NOT NULL,
    memory_label TEXT NOT NULL,
    color TEXT NOT NULL,
    sim_type TEXT NOT NULL,
    sim_label TEXT NOT NULL,
    price INTEGER NOT NULL,
    availability TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
  )`,
  'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)',
  `CREATE TABLE IF NOT EXISTS order_status_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    note TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_status_events (order_id, id)',
  `CREATE TABLE IF NOT EXISTS markup_rules (
    level TEXT NOT NULL,
    rule_key TEXT NOT NULL,
    value INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (level, rule_key)
  )`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    total_offers INTEGER NOT NULL,
    total_products INTEGER NOT NULL,
    results TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_sync_runs_finished ON sync_runs (finished_at DESC)',
  `CREATE TABLE IF NOT EXISTS source_offers (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    match_key TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    model_slug TEXT NOT NULL DEFAULT '',
    generation TEXT NOT NULL,
    memory INTEGER NOT NULL,
    color TEXT NOT NULL,
    sim TEXT NOT NULL,
    case_size INTEGER,
    configuration TEXT,
    category TEXT NOT NULL,
    images TEXT NOT NULL,
    purchase_price INTEGER NOT NULL,
    old_price INTEGER,
    availability TEXT NOT NULL,
    city TEXT NOT NULL,
    source_url TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_source_offers_source ON source_offers (source)',
  'CREATE INDEX IF NOT EXISTS idx_source_offers_match ON source_offers (match_key)',
];

/** Колонки, добавленные после первой версии схемы. См. migrations/0002. */
const ADDITIVE_COLUMNS = [
  "ALTER TABLE source_offers ADD COLUMN model_slug TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE source_offers ADD COLUMN case_size INTEGER',
  'ALTER TABLE source_offers ADD COLUMN configuration TEXT',
];
