# TinyTale Native Local Shell Native Player Plugin Spec

## Document Info

- Owner: `Lead Agent`
- Status: `Implementation Specification`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md)
- Goal: define the exact internal plugin package shape, JS bridge API, event payload contracts, native lifecycle rules, and React adapter boundary for the Native Player implementation.

## 1. Spec Scope

This document defines the implementation contract for the app-side native player.

It exists to make the following workstreams independently executable:

- plugin package scaffolding
- Android ExoPlayer integration
- iOS AVPlayer integration
- React adapter integration
- playback telemetry integration
- acceptance testing

This spec is for the Native Shell only.

It does not replace the Web player.

## 2. Design Principles

The plugin must follow these rules:

- Native Shell playback must not depend on WebView media playback.
- React owns route and UI state, but not media decoding.
- The plugin API must be stable enough for `shared-player` to bind against an adapter.
- The plugin must support source replacement without tearing down the whole route.
- The plugin must emit deterministic lifecycle events.
- The plugin must expose enough telemetry for startup and buffering optimization.
- The plugin must degrade safely when unsupported features such as PiP are unavailable.

## 3. Package Placement

This spec extends the baseline workspace by adding one platform-specific internal package:

```text
/Users/gabriel/tinytale
├─ apps
│  ├─ web
│  └─ native-shell
├─ packages
│  ├─ shared-domain
│  ├─ shared-api
│  ├─ shared-auth
│  ├─ shared-storage
│  ├─ shared-ui
│  ├─ shared-player
│  ├─ shared-runtime
│  └─ native-player-plugin
│     ├─ package.json
│     ├─ src
│     │  ├─ index.ts
│     │  ├─ definitions.ts
│     │  ├─ errors.ts
│     │  ├─ events.ts
│     │  ├─ bridge.ts
│     │  └─ web.ts
│     ├─ android
│     │  └─ src/main/java/com/tinytale/player
│     └─ ios
│        └─ Plugin
```

### Package rules

- `packages/native-player-plugin` is the only workspace package allowed to contain native Android/iOS code.
- `apps/native-shell` may import the plugin package directly.
- `apps/web` must never import the native plugin package.
- `packages/shared-player` may depend only on the plugin TypeScript contracts through an adapter boundary, not on app routing code.

## 4. Ownership Boundary

Recommended ownership for implementation:

| Area | Primary Owner | Supporting Owner | Notes |
|---|---|---|---|
| Plugin TS contract | `Lead Agent` | `Dev Agent` | Source of truth for JS API and event payloads |
| React adapter | `Dev Agent` | `Lead Agent` | Lives near `shared-player` integration |
| Android ExoPlayer implementation | `Dev Agent` | `Lead Agent` | Android-first delivery |
| iOS AVPlayer implementation | `Dev Agent` | `Lead Agent` | Deferred until Android path is stable |
| Telemetry contract | `Lead Agent` | `Audit Agent` | Metrics naming and acceptance thresholds |
| Validation and regression testing | `Audit Agent` | `Dev Agent` | No code ownership for audit |

## 5. Public Plugin API

Recommended plugin name:

- `TinyTaleNativePlayer`

Recommended TypeScript definition baseline:

