import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

type DebugPushEvent = {
  body?: string;
  payload?: string;
  route?: string;
  title?: string;
  url?: string;
};

type DebugPushPlugin = {
  addListener(
    eventName: 'debugPushReceived',
    listenerFunc: (event: DebugPushEvent) => void,
  ): Promise<PluginListenerHandle>;
};

const DebugPush = registerPlugin<DebugPushPlugin>('DebugPush');

function parsePayload(rawPayload: string) {
  try {
    return JSON.parse(rawPayload) as unknown;
  } catch {
    return rawPayload;
  }
}

export async function addDebugPushListener(listener: (payload: unknown) => void) {
  if (!Capacitor.isNativePlatform()) {
    return () => undefined;
  }

  const handle = await DebugPush.addListener('debugPushReceived', (event) => {
    const structuredPayload: Record<string, string> = {};

    if (event?.route) {
      structuredPayload.route = event.route;
    }
    if (event?.url) {
      structuredPayload.url = event.url;
    }
    if (event?.title) {
      structuredPayload.title = event.title;
    }
    if (event?.body) {
      structuredPayload.body = event.body;
    }

    if (Object.keys(structuredPayload).length > 0) {
      listener(structuredPayload);
      return;
    }

    if (!event?.payload) {
      return;
    }

    listener(parsePayload(event.payload));
  });

  return () => {
    void handle.remove();
  };
}
