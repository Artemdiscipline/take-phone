import type { RawOffer } from '@/lib/catalog/types';
import { BaseSourceAdapter } from './adapter';
import { buildFixtureOffers } from './fixtures/iphone-offers';
import { buildWatchFixtureOffers } from './fixtures/watch-offers';
import { buildMacFixtureOffers } from './fixtures/mac-offers';

/**
 * OpenCart storefront. Titles and finishes are in Russian and prices arrive as
 * formatted strings, which the shared normaliser converts.
 */
export class IceAppleAdapter extends BaseSourceAdapter {
  readonly id = 'ice-apple' as const;
  readonly displayName = 'IceApple';
  readonly siteUrl = 'https://iceapple.ru/';

  protected async loadFixtures(): Promise<RawOffer[]> {
    return [
      ...buildFixtureOffers(this.id),
      ...buildWatchFixtureOffers(this.id),
      ...buildMacFixtureOffers(this.id),
    ];
  }
}
