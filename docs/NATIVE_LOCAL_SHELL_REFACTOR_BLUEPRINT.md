# TinyTale Native Local Shell Complete Refactor Blueprint

## Document Info

- Owner: `Lead Agent`
- Status: `Draft / Architecture Baseline`
- Scope: `tinytale` frontend repository
- Goal: Replace the current remote-webview startup model with a native local-package app shell, while preserving the existing Web SSR site and admin system.

## 1. Target Architecture

The target is not to keep loading the remote site inside Capacitor.

The target is to split the current single Next.js app into:

- a Web SSR application
- a Native local-shell application
- a shared package layer for business/domain logic

Recommended structure:

```text
/Users/gabriel/tinytale
├─ apps
│  ├─ web
│  │  ├─ src
│  │  │  ├─ app
│  │  │  ├─ components
│  │  │  ├─ hooks
│  │  │  └─ lib
│  │  ├─ next.config.mjs
│  │  ├─ package.json
│  │  └─ public
│  └─ native-shell
│     ├─ src
│     │  ├─ app
│     │  ├─ screens
│     │  ├─ router
│     │  ├─ providers
│     │  ├─ bridges
│     │  └─ bootstrap
│     ├─ public
│     ├─ vite.config.ts
│     ├─ capacitor.config.ts
│     ├─ package.json
│     ├─ android
│     └─ ios
├─ packages
│  ├─ shared-domain
│  ├─ shared-api
│  ├─ shared-auth
│  ├─ shared-storage
│  ├─ shared-i18n
│  ├─ shared-ui
│  ├─ shared-player
│  └─ shared-runtime
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
└─ docs
   ├─ architecture
   ├─ migration
   └─ runbooks
```

### Responsibilities

`apps/web`

- Keep SSR, SEO, public website, admin, marketing, help, policy pages.
- Keep current Next.js server capabilities.

`apps/native-shell`

- Local package startup only.
- Render app shell, skeleton, nav, tabs, player shell locally.
- Fetch remote API data and remote media assets asynchronously.

`packages/*`

- Hold all shared business logic and reusable cross-platform modules.
- Web and Native must consume shared packages instead of importing from each other directly.

### Non-Goals

- No backend API rewrite.
- No `/admin` migration into Native.
- No remote HTML dependency for Native startup.
- No degradation of Web SSR and SEO to accommodate Native.

## 2. Why Current Architecture Must Change

The current repository is still structured as a Web-first Next.js application with a Capacitor wrapper.

Key blockers:

- [capacitor.config.ts](/Users/gabriel/tinytale/capacitor.config.ts) currently supports `server.url`, which leads to remote WebView startup.
- [src/app/layout.tsx](/Users/gabriel/tinytale/src/app/layout.tsx) depends on `headers()`, `cookies()`, and `generateMetadata()`, which are server-side website patterns.
- Many pages use `dynamic = 'force-dynamic'`, which implies server/runtime coupling.
- [src/lib/authContext.tsx](/Users/gabriel/tinytale/src/lib/authContext.tsx) is built around browser storage assumptions.
- [src/lib/api.ts](/Users/gabriel/tinytale/src/lib/api.ts) is still a web-client-centric API layer.
- [public/sw.js](/Users/gabriel/tinytale/public/sw.js) is a PWA caching layer, not a true native local startup strategy.

Conclusion:

- This cannot be solved by a single config switch.
- It requires an entrance architecture split.

## 3. Package Boundaries

Recommended boundaries:

| Package | Responsibility | Allowed Dependencies | Forbidden Dependencies |
|---|---|---|---|
| `shared-domain` | TS types, DTOs, enums, entities, constants | minimal utilities only | React, Capacitor, Next |
| `shared-api` | API client, endpoint SDK, error models, query keys | `shared-domain` | UI layers, Next, Capacitor |
| `shared-storage` | storage abstraction, cache repository, KV adapters | `shared-domain` | page components |
| `shared-auth` | session/token repository, auth services, auth hooks | `shared-api`, `shared-storage`, `shared-domain` | Next SSR internals |
| `shared-i18n` | locale model, dictionaries, path helpers | `shared-domain` | `next/headers` |
| `shared-ui` | pure presentation components, tokens, primitives | `shared-domain`, `shared-i18n` | direct fetching, business orchestration |
| `shared-player` | playback state machine, entitlement, progress, prefetch | `shared-api`, `shared-storage`, `shared-domain` | route/page layer |
| `shared-runtime` | app bootstrap, flags, env schema, platform detection | `shared-domain`, `shared-storage` | business screens |

