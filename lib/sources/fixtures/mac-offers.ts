import type { RawOffer, SourceId } from '@/lib/catalog/types';

/**
 * Демонстрационные строки прайс-листов для раздела Mac.
 *
 * Это не обещание конкретного остатка: как и остальные фикстуры, набор нужен,
 * чтобы показать Аркадию группировку моделей, автоматическую наценку и
 * обновление наличия до подключения реальных фидов поставщиков.
 */
interface MacSku {
  key: string;
  model: string;
  storage: number;
  color: string;
  ram: string;
  basePrice: number;
  reference?: number;
  lines: Partial<Record<SourceId, { delta: number; state: 'in' | 'order' | 'out' }>>;
}

const SKUS: MacSku[] = [
  {
    key: 'air13-m4-256-skyblue-16', model: 'MacBook Air 13 M4', storage: 256,
    color: 'Sky Blue', ram: '16 ГБ ОЗУ', basePrice: 99_990, reference: 109_990,
    lines: { 'first-apple': { delta: 0, state: 'in' }, 'ice-apple': { delta: 1_500, state: 'in' }, phone24: { delta: 900, state: 'in' } },
  },
  {
    key: 'air13-m4-512-midnight-16', model: 'MacBook Air 13 M4', storage: 512,
    color: 'Midnight', ram: '16 ГБ ОЗУ', basePrice: 119_990,
    lines: { 'first-apple': { delta: 900, state: 'in' }, 'ice-apple': { delta: 0, state: 'in' } },
  },
  {
    key: 'air15-m4-256-skyblue-16', model: 'MacBook Air 15 M4', storage: 256,
    color: 'Sky Blue', ram: '16 ГБ ОЗУ', basePrice: 119_490,
    lines: { 'first-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_200, state: 'order' } },
  },
  {
    key: 'pro14-m4-512-spaceblack-16', model: 'MacBook Pro 14 M4', storage: 512,
    color: 'Space Black', ram: '16 ГБ ОЗУ', basePrice: 174_990, reference: 189_990,
    lines: { 'ice-apple': { delta: 0, state: 'in' }, phone24: { delta: 1_700, state: 'in' } },
  },
  {
    key: 'pro14-m4pro-512-spaceblack-24', model: 'MacBook Pro 14 M4 Pro', storage: 512,
    color: 'Space Black', ram: '24 ГБ ОЗУ', basePrice: 219_990,
    lines: { 'first-apple': { delta: 0, state: 'order' }, 'ice-apple': { delta: 1_300, state: 'order' } },
  },
  {
    key: 'pro16-m4pro-512-silver-24', model: 'MacBook Pro 16 M4 Pro', storage: 512,
    color: 'Silver', ram: '24 ГБ ОЗУ', basePrice: 269_990,
    lines: { phone24: { delta: 0, state: 'in' }, 'first-apple': { delta: 2_000, state: 'out' } },
  },
];

const STATE_LABELS = {
  'first-apple': { in: 'в наличии', order: 'под заказ', out: 'нет в наличии' },
  'ice-apple': { in: 'да', order: 'ожидается', out: 'нет' },
  phone24: { in: 'instock', order: 'preorder', out: 'outofstock' },
} as const;

const STALENESS_MINUTES: Record<SourceId, number> = {
  'first-apple': 4,
  'ice-apple': 9,
  phone24: 17,
};

const COLOR_RU: Record<string, string> = {
  'Sky Blue': 'небесно-голубой',
  Midnight: 'тёмная ночь',
  'Space Black': 'космический чёрный',
  Silver: 'серебристый',
};

export function buildMacFixtureOffers(source: SourceId, now = Date.now()): RawOffer[] {
  const updatedAt = new Date(now - STALENESS_MINUTES[source] * 60_000).toISOString();

  return SKUS.flatMap((sku): RawOffer[] => {
    const line = sku.lines[source];
    if (!line) return [];

    const price = sku.basePrice + line.delta;
    const common = {
      externalId: `${source}-${sku.key}`,
      memory: `${sku.storage} ГБ`,
      configuration: sku.ram,
      oldPrice: sku.reference,
      updatedAt,
    };

    if (source === 'first-apple') {
      return [{
        ...common,
        title: `Apple ${sku.model} ${sku.storage}GB ${sku.ram} ${sku.color}`,
        color: sku.color,
        price,
        availability: STATE_LABELS[source][line.state],
        url: 'https://first-apple72.ru/',
      }];
    }

    if (source === 'ice-apple') {
      return [{
        ...common,
        title: `${sku.model} ${sku.storage} ГБ ${sku.ram}, ${COLOR_RU[sku.color]}`,
        color: COLOR_RU[sku.color],
        price: `${price} руб.`,
        availability: STATE_LABELS[source][line.state],
        url: 'https://iceapple.ru/',
      }];
    }

    return [{
      ...common,
      title: `Ноутбук Apple ${sku.model} ${sku.storage}GB ${sku.ram} ${sku.color}`,
      color: sku.color,
      price,
      availability: STATE_LABELS[source][line.state],
      url: 'https://phone24.ru/',
    }];
  });
}
