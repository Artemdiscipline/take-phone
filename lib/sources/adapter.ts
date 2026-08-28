import {
  buildMatchKey,
  canonicalColor,
  parseAvailability,
  parseIphoneModel,
  parseMemory,
  parsePrice,
  parseSim,
} from '@/lib/catalog/normalize';
import type {
  Availability,
  CategoryId,
  RawOffer,
  SourceId,
  SourceOffer,
  SyncSourceResult,
} from '@/lib/catalog/types';

export type SourceMode = 'fixtures' | 'live';

export interface SourceAdapterConfig {
  /**
   * `fixtures` reads the bundled demo dataset. `live` requires a feed URL — no
   * adapter falls back to demo data while claiming to be live.
   */
  mode: SourceMode;
  /** Price-list endpoint agreed with the source (JSON array of `RawOffer`). */
  feedUrl?: string;
  /** Optional bearer token for a protected feed. */
  token?: string;
  timeoutMs?: number;
}

/**
 * Contract every wholesale source must implement.
 *
 * Source identities are staff-only data: nothing returned by an adapter reaches
 * the browser without passing through `toPublicProducts`.
 */
export interface SourceAdapter {
  readonly id: SourceId;
  /** Internal name shown in the staff panel only. */
  readonly displayName: string;
  readonly siteUrl: string;
  readonly mode: SourceMode;

  fetchProducts(): Promise<SourceOffer[]>;
  normalizeProduct(raw: RawOffer): SourceOffer | null;
  getAvailability(raw: RawOffer): Availability;
  getPrice(raw: RawOffer): number;
  getImages(raw: RawOffer): string[];
  getLastSyncStatus(): SyncSourceResult | null;
}

export class SourceUnavailableError extends Error {
  constructor(source: SourceId, reason: string) {
    super(`Источник ${source} недоступен: ${reason}`);
    this.name = 'SourceUnavailableError';
  }
}

/**
 * Shared normalisation for all sources. Subclasses only describe *where* the
 * raw rows come from and how their fields are named.
 */
export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract readonly id: SourceId;
  abstract readonly displayName: string;
  abstract readonly siteUrl: string;
  /** Category the source is currently mapped for. */
  protected readonly category: CategoryId = 'iphone';
  protected readonly city = 'Тюмень';

  private lastStatus: SyncSourceResult | null = null;

  constructor(protected readonly config: SourceAdapterConfig) {}

  get mode(): SourceMode {
    return this.config.mode;
  }

  /** Demo rows bundled with the repository. */
  protected abstract loadFixtures(): Promise<RawOffer[]>;

  async fetchProducts(): Promise<SourceOffer[]> {
    const startedAt = Date.now();

    try {
      const raw = this.config.mode === 'live'
        ? await this.loadLive()
        : await this.loadFixtures();

      const offers = raw
        .map((row) => this.normalizeProduct(row))
        .filter((offer): offer is SourceOffer => offer !== null);

      this.lastStatus = {
        source: this.id,
        ok: true,
        offers: offers.length,
        durationMs: Date.now() - startedAt,
        mode: this.config.mode,
      };

      return offers;
    } catch (error) {
      this.lastStatus = {
        source: this.id,
        ok: false,
        offers: 0,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        mode: this.config.mode,
      };
      throw error;
    }
  }

  /**
   * Live mode reads an agreed price-list endpoint. Direct scraping of the
   * source websites is intentionally not implemented — see README.
   */
  protected async loadLive(): Promise<RawOffer[]> {
    const { feedUrl, token, timeoutMs = 10_000 } = this.config;

    if (!feedUrl) {
      throw new SourceUnavailableError(
        this.id,
        'не настроен адрес прайс-листа (переменная окружения не задана)',
      );
    }

    const response = await fetch(feedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new SourceUnavailableError(this.id, `прайс-лист ответил ${response.status}`);
    }

    const payload: unknown = await response.json();
    const rows = Array.isArray(payload)
      ? payload
      : (payload as { items?: unknown })?.items;

    if (!Array.isArray(rows)) {
      throw new SourceUnavailableError(this.id, 'неожиданный формат прайс-листа');
    }

    return rows as RawOffer[];
  }

  normalizeProduct(raw: RawOffer): SourceOffer | null {
    const parsed = parseIphoneModel(raw.title);
    if (!parsed) return null;

    const memory = parseMemory(raw.memory ?? raw.title);
    if (!memory) return null;

    const color = canonicalColor(raw.color ?? extractColor(raw.title));
    const sim = parseSim(raw.sim, raw.title);
    const brand = 'Apple';

    const matchKey = buildMatchKey({
      brand,
      model: parsed.model,
      memory,
      color,
      sim,
    });

    return {
      id: `${this.id}:${raw.externalId}`,
      externalId: raw.externalId,
      source: this.id,
      brand,
      model: parsed.model,
      generation: parsed.generation,
      memory,
      color,
      sim,
      category: this.category,
      images: this.getImages(raw),
      purchasePrice: this.getPrice(raw),
      oldPrice: raw.oldPrice ? parsePrice(raw.oldPrice) : undefined,
      availability: this.getAvailability(raw),
      city: raw.city ?? this.city,
      sourceUrl: raw.url ?? this.siteUrl,
      updatedAt: raw.updatedAt ?? new Date().toISOString(),
      matchKey,
    };
  }

  getAvailability(raw: RawOffer): Availability {
    return parseAvailability(raw.availability);
  }

  getPrice(raw: RawOffer): number {
    return parsePrice(raw.price);
  }

  getImages(raw: RawOffer): string[] {
    if (raw.images?.length) return raw.images;
    return raw.image ? [raw.image] : [];
  }

  getLastSyncStatus(): SyncSourceResult | null {
    return this.lastStatus;
  }
}

const COLOR_TOKENS = [
  'Deep Blue', 'Cosmic Orange', 'Silver', 'Lavender', 'Mist Blue', 'Sage',
  'White', 'Black', 'Sky Blue', 'Cloud White', 'Light Gold', 'Space Black',
];

function extractColor(title: string): string | undefined {
  const lower = title.toLowerCase();
  return COLOR_TOKENS.find((token) => lower.includes(token.toLowerCase()));
}
