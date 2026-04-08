# TinyTale Native Local Shell Phase 0-2 Task Breakdown

## Document Info

- Owner: `Lead Agent`
- Status: `Execution Blueprint`
- Depends on: [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
- Scope: `Phase 0`, `Phase 1`, `Phase 2`
- Goal: establish the repository foundation, shared package layer, and cross-platform auth/API/storage contracts without breaking the current Web production behavior.

## 1. Phase Goals

### Phase 0 Goal

Create the monorepo and application boundary structure without changing runtime behavior.

### Phase 1 Goal

Extract shared domain and i18n primitives from the current app into reusable packages.

### Phase 2 Goal

Extract API, auth, runtime, and storage contracts so both Web and future Native Shell can consume them consistently.

## 2. Required Result After Phase 0-2

At the end of Phase 0-2, the repository should satisfy all of the following:

- Web production app still builds and behaves the same.
- Shared packages exist and are consumable.
- Web app imports shared packages instead of local ad-hoc copies for domain models and core services.
- Native shell project can be bootstrapped against the shared package layer even if no real screens are migrated yet.
- Auth, API, and storage patterns have explicit interfaces and adapter boundaries.
- No production route behavior changes are introduced yet.

## 3. Phase 0: Monorepo Foundation

### 3.1 Directory Creation

Create the following directories:

```text
/Users/gabriel/tinytale/apps
/Users/gabriel/tinytale/apps/web
/Users/gabriel/tinytale/apps/native-shell
/Users/gabriel/tinytale/packages
/Users/gabriel/tinytale/packages/shared-domain
/Users/gabriel/tinytale/packages/shared-api
/Users/gabriel/tinytale/packages/shared-auth
/Users/gabriel/tinytale/packages/shared-storage
/Users/gabriel/tinytale/packages/shared-i18n
/Users/gabriel/tinytale/packages/shared-ui
/Users/gabriel/tinytale/packages/shared-player
/Users/gabriel/tinytale/packages/shared-runtime
/Users/gabriel/tinytale/docs/migration
/Users/gabriel/tinytale/docs/architecture
/Users/gabriel/tinytale/docs/runbooks
```

### 3.2 Workspace Configuration

Add:

- `pnpm-workspace.yaml`
- `turbo.json`

Recommended `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

Recommended `turbo.json` shape:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*", "VITE_*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  },
  "globalEnv": [
    "NEXT_PUBLIC_API_URL",
    "VITE_API_URL",
    "NODE_ENV"
  ]
}
```

Note: Turborepo v2+ uses `tasks` instead of the deprecated `pipeline` key. The `env` and `globalEnv` fields ensure cache invalidation when environment variables change.

### 3.3 Turborepo Environment Variable Configuration

Turborepo caches build outputs. Without explicit env var declarations, changing an environment variable will not invalidate the cache, producing incorrect builds.

Required configuration in `turbo.json`:

- `globalEnv`: list env vars that affect all tasks (e.g., `NODE_ENV`, shared API URLs)
- per-task `env`: list env vars specific to that task (e.g., `NEXT_PUBLIC_*` for web build, `VITE_*` for native build)

Each app should also document which env vars it consumes in its own `.env.example` file.

### 3.4 Root Package Reorganization

Current root package should become the workspace root, not the long-term app package.

Tasks:

- keep existing dependencies temporarily at root
- introduce workspace scripts
- avoid moving runtime code and deploy scripts in the same commit as monorepo bootstrap

Recommended root scripts to add first:

```json
{
  "scripts": {
    "build:web": "pnpm --filter web build",
    "build:shared": "pnpm -r --filter './packages/*' build",
    "lint:web": "pnpm --filter web lint",
    "typecheck:web": "pnpm --filter web typecheck"
  }
}
```

### 3.5 App Relocation Strategy

Do not immediately rewrite imports while moving files.

Use this two-step move strategy:

1. Copy current app into `apps/web`
2. Get `apps/web` to build with compatibility aliases
3. Only then begin package extraction

Initial layout inside `apps/web`:

```text
apps/web/src/app
apps/web/src/components
apps/web/src/hooks
apps/web/src/lib
apps/web/src/types
apps/web/public
apps/web/next.config.mjs
apps/web/package.json
```

### 3.6 TypeScript and Alias Setup

Add package-level `tsconfig.json` files for:

- `apps/web`
- each `packages/*`

Create a root `tsconfig.base.json` to centralize:

- strictness
- path aliases
- module resolution

Recommended initial alias directions:

- `@web/*` for `apps/web/src/*`
- `@domain/*` for `packages/shared-domain/src/*`
- `@api/*` for `packages/shared-api/src/*`
- `@auth/*` for `packages/shared-auth/src/*`
- `@storage/*` for `packages/shared-storage/src/*`
- `@i18n/*` for `packages/shared-i18n/src/*`
- `@ui/*` for `packages/shared-ui/src/*`
- `@player/*` for `packages/shared-player/src/*`
- `@runtime/*` for `packages/shared-runtime/src/*`

### 3.7 Phase 0 Deliverables

- `apps/web` exists
- `apps/native-shell` exists as scaffold
- `packages/*` directories exist
- workspace tooling exists
- root scripts are updated
- `apps/web` builds from its new location

### 3.8 Phase 0 Validation Checklist

- `pnpm install` works
- `pnpm build:web` succeeds
- `pnpm lint:web` succeeds or reproduces only pre-existing warnings
- Vercel deployment path for Web remains intact
- no route behavior changes

### 3.9 Phase 0 Risks

| Risk | Description | Mitigation |
|---|---|---|
| Build path breakage | current deploy assumes root app layout | preserve compatibility scripts until Web app path migration is fully complete |
| Alias confusion | mixed root and package aliases can become inconsistent | centralize alias definitions in `tsconfig.base.json` |
| Over-moving too early | moving code and extracting packages in one step makes failures hard to isolate | split repo move from logic extraction |

### 3.10 Phase 0 Owner

- Lead Agent

## 4. Phase 1: Shared Domain and i18n Extraction

### 4.1 Target Packages

Phase 1 focuses on:

- `packages/shared-domain`
- `packages/shared-i18n`

### 4.2 Files to Extract First

Move or copy the following into `shared-domain`:

- [src/types](/Users/gabriel/tinytale/src/types)
- [src/types/creator.ts](/Users/gabriel/tinytale/src/types/creator.ts)

Move or copy the following into `shared-i18n`:

- [src/lib/i18n.ts](/Users/gabriel/tinytale/src/lib/i18n.ts)
- [src/lib/locale-copy.ts](/Users/gabriel/tinytale/src/lib/locale-copy.ts)
- generated translation files that are not Web-only

### 4.3 Package Layout

Recommended `shared-domain` layout:

```text
packages/shared-domain/src
  /entities
  /creator
  /api
  /constants
  index.ts
```

Recommended `shared-i18n` layout:

```text
packages/shared-i18n/src
  /locale
  /dictionaries
  /react
  index.ts
```

### 4.4 Refactor Rules for Phase 1

- no behavior changes
- no platform branching inside domain types
- no Next.js imports inside shared packages
- no `window`, `document`, or `localStorage` inside shared packages

### 4.5 Web Replacement Tasks

Tasks for `apps/web`:

- replace internal imports from `@/types` with shared-domain imports
- replace internal imports from `@/lib/i18n` and `@/lib/locale-copy` with shared-i18n imports where safe
- keep Web-only locale entry behavior in Web app boundary if it depends on `next/headers`

### 4.6 Phase 1 Deliverables

- `shared-domain` compiles
- `shared-i18n` compiles
- Web app compiles against shared types and shared locale helpers
- no SSR behavior changes

### 4.7 Phase 1 Validation Checklist

- Web build output is unchanged in route inventory
- no metadata or locale regression on public pages
- no admin route regressions
- no import cycles between Web and packages

### 4.8 Phase 1 Risks

| Risk | Description | Mitigation |
|---|---|---|
| Hidden Next coupling | some i18n helpers may still assume Next route behavior | keep SSR entry logic inside `apps/web` and extract only pure helpers |
| Type duplication | partial migration can leave duplicate models in app and package | enforce one-way migration and delete duplicates as soon as replacements are stable |

### 4.9 Phase 1 Owner

- Lead Agent

## 5. Phase 2: API, Auth, Runtime, and Storage Extraction

### 5.1 Target Packages

Phase 2 focuses on:

- `packages/shared-api`
- `packages/shared-auth`
- `packages/shared-storage`
- `packages/shared-runtime`

### 5.2 Files to Extract First

API layer candidates:

- [src/lib/api.ts](/Users/gabriel/tinytale/src/lib/api.ts)

Auth layer candidates:

- [src/lib/authContext.tsx](/Users/gabriel/tinytale/src/lib/authContext.tsx)
- native social login helper contracts from [src/lib/native-social-login.ts](/Users/gabriel/tinytale/src/lib/native-social-login.ts) where reusable

Storage/runtime candidates:

- [src/lib/runtime-settings.ts](/Users/gabriel/tinytale/src/lib/runtime-settings.ts)
- [src/lib/view-cache.ts](/Users/gabriel/tinytale/src/lib/view-cache.ts)
- [src/lib/playback-progress-cache.ts](/Users/gabriel/tinytale/src/lib/playback-progress-cache.ts)
- [src/lib/in-app-notifications.ts](/Users/gabriel/tinytale/src/lib/in-app-notifications.ts)

### 5.3 Package Layouts

Recommended `shared-api`:

```text
packages/shared-api/src
  /client
    api-client.ts
    request-context.ts
    errors.ts
  /endpoints
    auth.ts
    dramas.ts
    categories.ts
    featured.ts
    user.ts
    payment.ts
    promoter.ts
  /query
    query-keys.ts
  index.ts
```

Recommended `shared-auth`:

```text
packages/shared-auth/src
  /contracts
    auth-repository.ts
    session-repository.ts
    token-store.ts
  /services
    login-service.ts
    logout-service.ts
    bootstrap-session.ts
    refresh-user.ts
  /react
    AuthProvider.tsx
    useAuth.ts
  index.ts
```

Recommended `shared-storage`:

```text
packages/shared-storage/src
  /contracts
    kv-store.ts
    secure-store.ts
    cache-store.ts
  /web
    local-storage-kv.ts
    indexeddb-cache.ts
  /native
    capacitor-preferences-kv.ts
    sqlite-cache.ts
    secure-token-store.ts
  index.ts
```

Recommended `shared-runtime`:

```text
packages/shared-runtime/src
  /runtime-settings
    model.ts
    repository.ts
  /bootstrap
    app-bootstrap.ts
    feature-flags.ts
  /platform
    environment.ts
  index.ts
```

### 5.4 API Extraction Rules

When extracting [src/lib/api.ts](/Users/gabriel/tinytale/src/lib/api.ts):

- split pure request transport from endpoint definitions
- remove direct browser-only assumptions from core client
- create `RequestContext` object with:
  - `baseUrl`
  - `locale`
  - `token`
  - `platform`
- let Web and Native construct context differently

Do not:

- keep one giant monolithic API file
- allow endpoint functions to read directly from `window.location`
- allow hidden locale injection inside transport internals

### 5.5 Auth Extraction Rules

When extracting [src/lib/authContext.tsx](/Users/gabriel/tinytale/src/lib/authContext.tsx):

- split stateful React provider from storage and auth services
- define explicit repository contracts
- remove direct `localStorage` calls from business logic
- keep Web adapter in Web app
- prepare Native secure-store adapter

Required split:

- session bootstrapping
- login/register/social login
- logout
- user refresh
- persistence

### 5.6 Storage Extraction Rules

All storage must be grouped by responsibility:

Secure store:

- token
- refresh token
- session secret

KV store:

- locale
- runtime settings
- light preferences

Cache store:

- view cache
- feed cache
- notifications cache
- playback progress cache

### 5.7 Runtime Extraction Rules

`shared-runtime` must own:

- runtime settings model
- bootstrap orchestration contracts
- feature flags
- app startup coordination primitives

It must not own:

- page rendering
- route mapping
- endpoint-specific fetch logic

### 5.8 Web Adapter Layer

After extraction, `apps/web` must provide:

- Web API base URL resolver
- Web token storage adapter
- Web locale resolver
- Web runtime settings storage adapter

This preserves current behavior while moving logic into contracts.

### 5.9 Native Adapter Layer Skeleton

Even before Native screens exist, create stubs for:

- secure token store
- preferences-backed runtime settings
- local cache store
- app bootstrap hooks

These can be non-production placeholders in Phase 2, but the interface must exist.

### 5.10 Phase 2 Deliverables

- shared API package exists and is consumed by Web
- shared auth package exists and is consumed by Web
- shared storage interfaces exist
- shared runtime package exists
- Web behavior remains unchanged
- Native shell can import shared packages and typecheck

### 5.11 Phase 2 Validation Checklist

- `apps/web` builds successfully
- authentication still works in Web
- locale-aware requests still work in Web
- no production routing changes
- no SSR locale regressions
- no session persistence regressions
- no circular dependencies among shared packages

### 5.12 Phase 2 Risks

| Risk | Description | Mitigation |
|---|---|---|
| Auth regression | extracting storage can break persisted login | write contract tests for session bootstrap, login, logout, refresh |
| Request context drift | Web and Native may diverge in locale/token injection | define explicit `RequestContext` and adapter tests |
| Hidden storage coupling | page components may still directly access localStorage | audit and replace direct access with repositories incrementally |
| Runtime duplication | old and new runtime settings logic may coexist | make package version authoritative and delete old code after migration |

### 5.13 Phase 2 Owner

- Lead Agent
- Dev Agent for integration updates in Web

## 6. Work Breakdown by Module

### 6.1 Lead Agent

Responsible for:

- workspace structure
- package boundaries
- API contracts
- auth/storage/runtime contract design
- migration guardrails

Files owned:

- `packages/shared-domain/**`
- `packages/shared-api/**`
- `packages/shared-storage/**`
- `packages/shared-runtime/**`

### 6.2 Product Agent

Responsible for:

- Web vs Native route inventory confirmation
- domain ownership boundaries
- acceptance criteria for Phase 0-2
- no-code migration documentation

Deliverables:

- route inventory matrix
- feature ownership checklist
- regression acceptance notes

### 6.3 Design Agent

Responsible for:

- no visual redesign yet
- define package-level token extraction rules for future `shared-ui`
- identify component sets safe to extract later

Deliverables:

- component extraction list
- design token ownership map

### 6.4 Dev Agent

Responsible for:

- integrating shared package imports into Web
- updating build scripts
- keeping current Web runtime stable during extraction

Files owned in this phase:

- `apps/web/**`
- root scripts and workspace config

### 6.5 Audit Agent

Responsible for:

- build verification
- auth smoke testing
- locale regression smoke testing
- import-cycle and boundary checks

Deliverables:

- `docs/migration/phase-0-test-report.md`
- `docs/migration/phase-1-test-report.md`
- `docs/migration/phase-2-test-report.md`

## 7. Execution Sequence

### Sequence A: Repo Bootstrap

1. Add workspace config
2. Create `apps/` and `packages/`
3. Move current app into `apps/web`
4. Restore build
5. Commit separately

### Sequence B: Domain and i18n

1. Extract shared-domain
2. Replace Web imports
3. Extract shared-i18n pure helpers
4. Replace Web imports
5. Commit separately

### Sequence C: API/Auth/Storage/Runtime

1. Extract shared-api transport and endpoints
2. Migrate Web to package API
3. Extract shared-storage contracts
4. Extract shared-auth services and provider
5. Extract shared-runtime models
6. Add Native shell adapter stubs
7. Commit separately

## 8. Rollback Points

Each rollback point must correspond to a clean commit:

- Rollback Point 1: workspace scaffold added, Web still builds
- Rollback Point 2: shared-domain and shared-i18n extracted, Web unchanged
- Rollback Point 3: shared-api extracted, Web unchanged
- Rollback Point 4: shared-auth and storage extracted, Web unchanged

Never combine multiple rollback points into a single large commit.

## 9. Deliverables by the End of Phase 0-2

Expected new files:

- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `apps/web/package.json`
- `apps/native-shell/package.json`
- `packages/shared-domain/package.json`
- `packages/shared-api/package.json`
- `packages/shared-auth/package.json`
- `packages/shared-storage/package.json`
- `packages/shared-i18n/package.json`
- `packages/shared-ui/package.json`
- `packages/shared-player/package.json`
- `packages/shared-runtime/package.json`
- package-level `src/index.ts` files

Expected new docs:

- `docs/migration/phase-0-test-report.md`
- `docs/migration/phase-1-test-report.md`
- `docs/migration/phase-2-test-report.md`

## 10. Exit Criteria

Phase 0-2 is complete only if:

- `apps/web` is the authoritative Web application
- shared packages compile independently
- Web compiles while consuming shared packages
- Web auth, locale, and API behavior remain unchanged
- Native shell package exists and typechecks against the new shared contracts
- all future Native work can proceed without touching Web SSR architecture

## 11. Next Document

After this document, the next recommended follow-up document is:

- `docs/NATIVE_LOCAL_SHELL_PHASE_3_4_TASKS.md`

That document should cover:

- Native shell bootstrap
- Capacitor production local-package mode
- local launch sequence
- route shell
- first migrated Native screens

