import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const STAFF_COOKIE = 'tp_staff';
const SESSION_TTL_MS = 12 * 60 * 60_000;

/**
 * Пароль для локальной разработки и явно помеченного превью-стенда.
 * В production он не принимается: см. `getStaffAuthMode`.
 */
export const DEMO_STAFF_PASSWORD = 'takephone';

export type StaffAuthMode =
  /** Заданы STAFF_PASSWORD и STAFF_SESSION_SECRET — рабочий режим. */
  | 'configured'
  /** Секретов нет, но окружение разрешает демонстрационный доступ. */
  | 'demo'
  /** Секретов нет, а демо-доступ запрещён: панель закрыта полностью. */
  | 'misconfigured';

export function getStaffAuthMode(): StaffAuthMode {
  if (env.staffPassword && env.staffSessionSecret) return 'configured';
  if (env.allowDemoStaffAccess) return 'demo';
  return 'misconfigured';
}

function secret(): string {
  return env.staffSessionSecret
    ?? env.staffPassword
    ?? `demo-secret:${DEMO_STAFF_PASSWORD}`;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

/** Проверка пароля. В `misconfigured` не принимает ничего. */
export function verifyPassword(candidate: string): boolean {
  const mode = getStaffAuthMode();
  if (mode === 'misconfigured') return false;

  const expected = mode === 'configured'
    ? env.staffPassword as string
    : DEMO_STAFF_PASSWORD;

  return safeEqual(candidate, expected);
}

export async function createSessionValue(): Promise<string> {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${await sign(expiresAt)}`;
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  if (getStaffAuthMode() === 'misconfigured') return false;

  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;

  return safeEqual(signature, await sign(expiresAt));
}

/** Читает сессию сотрудника из cookie запроса. */
export async function hasStaffSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(STAFF_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: true,
  maxAge: SESSION_TTL_MS / 1000,
} as const;
