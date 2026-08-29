/**
 * Разовая подготовка логотипа Take Phone.
 *
 *   node scripts/extract-logo.mjs <исходник.jpg>
 *
 * Исходник — квадратная картинка для соцсетей: логотип посередине, сверху и
 * снизу вписаны слоганы. Для сайта нужен только сам знак с надписью, поэтому
 * скрипт:
 *
 *  1. находит полосы тёмных пикселей и берёт среднюю — это и есть логотип;
 *  2. делает белый фон прозрачным, используя яркость как альфа-канал
 *     (логотип одноцветный, поэтому края остаются сглаженными);
 *  3. сохраняет две версии — полный логотип и один знак без надписи.
 *
 * В сборку не входит: готовые файлы лежат в public/assets/brand.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];

if (!source) {
  console.error('Использование: node scripts/extract-logo.mjs <исходник.jpg>');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'public', 'assets', 'brand');

/** Фирменный цвет из исходника — тёмный индиго. */
const BRAND = { r: 0x14, g: 0x14, b: 0x33 };

/** Яркость, ниже которой пиксель считается полностью непрозрачным. */
const SOLID_LUMA = 24;

const { data: grey, info } = await sharp(source)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;

/** Горизонтальные полосы с тёмными пикселями. */
function findBands(isDarkAt, length, span) {
  const bands = [];
  let start = null;

  for (let i = 0; i < length; i += 1) {
    let dark = 0;
    for (let j = 0; j < span; j += 1) if (isDarkAt(i, j)) dark += 1;

    const filled = dark > 2;
    if (filled && start === null) start = i;
    if (!filled && start !== null) {
      if (i - start > 4) bands.push([start, i]);
      start = null;
    }
  }

  if (start !== null) bands.push([start, length]);
  return bands;
}

const isDark = (y, x) => grey[y * width + x] < 140;

const rowBands = findBands((y, x) => isDark(y, x), height, width);

if (rowBands.length === 0) {
  console.error('Не нашёл тёмных пикселей — проверьте исходник.');
  process.exit(1);
}

// Логотип — самая высокая полоса; слоганы заметно ниже.
const [top, bottom] = rowBands.reduce((best, band) =>
  band[1] - band[0] > best[1] - best[0] ? band : best);

const colBands = findBands(
  (x, offset) => isDark(top + offset, x),
  width,
  bottom - top,
);

const left = colBands[0][0];
const right = colBands.at(-1)[1];
/** Знак — первая колонка, надпись — всё остальное. */
const markRight = colBands[0][1];

console.log(`логотип: x ${left}..${right}, y ${top}..${bottom}`);
console.log(`знак: x ${left}..${markRight}`);

/**
 * Собирает PNG с прозрачным фоном: альфа берётся из яркости, цвет — фирменный.
 * Так белый фон исчезает, а сглаженные края логотипа сохраняются.
 */
async function render(region, file, targetHeight) {
  const pixels = Buffer.alloc(region.width * region.height * 4);

  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const luma = grey[(region.top + y) * width + (region.left + x)];
      const alpha = Math.max(0, Math.min(255, Math.round(
        ((255 - luma) * 255) / (255 - SOLID_LUMA),
      )));

      const i = (y * region.width + x) * 4;
      pixels[i] = BRAND.r;
      pixels[i + 1] = BRAND.g;
      pixels[i + 2] = BRAND.b;
      pixels[i + 3] = alpha;
    }
  }

  const target = path.join(OUT_DIR, file);

  await sharp(pixels, { raw: { width: region.width, height: region.height, channels: 4 } })
    .trim({ threshold: 1 })
    // На сайте логотип показывается высотой ~30 px; запас нужен для экранов
    // с высокой плотностью, но не больше — файл должен остаться лёгким.
    .resize({ height: targetHeight, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target);

  const { size } = await sharp(target).metadata();
  console.log(`${path.relative(process.cwd(), target)}  ${Math.round((size ?? 0) / 1024)} KB`);
}

await mkdir(OUT_DIR, { recursive: true });

const pad = 6;

await render({
  left: Math.max(0, left - pad),
  top: Math.max(0, top - pad),
  width: Math.min(width, right + pad) - Math.max(0, left - pad),
  height: Math.min(height, bottom + pad) - Math.max(0, top - pad),
}, 'take-phone-logo.png', 120);

// Справа отступа нет: надпись начинается сразу за знаком, и лишние пиксели
// затащили бы в него край буквы «T».
await render({
  left: Math.max(0, left - pad),
  top: Math.max(0, top - pad),
  width: markRight - Math.max(0, left - pad),
  height: Math.min(height, bottom + pad) - Math.max(0, top - pad),
}, 'take-phone-mark.png', 192);

/** Фавикон: знак на прозрачном фоне, вписанный в квадрат. */
const mark = path.join(OUT_DIR, 'take-phone-mark.png');

await sharp(mark)
  .resize({
    width: 96,
    height: 96,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(path.join(process.cwd(), 'public', 'favicon.png'));

console.log('public/favicon.png');
