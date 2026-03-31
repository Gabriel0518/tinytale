# TinyTale Android Optimization Implementation Report

> Date: 2026-03-28
> Scope: Android mobile experience refactor for the Capacitor app
> Repo: `/Users/gabriel/tinytale`

## Summary

This implementation executed the Android optimization plan across the mobile shell, key discovery pages, drama detail, player flow, profile/settings, modal system, and Android runtime/configuration.

The main goal was to reduce the "responsive website inside WebView" feeling and move the experience closer to a native streaming app.

## Completed Work

### 1. Mobile Shell, Navigation, and Footer

- Added a shared mobile page wrapper:
  - `src/components/mobile/MobilePageShell.tsx`
- Slimmed the mobile navbar:
  - smaller mobile brand treatment
  - mobile coin pill
  - contextual mobile back button behavior
  - compact mobile height
- Hid the website footer on mobile/native app:
  - `src/components/features/Footer.tsx`
- Improved mobile tab/pill rows:
  - gradient edge masks
  - larger touch targets
  - haptic feedback on tab switching

Key files:

- `src/components/features/Navbar.tsx`
- `src/components/features/Footer.tsx`
- `src/components/mobile/MobilePageShell.tsx`
- `src/components/mobile/MobileScrollTabs.tsx`

### 2. Home, Browse, Search, Rankings

- Home page mobile hero reduced from oversized web-style presentation to a more app-friendly proportion.
- Mobile shelf cards got stronger press feedback and better text area stability.
- Home category pills were unified onto the mobile tab component.
- Browse page moved into the shared mobile shell.
- Browse page now supports pull-to-refresh and earlier infinite loading behavior on mobile.
- Search page moved into the shared mobile shell.
- Rankings page moved into the shared mobile shell and uses mobile tab styling for period switching.

Key files:

- `src/app/page.tsx`
- `src/app/browse/page.tsx`
- `src/app/search/page.tsx`
- `src/app/rankings/page.tsx`
- `src/components/mobile/PullToRefresh.tsx`

### 3. Drama Detail Mobile Redesign

- Reworked the mobile drama detail presentation:
  - immersive cover/header treatment
  - floating mobile controls
  - stronger sticky header behavior
  - clearer `Episodes / Reviews / Related` sectioning
  - episode area moved toward a more mobile-friendly vertical list behavior
  - fixed bottom `Watch Now` CTA
  - safer image source handling on mobile detail surfaces

Key file:

- `src/app/drama/[id]/page.tsx`

### 4. Player Mobile Polish

- Added a thin persistent progress bar for the mobile player.
- Added controlled autoplay-next countdown flow:
  - 5-second countdown
  - cancel option
  - play-now option
  - cleanup when the user manually changes episode
- Preserved the existing bottom-sheet episode flow and kept it compatible with the new autoplay countdown.
- Applied safe image handling in the locked/paywall path.

Key files:

- `src/app/drama/[id]/play/[episodeId]/page.tsx`
- `src/components/player/MobilePlayer.tsx`

### 5. Profile and Settings Mobile Refactor

- Reworked mobile profile into a native-style action hub instead of a tab-heavy web layout.
- Added mobile quick-entry cards for:
  - Coins
  - VIP
  - Favorites
  - History
  - Purchases
  - Settings
- Reworked mobile settings into grouped native-style sections.
- Moved Help / Terms / Privacy access into Settings under the mobile "About" area.
- Preserved existing data logic and desktop layout behavior.

Key files:

- `src/app/user/profile/page.tsx`
- `src/app/user/settings/page.tsx`

### 6. Modal and Bottom Sheet System

- Upgraded the shared modal system so mobile/native environments prefer bottom-sheet rendering automatically.
- Added swipe-to-close support for mobile bottom sheets.
- Preserved desktop modal behavior without breaking existing usage sites.

Key files:

- `src/components/ui/Modal.tsx`
- `src/components/mobile/MobileBottomSheet.tsx`
- `src/hooks/useResponsiveModal.ts`

### 7. Android Runtime and Build Behavior

- Extended Android back button handling to work across the app, not just isolated routes.
- Added "double tap back to exit" behavior on the mobile home route.
- Added manual splash-screen dismissal handling for a cleaner launch path.
- Separated Capacitor dev-server behavior from production-style configuration:
  - `server.url` is only injected when `CAP_SERVER_URL` is explicitly provided
  - splash auto-hide is disabled so the app runtime can control dismissal

Key files:

- `src/components/mobile/AppRuntime.tsx`
- `src/lib/capacitor-bridge.ts`
- `capacitor.config.ts`

### 8. Android Test Cleanup Pass

- Enabled Android predictive back callback support in the app manifest to remove runtime back warnings.
- Fixed `next/image` logo sizing warnings for shared app branding surfaces.
- Normalized local native dev network status so emulator sessions using `127.0.0.1` no longer show a misleading offline toast during startup.
- Corrected the home-route back handling order so Android now uses:
  - first back press: show "back again to exit"
  - second back press within threshold: exit to launcher

Key files:

- `android/app/src/main/AndroidManifest.xml`
- `src/components/features/Navbar.tsx`
- `src/components/features/Footer.tsx`
- `src/components/auth/AuthLayout.tsx`
- `src/components/mobile/AppRuntime.tsx`
- `src/lib/capacitor-bridge.ts`

