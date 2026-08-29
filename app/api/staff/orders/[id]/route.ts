import { getRepository } from '@/lib/repositories';
import type { OrderUpdate } from '@/lib/repositories/types';
import { hasStaffSession } from '@/lib/server/auth';
import { isOrderStatus } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/**
 * Смена статуса и внутренний комментарий сотрудника.
 *
 * Статус пишется вместе с записью в историю, поэтому видно, кто и когда
 * двигал заявку.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  const { id } = await params;

  let payload: { status?: unknown; staffComment?: unknown; note?: unknown };

  try {
    payload = await request.json() as typeof payload;
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const update: OrderUpdate = {};

  if (payload.status !== undefined) {
    if (!isOrderStatus(payload.status)) {
      return Response.json({ error: 'Неизвестный статус заявки' }, { status: 422 });
    }
    update.status = payload.status;
  }

  if (payload.staffComment !== undefined) {
    if (typeof payload.staffComment !== 'string') {
      return Response.json({ error: 'Некорректный комментарий' }, { status: 422 });
    }
    update.staffComment = payload.staffComment.slice(0, 2000);
  }

  if (typeof payload.note === 'string') update.note = payload.note.slice(0, 500);

  if (update.status === undefined && update.staffComment === undefined) {
    return Response.json({ error: 'Нечего обновлять' }, { status: 422 });
  }

  try {
    const repository = await getRepository();
    const order = await repository.updateOrder(id, update);

    if (!order) return Response.json({ error: 'Заявка не найдена' }, { status: 404 });
    return Response.json({ order });
  } catch {
    return Response.json({ error: 'Не удалось обновить заявку' }, { status: 503 });
  }
}
