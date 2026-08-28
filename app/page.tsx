import {
  Categories,
  ContactsBlock,
  FeaturedProducts,
  HowItWorks,
  ServicePromo,
  TrustStrip,
} from '@/components/home/sections';
import { Hero } from '@/components/home/hero';
import { getPublicCatalog } from '@/lib/server/catalog-service';
import { site } from '@/lib/site';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

export default async function HomePage() {
  const { products } = await getPublicCatalog();

  const inStock = products.filter((product) => product.availability === 'in_stock');
  const featured = inStock.find((product) => product.generation === 'Pro Max') ?? inStock[0] ?? null;
  const highlights = inStock.slice(0, 8);

  return (
    <>
      <Hero featured={featured} />
      <TrustStrip />
      <Categories />
      <FeaturedProducts products={highlights} />
      <HowItWorks />
      <ServicePromo />
      <ContactsBlock />

      <script
        type="application/ld+json"
        // Structured data for local search results.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: site.name,
            telephone: site.phone,
            address: {
              '@type': 'PostalAddress',
              addressLocality: site.city,
              streetAddress: site.address,
              addressCountry: 'RU',
            },
            openingHours: 'Mo-Su 09:00-22:00',
          }),
        }}
      />
    </>
  );
}
