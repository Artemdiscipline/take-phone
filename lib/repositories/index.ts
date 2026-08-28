import { MemoryCatalogRepository } from './memory';
import type { CatalogRepository } from './types';

let instance: CatalogRepository | null = null;

/**
 * Single entry point for storage.
 *
 * Today it always returns the in-memory implementation. Adding a database means
 * writing one more `CatalogRepository` and selecting it here — for example
 * `if (getCloudflareBinding('DB')) return new D1CatalogRepository(binding)` —
 * without touching services, routes or components.
 */
export function getRepository(): CatalogRepository {
  instance ??= new MemoryCatalogRepository();
  return instance;
}

export type { CatalogRepository } from './types';
