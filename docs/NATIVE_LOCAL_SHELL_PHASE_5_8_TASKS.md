# TinyTale Native Local Shell Phase 5-8 Task Breakdown

## Document Info

- Owner: `Lead Agent`
- Status: `Execution Blueprint`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md)
- Scope: `Phase 5`, `Phase 6`, `Phase 7`, `Phase 8`
- Goal: complete the Native user flows, playback path, offline and push capabilities, and perform final cleanup of legacy assumptions.

## 1. Phase Goals

> **Execution Order Note**: The Blueprint (Section 19) recommends executing Phase 6 (playback) before Phase 5 (auth/user flows) to prioritize the core content path. However, this document presents Phase 5 first for logical completeness. When executing, follow the Blueprint's recommended order: Phase 6 → Phase 5 → Phase 7 → Phase 8.

### Phase 5 Goal

Complete all core auth and user-center journeys in Native Shell.

### Phase 6 Goal

Complete drama detail and playback flows using the shared playback domain.

### Phase 7 Goal

Add offline fallback, cache strategy, push handling, and deep-link recovery.

### Phase 8 Goal

Remove obsolete legacy coupling and finalize the long-term Web/Native separation.

## 2. Required Result After Phase 5-8

At the end of these phases:

- Native app can authenticate, recover session, and render user state locally
- drama detail and playback are fully app-native shell routes
- playback entitlement, progress, prefetch, and resume work through shared-player
- offline and weak-network behavior are intentional
- push notifications and deep links wake the app into local routes
- no production-critical Native startup path depends on Web-only code

## 3. Phase 5: Auth and User Flows

### 3.1 Native Auth Screens

Implement:

- login
- register
- forgot password
- reset verification

Recommended screen files:

```text
apps/native-shell/src/screens/auth/LoginScreen.tsx
apps/native-shell/src/screens/auth/RegisterScreen.tsx
apps/native-shell/src/screens/auth/ForgotPasswordScreen.tsx
apps/native-shell/src/screens/auth/ResetVerifyScreen.tsx
```

### 3.2 Native User Center Screens

Implement:

- profile
- favorites
- history
- notifications
- purchases
- settings
- coins
- subscription

### 3.3 Required Behaviors

- guest startup must be fast
- authenticated startup must restore local shell first
- remote `me` refresh must not block shell rendering
- logout must clear secure tokens and user-facing cached state correctly
- favorites/history local snapshots must paint before remote sync when possible

### 3.4 Session Recovery

Phase 5 must implement:

- bootstrap session from secure store
- refresh user profile in background
- recover user-specific cached tabs
- handle invalid token gracefully

### 3.5 User Domain Data Priorities

High priority:

- profile summary
- favorites
- history
- notifications

Secondary priority:

- purchases
- coins
- subscription

### 3.6 Payment Flow in Native Shell

The current Web payment uses Stripe Checkout (redirect-based). This does not work inside a local-shell Capacitor WebView.

#### Recommended Approach

Use **Stripe Payment Element** (embedded, no redirect):

1. user selects coin package
2. Native calls API to create PaymentIntent (not Checkout Session)
3. Stripe Elements renders inline payment form
4. payment confirms without redirect
5. webhook confirms and credits coins

#### Required API Changes

The backend must support a `create-payment-intent` endpoint alongside the existing `create-order` (Checkout Session) endpoint. The shared API package should abstract this:

```ts
// shared-api endpoint
createPayment(packageId: string, platform: 'web' | 'native'): Promise<PaymentResult>
```

#### Google Play Billing Evaluation

If distributing through the Play Store, Google may require in-app purchases for digital goods (coins). Before implementing the payment screen:

1. evaluate whether TinyTale's distribution model requires Google Play Billing
2. if required, plan for a Capacitor plugin (e.g., `@capawesome/capacitor-android-billing`)
3. implement server-side receipt validation
4. support dual payment paths: Stripe (web/direct APK) and Play Billing (Play Store)

#### Native Payment Screens

```text
apps/native-shell/src/screens/coins/CoinsScreen.tsx
apps/native-shell/src/screens/coins/PaymentScreen.tsx
apps/native-shell/src/screens/coins/PaymentSuccessScreen.tsx
```

### 3.7 Auth Acceptance

Phase 5 is not complete until:

- login works
- logout works
- app restart restores session
- user center opens from local shell
- stale token failure does not collapse the app shell

## 4. Phase 6: Drama Detail and Playback

### 4.1 Native Drama Detail Screen

Implement:

- drama hero
- episode list
- reviews summary
- favorite state
- related drama shelf

### 4.2 Native Playback Route

Implement local playback route:

- `/play/:dramaId/:episodeId`

This route must mount a local player shell immediately, even when stream info is still loading.

### 4.3 Shared Player Integration

Native playback must use `shared-player` for:

- entitlement checks
- stream info request
- playback progress persistence
- resume playback state
- prefetch
- quality model

