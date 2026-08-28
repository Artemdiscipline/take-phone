/** Matches the product card box model exactly so refreshing causes no layout shift. */
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton aspect-square" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex items-end justify-between pt-5">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton size-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <output
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Каталог обновляется"
    >
      {Array.from({ length: count }, (_, index) => <ProductCardSkeleton key={index} />)}
    </output>
  );
}
