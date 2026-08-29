import type { RawOffer, SourceId } from '@/lib/catalog/types';

/**
 * Демонстрационный набор Apple Watch.
 *
 * Реальные прайс-листы по часам с источниками пока не согласованы, поэтому
 * категория наполнена демо-данными. Набор намеренно устроен как выгрузка
 * поставщика — каждая строка это предложение источника, а не готовая позиция
 * витрины, — чтобы объединение, наценка и дедупликация работали ровно так же,
 * как будут работать на настоящем фиде.
 *
 * Цены здесь демонстрационные и не являются закупочными котировками.
 * В интерфейсе категория помечена как демонстрационная.
 */
interface WatchSku {
  key: string;
  model: string;
  /** Диаметр корпуса в миллиметрах. */
  caseSize: number;
  /** Цвет корпуса. */
  color: string;
  /** Комплектация — ремешок. */
  band: string;
  /** GPS или GPS + Cellular. */
  connectivity: 'gps' | 'cellular';
  basePrice: number;
  reference?: number;
  lines: Partial<Record<SourceId, { delta: number; state: 'in' | 'order' | 'out' }>>;
}

const SKUS: WatchSku[] = [
  /* ------------------------------------------------------- Apple Watch Ultra 2 */
  {
    key: 'ultra2-49-natural-ocean', model: 'Apple Watch Ultra 2', caseSize: 49,
    color: 'Natural Titanium', band: 'Ocean Band', connectivity: 'cellular',
    basePrice: 79_990, reference: 89_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 1_200, state: 'in' }, phone24: { delta: 900, state: 'in' } },
  },
  {
    key: 'ultra2-49-natural-alpine', model: 'Apple Watch Ultra 2', caseSize: 49,
    color: 'Natural Titanium', band: 'Alpine Loop', connectivity: 'cellular',
    basePrice: 81_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_100, state: 'order' } },
  },
  {
    key: 'ultra2-49-natural-trail', model: 'Apple Watch Ultra 2', caseSize: 49,
    color: 'Natural Titanium', band: 'Trail Loop', connectivity: 'cellular',
    basePrice: 80_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_400, state: 'out' } },
  },
  {
    key: 'ultra2-49-black-ocean', model: 'Apple Watch Ultra 2', caseSize: 49,
    color: 'Black Titanium', band: 'Ocean Band', connectivity: 'cellular',
    basePrice: 82_490, reference: 92_990,
    lines: { 'first-apple': { delta: 700, state: 'in' }, 'ice-apple': { delta: 0, state: 'in' } },
  },
  {
    key: 'ultra2-49-black-alpine', model: 'Apple Watch Ultra 2', caseSize: 49,
    color: 'Black Titanium', band: 'Alpine Loop', connectivity: 'cellular',
    basePrice: 83_990,
    lines: { 'ice-apple': { delta: 0, state: 'order' }, phone24: { delta: 600, state: 'order' } },
  },

  /* ---------------------------------------------------- Apple Watch Series 10 */
  {
    key: 's10-46-jetblack-sportband', model: 'Apple Watch Series 10', caseSize: 46,
    color: 'Jet Black', band: 'Sport Band', connectivity: 'gps',
    basePrice: 44_990, reference: 49_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 800, state: 'in' }, phone24: { delta: 500, state: 'in' } },
  },
  {
    key: 's10-46-jetblack-sportband-cell', model: 'Apple Watch Series 10', caseSize: 46,
    color: 'Jet Black', band: 'Sport Band', connectivity: 'cellular',
    basePrice: 52_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_100, state: 'order' } },
  },
  {
    key: 's10-46-silver-milanese', model: 'Apple Watch Series 10', caseSize: 46,
    color: 'Silver', band: 'Milanese Loop', connectivity: 'cellular',
    basePrice: 61_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 1_500, state: 'in' } },
  },
  {
    key: 's10-42-jetblack-sportloop', model: 'Apple Watch Series 10', caseSize: 42,
    color: 'Jet Black', band: 'Sport Loop', connectivity: 'gps',
    basePrice: 41_990,
    lines: { 'first-apple': { delta: 400, state: 'in' }, phone24: { delta: 0, state: 'in' } },
  },
  {
    key: 's10-42-rosegold-sportband', model: 'Apple Watch Series 10', caseSize: 42,
    color: 'Rose Gold', band: 'Sport Band', connectivity: 'gps',
    basePrice: 42_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, 'first-apple': { delta: 900, state: 'out' } },
  },
  {
    key: 's10-42-silver-sportloop', model: 'Apple Watch Series 10', caseSize: 42,
    color: 'Silver', band: 'Sport Loop', connectivity: 'gps',
    basePrice: 41_490,
    lines: { phone24: { delta: 0, state: 'in' }, 'ice-apple': { delta: 700, state: 'in' } },
  },

  /* -------------------------------------------------------- Apple Watch SE 2 */
  {
    key: 'se2-44-midnight-sportband', model: 'Apple Watch SE 2', caseSize: 44,
    color: 'Midnight', band: 'Sport Band', connectivity: 'gps',
    basePrice: 26_990, reference: 29_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 600, state: 'in' }, phone24: { delta: 300, state: 'in' } },
  },
  {
    key: 'se2-44-midnight-sportloop', model: 'Apple Watch SE 2', caseSize: 44,
    color: 'Midnight', band: 'Sport Loop', connectivity: 'gps',
    basePrice: 27_490,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 500, state: 'in' } },
  },
  {
    key: 'se2-44-starlight-sportband', model: 'Apple Watch SE 2', caseSize: 44,
    color: 'Starlight', band: 'Sport Band', connectivity: 'gps',
    basePrice: 26_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 800, state: 'out' } },
  },
  {
    key: 'se2-44-midnight-sportband-cell', model: 'Apple Watch SE 2', caseSize: 44,
    color: 'Midnight', band: 'Sport Band', connectivity: 'cellular',
    basePrice: 33_490,
    lines: { 'ice-apple': { delta: 0, state: 'order' }, 'first-apple': { delta: 900, state: 'order' } },
  },
  {
    key: 'se2-40-starlight-sportband', model: 'Apple Watch SE 2', caseSize: 40,
    color: 'Starlight', band: 'Sport Band', connectivity: 'gps',
    basePrice: 23_990, reference: 26_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 400, state: 'in' } },
  },
  {
    key: 'se2-40-midnight-sportloop', model: 'Apple Watch SE 2', caseSize: 40,
    color: 'Midnight', band: 'Sport Loop', connectivity: 'gps',
    basePrice: 24_490,
    lines: { phone24: { delta: 0, state: 'in' }, 'first-apple': { delta: 700, state: 'in' } },
  },
  {
    // Раскуплены везде — состояние «нет в наличии» тоже должно быть представлено.
    key: 'se2-40-starlight-sportloop', model: 'Apple Watch SE 2', caseSize: 40,
    color: 'Starlight', band: 'Sport Loop', connectivity: 'gps',
    basePrice: 24_490,
    lines: { 'ice-apple': { delta: 0, state: 'out' }, phone24: { delta: 500, state: 'out' } },
  },
];

