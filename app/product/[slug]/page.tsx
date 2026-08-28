import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLink } from '@/components/site/app-link';

import { ProductDetail } from '@/components/product/product-detail';
import { AVAILABILITY_LABELS, colorRu } from '@/lib/catalog/normalize';
import {
  getModelVariants,
  getProductBySlug,
  getPublicCatalog,
  getRelatedProducts,
} from '@/lib/server/catalog-service';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

/** Список карточек для предгенерации — он же нужен статическому экспорту. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { products } = await getPublicCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Устройство не найдено' };

  const color = colorRu(product.color) ?? product.color;
  const description =
    `${product.title} в Тюмени — ${AVAILABILITY_LABELS[product.availability].toLowerCase()}. `
    + `Память ${product.memoryLabel}, цвет ${color}, ${product.simLabel}. `
    + 'Гарантия до 5 лет, самовывоз и доставка.';

  return {
    title: product.title,
    description,
    openGraph: {
      title: `${product.title} — Take Phone`,
      description,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [variants, related] = await Promise.all([
    getModelVariants(product),
    getRelatedProducts(product),
  ]);

  return (
    <div className="shell py-8 lg:py-12">
      <nav aria-label="Хлебные крошки" className="mb-7 text-[13px] text-ink-faint">
        <AppLink href="/" className="transition hover:text-accent">Главная</AppLink>
        <span className="mx-2">/</span>
        <AppLink href="/catalog" className="transition hover:text-accent">Каталог iPhone</AppLink>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{product.model}</span>
      </nav>

      <ProductDetail product={product} variants={variants} related={related} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            brand: { '@type': 'Brand', name: product.brand },
            image: product.images,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'RUB',
              price: product.price,
              availability: product.availability === 'in_stock'
                ? 'https://schema.org/InStock'
                : product.availability === 'to_order'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
    </div>
  );
}
