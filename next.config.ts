import type { NextConfig } from 'next';

/**
 * Две цели сборки из одного исходника.
 *
 * По умолчанию — полноценное приложение на Cloudflare Workers: серверные
 * маршруты, панель сотрудника, синхронизация.
 *
 * `STATIC_EXPORT=1` — статическая витрина для превью на GitHub Pages.
 * В ней нет `/api/*` и `/staff`: Pages не умеет выполнять серверный код, а
 * переносить закупочные цены и поставщиков в браузер нельзя. Сборкой
 * занимается `scripts/build-static-preview.mjs`.
 */
const isStaticExport = process.env.STATIC_EXPORT === '1';

/**
 * Имя подпапки принимается в любом виде («take-phone», «/take-phone»).
 * Git Bash на Windows подменяет значения с ведущим слешем на путь файловой
 * системы, поэтому слеш добавляем здесь, а не в командной строке.
 */
function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

const nextConfig: NextConfig = isStaticExport
  ? {
      output: 'export',
      /**
       * Именно assetPrefix, а не basePath.
       *
       * basePath в статическом экспорте vinext 1.0.0-beta.5 не поддержан:
       * пререндер не знает о нём и отвечает 404 на каждый маршрут. assetPrefix
       * задаёт базовый адрес рантайм-загрузчика чанков, не влияя на пререндер,
       * поэтому статика уезжает в подпапку корректно. Ссылки между страницами
       * дописывает scripts/apply-base-path.mjs уже в готовой сборке.
       */
      assetPrefix: normalizeBasePath(process.env.STATIC_BASE_PATH),
      // На Pages некому оптимизировать изображения на лету —
      // отдаём заранее подготовленные WebP как есть.
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
