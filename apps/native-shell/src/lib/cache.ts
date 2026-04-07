import { createBrowserCacheStore } from '@storage';
import { createPlaybackProgressRepository } from '@player';

export const shellCacheStore = createBrowserCacheStore({
  storageKey: 'tinytale:native-shell-cache',
  storage: 'localStorage',
});

export const playbackProgressRepository = createPlaybackProgressRepository({
  cacheStore: shellCacheStore,
  keyPrefix: 'tinytale:native-shell:progress',
});

export type LocalPushInboxItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  path?: string;
  type?: string;
};

const PUSH_INBOX_KEY = 'tinytale:native-shell:push-inbox';
const PUSH_INBOX_LIMIT = 40;

export const localPushInboxRepository = {
  list() {
    return shellCacheStore.peek<LocalPushInboxItem[]>(PUSH_INBOX_KEY) ?? [];
  },
  write(items: LocalPushInboxItem[]) {
    shellCacheStore.write(
      PUSH_INBOX_KEY,
      items
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, PUSH_INBOX_LIMIT)
    );
  },
  prepend(item: LocalPushInboxItem) {
    const existing = this.list().filter((entry) => entry.id !== item.id);
    this.write([item, ...existing]);
  },
  markRead(id: string) {
    this.write(
      this.list().map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item
      )
    );
  },
  markAllRead() {
    this.write(
      this.list().map((item) => ({
        ...item,
        read: true,
      }))
    );
  },
};
