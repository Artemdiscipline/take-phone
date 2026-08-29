/**
 * Сборка статической витрины для превью на GitHub Pages.
 *
 *   node scripts/build-static-preview.mjs
 *
 * Что делает:
 *  1. временно убирает `app/api` и `app/staff` — их нельзя экспортировать
 *     статически, а панель сотрудника не должна попадать в браузер вообще;
 *  2. запускает `vinext build` с `STATIC_EXPORT=1`;
 *  3. возвращает убранные каталоги на место, даже если сборка упала.
 *
 * Исходный код не форкается: публичные компоненты сами понимают режим по
 * `NEXT_PUBLIC_STATIC_PREVIEW` (см. lib/build-mode.ts).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const stash = path.join(root, '.static-preview-stash');

/** Каталоги, которых не должно быть в статической сборке. */
const EXCLUDED = ['app/api', 'app/staff'];

/**
 * `output: "export"` несовместим с ISR, поэтому на время сборки страницы
 * помечаются как полностью статические. Оригиналы восстанавливаются в `finally`.
 */
const ISR_PAGES = [
  'app/page.tsx',
  'app/catalog/page.tsx',
  'app/catalog/[category]/page.tsx',
  'app/catalog/[category]/[model]/page.tsx',
  'app/product/[slug]/page.tsx',
];

const originals = new Map();

const basePath = process.env.STATIC_BASE_PATH ?? '';
/** Нормализованный префикс подпапки: `take-phone` и `/take-phone` дают `/take-phone`. */
const trimmedBase = basePath.replace(/^\/+|\/+$/g, '');
const publicBasePath = trimmedBase ? `/${trimmedBase}` : '';

async function patchRouteConfig() {
  for (const relative of ISR_PAGES) {
    const file = path.join(root, relative);
    const source = await readFile(file, 'utf8');
    originals.set(file, source);

    const patched = source.replace(
      /export const revalidate = \d+;/,
      "export const dynamic = 'force-static';",
    );

    if (patched === source) {
      throw new Error(`не нашёл конфигурацию revalidate в ${relative}`);
    }

    await writeFile(file, patched);
    console.log(`переведён в статику: ${relative}`);
  }
}

async function restoreRouteConfig() {
  for (const [file, source] of originals) {
    await writeFile(file, source);
  }
  originals.clear();
}

async function moveAway() {
  await mkdir(stash, { recursive: true });

  for (const relative of EXCLUDED) {
    const source = path.join(root, relative);
    if (!existsSync(source)) continue;

    const target = path.join(stash, relative.replace(/[\\/]/g, '__'));
    await rename(source, target);
    console.log(`убран из сборки: ${relative}`);
  }
}

async function moveBack() {
  for (const relative of EXCLUDED) {
    const target = path.join(stash, relative.replace(/[\\/]/g, '__'));
    if (!existsSync(target)) continue;

    const source = path.join(root, relative);
    await mkdir(path.dirname(source), { recursive: true });
    await rm(source, { recursive: true, force: true });
    await rename(target, source);
    console.log(`возвращён: ${relative}`);
  }

  await rm(stash, { recursive: true, force: true });
}

let status = 1;

try {
  await moveAway();
  await patchRouteConfig();

  const result = spawnSync('npx', ['vinext', 'build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      STATIC_EXPORT: '1',
      STATIC_BASE_PATH: basePath,
      NEXT_PUBLIC_STATIC_PREVIEW: '1',
      NEXT_PUBLIC_BASE_PATH: publicBasePath,
    },
  });

  status = result.status ?? 1;
} finally {
  await restoreRouteConfig();
  await moveBack();
}

if (status !== 0) {
  console.error('\nСтатическая сборка не удалась.');
  process.exit(status);
}

await flattenAssetPrefixDir();
await prepareForPages();

console.log('\nГотово. Статическая витрина собрана.');

/**
 * Приводит вывод к тому, что ожидает GitHub Pages.
 *
 * `.nojekyll` обязателен: иначе Jekyll выбросит каталоги, начинающиеся с
 * подчёркивания, то есть весь `_next`. Заодно убираются служебные файлы
 * сборщика, которым в публичной раздаче делать нечего.
 */
async function prepareForPages() {
  const out = path.join(root, 'dist', 'client');

  await writeFile(path.join(out, '.nojekyll'), '');

  for (const junk of ['.vite', '.assetsignore', 'vinext-client-entry-manifest.json', '_headers']) {
    await rm(path.join(out, junk), { recursive: true, force: true });
  }
}

/**
 * `assetPrefix` не только меняет адреса, но и складывает статику в
 * `dist/client/<префикс>/_next`. На Pages корнем публикации будет сам
 * `dist/client`, поэтому содержимое поднимается на уровень выше — тогда
 * запрос `/<префикс>/_next/...` попадает в нужный файл.
 */
async function flattenAssetPrefixDir() {
  const prefixDir = trimmedBase;
  if (!prefixDir) return;

  const nested = path.join(root, 'dist', 'client', prefixDir);
  if (!existsSync(nested)) return;

  for (const entry of await readdir(nested)) {
    const from = path.join(nested, entry);
    const to = path.join(root, 'dist', 'client', entry);
    await rm(to, { recursive: true, force: true });
    await rename(from, to);
  }

  await rm(nested, { recursive: true, force: true });
  console.log(`статика поднята из dist/client/${prefixDir}/ в dist/client/`);
}
