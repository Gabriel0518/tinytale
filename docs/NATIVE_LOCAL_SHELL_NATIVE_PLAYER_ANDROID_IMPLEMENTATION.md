# TinyTale Native Local Shell Native Player Android Implementation

## Document Info

- Owner: `Lead Agent`
- Status: `Android Implementation Plan`
- Platform: `Android First`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md)
- Goal: define the Android ExoPlayer implementation plan, module layout, lifecycle rules, integration checklist, and acceptance bar for the Native Shell player.

## 1. Objective

This document turns the plugin spec into an Android execution plan.

> **Naming Note**: Throughout this document, "ExoPlayer" refers to the **AndroidX Media3 ExoPlayer module** (`androidx.media3:media3-exoplayer`). The standalone `com.google.android.exoplayer2` library is deprecated. All import paths should use `androidx.media3.exoplayer.*`, not the legacy namespace.

This document turns the plugin spec into an Android execution plan.

The Android path is the first production target for the Native Shell player because:

- the current startup problem was observed on Android devices first
- Android WebView playback variance is higher than native ExoPlayer variance
- Android short-form playback benefits significantly from better startup and buffering control

The Android goal is:

- local route shell first
- ExoPlayer-backed playback core second
- shared-player state machine on top
- telemetry visible from the first implementation cut

## 2. Android Scope

Phase-in scope for Android implementation:

- ExoPlayer-based HLS playback
- route-local inline playback surface
- fullscreen playback
- pause/resume and app lifecycle handling
- startup telemetry
- subtitle track selection
- audio track selection where stream metadata supports it
- progress and buffer events for shared-player

Out of initial Android scope:

- offline full-download playback
- DRM rollout unless backend contract is ready
- media notification controls beyond basic session wiring
- casting
- background audio continuation for non-approved routes

## 3. Recommended Directory Layout

```text
packages/native-player-plugin
├─ src
│  ├─ index.ts
│  ├─ definitions.ts
│  ├─ events.ts
│  ├─ errors.ts
│  └─ web.ts
└─ android
   └─ src/main
      ├─ AndroidManifest.xml
      └─ java/com/tinytale/player
         ├─ TinyTaleNativePlayerPlugin.kt
         ├─ session
         │  ├─ PlayerSessionRegistry.kt
         │  ├─ TinyTalePlayerSession.kt
         │  └─ TinyTaleSessionSnapshot.kt
         ├─ view
         │  ├─ TinyTalePlayerViewFactory.kt
         │  ├─ TinyTalePlayerContainer.kt
         │  └─ SurfaceBindingCoordinator.kt
         ├─ source
         │  ├─ MediaSourceFactory.kt
         │  ├─ RequestHeaderProvider.kt
         │  └─ SubtitleMapper.kt
         ├─ telemetry
         │  ├─ TinyTaleTelemetryEmitter.kt
         │  └─ StartupStopwatch.kt
         ├─ errors
         │  └─ TinyTaleErrorMapper.kt
         └─ lifecycle
            ├─ AppLifecycleObserver.kt
            ├─ AudioFocusCoordinator.kt
            └─ FullscreenCoordinator.kt
```

## 4. Android Implementation Owners

| Module | Primary Owner | Deliverable |
|---|---|---|
| Plugin bridge entry | `Dev Agent` | `TinyTaleNativePlayerPlugin.kt` |
| Session registry | `Dev Agent` | stable session reuse and cleanup |
| ExoPlayer wrapper | `Dev Agent` | source lifecycle, listeners, state mapping |
| Surface container | `Dev Agent` | inline/fullscreen attach and detach |
| Audio focus and lifecycle | `Dev Agent` | focus handling and background policy |
| Telemetry emitter | `Lead Agent` | metric names and payload discipline |
| Android QA matrix | `Audit Agent` | device and network coverage |

## 5. Core Runtime Architecture

Recommended Android runtime chain:

```text
React Native Shell Route
→ NativePlayerAdapter
→ Capacitor Plugin Bridge
→ TinyTaleNativePlayerPlugin
→ TinyTalePlayerSession
→ ExoPlayer
→ PlayerView / Surface
```

Rules:

- React route must remain the owner of route state and overlays.
- Android native layer must remain the owner of media playback mechanics.
- A single playback route should correspond to one session id.
- Episode switching should reuse the player session whenever possible.

## 6. Bridge Entry Responsibilities

`TinyTaleNativePlayerPlugin.kt` must:

- validate incoming parameters
- resolve or create the current session
- dispatch work to the correct session instance
- map native results into JS-safe payloads
- emit deterministic event names from the spec
- never embed route-specific business logic

The bridge must not:

