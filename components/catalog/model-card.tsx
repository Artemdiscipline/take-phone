import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

import { AppLink } from '@/components/site/app-link';
import { withBase } from '@/lib/build-mode';
import type { CatalogModelGroup } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/format';

/**
 * Модельная плашка каталога.
 *
 * Показывает ровно то, что нужно для выбора модели: фотографию, название и
 * стартовую цену. Характеристики вариантов (память, цвет, SIM) сюда не
 * выносятся — они на странице самой модели.
 *
 * Кликабельна вся карточка целиком: на телефоне попасть по маленькой ссылке
 * трудно, а промах уводит человека обратно к фильтрам.
 */
export function ModelCard({
  model,
  priority = false,
}: {
  model: CatalogModelGroup;
  priority?: boolean;
}) {
  const soldOut = model.availability === 'out_of_stock';

  return (
    <AppLink
      href={model.href}
      aria-label={`${model.modelName} — открыть модель`}
      className="model-card group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper"
    >
      <div className="relative aspect-[4/3] w-full bg-surface">
        <Image
          src={withBase(model.image)}
          alt={model.modelName}
          fill
          sizes="(max-width: 420px) 92vw, (max-width: 1024px) 46vw, 300px"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={`model-card__image object-contain p-6 sm:p-8 ${soldOut ? 'opacity-60 saturate-50' : ''}`}
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-[17px] font-medium leading-snug tracking-[-0.015em] text-ink sm:text-[18px]">
          {model.modelName}
        </h3>

        {model.optionSummary && (
          <p className="mt-1.5 text-[13px] text-ink-faint">{model.optionSummary}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div className="min-w-0">
            {model.price === null
              ? <p className="text-[15px] font-medium text-ink-faint">Нет в наличии</p>
              : (
                <p className="text-[19px] font-semibold tracking-[-0.02em]">
                  <span className="text-[13px] font-normal text-ink-faint">от </span>
                  {formatPrice(model.price)}
                </p>
              )}
            <p className="mt-1 text-[12px] text-ink-faint">
              {model.variantCount} {plural(model.variantCount, 'вариант', 'варианта', 'вариантов')}
            </p>
          </div>

          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-soft transition group-hover:bg-plum group-hover:text-white"
            aria-hidden
          >
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>
    </AppLink>
  );
}

function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
