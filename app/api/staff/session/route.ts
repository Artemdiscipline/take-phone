import { cookies } from 'next/headers';
import {
  createSessionValue,
  sessionCookieOptions,
  STAFF_COOKIE,
  verifyPassword,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** Signs the employee in and sets the signed session cookie. */
export async function POST(request: Request): Promise<Response> {
  let password = '';

  try {
    const payload = await request.json() as { password?: unknown };
    password = typeof payload.password === 'string' ? payload.password : '';
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return Response.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  const store = await cookies();
  store.set(STAFF_COOKIE, await createSessionValue(), sessionCookieOptions);

  return Response.json({ ok: true });
}

export async function DELETE(): Promise<Response> {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
  return Response.json({ ok: true });
}
