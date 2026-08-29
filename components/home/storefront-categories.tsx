import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  ChevronRight,
  Fan,
  Gamepad2,
  Glasses,
  Headphones,
  Laptop,
  Radio,
  Smartphone,
  Sparkles,
  Speaker,
  Tablet,
  Tv,
  Watch,
  Wifi,
} from 'lucide-react';

import { AppLink } from '@/components/site/app-link';
import { Reveal } from '@/components/site/reveal';
import { withBase } from '@/lib/build-mode';
import { categoryHref } from '@/lib/catalog/categories';
import { CATEGORY_IMAGES } from '@/lib/catalog/images';
import type { CategoryId } from '@/lib/catalog/types';
import { site } from '@/lib/site';

interface StorefrontCategory {
  title: string;
  note: string;
  icon: LucideIcon;
  categoryId?: CategoryId;
  image?: string;
  wide?: boolean;
}

/**
 * Ассортиментная карта уровня полноценного магазина.
 *
 * Пять Apple-категорий используют официальные локальные изображения. Для
 * остальных направлений показывается строгая пиктограмма: так мы не выдаём
 * выдуманную картинку за реальный товар. Если в нормализованном каталоге ещё
 * нет позиций, плитка честно ведёт к менеджеру с пометкой «по запросу».
 */
const STOREFRONT_CATEGORIES: StorefrontCategory[] = [
  {
    title: 'iPhone',
    note: 'Все актуальные поколения',
    icon: Smartphone,
    categoryId: 'iphone',
    image: CATEGORY_IMAGES.iphone,
    wide: true,
  },
  {
    title: 'Mac',
    note: 'MacBook Air, Pro и Mac mini',
    icon: Laptop,
    categoryId: 'mac',
    image: CATEGORY_IMAGES.mac,
    wide: true,
  },
  {
    title: 'iPad',
    note: 'Для работы, учёбы и творчества',
    icon: Tablet,
    categoryId: 'ipad',
    image: CATEGORY_IMAGES.ipad,
  },
  {
    title: 'Apple Watch',
    note: 'Series, SE и Ultra',
    icon: Watch,
    categoryId: 'watch',
    image: CATEGORY_IMAGES.watch,
  },
  {
    title: 'AirPods',
    note: 'Наушники Apple',
    icon: Headphones,
    categoryId: 'airpods',
    image: CATEGORY_IMAGES.airpods,
  },
  {
    title: 'Samsung',
    note: 'Galaxy S, Z Fold и Watch',
    icon: Smartphone,
    categoryId: 'samsung',
  },
  {
    title: 'PlayStation',
    note: 'Консоли Sony',
    icon: Gamepad2,
    categoryId: 'gaming',
  },
  { title: 'Nintendo Switch', note: 'Консоли Nintendo', icon: Gamepad2 },
  { title: 'Xbox', note: 'Игровые консоли', icon: Gamepad2 },
  { title: 'Dyson', note: 'Красота и техника для дома', icon: Fan },
  { title: 'Xiaomi', note: 'Смартфоны и умные устройства', icon: Smartphone },
  { title: 'DJI', note: 'Камеры и стабилизаторы', icon: Camera },
  { title: 'Marshall', note: 'Домашнее и портативное аудио', icon: Speaker },
  { title: 'Яндекс Станции', note: 'Умные колонки', icon: Radio },
  { title: 'Умные часы', note: 'Часы и фитнес-браслеты', icon: Watch },
  { title: 'Фото и видео', note: 'Камеры и экшн-камеры', icon: Camera },
  { title: 'Умный дом', note: 'ТВ, колонки и устройства', icon: Wifi },
  { title: 'Ray-Ban Meta', note: 'Умные очки', icon: Glasses },
  { title: 'Портативное аудио', note: 'Колонки и наушники', icon: Headphones },
  { title: 'Техника для дома', note: 'Полезные устройства', icon: Tv },
];

const BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Dyson',
  'Xiaomi',
  'DJI',
  'Marshall',
  'Nintendo',
  'Яндекс',
  'Ray-Ban Meta',
];

export function StorefrontCategories({ populated }: { populated: CategoryId[] }) {
  const ready = new Set(populated);

  return (
    <section id="catalog" className="scroll-mt-28 overflow-hidden border-y border-line bg-surface py-16 lg:py-24">
      <div className="shell">
        <Reveal>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p className="eyebrow">Каталог техники</p>
              <h2 className="h2 mt-3 max-w-[720px]">Всё, что обычно ищут в нескольких магазинах</h2>
            </div>
            <div className="lg:text-right">
              <p className="text-sm leading-relaxed text-ink-soft">
                Заполненные категории открываются сразу. Остальное подберём по запросу —
                без выдуманного наличия и случайных товаров в каталоге.
              </p>
              <AppLink
                href="/catalog"
                className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
              >
                Открыть весь каталог
                <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </AppLink>
            </div>
          </div>
        </Reveal>

        <div className="brand-marquee mt-9 border-y border-line py-3" aria-label="Бренды в ассортименте">
          <div className="brand-marquee__track">
            {[...BRANDS, ...BRANDS].map((brand, index) => (
              <span key={`${brand}-${index}`} className="brand-marquee__item">
                {brand}
                <span aria-hidden>•</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STOREFRONT_CATEGORIES.map((category, index) => {
            const isReady = category.categoryId ? ready.has(category.categoryId) : false;
            const href = isReady && category.categoryId
              ? categoryHref(category.categoryId)
              : site.telegramManager;

            return (
              <Reveal
                key={category.title}
                delay={Math.min(index * 38, 260)}
                className={category.wide ? 'lg:col-span-2' : ''}
              >
                <AppLink
                  href={href}
                  target={isReady ? undefined : '_blank'}
                  rel={isReady ? undefined : 'noreferrer'}
                  className={`category-showcase-card group ${category.wide ? 'category-showcase-card--wide' : ''}`}
                  aria-label={`${category.title}: ${isReady ? 'открыть каталог' : 'уточнить у менеджера'}`}
                >
                  <div className="relative z-10 flex min-w-0 flex-col justify-between self-stretch">
                    <span className="grid size-10 place-items-center rounded-xl bg-paper/90 text-accent shadow-sm">
                      <category.icon className="size-4.5" strokeWidth={1.7} aria-hidden />
                    </span>
                    <div className="mt-8">
                      <h3 className="text-base font-semibold tracking-[-0.015em] sm:text-lg">
                        {category.title}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                        {category.note}
                      </p>
                      <span className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold ${isReady ? 'text-stock' : 'text-accent'}`}>
                        {isReady ? 'Каталог открыт' : 'Подберём по запросу'}
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </div>

                  {category.image
                    ? (
                      <div className="category-showcase-card__media">
                        <Image
                          src={withBase(category.image)}
                          alt=""
                          fill
                          sizes={category.wide ? '(max-width: 1024px) 46vw, 320px' : '(max-width: 640px) 45vw, 230px'}
                          loading="lazy"
                          className="category-showcase-card__image object-contain"
                        />
                      </div>
                    )
                    : (
                      <div className="category-showcase-card__watermark" aria-hidden>
                        <category.icon strokeWidth={0.9} />
                      </div>
                    )}
                </AppLink>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={100}>
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl bg-plum p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#cbb2d6]">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">Не нашли нужную категорию?</p>
                <p className="mt-1 text-sm text-white/55">Напишите модель — менеджер проверит варианты и цену.</p>
              </div>
            </div>
            <a
              href={site.telegramManager}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-plum transition hover:bg-[#f4edf7]"
            >
              Запросить подбор
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
