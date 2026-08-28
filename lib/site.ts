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
  telegram: 'https://t.me/take_phone72',
  vk: 'https://vk.com/takephone72',
} as const;

/** Purchase terms shown to the buyer. Demo-mode values are labelled in the UI. */
export const terms = {
  /** Prepayment that reserves a device for pickup. */
  reservationPrepayment: 10_000,
  /** Surcharge applied when the buyer pays by bank card. */
  cardFeeRate: 0.135,
  /** Discount applied to devices that are sourced to order. */
  preorderDiscount: 1_000,
} as const;
