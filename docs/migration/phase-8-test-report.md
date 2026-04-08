# Phase 8 Test Report

## Scope

Phase 8 verifies long-term repository shape, build stability, boundary enforcement, and release-process clarity.

## Static Validation

- [x] `npm run check:boundaries`
- [x] `npm run check:native-release-config`
- [x] `npm run typecheck:web`
- [x] `npm run build:web`
- [x] `npm run typecheck:native-shell`

## Repository Validation

- [x] `apps/native-shell` does not import from root `src/`
- [x] `apps/web` is a compatibility entry and does not import from `apps/native-shell`
- [x] shared packages are guarded against importing app source trees
- [x] release workflow exists in `.github/workflows/validate-monorepo.yml`
- [x] release runbook exists
- [x] ownership map exists

## Follow-up Fixes Included

- [x] added dedicated `tsconfig.typecheck.json` so CI typechecks are stable even when Next rewrites `tsconfig.json`
- [x] added minimal `src/pages/_app`, `_document`, and `_error` compatibility files so web builds do not fail on legacy internal page resolution
- [x] fixed Web `useParams` / `useSearchParams` nullability issues exposed by stricter typechecking

## Manual Verification

- [ ] complete release checklist
- [ ] complete Android device smoke checklist
- [ ] confirm production Capacitor config is built without `CAP_SERVER_URL`

## Notes

- Phase 8 repository-level validation is green in the local workspace.
- adb-assisted device smoke is now wired up and exercised on a real Android device.
- Deep-link smoke script now captures isolated cold-start evidence per case and produced reviewable artifacts in:
  - `/Users/gabriel/tinytale/.codex-assets/verification/android-deeplink-smoke-20260406-144836`
  - `/Users/gabriel/tinytale/.codex-assets/verification/android-deeplink-smoke-20260406-150108`
  - `/Users/gabriel/tinytale/.codex-assets/verification/android-deeplink-smoke-20260406-150431`
- Push-route smoke is now available via `npm run android:smoke:push-routes` and produced a reviewable artifact in:
  - `/Users/gabriel/tinytale/.codex-assets/verification/android-push-route-smoke-20260406-162732`
- Native-shell production fallback URLs were corrected so release builds no longer default to `localhost:7001/7002`.
- Native-shell request transport now uses Capacitor native HTTP on device, eliminating the WebView CORS blocker against `https://api.tinytale.top`.
- Deep-link smoke now auto-resolves a real production drama + episode fixture before launching the `play` case.
- adb-injected push payloads now enter the same runtime route handler as real push taps, and cold-start web-only targets no longer re-open a second Custom Tab after the browser returns an `appUrlOpen` callback.
- Real FCM verification was extended on April 6, 2026 against a local debug build pointed at `http://192.168.1.61:7002`; backend delivery returned `successCount: 1`.
- Foreground real FCM delivery was observed in `adb logcat` via `Capacitor/PushNotificationsPlugin`, including the expected `route=/user/notifications` payload.
- Background real FCM delivery rendered a visible Android notification card, captured in `/Users/gabriel/tinytale/.codex-assets/device-captures/native-shell-background-push-notification.png`.
- The native settings screen exposed a stale push-registration state until the route was reopened; this round adds an optimistic React Query cache update in `AppRuntimeCoordinator` so token registration/unregistration is reflected immediately in the `Push delivery` and `Push test` cards.
- `MainActivity` now normalizes notification `route/url` extras into deep-link launch data before Capacitor boots, so cold-start notification intents are consumed by `App.getLaunchUrl()` even if JS listeners have not mounted yet.
- Screenshot `/Users/gabriel/tinytale/.codex-assets/device-captures/codex-notifications-cold-generic-route.png` confirms a generic `route=/user/notifications` launch intent opens the native notifications route on-device after the cold-start fix.
- Remaining optional evidence gap: a human-tapped real system notification screenshot on Samsung; route-equivalent cold-start replay now passes on-device.
