# TinyTale Native Local Shell Playback Refactor

## Document Info

- Owner: `Lead Agent`
- Status: `Domain Design`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md)
- Goal: define the full playback-domain refactor required to make Native playback route-first, shell-first, and state-driven.

## 1. Problem Statement

Current playback behavior is heavily screen-driven.

The refactor goal is to move playback logic into a dedicated domain so:

- player shell appears immediately
- entitlement logic is isolated
- stream fetch is isolated
- resume and progress are isolated
- prefetch is isolated
- route lifecycle does not directly own playback business logic

## 2. Target Package Shape

```text
packages/shared-player/src
  /domain
    playback-session.ts
    entitlement.ts
    progress.ts
    prefetch.ts
    quality.ts
    playback-errors.ts
  /adapters
    cloudflare-stream.ts
    hls.ts
    native-fullscreen.ts
  /repositories
    progress-repository.ts
    prefetch-repository.ts
  /hooks
    usePlaybackSession.ts
    useEntitlement.ts
    useProgressSync.ts
    useStreamInfo.ts
  /ui
    PlayerRoot.tsx
    PlayerSurface.tsx
    ControlBar.tsx
    PaywallOverlay.tsx
    LoadingState.tsx
    ErrorState.tsx
  index.ts
```

## 3. Playback Route Model

Native route:

- `/play/:dramaId/:episodeId`

The route should only do:

- parse route params
- connect to playback session service
- render local player shell
- trigger session bootstrap

The route should not directly:

- fetch stream URL inline
- own unlock business logic
- own progress persistence logic
- own quality state storage

## 4. Playback State Machine

Recommended top-level states:

- `idle`
- `booting`
- `loading-entitlement`
- `loading-stream`
- `ready`
- `playing`
- `paused`
- `buffering`
- `blocked`
- `error`
- `ended`

State inputs:

- route params
- local progress snapshot
- entitlement result
- stream info result
- player element events
- app lifecycle events

## 5. Entitlement Flow

Separate service:

- `resolveEpisodeEntitlement(dramaId, episodeId, userContext)`

Output:

- free
- unlocked
- vip
- locked
- unknown-error

Rules:

- shell renders regardless of entitlement timing
- paywall overlays locally
- entitlement failure must not blank the screen

## 6. Stream Info Flow

Separate service:

- `getStreamPlaybackInfo(episodeId, sessionContext)`

Behavior:

- use short-lived cache
- tolerate retry
- invalidate quickly on errors
- never hold shell visibility hostage

## 7. Progress Model

Progress domain must support:

- local restore
- debounced local persistence
- periodic remote sync
- completion handling
- resume-from-progress prompt

Suggested fields:

- episodeId
- dramaId
- currentTime
- duration
- updatedAt
- completed
- lastPlaybackSpeed
- lastSelectedQuality

## 8. Prefetch Model

Prefetch should be route-aware but domain-owned.

Scope:

- next episode preview data
- short-lived stream warm data
- poster and metadata
- optional segment prefetch where safe

Rules:

- prefetch must not break playback correctness
- prefetch must respect connection quality and battery constraints
- prefetch can be disabled by runtime settings

## 9. UI Responsibilities

`PlayerRoot`

- orchestration container

`PlayerSurface`

- video surface

`ControlBar`

- presentation controls

`PaywallOverlay`

- locked-state UI

`LoadingState`

- local visual state while entitlement/stream are loading

`ErrorState`

- retriable error UI

## 10. Current Code to Refactor

Primary sources:

- [src/components/player](/Users/gabriel/tinytale/src/components/player)
- [src/lib/playback.ts](/Users/gabriel/tinytale/src/lib/playback.ts)
- [src/lib/playback-prefetch.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch.ts)
- [src/lib/playback-prefetch-enhanced.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch-enhanced.ts)
- [src/lib/playback-progress-cache.ts](/Users/gabriel/tinytale/src/lib/playback-progress-cache.ts)
- [src/app/drama/[id]/play/[episodeId]/page.tsx](/Users/gabriel/tinytale/src/app/drama/[id]/play/[episodeId]/page.tsx)

## 11. Migration Plan

Step 1:

- define `shared-player` contracts and state machine

Step 2:

- move progress repository and cache model

Step 3:

- move prefetch logic into domain services

Step 4:

- split player UI from orchestration

Step 5:

- integrate Native playback route against `shared-player`

Step 6:

- backport Web playback route to shared-player where safe

## 12. Acceptance Criteria

Playback refactor is successful only if:

- player shell appears immediately on route entry
- route does not blank while entitlement loads
- progress restores locally
- remote sync is incremental
- locked content shows local overlay
- stream fetch and retry work without collapsing route state
- Web and Native share playback business logic contracts

