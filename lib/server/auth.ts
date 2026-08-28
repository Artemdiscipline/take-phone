import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const STAFF_COOKIE = 'tp_staff';
const SESSION_TTL_MS = 12 * 60 * 60_000;

/**
 * Password used when `STAFF_PASSWORD` is not configured. The panel then shows a
 * demo-access warning; a real deployment must set the environment variable.
 */
export const DEMO_STAFF_PASSWORD = 'takephone';

export function isStaffAuthConfigured(): boolean {
  return env.staffPassword !== undefined;
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

export function verifyPassword(candidate: string): boolean {
  const expected = env.staffPassword ?? DEMO_STAFF_PASSWORD;
  return safeEqual(candidate, expected);
}

export async function createSessionValue(): Promise<string> {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${await sign(expiresAt)}`;
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;

  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;

  return safeEqual(signature, await sign(expiresAt));
}

/** Reads the staff session from the incoming request cookies. */
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
