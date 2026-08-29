import { D1CatalogRepository } from './d1';
import { MemoryCatalogRepository } from './memory';
import type { CatalogRepository } from './types';

export type RepositoryKind = 'd1' | 'memory';

let cached: { repository: CatalogRepository; kind: RepositoryKind } | null = null;

/**
 * Выбор хранилища.
 *
 *   есть биндинг D1  → D1CatalogRepository, данные переживают перезапуск;
 *   нет биндинга     → MemoryCatalogRepository для локальной разработки.
 *
 * Биндинг объявляется полем `d1` в `.openai/hosting.json` (его читает
 * `vite.config.ts`) либо секцией `d1_databases` в wrangler-конфиге.
 */
export async function getRepository(): Promise<CatalogRepository> {
  return (await resolve()).repository;
}

/** Каким хранилищем сейчас пользуемся — показывается в панели сотрудника. */
export async function getRepositoryKind(): Promise<RepositoryKind> {
  return (await resolve()).kind;
}

async function resolve(): Promise<{ repository: CatalogRepository; kind: RepositoryKind }> {
  if (cached) return cached;

  const binding = await resolveD1Binding();

  cached = binding
    ? { repository: new D1CatalogRepository(binding), kind: 'd1' }
    : { repository: new MemoryCatalogRepository(), kind: 'memory' };

  return cached;
}

/**
 * `cloudflare:workers` существует только внутри workerd. При статическом
 * экспорте и в обычном Node импорт не разрешится — тогда работаем в памяти.
 */
async function resolveD1Binding(): Promise<D1Database | null> {
  try {
    const runtime = await import(/* @vite-ignore */ 'cloudflare:workers');
    const env = (runtime as unknown as { env?: Record<string, unknown> }).env;
    if (!env) return null;

    const name = process.env.D1_BINDING || 'DB';
    const candidate = env[name];

    return isD1(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function isD1(value: unknown): value is D1Database {
  return typeof value === 'object'
    && value !== null
    && typeof (value as D1Database).prepare === 'function'
    && typeof (value as D1Database).batch === 'function';
}

export type { CatalogRepository } from './types';
