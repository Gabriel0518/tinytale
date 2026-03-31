'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/features/Navbar';
import { cn } from '@/lib/utils';

interface MobilePageShellProps {
  children: ReactNode;
  title?: string;
  activePath?: string;
  showBackButton?: boolean;
  variant?: 'default' | 'transparent';
  mobileHeaderVariant?: 'default' | 'brand-search';
  showSearch?: boolean;
  showAuthButtons?: boolean;
  renderSearch?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  mobileRightSlot?: React.ReactNode;
}

export function MobilePageShell({
  children,
  title,
  activePath,
  showBackButton = false,
  variant = 'default',
  mobileHeaderVariant = 'default',
  showSearch = true,
  showAuthButtons = true,
  renderSearch,
  className,
  contentClassName,
  mobileRightSlot,
}: MobilePageShellProps) {
  return (
    <div className={cn('min-h-screen bg-[#141414]', className)}>
      <Navbar
        activePath={activePath}
        variant={variant}
        mobileHeaderVariant={mobileHeaderVariant}
        showSearch={showSearch}
        showAuthButtons={showAuthButtons}
        renderSearch={renderSearch}
        mobileTitle={title}
        forceBackButton={showBackButton}
        mobileRightSlot={mobileRightSlot}
      />
      <motion.main
        key={title || activePath || 'mobile-page'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={cn(
          mobileHeaderVariant === 'brand-search'
            ? 'pt-[calc(94px+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12 md:pt-20'
            : 'pt-[calc(74px+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12 md:pt-20',
          contentClassName
        )}
      >
        {children}
      </motion.main>
    </div>
  );
}
