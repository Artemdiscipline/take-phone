import type { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, Store, UserRoundCog } from 'lucide-react';

import { Reveal } from '@/components/site/reveal';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Гарантия, сервис и trade-in',
  description:
    'Гарантия до 5 лет, собственный сервис в Тюмени, trade-in устройств любых брендов '
    + 'и помощь с настройкой после покупки в Take Phone.',
};

const BLOCKS = [
  {
    icon: ShieldCheck,
    title: 'Гарантия до 5 лет',
    text: 'Гарантия распространяется на устройства, купленные в Take Phone. Условия по '
      + 'конкретной модели менеджер фиксирует при оформлении заявки.',
  },
  {
    icon: Store,
    title: 'Собственный сервис',
    text: `Диагностика и ремонт выполняются в магазине: ${site.addressFull}. `
      + 'Устройство можно принести лично, без пересылки в другой город.',
  },
  {
    icon: UserRoundCog,
    title: 'Помощь с настройкой',
    text: 'Перенос данных со старого телефона, вход в аккаунты и базовая настройка — '
      + 'делаем при получении устройства.',
  },
];

export default function ServicePage() {
  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <Link href="/" className="transition hover:text-accent">Главная</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Гарантия и сервис</span>
      </nav>

      <header className="mt-4 max-w-[680px]">
        <h1 className="h2">Гарантия, сервис и trade-in</h1>
        <p className="lede mt-3">
          Покупка не заканчивается на выдаче устройства: сервис Take Phone работает
          в том же магазине, куда вы приходите за техникой.
        </p>
      </header>

      <div className="mt-10 grid gap-3 lg:grid-cols-3">
        {BLOCKS.map((block, index) => (
          <Reveal key={block.title} delay={index * 70}>
            <article className="h-full rounded-2xl border border-line p-6 sm:p-7">
              <block.icon className="size-5 text-accent" aria-hidden />
              <h2 className="mt-6 text-lg font-medium tracking-[-0.015em]">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{block.text}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <section id="trade-in" className="mt-4 scroll-mt-28">
        <Reveal>
          <div className="grid items-center gap-8 rounded-2xl bg-surface p-8 sm:p-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <RefreshCw className="size-5 text-accent" aria-hidden />
              <h2 className="h3 mt-6">Trade-in любых брендов</h2>
              <p className="mt-3 max-w-[460px] text-sm leading-relaxed text-ink-soft">
                Старое устройство можно сдать в зачёт нового — принимаем технику любых
                производителей, не только Apple. Итоговую оценку менеджер называет
                после осмотра: она зависит от модели, состояния и комплектации.
              </p>
            </div>

            <ol className="space-y-3 text-sm">
              {[
                'Оставьте заявку на нужное устройство и укажите в комментарии, что планируете trade-in.',
                'Принесите старое устройство в магазин — оценка занимает несколько минут.',
                'Сумма оценки вычитается из стоимости нового устройства.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl bg-paper p-4">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-medium text-accent">
                    {index + 1}
                  </span>
                  <span className="text-ink-soft">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      <section className="mt-10 rounded-2xl border border-line p-6 sm:p-8">
        <h2 className="h3">Как обратиться в сервис</h2>
        <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-ink-soft">
          Позвоните по номеру <a href={site.phoneHref} className="font-medium text-ink">{site.phone}</a>{' '}
          или напишите в{' '}
          <a href={site.telegram} target="_blank" rel="noreferrer" className="font-medium text-accent">
            Telegram
          </a>
          . Магазин и сервис работают по адресу {site.addressFull}, {site.workingHours.toLowerCase()}.
        </p>
      </section>
    </div>
  );
}
