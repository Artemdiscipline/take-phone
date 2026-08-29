import { describe, expect, it } from 'vitest';

import {
  applyCardFee,
  cardFeeAmount,
  computePublicPrice,
  defaultMarkupRules,
  modelKey,
  pickBestOffer,
  resolveAvailability,
  resolveMarkup,
} from '@/lib/catalog/pricing';
import type { MarkupRules, SourceOffer } from '@/lib/catalog/types';
import { terms } from '@/lib/site';

function offer(patch: Partial<SourceOffer> = {}): SourceOffer {
  return {
    id: 'first-apple:1',
    externalId: '1',
    source: 'first-apple',
    brand: 'Apple',
    model: 'iPhone 17 Pro Max',
    generation: 'Pro Max',
    memory: 256,
    color: 'Deep Blue',
    sim: 'esim',
    category: 'iphone',
    images: [],
    purchasePrice: 114_990,
    availability: 'in_stock',
    city: 'Тюмень',
    sourceUrl: 'https://example.test/',
    updatedAt: '2026-08-29T00:00:00.000Z',
    matchKey: 'apple__iphone-17-pro-max__256gb__deep-blue__esim',
    ...patch,
  };
}

describe('приоритет наценки', () => {
  const rules: MarkupRules = {
    global: 5_000,
    byCategory: { iphone: 6_000 },
    byModel: { 'apple iphone 17 pro max': 7_000 },
    byProduct: { 'product-key': 8_000 },
  };

  const target = {
    matchKey: 'product-key',
    brand: 'Apple',
    model: 'iPhone 17 Pro Max',
    category: 'iphone' as const,
  };

  it('правило товара сильнее всех остальных', () => {
    expect(resolveMarkup(rules, target)).toEqual({ markup: 8_000, level: 'product' });
  });

  it('без правила товара применяется правило модели', () => {
    expect(resolveMarkup({ ...rules, byProduct: {} }, target))
      .toEqual({ markup: 7_000, level: 'model' });
  });

  it('дальше идёт категория', () => {
    expect(resolveMarkup({ ...rules, byProduct: {}, byModel: {} }, target))
      .toEqual({ markup: 6_000, level: 'category' });
  });

  it('в последнюю очередь — глобальная наценка', () => {
    expect(resolveMarkup({ ...rules, byProduct: {}, byModel: {}, byCategory: {} }, target))
      .toEqual({ markup: 5_000, level: 'global' });
  });

  it('глобальная наценка по умолчанию — 5 000 ₽', () => {
    expect(defaultMarkupRules.global).toBe(5_000);
  });

  it('ключ модели не зависит от регистра', () => {
    expect(modelKey('Apple', 'iPhone 17 Pro Max')).toBe('apple iphone 17 pro max');
  });
});

describe('выбор поставщика', () => {
  it('берёт самое дешёвое предложение в наличии', () => {
    const best = pickBestOffer([
      offer({ id: 'a', purchasePrice: 116_000 }),
      offer({ id: 'b', purchasePrice: 114_000 }),
      offer({ id: 'c', purchasePrice: 110_000, availability: 'out_of_stock' }),
    ]);

    expect(best?.id).toBe('b');
  });

  it('игнорирует более дешёвое предложение, которого нет в наличии', () => {
    const best = pickBestOffer([
      offer({ id: 'a', purchasePrice: 120_000 }),
      offer({ id: 'b', purchasePrice: 100_000, availability: 'out_of_stock' }),
    ]);

    expect(best?.id).toBe('a');
  });

  it('переходит к «под заказ», когда в наличии ничего нет', () => {
    const best = pickBestOffer([
      offer({ id: 'a', purchasePrice: 120_000, availability: 'out_of_stock' }),
      offer({ id: 'b', purchasePrice: 130_000, availability: 'to_order' }),
    ]);

    expect(best?.id).toBe('b');
  });

  it('возвращает null, когда доступных предложений нет', () => {
    expect(pickBestOffer([offer({ availability: 'out_of_stock' })])).toBeNull();
  });

  it('наличие агрегируется по лучшему статусу', () => {
    expect(resolveAvailability([
      offer({ availability: 'out_of_stock' }),
      offer({ availability: 'in_stock' }),
    ])).toBe('in_stock');

    expect(resolveAvailability([
      offer({ availability: 'out_of_stock' }),
      offer({ availability: 'to_order' }),
    ])).toBe('to_order');
  });
});

describe('конечная цена', () => {
  it('складывается из закупки и наценки', () => {
    expect(computePublicPrice(114_990, 5_000, 'in_stock')).toBe(119_990);
  });

  it('для «под заказ» вычитается скидка 1 000 ₽', () => {
    expect(computePublicPrice(114_990, 5_000, 'to_order')).toBe(118_990);
    expect(terms.preorderDiscount).toBe(1_000);
  });

  it('скидку «под заказ» можно отключить', () => {
    expect(computePublicPrice(114_990, 5_000, 'to_order', { preorderDiscountEnabled: false }))
      .toBe(119_990);
  });

  it('никогда не уходит ниже нуля', () => {
    expect(computePublicPrice(0, 0, 'to_order')).toBe(0);
  });
});

describe('комиссия по карте', () => {
  it('увеличивает сумму на заданную ставку', () => {
    expect(applyCardFee(100_000)).toBe(Math.round(100_000 * (1 + terms.cardFeeRate)));
  });

  it('по умолчанию это 13,5 %', () => {
    expect(terms.cardFeeRate).toBe(0.135);
    expect(applyCardFee(119_990)).toBe(136_189);
  });

  it('сумма комиссии равна разнице с базовой стоимостью', () => {
    expect(cardFeeAmount(119_990)).toBe(applyCardFee(119_990) - 119_990);
  });
});
