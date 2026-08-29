import { getRepository } from '@/lib/repositories';
import type { MarkupOverride } from '@/lib/repositories/types';
import { hasStaffSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const LEVELS: MarkupOverride['level'][] = ['product', 'model', 'category'];

/**
 * Updates a markup rule.
 *
 * `{ level: 'global', value }` sets the fallback markup; the other levels take
 * a `key` (match key, `brand model`, or category id). `value: null` removes an
 * override so the next level down applies again.
 */
export async function POST(request: Request): Promise<Response> {
  if (!await hasStaffSession()) {
    return Response.json({ error: 'Нет доступа' }, { status: 401 });
  }

  let payload: { level?: unknown; key?: unknown; value?: unknown };

  try {
    payload = await request.json() as typeof payload;
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const value = payload.value === null
    ? null
    : typeof payload.value === 'number' && Number.isFinite(payload.value)
      ? payload.value
      : undefined;

  if (value === undefined) {
    return Response.json({ error: 'Некорректное значение наценки' }, { status: 422 });
  }

  const repository = await getRepository();

  if (payload.level === 'global') {
    if (value === null) {
      return Response.json({ error: 'Глобальную наценку нельзя удалить' }, { status: 422 });
    }
    return Response.json({ rules: await repository.setGlobalMarkup(value) });
  }

  if (!LEVELS.includes(payload.level as MarkupOverride['level']) || typeof payload.key !== 'string') {
    return Response.json({ error: 'Некорректное правило наценки' }, { status: 422 });
  }

  const rules = await repository.setMarkupOverride({
    level: payload.level as MarkupOverride['level'],
    key: payload.key,
    value,
  });

  return Response.json({ rules });
}
