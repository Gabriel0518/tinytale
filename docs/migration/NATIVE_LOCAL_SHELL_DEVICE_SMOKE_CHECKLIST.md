# TinyTale Native Local Shell Device Smoke Checklist

## Device Context

- Device: Samsung SM-S9080
- Android version: 16
- App build: `apps/native-shell` debug build synced on 2026-04-06
- Test operator: Codex + Gabriel
- Network mode: wireless adb, device online

## Startup

- [ ] cold start shows native splash then local shell
- [ ] shell appears without remote HTML dependency
- [ ] relaunch restores last auth state safely

## Auth

- [ ] guest startup works
- [ ] login works
- [ ] app restart restores session
- [ ] logout clears session and returns to guest-safe state
- [ ] expired session degrades safely

## Core Routes

- [ ] home renders
- [ ] browse renders
- [ ] drama detail renders
- [ ] play route opens immediately
- [ ] poster or skeleton appears before stream

## Playback

- [ ] entitlement state is correct
- [ ] progress restore works
- [ ] progress sync works
- [ ] leaving and returning preserves expected state

## Offline / Weak Network

- [ ] offline startup opens shell
- [ ] cached home route paints
- [ ] cached browse route paints
- [ ] uncached route shows local fallback UI
- [ ] reconnect refreshes stale data

## Push / Deep Link

- [x] app link opens correct route
- [x] custom scheme opens correct route
- [x] push tap opens correct route
- [x] cold launch from push restores intended route
- [x] resumed app from push does not duplicate route stack
- [x] web-only targets open in in-app browser
- [x] adb deep-link smoke summary reviewed
- [x] adb push-route smoke summary reviewed
- [x] real FCM registers a device token on Android debug build
- [x] foreground real FCM reaches Capacitor `pushNotificationReceived`
- [x] background real FCM renders a system notification card

## Notes

- Findings:
  - adb smoke isolation was fixed in `scripts/android-deeplink-smoke.sh`; each case now force-stops the app and records per-case launch output, logcat, activity dump, window dump, screenshot, and UI dump.
  - Artifact set `android-deeplink-smoke-20260406-144836` confirmed cold-start deep-link dispatch for each case.
  - Native shell now routes API traffic through Capacitor native HTTP, so device requests are no longer blocked by WebView CORS.
  - Artifact set `android-deeplink-smoke-20260406-150431` confirmed route mapping works against a real production drama fixture for `play`, `browse`, `about`, and `top.tinytale.app://drama/:id`.
  - Artifact set `android-push-route-smoke-20260406-162732` confirmed adb-injected push payloads reach native drama detail routes on cold/warm start, reach the notifications route, and open web-only targets in Custom Tabs without duplicate `Browser.open` on browser return.
  - A real-device local-backend session was verified with account `t1@tt.co`; backend `GET /api/user/settings` confirmed Android token registration and `firebaseConfigured: true`.
  - Screenshot `/Users/gabriel/tinytale/.codex-assets/device-captures/native-shell-settings-refreshed-push.png` confirms the settings route now shows registered token metadata and an enabled `Send Test Push` action after reopening the screen.
  - Real FCM delivery through `POST /api/user/notifications/push/test` succeeded with `successCount: 1`; foreground delivery emitted `Capacitor/PushNotificationsPlugin` event payload containing `route=/user/notifications`.
  - Screenshot `/Users/gabriel/tinytale/.codex-assets/device-captures/native-shell-background-push-notification.png` confirms the same real FCM payload renders a system notification when the app is backgrounded.
  - `MainActivity` now normalizes notification `route/url` extras into launch deep links before the Capacitor bridge boots, closing the cold-start gap where notification intents could be dropped before JS listeners were ready.
  - Screenshot `/Users/gabriel/tinytale/.codex-assets/device-captures/codex-notifications-cold-generic-route.png` confirms a cold launch carrying generic `route=/user/notifications` lands on the native notifications route without the previous runtime crash.
- Follow-up:
  - Optional parity evidence: capture one human-confirmed notification-center tap on-device for the real FCM card and record the landing route screenshot.
  - Expand smoke coverage with rankings/category once a stable public fixture list is chosen.