### Rules

- `shared-ui` must remain presentational.
- `shared-api` must not read from `window`, `document`, or `localStorage`.
- `shared-auth` must define storage interfaces instead of embedding web-only assumptions.
- `apps/web` and `apps/native-shell` may only consume public exports from `packages/*`.

## 4. Current Code Mapping

Recommended migration map:

| Current File | Target | Action |
|---|---|---|
| [src/lib/api.ts](/Users/gabriel/tinytale/src/lib/api.ts) | `packages/shared-api` | Split into `client.ts`, `endpoints/*`, `errors.ts`, `query-keys.ts` |
| [src/lib/authContext.tsx](/Users/gabriel/tinytale/src/lib/authContext.tsx) | `packages/shared-auth` | Split into repository, service, provider, hooks |
| [src/lib/runtime-settings.ts](/Users/gabriel/tinytale/src/lib/runtime-settings.ts) | `packages/shared-runtime` + `shared-storage` | Separate state model from storage adapter |
| [src/lib/view-cache.ts](/Users/gabriel/tinytale/src/lib/view-cache.ts) | `packages/shared-storage` | Convert into generic cache repository |
| [src/lib/playback.ts](/Users/gabriel/tinytale/src/lib/playback.ts) | `packages/shared-player` | Domain extraction |
| [src/lib/playback-prefetch.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch.ts) | `packages/shared-player` | Prefetch service |
| [src/lib/playback-prefetch-enhanced.ts](/Users/gabriel/tinytale/src/lib/playback-prefetch-enhanced.ts) | `packages/shared-player` | Strategy layer |
| [src/lib/playback-progress-cache.ts](/Users/gabriel/tinytale/src/lib/playback-progress-cache.ts) | `packages/shared-player` + `shared-storage` | Progress storage abstraction |
| [src/lib/i18n.ts](/Users/gabriel/tinytale/src/lib/i18n.ts) | `packages/shared-i18n` | Keep locale/path model |
| [src/lib/locale-copy.ts](/Users/gabriel/tinytale/src/lib/locale-copy.ts) | `packages/shared-i18n` | Shared dictionary resolver |
| [src/types](/Users/gabriel/tinytale/src/types) | `packages/shared-domain` | Full migration |
| [src/types/creator.ts](/Users/gabriel/tinytale/src/types/creator.ts) | `packages/shared-domain` | Creator sub-domain |
| [src/components/ui](/Users/gabriel/tinytale/src/components/ui) | `packages/shared-ui` | Migrate pure presentation components |
| [src/components/player](/Users/gabriel/tinytale/src/components/player) | `packages/shared-player` or `shared-ui/player` | Split state from visual layer |
| [src/app/layout.tsx](/Users/gabriel/tinytale/src/app/layout.tsx) | `apps/web` only | Keep as Web-only |
| [src/app/page.tsx](/Users/gabriel/tinytale/src/app/page.tsx) | Web keep, Native rewrite | Do not share app entry |
| [src/app/drama/[id]/play/[episodeId]/page.tsx](/Users/gabriel/tinytale/src/app/drama/[id]/play/[episodeId]/page.tsx) | Web keep, Native rebuild | Reuse shared player domain only |
| [public/sw.js](/Users/gabriel/tinytale/public/sw.js) | `apps/web/public` only | Keep for PWA/web; Native must not rely on it for startup |

## 5. Platform Scope

### iOS Status

iOS is deferred from the initial refactor scope. All phase tasks target Android first. iOS can be added after the Android Native Shell is stable, reusing the same `apps/native-shell` codebase with Capacitor iOS platform support.

When iOS is added later:

- Capacitor iOS platform will consume the same `dist` output
- secure token storage will use iOS Keychain via `SecureStore` adapter
- push registration will use APNs via Firebase
- no separate app project is needed

