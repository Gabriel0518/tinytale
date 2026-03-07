'use client';

import { AuthProvider } from '@/lib/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // If Google Client ID is not configured, render without GoogleOAuthProvider
  if (!googleClientId) {
    return (
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
