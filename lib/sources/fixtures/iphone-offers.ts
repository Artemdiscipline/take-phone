import type { RawOffer, SourceId } from '@/lib/catalog/types';

/**
 * Demo dataset used while no real price-list integration is agreed with the
 * sources. It is deliberately shaped like a wholesale feed — every row is a
 * *source* offer, not a finished catalogue entry — so the aggregation, markup
 * and deduplication code paths behave exactly as they will in production.
 *
 * Prices are demonstration values, not real wholesale quotes.
 */
interface FixtureSku {
  key: string;
  model: string;
  memory: number;
  color: string;
  sim: 'esim' | 'dual';
  /** Lowest demo purchase price across sources. */
  basePrice: number;
  /** Retail reference published by some sources; omitted when there is none. */
  reference?: number;
  /** Which sources carry the SKU and in what state. */
  lines: Partial<Record<SourceId, { delta: number; state: 'in' | 'order' | 'out' }>>;
}

const SKUS: FixtureSku[] = [
  {
    key: '17pm-256-deepblue', model: 'iPhone 17 Pro Max', memory: 256, color: 'Deep Blue', sim: 'esim',
    basePrice: 114_990, reference: 126_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 1_500, state: 'in' }, phone24: { delta: 900, state: 'in' } },
  },
  {
    key: '17pm-256-orange', model: 'iPhone 17 Pro Max', memory: 256, color: 'Cosmic Orange', sim: 'esim',
    basePrice: 115_490,
    lines: { 'first-apple': { delta: 700, state: 'in' }, 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_400, state: 'out' } },
  },
  {
    key: '17pm-256-silver', model: 'iPhone 17 Pro Max', memory: 256, color: 'Silver', sim: 'esim',
    basePrice: 114_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_200, state: 'in' } },
  },
  {
    key: '17pm-512-deepblue', model: 'iPhone 17 Pro Max', memory: 512, color: 'Deep Blue', sim: 'esim',
    basePrice: 134_990, reference: 145_990,
    lines: { 'first-apple': { delta: 1_000, state: 'out' }, 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_500, state: 'in' } },
  },
  {
    key: '17pm-512-orange', model: 'iPhone 17 Pro Max', memory: 512, color: 'Cosmic Orange', sim: 'esim',
    basePrice: 135_490,
    lines: { 'ice-apple': { delta: 0, state: 'order' }, phone24: { delta: 800, state: 'order' } },
  },
  {
    key: '17pm-1024-deepblue', model: 'iPhone 17 Pro Max', memory: 1024, color: 'Deep Blue', sim: 'esim',
    basePrice: 164_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 2_500, state: 'order' } },
  },
  {
    key: '17pm-256-deepblue-dual', model: 'iPhone 17 Pro Max', memory: 256, color: 'Deep Blue', sim: 'dual',
    basePrice: 121_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_100, state: 'order' } },
  },

  {
    key: '17p-256-deepblue', model: 'iPhone 17 Pro', memory: 256, color: 'Deep Blue', sim: 'esim',
    basePrice: 104_990, reference: 115_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 500, state: 'in' }, phone24: { delta: 1_200, state: 'out' } },
  },
  {
    key: '17p-256-silver', model: 'iPhone 17 Pro', memory: 256, color: 'Silver', sim: 'esim',
    basePrice: 104_490,
    lines: { 'first-apple': { delta: 600, state: 'in' }, 'ice-apple': { delta: 0, state: 'in' } },
  },
  {
    key: '17p-256-orange', model: 'iPhone 17 Pro', memory: 256, color: 'Cosmic Orange', sim: 'esim',
    basePrice: 105_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 900, state: 'in' } },
  },
  {
    key: '17p-512-deepblue', model: 'iPhone 17 Pro', memory: 512, color: 'Deep Blue', sim: 'esim',
    basePrice: 124_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_600, state: 'in' } },
  },
  {
    key: '17p-512-silver', model: 'iPhone 17 Pro', memory: 512, color: 'Silver', sim: 'esim',
    basePrice: 125_490,
    lines: { 'first-apple': { delta: 0, state: 'order' } },
  },

  {
    key: '17-256-lavender', model: 'iPhone 17', memory: 256, color: 'Lavender', sim: 'esim',
    basePrice: 79_990, reference: 87_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 800, state: 'in' }, phone24: { delta: 500, state: 'in' } },
  },
  {
    key: '17-256-mistblue', model: 'iPhone 17', memory: 256, color: 'Mist Blue', sim: 'esim',
    basePrice: 79_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 700, state: 'in' } },
  },
  {
    key: '17-256-sage', model: 'iPhone 17', memory: 256, color: 'Sage', sim: 'esim',
    basePrice: 80_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 400, state: 'out' } },
  },
  {
    key: '17-256-black', model: 'iPhone 17', memory: 256, color: 'Black', sim: 'esim',
    basePrice: 79_490,
    lines: { 'first-apple': { delta: 300, state: 'in' }, 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_000, state: 'in' } },
  },
  {
    key: '17-256-white', model: 'iPhone 17', memory: 256, color: 'White', sim: 'esim',
    basePrice: 79_490,
    lines: { phone24: { delta: 0, state: 'in' }, 'first-apple': { delta: 900, state: 'out' } },
  },
  {
    key: '17-512-lavender', model: 'iPhone 17', memory: 512, color: 'Lavender', sim: 'esim',
    basePrice: 94_990,
    lines: { 'first-apple': { delta: 0, state: 'order' }, 'ice-apple': { delta: 1_200, state: 'order' } },
  },
  {
    key: '17-512-black', model: 'iPhone 17', memory: 512, color: 'Black', sim: 'esim',
    basePrice: 94_990, reference: 102_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_300, state: 'in' } },
  },
  {
    key: '17-256-black-dual', model: 'iPhone 17', memory: 256, color: 'Black', sim: 'dual',
    basePrice: 85_990,
    lines: { phone24: { delta: 0, state: 'in' }, 'ice-apple': { delta: 900, state: 'out' } },
  },

  {
    key: 'air-256-skyblue', model: 'iPhone Air', memory: 256, color: 'Sky Blue', sim: 'esim',
    basePrice: 94_990, reference: 103_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 600, state: 'in' } },
  },
  {
    key: 'air-256-spaceblack', model: 'iPhone Air', memory: 256, color: 'Space Black', sim: 'esim',
    basePrice: 94_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_100, state: 'in' } },
  },
  {
    key: 'air-256-cloudwhite', model: 'iPhone Air', memory: 256, color: 'Cloud White', sim: 'esim',
    basePrice: 94_990,
    lines: { 'first-apple': { delta: 0, state: 'order' }, phone24: { delta: 700, state: 'out' } },
  },
  {
    key: 'air-512-lightgold', model: 'iPhone Air', memory: 512, color: 'Light Gold', sim: 'esim',
    basePrice: 114_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, 'first-apple': { delta: 1_800, state: 'in' } },
  },
  {
    key: 'air-512-spaceblack', model: 'iPhone Air', memory: 512, color: 'Space Black', sim: 'esim',
    basePrice: 114_490,
    lines: { 'first-apple': { delta: 0, state: 'out' }, phone24: { delta: 900, state: 'order' } },
  },
  {
    // Sold out everywhere — keeps the "Нет в наличии" state represented.
    key: 'air-512-cloudwhite', model: 'iPhone Air', memory: 512, color: 'Cloud White', sim: 'esim',
    basePrice: 114_990,
    lines: { 'first-apple': { delta: 0, state: 'out' }, 'ice-apple': { delta: 800, state: 'out' } },
  },

  /*
    Прошлые поколения и «доступная» модель линейки. Нужны, чтобы каталог
    показывал не одну актуальную серию, а нормальную сетку моделей — и чтобы
    было видно, как новая модель из прайс-листа сама встаёт в правильное место.
  */
  {
    key: '16e-128-black', model: 'iPhone 16e', memory: 128, color: 'Black', sim: 'esim',
    basePrice: 54_990, reference: 59_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 600, state: 'in' }, phone24: { delta: 400, state: 'in' } },
  },
  {
    key: '16e-128-white', model: 'iPhone 16e', memory: 128, color: 'White', sim: 'esim',
    basePrice: 54_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 700, state: 'in' } },
  },
  {
    key: '16e-256-black', model: 'iPhone 16e', memory: 256, color: 'Black', sim: 'esim',
    basePrice: 62_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 900, state: 'order' } },
  },

  {
    key: '16pm-256-blacktitanium', model: 'iPhone 16 Pro Max', memory: 256, color: 'Black Titanium', sim: 'esim',
    basePrice: 99_990, reference: 112_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 1_100, state: 'in' }, phone24: { delta: 600, state: 'in' } },
  },
  {
    key: '16pm-256-naturaltitanium', model: 'iPhone 16 Pro Max', memory: 256, color: 'Natural Titanium', sim: 'esim',
    basePrice: 100_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 800, state: 'out' } },
  },
  {
    key: '16pm-512-deserttitanium', model: 'iPhone 16 Pro Max', memory: 512, color: 'Desert Titanium', sim: 'esim',
    basePrice: 119_990,
    lines: { 'first-apple': { delta: 0, state: 'order' }, 'ice-apple': { delta: 1_400, state: 'order' } },
  },
  {
    key: '16pm-256-blacktitanium-dual', model: 'iPhone 16 Pro Max', memory: 256, color: 'Black Titanium', sim: 'dual',
    basePrice: 106_990,
    lines: { phone24: { delta: 0, state: 'in' }, 'ice-apple': { delta: 900, state: 'order' } },
  },

  {
    key: '16p-256-blacktitanium', model: 'iPhone 16 Pro', memory: 256, color: 'Black Titanium', sim: 'esim',
    basePrice: 89_990, reference: 99_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 700, state: 'in' } },
  },
  {
    key: '16p-256-naturaltitanium', model: 'iPhone 16 Pro', memory: 256, color: 'Natural Titanium', sim: 'esim',
    basePrice: 90_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, 'first-apple': { delta: 1_200, state: 'out' } },
  },

  {
    key: '16plus-128-ultramarine', model: 'iPhone 16 Plus', memory: 128, color: 'Ultramarine', sim: 'esim',
    basePrice: 71_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 500, state: 'in' } },
  },
  {
    key: '16plus-256-teal', model: 'iPhone 16 Plus', memory: 256, color: 'Teal', sim: 'esim',
    basePrice: 79_490,
    lines: { phone24: { delta: 0, state: 'order' }, 'ice-apple': { delta: 800, state: 'order' } },
  },

  {
    key: '16-128-ultramarine', model: 'iPhone 16', memory: 128, color: 'Ultramarine', sim: 'esim',
    basePrice: 63_990, reference: 71_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 700, state: 'in' }, phone24: { delta: 400, state: 'in' } },
  },
  {
    key: '16-128-black', model: 'iPhone 16', memory: 128, color: 'Black', sim: 'esim',
    basePrice: 63_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 900, state: 'in' } },
  },
  {
    key: '16-256-teal', model: 'iPhone 16', memory: 256, color: 'Teal', sim: 'esim',
    basePrice: 71_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 600, state: 'out' } },
  },
  {
    key: '16-256-pink', model: 'iPhone 16', memory: 256, color: 'Pink', sim: 'esim',
    basePrice: 71_990,
    lines: { phone24: { delta: 0, state: 'in' } },
  },
];

