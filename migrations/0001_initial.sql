-- Take Phone — начальная схема.
--
-- Применение на Cloudflare D1:
--   npx wrangler d1 migrations apply take-phone --local
--   npx wrangler d1 migrations apply take-phone --remote
--
-- Те же операции выполняет ensureSchema() в lib/repositories/d1.ts, поэтому
-- демо поднимается и без ручного запуска миграций.

CREATE TABLE IF NOT EXISTS orders (
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
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
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
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- История смены статусов: сотрудник видит, что и когда происходило с заявкой.
CREATE TABLE IF NOT EXISTS order_status_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_status_events (order_id, id);

-- Наценки. level: global | category | model | product.
CREATE TABLE IF NOT EXISTS markup_rules (
  level TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  value INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (level, rule_key)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  total_offers INTEGER NOT NULL,
  total_products INTEGER NOT NULL,
  results TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_finished ON sync_runs (finished_at DESC);

-- Сырые предложения поставщиков. Закрытые данные: наружу не отдаются никогда.
CREATE TABLE IF NOT EXISTS source_offers (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  match_key TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  generation TEXT NOT NULL,
  memory INTEGER NOT NULL,
  color TEXT NOT NULL,
  sim TEXT NOT NULL,
  category TEXT NOT NULL,
  images TEXT NOT NULL,
  purchase_price INTEGER NOT NULL,
  old_price INTEGER,
  availability TEXT NOT NULL,
  city TEXT NOT NULL,
  source_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_offers_source ON source_offers (source);
CREATE INDEX IF NOT EXISTS idx_source_offers_match ON source_offers (match_key);