```ts
export type PlayerPlatform = 'android' | 'ios' | 'web-fallback';
export type PlayerSurfaceMode = 'inline' | 'fullscreen';
export type PlaybackState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error';

export interface PlayerSource {
  url: string;
  mimeType?: string;
  headers?: Record<string, string>;
  posterUrl?: string;
  subtitleTracks?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  drm?: DrmConfig;
  startPositionMs?: number;
  autoplay?: boolean;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  url: string;
  mimeType?: string;
  default?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string;
  language?: string;
  channelLayout?: string;
  bitrateKbps?: number;
}

export interface DrmConfig {
  type: 'widevine' | 'fairplay';
  licenseUrl: string;
  headers?: Record<string, string>;
  certificateUrl?: string;
}

export interface InitializeOptions {
  sessionId: string;
  surfaceMode?: PlayerSurfaceMode;
  allowBackgroundAudio?: boolean;
  enablePiP?: boolean;
  preferMutedAutoplay?: boolean;
}

export interface TinyTaleNativePlayerPlugin {
  initialize(options: InitializeOptions): Promise<{ platform: PlayerPlatform }>;
  attachSurface(options?: { containerId?: string; surfaceMode?: PlayerSurfaceMode }): Promise<void>;
  setSource(source: PlayerSource): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(options: { positionMs: number }): Promise<void>;
  setPlaybackRate(options: { rate: number }): Promise<void>;
  setMuted(options: { muted: boolean }): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  setSubtitleTrack(options: { trackId: string | null }): Promise<void>;
  setAudioTrack(options: { trackId: string | null }): Promise<void>;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  enablePiP(): Promise<void>;
  disablePiP(): Promise<void>;
  warmSource(options: { url: string; headers?: Record<string, string> }): Promise<void>;
  getState(): Promise<PlayerSnapshot>;
  destroy(options?: { releaseSession?: boolean }): Promise<void>;
  addListener(
    eventName: NativePlayerEventName,
    listenerFunc: (payload: NativePlayerEventMap[NativePlayerEventName]) => void,
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
```

## 6. API Semantics

`initialize`

- Creates a native playback session.
- Must be idempotent for the same `sessionId`.
- Must not start network playback by itself.

`attachSurface`

- Binds or rebinds the visual surface.
- Must succeed even if source is not yet attached.
- Must support route-level remount without rebuilding the player session.

`setSource`

- Replaces the active media item.
- Must preserve the plugin session while loading a new episode.
- Must emit a deterministic event sequence:
  - `sourceChange`
  - `loading`
  - `ready` or `error`

`destroy`

- Must remove listeners, detach surfaces, and release native resources.
- If `releaseSession` is false, an implementation may keep a warm player instance for a very short reuse window.

### Warm Instance Policy

When `destroy({ releaseSession: false })` is called:

- the native player instance is kept alive for a maximum of **5 seconds**
- if `initialize` is called with the same `sessionId` within this window, the warm instance is reused (avoids ExoPlayer/AVPlayer recreation)
- if the window expires without reuse, the instance is fully released
- if the device reports memory pressure during the warm window, the instance is released immediately
- warm instances count against the session registry — only one warm instance is allowed at a time
- the warm instance must not hold audio focus during the warm window

## 7. Event Contract

Required event names:

```ts
export type NativePlayerEventName =
  | 'sessionInitialized'
  | 'surfaceAttached'
  | 'sourceChange'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'bufferingStart'
  | 'bufferingEnd'
  | 'progress'
  | 'seekComplete'
  | 'ended'
  | 'error'
  | 'fullscreenChange'
  | 'pipChange'
  | 'audioFocusChange'
  | 'appLifecycleChange'
  | 'trackChange'
  | 'qualityChange'
  | 'telemetry';
```

Required payload contracts:

```ts
export interface PlayerSnapshot {
  sessionId: string;
  state: PlaybackState;
  currentTimeMs: number;
  durationMs: number;
  bufferedPositionMs: number;
  playbackRate: number;
  muted: boolean;
  volume: number;
  sourceUrl?: string;
  selectedSubtitleTrackId?: string | null;
  selectedAudioTrackId?: string | null;
  surfaceMode: PlayerSurfaceMode;
  isInPiP: boolean;
  isFullscreen: boolean;
  snapshotTimestampMs: number;
}

export interface PlayerReadyPayload {
  sessionId: string;
  durationMs: number;
  width?: number;
  height?: number;
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  startupMetrics?: StartupMetrics;
}

export interface PlayerProgressPayload {
  sessionId: string;
  currentTimeMs: number;
  durationMs: number;
  bufferedPositionMs: number;
  playbackRate: number;
  wallClockTs: number;
}

export interface PlayerErrorPayload {
  sessionId: string;
  code: NativePlayerErrorCode;
  message: string;
  fatal: boolean;
  recoverable: boolean;
  httpStatus?: number;
  sourceStage?: 'initialize' | 'attach-surface' | 'set-source' | 'playback';
  platformDetail?: string;
}

export interface PlayerTelemetryPayload {
  sessionId: string;
  metric: TelemetryMetricName;
  valueMs?: number;
  valueCount?: number;
  tags?: Record<string, string>;
}
```

