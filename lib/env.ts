/**
 * Конфигурация времени выполнения.
 *
 * На Cloudflare Workers `process.env` наполняется из биндингов, поэтому один и
 * тот же доступ работает локально (`.env.local`) и в проде. Этот модуль нельзя
 * импортировать из клиентских компонентов.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  /**
   * `fixtures` — демонстрационный набор из репозитория (по умолчанию).
   * `live` — чтение согласованных прайс-листов. Источник без настроенного
   * адреса возвращает ошибку, а не подменяет данные демонстрационными.
   */
  get catalogMode(): 'fixtures' | 'live' {
    return read('CATALOG_MODE') === 'live' ? 'live' : 'fixtures';
  },

  get feedUrls() {
    return {
      'first-apple': read('SOURCE_FIRST_APPLE_FEED_URL'),
      'ice-apple': read('SOURCE_ICE_APPLE_FEED_URL'),
      phone24: read('SOURCE_PHONE24_FEED_URL'),
    };
  },

  get feedTokens() {
    return {
      'first-apple': read('SOURCE_FIRST_APPLE_TOKEN'),
      'ice-apple': read('SOURCE_ICE_APPLE_TOKEN'),
      phone24: read('SOURCE_PHONE24_TOKEN'),
    };
  },

  /** Пароль панели сотрудника. */
  get staffPassword(): string | undefined {
    return read('STAFF_PASSWORD');
  },

  /** Секрет для подписи cookie сессии сотрудника. */
  get staffSessionSecret(): string | undefined {
    return read('STAFF_SESSION_SECRET');
  },

  /**
   * Разрешён ли демонстрационный вход без заданных секретов.
   *
   * Локальная разработка — да. Стенд, который специально помечен как превью, —
   * тоже. Обычный production — нет: панель отдаёт ошибку конфигурации, а не
   * открывается всем подряд.
   */
  get allowDemoStaffAccess(): boolean {
    if (read('ALLOW_DEMO_STAFF_ACCESS') === '1') return true;
    return process.env.NODE_ENV !== 'production';
  },

  /** Куда уходят подтверждённые заявки. Не задано — заявка только в базе. */
  get orderWebhookUrl(): string | undefined {
    return read('ORDER_WEBHOOK_URL');
  },

  get telegramBotToken(): string | undefined {
    return read('TELEGRAM_BOT_TOKEN');
  },

  get telegramChatId(): string | undefined {
    return read('TELEGRAM_CHAT_ID');
  },
} as const;

/** true, пока каталог собран из демонстрационного набора. */
export function isDemoCatalog(): boolean {
  return env.catalogMode === 'fixtures';
}
