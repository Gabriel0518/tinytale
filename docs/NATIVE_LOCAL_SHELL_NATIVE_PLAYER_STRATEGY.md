# TinyTale Native Local Shell Native Player Strategy

## Document Info

- Owner: `Lead Agent`
- Status: `Playback Architecture Strategy`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
- Goal: define the recommended app-side native player strategy for load speed, startup performance, playback stability, and future caching/offline evolution.

## 1. Executive Summary

For the App side, the recommended direction is not to keep the video core inside the WebView forever.

The recommended direction is:

- keep the route shell, business UI, overlays, and playback orchestration in React
- move the actual media playback engine to native
  - Android: ExoPlayer
  - iOS: AVPlayer
- bridge that engine into the app through a Capacitor plugin

This is the best long-term approach if the goals are:

- faster first frame
- more stable HLS playback
- better buffering behavior
- smoother app lifecycle handling
- future pre-cache and offline enhancements

## 2. Why the Current WebView Player Has Limits

The current app-side playback stack is mainly based on WebView player logic and browser media behavior.

Relevant current code:

- [src/components/player](/Users/gabriel/tinytale/src/components/player)
- [src/app/drama/[id]/play/[episodeId]/page.tsx](/Users/gabriel/tinytale/src/app/drama/[id]/play/[episodeId]/page.tsx)
- [src/lib/playback.ts](/Users/gabriel/tinytale/src/lib/playback.ts)
- [src/lib/playback-prefetch.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch.ts)
- [src/lib/playback-prefetch-enhanced.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch-enhanced.ts)

This approach is workable, but it has ceiling limits:

- WebView startup and JS execution sit on the critical playback path
- browser media stack control is weaker than native media stack control
- buffering behavior is harder to tune precisely
- app lifecycle transitions are less predictable
- full-screen, PiP, audio focus, interruptions, and background recovery are less native
- future local caching and offline work become more awkward

## 3. Recommended Final Player Model

The target app-side model should be:

- React local app shell controls the playback screen
- React renders:
  - route shell
  - poster
  - title/meta
  - control overlays
  - paywall overlay
  - next-episode UI
  - loading and error states
- native plugin renders and controls the actual video playback engine

This is a hybrid architecture:

- business and experience layer in JS/React
- media core in native

## 4. Native Player Recommendation

### Android

Use ExoPlayer.

Reasons:

- strongest Android HLS support
- mature adaptive bitrate handling
- reliable event model
- strong buffering controls
- strong integration with audio focus, PiP, and media session
- good future support for caching and offline extensions

### iOS

Use AVPlayer.

Reasons:

- native iOS playback engine
- stable HLS support
- system lifecycle alignment
- strong backgrounding and interruption support
- natural PiP/full-screen support

## 5. Architecture Layers

Recommended player architecture:

```text
App Playback Route
└─ React Player Screen
   ├─ Shared Playback Domain
   │  ├─ entitlement
   │  ├─ stream request
   │  ├─ progress sync
   │  ├─ prefetch policy
   │  └─ resume policy
   ├─ React UI Layer
   │  ├─ controls
   │  ├─ overlays
   │  ├─ loading states
   │  ├─ error states
   │  └─ paywall
   └─ Native Player Plugin
      ├─ Android ExoPlayer
      └─ iOS AVPlayer
```

## 6. Native Surface Rendering Strategy (CRITICAL)

### Problem

In Capacitor, the entire app renders inside a WebView. The React player screen — controls, overlays, paywall — all live in the WebView. A native ExoPlayer/AVPlayer surface must coexist with the WebView without z-ordering conflicts.

### Recommended Approach: WebView Transparency Hole

The recommended rendering model is:

1. The native player surface (SurfaceView on Android, AVPlayerLayer on iOS) renders **behind** the WebView
2. The WebView background is made transparent over the player area
3. React overlays (controls, paywall, loading states) render **on top** in the WebView, naturally covering the native surface when needed
4. When the player is not active, the WebView background returns to opaque

This preserves the hybrid architecture: React owns the UI, native owns the video surface.

