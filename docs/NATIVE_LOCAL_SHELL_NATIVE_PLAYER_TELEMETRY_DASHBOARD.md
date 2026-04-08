# TinyTale Native Local Shell Native Player Telemetry Dashboard

## Document Info

- Owner: `Lead Agent`
- Status: `Telemetry and Observability Spec`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_STRATEGY.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_PLUGIN_SPEC.md)
  - [NATIVE_LOCAL_SHELL_NATIVE_PLAYER_ANDROID_IMPLEMENTATION.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_NATIVE_PLAYER_ANDROID_IMPLEMENTATION.md)
- Goal: define the telemetry events, metrics, dashboard views, thresholds, and rollout validation rules needed to prove the Native Player is actually faster and more stable than the current app-side WebView player path.

## 1. Why This Document Exists

The Native Player migration must not be judged by feel alone.

This program needs measurable answers to:

- did local shell startup get faster
- did route-to-first-frame get faster
- did buffering get lower
- did mid-stream failures go down
- did episode switching get smoother
- did regressions appear on certain devices or networks

This document defines how those answers are measured.

## 2. Telemetry Goals

Primary telemetry goals:

- prove startup speed improvement
- prove playback stability improvement
- detect regressions by platform, app version, device class, and network quality
- support phased rollout and rollback decisions

Secondary goals:

- identify entitlement or stream API bottlenecks that still block first frame
- compare Android native player against historical app WebView playback
- establish baseline before iOS rollout

## 3. Telemetry Architecture

### Progress Events vs Telemetry Events

These are two distinct data streams that must not be confused:

**Progress events** (`progress` from native plugin):
- high-frequency state updates (every 500ms while playing)
- consumed by React for UI state (progress bar, current time display)
- debounced to 1s at adapter level for React state updates
- debounced to 5s for local persistence, 10-15s for remote sync
- NOT sent to analytics — they would overwhelm any analytics pipeline

**Telemetry events** (the canonical markers defined in this document):
- discrete lifecycle events (route entered, first frame, error, ended)
- low-frequency, one per state transition
- sent to analytics transport
- used for dashboards, comparisons, and rollout decisions

The native plugin emits both streams. `shared-player` is responsible for routing progress events to UI state and telemetry events to analytics.

### Telemetry flow

Recommended telemetry flow:

```text
React Route
├─ route timing markers
├─ entitlement timing markers
└─ adapter session markers
       ↓
Native Player Plugin
├─ startup timings
├─ buffering events
├─ error events
└─ completion events
       ↓
shared-player telemetry mapper
       ↓
app analytics transport
       ↓
analytics store / dashboard
```

Rules:

- timing boundaries must be defined once and reused consistently
- JS-side and native-side metrics must share a common `sessionId`
- analytics transport must redact auth-sensitive data

## 4. Session Identity Rules

Each playback session must include:

- `session_id`
- `user_id` or anonymous actor id if available
- `drama_id`
- `episode_id`
- `platform`
- `app_version`
- `player_adapter`
- `surface_mode`

Session rules:

- one route entry creates one logical playback session
- episode switching within the same route may create a new content session marker, but must preserve the parent route session link
- retries after recoverable error should keep correlation identifiers

## 5. Event Taxonomy

Required top-level event names:

- `playback_route_entered`
- `playback_shell_visible`
- `playback_entitlement_request_started`
- `playback_entitlement_request_finished`
- `playback_stream_request_started`
- `playback_stream_request_finished`
- `player_session_initialized`
- `player_surface_attached`
- `player_source_set`
- `player_ready`
- `player_first_frame`
- `player_buffering_started`
- `player_buffering_ended`
- `player_error`
- `player_episode_completed`
- `player_route_exited`

Optional but recommended:

- `player_fullscreen_entered`
- `player_fullscreen_exited`
- `player_pip_entered`
- `player_pip_exited`
- `player_quality_changed`
- `player_subtitle_changed`

## 6. Canonical Timing Metrics

The following metrics must be derivable in every eligible session:

- route entry to shell visible
- shell visible to entitlement start
- shell visible to stream start
- entitlement start to entitlement finish
- stream start to stream finish
- source set to ready
- source set to first frame
- route entry to first frame
- total buffering duration per session
- rebuffer count per session
- time from episode end to next-episode route ready if auto-advance exists

Canonical formulas:

- `route_to_shell_ms = playback_shell_visible - playback_route_entered`
- `route_to_first_frame_ms = player_first_frame - playback_route_entered`
- `source_to_first_frame_ms = player_first_frame - player_source_set`
- `entitlement_latency_ms = playback_entitlement_request_finished - playback_entitlement_request_started`
- `stream_latency_ms = playback_stream_request_finished - playback_stream_request_started`

## 7. Stability Metrics

Required stability metrics:

- fatal error count
- recoverable error count
- startup failure rate
- mid-stream failure rate
- completion rate
- pause and resume success rate
- expired signed URL recovery success rate

Definitions:

- startup failure: session exits without first frame after source set
- mid-stream failure: fatal error after first frame but before completion
- completion: playback reaches ended state or completion threshold

## 8. Dimension Model

Every dashboard query should support slicing by:

- platform
- app version
- device model
- device memory tier
- OS version
- network type
- country or region if available
- drama id
- episode id
- adapter type
- surface mode

Recommended additional tags:

- `is_cold_launch`
- `is_warm_launch`
- `was_prefetch_hit`
- `was_stream_retry_used`
- `was_entitlement_cached`

## 9. Dashboard Views

Minimum dashboard tabs:

### Startup

- median `route_to_first_frame_ms`
- p75 `route_to_first_frame_ms`
- p95 `route_to_first_frame_ms`
- median `source_to_first_frame_ms`
- breakdown by app version and device class

