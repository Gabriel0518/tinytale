import type { Drama } from '@domain';
import { Link } from 'react-router-dom';
import { routeBuilders } from '../router/route-builders';

export function DramaList({
  dramas,
  variant = 'grid',
  emptyLabel = 'No dramas available yet.',
  rankStart = 1,
}: {
  dramas: Drama[];
  variant?: 'grid' | 'reel' | 'rankings';
  emptyLabel?: string;
  rankStart?: number;
}) {
  if (!dramas.length) {
    return <div className="route-skeleton">{emptyLabel}</div>;
  }

  if (variant === 'reel') {
    return (
      <div className="drama-reel">
        {dramas.map((drama) => (
          <Link key={drama._id} className="drama-reel-card" to={routeBuilders.dramaDetail(drama._id)}>
            <div className="drama-poster drama-poster-reel">
              {drama.cover ? (
                <img alt={drama.title} src={drama.cover} />
              ) : (
                <div className="drama-poster-fallback">{(drama.title || '?').slice(0, 1).toUpperCase()}</div>
              )}
              <div className="drama-card-badges">
                <span className="drama-card-badge">{drama.rating ? `${drama.rating.toFixed(1)}` : 'New'}</span>
              </div>
            </div>
            <div className="drama-title">{drama.title}</div>
            <div className="drama-meta">
              <span>{drama.categories?.[0] || drama.country || 'Featured'}</span>
              <span>{drama.totalEpisodes || drama.episodes?.length || 0} eps</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'rankings') {
    return (
      <div className="drama-rank-list">
        {dramas.map((drama, index) => (
          <Link key={drama._id} className="drama-rank-card" to={routeBuilders.dramaDetail(drama._id)}>
            <div className="drama-rank-number">#{rankStart + index}</div>
            <div className="drama-rank-poster">
              {drama.cover ? (
                <img alt={drama.title} src={drama.cover} />
              ) : (
                <div className="drama-poster-fallback">{(drama.title || '?').slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="drama-rank-body">
              <div className="drama-rank-title">{drama.title}</div>
              <div className="drama-rank-copy">
                {drama.description || `${drama.totalEpisodes || drama.episodes?.length || 0} episodes · ${drama.categories?.[0] || 'Featured'}`}
              </div>
              <div className="drama-rank-meta">
                <span>{drama.categories?.[0] || drama.country || 'Featured'}</span>
                <span>{drama.isCompleted ? 'Completed' : 'Updating'}</span>
              </div>
            </div>
            <div className="drama-rank-score">{drama.rating ? drama.rating.toFixed(1) : 'New'}</div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="drama-grid">
      {dramas.map((drama) => (
        <Link key={drama._id} className="drama-card" to={routeBuilders.dramaDetail(drama._id)}>
          <div className="drama-poster">
            {drama.cover ? (
              <img alt={drama.title} src={drama.cover} />
            ) : (
              <div className="drama-poster-fallback">{(drama.title || '?').slice(0, 1).toUpperCase()}</div>
            )}
            <div className="drama-card-badges">
              <span className="drama-card-badge">
                {drama.rating ? `${drama.rating.toFixed(1)}` : 'New'}
              </span>
              <span className="drama-card-status">
                {drama.isCompleted ? 'Completed' : 'Updating'}
              </span>
            </div>
          </div>
          <div className="drama-title">{drama.title}</div>
          <div className="drama-meta">
            <span>{drama.categories?.[0] || drama.country || 'Featured'}</span>
            <span>{drama.totalEpisodes || drama.episodes?.length || 0} eps</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
