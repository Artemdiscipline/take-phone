import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductDetail } from '@/components/product/product-detail';
import { AppLink } from '@/components/site/app-link';
import { categoryHref, categoryLabel, modelHref } from '@/lib/catalog/categories';
import { AVAILABILITY_LABELS, colorRu } from '@/lib/catalog/normalize';
import {
  getListingBySlug,
  getModelListings,
  getPublicCatalog,
  getRelatedListings,
} from '@/lib/server/catalog-service';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

/** Список карточек для предгенерации — он же нужен статическому экспорту. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { listings } = await getPublicCatalog();
  return listings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) return { title: 'Устройство не найдено' };

  const color = colorRu(listing.color) ?? listing.color;
  const sim = listing.hasSimChoice
    ? 'на выбор eSIM или две nano-SIM'
    : listing.variants[0].simLabel;

  const description =
    `${listing.title} в Тюмени — ${AVAILABILITY_LABELS[listing.availability].toLowerCase()}. `
    + `Память ${listing.memoryLabel}, цвет ${color}, ${sim}. `
    + 'Гарантия до 5 лет, самовывоз и доставка.';

  return {
    title: listing.title,
    description,
    openGraph: {
      title: `${listing.title} — Take Phone`,
      description,
      images: [{ url: listing.images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) notFound();

  const [modelListings, related] = await Promise.all([
    getModelListings(listing),
    getRelatedListings(listing),
  ]);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="mb-7 text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <AppLink href="/catalog" className="transition hover:text-accent">Каталог</AppLink>
        <span className="mx-2">/</span>
        <AppLink href={categoryHref(listing.category)} className="transition hover:text-accent">
          {categoryLabel(listing.category)}
        </AppLink>
        <span className="mx-2">/</span>
        <AppLink
          href={modelHref(listing.category, listing.modelSlug)}
          className="transition hover:text-accent"
        >
          {listing.modelName}
        </AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{listing.memoryLabel}</span>
      </nav>

      <ProductDetail listing={listing} modelListings={modelListings} related={related} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: listing.title,
            brand: { '@type': 'Brand', name: listing.brand },
            image: listing.images,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'RUB',
              price: listing.price,
              availability: listing.availability === 'in_stock'
                ? 'https://schema.org/InStock'
                : listing.availability === 'to_order'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
    </div>
  );
}
