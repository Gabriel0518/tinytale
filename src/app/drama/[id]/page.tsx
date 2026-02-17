"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { dramasApi, commentsApi } from "@/lib/api";
import { Drama, Episode, Comment } from "@/types";
import { Navbar } from "@/components/features/Navbar";

export default function DramaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dramaId = params.id as string;

  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'comments'>('episodes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dramaRes, commentsRes] = await Promise.all([
          dramasApi.getById(dramaId),
          commentsApi.getByDrama(dramaId),
        ]);

        setDrama(dramaRes.data?.drama || null);
        setEpisodes(dramaRes.data?.episodes || []);
        setComments(commentsRes.data?.comments || []);
      } catch (error) {
        console.error('Failed to fetch drama:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dramaId]);

  const handlePlay = (episode?: Episode) => {
    const targetEpisode = episode || episodes[0];
    if (targetEpisode) {
      router.push(`/drama/${dramaId}/play/${targetEpisode._id}`);
    }
  };

  const toggleFavorite = async () => {
    // TODO: Implement favorite toggle with auth
    setIsFavorited(!isFavorited);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Drama not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <Navbar />

      <main className="pt-16">
        {/* Header */}
        <div className="relative h-[40vh] w-full md:h-[50vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${drama.cover})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <img
                src={drama.cover}
                alt={drama.title}
                className="hidden h-48 w-32 rounded-lg object-cover md:block"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white md:text-4xl">{drama.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {drama.rating?.toFixed(1)}
                  </span>
                  <span>{drama.year}</span>
                  <span>{drama.totalEpisodes || episodes.length} Episodes</span>
                  {drama.categories?.map((cat) => (
                    <span key={cat} className="rounded-full bg-gray-800 px-2 py-0.5">{cat}</span>
                  ))}
                </div>
                <p className="mt-4 max-w-2xl text-sm text-gray-300">{drama.description}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handlePlay()}
                    className="flex items-center gap-2 rounded bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`flex items-center gap-2 rounded px-6 py-2.5 font-medium transition ${
                      isFavorited
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorited ? 'Favorited' : 'Add to Favorites'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-2 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'episodes'
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Episodes ({episodes.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'comments'
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Comments ({comments.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'episodes' && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {episodes.map((episode) => (
                  <button
                    key={episode._id}
                    onClick={() => handlePlay(episode)}
                    className="group relative overflow-hidden rounded-lg bg-gray-900 p-3 text-left transition hover:bg-gray-800"
                  >
                    <div className="aspect-video overflow-hidden rounded">
                      <img
                        src={episode.thumbnail || drama.cover}
                        alt={episode.title}
                        className="h-full w-full object-cover"
                      />
                      {episode.isFree && (
                        <div className="absolute left-2 top-2 rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">
                          FREE
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="truncate text-sm font-medium text-white">
                        Ep {episode.episodeNumber}: {episode.title}
                      </p>
                      <p className="text-xs text-gray-400">{episode.duration} min</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="rounded-lg bg-gray-900 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700">
                          <span className="text-sm font-medium text-white">
                            {comment.userId?.nickname?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {comment.userId?.nickname || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-300">{comment.content}</p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-white">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {comment.likes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
