-- Take Phone — поля для модельной навигации каталога.
--
--   npx wrangler d1 migrations apply take-phone --local
--   npx wrangler d1 migrations apply take-phone --remote
--
-- model_slug — ключ модельной плашки («iphone-17-pro-max»).
-- case_size и configuration нужны часам: там варианты различаются размером
-- корпуса и ремешком, а не объёмом памяти.
--
-- Те же операции выполняет ensureSchema() в lib/repositories/d1.ts.

ALTER TABLE source_offers ADD COLUMN model_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE source_offers ADD COLUMN case_size INTEGER;
ALTER TABLE source_offers ADD COLUMN configuration TEXT;

CREATE INDEX IF NOT EXISTS idx_source_offers_model ON source_offers (model_slug);
