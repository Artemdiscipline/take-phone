import { getRepository } from '@/lib/repositories';
import { hasStaffSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** Список заявок для панели. Требует сессии сотрудника. */
export async function GET(): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const repository = await getRepository();
    return Response.json({ orders: await repository.listOrders(100) });
  } catch {
    return Response.json({ error: 'Не удалось загрузить заявки' }, { status: 503 });
  }
}
