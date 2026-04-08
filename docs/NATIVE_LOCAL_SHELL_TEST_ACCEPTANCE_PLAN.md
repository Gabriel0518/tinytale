# TinyTale Native Local Shell Test and Acceptance Plan

## Document Info

- Owner: `Audit Agent`
- Status: `Verification Blueprint`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md)
  - [NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md)
  - [NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md)
- Goal: define the validation plan for the full Web + Native refactor.

## 1. Test Objectives

The acceptance plan must verify:

- Web behavior remains stable
- Native cold start no longer depends on remote HTML
- Native shell-first rendering is working
- auth/session restore is correct
- playback path is stable
- offline, push, and deep-link behavior is correct

## 2. Recommended Test Tooling

| Layer | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | shared packages (`packages/*`), pure functions, state machines |
| Component tests | Testing Library + Vitest | shared-ui components, React hooks |
| Integration tests | Vitest | API client, auth bootstrap, storage adapters |
| E2E Web | Playwright | Web app route regression, SSR validation |
| E2E Native | Manual device checklist | Android cold start, playback, deep links |
| Import boundary | eslint-plugin-boundaries or custom script | enforce package dependency rules |
| Type checking | tsc --noEmit via Turborepo | all packages and apps |

Notes:

- Vitest is preferred over Jest because the Native Shell uses Vite
- Playwright is preferred for Web E2E because it supports modern browsers and SSR testing
- Native E2E automation (Detox/Appium) is deferred — manual device testing is sufficient for initial phases
- import boundary checks should run in CI to prevent cross-app imports

## 3. Test Layers

### 2.1 Static Validation

- package boundary checks
- TS build checks
- lint checks
- import cycle checks

### 2.2 Unit Tests

- storage adapters
- auth repositories
- API request context
- playback state machine
- route builders

### 2.3 Integration Tests

- Web app builds against shared packages
- Native shell boots against shared packages
- auth bootstrap path
- route shell path
- playback bootstrap path

### 2.4 Manual Device Validation

- Android cold start
- app relaunch
- offline startup
- auth restore
- drama detail
- playback
- push wake-up
- deep link entry

## 4. Acceptance Matrix

| Area | Must Pass |
|---|---|
| Web SSR build | yes |
| Web route regression | yes |
| Native local-shell startup | yes |
| No remote HTML startup dependency | yes |
| Session restore | yes |
| Auth flows | yes |
| Home/browse shell-first rendering | yes |
| Playback route stability | yes |
| Offline shell rendering | yes |
| Push/deep-link route mapping | yes |

## 5. Web Regression Checklist

- homepage renders
- browse renders
- drama detail renders
- playback page renders
- auth pages render
- user center renders
- admin pages render
- help/privacy/terms/cookies render
- metadata generation still works
- SSR locale behavior remains intact

## 6. Native Startup Checklist

- app starts from local package in production
- no remote HTML fetch is required for first visual frame
- no black frame between native splash and local shell
- local shell appears consistently
- local shell does not wait for user bootstrap

## 7. Auth Acceptance Checklist

- guest startup opens shell
- login succeeds
- restart restores session
- expired session degrades safely
- logout clears secure tokens
- user center routes remain accessible in correct auth state

## 8. Playback Acceptance Checklist

- drama detail route works
- play route works
- player shell appears immediately
- poster/skeleton appears before stream
- entitlement and lock state behave correctly
- resume works
- progress sync works
- leaving and returning preserves expected state

## 9. Offline and Weak Network Checklist

- offline startup opens shell
- cached home data displays if present
- browse fallback displays if present
- uncached routes show local fallback UI
- reconnect refreshes stale surfaces safely

## 10. Push and Deep Link Checklist

- app link opens correct route
- custom scheme opens correct route
- push payload opens correct route
- cold-launch from push restores intended route
- resumed app from push does not duplicate route stack

## 11. Route Mapping Verification

Web URLs and Native routes use different path structures in some cases. This must be verified explicitly.

Verification matrix:

| Source | Input URL | Expected Native Route | Verified |
|---|---|---|---|
| deep link | `https://tinytale.top/drama/123/play/456` | `/play/123/456` | |
| deep link | `https://tinytale.top/browse` | `/browse` | |
| deep link | `https://tinytale.top/category/romance` | `/category/romance` | |
| deep link | `https://tinytale.top/rankings` | `/rankings` | |
| push payload | `{"route": "/drama/123"}` | `/drama/123` | |
| push payload | `{"route": "/user/notifications"}` | `/user/notifications` | |
| web-only link | `https://tinytale.top/about` | open in-app browser | |
| web-only link | `https://tinytale.top/creator/foo/dashboard` | open in-app browser | |
| custom scheme | `top.tinytale.app://drama/123` | `/drama/123` | |

Rules:

- all deep link patterns from `AndroidManifest.xml` must have corresponding route mappings
- web-only routes must never crash the Native router — they must fall back to in-app browser
- push payloads with unknown routes must open home, not crash

## 12. Release Gate Checklist

Before release:

- all packages build
- Web build passes
- Native build passes
- production Capacitor config has no `server.url`
- smoke tests pass on device
- regression report is written
- route mapping verification table is complete

## 13. Required Test Reports

Create and maintain:

- `docs/migration/phase-0-test-report.md`
- `docs/migration/phase-1-test-report.md`
- `docs/migration/phase-2-test-report.md`
- `docs/migration/phase-3-test-report.md`
- `docs/migration/phase-4-test-report.md`
- `docs/migration/phase-5-test-report.md`
- `docs/migration/phase-6-test-report.md`
- `docs/migration/phase-7-test-report.md`
- `docs/migration/phase-8-test-report.md`

## 14. Exit Criteria

The full refactor is accepted only if:

- Web production experience is preserved
- Native startup becomes local-package based
- core user journeys work on device
- playback is stable
- offline and deep-link behaviors are verified
- all migration reports are completed

