# TinyTale Native Local Shell Native Player iOS Implementation

## Document Info

- Owner: `Lead Agent`
- Status: `iOS Implementation Plan`
- Platform: `iOS Deferred Follow-Up`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_ANDROID_IMPLEMENTATION.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_ANDROID_IMPLEMENTATION.md)
- Goal: define the iOS AVPlayer implementation path so that iOS can be added after Android without reopening core plugin contracts.

## 1. Objective

This document describes how to extend the Native Player plugin to iOS after the Android contract is proven stable.

The iOS goal is:

- preserve the same shared-player adapter contract
- use AVPlayer as the playback engine
- keep route shell and overlays in React
- align with iOS audio session, background, fullscreen, and PiP behavior

## 2. iOS Delivery Position

iOS is not the first execution target, but it should not become an afterthought.

The iOS implementation must reuse:

- the same TypeScript plugin API
- the same event names
- the same error taxonomy
- the same telemetry contract

Allowed iOS-specific differences:

- native view stack details
- AVAudioSession handling
- PiP enablement constraints
- FairPlay placeholder support if adopted later

## 3. Recommended Directory Layout

```text
packages/native-player-plugin
└─ ios
   └─ Plugin
      ├─ TinyTaleNativePlayerPlugin.swift
      ├─ session
      │  ├─ PlayerSessionRegistry.swift
      │  ├─ TinyTalePlayerSession.swift
      │  └─ TinyTaleSessionSnapshot.swift
      ├─ view
      │  ├─ TinyTalePlayerViewController.swift
      │  ├─ TinyTalePlayerContainerView.swift
      │  └─ SurfaceBindingCoordinator.swift
      ├─ source
      │  ├─ AssetFactory.swift
      │  ├─ HeaderAwareAssetLoader.swift
      │  └─ SubtitleMapper.swift
      ├─ telemetry
      │  ├─ TinyTaleTelemetryEmitter.swift
      │  └─ StartupStopwatch.swift
      ├─ errors
      │  └─ TinyTaleErrorMapper.swift
      └─ lifecycle
         ├─ AppLifecycleObserver.swift
         ├─ AudioSessionCoordinator.swift
         └─ FullscreenCoordinator.swift
```

## 4. Ownership Boundary

| Module | Primary Owner | Deliverable |
|---|---|---|
| Plugin Swift bridge | `Dev Agent` | JS bridge parity with Android |
| AVPlayer session wrapper | `Dev Agent` | state, events, source swap |
| iOS surface and fullscreen | `Dev Agent` | inline/fullscreen transitions |
| Audio session policy | `Dev Agent` | interruption and background behavior |
| Telemetry parity | `Lead Agent` | same metric naming and semantics |
| iOS QA and review | `Audit Agent` | device and lifecycle matrix |

## 5. Core Runtime Chain

```text
React Native Shell Route
→ NativePlayerAdapter
→ Capacitor Plugin Bridge
→ TinyTaleNativePlayerPlugin.swift
→ TinyTalePlayerSession
→ AVPlayer / AVPlayerItem
→ AVPlayerLayer or AVPlayerViewController
```

Rules:

- React still owns route and business UI state.
- Native iOS layer owns playback pipeline, view controller, and audio session.
- Event parity with Android is mandatory even when underlying platform callbacks differ.

## 6. Bridge Entry Responsibilities

`TinyTaleNativePlayerPlugin.swift` must:

- decode plugin calls into typed request objects
- create or reuse a session by `sessionId`
- forward calls to the active session
- normalize native results into spec-compliant event payloads
- avoid route, entitlement, or paywall logic

The bridge must not:

- fetch entitlement data
- hold long-lived auth state
- show native playback-specific modals for business errors

## 7. Session Model

Recommended session responsibilities:

- own the `AVPlayer`
- own the active `AVPlayerItem`
- own observer registration and cleanup
- keep current snapshot and source model
- measure startup timings
- coordinate fullscreen and PiP state

Recommended session fields:

- `sessionId`
- `player`
- `currentItem`
- `currentSource`
- `currentSnapshot`
- `timeObserverToken`
- `statusObservers`
- `startupStopwatch`
- `isSurfaceAttached`
- `allowBackgroundAudio`
- `enablePiP`

Registry rules:

- one session per `sessionId`
- route exit must detach surface and observers safely
- full release must remove observer tokens before deallocation

## 8. AVPlayer Configuration

Recommended baseline:

- `AVPlayer`
- `AVURLAsset`
- `AVPlayerItem`
- `AVPlayerLayer` for inline
- `AVPlayerViewController` only if required by later fullscreen or PiP policy

Configuration rules:

- prefer the smallest stable abstraction that supports inline playback
- avoid rebuilding the player for simple source replacement
- keep startup timing instrumentation attached to the player session

## 9. Asset and Source Construction

`AssetFactory.swift` should support:

- HLS playback URL creation
- subtitle configuration
- future DRM field placeholders

### HTTP Header Injection Clarification

AVFoundation does **NOT** support custom HTTP headers on HLS sub-requests (segment fetches, variant manifest fetches) through standard `AVURLAsset` options.

**Current TinyTale situation:** Cloudflare Stream uses JWT tokens embedded in the master manifest URL as query parameters. HLS sub-requests (segments, variant manifests) inherit auth from the master URL. This means **no custom header injection is needed** for the current CF Stream architecture.

If the backend migrates to header-based auth in the future, the iOS implementation will need an `AVAssetResourceLoaderDelegate` approach:

### AVAssetResourceLoaderDelegate (Reserved for Future)

If header injection becomes required:

1. Register a custom URL scheme (e.g., `tinytale-stream://`) for the asset
2. Implement `AVAssetResourceLoaderDelegate` to intercept requests
3. Rewrite the custom scheme to the real HTTPS URL
4. Inject auth headers into the intercepted request
5. Forward the response back to AVFoundation

