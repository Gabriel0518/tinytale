import { useMemo, useState } from 'react';
import type { Drama, Review } from '@domain';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DramaList } from '../../components/DramaList';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData, unwrapCollectionData } from '../../lib/api-response';
import { playbackProgressRepository } from '../../lib/cache';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const DETAIL_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const FAVORITES_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

function formatProgressLabel(currentTime: number, duration: number) {
  const safeDuration = Math.max(1, duration);
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60)
    .toString()
    .padStart(2, '0');
  const percent = Math.round((currentTime / safeDuration) * 100);
  return `${minutes}:${seconds} watched · ${percent}%`;
}

export function DramaDetailScreen() {
  const { dramaId = '' } = useParams();
  const navigate = useNavigate();
  const api = useShellApi();
  const { token, user } = useNativeAuth();
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);

  const dramaQuery = useCachedQuery({
    cacheKey: `drama:${dramaId}:detail`,
    cacheMaxAgeMs: DETAIL_CACHE_MAX_AGE_MS,
    queryKey: ['drama', dramaId, 'detail'],
    queryFn: () => api.dramas.getById(dramaId),
    enabled: Boolean(dramaId),
  });

  const relatedQuery = useCachedQuery({
    cacheKey: `drama:${dramaId}:related`,
    cacheMaxAgeMs: DETAIL_CACHE_MAX_AGE_MS,
    queryKey: ['drama', dramaId, 'related'],
    queryFn: () => api.dramas.getRelated(dramaId),
    enabled: Boolean(dramaId),
  });

  const reviewsQuery = useCachedQuery({
    cacheKey: `drama:${dramaId}:reviews`,
    cacheMaxAgeMs: DETAIL_CACHE_MAX_AGE_MS,
    queryKey: ['drama', dramaId, 'reviews'],
    queryFn: () => api.reviews.getByDrama(dramaId),
    enabled: Boolean(dramaId),
  });

  const favoritesQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:favorites`,
    cacheMaxAgeMs: FAVORITES_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'favorites'],
    queryFn: () => api.user.getFavorites(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const drama = unwrapApiData<Drama>(dramaQuery.data);
  const relatedDramas = unwrapCollectionData<Drama>(relatedQuery.data, ['dramas', 'items']);
  const reviews = unwrapApiData<Review[]>(reviewsQuery.data) ?? [];
  const favoriteDramas = unwrapCollectionData<Drama>(favoritesQuery.data, ['favorites', 'dramas', 'items']);
  const episodes = drama?.episodes ?? [];
  const favoriteFromRemote = favoriteDramas.some((favoriteDrama) => favoriteDrama._id === dramaId);
  const isFavorite = favoriteOverride ?? favoriteFromRemote;
  const heroCover = drama?.horizontalCover || drama?.cover || '';

  const resumeSnapshot = useMemo(() => {
    return episodes
      .map((episode) =>
        playbackProgressRepository.read({
          episodeId: episode._id,
          streamVideoId: episode.streamVideoId,
          videoUrl: episode.videoUrl,
        })
      )
      .filter((snapshot): snapshot is NonNullable<typeof snapshot> => Boolean(snapshot))
      .sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
  }, [episodes]);

  const resumeEpisode = episodes.find((episode) => episode._id === resumeSnapshot?.episodeId) ?? episodes[0] ?? null;
  const featuredReviews = reviews.slice(0, 3);

  async function handleFavoriteToggle() {
    if (!dramaId) return;
    if (!token) {
      navigate(routeBuilders.login());
      return;
    }

    setFavoritePending(true);
    const nextFavoriteState = !isFavorite;
    setFavoriteOverride(nextFavoriteState);

    try {
      if (nextFavoriteState) {
        await api.user.addFavorite(token, dramaId);
      } else {
        await api.user.removeFavorite(token, dramaId);
      }

      await favoritesQuery.refetch();
      setFavoriteOverride(null);
    } catch {
      setFavoriteOverride(!nextFavoriteState);
    } finally {
      setFavoritePending(false);
    }
  }

  return (
    <section className="screen-stack">
      <article className={`app-hero-card ${heroCover ? 'app-hero-card-media' : ''}`}>
        {heroCover ? (
          <div className="app-hero-cover">
            <img alt={drama?.title || 'Drama cover'} src={heroCover} />
          </div>
        ) : null}
        <div className="app-hero-content">
          <p className="app-kicker">{drama?.categories?.[0] || 'Drama detail'}</p>
          <h2 className="app-hero-title">{drama?.title || 'Preparing drama detail route'}</h2>
          <p className="app-hero-subtitle">
            {drama?.description ||
              'The drama detail page keeps the old app order: headline, actions, episode queue, reviews, and related titles.'}
          </p>
          <div className="meta-pill-row">
            <span className="meta-pill">{drama?.country || drama?.language || 'Global release'}</span>
            <span className="meta-pill">{drama?.isCompleted ? 'Completed' : 'Updating weekly'}</span>
            <span className="meta-pill">{episodes.length || drama?.totalEpisodes || 0} episodes</span>
          </div>

          <div className="app-hero-actions">
            {resumeEpisode ? (
              <Link
                className="app-primary-button"
                to={routeBuilders.playEpisode(dramaId, resumeEpisode._id)}
              >
                {resumeSnapshot ? 'Resume playback' : 'Play now'}
              </Link>
            ) : null}
            <button
              className="app-secondary-button shell-button-reset"
              disabled={favoritePending}
              onClick={() => {
                void handleFavoriteToggle();
              }}
              type="button"
            >
              {favoritePending ? 'Saving...' : isFavorite ? 'Remove from watch list' : 'Add to watch list'}
            </button>
          </div>

          <div className="screen-stats">
            <article className="screen-stat">
              <div className="screen-stat-label">Rating</div>
              <div className="screen-stat-value">{drama?.rating ? drama.rating.toFixed(1) : 'New'}</div>
            </article>
            <article className="screen-stat">
              <div className="screen-stat-label">Episodes</div>
              <div className="screen-stat-value">{episodes.length || drama?.totalEpisodes || 0}</div>
            </article>
            <article className="screen-stat">
              <div className="screen-stat-label">Status</div>
              <div className="screen-stat-value">{drama?.isCompleted ? 'Completed' : 'Updating'}</div>
            </article>
            <article className="screen-stat">
              <div className="screen-stat-label">Resume</div>
              <div className="screen-stat-value">
                {resumeSnapshot ? formatProgressLabel(resumeSnapshot.currentTime, resumeSnapshot.duration) : 'Start fresh'}
              </div>
            </article>
          </div>
        </div>
      </article>

      <QueryState
        isLoading={dramaQuery.isLoading || relatedQuery.isLoading || reviewsQuery.isLoading}
        isFetching={dramaQuery.isFetching || relatedQuery.isFetching || reviewsQuery.isFetching}
        error={dramaQuery.error || relatedQuery.error || reviewsQuery.error}
        empty={!drama}
        emptyLabel="No drama detail is available for this route yet."
        onRetry={() => {
          void dramaQuery.refetch();
          void relatedQuery.refetch();
          void reviewsQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={3} title="Hydrating drama detail" />}
      >
        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Episode list</p>
              <h3 className="section-title">Choose an episode</h3>
            </div>
            <span className="section-meta">{episodes.length} episodes</span>
          </div>
          <div className="episode-grid">
            {episodes.map((episode) => {
              const snapshot = playbackProgressRepository.read({
                episodeId: episode._id,
                streamVideoId: episode.streamVideoId,
                videoUrl: episode.videoUrl,
              });

              return (
                <Link
                  key={episode._id}
                  className="episode-card"
                  to={routeBuilders.playEpisode(dramaId, episode._id)}
                >
                  <div className="episode-card-topline">
                    <span className="episode-pill">EP {episode.episodeNumber}</span>
                    <span className={`episode-access-pill ${episode.isFree ? 'episode-access-pill-free' : ''}`}>
                      {episode.isFree ? 'Free' : `${episode.unlockPrice} coins`}
                    </span>
                  </div>
                  <div className="episode-card-title">{episode.title || `Episode ${episode.episodeNumber}`}</div>
                  <div className="episode-card-copy">
                    {snapshot
                      ? formatProgressLabel(snapshot.currentTime, snapshot.duration)
                      : episode.description || 'Open local player shell and hydrate stream data on demand.'}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Audience voices</p>
              <h3 className="section-title">Reviews summary</h3>
            </div>
          </div>
          <div className="review-summary-grid">
            <article className="screen-stat">
              <div className="screen-stat-label">Average</div>
              <div className="screen-stat-value">{drama?.rating ? drama.rating.toFixed(1) : 'N/A'}</div>
            </article>
            <article className="screen-stat">
              <div className="screen-stat-label">Reviews</div>
              <div className="screen-stat-value">{reviews.length}</div>
            </article>
          </div>
          <div className="review-list">
            {featuredReviews.length ? (
              featuredReviews.map((review) => (
                <article key={review._id} className="review-card">
                  <div className="review-card-topline">
                    <strong>{review.userName}</strong>
                    <span>{review.rating.toFixed(1)} / 5</span>
                  </div>
                  <p className="review-card-copy">{review.content}</p>
                </article>
              ))
            ) : (
              <div className="route-skeleton">Review summary will appear here once remote comments land.</div>
            )}
          </div>
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">More like this</p>
              <h3 className="section-title">Related dramas</h3>
            </div>
          </div>
          <DramaList
            dramas={relatedDramas}
            emptyLabel="No related dramas have been cached for this title yet."
            variant="reel"
          />
        </section>
      </QueryState>
    </section>
  );
}
