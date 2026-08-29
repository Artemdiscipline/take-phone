import { getPublicCatalog } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

/**
 * Публичный каталог.
 *
 * Отдаёт только позиции витрины. Названия поставщиков, закупочные цены и
 * ссылки на исходные карточки в этот ответ не попадают никогда — они живут
 * в `StaffProductView` и доступны лишь из `/api/staff/*`.
 */
export async function GET(): Promise<Response> {
  try {
    const catalog = await getPublicCatalog();

    return Response.json(catalog, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' },
    });
  } catch {
    return Response.json({ error: 'Не удалось загрузить каталог' }, { status: 503 });
  }
}
