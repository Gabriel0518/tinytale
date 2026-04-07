'use client';

import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/capacitor-bridge';

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
    <div className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-[#0f1115] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-6 bg-gradient-to-l from-[#0f1115] to-transparent"
      />
      <div
        className="flex gap-3 overflow-x-auto py-2 mobile-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                void triggerHaptic('selection');
                onChange(item.key);
              }}
              aria-pressed={active}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap transition active:scale-95',
                tabClassName,
                active ? activeTabClassName : inactiveTabClassName
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