const STATE_LABELS = {
  'first-apple': { in: 'в наличии', order: 'под заказ', out: 'нет в наличии' },
  'ice-apple': { in: 'да', order: 'ожидается', out: 'нет' },
  phone24: { in: 'instock', order: 'preorder', out: 'outofstock' },
} as const;

/** Насколько давно обновлялся каждый источник — из этого берутся метки свежести. */
const STALENESS_MINUTES: Record<SourceId, number> = {
  'first-apple': 4,
  'ice-apple': 9,
  phone24: 17,
};

const COLOR_RU_FIXTURE: Record<string, string> = {
  'Natural Titanium': 'натуральный титан',
  'Black Titanium': 'чёрный титан',
  'Jet Black': 'глубокий чёрный',
  'Rose Gold': 'розовое золото',
  Silver: 'серебристый',
  Midnight: 'тёмная ночь',
  Starlight: 'сияющая звезда',
};

const BAND_RU_FIXTURE: Record<string, string> = {
  'Sport Band': 'спортивный ремешок',
  'Sport Loop': 'спортивный браслет',
  'Ocean Band': 'океанский ремешок',
  'Alpine Loop': 'альпийская петля',
  'Trail Loop': 'трейловая петля',
  'Milanese Loop': 'миланский браслет',
};

/**
 * Каждый источник описывает часы своими словами: где-то размер корпуса стоит
 * в названии, где-то в отдельном поле. Различия сохранены намеренно — на них
 * проверяется нормализатор.
 */
export function buildWatchFixtureOffers(source: SourceId, now = Date.now()): RawOffer[] {
  const updatedAt = new Date(now - STALENESS_MINUTES[source] * 60_000).toISOString();

  return SKUS.flatMap((sku): RawOffer[] => {
    const line = sku.lines[source];
    if (!line) return [];

    const price = sku.basePrice + line.delta;
    const externalId = `${source}-${sku.key}`;
    const availability = STATE_LABELS[source][line.state];
    const connectivity = sku.connectivity === 'cellular' ? 'GPS + Cellular' : 'GPS';

    if (source === 'first-apple') {
      return [{
        externalId,
        title: `Apple ${sku.model} ${sku.caseSize}mm ${sku.color} ${sku.band} ${connectivity}`,
        caseSize: `${sku.caseSize}mm`,
        color: sku.color,
        configuration: sku.band,
        sim: connectivity,
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
        title: `${sku.model} ${sku.caseSize} мм ${COLOR_RU_FIXTURE[sku.color]}, ${BAND_RU_FIXTURE[sku.band]}`,
        caseSize: `${sku.caseSize} мм`,
        color: COLOR_RU_FIXTURE[sku.color],
        configuration: BAND_RU_FIXTURE[sku.band],
        sim: sku.connectivity === 'cellular' ? 'сотовая связь' : 'GPS',
        price: `${price} руб.`,
        oldPrice: sku.reference,
        availability,
        url: 'https://iceapple.ru/',
        updatedAt,
      }];
    }

    return [{
      externalId,
      // Размер корпуса только в названии — его достаёт нормализатор.
      title: `Смарт-часы Apple ${sku.model} ${sku.caseSize}mm ${sku.color} (${connectivity})`,
      color: sku.color,
      configuration: sku.band,
      sim: connectivity,
      price,
      availability,
      url: 'https://phone24.ru/',
      updatedAt,
    }];
  });
}
