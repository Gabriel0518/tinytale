import { Link } from 'react-router-dom';

export function ScreenScaffold({
  eyebrow,
  title,
  description,
  actions = [],
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{ label: string; to: string }>;
  stats?: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="screen-card">
      <p className="screen-eyebrow">{eyebrow}</p>
      <h2 className="screen-title">{title}</h2>
      <p className="screen-description">{description}</p>

      {actions.length > 0 ? (
        <div className="screen-actions">
          {actions.map((action) => (
            <Link key={action.to} className="screen-action" to={action.to}>
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}

      {stats.length > 0 ? (
        <div className="screen-stats">
          {stats.map((stat) => (
            <article key={stat.label} className="screen-stat">
              <div className="screen-stat-label">{stat.label}</div>
              <div className="screen-stat-value">{stat.value}</div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
