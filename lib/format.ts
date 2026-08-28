const rubles = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return `${rubles.format(Math.round(value))} ₽`;
}

export function formatCompactPrice(value: number): string {
  return rubles.format(Math.round(value));
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Yekaterinburg',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Yekaterinburg',
});

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/**
 * Метка свежести данных.
 *
 * В статической витрине страница собрана заранее, поэтому «N минут назад»
 * было бы и неправдой, и причиной рассинхрона гидратации: сервер посчитал бы
 * интервал на момент сборки, а браузер — на момент открытия. Там показывается
 * фактическая дата среза.
 */
export function formatFreshness(iso: string, isStatic: boolean): string {
  return isStatic ? formatDateTime(iso) : formatRelative(iso);
}

/** "5 минут назад" style label used for freshness badges. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMinutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));

  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} ${plural(diffMinutes, 'минуту', 'минуты', 'минут')} назад`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${plural(diffHours, 'час', 'часа', 'часов')} назад`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} ${plural(diffDays, 'день', 'дня', 'дней')} назад`;
}

function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
