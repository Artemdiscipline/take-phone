import { hasStaffSession } from '@/lib/server/auth';
import { runSync } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

/** Ручная синхронизация. Требует сессии сотрудника. */
export async function POST(): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    return Response.json(await runSync());
  } catch {
    return Response.json({ error: 'Синхронизация не выполнена' }, { status: 502 });
  }
}