const STATE_LABELS = {
  'first-apple': { in: 'в наличии', order: 'под заказ', out: 'нет в наличии' },
  'ice-apple': { in: 'да', order: 'ожидается', out: 'нет' },
  phone24: { in: 'instock', order: 'preorder', out: 'outofstock' },
} as const;

/** Minutes since the last refresh, per source — drives the freshness labels. */
const STALENESS_MINUTES: Record<SourceId, number> = {
  'first-apple': 4,
  'ice-apple': 9,
  phone24: 17,
};

const COLOR_RU_FIXTURE: Record<string, string> = {
  'Deep Blue': 'тёмно-синий',
  'Cosmic Orange': 'космический оранжевый',
  Silver: 'серебристый',
  Lavender: 'лавандовый',
  'Mist Blue': 'голубой',
  Sage: 'шалфей',
  White: 'белый',
  Black: 'чёрный',
  'Sky Blue': 'небесно-голубой',
  'Cloud White': 'белое облако',
  'Light Gold': 'светлое золото',
  'Space Black': 'космический чёрный',
  'Black Titanium': 'чёрный титан',
  'Natural Titanium': 'натуральный титан',
  'Desert Titanium': 'песчаный титан',
  Ultramarine: 'ультрамарин',
  Teal: 'бирюзовый',
  Pink: 'розовый',
};

