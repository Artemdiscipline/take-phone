import { describe, expect, it } from 'vitest';

import {
  aggregateOffers,
  buildListings,
  buildModelGroups,
  toPublicProducts,
} from '@/lib/catalog/aggregate';
import {
  buildMatchKey,
  buildSlug,
  canonicalColor,
  canonicalConfiguration,
  parseMacModel,
} from '@/lib/catalog/normalize';
import { defaultMarkupRules } from '@/lib/catalog/pricing';
import type { SourceOffer } from '@/lib/catalog/types';
import { buildFixtureOffers } from '@/lib/sources/fixtures/iphone-offers';
import { FirstAppleAdapter } from '@/lib/sources/first-apple';
import { IceAppleAdapter } from '@/lib/sources/ice-apple';
import { Phone24Adapter } from '@/lib/sources/phone24';

/** Полный набор нормализованных предложений из демо-данных. */
async function loadOffers(): Promise<SourceOffer[]> {
  const config = { mode: 'fixtures' as const };
  const adapters = [
    new FirstAppleAdapter(config),
    new IceAppleAdapter(config),
    new Phone24Adapter(config),
  ];

  const batches = await Promise.all(adapters.map((adapter) => adapter.fetchProducts()));
  return batches.flat();
}

describe('нормализация цвета', () => {
  it('сводит написание с «ё» и без к одному значению', () => {
    expect(canonicalColor('космический чёрный')).toBe('Space Black');
    expect(canonicalColor('космический черный')).toBe('Space Black');
    expect(canonicalColor('Space Black')).toBe('Space Black');
  });

  it('одинаково понимает русское и английское название', () => {
    expect(canonicalColor('тёмно-синий')).toBe('Deep Blue');
    expect(canonicalColor('deep blue')).toBe('Deep Blue');
  });
});

describe('объединение предложений', () => {
  it('разные написания одного устройства дают один matchKey', async () => {
    const offers = await loadOffers();

    const deepBlue = offers.filter(
      (item) => item.model === 'iPhone 17 Pro Max'
        && item.memory === 256
        && item.color === 'Deep Blue'
        && item.sim === 'esim',
    );

    expect(deepBlue.length).toBeGreaterThan(1);
    expect(new Set(deepBlue.map((item) => item.matchKey)).size).toBe(1);
  });

  it('вариант с двумя SIM остаётся отдельным товаром', () => {
    const esim = buildMatchKey({
      brand: 'Apple', model: 'iPhone 17', memory: 256, color: 'Black', sim: 'esim',
    });
    const dual = buildMatchKey({
      brand: 'Apple', model: 'iPhone 17', memory: 256, color: 'Black', sim: 'dual-sim',
    });

    expect(esim).not.toBe(dual);
  });

  it('в товар попадают предложения всех источников', async () => {
    const views = aggregateOffers(await loadOffers(), defaultMarkupRules);
    const deepBlue = views.find((view) => view.product.matchKey.includes('deep-blue__esim')
      && view.product.memory === 256
      && view.product.model === 'iPhone 17 Pro Max');

    expect(deepBlue?.offers.length).toBe(3);
    expect(new Set(deepBlue?.offers.map((offer) => offer.source)).size).toBe(3);
  });
});

describe('раздел Mac', () => {
  it('распознаёт линейку, размер и чип из строки прайс-листа', () => {
    expect(parseMacModel('Apple MacBook Pro 14 M4 Pro 512GB Space Black'))
      .toEqual({ model: 'MacBook Pro 14 M4 Pro', generation: 'Pro' });
  });

  it('появляется в общем каталоге с настоящими фотографиями', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const macs = listings.filter((listing) => listing.category === 'mac');

    expect(macs.length).toBeGreaterThan(0);
    expect(macs.every((listing) => /\.(jpg|jpeg|png|webp)$/i.test(listing.image))).toBe(true);
    expect(macs.every((listing) => !listing.image.endsWith('.svg'))).toBe(true);
  });
});

describe('позиции каталога', () => {
  it('slug строится из модели, памяти и цвета', () => {
    expect(buildSlug({ model: 'iPhone 17 Pro Max', memory: 256, color: 'Deep Blue' }))
      .toBe('iphone-17-pro-max-256gb-deep-blue');
  });

  it('slug каждой позиции уникален', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const slugs = listings.map((listing) => listing.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('варианты eSIM и 2 SIM собираются в одну позицию, а не в дубли', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const black = listings.find((listing) => listing.slug === 'iphone-17-256gb-black');

    expect(black).toBeDefined();
    expect(black?.hasSimChoice).toBe(true);
    expect(black?.variants.length).toBe(2);
    expect(new Set(black?.variants.map((variant) => variant.sim)).size).toBe(2);
  });

  it('цена позиции — минимальная среди доступных вариантов', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));

    for (const listing of listings) {
      const available = listing.variants.filter((variant) => variant.availability !== 'out_of_stock');
      const pool = available.length > 0 ? available : listing.variants;

      expect(listing.price).toBe(Math.min(...pool.map((variant) => variant.price)));
    }
  });

  it('вариант по умолчанию действительно принадлежит позиции', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));

    for (const listing of listings) {
      expect(listing.variants.some((variant) => variant.id === listing.defaultVariantId)).toBe(true);
    }
  });
});

