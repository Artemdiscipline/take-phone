import { applyCardFee } from '@/lib/catalog/pricing';
import { env } from '@/lib/env';
import { getRepository } from '@/lib/repositories';
import type {
  DeliveryMethod,
  OrderItem,
  OrderRequest,
  PaymentMethod,
  StoredOrder,
} from '@/lib/repositories/types';

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  value?: OrderRequest;
}

const DELIVERY: DeliveryMethod[] = ['pickup', 'delivery'];
const PAYMENT: PaymentMethod[] = ['transfer', 'cash', 'card'];

/** Server-side validation. The form mirrors these rules, but never replaces them. */
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
  if (name.length > 80) errors.name = 'Слишком длинное имя';

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) errors.phone = 'Укажите телефон в формате +7 999 000-00-00';

  const delivery = DELIVERY.includes(raw.delivery as DeliveryMethod)
    ? (raw.delivery as DeliveryMethod)
    : null;
  if (!delivery) errors.delivery = 'Выберите способ получения';

  const payment = PAYMENT.includes(raw.payment as PaymentMethod)
    ? (raw.payment as PaymentMethod)
    : null;
  if (!payment) errors.payment = 'Выберите способ оплаты';

  const items = parseItems(raw.items);
  if (items.length === 0) errors.items = 'Добавьте хотя бы одно устройство';
  if (items.length > 20) errors.items = 'Слишком много позиций в заявке';

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

    const matchKey = typeof item.matchKey === 'string' ? item.matchKey : '';
    const title = typeof item.title === 'string' ? item.title.slice(0, 160) : '';
    const price = typeof item.price === 'number' && Number.isFinite(item.price)
      ? Math.max(0, Math.round(item.price))
      : 0;

    if (!matchKey || !title || price === 0) return [];

    return [{
      matchKey,
      title,
      memoryLabel: typeof item.memoryLabel === 'string' ? item.memoryLabel.slice(0, 24) : '',
      color: typeof item.color === 'string' ? item.color.slice(0, 40) : '',
      price,
      availability: typeof item.availability === 'string' ? item.availability.slice(0, 24) : 'unknown',
    }];
  });
}

/**
 * Stores the request and forwards it to the shop.
 *
 * Without `ORDER_WEBHOOK_URL` or Telegram credentials nothing leaves the server:
 * the request is stored for the staff panel and reported as `demo`, so the UI
 * never claims a message was sent.
 */
export async function submitOrder(request: OrderRequest): Promise<StoredOrder> {
  const subtotal = request.items.reduce((sum, item) => sum + item.price, 0);
  const total = request.payment === 'card' ? applyCardFee(subtotal) : subtotal;

  const delivered = await deliver(request, total);

  return getRepository().createOrder({
    ...request,
    subtotal,
    total,
    status: 'new',
    delivered,
  });
}

async function deliver(
  request: OrderRequest,
  total: number,
): Promise<StoredOrder['delivered']> {
  const summary = formatSummary(request, total);

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

    if (!response.ok) throw new Error('Не удалось отправить заявку в Telegram');
    return 'telegram';
  }

  if (env.orderWebhookUrl) {
    const response = await fetch(env.orderWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, total, summary }),
    });

    if (!response.ok) throw new Error('Не удалось передать заявку в CRM');
    return 'webhook';
  }

  return 'demo';
}

function formatSummary(request: OrderRequest, total: number): string {
  const lines = request.items.map((item) => `• ${item.title} — ${item.price} ₽`);

  return [
    '<b>Новая заявка Take Phone</b>',
    `Имя: ${request.name}`,
    `Телефон: ${request.phone}`,
    `Получение: ${request.delivery === 'pickup' ? 'самовывоз' : 'доставка'}`,
    `Оплата: ${paymentLabel(request.payment)}`,
    request.comment ? `Комментарий: ${request.comment}` : null,
    '',
    ...lines,
    '',
    `Итого ориентировочно: ${total} ₽`,
  ].filter(Boolean).join('\n');
}

function paymentLabel(payment: PaymentMethod): string {
  if (payment === 'card') return 'банковская карта (+13,5%)';
  if (payment === 'cash') return 'наличные';
  return 'перевод';
}
