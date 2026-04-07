import { useEffect, useMemo, useRef, useState } from 'react';
import type { Drama, Episode, EpisodeAccessResult, StreamPlaybackInfo } from '@domain';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resolvePlaybackSource, buildPlaybackSnapshotFromStream } from '@player';
import { QueryState } from '../../components/QueryState';
import { RouteSkeleton } from '../../components/RouteSkeleton';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useShellApi } from '../../hooks/useShellApi';
import { unwrapApiData } from '../../lib/api-response';
import { getApiBaseUrl } from '../../lib/api';
import { playbackProgressRepository } from '../../lib/cache';
import { useNativeAuth } from '../../providers/AuthProvider';
import { routeBuilders } from '../../router/route-builders';

const PLAYBACK_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const ACCESS_CACHE_MAX_AGE_MS = 30 * 1000;
const REMOTE_PROGRESS_INTERVAL_SECONDS = 15;
const LOCAL_PROGRESS_INTERVAL_SECONDS = 5;

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function describeAccessState(activeEpisode: Episode | null, access: EpisodeAccessResult | undefined, token: string | null) {
  if (!activeEpisode) return { canPlay: false, label: 'Episode missing' };
  if (activeEpisode.isFree) return { canPlay: true, label: 'Free to watch' };
  if (!token) return { canPlay: false, label: 'Sign in required for paid episode' };
  if (access?.hasAccess) return { canPlay: true, label: 'Unlocked or VIP access granted' };
  return { canPlay: false, label: access?.reason || 'Unlock required before playback' };
}

