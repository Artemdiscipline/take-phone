import type { RawOffer } from '@/lib/catalog/types';
import { BaseSourceAdapter } from './adapter';
import { buildFixtureOffers } from './fixtures/iphone-offers';

/**
 * 1C-Bitrix storefront. Availability is published as Russian text and memory
 * sits inside the title, so both are normalised by the base adapter.
 */
export class FirstAppleAdapter extends BaseSourceAdapter {
  readonly id = 'first-apple' as const;
  readonly displayName = 'First Apple';
  readonly siteUrl = 'https://first-apple72.ru/';

  protected async loadFixtures(): Promise<RawOffer[]> {
    return buildFixtureOffers(this.id);
  }
}
