"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/features/Navbar";
import { DramaCard } from "@/components/features/DramaCard";
import { mockDramas } from "@/lib/mockData";
import type { Episode } from "@/types";

export default function DramaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drama = mockDramas.find((d) => d.id === params.id) || mockDramas[0];
  const [isFavorited, setIsFavorited] = useState(false);

  const handlePlay = () => {
    if (drama.episodes.length > 0) {
      router.push(`/drama/${drama.id}/play/${drama.episodes[0].id}`);
    }
  };

  const handleEpisodeClick = (episode: Episode) => {
    if (episode.isFree) {
      router.push(`/drama/${drama.id}/play/${episode.id}`);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-16">
        {/* Header */}
        <div className="relative h-[40vh] w-full md:h-[50vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${drama.cover})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Share & More */}
          <div className="absolute right-4 top-20 flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 -mt-32 relative z-10">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Poster */}
            <div className="hidden md:block">
              <div className="relative w-40 overflow-hidden rounded-lg shadow-xl">
                <Image
                  src={drama.cover}
                  alt={drama.title}
                  width={160}
                  height={240}
                  className="w-full"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
                {drama.title}
              </h1>

              <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-1 text-accent-gold">
                  <span>★</span>
                  <span>{drama.rating.toFixed(1)}</span>
                </div>
                <span>{drama.categories.join(" • ")}</span>
                <span>{drama.episodes.length} Episodes</span>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 font-medium text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Now
                </button>
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium transition ${
                    isFavorited
                      ? "bg-accent-primary text-white"
                      : "bg-bg-elevated text-white hover:bg-gray-600"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill={isFavorited ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {isFavorited ? "Saved" : "Save"}
                </button>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-text-primary">Description</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {drama.description}
                </p>
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              Episodes ({drama.episodes.length})
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {drama.episodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => handleEpisodeClick(episode)}
                  className={`group relative aspect-[9/16] overflow-hidden rounded-lg transition ${
                    episode.isFree ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <Image
                    src={`https://picsum.photos/seed/ep${episode.id}/200/300`}
                    alt={episode.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/20" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {episode.isFree ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                        <span className="text-xs font-medium text-white">{episode.unlockPrice}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <span className="text-xs font-medium text-white">Ep {episode.episodeNumber}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Related Dramas */}
          <div className="mt-12 pb-12">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Related Dramas</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {mockDramas.slice(0, 5).map((d) => (
                <DramaCard key={d.id} drama={d} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
