'use client';

import { AuthProvider } from '@/lib/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
