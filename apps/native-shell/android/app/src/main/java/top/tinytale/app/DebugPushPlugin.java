package top.tinytale.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.ref.WeakReference;
import java.util.ArrayDeque;
import java.util.Queue;

@CapacitorPlugin(name = "DebugPush")
public class DebugPushPlugin extends Plugin {
    private static final String EXTRA_DEBUG_PUSH_PAYLOAD = "tinytaleDebugPushPayload";
    private static final String EXTRA_DEBUG_PUSH_ROUTE = "tinytaleDebugPushRoute";
    private static final String EXTRA_DEBUG_PUSH_URL = "tinytaleDebugPushUrl";
    private static final String EXTRA_DEBUG_PUSH_TITLE = "tinytaleDebugPushTitle";
    private static final String EXTRA_DEBUG_PUSH_BODY = "tinytaleDebugPushBody";
    private static final String[] ROUTE_EXTRA_KEYS = {
        "route",
        "path",
        "href",
        "targetPath",
        "link"
    };
    private static final String[] URL_EXTRA_KEYS = {
        "url"
    };
    private static final String[] TITLE_EXTRA_KEYS = {
        "title",
        "gcm.notification.title"
    };
    private static final String[] BODY_EXTRA_KEYS = {
        "body",
        "message",
        "gcm.notification.body"
    };
    private static final String[] PAYLOAD_EXTRA_KEYS = {
        "payload"
    };
    private static final Queue<JSObject> pendingPayloads = new ArrayDeque<>();
    private static WeakReference<DebugPushPlugin> activeInstance = new WeakReference<>(null);

    public static void captureDebugPushIntent(Intent intent) {
        captureIntent(intent, false);
    }

    public static void captureLaunchIntent(Intent intent) {
        captureIntent(intent, true);
    }

    private static void captureIntent(Intent intent, boolean includeGenericExtras) {
        if (intent == null) {
            return;
        }

        JSObject event = new JSObject();
        putExtraIfPresent(intent, event, EXTRA_DEBUG_PUSH_PAYLOAD, "payload");
        putExtraIfPresent(intent, event, EXTRA_DEBUG_PUSH_ROUTE, "route");
        putExtraIfPresent(intent, event, EXTRA_DEBUG_PUSH_URL, "url");
        putExtraIfPresent(intent, event, EXTRA_DEBUG_PUSH_TITLE, "title");
        putExtraIfPresent(intent, event, EXTRA_DEBUG_PUSH_BODY, "body");
        if (includeGenericExtras) {
            putFirstMatchingExtra(intent, event, PAYLOAD_EXTRA_KEYS, "payload");
            putFirstMatchingExtra(intent, event, ROUTE_EXTRA_KEYS, "route");
            putFirstMatchingExtra(intent, event, URL_EXTRA_KEYS, "url");
            putFirstMatchingExtra(intent, event, TITLE_EXTRA_KEYS, "title");
            putFirstMatchingExtra(intent, event, BODY_EXTRA_KEYS, "body");
        }

        if (event.length() == 0) {
            return;
        }

        intent.removeExtra(EXTRA_DEBUG_PUSH_PAYLOAD);
        intent.removeExtra(EXTRA_DEBUG_PUSH_ROUTE);
        intent.removeExtra(EXTRA_DEBUG_PUSH_URL);
        intent.removeExtra(EXTRA_DEBUG_PUSH_TITLE);
        intent.removeExtra(EXTRA_DEBUG_PUSH_BODY);
        dispatchPayload(event);
    }

    private static void putExtraIfPresent(Intent intent, JSObject event, String extraName, String fieldName) {
        String value = intent.getStringExtra(extraName);
        if (value == null || value.trim().isEmpty()) {
            return;
        }

        event.put(fieldName, value);
    }

    private static void putFirstMatchingExtra(Intent intent, JSObject event, String[] extraNames, String fieldName) {
        if (event.has(fieldName)) {
            return;
        }

        String value = getFirstMatchingExtra(intent, extraNames);
        if (value == null || value.trim().isEmpty()) {
            return;
        }

        event.put(fieldName, value);
    }

    private static String getFirstMatchingExtra(Intent intent, String[] extraNames) {
        Bundle extras = intent.getExtras();
        if (extras == null) {
            return null;
        }

        for (String extraName : extraNames) {
            Object value = extras.get(extraName);
            if (value == null) {
                continue;
            }

            String stringValue = String.valueOf(value).trim();
            if (!stringValue.isEmpty()) {
                return stringValue;
            }
        }

        return null;
    }

    private static synchronized void dispatchPayload(JSObject payload) {
        DebugPushPlugin plugin = activeInstance.get();
        if (plugin != null) {
            plugin.emitPayload(payload);
            return;
        }

        pendingPayloads.add(payload);
    }

    private synchronized void flushPendingPayloads() {
        JSObject payload;
        while ((payload = pendingPayloads.poll()) != null) {
            emitPayload(payload);
        }
    }

    private void emitPayload(JSObject payload) {
        notifyListeners("debugPushReceived", payload, true);
    }

    @Override
    public void load() {
        activeInstance = new WeakReference<>(this);
        flushPendingPayloads();
    }

    @Override
    protected void handleOnDestroy() {
        DebugPushPlugin plugin = activeInstance.get();
        if (plugin == this) {
            activeInstance = new WeakReference<>(null);
        }
    }
}
