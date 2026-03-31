'use client';

import { AuthProvider } from '@/lib/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { AppRuntime } from '@/components/mobile/AppRuntime';
import { MobileMiniPlayer } from '@/components/mobile/MobileMiniPlayer';
import { PlaybackSessionProvider } from '@/components/mobile/PlaybackSession';

const FALLBACK_GOOGLE_CLIENT_ID =
  '941933807449-n4e458mjvuuv7o871mr20qchj6gcdap2.apps.googleusercontent.com';

export function Providers({ children }: { children: React.ReactNode }) {
  // Avoid invalid_client from placeholder IDs:
  // use env first, fallback to the production OAuth client ID.
  const configuredClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
  const googleClientId = configuredClientId.endsWith('.apps.googleusercontent.com')
    ? configuredClientId
    : FALLBACK_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <PlaybackSessionProvider>
          <ConfirmProvider>
            <ToastProvider>
              <AppRuntime />
              {children}
              <MobileMiniPlayer />
            </ToastProvider>
          </ConfirmProvider>
        </PlaybackSessionProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
