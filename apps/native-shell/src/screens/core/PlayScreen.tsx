import { Link } from 'react-router-dom';
import type { Drama, HomepageFeaturedBuckets } from '@domain';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { routeBuilders } from '../../router/route-builders';
import { useNativeAuth } from '../../providers/AuthProvider';
import { normalizeHistoryItem, type NativeHistoryItem } from '../../lib/user-normalizers';

const PLAY_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

function resolvePlayChoices(dramas: Drama[]) {
  return dramas
    .map((drama) => {
      const firstEpisode = drama.episodes?.[0] ?? null;
      if (!firstEpisode?._id) return null;
      return {
        dramaId: drama._id,
        episodeId: firstEpisode._id,
        title: drama.title,
        subtitle: firstEpisode.title || `Episode ${firstEpisode.episodeNumber || 1}`,
        poster: firstEpisode.thumbnail || drama.cover || '',
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 4);
}

export function PlayScreen() {
  const api = useShellApi();
  const { user, token } = useNativeAuth();
  const { isOffline } = useNetworkStatus();

  const featuredQuery = useCachedQuery({
    cacheKey: 'play:featured',
    cacheMaxAgeMs: PLAY_CACHE_MAX_AGE_MS,
    queryKey: ['play', 'featured'],
    queryFn: () => api.dramas.getFeatured(),
  });

  const historyQuery = useCachedQuery({
    cacheKey: `user:${user?._id || 'guest'}:history`,
    cacheMaxAgeMs: PLAY_CACHE_MAX_AGE_MS,
    queryKey: ['user', user?._id || 'guest', 'history'],
    queryFn: () => api.user.getHistory(token || ''),
    enabled: Boolean(token && user?._id),
  });

  const featuredPayload = unwrapApiData<HomepageFeaturedBuckets>(featuredQuery.data) ?? {};
  const featuredDramas = [
    ...(featuredPayload.featured ?? []),
    ...(featuredPayload.trending ?? []),
  ].filter((drama, index, list) => list.findIndex((item) => item._id === drama._id) === index);
  const playChoices = resolvePlayChoices(featuredDramas);
  const historyItems = (unwrapApiData<unknown[]>(historyQuery.data) ?? [])
    .map(normalizeHistoryItem)
    .filter((item): item is NativeHistoryItem => item !== null);
  const resumeItem = historyItems[0] ?? null;
  const heroChoice = resumeItem
    ? {
        title: resumeItem.dramaTitle,
        subtitle: resumeItem.episodeTitle || 'Continue where you left off',
        to: routeBuilders.playEpisode(resumeItem.dramaId, resumeItem.episodeId),
        cta: 'Resume now',
      }
    : playChoices[0]
      ? {
          title: playChoices[0].title,
          subtitle: playChoices[0].subtitle,
          to: routeBuilders.playEpisode(playChoices[0].dramaId, playChoices[0].episodeId),
          cta: 'Start playing',
        }
      : null;

  return (
    <section className="screen-stack">
      <article className="app-hero-card play-hero-card">
        <div className="app-hero-copy">
          <p className="app-kicker">Play</p>
          <h2 className="app-hero-title">{heroChoice?.title || 'Play tab is ready'}</h2>
          <p className="app-hero-subtitle">
            {heroChoice?.subtitle ||
              'The Play tab gets you back into your current episode fast or starts today’s featured pick.'}
          </p>
        </div>
        <div className="app-hero-actions">
          {heroChoice ? (
            <Link className="app-primary-button" to={heroChoice.to}>
              {heroChoice.cta}
            </Link>
          ) : (
            <Link className="app-primary-button" to={routeBuilders.browse()}>
              Browse titles
            </Link>
          )}
          <Link className="app-secondary-button" to={routeBuilders.history()}>
            View history
          </Link>
        </div>
      </article>

      <QueryState
        isLoading={featuredQuery.isLoading || historyQuery.isLoading}
        isFetching={featuredQuery.isFetching || historyQuery.isFetching}
        error={featuredQuery.error || historyQuery.error}
        empty={!playChoices.length && !resumeItem}
        offline={isOffline}
        hasCachedData={Boolean(featuredQuery.data || historyQuery.data)}
        emptyLabel="No playable episode is ready yet. Browse the library to pick one."
        onRetry={() => {
          void featuredQuery.refetch();
          void historyQuery.refetch();
        }}
        skeleton={<RouteSkeleton title="Preparing play tab" blocks={3} />}
      >
        {resumeItem ? (
          <section className="app-section-card">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">Continue watching</p>
                <h3 className="section-title">Pick up where you left off</h3>
              </div>
            </div>
            <Link className="history-card history-card-featured" to={routeBuilders.playEpisode(resumeItem.dramaId, resumeItem.episodeId)}>
              <div className="history-card-main">
                <div className="history-title">{resumeItem.dramaTitle}</div>
                <div className="history-copy">{resumeItem.episodeTitle || 'Continue playback'}</div>
              </div>
              <span className="app-inline-pill">
                {typeof resumeItem.progress === 'number' ? `${Math.round(resumeItem.progress)}% watched` : 'Resume'}
              </span>
            </Link>
          </section>
        ) : null}

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Suggested start</p>
              <h3 className="section-title">Featured picks for instant play</h3>
            </div>
          </div>
          <div className="play-choice-grid">
            {playChoices.map((choice) => (
              <Link
                key={`${choice.dramaId}:${choice.episodeId}`}
                className="play-choice-card"
                to={routeBuilders.playEpisode(choice.dramaId, choice.episodeId)}
              >
                <div className="play-choice-poster">
                  {choice.poster ? <img alt={choice.title} src={choice.poster} /> : <span>{choice.title.slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="play-choice-title">{choice.title}</div>
                <div className="play-choice-copy">{choice.subtitle}</div>
              </Link>
            ))}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