### Coordinate Synchronization

The React player container must communicate its position and dimensions to the native plugin:

- `attachSurface({ containerId, x, y, width, height })` positions the native surface
- on layout changes (orientation, resize), React must re-send coordinates
- a ResizeObserver or layout listener on the container element triggers re-synchronization

### Alternative Approaches (Not Recommended for First Phase)

- **Native overlay on top of WebView**: would require React controls to also become native, defeating the hybrid model
- **Full native player activity**: leaves the WebView entirely, losing React overlays and paywall
- **Capacitor `@nicepkg/capacitor-native-video-player` pattern**: third-party dependency, less control

### Fullscreen Mode

When entering fullscreen:

- the native surface expands to cover the full screen
- the WebView remains active but shows only the control overlay layer
- exiting fullscreen restores the inline coordinate mapping

### Platform Specifics

**Android:**

- use `TextureView` (not `SurfaceView`) for compatibility with WebView transparency
- `SurfaceView` has z-ordering issues with transparent WebView backgrounds
- set WebView background to `Color.TRANSPARENT` over the player region

**iOS:**

- use `AVPlayerLayer` in a `UIView` positioned behind the `WKWebView`
- `WKWebView.isOpaque = false` and `backgroundColor = .clear` over the player region
- coordinate mapping must account for safe area insets

## 7. Capacitor Plugin Strategy

Create a custom Capacitor plugin, for example:

- `TinyTaleNativePlayer`

> **Note**: The high-level API below is a conceptual outline. The authoritative typed API is defined in [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md). When in conflict, the Plugin Spec takes precedence.

### Core commands

- `initialize(containerId?)`
- `setSource({ url, mimeType, headers, drm?, subtitles? })`
- `play()`
- `pause()`
- `seekTo({ positionMs })`
- `setPlaybackRate({ rate })`
- `setMuted({ muted })`
- `setVolume({ volume })`
- `destroy()`

### Optional display commands

- `enterFullscreen()`
- `exitFullscreen()`
- `enablePiP()`
- `disablePiP()`
- `attachSurface({ mode })`

### Optional cache/prefetch commands

- `warmSource({ url, headers })`
- `prefetchEpisode({ episodeId, url, strategy })`
- `clearPrefetch({ episodeId? })`

### Player state events

- `ready`
- `bufferingStart`
- `bufferingEnd`
- `progress`
- `durationChange`
- `ended`
- `error`
- `fullscreenChange`
- `pipChange`
- `trackChange`
- `qualityChange`

## 8. React Side Responsibilities

React should continue to own:

- route lifecycle
- entitlement decision tree
- episode switching
- progress display
- paywall overlay
- quality menu UI
- next episode CTA
- loading UI
- playback error UI

React should not own:

- actual media decoding
- platform audio focus
- core stream pipeline behavior
- native buffering engine tuning

## 9. Native Side Responsibilities

The native plugin should own:

- HLS playback engine
- media session integration
- audio focus and interruptions
- picture-in-picture support
- system full-screen integration
- render surface lifecycle
- low-level buffering policy
- native playback telemetry events

## 10. Startup and First-Frame Optimization

The player strategy should be optimized around first-frame speed.

Recommended sequence:

1. playback route opens instantly
2. local screen shell renders immediately
3. poster and control shell render immediately
4. entitlement and stream info requests begin in parallel
5. native player surface is mounted early
6. stream source is passed to native player
7. first frame replaces poster

### Important rule

The route must never wait for stream URL before showing UI.

## 11. Recommended Near-Term Performance Improvements

Even before the native player is fully implemented, these improvements should be made:

- parallelize entitlement and stream metadata fetch where safe
- render local poster and controls immediately
- move loading UX fully local
- warm next episode metadata before route change
- warm likely stream URLs when entering drama detail
- collapse unnecessary serial fetch chains

## 12. Native Player Migration Plan

### Step 1: Shared Playback Domain First

Before native engine migration:

- isolate entitlement
- isolate progress
- isolate prefetch
- isolate stream source loading

This ensures the native player plugin has a clean JS-side domain to plug into.

