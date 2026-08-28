import { hasStaffSession } from '@/lib/server/auth';
import { runSync } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

/** Manual synchronisation trigger. Staff session required. */
export async function POST(): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const run = await runSync();
    return Response.json(run);
  } catch {
    return Response.json(
      { error: 'Синхронизация не выполнена' },
      { status: 502 },
    );
  }
}
