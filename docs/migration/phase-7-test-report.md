# Phase 7 Test Report

## Scope

Phase 7 verifies cache fallback, offline behavior, push handling, deep-link recovery, and safe resume behavior.

## Static Validation

- [x] `npm run typecheck:shared`
- [x] `npm run typecheck:native-shell`
- [x] `npm run build:native-shell`
- [x] `npm run check:native-release-config`
- [x] `npm --workspace native-shell run sync:android:assets`
- [x] `npm --workspace native-shell run android:assemble`

## Verified in Code / Build

- [x] stale cache fallback is available through `useCachedQuery`
- [x] cached route content is not replaced by hard error UI when refresh fails
- [x] app links and custom schemes are normalized into local routes
- [x] `/drama/:id/play/:episodeId` remaps to `/play/:dramaId/:episodeId`
- [x] web-only targets fall back to Capacitor Browser
- [x] push payload route parsing supports `route`, `path`, `href`, and `url`
- [x] unknown native routes fall back to `/`

## Manual Device Verification

- [ ] offline cold start with cached data
- [ ] offline cold start without cached data
- [ ] push receipt inserts local inbox item
- [ ] push tap opens intended route
- [x] deep link cold launch opens intended route
- [ ] resumed app refreshes stale data without route duplication

## Notes

- Static validation passed in the workspace.
- Real-device adb smoke ran successfully after wireless debugging was enabled.
- `scripts/android-deeplink-smoke.sh` was updated to isolate each case with cold start and per-case artifacts.
- Cold-start deep-link routing is verified by artifacts in `/Users/gabriel/tinytale/.codex-assets/verification/android-deeplink-smoke-20260406-150431`.
- Verified route outcomes:
  - `https://tinytale.top/drama/69c1d9b892a06e83d07e824b/play/69c1e3c1260768c93e397356` -> `#/play/:dramaId/:episodeId`
  - `https://tinytale.top/browse` -> `#/browse`
  - `top.tinytale.app://drama/69c1d9b892a06e83d07e824b` -> `#/drama/:dramaId`
  - `https://tinytale.top/about` -> Chrome Custom Tab via Capacitor Browser
- Native-shell API requests now use Capacitor native HTTP on device, so the prior WebView CORS blocker is removed.
- `play` smoke now reaches `/api/episodes/:id/stream` against a real production episode fixture.
