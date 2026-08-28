import type { Availability, CategoryId, SimType } from './types';

/**
 * Deduplication key. Titles differ between sources ("iPhone 17 Pro Max 256Gb
 * Deep Blue" vs "Apple iPhone 17 Pro Max 256 ГБ тёмно-синий"), so offers are
 * matched on structured attributes instead of raw text.
 */
export function buildMatchKey(input: {
  brand: string;
  model: string;
  memory: number;
  color: string;
  sim: SimType;
}): string {
  return [
    slugifyPart(input.brand),
    slugifyPart(input.model),
    `${input.memory}gb`,
    slugifyPart(input.color),
    input.sim,
  ].join('__');
}

export function buildSlug(input: {
  model: string;
  memory: number;
  color: string;
}): string {
  return [slugifyPart(input.model), `${input.memory}gb`, slugifyPart(input.color)]
    .filter(Boolean)
    .join('-');
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function slugifyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => TRANSLIT[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "256 ГБ", "256Gb", "1 ТБ" and plain numbers all resolve to gigabytes. */
export function parseMemory(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value) return 0;

  const text = String(value).toLowerCase().replace(',', '.');
  const match = text.match(/(\d+(?:\.\d+)?)\s*(тб|tb|гб|gb)?/);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'тб' || unit === 'tb' || (amount <= 4 && !unit)) return amount * 1024;
  return amount;
}

export function formatMemory(gigabytes: number): string {
  if (gigabytes >= 1024 && gigabytes % 1024 === 0) return `${gigabytes / 1024} ТБ`;
  return `${gigabytes} ГБ`;
}