## 8. Error Taxonomy

Recommended error code enum:

```ts
export type NativePlayerErrorCode =
  | 'INITIALIZATION_FAILED'
  | 'SURFACE_ATTACH_FAILED'
  | 'INVALID_SOURCE'
  | 'SOURCE_AUTH_FAILED'
  | 'SOURCE_FORBIDDEN'
  | 'SOURCE_NOT_FOUND'
  | 'STREAM_UNSUPPORTED'
  | 'DECODER_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_DISCONNECTED'
  | 'DRM_SETUP_FAILED'
  | 'DRM_LICENSE_FAILED'
  | 'AUDIO_FOCUS_INTERRUPTED'
  | 'PLAYBACK_INTERNAL_ERROR'
  | 'UNKNOWN';
```

Mapping rule:

- Native platform-specific errors must be normalized into the shared enum before they are emitted to React.
- Raw platform errors may be attached only through `platformDetail`.

## 9. React Adapter Boundary

`shared-player` should bind to the plugin through an adapter, not by calling Capacitor plugin methods inside screen components.

Recommended adapter contract:

```ts
export interface PlaybackAdapter {
  initializeSession(input: InitializePlaybackSessionInput): Promise<void>;
  attachSurface(input?: AttachPlaybackSurfaceInput): Promise<void>;
  loadSource(input: LoadPlaybackSourceInput): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  setRate(rate: number): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  setVolume(volume: number): Promise<void>;
  selectSubtitleTrack(trackId: string | null): Promise<void>;
  selectAudioTrack(trackId: string | null): Promise<void>;
  getSnapshot(): Promise<PlayerSnapshot>;
  destroy(): Promise<void>;
  subscribe(observer: PlaybackAdapterObserver): Unsubscribe;
}
```

React responsibilities:

- route entry
- state machine orchestration
- entitlement and stream fetching
- UI overlays
- retry buttons
- analytics context

Adapter responsibilities:

- convert shared-player intents into plugin calls
- normalize native events into shared-player events
- protect React from platform-specific inconsistencies

## 10. Android ExoPlayer Lifecycle Rules

Android is the first implementation target.

### Android runtime components

Recommended native classes:

```text
TinyTaleNativePlayerPlugin.kt
PlayerSessionRegistry.kt
TinyTalePlayerSession.kt
TinyTalePlayerViewFactory.kt
TinyTaleTelemetryEmitter.kt
TinyTaleErrorMapper.kt
```

### Android lifecycle rules

1. `initialize`
   - create or reuse `ExoPlayer`
   - register listeners once
   - configure `AudioAttributes`
   - configure `MediaSession` only if enabled in phase scope

2. `attachSurface`
   - create `PlayerView` or bind to a persistent container
   - attach current player instance
   - do not trigger source reload

3. `setSource`
   - build `MediaItem`
   - inject request headers through `DefaultHttpDataSource.Factory`
   - apply subtitles and track metadata
   - apply seek start position when provided
   - prepare player

4. `play`
   - request audio focus if needed
   - set `playWhenReady = true`

5. `pause`
   - set `playWhenReady = false`

6. app background
   - if route policy disallows background audio, pause immediately
   - preserve snapshot for resume

7. route destruction
   - detach surface first
   - release player only when session ends

8. final destroy
   - release `ExoPlayer`
   - release `PlayerView`
   - unregister listeners
   - clear session registry entry

### Android buffering recommendations

- set sensible `LoadControl` values for short-form vertical video
- optimize for fast first frame, not long-form seek workloads
- keep rebuffer avoidance balanced with data cost
- emit buffering telemetry whenever state changes between ready and waiting

## 11. iOS AVPlayer Lifecycle Rules

iOS follows the same contract, but it is deferred until the Android path is accepted.

Recommended native classes:

