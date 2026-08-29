import { applyCardFee, cardFeeAmount } from '@/lib/catalog/pricing';
import { env } from '@/lib/env';
import { getRepository } from '@/lib/repositories';
import type {
  DeliveryMethod,
  OrderItem,
  OrderRequest,
  OrderStatus,
  PaymentMethod,
  StoredOrder,
} from '@/lib/repositories/types';
import { ORDER_STATUSES } from '@/lib/repositories/types';
import { terms } from '@/lib/site';

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  value?: OrderRequest;
}

const DELIVERY: DeliveryMethod[] = ['pickup', 'delivery'];
const PAYMENT: PaymentMethod[] = ['transfer', 'cash', 'card'];

/**
 * Серверная валидация. Форма повторяет эти правила для удобства, но никогда
 * их не заменяет.
 */
export function validateOrder(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return { ok: false, errors: { form: 'Некорректный запрос' } };
  }

  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const comment = typeof raw.comment === 'string' ? raw.comment.trim().slice(0, 600) : '';

  if (name.length < 2) errors.name = 'Укажите имя';
  else if (name.length > 80) errors.name = 'Слишком длинное имя';

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    errors.phone = 'Укажите телефон в формате +7 999 000-00-00';
  }

  const delivery = DELIVERY.includes(raw.delivery as DeliveryMethod)
    ? (raw.delivery as DeliveryMethod)
    : null;
  if (!delivery) errors.delivery = 'Выберите способ получения';

  const payment = PAYMENT.includes(raw.payment as PaymentMethod)
    ? (raw.payment as PaymentMethod)
    : null;
  if (!payment) errors.payment = 'Выберите способ оплаты';

  if (raw.consent !== true) {
    errors.consent = 'Отметьте согласие на обработку персональных данных';
  }

  const items = parseItems(raw.items);
  if (items.length === 0) errors.items = 'Добавьте хотя бы одно устройство';
  else if (items.length > 20) errors.items = 'Слишком много позиций в заявке';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      name,
      phone,
      comment: comment || undefined,
      delivery: delivery as DeliveryMethod,
      payment: payment as PaymentMethod,
      items,
    },
  };
}

function parseItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): OrderItem[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const item = entry as Record<string, unknown>;

    const text = (key: string, limit: number): string =>
      typeof item[key] === 'string' ? (item[key] as string).slice(0, limit) : '';

    const productKey = text('productKey', 200);
    const title = text('title', 160);
    const price = typeof item.price === 'number' && Number.isFinite(item.price)
      ? Math.max(0, Math.round(item.price))
      : 0;

    if (!productKey || !title || price === 0) return [];

    const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity)
      ? Math.min(10, Math.max(1, Math.round(item.quantity)))
      : 1;

    return [{
      productKey,
      productSlug: text('productSlug', 160),
      title,
      model: text('model', 80),
      memory: typeof item.memory === 'number' && Number.isFinite(item.memory)
        ? Math.max(0, Math.round(item.memory))
        : 0,
      memoryLabel: text('memoryLabel', 24),
      color: text('color', 40),
      simType: text('simType', 24) || 'unknown',
      simLabel: text('simLabel', 40),
      price,
      availability: text('availability', 24) || 'unknown',
      quantity,
    }];
  });
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Итоги заявки. Считаются на сервере — клиентским числам не доверяем. */
export function summariseOrder(request: OrderRequest): {
  subtotal: number;
  cardFee: number;
  total: number;
  reservationPrepayment: number;
} {
  const subtotal = request.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const cardFee = request.payment === 'card' ? cardFeeAmount(subtotal) : 0;

  return {
    subtotal,
    cardFee,
    total: request.payment === 'card' ? applyCardFee(subtotal) : subtotal,
    // Предоплата обсуждается только при самовывозе и пока не списывается.
    reservationPrepayment: request.delivery === 'pickup' ? terms.reservationPrepayment : 0,
  };
}

/**
 * Сохраняет заявку и, если канал настроен, передаёт её в магазин.
 *
 * Без `ORDER_WEBHOOK_URL` и Telegram-доступов заявка просто остаётся в базе и
 * помечается как `stored` — интерфейс в этом случае не утверждает, что
 * менеджеру что-то отправлено.
 */
export async function submitOrder(request: OrderRequest): Promise<StoredOrder> {
  const totals = summariseOrder(request);
  const repository = await getRepository();

  const stored = await repository.createOrder({
    ...request,
    ...totals,
    status: 'new',
    staffComment: '',
    delivered: 'stored',
  });

  const delivered = await deliver(stored);

  if (delivered !== 'stored') {
    // Отметка канала не должна ронять уже сохранённую заявку.
    await repository.updateOrder(stored.id, {}).catch(() => null);
    return { ...stored, delivered };
  }

  return stored;
}

async function deliver(order: StoredOrder): Promise<StoredOrder['delivered']> {
  const summary = formatSummary(order);

  try {
    if (env.telegramBotToken && env.telegramChatId) {
      const response = await fetch(
        `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.telegramChatId,
            text: summary,
            parse_mode: 'HTML',
          }),
        },
      );

      return response.ok ? 'telegram' : 'stored';
    }

    if (env.orderWebhookUrl) {
      const response = await fetch(env.orderWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, summary }),
      });

      return response.ok ? 'webhook' : 'stored';
    }
  } catch {
    // Заявка уже в базе — сотрудник увидит её в панели в любом случае.
  }

  return 'stored';
}

function formatSummary(order: StoredOrder): string {
  const lines = order.items.map(
    (item) => `• ${item.title} (${item.simLabel}) — ${item.price} ₽`,
  );

  return [
    `<b>Заявка ${order.publicNumber}</b>`,
    `Имя: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Получение: ${order.delivery === 'pickup' ? 'самовывоз' : 'доставка'}`,
    `Оплата: ${paymentLabel(order.payment)}`,
    order.comment ? `Комментарий: ${order.comment}` : null,
    '',
    ...lines,
    '',
    `Итого ориентировочно: ${order.total} ₽`,
  ].filter(Boolean).join('\n');
}

function paymentLabel(payment: PaymentMethod): string {
  if (payment === 'card') return 'банковская карта';
  if (payment === 'cash') return 'наличные';
  return 'перевод';
}