### Buffering

- total buffering duration
- rebuffer count distribution
- sessions with no rebuffer
- comparison by network type

### Reliability

- startup failure rate
- mid-stream failure rate
- fatal vs recoverable error ratio
- top normalized error codes

### Engagement

- completion rate
- average watched duration
- episode switch success rate
- auto-next readiness if applicable

### Rollout Comparison

- native player cohort vs legacy app WebView cohort
- Android version comparison
- pre-optimization vs post-optimization release comparison

## 10. Thresholds and Targets

These targets should be treated as launch gates, not just aspirational metrics.

Android first-cut targets:

- median `route_to_first_frame_ms` improves by at least 25% against legacy app path
- p95 `route_to_first_frame_ms` improves materially and does not regress
- startup failure rate does not exceed legacy baseline
- fatal mid-stream error rate is lower than legacy baseline
- sessions with zero rebuffer do not decline

If exact historical baseline is missing:

- establish a 3 to 7 day legacy measurement window before rollout
- use that window as the comparison baseline

## 11. Event Payload Requirements

Every telemetry event should contain:

- `event_name`
- `timestamp_ms`
- `session_id`
- `route_session_id`
- `drama_id`
- `episode_id`
- `platform`
- `app_version`
- `player_adapter`

Error events must also contain:

- `error_code`
- `fatal`
- `recoverable`
- `source_stage`

Buffering events should contain:

- `buffering_reason` if inferable
- `buffered_position_ms`
- `current_time_ms`

## 12. Instrumentation Ownership

| Layer | Owner | Responsibilities |
|---|---|---|
| React route | `Dev Agent` | route and shell timings |
| shared-player | `Lead Agent` | canonical metric mapping |
| Native plugin | `Dev Agent` | first-frame, buffering, error timings |
| Analytics schema | `Lead Agent` | event names and fields |
| Validation dashboard | `Audit Agent` | rollout checks and anomaly tracking |

## 13. Rollout Monitoring Plan

Recommended rollout sequence:

1. record legacy app-side playback baseline
2. ship internal Android native-player build
3. compare startup and failure metrics against baseline
4. expand to broader Android test cohort
5. freeze iOS scope until Android metrics are stable

Rollback triggers:

- startup failure rate materially worse than baseline
- route-to-first-frame p95 materially worse than baseline
- fatal playback errors spike on a major device family
- signed URL or stream auth failures become systemic

## 14. QA Dashboard Checklist

Audit should validate:

- metrics are emitted on cold start
- metrics are emitted on warm start
- first-frame timing exists for successful sessions
- startup failure sessions are countable
- buffering sessions emit both start and end
- error sessions include normalized error codes
- session and route correlation ids are present

## 15. Data Quality Rules

Telemetry is only trustworthy if these rules hold:

- no duplicate session ids across simultaneous sessions
- first-frame timestamp must not precede source set timestamp
- buffering end must not exist without buffering start
- `route_to_first_frame_ms` must be non-negative
- redacted fields must never contain raw auth headers or signed URL secrets

Data quality alerts should be added for:

- missing `session_id`
- missing `episode_id`
- impossible time ordering
- excessive null error codes

## 16. Suggested Analytics Tables or Streams

Recommended logical datasets:

- `playback_sessions`
- `playback_events`
- `playback_errors`
- `playback_buffering_intervals`
- `playback_rollout_cohorts`

The exact storage system can vary, but the logical model should stay stable.

## 17. Recommended Analytics Backend

The project currently has no dedicated analytics infrastructure. A decision is required before telemetry implementation begins.

### Recommended options (in order of preference for TinyTale's scale):

**Option A: Custom backend endpoint → MongoDB (Recommended for Phase 1)**

- add a `/api/telemetry/playback` endpoint to the existing Express API
- store events in a `playback_telemetry` MongoDB collection
- query and dashboard via the existing admin system or Chart.js
- pros: no new vendor, full data ownership, reuses existing infra
- cons: requires building aggregation queries, no pre-built dashboards

**Option B: Firebase Analytics**

- free tier supports the initial scale
- good mobile SDK integration via Capacitor
- limited custom event dimensions (25 parameters per event)
- cons: vendor lock-in, limited ad-hoc querying without BigQuery export

**Option C: Mixpanel / Amplitude**

- rich dashboards and funnel analysis out of the box
- free tiers may be sufficient initially
- cons: cost at scale, data leaves the platform

### Recommendation

Start with **Option A** (custom backend) for telemetry data collection. This keeps the data in-house and avoids adding a vendor dependency during the refactor. Build minimal dashboard views in the admin panel. Migrate to a dedicated analytics platform later if query complexity or dashboard needs outgrow the custom solution.

### Pipeline Latency Targets

- telemetry event from native plugin → analytics store: < 30 seconds
- dashboard refresh interval: 5 minutes for real-time views, 1 hour for aggregate views
- data quality alerts (missing fields, impossible timestamps): within 15 minutes

## 18. Release Comparison Rules

Every major player release should produce a comparison report covering:

- median and p95 startup
- failure rate delta
- buffering delta
- top device regressions
- top error codes

Required comparison axes:

- old app player vs native player
- previous app version vs current app version
- Wi-Fi vs cellular
- high-memory vs low-memory devices

## 19. Acceptance Criteria

Telemetry work is complete only if:

- player startup and stability can be measured per session
- dashboards can compare native and legacy cohorts
- rollout and rollback decisions can be made from telemetry alone
- data quality validation catches broken instrumentation quickly

## 20. Follow-Up Work

After the dashboard spec is implemented:

- build a release checklist that includes telemetry gate review
- add iOS parity views when AVPlayer rollout begins
- add episode-level optimization loops driven by real startup and buffering data
