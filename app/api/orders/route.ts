import { submitOrder, validateOrder } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const validation = validateOrder(payload);
  if (!validation.ok || !validation.value) {
    return Response.json({ errors: validation.errors }, { status: 422 });
  }

  try {
    const order = await submitOrder(validation.value);

    return Response.json({
      id: order.id,
      total: order.total,
      delivered: order.delivered,
    });
  } catch {
    return Response.json(
      { error: 'Не удалось передать заявку. Позвоните нам — мы оформим вручную.' },
      { status: 502 },
    );
  }
}
