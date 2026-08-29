import type { Metadata } from 'next';
import { Clock3, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { AppLink } from '@/components/site/app-link';

import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Take Phone в Тюмени: адрес Герцена, 84к2, режим работы ежедневно 09:00–22:00, '
    + 'телефон +7 (3452) 499-700, Telegram и ВКонтакте.',
};

export default function ContactsPage() {
  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Контакты</span>
      </nav>

      <h1 className="h2 mt-4">Контакты</h1>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-line p-6 sm:p-8">
          <dl className="divide-y divide-line">
            <Row icon={<MapPin className="size-4" aria-hidden />} term="Адрес">
              {site.addressFull}
            </Row>
            <Row icon={<Clock3 className="size-4" aria-hidden />} term="Режим работы">
              {site.workingHours}
            </Row>
            <Row icon={<Phone className="size-4" aria-hidden />} term="Телефон">
              <a href={site.phoneHref} className="font-medium transition hover:text-accent">
                {site.phone}
              </a>
            </Row>
            <Row icon={<MessageCircle className="size-4" aria-hidden />} term="Менеджер">
              <a
                href={site.telegramManager}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent"
              >
                Написать в Telegram — {site.telegramManagerHandle}
              </a>
            </Row>
            <Row icon={<Send className="size-4" aria-hidden />} term="Мы в сети">
              <span className="flex flex-wrap gap-4">
                <a href={site.telegramChannel} target="_blank" rel="noreferrer" className="font-medium text-accent">
                  Telegram-канал
                </a>
                <a href={site.vk} target="_blank" rel="noreferrer" className="font-medium text-accent">
                  ВКонтакте
                </a>
              </span>
            </Row>
          </dl>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <a
              href={site.phoneHref}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-plum px-6 text-sm font-medium text-white transition hover:bg-plum-soft"
            >
              Позвонить
            </a>
            <AppLink
              href="/catalog"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-6 text-sm font-medium transition hover:border-line-strong"
            >
              Открыть каталог
            </AppLink>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 sm:p-8">
          <h2 className="h3">Как нас найти</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Магазин и сервис находятся по одному адресу: {site.addressFull}.
            Здесь можно забрать заказ, сдать устройство по trade-in и обратиться
            в сервис по гарантии.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Перед визитом лучше оставить заявку или позвонить — менеджер проверит
            наличие нужной модели и отложит устройство.
          </p>

          <p className="mt-6 rounded-xl bg-paper p-4 text-[12px] leading-relaxed text-ink-faint">
            Интерактивная карта будет подключена вместе с остальными разделами
            сайта — пока адрес указан текстом, чтобы не показывать непроверенную точку.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  term,
  children,
}: {
  icon: React.ReactNode;
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span className="mt-0.5 text-accent">{icon}</span>
      <dt className="w-[120px] shrink-0 text-sm text-ink-faint">{term}</dt>
      <dd className="flex-1 text-sm">{children}</dd>
    </div>
  );
}