### Android First

All phase execution, testing, and acceptance criteria in this document set target Android unless explicitly noted otherwise.

## 6. Native Shell Technical Design

Recommended stack for `apps/native-shell`:

- React 18
- Vite
- React Router
- Tailwind CSS
- Capacitor 8
- TanStack Query
- Capacitor Preferences
- SQLite or IndexedDB-grade cache strategy
- Secure token storage
- Existing native bridge capabilities for push, social login, deep link

### Native Runtime Model

1. Android/iOS native splash renders brand assets.
2. Capacitor opens local packaged `dist/index.html`.
3. Local `AppShell` renders immediately:
   - launch overlay
   - top nav
   - bottom tabs
   - home/browse/search skeletons
   - player shell
4. Local repositories restore:
   - session
   - locale
   - runtime settings
   - homepage cache
   - playback progress
5. Remote API loads incrementally:
   - user bootstrap
   - homepage feed
   - favorites/history
   - entitlement
   - stream info

### Native Router Structure

```text
/router
  app-routes.ts
  deep-links.ts
  protected-routes.tsx
  route-names.ts
  route-builders.ts
```

### Native Route Inventory

- `/`
- `/browse`
- `/search`
- `/category/:id`
- `/rankings`
- `/drama/:id`
- `/play/:dramaId/:episodeId`
- `/auth/login`
- `/auth/register`
- `/auth/reset-password`
- `/user/profile`
- `/user/history`
- `/user/favorites`
- `/user/notifications`
- `/user/settings`
- `/user/coins`
- `/user/subscription`

### Web-Only Route Inventory

- `/admin/**`
- `/about`
- `/press`
- `/careers`
- `/privacy`
- `/terms`
- `/cookies`
- `/creator-home`
- `/creator/:username` (public profile)
- `/creator/:username/dashboard` and sub-routes
- `/affiliate/**`
- `/ref/**`
- SEO and public marketing flows

### Web ↔ Native Route Mapping

Deep links and push payloads use Web-format URLs. The Native router must map them.

| Web Path | Native Route | Notes |
|---|---|---|
| `/` | `/` | home |
| `/browse` | `/browse` | same |
| `/search` | `/search` | same |
| `/category/:id` | `/category/:id` | same |
| `/rankings` | `/rankings` | same |
| `/drama/:id` | `/drama/:id` | detail page |
| `/drama/:id/play/:episodeId` | `/play/:dramaId/:episodeId` | path structure differs |
| `/auth/login` | `/auth/login` | same |
| `/user/*` | `/user/*` | same |
| `/creator/*`, `/affiliate/*`, `/about`, `/terms`, etc. | open in-app browser | web-only routes |

## 7. Auth and Storage Refactor

### Auth Package Shape

```text
shared-auth/
  session/
    session-repository.ts
    token-store.ts
    refresh-policy.ts
  hooks/
    use-auth.ts
    use-session.ts
  react/
    auth-provider.tsx
  services/
    bootstrap-user.ts
    login-service.ts
    logout-service.ts
```

### Storage Package Shape

```text
shared-storage/
  interfaces/
    kv-store.ts
    secure-store.ts
    cache-store.ts
  web/
    local-storage-kv.ts
    indexeddb-cache.ts
  native/
    capacitor-preferences-kv.ts
    sqlite-cache.ts
    secure-token-store.ts
```

### Data Categories

Secure data:

- access token
- refresh token
- native session secret

Configuration data:

- locale
- runtime settings
- feature flags

Business cache:

- home feed
- browse feed
- categories
- favorites
- history
- notifications
- playback progress

### Current Patterns That Must Be Removed

- direct `localStorage.getItem('token')`
- direct `localStorage.getItem('user')`
- page-level token management
- page-level session restoration

### Required Startup Behavior

- Native cold start restores secure token store first.
- App shell renders before user bootstrap finishes.
- `me` refresh happens in background.
- Failure must degrade to guest mode, not blank/black state.

## 8. Data Fetching Strategy

Use `TanStack Query + Repository`.

### Query Package Shape

```text
shared-api/
  query/
    query-client.ts
    query-keys.ts
    persist-config.ts
```

### Cache Strategy

