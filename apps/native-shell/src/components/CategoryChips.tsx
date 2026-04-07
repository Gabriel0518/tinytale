import { useMemo } from 'react';
import type { Category } from '@domain';
import { Link, useLocation } from 'react-router-dom';
import { routeBuilders } from '../router/route-builders';

export function CategoryChips({
  categories,
  activeId,
  includeAll = false,
  allLabel = 'All',
}: {
  categories: Category[];
  activeId?: string;
  includeAll?: boolean;
  allLabel?: string;
}) {
  const location = useLocation();
  const pathname = location.pathname;
  const resolvedActiveId = useMemo(() => {
    if (activeId) return activeId;
    const matchedCategory = categories.find((category) => pathname === routeBuilders.category(category.slug || category._id));
    return matchedCategory?.slug || matchedCategory?._id || '';
  }, [activeId, categories, pathname]);

  if (!categories.length) return null;

  return (
    <div className="chip-row">
      {includeAll ? (
        <Link className={`chip ${!resolvedActiveId ? 'chip-active' : ''}`} to={routeBuilders.browse()}>
          {allLabel}
        </Link>
      ) : null}
      {categories.map((category) => (
        <Link
          key={category._id}
          className={`chip ${resolvedActiveId === (category.slug || category._id) ? 'chip-active' : ''}`}
          to={routeBuilders.category(category.slug || category._id)}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
