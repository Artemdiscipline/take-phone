import type { Metadata } from 'next';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { AppLink } from '@/components/site/app-link';
import { getPublicCatalog } from '@/lib/server/catalog-service';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Каталог iPhone в Тюмени',
  description:
    'Актуальные цены и наличие iPhone в Тюмени: фильтры по модели, памяти и цвету, '
    + 'статус наличия и заявка без онлайн-оплаты.',
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ listings, demoData }, params] = await Promise.all([
    getPublicCatalog(),
    searchParams,
  ]);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Каталог iPhone</span>
      </nav>

      <header className="mb-7 mt-4">
        <h1 className="h2">Каталог iPhone</h1>
        <p className="lede mt-2 max-w-[560px]">
          Цена и наличие обновляются автоматически. Заявка ни к чему не обязывает —
          менеджер подтвердит всё до оплаты.
        </p>
      </header>

      <CatalogBrowser
        initialListings={listings}
        initialQuery={params.q ?? ''}
        demoData={demoData}
      />
    </div>
  );
}
