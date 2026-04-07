export type NativeHistoryItem = {
  id: string;
  dramaId: string;
  episodeId: string;
  dramaTitle: string;
  cover?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  watchedAt: string;
  progress?: number;
};

export type NativeNotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  path?: string;
  type?: string;
};

export type NativePurchaseItem = {
  id: string;
  title: string;
  amountLabel: string;
  status: string;
  createdAt: string;
  type?: string;
};

export type NativeCoinPackage = {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  tag?: string | null;
  originalPrice?: number | null;
};

export type NativeSubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  durationDays?: number;
  recommended: boolean;
  coins?: number;
  features: string[];
};

export type NativeUserSettings = {
  language: string;
  notifications: {
    pushEnabled: boolean;
    marketingEmail: boolean;
  };
  playback: {
    autoplayNextEpisode: boolean;
    dataSaver: boolean;
    videoQuality: string;
  };
};

export function normalizeHistoryItem(raw: unknown): NativeHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const drama = item.drama && typeof item.drama === 'object' ? (item.drama as Record<string, unknown>) : null;
  const episode = item.episode && typeof item.episode === 'object' ? (item.episode as Record<string, unknown>) : null;

  const dramaId = String(item.dramaId || drama?._id || '').trim();
  const episodeId = String(item.episodeId || item._id || '').trim();

  if (!dramaId || !episodeId) return null;

  return {
    id: String(item._id || `${dramaId}:${episodeId}`),
    dramaId,
    episodeId,
    dramaTitle: String(item.title || drama?.title || 'Unknown drama'),
    cover: String(item.cover || drama?.cover || ''),
    episodeNumber: Number(episode?.episodeNumber || item.lastEpisode || 0) || undefined,
    episodeTitle: String(episode?.title || ''),
    watchedAt: String(item.watchedAt || item.updatedAt || item.createdAt || new Date().toISOString()),
    progress: typeof item.progress === 'number' ? item.progress : undefined,
  };
}

export function normalizeNotificationItem(raw: unknown): NativeNotificationItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const title = String(item.title || item.subject || item.type || 'Notification').trim();
  const message = String(item.message || item.content || item.body || '').trim();
  const id = String(item._id || item.id || '').trim();

  if (!id) return null;

  return {
    id,
    title: title || 'Notification',
    message: message || 'No notification body provided.',
    read: Boolean(item.read || item.isRead),
    createdAt: String(item.createdAt || item.updatedAt || new Date().toISOString()),
    path: typeof item.path === 'string' ? item.path : undefined,
    type: typeof item.type === 'string' ? item.type : undefined,
  };
}

export function normalizePurchaseItem(raw: unknown): NativePurchaseItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = String(item._id || item.id || '').trim();
  if (!id) return null;

  const amount =
    typeof item.amount === 'number'
      ? item.amount
      : typeof item.price === 'number'
        ? item.price
        : typeof item.coins === 'number'
          ? item.coins
          : 0;
  const currency = String(item.currency || '').trim();

  return {
    id,
    title: String(item.description || item.title || item.type || 'Purchase'),
    amountLabel: currency ? `${amount} ${currency}` : `${amount}`,
    status: String(item.status || 'completed'),
    createdAt: String(item.createdAt || item.updatedAt || new Date().toISOString()),
    type: typeof item.type === 'string' ? item.type : undefined,
  };
}

export function normalizeCoinPackage(raw: unknown): NativeCoinPackage | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = String(item._id || item.id || '').trim();
  if (!id) return null;

  return {
    id,
    coins: Number(item.coins || 0),
    price: Number(item.price || 0),
    bonus: Number(item.bonus || 0),
    tag: typeof item.tag === 'string' ? item.tag : null,
    originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : null,
  };
}

export function normalizeSubscriptionPlan(raw: unknown): NativeSubscriptionPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = String(item._id || item.id || '').trim();
  if (!id) return null;

  const rawFeatures = Array.isArray(item.features) ? item.features : [];

  return {
    id,
    name: String(item.name || 'VIP Plan'),
    price: Number(item.price || 0),
    period: String(item.period || 'month'),
    durationDays: typeof item.duration === 'number' ? item.duration : typeof item.durationDays === 'number' ? item.durationDays : undefined,
    recommended: Boolean(item.recommended),
    coins: typeof item.coins === 'number' ? item.coins : undefined,
    features: rawFeatures.map((feature) => String(feature)),
  };
}

export function normalizeUserSettings(raw: unknown): NativeUserSettings {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const notifications =
    item.notifications && typeof item.notifications === 'object'
      ? (item.notifications as Record<string, unknown>)
      : {};
  const playback =
    item.playback && typeof item.playback === 'object'
      ? (item.playback as Record<string, unknown>)
      : {};
  const push =
    notifications.push && typeof notifications.push === 'object'
      ? (notifications.push as Record<string, unknown>)
      : {};
  const email =
    notifications.email && typeof notifications.email === 'object'
      ? (notifications.email as Record<string, unknown>)
      : {};

  return {
    language: String(item.language || 'en'),
    notifications: {
      pushEnabled: Boolean(push.enabled ?? true),
      marketingEmail: Boolean(email.promoOffers ?? true),
    },
    playback: {
      autoplayNextEpisode: Boolean(playback.autoplayNextEpisode ?? true),
      dataSaver: Boolean(playback.dataSaver ?? false),
      videoQuality: String(playback.videoQuality || 'auto'),
    },
  };
}
