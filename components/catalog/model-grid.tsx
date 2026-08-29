import { Reveal } from '@/components/site/reveal';
import type { CatalogModelGroup } from '@/lib/catalog/types';
import { ModelCard } from './model-card';

/**
 * Блок «Выберите модель» — главный способ навигации по категории.
 *
 * Сетка: одна плашка в строке на узких экранах, две — начиная с 420 px, дальше
 * три и четыре. Названия моделей короткие, но в одну колонку на 360 px они
 * гарантированно помещаются целиком.
 */
export function ModelGrid({
  models,
  title,
  description,
}: {
  models: CatalogModelGroup[];
  title: string;
  description?: string;
}) {
  if (models.length === 0) return null;

  return (
    <section aria-labelledby="model-grid-title">
      <Reveal>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 id="model-grid-title" className="h3">{title}</h2>
          {description && (
            <p className="max-w-[440px] text-[13px] text-ink-soft sm:text-right">{description}</p>
          )}
        </div>
      </Reveal>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {models.map((model, index) => (
          <Reveal key={model.id} delay={Math.min(index * 50, 200)} className="h-full">
            <ModelCard model={model} priority={index < 4} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
