import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { ModelGrid } from '@/components/catalog/model-grid';
import { AppLink } from '@/components/site/app-link';
import {
  categoryGenitive,
  categoryLabel,
  categorySlug,
} from '@/lib/catalog/categories';
import type { CategoryId } from '@/lib/catalog/types';
import {
  getCategoryCatalog,
  getPopulatedCategories,
} from '@/lib/server/catalog-service';

// ISR на рабочем сервере; скрипт превью временно переводит страницу в статику.
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ category: string }[]> {
  const categories = await getPopulatedCategories();
  return categories.map((id) => ({ category: categorySlug(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const catalog = await getCategoryCatalog(category);

  if (!catalog) return { title: 'Категория не найдена' };

  const label = categoryLabel(catalog.category);
  return {
    title: `${label} в Тюмени`,
    description:
      `Выберите модель ${label} в каталоге Take Phone. `
      + 'Актуальные цены, наличие и заявка без онлайн-оплаты.',
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const catalog = await getCategoryCatalog(category);

  if (!catalog || catalog.listings.length === 0) notFound();

  const label = categoryLabel(catalog.category);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <AppLink href="/catalog" className="transition hover:text-accent">Каталог</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{label}</span>
      </nav>

      <header className="mb-8 mt-4 lg:mb-10">
        <p className="eyebrow">Каталог · Тюмень</p>
        <h1 className="h2 mt-2">{label}</h1>
        <p className="lede mt-2 max-w-[620px]">
          Выберите интересующую модель. После этого покажем только её доступные
          цвета, размеры и комплектации.
        </p>
      </header>

      <ModelGrid
        models={catalog.models}
        title={`Выберите модель ${categoryGenitive(catalog.category)}`}
        description="Плашки собраны из каталога автоматически — новые модели появятся здесь вместе с товарами."
      />

      <section className="mt-14 border-t border-line pt-10 lg:mt-16" aria-labelledby="all-products-title">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Вся категория</p>
            <h2 id="all-products-title" className="h3 mt-2">Все товары {allProductsSuffix(catalog.category)}</h2>
          </div>
          <p className="max-w-[440px] text-[13px] text-ink-soft sm:text-right">
            Фильтры остаются для тех, кто уже знает нужную память, цвет или размер.
          </p>
        </div>

        <CatalogBrowser
          initialListings={catalog.listings}
          demoData={catalog.demoData}
          scope={{ categorySlug: catalog.categorySlug }}
        />
      </section>
    </div>
  );
}

function allProductsSuffix(category: CategoryId): string {
  switch (category) {
    case 'iphone': return 'iPhone';
    case 'watch': return 'Apple Watch';
    case 'gaming': return 'игровой техники';
    case 'electronics': return 'другой электроники';
    default: return categoryLabel(category);
  }
}
