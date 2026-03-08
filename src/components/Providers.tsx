'use client';

import { AuthProvider } from '@/lib/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  // Always render GoogleOAuthProvider, even with empty clientId
  // This prevents build errors when Google OAuth components are used
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';

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
