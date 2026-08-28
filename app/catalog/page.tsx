import type { Metadata } from 'next';
import Link from 'next/link';

import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { getPublicCatalog } from '@/lib/server/catalog-service';

export const dynamic = 'force-dynamic';

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
  const [{ products }, params] = await Promise.all([
    getPublicCatalog(),
    searchParams,
  ]);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="text-[13px] text-ink-faint">
        <Link href="/" className="transition hover:text-accent">Главная</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Каталог iPhone</span>
      </nav>

      <header className="mb-7 mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="h2">Каталог iPhone</h1>
          <p className="lede mt-2 max-w-[560px]">
            Цена и наличие обновляются автоматически. Заявка ни к чему не обязывает —
            менеджер подтвердит всё до оплаты.
          </p>
        </div>
      </header>

      <CatalogBrowser initialProducts={products} initialQuery={params.q ?? ''} />
    </div>
  );
}
