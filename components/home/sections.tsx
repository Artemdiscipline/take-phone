import {
  ArrowRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  UserRoundCog,
} from 'lucide-react';

import { ProductCard } from '@/components/catalog/product-card';
import { StorefrontCategories } from '@/components/home/storefront-categories';
import { Reveal } from '@/components/site/reveal';
import type { CatalogListing, CategoryId } from '@/lib/catalog/types';
import { site } from '@/lib/site';
import { AppLink } from '@/components/site/app-link';

/** Four claims that are already part of the shop's own materials. */
const TRUST = [
  { icon: ShieldCheck, title: 'Гарантия до 5 лет', note: 'На устройства Take Phone' },
  { icon: Store, title: 'Собственный сервис', note: 'Диагностика и ремонт в магазине' },
  { icon: RefreshCw, title: 'Trade-in любых брендов', note: 'Оценка при обращении' },
  { icon: UserRoundCog, title: 'Помощь с настройкой', note: 'Перенос данных и аккаунтов' },
];

export function TrustStrip() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
        {TRUST.map((item) => (
          <div key={item.title} className="flex gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              <p className="mt-1 text-[12px] text-ink-faint">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Категории на главной.
 *
 * Каждая плитка ведёт на страницу своей категории с модельными плашками —
 * не в общий плоский список товаров.
 */
export function Categories({ populated }: { populated: CategoryId[] }) {
  return <StorefrontCategories populated={populated} />;
}

export function FeaturedProducts({ listings }: { listings: CatalogListing[] }) {
  if (listings.length === 0) return null;

  return (
    <section className="border-y border-line bg-surface py-14 lg:py-20">
      <div className="shell">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Каталог iPhone</p>
              <h2 className="h2 mt-3">Актуально сейчас</h2>
            </div>
            <AppLink
              href="/catalog/iphone"
              className="group hidden items-center gap-2 text-sm font-medium text-accent sm:inline-flex"
            >
              Все модели
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </AppLink>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {listings.map((listing, index) => (
            <Reveal key={listing.id} delay={Math.min(index * 60, 240)}>
              <ProductCard listing={listing} />
            </Reveal>
          ))}
        </div>

        <AppLink
          href="/catalog/iphone"
          className="mt-6 flex h-12 items-center justify-center rounded-xl border border-line bg-paper text-sm font-medium sm:hidden"
        >
          Все модели iPhone
        </AppLink>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: '01',
    title: 'Выберите устройство',
    text: 'Модель, объём памяти и цвет — в каталоге видно актуальную цену и наличие.',
  },
  {
    number: '02',
    title: 'Оставьте заявку',
    text: 'Укажите телефон, способ получения и удобный вариант оплаты. Оплата на сайте не нужна.',
  },
  {
    number: '03',
    title: 'Заберите или получите',
    text: 'Менеджер подтверждает наличие и цену, дальше — самовывоз в магазине или доставка.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-plum py-16 text-white lg:py-24">
      <div className="shell">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="eyebrow text-[#c3a4d0]">Как купить</p>
              <h2 className="h2 mt-3 text-white">Без сложного оформления</h2>
            </div>
            <p className="max-w-[560px] text-[15px] leading-relaxed text-white/60">
              Заявка ни к чему не обязывает: менеджер проверит наличие, зафиксирует
              итоговую цену и предложит удобный способ получения.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 80}>
              <article className="h-full bg-plum p-7 lg:p-8">
                <span className="text-[12px] font-medium tracking-[0.14em] text-[#c3a4d0]">
                  {step.number}
                </span>
                <h3 className="mt-10 text-lg font-medium">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TradeInPromo() {
  return (
    <section id="trade-in" className="scroll-mt-28 border-y border-line bg-paper py-16 lg:py-24">
      <div className="shell grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="trade-in-panel h-full overflow-hidden rounded-2xl bg-plum p-8 text-white sm:p-10">
            <p className="eyebrow text-[#c3a4d0]">Trade-in</p>
            <h2 className="h2 mt-4 max-w-[520px] text-white">Обменяйте старую технику на новую</h2>
            <p className="mt-5 max-w-[500px] text-sm leading-relaxed text-white/60">
              Принимаем устройства любых брендов. Оценим состояние в магазине и
              учтём стоимость при покупке выбранной техники.
            </p>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <a
                href={site.telegramManager}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-plum transition hover:bg-[#f4edf7]"
              >
                Узнать предварительную оценку
              </a>
              <AppLink
                href="/service#trade-in"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-medium text-white transition hover:border-white/40"
              >
                Условия trade-in
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </AppLink>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['01', 'Любой бренд', 'Apple, Samsung, Xiaomi и другая техника.'],
            ['02', 'Честная оценка', 'Финальную сумму назовём после осмотра устройства.'],
            ['03', 'Всё за один визит', 'Оценка, перенос данных и настройка новой техники.'],
          ].map(([number, title, text], index) => (
            <Reveal key={number} delay={index * 80} className="h-full">
              <article className="group flex h-full min-h-[250px] flex-col justify-between rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:border-line-strong hover:bg-paper hover:shadow-[0_22px_50px_-32px_rgba(38,20,46,0.45)]">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-[11px] font-semibold text-accent">
                  {number}
                </span>
                <div className="mt-12">
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServicePromo() {
  return (
    <section id="service" className="shell scroll-mt-28 py-16 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <div>
            <p className="eyebrow">После покупки</p>
            <h2 className="h2 mt-3">Сервис остаётся рядом</h2>
            <p className="lede mt-5 max-w-[520px]">
              Гарантия до пяти лет подкреплена собственным сервисом в магазине.
              Здесь помогут с настройкой, диагностикой, ремонтом и trade-in.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {['Гарантия до 5 лет', 'Trade-in любых брендов', 'Сервис в магазине'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] font-medium"
                >
                  {chip}
                </span>
              ))}
            </div>

            <AppLink
              href="/service"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent"
            >
              Подробнее о гарантии и сервисе
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </AppLink>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-2xl bg-surface p-8 sm:p-10">
            <p className="text-[clamp(84px,12vw,150px)] font-semibold leading-[0.8] tracking-[-0.06em] text-plum">
              5
            </p>
            <p className="mt-6 text-2xl font-medium tracking-[-0.025em]">лет гарантии</p>
            <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-ink-soft">
              Не просто талон — специалисты в Тюмени, которым можно принести устройство лично.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ContactsBlock() {
  return (
    <section id="contacts" className="scroll-mt-28 border-t border-line bg-surface py-16 lg:py-20">
      <div className="shell grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <div className="h-full rounded-2xl bg-plum p-8 text-white sm:p-10">
            <p className="eyebrow text-[#c3a4d0]">Take Phone · {site.city}</p>
            <h2 className="h2 mt-4 text-white">Заберите устройство сегодня</h2>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <InfoTile icon={MapPin} label="Адрес" value={site.address} />
              <InfoTile icon={Clock3} label="Режим работы" value={site.workingHours} />
            </div>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={site.telegramManager}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-plum"
              >
                <MessageCircle className="size-4" aria-hidden />
                Написать менеджеру
              </a>
              <a
                href={site.phoneHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium"
              >
                <Phone className="size-4" aria-hidden />
                {site.phone}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div id="delivery" className="grid h-full scroll-mt-28 gap-4 rounded-2xl border border-line bg-paper p-8">
            <Detail
              icon={Store}
              title="Самовывоз"
              text={`${site.addressFull}. ${site.workingHours}.`}
            />
            <Detail
              icon={Truck}
              title="Доставка по Тюмени"
              text="Сроки и стоимость менеджер согласует при подтверждении заявки."
            />
            <Detail
              icon={ShieldCheck}
              title="Оплата"
              text="Перевод, наличные или банковская карта. При оплате картой добавляется 13,5%."
            />

            {/* Блок на главной — короткий анонс; подробные условия живут на своих страницах. */}
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm font-medium text-accent">
              <AppLink href="/delivery" className="group inline-flex items-center gap-1.5">
                Доставка и оплата
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </AppLink>
              <AppLink href="/contacts" className="group inline-flex items-center gap-1.5">
                Контакты и схема проезда
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </AppLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.07] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/[0.08]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] text-white/45">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{text}</p>
      </div>
    </div>
  );
}
