package top.tinytale.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private static final String NATIVE_APP_USER_AGENT_TOKEN = "TinyTaleNativeApp";

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
    }

    @Override
    public void onResume() {
        super.onResume();
        enableImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }
}