```text
TinyTaleNativePlayerPlugin.swift
PlayerSessionRegistry.swift
TinyTalePlayerSession.swift
TinyTalePlayerViewController.swift
TinyTaleTelemetryEmitter.swift
TinyTaleErrorMapper.swift
```

### iOS lifecycle rules

1. `initialize`
   - create or reuse `AVPlayer`
   - configure audio session category
   - register KVO and notification observers once

2. `attachSurface`
   - create or bind `AVPlayerLayer` or `AVPlayerViewController`
   - attach existing player instance without resetting playback state

3. `setSource`
   - create `AVURLAsset`
   - inject HTTP headers through asset options if required
   - apply subtitle legible outputs and track selection support
   - replace current item

4. `play`
   - activate audio session when needed
   - call `play()`

5. app background
   - pause unless background audio policy explicitly allows continuation
   - persist snapshot for route resume

6. destroy
   - detach observers before releasing player and current item

## 12. Surface and Layout Rules

The plugin must support two rendering modes:

- `inline`
- `fullscreen`

Rules:

- Native route opens in `inline` shell mode by default.
- Fullscreen is a player state, not a route replacement.
- Orientation handling must be driven by player fullscreen state and platform policy.
- Poster remains React-owned and should sit above the native surface until `ready` plus first frame confirmation.

### Surface Rendering Model

The native player surface must coexist with the Capacitor WebView. The recommended approach is the **WebView Transparency Hole** pattern:

1. The native player view renders **behind** the WebView
2. The WebView background becomes transparent over the player container area
3. React overlays (controls, paywall, loading) render in the WebView **on top** of the native surface
4. `attachSurface` must accept layout coordinates from React: `{ containerId, x, y, width, height }`
5. Layout changes (orientation, resize) must trigger re-synchronization of native surface coordinates

**Android specifics:**

- Use `TextureView` (not `SurfaceView`) to avoid z-ordering conflicts with transparent WebView
- Plugin must manage the `TextureView` in a `FrameLayout` behind the `WebView`

**iOS specifics:**

- Use `AVPlayerLayer` in a `UIView` behind the `WKWebView`
- Set `WKWebView.isOpaque = false` and `backgroundColor = .clear` over the player region

**Coordinate update flow:**

```
React ResizeObserver → measure container → call plugin.updateSurfaceLayout({ x, y, width, height })
```

The plugin API should include an additional method for coordinate updates:

```ts
updateSurfaceLayout(options: { x: number; y: number; width: number; height: number }): Promise<void>;
```

## 13. Source, Auth, and Security Rules

### Cloudflare Stream Auth Mechanism

TinyTale currently uses **JWT-signed tokens as URL query parameters** for Cloudflare Stream authentication. The backend `/api/episodes/:id/stream` returns a `playbackToken` that is embedded in the HLS manifest URL. The actual stream URL format is:

```
https://customer-{subdomain}.cloudflarestream.com/{video_uid}/manifest/video.m3u8?token={jwt}
```

This means:

- the `url` field in `PlayerSource` already contains the auth token
- the `headers` field is primarily for the backend proxy endpoint (`/api/episodes/:id/playback-proxy`), not for CF Stream directly
- CF Stream HLS sub-requests (segments, variant manifests) inherit auth from the master manifest URL
- the native player does NOT need to inject auth headers into segment requests

If the backend migrates to header-based auth in the future, the `headers` field in `PlayerSource` will be used. The field should remain in the API contract.

### Source handling rules

- Signed stream URLs must continue to come from the backend API.
- The plugin must not invent entitlement logic locally.
- Request headers must support short-lived authorization tokens.
- The plugin must not persist signed playback URLs beyond the short warm cache window.
- If DRM is not enabled in phase one, the API contract still reserves the `drm` field for future compatibility.

Security rules:

- Session tokens remain in secure app storage, not in the plugin package.
- The plugin receives only the headers needed for media requests.
- Telemetry must never emit raw authorization headers or token values.

## 14. Progress and Event Cadence

Recommended event cadence:

- `progress` every 500ms while playing on the native side
- adapter-level debounce to 1s for UI state updates if needed
- repository-level debounce to 5s for local persistence
- remote progress sync every 10s to 15s while playing
- immediate sync on pause, app background, episode completion, and route exit

