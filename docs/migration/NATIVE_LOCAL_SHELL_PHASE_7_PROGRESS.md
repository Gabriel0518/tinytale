# Native Local Shell Phase 7 Progress

## Scope

Phase 7 covers cache completion, offline fallback, push handling, and deep-link recovery.

## Completed

- completed stale-cache fallback support through `useCachedQuery`
- added cache `peek()` support in shared storage
- implemented route classification for native routes vs web-only fallback routes
- added deep-link remapping from `/drama/:id/play/:episodeId` to `/play/:dramaId/:episodeId`
- added push inbox persistence and merged local inbox rendering in notifications
- wired Capacitor app resume refresh and push registration lifecycle
- updated user-center screens to surface offline cached content instead of collapsing on refresh failure

## Validation

Verified in workspace:

- `npm run typecheck:shared`
- `npm run typecheck:native-shell`
- `npm run build:native-shell`
- `npm --workspace native-shell run sync:android:assets`
- `npm --workspace native-shell run android:assemble`

## Remaining Manual Checks

- test real device push registration and delivery against Firebase
- test cold launch via app link and custom scheme on device
- test offline first launch on a device with and without cached route data
