import { ProductGridSkeleton } from '@/components/catalog/product-skeleton';

export default function CatalogLoading() {
  return (
    <div className="shell py-8 lg:py-12">
      <div className="skeleton h-3 w-40 rounded" />
      <div className="skeleton mt-5 h-9 w-64 rounded" />
      <div className="skeleton mt-3 h-4 w-full max-w-[520px] rounded" />
      <div className="skeleton mt-7 h-[76px] w-full rounded-2xl" />
      <div className="mt-9">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
