'use client';

interface MobileShelfSkeletonProps {
  titleWidthClass?: string;
  items?: number;
}

export function MobileHeroSkeleton() {
  return (
    <section className="relative h-[76vh] w-full overflow-hidden md:hidden">
      <div className="bg-shimmer absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-10">
        <div className="bg-shimmer h-7 w-24 rounded-full" />
        <div className="mt-4 space-y-3">
          <div className="bg-shimmer h-10 w-4/5 rounded-2xl" />
          <div className="bg-shimmer h-10 w-2/3 rounded-2xl" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="bg-shimmer h-4 w-20 rounded-full" />
          <div className="bg-shimmer h-4 w-16 rounded-full" />
          <div className="bg-shimmer h-4 w-14 rounded-full" />
        </div>
        <div className="mt-6 flex gap-3">
          <div className="bg-shimmer h-12 w-32 rounded-full" />
          <div className="bg-shimmer h-12 w-28 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function MobilePillRowSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:hidden">
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="bg-shimmer h-9 w-20 shrink-0 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

export function MobileShelfSkeleton({
  titleWidthClass = 'w-32',
  items = 4,
}: MobileShelfSkeletonProps) {
  return (
    <section className="px-4 py-6 md:hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className={`bg-shimmer h-6 rounded-full ${titleWidthClass}`} />
        <div className="bg-shimmer h-4 w-12 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(items)].map((_, index) => (
          <div key={index}>
            <div className="bg-shimmer aspect-[3/4] rounded-[22px]" />
            <div className="mt-3 space-y-2">
              <div className="bg-shimmer h-4 w-4/5 rounded-full" />
              <div className="bg-shimmer h-3 w-2/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MobileBrowseGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:hidden">
      {[...Array(8)].map((_, index) => (
        <div key={index}>
          <div className="bg-shimmer aspect-[2/3] rounded-[20px]" />
          <div className="mt-3 space-y-2">
            <div className="bg-shimmer h-4 w-4/5 rounded-full" />
            <div className="bg-shimmer h-3 w-3/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