- call backend APIs directly
- store auth tokens itself
- decide entitlement
- store long-lived playback URLs

## 7. Session Model

Recommended session responsibilities:

- hold the `ExoPlayer` instance
- hold active source metadata
- hold playback snapshot
- own listener registration
- track startup timings
- expose attach and detach methods for surfaces

Recommended session fields:

- `sessionId`
- `player`
- `currentSource`
- `currentSnapshot`
- `isReleased`
- `isSurfaceAttached`
- `startupStopwatch`
- `lastKnownTracks`
- `allowBackgroundAudio`
- `enablePiP`

Session registry rules:

- registry key is `sessionId`
- only one active session per `sessionId`
- stale sessions must be released aggressively
- route exit should not leak players or surfaces

## 8. ExoPlayer Configuration

Recommended ExoPlayer baseline:

- `ExoPlayer.Builder(context)`
- custom `LoadControl` tuned for short-form startup
- `DefaultTrackSelector`
- `DefaultHttpDataSource.Factory`
- listener binding for state, error, tracks, timeline, and video size

Recommended tuning direction:

- optimize quicker first frame over large prebuffer
- keep enough buffer to reduce mid-stream rebuffering on mobile network
- keep memory profile safe for feed-to-play transitions

Configuration checklist:

- set audio attributes for media playback
- handle `playWhenReady`
- expose `isPlaying` changes
- track buffered position and duration
- emit first-frame timing once video rendering starts

## 9. Media Source Construction

`MediaSourceFactory.kt` should support:

- HLS source construction
- subtitle sidecar tracks
- optional DRM fields reserved by contract
- header injection for signed URLs

Source rules:

- signed headers come from JS bridge input only
- do not persist headers to disk
- source replacement must not require session recreation
- start position must be applied before prepare

Recommended flow:

1. receive `setSource`
2. map JS payload into internal source model
3. build `MediaItem`
4. attach subtitle configurations
5. seek to `startPositionMs` if provided
6. `prepare()`
7. emit `loading`
8. emit `ready` on state transition

## 10. Surface Attachment Model

Surface handling is critical because React route transitions and overlays must remain responsive.

Recommended approach:

- keep player session separate from view instance
- allow `PlayerView` recreation without player recreation
- support inline surface first
- support fullscreen handoff without source reload

Attach rules:

- `attachSurface` must be safe before `setSource`
- `attachSurface` must be safe after `setSource`
- detaching a surface must not reset playback state by itself

Fullscreen rules:

- fullscreen is a native display state change, not a new route
- orientation lock may be applied only while in fullscreen
- exiting fullscreen must restore the inline shell without session loss

### WebView ↔ Native Surface Z-Ordering

The native player surface must render behind the Capacitor WebView using the transparency hole pattern.

**Implementation approach:**

1. Plugin creates a `TextureView` (NOT `SurfaceView`) wrapped in a `FrameLayout`
2. This `FrameLayout` is inserted as a sibling of the `WebView` in the activity's view hierarchy, positioned **behind** the `WebView`
3. The `WebView` background is set to `Color.TRANSPARENT` — the current `MainActivity.java` already sets `#141414`, which must be made conditionally transparent when the player is active
4. React controls, overlays, and paywall render in the WebView on top of the native surface

**Why `TextureView` not `SurfaceView`:**

- `SurfaceView` uses a separate window with independent z-ordering that conflicts with `WebView` transparency
- `TextureView` renders within the standard view hierarchy, supporting proper layering with a transparent `WebView`
- `TextureView` has slightly higher GPU cost but is the only viable option for this pattern

**Coordinate synchronization:**

- React calls `updateSurfaceLayout({ x, y, width, height })` when the player container mounts or resizes
- Plugin converts CSS/DIP coordinates to native pixel coordinates using the device pixel ratio
- The `FrameLayout` containing the `TextureView` is repositioned accordingly
- A `ResizeObserver` on the React side triggers re-synchronization on layout changes

**Fullscreen transition:**

- In fullscreen, the `TextureView` container expands to fill the screen
- The `WebView` remains active but only renders the control overlay layer
- Exiting fullscreen restores the inline coordinates

## 11. Audio Focus and App Lifecycle

`AudioFocusCoordinator.kt` should:

- request focus before active playback
- pause on focus loss when policy requires it
- emit `audioFocusChange` events to JS

`AppLifecycleObserver.kt` should:

- observe pause/resume transitions
- pause playback on background when route policy disallows continuation
- trigger a final progress event on background
- retain enough state for immediate resume on foreground

Lifecycle rules:

- app background is not the same as route destroy
- route destroy must detach and release based on session policy
- fatal player errors must not leave zombie audio focus or view references

