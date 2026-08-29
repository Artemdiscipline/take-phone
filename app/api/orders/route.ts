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

    // Покупателю возвращаем только то, что показываем на экране успеха.
    return Response.json({
      publicNumber: order.publicNumber,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      cardFee: order.cardFee,
      total: order.total,
      delivery: order.delivery,
      payment: order.payment,
      reservationPrepayment: order.reservationPrepayment,
      delivered: order.delivered,
      items: order.items.map((item) => ({
        title: item.title,
        simLabel: item.simLabel,
        price: item.price,
      })),
    });
  } catch {
    return Response.json(
      { error: 'Не удалось сохранить заявку. Позвоните нам — оформим вручную.' },
      { status: 502 },
    );
  }
}