| Data | First Source | TTL | Notes |
|---|---|---|---|
| home feed | local cache + remote refresh | 5-15 min | startup-critical |
| category/rankings | local cache + remote refresh | 30-60 min | can display offline |
| user profile | session cache | session | refresh in background |
| favorites/history | local cache + optimistic sync | session | user-facing |
| entitlement | remote + short cache | 1-5 min | avoid incorrect unlock state |
| stream info | remote + short cache | seconds | token-sensitive |

### API Layer Rules

- no direct `window.location` assumptions
- locale, token, platform context must be injected
- Web and Native base URL config must be separated

## 9. UI and Shell Refactor

Native first paint must be guaranteed by a local shell.

### Shell Structure

```text
native-shell/src/app/
  App.tsx
  AppShell.tsx
  AppBootstrap.tsx
  LaunchCoordinator.tsx
  NavigationFrame.tsx
  ErrorBoundary.tsx
```

### Skeleton System

```text
packages/shared-ui/
  skeletons/
    HomeSkeleton.tsx
    BrowseSkeleton.tsx
    DetailSkeleton.tsx
    PlayerSkeleton.tsx
    UserSkeleton.tsx
```

### Startup Rules

- `0ms`: native splash visible
- `<300ms`: local app shell mounted
- `<500ms`: screen skeleton visible
- delayed data may show skeleton, but never pure black waiting

### Keep Web-only

- SSR layout
- SEO containers
- admin UI

### Extract to Shared UI

- button / input / modal / tabs / badge
- card / shelf / poster
- mobile nav / tab item
- player presentation controls

## 10. Playback Domain Refactor

Playback must become a dedicated domain package.

```text
shared-player/
  domain/
    playback-session.ts
    entitlement.ts
    progress.ts
    prefetch.ts
    quality.ts
  hooks/
    use-playback-session.ts
    use-entitlement.ts
    use-progress-sync.ts
  adapters/
    cloudflare-stream.ts
    hls.ts
  ui/
    PlayerRoot.tsx
    ControlBar.tsx
    PaywallOverlay.tsx
```

### Rules

- pages mount player screens only
- playback state machine is isolated
- progress sync is isolated
- entitlement is isolated
- prefetch is isolated
- quality and resume are isolated

### Acceptance

- player page shell renders immediately
- stream token delay may only show poster/skeleton/spinner, not blank page
- recent progress restores locally
- unlock changes refresh locally, not via full page reload

## 11. i18n Refactor

Web and Native must share dictionaries, but not locale-entry strategy.

```text
shared-i18n/
  dictionaries/
  locale/
    supported-locales.ts
    normalize-locale.ts
    detect-device-locale.ts
    localize-path.ts
  react/
    i18n-provider.tsx
    use-locale.ts
```

### Web

- keep SSR locale resolution
- keep cookie/header integration

### Native

- first start uses device locale
- afterwards local persisted locale is the source of truth
- API requests continue sending `x-user-lang`
- no dependency on `next/headers`

## 12. Payment Flow in Native Shell

### Problem

The current Web payment flow uses Stripe Checkout (redirect-based). In a local-shell Capacitor app, Stripe Checkout redirects break because the WebView loads from local files, not `tinytale.top`.

### Recommended Approach

Use **Stripe Payment Element** (embedded, no redirect) for Native:

- mount Stripe Elements inside a Native payment screen
- create PaymentIntent via API
- confirm payment inline
- avoid redirect-based Checkout Sessions entirely

### Alternative Approaches

If embedded Payment Element is not viable:

- **In-app browser**: open Stripe Checkout in a Capacitor Browser plugin, listen for return URL via deep link
- **Google Play Billing**: required if distributing via Play Store and selling digital content (coins are digital goods)

### Architecture Impact

- `shared-api` must support both `create-checkout-session` (Web) and `create-payment-intent` (Native) endpoints
- `apps/native-shell` needs a `PaymentScreen` that embeds Stripe Elements
- The payment service in `shared-api` should abstract the payment method selection
- Google Play Billing (if required) needs a dedicated Capacitor plugin and server-side receipt validation

### Google Play Billing Risk

If TinyTale distributes through the Play Store, Google requires in-app purchases for digital goods (coins). This may require:

