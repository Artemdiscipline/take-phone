import type { RawOffer } from '@/lib/catalog/types';
import { BaseSourceAdapter } from './adapter';
import { buildFixtureOffers } from './fixtures/iphone-offers';
import { buildWatchFixtureOffers } from './fixtures/watch-offers';
import { buildMacFixtureOffers } from './fixtures/mac-offers';

/**
 * 1C-Bitrix storefront. Publishes English finishes with a machine-readable
 * availability flag and encodes the SIM type in the title.
 */
export class Phone24Adapter extends BaseSourceAdapter {
  readonly id = 'phone24' as const;
  readonly displayName = 'Phone24';
  readonly siteUrl = 'https://phone24.ru/';

  protected async loadFixtures(): Promise<RawOffer[]> {
    return [
      ...buildFixtureOffers(this.id),
      ...buildWatchFixtureOffers(this.id),
      ...buildMacFixtureOffers(this.id),
    ];
  }
}
