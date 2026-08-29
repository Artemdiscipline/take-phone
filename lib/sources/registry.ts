import type { SourceId } from '@/lib/catalog/types';
import { env } from '@/lib/env';
import type { SourceAdapter } from './adapter';
import { FirstAppleAdapter } from './first-apple';
import { IceAppleAdapter } from './ice-apple';
import { Phone24Adapter } from './phone24';

/**
 * Builds the adapter set for the current runtime configuration.
 *
 * A fresh set is created per sync so a live run cannot reuse the status of a
 * previous fixture run.
 */
export function createSourceAdapters(): SourceAdapter[] {
  const mode = env.catalogMode;
  const feedUrls = env.feedUrls;
  const tokens = env.feedTokens;

  const config = (id: SourceId) => ({
    mode,
    feedUrl: feedUrls[id],
    token: tokens[id],
    timeoutMs: 10_000,
  });

  return [
    new FirstAppleAdapter(config('first-apple')),
    new IceAppleAdapter(config('ice-apple')),
    new Phone24Adapter(config('phone24')),
  ];
}

/** Staff-only source metadata. Never send this to the public site. */
export const SOURCE_LABELS: Record<SourceId, string> = {
  'first-apple': 'First Apple',
  'ice-apple': 'IceApple',
  phone24: 'Phone24',
};

/** Адреса источников. Тоже закрытые данные — только для панели сотрудника. */
export const SOURCE_URLS: Record<SourceId, string> = {
  'first-apple': 'https://first-apple72.ru/',
  'ice-apple': 'https://iceapple.ru/',
  phone24: 'https://phone24.ru/',
};
