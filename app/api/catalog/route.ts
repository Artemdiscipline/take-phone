import { getPublicCatalog } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

/**
 * Public catalogue endpoint.
 *
 * Returns only `CatalogProduct` records — wholesale prices and source names are
 * never part of this payload.
 */
export async function GET(): Promise<Response> {
  try {
    const catalog = await getPublicCatalog();

    return Response.json(catalog, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' },
    });
  } catch {
    return Response.json(
      { error: 'Не удалось загрузить каталог' },
      { status: 503 },
    );
  }
}
