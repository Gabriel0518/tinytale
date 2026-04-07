import { Link } from 'react-router-dom';

const rankingTypes = [
  { key: 'views', label: 'Most Watched' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'newest', label: 'Newest' },
];

export function RankingsTypeTabs({ activeType }: { activeType: string }) {
  return (
    <div className="chip-row">
      {rankingTypes.map((type) => (
        <Link
          key={type.key}
          className={`chip ${activeType === type.key ? 'chip-active' : ''}`}
          to={`/rankings?type=${encodeURIComponent(type.key)}`}
        >
          {type.label}
        </Link>
      ))}
    </div>
  );
}
