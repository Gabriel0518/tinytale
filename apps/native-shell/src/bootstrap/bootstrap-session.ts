import { hydrateNativeSessionStore } from '../lib/native-session-store';

export async function bootstrapSession() {
  return hydrateNativeSessionStore();
}
