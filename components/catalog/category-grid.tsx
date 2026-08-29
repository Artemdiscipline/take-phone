import Image from 'next/image';
import { ChevronRight, Cpu, Gamepad2, Smartphone } from 'lucide-react';

import { AppLink } from '@/components/site/app-link';
import { Reveal } from '@/components/site/reveal';
import { withBase } from '@/lib/build-mode';
import { CATEGORY_ORDER, categoryHref, categoryLabel } from '@/lib/catalog/categories';
import { CATEGORY_IMAGES } from '@/lib/catalog/images';
import type { CategoryId } from '@/lib/catalog/types';

/**
 * Категории каталога.
 *
 * Готова та категория, в которой есть хотя бы одна позиция. Пустая категория
 * остаётся неактивной плиткой: ссылка «Mac», ведущая к телефонам, обманывает
 * ожидание сильнее, чем честная надпись «Скоро».
 */
export function CategoryGrid({
  populated,
  title,
  description,
}: {
  populated: CategoryId[];
  /** Не задан — сетка встраивается в чужой заголовок (главная страница). */
  title?: string;
  description?: string;
}) {
  const ready = new Set(populated);

  return (
    <section aria-labelledby={title ? 'category-grid-title' : undefined} aria-label={title ? undefined : 'Категории каталога'}>
      {title && (
        <Reveal>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <h2 id="category-grid-title" className="h3">{title}</h2>
            {description && (
              <p className="max-w-[440px] text-[13px] text-ink-soft sm:text-right">{description}</p>
            )}
          </div>
        </Reveal>
      )}

      <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${title ? 'mt-5' : ''}`}>
        {CATEGORY_ORDER.map((id, index) => (
          <Reveal key={id} delay={Math.min(index * 40, 200)} className="h-full">
            <CategoryTile id={id} ready={ready.has(id)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CategoryTile({ id, ready }: { id: CategoryId; ready: boolean }) {
  const image = CATEGORY_IMAGES[id];

  const inner = (
    <>
      <div className="relative h-24 w-full sm:h-28">
        {image
          ? (
            <Image
              src={withBase(image)}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, 260px"
              loading="lazy"
              style={{ objectFit: 'contain' }}
              className={`object-contain transition duration-500 ${
                ready ? 'group-hover:scale-105' : 'opacity-45 saturate-0'
              }`}
            />
          )
          : (
            <span className="grid h-full place-items-center">
              <CategoryIcon id={id} />
            </span>
          )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className={`text-[15px] font-medium ${ready ? '' : 'text-ink-faint'}`}>
            {categoryLabel(id)}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {ready ? 'Выбрать модель' : 'Скоро'}
          </p>
        </div>
        {ready && (
          <ChevronRight
            className="size-4 text-ink-faint transition group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </div>
    </>
  );

  if (!ready) {
    return (
      <div
        aria-label={`${categoryLabel(id)} — скоро`}
        className="flex h-full flex-col justify-between rounded-2xl bg-surface p-4 sm:p-5"
      >
        {inner}
      </div>
    );
  }

  return (
    <AppLink
      href={categoryHref(id)}
      className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-paper p-4 transition hover:border-line-strong hover:shadow-[0_18px_44px_-28px_rgba(38,20,46,0.45)] sm:p-5"
    >
      {inner}
    </AppLink>
  );
}

/** Заглушка для категорий, для которых ещё нет предметной съёмки. */
function CategoryIcon({ id }: { id: CategoryId }) {
  const Icon = id === 'samsung' ? Smartphone : id === 'gaming' ? Gamepad2 : Cpu;
  return <Icon className="size-9 text-ink-faint/45" strokeWidth={1.2} aria-hidden />;
}