describe('публичные данные', () => {
  it('в демо-каталоге нет нарисованных SVG вместо фотографий товара', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));

    expect(listings.every((listing) => !listing.image.endsWith('.svg'))).toBe(true);
  });

  it('в публичном товаре нет поставщика и закупочной цены', async () => {
    const views = aggregateOffers(await loadOffers(), defaultMarkupRules);
    const products = toPublicProducts(views);

    for (const product of products) {
      const serialised = JSON.stringify(product);
      expect(serialised).not.toMatch(/purchasePrice|sourceUrl|"source"/);
    }
  });

  it('позиции каталога не содержат названий поставщиков', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const serialised = JSON.stringify(listings);

    for (const secret of ['First Apple', 'IceApple', 'Phone24', 'first-apple72', 'iceapple.ru', 'phone24.ru']) {
      expect(serialised).not.toContain(secret);
    }
  });

  it('демо-набор описывает все три источника', () => {
    for (const source of ['first-apple', 'ice-apple', 'phone24'] as const) {
      expect(buildFixtureOffers(source).length).toBeGreaterThan(0);
    }
  });
});

describe('модельные плашки', () => {
  it('собираются из данных: каждая модель каталога получает свою плашку', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const groups = buildModelGroups(listings);

    // Ни одна модель из данных не потеряна и ни одна не выдумана.
    expect(new Set(groups.map((group) => group.modelSlug)))
      .toEqual(new Set(listings.map((listing) => listing.modelSlug)));

    for (const group of groups) {
      const own = listings.filter((listing) => listing.modelSlug === group.modelSlug);
      expect(group.listingCount).toBe(own.length);
    }
  });

  it('цена плашки — самый дешёвый доступный вариант модели', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));

    for (const group of buildModelGroups(listings)) {
      const available = listings.filter(
        (listing) => listing.modelSlug === group.modelSlug
          && listing.availability !== 'out_of_stock',
      );

      // Раскупленная модель не показывает цену: она была бы недостижимой.
      if (available.length === 0) expect(group.price).toBeNull();
      else expect(group.price).toBe(Math.min(...available.map((listing) => listing.price)));
    }
  });

  it('iPhone идут от новых к старым, а Ultra остаётся первым среди часов', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const groups = buildModelGroups(listings);

    const iphones = groups.filter((group) => group.categorySlug === 'iphone');
    expect(iphones.slice(0, 4).map((group) => group.modelSlug)).toEqual([
      'iphone-17-pro-max',
      'iphone-17-pro',
      'iphone-air',
      'iphone-17',
    ]);

    const watches = groups.filter((group) => group.categorySlug === 'apple-watch');
    expect(watches[0].modelName).toContain('Ultra');
  });

  it('адрес плашки ведёт в свою категорию', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));

    for (const group of buildModelGroups(listings)) {
      expect(group.href).toBe(`/catalog/${group.categorySlug}/${group.modelSlug}`);
    }
  });
});

describe('часы', () => {
  it('размер корпуса и ремешок остаются отдельными позициями', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const se = listings.filter((listing) => listing.modelSlug === 'apple-watch-se-2');

    expect(new Set(se.map((listing) => listing.caseSize)).size).toBeGreaterThan(1);
    expect(new Set(se.map((listing) => listing.configuration)).size).toBeGreaterThan(1);
    // Позиции, различающиеся корпусом или ремешком, не сливаются в одну.
    expect(new Set(se.map((listing) => listing.slug)).size).toBe(se.length);
  });

  it('GPS и GPS + Cellular остаются разными вариантами одной позиции', async () => {
    const listings = buildListings(aggregateOffers(await loadOffers(), defaultMarkupRules));
    const withCellular = listings.find(
      (listing) => listing.category === 'watch'
        && listing.variants.some((variant) => variant.sim === 'gps-cellular')
        && listing.variants.some((variant) => variant.sim === 'gps'),
    );

    expect(withCellular).toBeDefined();
    expect(new Set(withCellular?.variants.map((variant) => variant.sim)).size).toBe(2);
  });
});

describe('комплектации', () => {
  it('известное написание ремешка сводится к одному значению', () => {
    expect(canonicalConfiguration('спортивный ремешок')).toBe('Sport Band');
    expect(canonicalConfiguration('Sport Band')).toBe('Sport Band');
  });

  it('незнакомая комплектация сохраняет написание источника', () => {
    // «16 ГБ ОЗУ» превращалось в «16 Гб Озу» из-за приведения к Title Case.
    expect(canonicalConfiguration('16 ГБ ОЗУ')).toBe('16 ГБ ОЗУ');
    expect(canonicalConfiguration('  24 ГБ   ОЗУ ')).toBe('24 ГБ ОЗУ');
  });
});
