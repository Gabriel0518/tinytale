package top.tinytale.app;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private static final String NATIVE_APP_USER_AGENT_TOKEN = "TinyTaleNativeApp";
    private static final String TAG = "TinyTaleStartup";
    private static final long STARTUP_WATCHDOG_DELAY_MS = 6000L;
    private static final long STARTUP_WATCHDOG_RECHECK_MS = 5000L;
    private static final String APP_SCHEME_PREFIX = "top.tinytale.app://";
    private static final String WEB_BASE_URL = "https://tinytale.top";
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
    private static final String CAPACITOR_TRIGGER_EVENT_SHIM =
        "(function(){"
            + "var cap=window.Capacitor=window.Capacitor||{};"
            + "if(typeof cap.createEvent!=='function'){"
            + "cap.createEvent=function(eventName,eventData){"
            + "var doc=window.document;"
            + "if(!doc||typeof doc.createEvent!=='function'){return null;}"
            + "var ev=doc.createEvent('Events');"
            + "ev.initEvent(eventName,false,false);"
            + "if(eventData&&typeof eventData==='object'){"
            + "for(var key in eventData){"
            + "if(Object.prototype.hasOwnProperty.call(eventData,key)){ev[key]=eventData[key];}"
            + "}"
            + "}"
            + "return ev;"
            + "};"
            + "}"
            + "if(typeof cap.triggerEvent!=='function'){"
            + "cap.triggerEvent=function(eventName,target,eventData){"
            + "eventData=eventData||{};"
            + "var ev=cap.createEvent?cap.createEvent(eventName,eventData):null;"
            + "if(!ev){return false;}"
            + "if(target==='document'&&document&&typeof document.dispatchEvent==='function'){"
            + "return document.dispatchEvent(ev);"
            + "}"
            + "if(target==='window'&&typeof window.dispatchEvent==='function'){"
            + "return window.dispatchEvent(ev);"
            + "}"
            + "var els=document&&document.querySelectorAll?document.querySelectorAll(target):[];"
            + "if(!els||!els.length){return false;}"
            + "for(var i=0;i<els.length;i++){els[i].dispatchEvent(ev);}"
            + "return true;"
            + "};"
            + "}"
            + "})();";

    private final Handler startupHandler = new Handler(Looper.getMainLooper());
    private boolean startupWatchdogPassed = false;
    private boolean startupReloadAttempted = false;
    private final Runnable startupWatchdogRunnable = this::runStartupWatchdog;

    private Intent normalizeNotificationIntent(Intent intent) {
        if (intent == null) {
            return intent;
        }

        Uri data = intent.getData();
        if (data != null) {
            Uri normalizedData = normalizeIncomingUri(data);
            if (normalizedData != null) {
                intent.setData(normalizedData);
            }
            return intent;
        }

        String url = firstNonBlank(getFirstMatchingExtra(intent, URL_EXTRA_KEYS));
        String route = firstNonBlank(getFirstMatchingExtra(intent, ROUTE_EXTRA_KEYS));

        if (url != null) {
            intent.setData(Uri.parse(url));
            return intent;
        }

        if (route == null) {
            return intent;
        }

        String normalizedRoute = route.startsWith("/") ? route.substring(1) : route;
        intent.setData(Uri.parse(APP_SCHEME_PREFIX + normalizedRoute));
        return intent;
    }

    private Uri normalizeIncomingUri(Uri data) {
        String scheme = data.getScheme();
        if (scheme == null) {
            return data;
        }

        if (!"top.tinytale.app".equalsIgnoreCase(scheme) && !"tinytale".equalsIgnoreCase(scheme)) {
            return data;
        }

        String host = data.getHost();
        String path = data.getEncodedPath();
        String query = data.getEncodedQuery();
        String fragment = data.getEncodedFragment();
        String normalizedPath = remapNativePath(host, path);

        StringBuilder routeBuilder = new StringBuilder(WEB_BASE_URL);
        if (normalizedPath == null || normalizedPath.isEmpty()) {
            routeBuilder.append('/');
        } else {
            if (normalizedPath.charAt(0) != '/') {
                routeBuilder.append('/');
            }
            routeBuilder.append(normalizedPath);
        }
        if (query != null && !query.isEmpty()) {
            routeBuilder.append('?').append(query);
        }
        if (fragment != null && !fragment.isEmpty()) {
            routeBuilder.append('#').append(fragment);
        }

        return Uri.parse(routeBuilder.toString());
    }

    private String remapNativePath(String host, String path) {
        String safeHost = host == null ? "" : host.trim();
        String safePath = path == null ? "" : path.trim();

        if ("play".equalsIgnoreCase(safeHost)) {
            String[] segments = safePath.replaceAll("^/+", "").split("/");
            if (segments.length >= 2 && !segments[0].isEmpty() && !segments[1].isEmpty()) {
                return "/drama/" + segments[0] + "/play/" + segments[1];
            }
            return "/play";
        }

        StringBuilder builder = new StringBuilder("/");
        if (!safeHost.isEmpty()) {
            builder.append(safeHost);
        }
        if (!safePath.isEmpty()) {
            if (safePath.charAt(0) != '/') {
                builder.append('/');
            }
            builder.append(safePath);
        }

        return builder.toString();
    }

    private String getFirstMatchingExtra(Intent intent, String[] extraNames) {
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null) {
                String trimmed = value.trim();
                if (!trimmed.isEmpty()) {
                    return trimmed;
                }
            }
        }

        return null;
    }

    private void enableImmersiveMode() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, false);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller == null) {
            return;
        }

        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // Marker method required by the social login plugin when requesting
        // custom Google scopes or offline mode on Android.
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Intent launchIntent = normalizeNotificationIntent(getIntent());
        setIntent(launchIntent);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().setBackgroundColor(Color.parseColor("#141414"));
        ((View) getBridge().getWebView().getParent()).setBackgroundColor(Color.parseColor("#141414"));
        String currentUserAgent = getBridge().getWebView().getSettings().getUserAgentString();
        if (currentUserAgent == null) {
            currentUserAgent = "";
        }
        if (!currentUserAgent.contains(NATIVE_APP_USER_AGENT_TOKEN)) {
            getBridge()
                .getWebView()
                .getSettings()
                .setUserAgentString((currentUserAgent + " " + NATIVE_APP_USER_AGENT_TOKEN).trim());
        }
        enableImmersiveMode();

        // Override Capacitor SystemBars plugin's insets listener.
        // The default listener applies imeInsets.bottom as padding when the
        // keyboard is visible, which creates a white gap above the keyboard
        // even though windowSoftInputMode="adjustNothing" is set.
        // We keep only the system-bar padding (status bar / navigation bar)
        // and never add IME padding, so the keyboard simply overlays the content.
        getWindow().getDecorView().post(() -> {
            View webViewParent = (View) getBridge().getWebView().getParent();
            ViewCompat.setOnApplyWindowInsetsListener(webViewParent, (v, insets) -> {
                Insets systemBars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
                boolean systemBarsVisible = insets.isVisible(WindowInsetsCompat.Type.systemBars());
                int topInset = systemBarsVisible ? systemBars.top : 0;
                int bottomInset = keyboardVisible ? 0 : (systemBarsVisible ? systemBars.bottom : 0);
                v.setPadding(systemBars.left, topInset, systemBars.right, bottomInset);
                return WindowInsetsCompat.CONSUMED;
            });
            ViewCompat.requestApplyInsets(webViewParent);
        });

        injectCapacitorTriggerEventShim();
        scheduleStartupWatchdog(STARTUP_WATCHDOG_DELAY_MS);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        Intent nextIntent = normalizeNotificationIntent(intent);
        super.onNewIntent(nextIntent);
        setIntent(nextIntent);
    }

    @Override
    public void onResume() {
        injectCapacitorTriggerEventShim();
        super.onResume();
        enableImmersiveMode();

        if (!startupWatchdogPassed) {
            scheduleStartupWatchdog(STARTUP_WATCHDOG_DELAY_MS);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    @Override
    public void onDestroy() {
        startupHandler.removeCallbacks(startupWatchdogRunnable);
        super.onDestroy();
    }

    private void scheduleStartupWatchdog(long delayMs) {
        startupHandler.removeCallbacks(startupWatchdogRunnable);
        startupHandler.postDelayed(startupWatchdogRunnable, delayMs);
    }

    private void injectCapacitorTriggerEventShim() {
        if (getBridge() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }

        webView.evaluateJavascript(CAPACITOR_TRIGGER_EVENT_SHIM, null);
    }

    private void runStartupWatchdog() {
        if (startupWatchdogPassed || getBridge() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }

        webView.evaluateJavascript(
            "(function(){try{"
                + "var body=document.body;"
                + "var overlay=document.getElementById('native-app-launch-overlay');"
                + "var computed=overlay?window.getComputedStyle(overlay):null;"
                + "return JSON.stringify({"
                + "readyState:document.readyState,"
                + "textLength:body&&body.innerText?body.innerText.replace(/\\s+/g,'').length:0,"
                + "childCount:body&&body.children?body.children.length:0,"
                + "hasMain:!!document.querySelector('main,nav,footer,[data-native-route-ready]'),"
                + "overlayVisible:!!(computed&&computed.display!=='none'&&computed.opacity!=='0'),"
                + "href:String(location.href||'')"
                + "});"
                + "}catch(error){return JSON.stringify({error:String(error)})}})();",
            value -> {
                StartupSnapshot snapshot = StartupSnapshot.fromEvaluateJavascript(value);
                if (snapshot == null) {
                    Log.w(TAG, "Unable to inspect startup state; keeping watchdog active.");
                    scheduleStartupWatchdog(STARTUP_WATCHDOG_RECHECK_MS);
                    return;
                }

                if (snapshot.isHealthy()) {
                    startupWatchdogPassed = true;
                    startupHandler.removeCallbacks(startupWatchdogRunnable);
                    Log.d(
                        TAG,
                        "Startup content detected. href=" + snapshot.href
                            + " textLength=" + snapshot.textLength
                            + " childCount=" + snapshot.childCount
                    );
                    return;
                }

                Log.w(
                    TAG,
                    "Detected blank startup state. href=" + snapshot.href
                        + " readyState=" + snapshot.readyState
                        + " textLength=" + snapshot.textLength
                        + " childCount=" + snapshot.childCount
                        + " overlayVisible=" + snapshot.overlayVisible
                        + " reloadAttempted=" + startupReloadAttempted
                );

                if (!startupReloadAttempted) {
                    startupReloadAttempted = true;
                    webView.reload();
                }

                scheduleStartupWatchdog(STARTUP_WATCHDOG_RECHECK_MS);
            }
        );
    }

    private static final class StartupSnapshot {
        final String readyState;
        final String href;
        final int textLength;
        final int childCount;
        final boolean hasMain;
        final boolean overlayVisible;

        private StartupSnapshot(
            String readyState,
            String href,
            int textLength,
            int childCount,
            boolean hasMain,
            boolean overlayVisible
        ) {
            this.readyState = readyState;
            this.href = href;
            this.textLength = textLength;
            this.childCount = childCount;
            this.hasMain = hasMain;
            this.overlayVisible = overlayVisible;
        }

        static StartupSnapshot fromEvaluateJavascript(String value) {
            try {
                String decoded = decodeEvaluateJavascriptValue(value);
                JSONObject json = new JSONObject(decoded);
                return new StartupSnapshot(
                    json.optString("readyState", ""),
                    json.optString("href", ""),
                    json.optInt("textLength", 0),
                    json.optInt("childCount", 0),
                    json.optBoolean("hasMain", false),
                    json.optBoolean("overlayVisible", false)
                );
            } catch (Exception error) {
                Log.e(TAG, "Failed to parse startup snapshot: " + value, error);
                return null;
            }
        }

        boolean isHealthy() {
            boolean domReady = "interactive".equals(readyState) || "complete".equals(readyState);
            boolean hasVisibleAppShell = textLength >= 120 || (hasMain && textLength >= 40);
            boolean hasRealDom = childCount >= 2;
            return domReady && hasVisibleAppShell && hasRealDom;
        }

        private static String decodeEvaluateJavascriptValue(String value) throws Exception {
            if (value == null || "null".equals(value)) {
                return "{}";
            }

            if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
                return new JSONObject("{\"value\":" + value + "}").getString("value");
            }

            return value;
        }
    }
}
