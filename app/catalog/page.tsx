import type { Metadata } from 'next';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { CategoryGrid } from '@/components/catalog/category-grid';
import { AppLink } from '@/components/site/app-link';
import { getPopulatedCategories, getPublicCatalog } from '@/lib/server/catalog-service';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Каталог техники в Тюмени',
  description:
    'Каталог техники Take Phone в Тюмени: iPhone, Apple Watch и другие категории, '
    + 'актуальные цены, наличие и заявка без онлайн-оплаты.',
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ listings, demoData }, populatedCategories, params] = await Promise.all([
    getPublicCatalog(),
    getPopulatedCategories(),
    searchParams,
  ]);

  const query = params.q?.trim() ?? '';

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Каталог</span>
      </nav>

      <header className="mb-7 mt-4">
        <h1 className="h2">Каталог техники</h1>
        <p className="lede mt-2 max-w-[560px]">
          Сначала выберите категорию, затем конкретную модель. Внутри модели доступны
          комплектации, цвета и варианты связи.
        </p>
      </header>

      <CategoryGrid
        populated={populatedCategories}
        title="Выберите категорию"
        description="Как в обычном магазине: сначала тип техники, затем модель и комплектация."
      />

      {query && (
        <section className="mt-14 border-t border-line pt-10" aria-labelledby="search-results-title">
          <h2 id="search-results-title" className="h3">Результаты поиска</h2>
          <p className="mt-2 text-sm text-ink-soft">
            По запросу «{query}» во всех открытых категориях.
          </p>
          <div className="mt-6">
            <CatalogBrowser
              initialListings={listings}
              initialQuery={query}
              demoData={demoData}
            />
          </div>
        </section>
      )}
    </div>
  );
}
