import { beforeEach, describe, expect, it } from 'vitest';

import { MemoryCatalogRepository } from '@/lib/repositories/memory';
import { buildPublicNumber } from '@/lib/repositories/order-number';
import type { OrderItem, StoredOrder } from '@/lib/repositories/types';
import { isOrderStatus, summariseOrder, validateOrder } from '@/lib/server/orders';
import { terms } from '@/lib/site';

function item(patch: Partial<OrderItem> = {}): OrderItem {
  return {
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
    ...patch,
  };
}

function payload(patch: Record<string, unknown> = {}) {
  return {
    name: 'Аркадий',
    phone: '+7 999 123-45-67',
    comment: 'Тестовая заявка',
    delivery: 'pickup',
    payment: 'transfer',
    consent: true,
    items: [item()],
    ...patch,
  };
}

describe('валидация заявки', () => {
  it('принимает корректные данные', () => {
    const result = validateOrder(payload());
    expect(result.ok).toBe(true);
    expect(result.value?.items).toHaveLength(1);
  });

  it('требует имя', () => {
    expect(validateOrder(payload({ name: 'А' })).errors.name).toBeTruthy();
  });

  it('требует телефон разумной длины', () => {
    expect(validateOrder(payload({ phone: '123' })).errors.phone).toBeTruthy();
  });

  it('требует согласие на обработку данных', () => {
    const result = validateOrder(payload({ consent: false }));
    expect(result.ok).toBe(false);
    expect(result.errors.consent).toBeTruthy();
  });

  it('не принимает пустой список товаров', () => {
    expect(validateOrder(payload({ items: [] })).errors.items).toBeTruthy();
  });

  it('отбрасывает позиции без ключа или цены', () => {
    const result = validateOrder(payload({
      items: [item(), { title: 'Мусор' }, item({ productKey: 'second', price: 0 })],
    }));

    expect(result.value?.items).toHaveLength(1);
  });

  it('не принимает неизвестный способ оплаты', () => {
    expect(validateOrder(payload({ payment: 'crypto' })).errors.payment).toBeTruthy();
  });

  it('распознаёт только известные статусы', () => {
    expect(isOrderStatus('new')).toBe(true);
    expect(isOrderStatus('completed')).toBe(true);
    expect(isOrderStatus('teleported')).toBe(false);
  });
});

describe('итоги заявки', () => {
  it('без карты доплаты нет', () => {
    const totals = summariseOrder(validateOrder(payload()).value!);

    expect(totals.subtotal).toBe(119_990);
    expect(totals.cardFee).toBe(0);
    expect(totals.total).toBe(119_990);
  });

  it('при оплате картой добавляется комиссия', () => {
    const totals = summariseOrder(validateOrder(payload({ payment: 'card' })).value!);

    expect(totals.cardFee).toBe(Math.round(119_990 * terms.cardFeeRate));
    expect(totals.total).toBe(totals.subtotal + totals.cardFee);
  });

  it('предоплата за бронь появляется только при самовывозе', () => {
    const pickup = summariseOrder(validateOrder(payload()).value!);
    const delivery = summariseOrder(validateOrder(payload({ delivery: 'delivery' })).value!);

    expect(pickup.reservationPrepayment).toBe(terms.reservationPrepayment);
    expect(delivery.reservationPrepayment).toBe(0);
  });

  it('количество учитывается в стоимости', () => {
    const totals = summariseOrder(
      validateOrder(payload({ items: [item({ quantity: 2 })] })).value!,
    );

    expect(totals.subtotal).toBe(239_980);
  });
});

describe('хранилище заявок', () => {
  let repository: MemoryCatalogRepository;

  beforeEach(() => {
    // Состояние живёт в globalThis — чистим между тестами.
    delete (globalThis as Record<symbol, unknown>)[Symbol.for('take-phone.memory-repository')];
    repository = new MemoryCatalogRepository();
  });

  async function create(): Promise<StoredOrder> {
    const request = validateOrder(payload()).value!;
    const totals = summariseOrder(request);

    return repository.createOrder({
      ...request,
      ...totals,
      status: 'new',
      staffComment: '',
      delivered: 'stored',
    });
  }

  it('присваивает номер и время создания', async () => {
    const order = await create();

    expect(order.publicNumber).toMatch(/^TP-\d{6}-[0-9A-Z]{4}$/);
    expect(order.status).toBe('new');
    expect(order.history).toHaveLength(1);
    expect(order.history[0].status).toBe('new');
  });

  it('новая заявка сразу видна в списке', async () => {
    const order = await create();
    const orders = await repository.listOrders();

    expect(orders[0].id).toBe(order.id);
    expect(orders[0].items[0].simLabel).toBe('только eSIM');
  });

  it('смена статуса пишется в историю', async () => {
    const order = await create();
    const updated = await repository.updateOrder(order.id, {
      status: 'contacted',
      note: 'Дозвонились',
    });

    expect(updated?.status).toBe('contacted');
    expect(updated?.history).toHaveLength(2);
    expect(updated?.history[1].note).toBe('Дозвонились');
  });

  it('повторная установка того же статуса не плодит записи', async () => {
    const order = await create();
    const updated = await repository.updateOrder(order.id, { status: 'new' });

    expect(updated?.history).toHaveLength(1);
  });

  it('сохраняет комментарий сотрудника', async () => {
    const order = await create();
    const updated = await repository.updateOrder(order.id, { staffComment: 'Ждём оплату' });

    expect(updated?.staffComment).toBe('Ждём оплату');
  });

  it('возвращает null для несуществующей заявки', async () => {
    expect(await repository.updateOrder('нет-такой', { status: 'new' })).toBeNull();
    expect(await repository.getOrder('нет-такой')).toBeNull();
  });
});

describe('номер заявки', () => {
  it('содержит дату создания', () => {
    const number = buildPublicNumber(new Date('2026-08-29T10:00:00.000Z'), 'seed');
    expect(number.startsWith('TP-260829-')).toBe(true);
  });

  it('для разных заявок различается', () => {
    const date = new Date('2026-08-29T10:00:00.000Z');
    expect(buildPublicNumber(date, 'a')).not.toBe(buildPublicNumber(date, 'b'));
  });
});
