import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { AppLink } from '@/components/site/app-link';
import { categoryHref, categoryLabel } from '@/lib/catalog/categories';
import {
  getModelCatalog,
  getModelRouteParams,
} from '@/lib/server/catalog-service';

// ISR на рабочем сервере; скрипт превью временно переводит страницу в статику.
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ category: string; model: string }[]> {
  return getModelRouteParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; model: string }>;
}): Promise<Metadata> {
  const { category, model } = await params;
  const catalog = await getModelCatalog(category, model);

  if (!catalog) return { title: 'Модель не найдена' };

  return {
    title: `${catalog.model.modelName} в Тюмени`,
    description:
      `${catalog.model.modelName}: доступные цвета, комплектации и цены в Take Phone. `
      + 'Менеджер подтверждает наличие перед покупкой.',
    openGraph: {
      title: `${catalog.model.modelName} — Take Phone`,
      description: `Выберите подходящий вариант ${catalog.model.modelName} в Тюмени.`,
      images: [{ url: catalog.model.image }],
    },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ category: string; model: string }>;
}) {
  const { category, model } = await params;
  const catalog = await getModelCatalog(category, model);

  if (!catalog || catalog.listings.length === 0) notFound();

  const categoryName = categoryLabel(catalog.category);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <AppLink href="/catalog" className="transition hover:text-accent">Каталог</AppLink>
        <span className="mx-2">/</span>
        <AppLink href={categoryHref(catalog.category)} className="transition hover:text-accent">
          {categoryName}
        </AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{catalog.model.modelName}</span>
      </nav>

      <header className="mb-7 mt-4 lg:mb-9">
        <p className="eyebrow">{categoryName} · Тюмень</p>
        <h1 className="h2 mt-2">{catalog.model.modelName}</h1>
        <p className="lede mt-2 max-w-[640px]">
          Выберите конкретный вариант по характеристикам. Каждый цвет, размер,
          объём памяти и тип связи показан отдельной карточкой.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-ink-soft">
          {catalog.model.optionSummary && (
            <span className="rounded-full bg-surface px-3 py-1.5">{catalog.model.optionSummary}</span>
          )}
          <span className="rounded-full bg-surface px-3 py-1.5">
            {catalog.model.variantCount} вариантов
          </span>
        </div>
      </header>

      <CatalogBrowser
        initialListings={catalog.listings}
        demoData={catalog.demoData}
        scope={{ categorySlug: catalog.categorySlug, modelSlug: catalog.model.modelSlug }}
        expandVariants
        showSearch={false}
      />
    </div>
  );
}
