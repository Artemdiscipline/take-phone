/**
 * Confirmed Take Phone business data.
 *
 * Only values already present in the project are stored here. Anything not
 * verified with the shop owner must not be added — see README for the list of
 * facts that still need confirmation.
 */
export const site = {
  name: 'Take Phone',
  city: 'Тюмень',
  legalNote: 'Демонстрационная версия сайта',
  address: 'ул. Герцена, 84к2',
  addressFull: 'Тюмень, ул. Герцена, 84к2',
  workingHours: 'Ежедневно, 09:00–22:00',
  phone: '+7 (3452) 499-700',
  phoneHref: 'tel:+73452499700',
  /** Личный контакт менеджера — сюда пишут по конкретной заявке. */
  telegramManager: 'https://t.me/take_phone72',
  telegramManagerHandle: '@take_phone72',
  /** Публичный канал магазина — витрина и новости, не переписка. */
  telegramChannel: 'https://t.me/Takephone72',
  telegramChannelHandle: '@Takephone72',
  vk: 'https://vk.com/takephone72',
} as const;

/**
 * Комиссия за оплату банковской картой.
 *
 * Значение 13,5% указал владелец магазина в переписке и оно ещё не
 * подтверждено документально (см. README). Меняется одной переменной
 * окружения, а не правкой кода:
 *
 *   CARD_PAYMENT_FEE_RATE=0.135              — для серверных расчётов
 *   NEXT_PUBLIC_CARD_PAYMENT_FEE_RATE=0.135  — чтобы то же значение попало
 *                                              в браузер и совпало с сервером
 */
const DEFAULT_CARD_FEE_RATE = 0.135;

function readCardFeeRate(): number {
  // На клиенте доступны только NEXT_PUBLIC_*; серверное имя читается вторым.
  const raw = process.env.NEXT_PUBLIC_CARD_PAYMENT_FEE_RATE
    ?? process.env.CARD_PAYMENT_FEE_RATE;

  if (!raw) return DEFAULT_CARD_FEE_RATE;

  const parsed = Number.parseFloat(raw);
  const isSane = Number.isFinite(parsed) && parsed >= 0 && parsed < 1;

  return isSane ? parsed : DEFAULT_CARD_FEE_RATE;
}

/** Условия покупки. Единственный источник значений для расчётов и текстов. */
export const terms = {
  /** Предоплата, которая бронирует устройство при самовывозе. */
  reservationPrepayment: 10_000,
  /** Надбавка при оплате банковской картой. */
  cardFeeRate: readCardFeeRate(),
  /** Скидка на устройства, которые везут под заказ. */
  preorderDiscount: 1_000,
} as const;

/** «13,5%» для интерфейса — форматируется из того же значения. */
export const cardFeeLabel = `${(terms.cardFeeRate * 100)
  .toFixed(1)
  .replace('.', ',')
  .replace(',0', '')}%`;
