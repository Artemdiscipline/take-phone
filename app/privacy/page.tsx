import type { Metadata } from 'next';

import { AppLink } from '@/components/site/app-link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Обработка персональных данных',
  description:
    'Какие данные Take Phone собирает через форму заявки и зачем. Черновик документа, '
    + 'который дорабатывается вместе с владельцем магазина.',
  robots: { index: false, follow: true },
};

/**
 * Черновик, а не юридический документ.
 *
 * Реквизиты оператора, сроки хранения и порядок отзыва согласия может
 * подтвердить только владелец магазина — до этого страница честно помечена
 * как незавершённая (см. README).
 */
export default function PrivacyPage() {
  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Обработка персональных данных</span>
      </nav>

      <div className="mt-4 max-w-[720px]">
        <h1 className="h2">Обработка персональных данных</h1>

        <p className="mt-5 rounded-xl border border-order/30 bg-order-soft p-4 text-[13px] leading-relaxed text-order">
          <strong>Черновик.</strong> Это не итоговый юридический документ. Здесь
          описано только то, что фактически делает форма заявки на сайте.
          Реквизиты оператора, сроки хранения и порядок отзыва согласия
          добавляются после подтверждения владельцем магазина.
        </p>

        <section className="mt-10">
          <h2 className="h3">Какие данные собираются</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Форма заявки принимает имя, номер телефона и необязательный
            комментарий. Вместе с ними сохраняется состав заявки: выбранные
            устройства, способ получения и способ оплаты.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="h3">Зачем они нужны</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Чтобы менеджер {site.name} связался с вами, подтвердил наличие
            устройства, итоговую цену и договорился о получении. Для других целей
            данные не используются.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="h3">Где они хранятся</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Заявка сохраняется в базе данных сайта и доступна сотрудникам
            магазина в закрытой панели. Оплата на сайте не проводится, платёжные
            данные не собираются и не хранятся.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="h3">Как отозвать согласие</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Позвоните по номеру{' '}
            <a href={site.phoneHref} className="font-medium text-ink">{site.phone}</a>{' '}
            или напишите менеджеру в{' '}
            <a
              href={site.telegramManager}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent"
            >
              Telegram
            </a>
            {' '}— заявку удалят.
          </p>
        </section>

        <section className="mt-10 rounded-2xl bg-surface p-6">
          <h2 className="text-sm font-medium">Что нужно добавить перед запуском</h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-soft">
            <li>· наименование и реквизиты оператора персональных данных;</li>
            <li>· адрес для обращений и срок ответа;</li>
            <li>· срок хранения заявок;</li>
            <li>· перечень третьих лиц, если данные кому-то передаются;</li>
            <li>· текст согласия в редакции, согласованной юристом.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