## 12. Event Mapping

Android must normalize ExoPlayer events into the shared contract.

Mapping baseline:

- `onPlaybackStateChanged(STATE_BUFFERING)` → `bufferingStart`
- `onPlaybackStateChanged(STATE_READY)` after buffering → `bufferingEnd`
- first ready after `setSource` → `ready`
- `onIsPlayingChanged(true)` → `playing`
- `onIsPlayingChanged(false)` with paused state → `paused`
- `onPlaybackStateChanged(STATE_ENDED)` → `ended`
- `onPlayerError(...)` → `error`
- periodic ticker while active → `progress`

Rules:

- event ordering must be deterministic enough for the state machine
- duplicate noisy native events must be coalesced when necessary
- recoverable errors and fatal errors must be differentiated

## 13. Telemetry Implementation

Android must emit telemetry from day one.

Required Android measurements:

- `initialize` call to session created
- `attachSurface` call to surface ready
- `setSource` call to first `STATE_READY`
- `setSource` call to first rendered frame
- total buffering duration
- rebuffer count
- fatal and recoverable error counts

Recommended emitter behavior:

- metrics buffered in memory per session
- emit through plugin event channel
- never include signed URL or auth header data
- include tags such as:
  - `network_type`
  - `episode_id`
  - `drama_id`
  - `surface_mode`
  - `app_version`

## 14. Error Mapping

`TinyTaleErrorMapper.kt` should normalize:

- network failures
- unsupported manifest or codec failures
- decoder initialization failures
- source auth failures
- timeout failures
- unknown internal playback failures

Examples:

- HTTP 401 or 403 on media fetch → `SOURCE_AUTH_FAILED` or `SOURCE_FORBIDDEN`
- parser or unsupported format errors → `STREAM_UNSUPPORTED`
- decoder init crash → `DECODER_ERROR`
- network unavailable → `NETWORK_DISCONNECTED`

Error payload rules:

- include `fatal`
- include `recoverable`
- include source stage
- include redacted platform detail only

## 15. React Integration Contract

Android implementation assumes the following React-side behavior:

- playback route enters and renders shell immediately
- poster and overlays remain React-owned
- React subscribes to normalized adapter events
- React handles retry and locked-content overlays
- React decides episode switching and passes a new source into the same adapter

Android native code must therefore avoid:

- showing its own paywall UI
- displaying route-specific error dialogs
- navigating independently

## 16. Android Build and Packaging Requirements

Build requirements:

- plugin package must build with the workspace package manager
- Android package namespace should remain under TinyTale ownership
- native dependencies must be pinned and documented

Recommended dependency scope:

- `androidx.media3:media3-exoplayer:1.5.1`
- `androidx.media3:media3-ui:1.5.1`
- `androidx.media3:media3-exoplayer-hls:1.5.1`
- optional `androidx.media3:media3-session:1.5.1`

Version pinning rule:

- all `media3` dependencies must use the same version to avoid runtime conflicts
- define the version as a single variable in the plugin's `build.gradle.kts`
- update only when compatibility with the Capacitor baseline SDK is verified

Rules:

- do not import experimental dependencies without documented reason
- keep plugin compile and target SDK aligned with Capacitor baseline
- treat ABI and minSdk compatibility as release blockers

## 17. QA Matrix

Minimum Android QA scenarios:

- cold app launch to playback
- warm route re-entry to same episode
- switch from episode A to episode B
- lock and unlock screen during playback
- background and foreground app
- network switch Wi-Fi to 4G/5G
- weak network throttling
- subtitle toggle
- fullscreen enter and exit
- error recovery after expired signed URL

Device coverage baseline:

- Samsung mainstream Android device
- Pixel reference Android device
- low-memory Android device

## 18. Delivery Sequence

1. scaffold Android plugin classes
2. implement session registry and snapshots
3. integrate ExoPlayer wrapper
4. integrate source mapping and headers
5. implement surface attach and fullscreen
6. add lifecycle and audio focus coordinators
7. add telemetry emitter and error mapper
8. connect to `NativePlayerAdapter`
9. run acceptance and device QA

## 19. Acceptance Criteria

Android implementation is complete only if:

- app-side playback no longer depends on WebView media playback
- route shell appears before media is ready
- first frame timing is measurable per session
- episode switching reuses session without route teardown
- fullscreen does not recreate the media source unnecessarily
- background and foreground behavior is stable
- errors are normalized into the shared contract

## 20. Follow-Up Work

After Android reaches acceptance:

- back-test shared-player assumptions against real telemetry
- decide if PiP ships in the first public native player release
- use Android learnings to finalize iOS implementation details
