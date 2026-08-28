import { hasStaffSession } from '@/lib/server/auth';
import { getStaffOverview } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

/**
 * Full internal snapshot for the staff panel: supplier offers, wholesale
 * prices, markup rules, sync history and customer requests.
 *
 * Guarded by the staff session — this payload must never reach the public site.
 */
export async function GET(): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  const overview = await getStaffOverview();

  return Response.json(overview, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
