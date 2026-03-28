export type InAppNotificationType = 'release' | 'promo' | 'system';

export interface InAppNotificationItem {
  _id: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  dramaId?: string;
  episodeId?: string;
  targetPath?: string;
  read: boolean;
  createdAt: string;
  source: 'api' | 'local-push';
}

export const IN_APP_NOTIFICATIONS_STORAGE_KEY = 'tinytale:in-app-notifications';
export const IN_APP_NOTIFICATIONS_EVENT = 'tinytale:in-app-notifications-updated';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeNotification(value: unknown): InAppNotificationItem | null {
  if (!isObject(value)) return null;
  if (typeof value._id !== 'string') return null;
  if (typeof value.title !== 'string' || typeof value.message !== 'string') return null;

  return {
    _id: value._id,
    type: value.type === 'promo' || value.type === 'system' ? value.type : 'release',
    title: value.title,
    message: value.message,
    dramaId: typeof value.dramaId === 'string' ? value.dramaId : undefined,
    episodeId: typeof value.episodeId === 'string' ? value.episodeId : undefined,
    targetPath: typeof value.targetPath === 'string' ? value.targetPath : undefined,
    read: Boolean(value.read),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    source: value.source === 'api' ? 'api' : 'local-push',
  };
}

export function resolveInAppNotificationHref(
  item: Pick<InAppNotificationItem, 'targetPath' | 'dramaId' | 'episodeId'>
) {
  if (typeof item.targetPath === 'string' && item.targetPath.startsWith('/')) {
    return item.targetPath;
  }

  if (!item.dramaId) {
    return null;
  }

  if (item.episodeId) {
    return `/drama/${item.dramaId}/play/${item.episodeId}`;
  }

  return `/drama/${item.dramaId}`;
}

export function readInAppNotifications(): InAppNotificationItem[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(IN_APP_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNotification).filter(Boolean) as InAppNotificationItem[];
  } catch {
    window.localStorage.removeItem(IN_APP_NOTIFICATIONS_STORAGE_KEY);
    return [];
  }
}

function sortNotifications(items: InAppNotificationItem[]) {
  return [...items].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function writeInAppNotifications(items: InAppNotificationItem[]) {
  if (typeof window === 'undefined') return;

  const nextItems = sortNotifications(items);
  window.localStorage.setItem(IN_APP_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(nextItems));
  window.dispatchEvent(new CustomEvent(IN_APP_NOTIFICATIONS_EVENT, { detail: nextItems }));
}

export function upsertInAppNotification(item: InAppNotificationItem) {
  const current = readInAppNotifications();
  const next = [item, ...current.filter((entry) => entry._id !== item._id)].slice(0, 50);
  writeInAppNotifications(next);
  return next;
}

export function mergeInAppNotifications(items: InAppNotificationItem[]) {
  const current = readInAppNotifications();
  const map = new Map<string, InAppNotificationItem>();

  for (const item of [...items, ...current]) {
    map.set(item._id, item);
  }

  const next = sortNotifications(Array.from(map.values())).slice(0, 50);
  writeInAppNotifications(next);
  return next;
}

export function markInAppNotificationRead(id: string) {
  const current = readInAppNotifications();
  const next = current.map((item) => item._id === id ? { ...item, read: true } : item);
  writeInAppNotifications(next);
  return next;
}

export function markAllInAppNotificationsRead() {
  const current = readInAppNotifications();
  const next = current.map((item) => ({ ...item, read: true }));
  writeInAppNotifications(next);
  return next;
}