## Notes on Existing Functionality

- `MobileMiniPlayer` was already globally mounted before this implementation.
- The work kept that integration in place rather than rebuilding it from scratch.
- Existing Android/Firebase local setup changes made earlier in the project were preserved.

## Validation

### Lint

Executed:

```bash
npm run lint -- --file src/app/page.tsx --file src/app/browse/page.tsx --file src/app/search/page.tsx --file src/app/rankings/page.tsx --file src/app/drama/[id]/page.tsx --file src/app/drama/[id]/play/[episodeId]/page.tsx --file src/app/user/profile/page.tsx --file src/app/user/settings/page.tsx --file src/components/features/Navbar.tsx --file src/components/features/Footer.tsx --file src/components/mobile/AppRuntime.tsx --file src/components/mobile/MobileBottomSheet.tsx --file src/components/mobile/MobileScrollTabs.tsx --file src/components/mobile/MobilePageShell.tsx --file src/components/mobile/PullToRefresh.tsx --file src/components/player/MobilePlayer.tsx --file src/components/ui/Modal.tsx --file src/hooks/usePlatform.ts --file src/hooks/useResponsiveModal.ts --file src/lib/capacitor-bridge.ts
```

Result:

- No ESLint errors
- `src/app/drama/[id]/page.tsx` still contains pre-existing React hooks warnings only

### Android Rebuild + Emulator Verification

Executed:

```bash
CAP_SERVER_URL='http://127.0.0.1:7001' npx cap sync android
npm run android:assemble
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5556 shell am start -W -n top.tinytale.app/.MainActivity
```

Verified:

- Cold launch succeeds and app reaches foreground normally.
- Home screen renders correctly on the emulator with the new mobile shell.
- `android:enableOnBackInvokedCallback` warning no longer appears in the retest logs.
- `/logo.png` size warning no longer appears in the retest logs.
- Single back press on home keeps the app open.
- Double back press within the configured threshold exits to the Android launcher as expected.

Still non-blocking in local dev mode:

- Next dev hydration warning: `Extra attributes from the server: style`
- Capacitor console noise: `[object Object]` / `undefined`
- Emulator font/network noise from Google services when the virtual device has unstable internet

### Android Rebuild and Emulator Verification

Executed:

```bash
CAP_SERVER_URL='http://127.0.0.1:7001' npm run android:sync
npm run android:assemble
adb -s emulator-5556 install -r /Users/gabriel/tinytale/android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5556 shell am start -W -n top.tinytale.app/.MainActivity
```

Result:

- Capacitor sync completed successfully
- Debug APK assembled successfully
- Updated APK installed successfully on `emulator-5556`
- Cold launch completed successfully
- App returned to foreground in `RESUMED` state on `top.tinytale.app/.MainActivity`

### Follow-up Fixes Completed After Initial Implementation

- Added `android:enableOnBackInvokedCallback="true"` to the Android app manifest
  - `android/app/src/main/AndroidManifest.xml`
- Removed the repeated `/logo.png` `next/image` sizing warning by explicitly preserving auto width on logo renders
  - `src/components/features/Navbar.tsx`
  - `src/components/features/Footer.tsx`
  - `src/components/auth/AuthLayout.tsx`
- Suppressed false offline runtime handling during local native dev sessions using `127.0.0.1` / `localhost`
  - `src/lib/capacitor-bridge.ts`

### Current Known Non-Blocking Dev Warnings

- Next.js dev-mode hydration warning still appears:
  - `Warning: Extra attributes from the server: style`
- A set of anonymous `Capacitor/Console` entries like `[object Object]` / `undefined` still appears during local dev-server runs
- These warnings did not reproduce as fatal crashes and did not block launch, navigation, or app foreground stability
- The `/logo.png` warning did not reappear in the latest verification logs
- The previous Android `enableOnBackInvokedCallback` warning did not reappear in the latest verification logs

## Recommended Android Test Paths

### High Priority

1. Launch app from a cold start and confirm splash -> home transition is stable.
2. Browse home, browse, search, rankings using the new mobile shell.
3. Open a drama detail page and verify:
   - header behavior
   - share
   - favorite
   - sticky CTA
   - episode switching
4. Enter player and verify:
   - progress bar
   - episode drawer
   - autoplay-next countdown
5. Open Profile and Settings on Android and verify mobile navigation flow.

### Android-Specific

1. Press Android back on:
   - home
   - browse
   - drama detail
   - player
   - settings
2. Confirm double-back exits from home.
3. Confirm no website footer appears on mobile pages.

## Files Added

- `src/components/mobile/MobilePageShell.tsx`
- `src/hooks/useResponsiveModal.ts`
- `ANDROID_IMPLEMENTATION_REPORT.md`

## Final Outcome

The Android app now has a significantly stronger mobile-native presentation in the most important user flows:

- shell/navigation feels less web-like
- detail and player flows are more app-like
- account pages are more native-style
- modal interactions are more mobile-appropriate
- Android runtime behavior is more release-friendly

This is now in a better state for Android emulator and real-device testing before the later Google Play billing integration phase.
