'use client';

import { cn } from '@/lib/utils';

type MobileScrollTabItem = {
  key: string;
  label: string;
};

interface MobileScrollTabsProps {
  items: MobileScrollTabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

export function MobileScrollTabs({
  items,
  value,
  onChange,
  className,
  tabClassName,
  activeTabClassName = 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black',
  inactiveTabClassName = 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white',
}: MobileScrollTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 mobile-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition',
              tabClassName,
              active ? activeTabClassName : inactiveTabClassName
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