- a Capacitor plugin for Google Play Billing
- server-side purchase verification
- dual payment path (Stripe for web, Play Billing for Android)

This should be evaluated during Phase 5 before implementing the payment screen.

## 13. Build, Environment, and Release

Recommended migration to `pnpm workspaces + Turborepo`.

### Root Scripts

```json
{
  "scripts": {
    "dev:web": "turbo run dev --filter=web",
    "dev:native": "turbo run dev --filter=native-shell",
    "build:web": "turbo run build --filter=web",
    "build:native": "turbo run build --filter=native-shell",
    "build:shared": "turbo run build --filter=./packages/*",
    "sync:android:dev": "pnpm --filter native-shell cap:sync:dev",
    "sync:android:prod": "pnpm --filter native-shell cap:sync:prod",
    "release:web": "pnpm build:web && vercel deploy --prod",
    "release:android": "pnpm build:native && pnpm sync:android:prod && ./gradlew bundleRelease"
  }
}
```

### Environment Split

Native:

- `.env.native.dev`
- `.env.native.staging`
- `.env.native.prod`

Web:

- `.env.web.dev`
- `.env.web.preview`
- `.env.web.prod`

### Capacitor Rules

- Development may use `server.url`.
- Production must not use `server.url`.
- Production Android/iOS must load local packaged `dist`.

### Output Rules

- `apps/web` outputs SSR/edge artifacts for Vercel.
- `apps/native-shell` outputs static assets into `dist`.
- Capacitor `copy/sync` must only consume `apps/native-shell/dist`.

## 14. Module Owners

Recommended ownership aligned with the current AGENTS model:

| Module | Owner | Responsibility |
|---|---|---|
| monorepo architecture, dependency boundaries, shared package contracts | Lead Agent | architecture and code ownership |
| route inventory, Web/Native boundaries, acceptance criteria | Product Agent | product rules and docs |
| design tokens, shared-ui, launch and skeleton system | Design Agent | visual system |
| `apps/native-shell` screens, router, providers | Dev Agent | implementation |
| `apps/web` compatibility migration | Dev Agent | implementation |
| playback domain, storage adapters, auth repositories | Lead Agent + Dev Agent | foundation |
| cold start, regression, offline, deep link, playback verification | Audit Agent | testing and reports |

### Suggested File Ownership

Lead Agent:

- `packages/shared-domain/**`
- `packages/shared-api/**`
- `packages/shared-storage/**`
- `packages/shared-runtime/**`

Design Agent:

- `packages/shared-ui/**`
- `apps/native-shell/src/theme/**`

Dev Agent:

- `apps/native-shell/src/screens/**`
- `apps/native-shell/src/router/**`
- `apps/web/src/app/**` compatibility updates

Audit Agent:

- `docs/migration/*-test-report.md`

## 15. Migration Order

Recommended 8-phase migration:

### Phase 0: Monorepo Foundation

- create `apps/` and `packages/`
- add `pnpm workspace`
- add `turbo`
- add TS path alias strategy
- create empty shared package shells

Exit criteria:

- `web` still builds
- blank `native-shell` builds
- CI can run workspace builds

### Phase 1: Shared Domain Extraction

- move types, enums, constants, shared helpers
- create `shared-domain` and `shared-i18n`

Exit criteria:

- `web` uses shared types
- zero behavior change in production

### Phase 2: Shared API / Storage / Auth

- migrate API SDK
- migrate session/token repositories
- abstract storage layer

Exit criteria:

- `web` still runs
- Native auth bootstrap demo works

### Phase 3: Native Shell Bootstrap

- create local `AppShell`
- create Native route system
- switch Capacitor production mode to local package
- remove production `server.url`

Exit criteria:

- Android cold start no longer waits for remote HTML
- local shell visible

### Phase 4: Core Navigation and Shell Screens

- home, browse, search, category, rankings skeleton localized to Native shell
- deep link and tab navigation work

Exit criteria:

- core browse path fully reachable through local shell

### Phase 5: Auth and User Flows

- login/register/reset-password
- profile/favorites/history/notifications/settings

Exit criteria:

- guest and authenticated startup both stable