### Step 2: Introduce Native Plugin Behind Adapter

Create a `player adapter` interface:

- `WebPlayerAdapter`
- `NativePlayerAdapter`

This allows:

- Web to keep its current path
- Native to opt into native playback

### Step 3: Native Route Uses Native Adapter

Native shell playback screen should use:

- shared playback domain
- native player adapter

Web route should continue using:

- shared playback domain
- web player adapter

### Step 4: Remove App-Side Dependence on WebView Video Core

Once stable:

- native app playback should no longer depend on the WebView player engine for critical playback

## 13. Integration with Current Code

Recommended future refactor targets:

Current:

- [src/components/player/PlayerRoot.tsx](/Users/gabriel/tinytale/src/components/player/PlayerRoot.tsx)
- [src/components/player/CloudflarePlayer.tsx](/Users/gabriel/tinytale/src/components/player/CloudflarePlayer.tsx)
- [src/components/player/MobilePlayer.tsx](/Users/gabriel/tinytale/src/components/player/MobilePlayer.tsx)
- [src/components/player/mobile/PlayerMobileExperience.tsx](/Users/gabriel/tinytale/src/components/player/mobile/PlayerMobileExperience.tsx)

Future direction:

- move UI presentation pieces to shared-player/shared-ui
- replace app-side engine layer with adapter-backed native player
- keep Web-specific player implementations as Web adapters only

## 14. Caching and Offline Evolution

The first recommended native-player goal is not full offline download.

The first recommended caching progression is:

### Stage A: startup and stream warm-up

- poster cache
- metadata cache
- short-lived stream info cache
- manifest warm-up

### Stage B: intelligent prefetch

- next-episode metadata prefetch
- first few segments warm-up where safe
- predictive prefetch for likely next episode

### Stage C: partial offline support

- subtitle cache
- artwork cache
- metadata cache
- optional secure short-lived segment caching

### Stage D: true offline playback

Only evaluate after:

- DRM/signing constraints are fully understood
- storage management strategy exists
- content security requirements are approved

## 15. Why Full Local File Playback Is Not the First Recommendation

If “local player” means “download full files to disk and play them locally”, that should not be the first milestone.

Reasons:

- storage complexity
- content security concerns
- signed URL / entitlement / DRM complexity
- cache invalidation complexity
- offline rights management complexity

The better first move is:

- native playback engine for remote HLS streams

That gives most of the performance/stability benefit much earlier.

## 16. Telemetry and Monitoring Requirements

The native player should expose telemetry for:

- player init time
- source attach time
- first frame time
- buffering duration
- rebuffer count
- fatal vs recoverable errors
- playback completion
- pause/resume transitions

Recommended metrics:

- route entry to player shell shown
- route entry to source set
- source set to first frame
- total startup to first frame
- play success rate
- mid-stream failure rate

## 17. Bundle Size Benefit

Moving the media playback core to native means `apps/native-shell` no longer needs `video.js` or `hls.js`. These libraries contribute ~300KB+ to the JS bundle. Removing them from the native-shell build reduces:

- initial bundle download size
- JS parse and execution time on cold start
- WebView memory pressure

`apps/web` retains `video.js` and `hls.js` since the Web player remains browser-based.

## 18. Acceptance Criteria

The native player strategy is successfully implemented only if:

- app-side playback no longer relies on WebView media core for critical playback
- first-frame performance improves measurably
- playback stability under weak network improves
- full-screen and PiP behavior become native-consistent
- playback route still shares domain logic with Web where appropriate

## 19. Recommended Implementation Order

1. finish `shared-player` domain refactor
2. define adapter interface
3. build Capacitor native player plugin
4. integrate Native Shell route with native adapter
5. keep Web route on web adapter
6. add startup telemetry
7. add prewarm and prefetch enhancements

## 20. Future Follow-Up Document Suggestion

If this strategy is approved, the next recommended implementation document should be:

- `docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md`

That document should define:

- exact plugin API
- Android ExoPlayer lifecycle rules
- iOS AVPlayer lifecycle rules
- React adapter interface
- event payload contracts

