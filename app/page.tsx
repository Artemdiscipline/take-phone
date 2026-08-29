import {
  Categories,
  ContactsBlock,
  FeaturedProducts,
  HowItWorks,
  ServicePromo,
  TradeInPromo,
  TrustStrip,
} from '@/components/home/sections';
import { Hero } from '@/components/home/hero';
import { getPopulatedCategories, getPublicCatalog } from '@/lib/server/catalog-service';
import { site } from '@/lib/site';

// ISR: на Workers список обновляется раз в минуту, при статическом экспорте
// страница просто собирается один раз.
export const revalidate = 60;

export default async function HomePage() {
  const [{ listings }, populatedCategories] = await Promise.all([
    getPublicCatalog(),
    getPopulatedCategories(),
  ]);

  /*
    Витрина главной — про телефоны: список уже отсортирован от актуальных
    моделей к старым, поэтому первым доступным iPhone оказывается флагман
    текущей серии. Отдельного «маркетингового» списка тут нет.
  */
  const inStock = listings.filter((listing) => listing.availability === 'in_stock');
  const iphones = inStock.filter((listing) => listing.category === 'iphone');
  const featured = iphones[0] ?? inStock[0] ?? null;
  const highlights = iphones.slice(0, 8);

  return (
    <>
      <Hero featured={featured} />
      <TrustStrip />
      <Categories populated={populatedCategories} />
      <FeaturedProducts listings={highlights} />
      <HowItWorks />
      <TradeInPromo />
      <ServicePromo />
      <ContactsBlock />

      <script
        type="application/ld+json"
        // Разметка для локального поиска.
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
