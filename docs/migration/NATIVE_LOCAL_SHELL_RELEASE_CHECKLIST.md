# TinyTale Native Local Shell Release Checklist

## Release Candidate

- Date: 2026-04-06
- Branch / commit:
- Operator:
- Scope: Phase 7-8 native shell hardening, deep-link smoke isolation, native runtime URL fallback
- Device smoke status: adb smoke executed on real device with real production fixtures; deep-link and push-route mapping verified, and real FCM delivery was confirmed on a local debug build

## Static Validation

- [x] `npm run check:boundaries`
- [x] `npm run check:native-release-config`
- [x] `npm run typecheck:shared`
- [ ] `npm run typecheck:web`
- [x] `npm run typecheck:native-shell`
- [ ] `npm run build:web`
- [x] `npm run build:native-shell`
- [x] `npm run validate:native-shell:android`

## Web Regression

- [ ] homepage renders
- [ ] browse renders
- [ ] drama detail renders
- [ ] playback route renders
- [ ] auth routes render
- [ ] user center routes render
- [ ] admin routes render
- [ ] help / privacy / terms / cookies render

## Native Shell Regression

- [ ] guest cold start opens local shell
- [ ] restored session cold start opens local shell
- [ ] home / browse / drama detail / playback render
- [ ] offline startup shows shell
- [ ] cached route fallback appears when data exists
- [ ] uncached route fallback appears safely
- [x] deep links route correctly
- [x] push targets route correctly
- [x] web-only routes open in in-app browser
- [x] `npm run android:smoke:deeplinks` artifacts reviewed
  Artifact path: `/Users/gabriel/tinytale/.codex-assets/verification/android-deeplink-smoke-20260406-150431`
- [x] `npm run android:smoke:push-routes` artifacts reviewed
  Artifact path: `/Users/gabriel/tinytale/.codex-assets/verification/android-push-route-smoke-20260406-162732`
- [x] real FCM background delivery shows Android system notification
  Artifact path: `/Users/gabriel/tinytale/.codex-assets/device-captures/native-shell-background-push-notification.png`
- [x] settings route reflects registered device token metadata
  Artifact path: `/Users/gabriel/tinytale/.codex-assets/device-captures/native-shell-settings-refreshed-push.png`
- [x] cold-start notification intent replay lands on notifications route
  Artifact path: `/Users/gabriel/tinytale/.codex-assets/device-captures/codex-notifications-cold-generic-route.png`
- [ ] real FCM notification-center tap recorded end-to-end on device

## Route Mapping Verification

| Source | Input | Expected | Result | Notes |
|---|---|---|---|---|
| deep link | `https://tinytale.top/drama/69c1d9b892a06e83d07e824b/play/69c1e3c1260768c93e397356` | `/play/:dramaId/:episodeId` | pass | resolved dynamically from production API before smoke run |
| deep link | `https://tinytale.top/browse` | `/browse` | pass | verified on real device |
| deep link | `https://tinytale.top/category/romance` | `/category/romance` | | |
| deep link | `https://tinytale.top/rankings` | `/rankings` | | |
| push payload | `{"route": "/drama/69c1d9b892a06e83d07e824b"}` | `/drama/:dramaId` | pass | cold and warm smoke both triggered native drama-detail API hydration |
| push payload | `{"route": "/user/notifications"}` | `/user/notifications` | pass | adb-injected smoke plus generic `route` cold-launch replay both land on the native notifications route; screenshot: `/Users/gabriel/tinytale/.codex-assets/device-captures/codex-notifications-cold-generic-route.png` |
| real FCM | background `route=/user/notifications` | Android system notification card | pass | delivered through local backend test endpoint and displayed in the Samsung notification shade |
| web-only link | `https://tinytale.top/about` | in-app browser | pass | `Browser.open` fired and Custom Tab task was captured in activity dump |
| web-only link | `https://tinytale.top/creator/foo/dashboard` | in-app browser | | |
| custom scheme | `top.tinytale.app://drama/69c1d9b892a06e83d07e824b` | `/drama/:dramaId` | pass | verified on real device with production drama fixture |

## Sign-off

- [ ] Web ready
- [ ] Native ready
- [ ] Reports updated
- [ ] Release approved