export function PlaybackScreen() {
  const { dramaId = '', episodeId = '' } = useParams();
  const navigate = useNavigate();
  const api = useShellApi();
  const { token } = useNativeAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const appliedResumeRef = useRef(false);
  const lastRemoteReportRef = useRef(0);
  const lastLocalWriteRef = useRef(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const dramaQuery = useCachedQuery({
    cacheKey: `drama:${dramaId}:detail`,
    cacheMaxAgeMs: PLAYBACK_CACHE_MAX_AGE_MS,
    queryKey: ['drama', dramaId, 'detail'],
    queryFn: () => api.dramas.getById(dramaId),
    enabled: Boolean(dramaId),
  });

  const drama = unwrapApiData<Drama>(dramaQuery.data);
  const episodes = drama?.episodes ?? [];
  const activeEpisode = episodes.find((episode) => episode._id === episodeId) ?? null;
  const activeEpisodeIndex = activeEpisode ? episodes.findIndex((episode) => episode._id === activeEpisode._id) : -1;
  const previousEpisode = activeEpisodeIndex > 0 ? episodes[activeEpisodeIndex - 1] : null;
  const nextEpisode = activeEpisodeIndex >= 0 ? episodes[activeEpisodeIndex + 1] ?? null : null;

  const accessQuery = useCachedQuery({
    cacheKey: `play:${episodeId}:access:${token ? 'auth' : 'guest'}`,
    cacheMaxAgeMs: ACCESS_CACHE_MAX_AGE_MS,
    queryKey: ['play', episodeId, 'access', token ? 'auth' : 'guest'],
    queryFn: () => api.episodes.checkAccess(episodeId, token || ''),
    enabled: Boolean(activeEpisode && token && !activeEpisode.isFree),
  });

  const access = unwrapApiData<EpisodeAccessResult>(accessQuery.data);
  const accessState = describeAccessState(activeEpisode, access, token);

  const streamQuery = useCachedQuery({
    cacheKey: `play:${episodeId}:stream:${token ? 'auth' : 'guest'}`,
    cacheMaxAgeMs: ACCESS_CACHE_MAX_AGE_MS,
    queryKey: ['play', episodeId, 'stream', token ? 'auth' : 'guest'],
    queryFn: () => api.episodes.getStream(episodeId, token || undefined),
    enabled: Boolean(activeEpisode && accessState.canPlay),
  });

  const streamInfo = unwrapApiData<StreamPlaybackInfo>(streamQuery.data);
  const playbackUrl = resolvePlaybackSource(streamInfo, {
    fallbackUrl: activeEpisode?.videoUrl,
    apiBaseUrl: getApiBaseUrl(),
  });

  const savedProgress = useMemo(() => {
    if (!activeEpisode) return null;
    return playbackProgressRepository.read({
      episodeId: activeEpisode._id,
      streamVideoId: activeEpisode.streamVideoId,
      videoUrl: activeEpisode.videoUrl,
    });
  }, [activeEpisode]);

  useEffect(() => {
    appliedResumeRef.current = false;
    lastRemoteReportRef.current = 0;
    lastLocalWriteRef.current = 0;
    setPlaybackError(null);
  }, [episodeId]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !activeEpisode) return undefined;
    const videoElement = element;
    const episode = activeEpisode;

    function persistProgress(currentTime: number, duration: number, forceRemote = false) {
      const safeCurrentTime = Math.max(0, currentTime);
      const safeDuration = Math.max(0, duration || episode.duration || 0);

      if (
        forceRemote ||
        safeCurrentTime - lastLocalWriteRef.current >= LOCAL_PROGRESS_INTERVAL_SECONDS ||
        safeCurrentTime >= safeDuration * 0.9
      ) {
        playbackProgressRepository.write(
          buildPlaybackSnapshotFromStream({
            progress: {
              episodeId: episode._id,
              currentTime: safeCurrentTime,
              duration: safeDuration,
              completed: safeDuration > 0 ? safeCurrentTime >= safeDuration * 0.9 : false,
            },
            episodeId: episode._id,
            dramaId,
            dramaTitle: drama?.title,
            episodeTitle: episode.title,
            poster: episode.thumbnail || drama?.cover,
            streamInfo,
            fallbackVideoUrl: episode.videoUrl,
          })
        );
        lastLocalWriteRef.current = safeCurrentTime;
      }

      if (
        token &&
        (forceRemote ||
          safeCurrentTime - lastRemoteReportRef.current >= REMOTE_PROGRESS_INTERVAL_SECONDS ||
          safeCurrentTime >= safeDuration * 0.9)
      ) {
        lastRemoteReportRef.current = safeCurrentTime;
        void api.episodes.reportProgress(episode._id, token, safeCurrentTime, safeDuration).catch(() => undefined);
      }
    }

    function handleLoadedMetadata() {
      if (!savedProgress || appliedResumeRef.current || savedProgress.currentTime < 3) return;
      const nextTime = Math.min(savedProgress.currentTime, Math.max(0, videoElement.duration - 1));
      if (Number.isFinite(nextTime) && nextTime > 0) {
        videoElement.currentTime = nextTime;
      }
      appliedResumeRef.current = true;
    }

    function handleTimeUpdate() {
      persistProgress(videoElement.currentTime, videoElement.duration);
    }

    function handleEnded() {
      persistProgress(videoElement.duration || episode.duration || 0, videoElement.duration || episode.duration || 0, true);
    }

    function handleError() {
      setPlaybackError('Playback stream failed to start. The local player shell stayed mounted, so retry or jump back without route loss.');
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };
  }, [activeEpisode, api.episodes, drama?.title, dramaId, savedProgress, streamInfo, token]);

  return (
    <section className="screen-stack">
      <article className="app-hero-card">
        <p className="app-kicker">Now playing</p>
        <h2 className="app-hero-title">{activeEpisode?.title || drama?.title || 'Preparing playback shell'}</h2>
        <p className="app-hero-subtitle">
          {activeEpisode
            ? 'The playback screen stays focused on the video stage while access checks and resume state load in place.'
            : 'Playback is waiting for drama detail so the local route can resolve the episode queue and resume state.'}
        </p>
        <div className="screen-stats">
          <article className="screen-stat">
            <div className="screen-stat-label">Entitlement</div>
            <div className="screen-stat-value">{accessState.label}</div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Resume</div>
            <div className="screen-stat-value">
              {savedProgress ? `${formatClock(savedProgress.currentTime)} saved` : 'Start from beginning'}
            </div>
          </article>
          <article className="screen-stat">
            <div className="screen-stat-label">Route Ownership</div>
            <div className="screen-stat-value">Native shell</div>
          </article>
        </div>
      </article>

      <QueryState
        isLoading={dramaQuery.isLoading}
        isFetching={dramaQuery.isFetching}
        error={dramaQuery.error}
        empty={!activeEpisode}
        emptyLabel="This play route does not have a matching episode yet."
        onRetry={() => {
          void dramaQuery.refetch();
        }}
        skeleton={<RouteSkeleton blocks={2} title="Loading playback route" />}
      >
        <section className="app-section-card">
          <div className="playback-header-row">
            <div>
              <p className="section-eyebrow">Playback stage</p>
              <h3 className="playback-episode-title">{activeEpisode?.title || `Episode ${activeEpisode?.episodeNumber || ''}`}</h3>
              <p className="screen-description">
                {activeEpisode?.description || 'Metadata, access, and resume state appear before the stream URL is ready.'}
              </p>
            </div>
            <Link className="app-secondary-button playback-back-link" to={routeBuilders.dramaDetail(dramaId)}>
              Back to Detail
            </Link>
          </div>

          <div className="playback-stage">
            {accessState.canPlay ? (
              playbackUrl ? (
                <video
                  ref={videoRef}
                  className="playback-video"
                  controls
                  playsInline
                  poster={activeEpisode?.thumbnail || drama?.cover || undefined}
                  src={playbackUrl}
                />
              ) : streamQuery.isLoading || streamQuery.isFetching ? (
                <div className="playback-placeholder">
                  <div className="route-skeleton route-skeleton-centered">Hydrating stream manifest and poster shell...</div>
                </div>
              ) : (
                <div className="playback-placeholder">
                  <div className="route-skeleton route-skeleton-centered">Stream info is unavailable right now. The route remains stable for retry.</div>
                </div>
              )
            ) : (
              <div className="playback-placeholder">
                <div className="paywall-card">
                  <p className="screen-eyebrow">Access Needed</p>
                  <h3 className="playback-episode-title">Unlock required before playback</h3>
                  <p className="screen-description">
                    {token
                      ? 'This paid episode still needs entitlement. Keep the route local, then finish unlock or return to detail.'
                      : 'Guest playback keeps the native route mounted and sends the user to local auth only when needed.'}
                  </p>
                  <div className="screen-actions">
                    {token ? (
                      <button
                        className="app-secondary-button shell-button-reset"
                        onClick={() => navigate(routeBuilders.dramaDetail(dramaId))}
                        type="button"
                      >
                        View Unlock Options
                      </button>
                    ) : (
                      <button
                        className="app-primary-button"
                        onClick={() => navigate(routeBuilders.login())}
                        type="button"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {playbackError ? <div className="playback-error-banner">{playbackError}</div> : null}
        </section>

        <section className="app-section-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Next step</p>
              <h3 className="section-title">Episode navigation</h3>
            </div>
          </div>
          <div className="playback-nav-grid">
            {previousEpisode ? (
              <Link className="episode-card" to={routeBuilders.playEpisode(dramaId, previousEpisode._id)}>
                <div className="episode-card-topline">
                  <span className="episode-pill">Previous</span>
                  <span className="episode-access-pill">EP {previousEpisode.episodeNumber}</span>
                </div>
                <div className="episode-card-title">{previousEpisode.title}</div>
                <div className="episode-card-copy">Jump back without leaving the local player route.</div>
              </Link>
            ) : (
              <div className="route-skeleton">No previous episode.</div>
            )}
            {nextEpisode ? (
              <Link className="episode-card" to={routeBuilders.playEpisode(dramaId, nextEpisode._id)}>
                <div className="episode-card-topline">
                  <span className="episode-pill">Next</span>
                  <span className="episode-access-pill">EP {nextEpisode.episodeNumber}</span>
                </div>
                <div className="episode-card-title">{nextEpisode.title}</div>
                <div className="episode-card-copy">Resume flow stays inside app-owned routing.</div>
              </Link>
            ) : (
              <div className="route-skeleton">No next episode cached.</div>
            )}
          </div>
        </section>
      </QueryState>
    </section>
  );
}
