import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Доступ к панели.
 *
 * Модуль читает переменные окружения при вызове, поэтому каждый тест
 * подменяет их и сбрасывает кеш модулей.
 */
function withEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  withEnv({
    STAFF_PASSWORD: undefined,
    STAFF_SESSION_SECRET: undefined,
    ALLOW_DEMO_STAFF_ACCESS: undefined,
    NODE_ENV: 'test',
  });
  vi.resetModules();
});

async function loadAuth() {
  vi.resetModules();
  return import('@/lib/server/auth');
}

describe('режим авторизации сотрудника', () => {
  it('с заданными секретами — рабочий режим', async () => {
    withEnv({ STAFF_PASSWORD: 'верный-пароль', STAFF_SESSION_SECRET: 'секрет' });
    const auth = await loadAuth();

    expect(auth.getStaffAuthMode()).toBe('configured');
    expect(auth.verifyPassword('верный-пароль')).toBe(true);
    expect(auth.verifyPassword('takephone')).toBe(false);
  });

  it('локально без секретов — демонстрационный доступ', async () => {
    withEnv({ NODE_ENV: 'development' });
    const auth = await loadAuth();

    expect(auth.getStaffAuthMode()).toBe('demo');
    expect(auth.verifyPassword(auth.DEMO_STAFF_PASSWORD)).toBe(true);
  });

  it('в production без секретов панель закрыта полностью', async () => {
    withEnv({ NODE_ENV: 'production' });
    const auth = await loadAuth();

    expect(auth.getStaffAuthMode()).toBe('misconfigured');
    expect(auth.verifyPassword('takephone')).toBe(false);
    expect(auth.verifyPassword('')).toBe(false);
  });

  it('в production демо-доступ включается только явным флагом', async () => {
    withEnv({ NODE_ENV: 'production', ALLOW_DEMO_STAFF_ACCESS: '1' });
    const auth = await loadAuth();

    expect(auth.getStaffAuthMode()).toBe('demo');
  });

  it('в production сессия не принимается без настроенных секретов', async () => {
    withEnv({ NODE_ENV: 'production' });
    const auth = await loadAuth();

    const future = String(Date.now() + 60_000);
    expect(await auth.isValidSession(`${future}.подделка`)).toBe(false);
  });
});

describe('подпись сессии', () => {
  it('принимает собственную подпись и отвергает чужую', async () => {
    withEnv({ STAFF_PASSWORD: 'пароль', STAFF_SESSION_SECRET: 'секрет-один' });
    const auth = await loadAuth();

    const session = await auth.createSessionValue();
    expect(await auth.isValidSession(session)).toBe(true);

    withEnv({ STAFF_SESSION_SECRET: 'секрет-два' });
    const other = await loadAuth();
    expect(await other.isValidSession(session)).toBe(false);
  });

  it('не принимает просроченную сессию', async () => {
    withEnv({ STAFF_PASSWORD: 'пароль', STAFF_SESSION_SECRET: 'секрет' });
    const auth = await loadAuth();

    expect(await auth.isValidSession('1000.abc')).toBe(false);
    expect(await auth.isValidSession(undefined)).toBe(false);
    expect(await auth.isValidSession('мусор')).toBe(false);
  });
});
