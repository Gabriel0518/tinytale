export function RouteSkeleton({
  title = 'Preparing route shell',
  lines = 3,
  blocks = 2,
}: {
  title?: string;
  lines?: number;
  blocks?: number;
}) {
  return (
    <div className="route-skeleton-stack">
      <div className="route-skeleton route-skeleton-card">
        <div className="skeleton-kicker" />
        <div className="skeleton-title" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="skeleton-line" />
        ))}
      </div>
      <div className="route-skeleton-grid">
        {Array.from({ length: blocks }).map((_, index) => (
          <div key={index} className="route-skeleton route-skeleton-card">
            <div className="skeleton-block" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
