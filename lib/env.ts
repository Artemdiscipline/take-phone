/**
 * Runtime configuration.
 *
 * On Cloudflare Workers `process.env` is populated from the Worker bindings, so
 * the same accessor works locally (`.env.local`) and in production. Nothing in
 * this module may be imported from a client component.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  /**
   * `fixtures` — bundled demo dataset (default).
   * `live` — read agreed price-list endpoints. Sources without a configured
   * feed URL report an error instead of silently falling back to demo data.
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

  /** Password for the staff panel. Without it the panel runs in demo mode. */
  get staffPassword(): string | undefined {
    return read('STAFF_PASSWORD');
  },

  /** Secret used to sign the staff session cookie. */
  get staffSessionSecret(): string | undefined {
    return read('STAFF_SESSION_SECRET');
  },

  /** Where confirmed order requests are delivered. Unset = demo mode. */
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

/** True when no real integrations are configured. Surfaced in the UI. */
export function isDemoMode(): boolean {
  return env.catalogMode === 'fixtures';
}