### 4.4 Playback Requirements

- route opens without blank page
- player chrome renders immediately
- poster or skeleton shows before stream starts
- playback progress restores locally
- unlock state refresh is incremental
- errors show local error UI, not route collapse

### 4.5 Drama/Playback Acceptance

Phase 6 is not complete until:

- drama detail opens through Native shell
- play route opens through Native shell
- playback can start from valid entitlement
- progress reports and restores
- route resume from recent playback works

## 5. Phase 7: Cache, Offline, Push, Deep Link

### 5.1 Cache Layer Completion

Complete cache repositories for:

- home feed
- browse feed
- categories
- rankings
- favorites
- history
- notifications
- playback progress

### 5.2 Offline Behavior

Implement:

- startup without total collapse when offline
- local shell always loads
- cached surfaces render when available
- friendly offline fallbacks for uncached data

### 5.3 Push Behavior

Implement:

- device registration
- token sync
- local in-app notification mapping
- route target parsing from push payload
- wake into local route

### 5.4 Deep Link Behavior

Support:

- app links
- custom scheme
- push target routes
- restored route after cold launch

### 5.5 Background Resume

Implement:

- app foreground refresh policies
- stale content invalidation
- safe resume from playback and auth flows

### 5.6 Acceptance

Phase 7 is not complete until:

- offline cold start shows shell
- weak network still shows shell and cached surfaces
- push opens local route
- deep link opens local route
- background resume refreshes stale data safely

## 6. Phase 8: Cleanup and Legacy Removal

### 6.1 Remove Legacy Startup Assumptions

Remove or isolate:

- production `server.url` startup
- legacy remote-first launch assumptions
- Native-facing Web-only startup hacks

### 6.2 Web/Native Boundary Cleanup

Rules after cleanup:

- `apps/web` must not depend on Native app code
- `apps/native-shell` must not depend on Web app code
- both depend only on `packages/*`

### 6.3 Import Cleanup

Tasks:

- remove old aliases that point directly into previous root app paths
- remove obsolete compatibility shims
- consolidate exports into package public APIs

### 6.4 Documentation Cleanup

Add or update:

- architecture diagrams
- release runbook
- regression checklist
- ownership map

### 6.5 CI/CD Cleanup

Finalize:

- separate Web and Native release jobs
- package build caching
- package typecheck jobs
- boundary enforcement checks

### 6.6 Acceptance

Phase 8 is complete only if:

- the codebase has a stable long-term shape
- shared package boundaries are enforced
- Native no longer relies on legacy Web startup path
- release process is explicit and repeatable

## 7. Web-Only Route Scope Decision

The following routes are explicitly **web-only** and will not be implemented in Native Shell:

- `/creator-home`
- `/creator/:username` (public profile)
- `/creator/:username/dashboard` and all creator workspace sub-routes
- `/affiliate/*`
- `/ref/*`
- `/about`, `/press`, `/careers`
- `/privacy`, `/terms`, `/cookies`, `/help`

When a user taps a link targeting these routes (e.g., from a push notification or shared URL), the Native Shell should open them in an in-app browser pointing to the Web version, not attempt to render them locally.

Implementation:

- the Native router's deep-link handler must classify incoming URLs as native-route or web-fallback
- web-fallback URLs open via Capacitor Browser plugin
- no Native screen implementation is needed for these routes

## 8. Owner Breakdown

### Lead Agent

- auth/session final contract enforcement
- playback/platform architecture
- cleanup and boundary enforcement

### Product Agent

- user flow acceptance
- push/deep-link route mapping expectations
- account-state edge case definitions

### Design Agent

- user center shell consistency
- player shell polish
- offline and error state UX

### Dev Agent

- screen implementation
- route integration
- push and deep-link implementation
- final cleanup integration

### Audit Agent

- full regression matrix
- auth smoke suite
- playback smoke suite
- offline/push/deep-link verification

## 9. Validation Checklist

### Phase 5

- login/register/reset work
- session restore works
- logout cleanup works
- user center routes work
- coin purchase flow works (embedded payment, no redirect)
- web-only routes open in in-app browser

### Phase 6

- drama detail works
- playback works
- entitlement works
- progress and resume work

### Phase 7

- offline shell works
- cached route fallback works
- push routing works
- deep link routing works

### Phase 8

- legacy startup assumptions removed
- package boundaries clean
- docs complete
- CI stable

## 10. Rollback Points

- Rollback Point 9: auth screens and session restore
- Rollback Point 10: user center core surfaces
- Rollback Point 11: drama detail and playback shell
- Rollback Point 12: offline/push/deep-link
- Rollback Point 13: cleanup and release stabilization

## 11. Exit Criteria

Phase 5-8 is complete only if:

- Native app can handle end-to-end user journeys without remote HTML startup
- playback path is fully functional
- offline and push/deep-link behavior are deliberate and stable
- legacy Web/Native coupling is removed