### Phase 6: Drama Detail and Playback

- drama detail
- play screen
- entitlement
- progress
- resume
- player state machine

Exit criteria:

- Native playback flow complete

### Phase 7: Cache, Offline, Push, Deep Link

- feed cache
- offline fallback
- push flows
- app URL open

Exit criteria:

- cold start, weak network, offline, push wake-up all pass

### Phase 8: Web Cleanup and Legacy Removal

- remove old imports
- remove obsolete Native-in-Web runtime assumptions
- finalize docs and CI

Exit criteria:

- no duplicated drifting implementations
- build pipeline stable

## 16. Refactor Checklist

| Module | Action | Web | Native | Owner |
|---|---|---|---|---|
| repo structure | split into `apps/` and `packages/` | compatible | new | Lead |
| type system | move to `shared-domain` | switch imports | switch imports | Lead |
| API layer | move to `shared-api` | switch | switch | Lead |
| auth | repository-based | update provider | create provider | Lead/Dev |
| storage | adapter-based | localStorage/IndexedDB | Preferences/SQLite/SecureStore | Lead |
| i18n | shared dictionaries | keep SSR locale | local-first locale | Lead |
| UI base components | extract `shared-ui` | reuse | reuse | Design |
| home/browse/search | keep | keep | rewrite screen | Dev |
| detail/play | keep | keep | rewrite screen | Dev |
| user center | keep | keep | rewrite screen | Dev |
| admin | web-only | keep | no | Product/Dev |
| launch/skeleton | optimize | optional | local-first | Design/Dev |
| deep link | keep | keep | remap through app router | Dev |
| push | optional | no strong dependency | full native integration | Dev |
| offline | keep SW | keep | local cache fallback | Dev/Audit |
| CI/CD | dual pipeline | keep | add | Lead |

## 17. Risks

| Risk | Description | Mitigation |
|---|---|---|
| Web / Native drift | two entry apps may diverge over time | share business/domain layers only |
| auth inconsistency | Web cookie/session and Native token models differ | define unified session repository contract |
| playback complexity | entitlement, stream token, resume, prefetch can sprawl | extract `shared-player` |
| i18n entry divergence | Web SSR vs Native local locale | share dictionaries, separate entry strategy |
| build complexity | dual apps and outputs | workspace + turbo |
| startup race conditions | shell/cache/auth bootstrap timing | introduce `LaunchCoordinator` |
| legacy coupling | many pages directly read localStorage or API | phase-based repository extraction |
| payment flow breakage | Stripe Checkout redirects don't work in local-shell WebView | use embedded Payment Element or in-app browser; evaluate Google Play Billing requirement |
| env var cache poisoning | Turborepo may cache builds with wrong env vars | configure `globalEnv` and per-task `env` keys in `turbo.json` |

## 18. Acceptance Gates

The refactor is considered successful only if all conditions below are met:

- Android/iOS production apps no longer configure `server.url`
- cold start no longer waits on remote HTML
- brand splash appears immediately
- app shell appears within the first startup frame budget
- home, browse, detail, and playback all render local shell first
- login state can be restored locally
- weak network still allows entering the shell
- Web SSR, SEO, and Admin remain intact
- all shared business logic comes from `packages/*`
- Web and Native do not directly import each other's application code

## 19. Recommended Execution Sequence

Recommended practical order:

1. `Phase 0 + Phase 1`
2. `Phase 2`
3. `Phase 3`
4. `Phase 4`
5. `Phase 6`
6. `Phase 5`
7. `Phase 7`
8. `Phase 8`

Rationale:

- build the scaffolding first
- extract foundations second
- establish local shell early
- unlock the browse path before anything else
- prioritize playback core path
- then fill user/account domain
- then polish offline/push/deep links

## 20. Documentation Rule Going Forward

All follow-up architecture and migration outputs for this refactor should also be stored as Markdown files under `docs/`.

Recommended future documents:

- `docs/NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md`
- `docs/NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md`
- `docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md`
- `docs/NATIVE_LOCAL_SHELL_AUTH_STORAGE_DESIGN.md`
- `docs/NATIVE_LOCAL_SHELL_TEST_ACCEPTANCE_PLAN.md`