Rules:

- The plugin is an event source, not the source of truth for persistence policy.
- `shared-player` owns when to write locally or sync remotely.
- End-of-episode detection must not rely only on React polling.

## 15. Telemetry Contract

Required metric names:

```ts
export type TelemetryMetricName =
  | 'session_initialize_ms'
  | 'surface_attach_ms'
  | 'source_set_ms'
  | 'first_frame_ms'
  | 'buffering_total_ms'
  | 'rebuffer_count'
  | 'play_to_end_success'
  | 'fatal_error_count'
  | 'recoverable_error_count';
```

Telemetry rules:

- metric timestamps must be monotonic within a session
- first-frame timing starts at `setSource`
- startup dashboard should derive:
  - route entry to shell visible
  - shell visible to source set
  - source set to first frame
  - total route entry to first frame

## 16. Web Compatibility Rule

The existence of this plugin must not change the current Web route contract.

Required architecture rule:

- Web keeps `WebPlayerAdapter`
- Native Shell uses `NativePlayerAdapter`
- both adapters implement the same `PlaybackAdapter` contract from `shared-player`

This is the main protection against accidentally breaking the existing Web player.

### `web.ts` Fallback Stub

The `web.ts` file in `packages/native-player-plugin` must be a **pure no-op stub** that throws `UNSUPPORTED` errors for all methods. It exists only to satisfy Capacitor's platform resolution, not to provide Web playback.

Web playback is handled entirely by `WebPlayerAdapter` in `shared-player`, which uses video.js/hls.js directly. The `WebPlayerAdapter` does NOT go through the native-player-plugin package at all.

```
Web path:    shared-player → WebPlayerAdapter → video.js
Native path: shared-player → NativePlayerAdapter → native-player-plugin → ExoPlayer/AVPlayer
```

`apps/web` must never import `packages/native-player-plugin`.

## 17. Migration Sequence

1. scaffold `packages/native-player-plugin`
2. define `definitions.ts`, event map, and error taxonomy
3. add `NativePlayerAdapter` in `shared-player`
4. wire a mock or no-op native implementation for local JS integration
5. implement Android ExoPlayer path
6. add startup telemetry and error normalization
7. integrate Native Shell playback route
8. validate first-frame and buffering acceptance criteria
9. implement iOS AVPlayer path

## 18. Implementation Checklist

### Plugin package

- create workspace package metadata
- expose typed public API
- expose listener registration helpers including `removeAllListeners`
- implement `updateSurfaceLayout` for coordinate synchronization
- add web fallback stub returning unsupported feature errors (pure no-op, NOT a functional player)

### Shared-player integration

- add `PlaybackAdapter` contract
- add `NativePlayerAdapter`
- keep `WebPlayerAdapter` untouched until contract is stable
- normalize plugin events into session state machine inputs

### Android

- implement session registry
- implement ExoPlayer wrapper
- implement source replacement logic
- implement subtitle and audio track selection
- implement error mapper
- implement telemetry emitter

### iOS

- implement AVPlayer session wrapper
- implement observer cleanup discipline
- implement source replacement logic
- implement subtitle and audio track selection
- implement telemetry emitter

### QA

- test startup under cold app launch
- test route-to-first-frame latency
- test pause/resume and background recovery
- test episode switching
- test locked-content overlay interaction
- test weak-network behavior

## 19. Acceptance Criteria

This spec is successfully implemented only if:

- Native Shell can render playback without WebView video core dependence
- route shell appears before stream fetch completion
- episode switches do not recreate the whole route unnecessarily
- startup telemetry is emitted consistently
- plugin errors are normalized into shared error contracts
- Web route keeps working through the adapter boundary without native coupling

## 20. Follow-Up Document Suggestion

After this spec, the next useful implementation documents should be:

- `docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_ANDROID_IMPLEMENTATION.md`
- `docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_IOS_IMPLEMENTATION.md`
- `docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_TELEMETRY_DASHBOARD.md`
