export default function DramaDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <div className="relative h-[46vh] min-h-[24rem] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,59,92,0.2),transparent_38%),linear-gradient(180deg,#181b22_0%,#0f1115_100%)]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/15" />
          <div className="mt-4 h-12 w-3/4 animate-pulse rounded-2xl bg-white/12" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 flex gap-3">
            <div className="h-12 flex-1 animate-pulse rounded-full bg-[#ff3b5c]/40" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      <div className="space-y-8 px-4 pb-10 pt-6">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-20 flex-none animate-pulse rounded-full bg-white/8"
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded-full bg-white/12" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[0.72] animate-pulse rounded-[18px] bg-white/8"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
