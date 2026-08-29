import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Заглушка `next/headers` не отдаёт cookie, поэтому сессии сотрудника нет —
 * ровно случай постороннего запроса к закрытым маршрутам.
 */
beforeEach(() => {
  process.env.STAFF_PASSWORD = 'пароль';
  process.env.STAFF_SESSION_SECRET = 'секрет';
  vi.resetModules();
});

describe('закрытые маршруты без авторизации', () => {
  it('обзор панели отдаёт 401', async () => {
    const { GET } = await import('@/app/api/staff/overview/route');
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Нет доступа' });
  });

  it('список заявок отдаёт 401', async () => {
    const { GET } = await import('@/app/api/staff/orders/route');
    expect((await GET()).status).toBe(401);
  });

  it('смена статуса заявки отдаёт 401', async () => {
    const { PATCH } = await import('@/app/api/staff/orders/[id]/route');

    const response = await PATCH(
      new Request('http://localhost/api/staff/orders/x', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      }),
      { params: Promise.resolve({ id: 'x' }) },
    );

    expect(response.status).toBe(401);
  });

  it('изменение наценки отдаёт 401', async () => {
    const { POST } = await import('@/app/api/staff/markup/route');

    const response = await POST(new Request('http://localhost/api/staff/markup', {
      method: 'POST',
      body: JSON.stringify({ level: 'global', value: 9_000 }),
    }));

    expect(response.status).toBe(401);
  });

  it('запуск синхронизации отдаёт 401', async () => {
    const { POST } = await import('@/app/api/staff/sync/route');
    expect((await POST()).status).toBe(401);
  });
});

describe('публичный каталог', () => {
  it('не содержит поставщиков и закупочных цен', async () => {
    const { GET } = await import('@/app/api/catalog/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.text();

    for (const secret of [
      'First Apple', 'IceApple', 'Phone24',
      'first-apple72', 'iceapple.ru', 'phone24.ru',
      'purchasePrice', 'sourceUrl',
    ]) {
      expect(body).not.toContain(secret);
    }
  });

  it('отдаёт позиции каталога и признак демо-данных', async () => {
    const { GET } = await import('@/app/api/catalog/route');
    const payload = await (await GET()).json() as {
      listings: { slug: string; variants: unknown[] }[];
      demoData: boolean;
    };

    expect(payload.listings.length).toBeGreaterThan(0);
    expect(payload.demoData).toBe(true);
    expect(payload.listings[0].variants.length).toBeGreaterThan(0);
  });
});

describe('публичное оформление заявки', () => {
  it('отклоняет заявку без согласия на обработку данных', async () => {
    const { POST } = await import('@/app/api/orders/route');

    const response = await POST(new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Аркадий',
        phone: '+7 999 123-45-67',
        delivery: 'pickup',
        payment: 'transfer',
        consent: false,
        items: [{
          productKey: 'key',
          title: 'iPhone 17 Pro Max 256 ГБ',
          price: 119_990,
        }],
      }),
    }));

    expect(response.status).toBe(422);
  });

  it('сохраняет корректную заявку и возвращает номер', async () => {
    const { POST } = await import('@/app/api/orders/route');

    const response = await POST(new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Аркадий',
        phone: '+7 999 123-45-67',
        delivery: 'pickup',
        payment: 'card',
        consent: true,
        items: [{
          productKey: 'apple__iphone-17-pro-max__256gb__deep-blue__esim',
          productSlug: 'iphone-17-pro-max-256gb-deep-blue',
          title: 'iPhone 17 Pro Max 256 ГБ, тёмно-синий',
          model: 'iPhone 17 Pro Max',
          memory: 256,
          memoryLabel: '256 ГБ',
          color: 'Deep Blue',
          simType: 'esim',
          simLabel: 'только eSIM',
          price: 119_990,
          availability: 'in_stock',
          quantity: 1,
        }],
      }),
    }));

    expect(response.status).toBe(200);

    const payload = await response.json() as {
      publicNumber: string;
      total: number;
      cardFee: number;
      delivered: string;
    };

    expect(payload.publicNumber).toMatch(/^TP-\d{6}-[0-9A-Z]{4}$/);
    expect(payload.cardFee).toBeGreaterThan(0);
    expect(payload.total).toBe(119_990 + payload.cardFee);
    // Внешний канал не настроен — так и сообщаем, без выдуманного Telegram.
    expect(payload.delivered).toBe('stored');
  });
});