This adds significant complexity and should only be implemented when the backend actually requires it. The `headers` field in `PlayerSource` should be preserved in the contract for forward compatibility but will be unused initially on iOS.

### Source replacement rules:

- replacing episode source must not require route recreation
- `startPositionMs` must be applied after item becomes seekable
- ready state must not emit until the player item is actually playable

Recommended flow:

1. receive `setSource`
2. map JS payload into internal asset input
3. create `AVURLAsset`
4. create `AVPlayerItem`
5. replace current item
6. observe item status
7. emit `loading`
8. emit `ready` when playable

## 10. Surface Attachment and Fullscreen

iOS surface rules:

- inline playback should be the default mode
- fullscreen should remain a player presentation state
- exiting fullscreen must preserve session and playback position
- poster visibility remains React-owned until native first frame

Recommended surface approach:

- inline mode uses a container-backed `AVPlayerLayer`
- fullscreen uses a dedicated fullscreen coordinator that reuses the same player
- if PiP is enabled later, it must inherit the same session

### WKWebView ↔ Native Surface Z-Ordering

The native player surface must render behind the WKWebView using the transparency hole pattern.

**Implementation approach:**

1. Plugin creates a `UIView` containing an `AVPlayerLayer`
2. This view is inserted as a sibling of the `WKWebView`, positioned behind it in the view hierarchy
3. `WKWebView.isOpaque` is set to `false` and `backgroundColor` to `.clear` when the player is active
4. React controls and overlays render in the WKWebView on top of the native surface

**Coordinate synchronization:**

- React calls `updateSurfaceLayout({ x, y, width, height })` via the plugin bridge
- Plugin converts CSS points to native points (accounting for device scale factor and safe area insets)
- The player container view frame is updated accordingly

**Fullscreen transition:**

- In fullscreen, the player container view expands to cover the full screen
- The WKWebView remains active, rendering only the overlay control layer
- Exiting fullscreen restores the inline frame

## 11. Audio Session and Interruptions

`AudioSessionCoordinator.swift` should:

- configure `AVAudioSession` category appropriately
- respond to interruption begin and end
- emit normalized `audioFocusChange` events even though iOS does not use Android-style focus terms
- coordinate pause behavior when the app backgrounds and background audio is disallowed

Rules:

- background pause policy must remain route-driven through session configuration
- phone call and interruption handling must not lose progress state
- resume behavior after interruption must be explicit, not accidental

## 12. App Lifecycle Handling

`AppLifecycleObserver.swift` should:

- observe foreground and background transitions
- trigger a progress snapshot on background
- pause the player when required by policy
- restore inline view state on foreground when route is still active

Lifecycle rules:

- background is not destroy
- destroy must remove player item observers
- PiP transitions must not be mistaken for route loss

## 13. Event Mapping

iOS must map AVPlayer and item status signals into the same shared event contract used on Android.

Mapping baseline:

- item status ready to play → `ready`
- playback likely to keep up false during active playback → `bufferingStart`
- playback likely to keep up true after buffering → `bufferingEnd`
- periodic time observer tick → `progress`
- end notification → `ended`
- asset or item error → `error`

Rules:

- duplicate state emissions should be coalesced
- first-frame approximation must remain consistent with telemetry spec
- event names must stay identical to Android output

## 14. Telemetry Implementation

iOS must emit the same metric names defined in the plugin spec.

Required measurements:

- session initialize time
- surface attach time
- source set time
- first frame time
- total buffering duration
- rebuffer count
- fatal and recoverable error counts

iOS-specific rule:

- any differences in how AVFoundation exposes first rendered frame must be normalized into the same semantic definition used on Android, even if implementation technique differs.

## 15. Error Mapping

`TinyTaleErrorMapper.swift` should normalize:

- asset load failures
- authorization failures
- unsupported stream failures
- network unavailability
- playback item failure
- decoder or rendering failures where exposed

Rules:

- use shared error enum from the plugin spec
- redact low-level platform details before emitting to JS
- distinguish fatal and recoverable conditions

## 16. Build and Packaging Requirements

Build rules:

- the iOS plugin target must remain within the workspace package
- Capacitor iOS integration must consume the same JS package exports as Android
- deployment target must match the Native Shell baseline

Dependency rules:

- prefer system frameworks only where possible
- avoid unnecessary third-party iOS player wrappers
- keep the implementation close to AVFoundation primitives

## 17. QA Matrix

Minimum iOS QA scenarios:

- cold app launch to playback
- route re-entry
- background and foreground
- interruption handling
- fullscreen enter and exit
- subtitle toggle
- weak network throttling
- expired signed URL recovery
- episode switching within the same session

Device baseline:

- recent iPhone
- older supported iPhone
- at least one device or simulator path validating orientation and fullscreen behavior

## 18. Delivery Sequence

1. finalize plugin TS contract from Android learnings
2. scaffold Swift plugin structure
3. implement session registry and AVPlayer wrapper
4. implement source replacement and observer cleanup
5. implement inline and fullscreen surface coordination
6. implement audio session and lifecycle handling
7. wire telemetry and error mapping
8. connect to `NativePlayerAdapter`
9. run iOS QA matrix

## 19. Acceptance Criteria

iOS implementation is complete only if:

- it uses the same plugin API as Android
- route shell remains React-owned and renders before playback readiness
- playback session survives source replacement and fullscreen transitions
- app lifecycle handling is stable
- error and telemetry outputs match the shared contract

## 20. Follow-Up Work

After iOS reaches acceptance:

- validate cross-platform event parity
- decide whether PiP is enabled in the same release or a follow-up phase
- evaluate whether FairPlay support is needed in a later security phase
