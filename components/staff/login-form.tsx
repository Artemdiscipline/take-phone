'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';

export function StaffLoginForm({ demoAccess }: { demoAccess: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/staff/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Неверный пароль');
        return;
      }

      router.refresh();
    } catch {
      setError('Нет связи с сервером');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-[420px] py-16 lg:py-24">
      <div className="rounded-2xl border border-line p-7 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <LockKeyhole className="size-4" aria-hidden />
        </span>

        <h1 className="h3 mt-6">Панель сотрудника</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Раздел закрыт: здесь видны закупочные цены и поставщики. Покупатели эти
          данные не получают.
        </p>

        <form onSubmit={submit} className="mt-7">
          <label htmlFor="staff-password" className="field-label">Пароль</label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            className={`mt-2 h-12 w-full rounded-xl border bg-paper px-4 text-sm outline-none transition focus:border-accent ${
              error ? 'border-order' : 'border-line'
            }`}
          />
          {error && <p className="mt-2 text-[13px] text-order">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 h-12 w-full rounded-xl bg-plum text-sm font-medium text-white transition hover:bg-plum-soft disabled:opacity-60"
          >
            {pending ? 'Проверяем…' : 'Войти'}
          </button>
        </form>

        {demoAccess && (
          <p className="mt-5 rounded-xl bg-order-soft p-3.5 text-[12px] leading-relaxed text-order">
            Пароль сотрудника не задан в переменных окружения. Сейчас работает
            демонстрационный доступ по паролю <strong>takephone</strong> — перед
            запуском обязательно задайте <code>STAFF_PASSWORD</code>.
          </p>
        )}
      </div>
    </div>
  );
}