function memoryLabel(memory: number): string {
  return memory >= 1024 ? `${memory / 1024}TB` : `${memory}GB`;
}

/**
 * Each source publishes its catalogue in its own wording. The fixtures keep
 * those differences so the normaliser is exercised the same way it will be
 * against real feeds.
 */
export function buildFixtureOffers(source: SourceId, now = Date.now()): RawOffer[] {
  const updatedAt = new Date(now - STALENESS_MINUTES[source] * 60_000).toISOString();

  return SKUS.flatMap((sku): RawOffer[] => {
    const line = sku.lines[source];
    if (!line) return [];

    const price = sku.basePrice + line.delta;
    const externalId = `${source}-${sku.key}`;
    const availability = STATE_LABELS[source][line.state];
    const simLabel = sku.sim === 'dual' ? 'dual-sim' : 'esim';

    if (source === 'first-apple') {
      return [{
        externalId,
        title: `Apple ${sku.model} ${memoryLabel(sku.memory)} ${sku.color}`,
        memory: memoryLabel(sku.memory),
        color: sku.color,
        sim: simLabel,
        price,
        oldPrice: sku.reference,
        availability,
        url: 'https://first-apple72.ru/',
        updatedAt,
      }];
    }

    if (source === 'ice-apple') {
      return [{
        externalId,
        title: `${sku.model} ${sku.memory >= 1024 ? `${sku.memory / 1024} ТБ` : `${sku.memory} ГБ`} ${COLOR_RU_FIXTURE[sku.color]}`,
        memory: sku.memory >= 1024 ? `${sku.memory / 1024} ТБ` : `${sku.memory} ГБ`,
        color: COLOR_RU_FIXTURE[sku.color],
        sim: simLabel,
        price: `${price} руб.`,
        oldPrice: sku.reference,
        availability,
        url: 'https://iceapple.ru/',
        updatedAt,
      }];
    }

    return [{
      externalId,
      title: `Смартфон Apple ${sku.model} ${memoryLabel(sku.memory)} ${sku.color} (${sku.sim === 'dual' ? '2 SIM' : 'eSIM'})`,
      memory: sku.memory,
      color: sku.color,
      price,
      availability,
      url: 'https://phone24.ru/',
      updatedAt,
    }];
  });
}
