/**
 * Режим сборки статической витрины (GitHub Pages).
 *
 * `NEXT_PUBLIC_*` подставляется в бандл на этапе сборки, поэтому флаги видны
 * и на сервере, и в клиентских компонентах.
 */
export const isStaticPreview = process.env.NEXT_PUBLIC_STATIC_PREVIEW === '1';

/**
 * Подпапка, из которой отдаётся сайт: `/take-phone` на Pages, пустая строка
 * при обычном деплое.
 *
 * Next умеет это через `basePath`, но в статическом экспорте vinext
 * 1.0.0-beta.5 он не поддержан — пререндер о нём не знает и отвечает 404 на
 * каждый маршрут. Поэтому префикс проставляется в исходниках через `withBase`,
 * а не постобработкой готовой сборки.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Добавляет префикс подпапки к внутреннему пути.
 *
 * Идемпотентна: путь, уже начинающийся с префикса, возвращается как есть —
 * иначе значение, сохранённое в localStorage и прогнанное через функцию
 * повторно, превратилось бы в `/take-phone/take-phone/...`.
 */
export function withBase(path: string): string {
  if (!basePath || !path.startsWith('/')) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return path === '/' ? `${basePath}/` : `${basePath}${path}`;
}
