import {
  buildMatchKey,
  buildModelSlug,
  canonicalColor,
  canonicalConfiguration,
  parseAvailability,
  parseCaseSize,
  parseDeviceModel,
  parseMemory,
  parsePrice,
  parseSim,
} from '@/lib/catalog/normalize';
import type {
  Availability,
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
    const parsed = parseDeviceModel(raw.title);
    if (!parsed) return null;

    const caseSize = parseCaseSize(raw.caseSize ?? (parsed.category === 'watch' ? raw.title : undefined));
    const memory = parseMemory(raw.memory ?? raw.title);

    // Телефон без объёма памяти — это неразобранная строка прайса. У часов
    // памяти нет вовсе, но обязателен размер корпуса: без него варианты
    // «40 мм» и «44 мм» слились бы в один.
    if (parsed.category === 'watch') {
      if (!caseSize) return null;
    } else if (!memory) {
      return null;
    }

    const color = canonicalColor(raw.color ?? extractColor(raw.title));
    const sim = parseSim(raw.sim, raw.title);
    const configuration = canonicalConfiguration(raw.configuration);
    const brand = 'Apple';
    const normalizedMemory = parsed.category === 'watch' ? 0 : memory;

    const matchKey = buildMatchKey({
      brand,
      model: parsed.model,
      memory: normalizedMemory,
      color,
      sim,
      caseSize,
      configuration,
    });

    return {
      id: `${this.id}:${raw.externalId}`,
      externalId: raw.externalId,
      source: this.id,
      brand,
      model: parsed.model,
      modelSlug: buildModelSlug(parsed.model),
      generation: parsed.generation,
      memory: normalizedMemory,
      color,
      sim,
      caseSize,
      configuration,
      category: parsed.category,
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
  // Составные названия идут первыми: иначе «Space Black» распознался бы как «Black».
  'Deep Blue', 'Cosmic Orange', 'Mist Blue', 'Sky Blue', 'Cloud White',
  'Light Gold', 'Space Black', 'Natural Titanium', 'Black Titanium',
  'Jet Black', 'Rose Gold', 'Slate Gray', 'Black Titanium', 'Natural Titanium',
  'Desert Titanium', 'White Titanium',
  'Lavender', 'Sage', 'Midnight', 'Starlight', 'Ultramarine', 'Teal', 'Pink',
  'Silver', 'White', 'Black',
];

function extractColor(title: string): string | undefined {
  const lower = title.toLowerCase();
  return COLOR_TOKENS.find((token) => lower.includes(token.toLowerCase()));
}
