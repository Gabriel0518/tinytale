# Native Local Shell Phase 3 Progress

## Completed In This Pass

- Added `apps/native-shell/capacitor.config.ts` with production `webDir: dist` behavior and optional dev `server.url`
- Replaced the demo-only `apps/native-shell/src/App.tsx` with a structured local shell bootstrap
- Added:
  - `app/App.tsx`
  - `app/AppShell.tsx`
  - `app/NavigationFrame.tsx`
  - `bootstrap/boot-native-app.tsx`
  - `bootstrap/LaunchCoordinator.tsx`
  - `bootstrap/bootstrap-session.ts`
  - `bootstrap/bootstrap-runtime.ts`
  - `providers/QueryProvider.tsx`
  - `providers/AuthProvider.tsx`
  - `providers/I18nProvider.tsx`
  - `router/app-routes.tsx`
  - `router/protected-routes.tsx`
  - `router/route-names.ts`
  - `router/route-builders.ts`
  - `router/deep-links.ts`
  - `theme/tokens.css`
  - `theme/global.css`
- Added local shell screen placeholders for:
  - home
  - browse
  - search
  - category
  - rankings
  - drama detail
  - playback
  - login
  - register
  - reset password
  - profile

## Validation

- `npm run typecheck:native-shell` passes
- `npm run build:native-shell` passes

## Remaining To Reach Full Phase 3 Completion

- migrate or duplicate the existing Android project into `apps/native-shell/android`
- port `MainActivity.java` customizations:
  - `TinyTaleNativeApp` user agent token
  - immersive mode
  - keyboard/inset override
  - WebView background color
- connect Capacitor runtime bootstrap to the local shell build output
- verify debug sync and Android packaging flow from the new app location

## Remaining To Reach Phase 4

- replace placeholder local screens with real cached shell states
- hydrate first-route data via shared API/query layer
- implement localized route mapping and deep-link entry from app launch
