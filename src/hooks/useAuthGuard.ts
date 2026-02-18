'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export function useAuthGuard(redirectTo = '/auth/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '';
      router.push(`${redirectTo}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading, isAuthenticated: !!user };
}