export function parsePrice(value: number | string): number {
  if (typeof value === 'number') return Math.round(value);
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

const AVAILABILITY_IN_STOCK = ['в наличии', 'instock', 'in_stock', 'есть', 'available', 'да'];
const AVAILABILITY_TO_ORDER = ['под заказ', 'toorder', 'to_order', 'предзаказ', 'preorder', 'ожидается'];
const AVAILABILITY_OUT = ['out_of_stock', 'нет в наличии', 'нет', 'outofstock'];

export function parseAvailability(value: string | boolean | undefined): Availability {
  if (value === true) return 'in_stock';
  if (value === false || value === undefined) return 'out_of_stock';

  const text = String(value).toLowerCase().trim();
  if (AVAILABILITY_IN_STOCK.includes(text)) return 'in_stock';
  if (AVAILABILITY_TO_ORDER.includes(text)) return 'to_order';
  if (AVAILABILITY_OUT.includes(text)) return 'out_of_stock';
  return 'out_of_stock';
}

export function parseSim(value: string | undefined, title = ''): SimType {
  const text = `${value ?? ''} ${title}`.toLowerCase();
  if (/dual|две sim|2 sim|2sim|физическ/.test(text)) return 'dual-sim';
  if (/nano/.test(text) && /esim/.test(text)) return 'nano+esim';
  if (/esim/.test(text)) return 'esim';
  return 'unknown';
}

export const SIM_LABELS: Record<SimType, string> = {
  'nano+esim': 'nano-SIM + eSIM',
  'dual-sim': 'две nano-SIM',
  esim: 'только eSIM',
  unknown: 'уточняется',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'В наличии',
  to_order: 'Под заказ',
  out_of_stock: 'Нет в наличии',
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  iphone: 'iPhone',
  mac: 'Mac',
  ipad: 'iPad',
  watch: 'Apple Watch',
  airpods: 'AirPods',
  samsung: 'Samsung',
  gaming: 'Игровая техника',
  electronics: 'Другая электроника',
};

/** Swatch colours for the colour picker — approximations of the finishes. */
const COLOR_HEX: Record<string, string> = {
  'deep blue': '#2b3a55',
  'cosmic orange': '#d5641f',
  silver: '#dcdcde',
  lavender: '#cfc4e6',
  'mist blue': '#c3d4e2',
  sage: '#c8d2bc',
  white: '#f2f2f3',
  black: '#1d1d1f',
  'sky blue': '#b7cfe0',
  'cloud white': '#efeeea',
  'light gold': '#e2c9a2',
  'space black': '#26262a',
};

export function colorHex(color: string): string {
  return COLOR_HEX[color.toLowerCase()] ?? '#d8d5da';
}

/** Russian labels for the finishes, used in titles and filters. */
const COLOR_RU: Record<string, string> = {
  'deep blue': 'тёмно-синий',
  'cosmic orange': 'оранжевый',
  silver: 'серебристый',
  lavender: 'лавандовый',
  'mist blue': 'голубой',
  sage: 'шалфей',
  white: 'белый',
  black: 'чёрный',
  'sky blue': 'небесно-голубой',
  'cloud white': 'белое облако',
  'light gold': 'светлое золото',
  'space black': 'космический чёрный',
};

export function colorRu(color: string): string | undefined {
  return COLOR_RU[color.toLowerCase()];
}

/**
 * Canonical colour naming. Sources spell finishes differently, so every alias
 * collapses to the English marketing name used as the merge key.
 */
const COLOR_ALIASES: Record<string, string> = {
  'темно-синий': 'Deep Blue',
  'тёмно-синий': 'Deep Blue',
  deepblue: 'Deep Blue',
  'deep blue': 'Deep Blue',
  'космический оранжевый': 'Cosmic Orange',
  оранжевый: 'Cosmic Orange',
  cosmicorange: 'Cosmic Orange',
  'cosmic orange': 'Cosmic Orange',
  серебристый: 'Silver',
  silver: 'Silver',
  лавандовый: 'Lavender',
  lavender: 'Lavender',
  голубой: 'Mist Blue',
  mistblue: 'Mist Blue',
  'mist blue': 'Mist Blue',
  шалфей: 'Sage',
  sage: 'Sage',
  белый: 'White',
  white: 'White',
  черный: 'Black',
  чёрный: 'Black',
  black: 'Black',
  'небесно-голубой': 'Sky Blue',
  skyblue: 'Sky Blue',
  'sky blue': 'Sky Blue',
  'белое облако': 'Cloud White',
  cloudwhite: 'Cloud White',
  'cloud white': 'Cloud White',
  'светлое золото': 'Light Gold',
  lightgold: 'Light Gold',
  'light gold': 'Light Gold',
  'космический черный': 'Space Black',
  spaceblack: 'Space Black',
  'space black': 'Space Black',
};

/**
 * Alias keys are stored in a folded form: lowercase, `ё` collapsed to `е`, and
 * runs of whitespace/hyphens reduced to a single space. Without the folding,
 * "космический чёрный" and "космический черный" would produce two separate
 * products for the same device.
 */
function foldColorKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

const FOLDED_COLOR_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_ALIASES).map(([key, value]) => [foldColorKey(key), value]),
);

export function canonicalColor(value: string | undefined): string {
  if (!value) return 'Unknown';
  const key = foldColorKey(value);
  return FOLDED_COLOR_ALIASES[key] ?? titleCase(key);
}

function titleCase(value: string): string {
  return value.replace(/(^|\s|-)([a-zа-яё])/g, (_, prefix: string, char: string) =>
    prefix + char.toUpperCase());
}

/**
 * Splits an Apple product title into model and generation.
 * "iPhone 17 Pro Max" -> { model: 'iPhone 17 Pro Max', generation: 'Pro Max' }.
 */
export function parseIphoneModel(title: string): { model: string; generation: string } | null {
  const match = title.match(/iphone\s*(air|\d{1,2})\s*(pro max|pro|plus|air)?/i);
  if (!match) return null;

  const base = match[1].toLowerCase() === 'air' ? 'Air' : match[1];
  const suffix = match[2] ? titleCase(match[2].toLowerCase()) : '';
  const model = `iPhone ${base}${suffix ? ` ${suffix}` : ''}`.trim();
  const generation = base === 'Air' ? 'Air' : suffix || base;

  return { model, generation };
}
