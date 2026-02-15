import { Navbar } from "@/components/features/Navbar";
import { DramaCard } from "@/components/features/DramaCard";
import { mockDramas, mockCategories } from "@/lib/mockData";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative h-[60vh] w-full overflow-hidden md:h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://picsum.photos/seed/hero/1920/1080)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />

        <div className="absolute bottom-20 left-0 right-0 mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-bold text-text-primary md:text-5xl">
            The CEO&apos;s Secret Love
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
            A romantic story about a CEO and his secret love. Watch now to
            discover their forbidden relationship.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 font-medium text-white transition hover:bg-red-700">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Now
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-bg-elevated px-6 py-2.5 font-medium text-white transition hover:bg-gray-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {mockCategories.map((category) => (
            <button
              key={category.id}
              className="whitespace-nowrap rounded-full bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-elevated hover:text-text-primary"
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Drama List */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-6 text-xl font-bold text-text-primary">
          Trending Dramas
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {mockDramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-elevated bg-bg-secondary py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-primary">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-text-primary">TinyTale</span>
          </div>
          <p className="mt-4 text-sm text-text-tertiary">
            © 2024 TinyTale. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
