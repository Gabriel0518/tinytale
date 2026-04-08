# TinyTale Native Local Shell Ownership Map

## Goal

This document records the long-term ownership split after the monorepo refactor.

## App Ownership

### `src/`

Owner: Web product team

Scope:

- production Next.js SSR user app
- admin routes
- existing web-only pages
- current Vercel deployment entry

Rules:

- may depend on `packages/*`
- must not import from `apps/native-shell`

### `apps/native-shell/`

Owner: Native shell team

Scope:

- Capacitor shell
- local-first router
- native startup bootstrap
- Android project, deep links, offline route behavior, push integration

Rules:

- may depend on `packages/*`
- must not import from `src/`
- must not import from `apps/web`

### `apps/web/`

Owner: Platform team

Scope:

- monorepo compatibility entry for the root web app
- workspace-level web scripts only

Rules:

- no feature code should live here
- must not import from `apps/native-shell`

## Shared Package Ownership

### `packages/shared-domain`

Owner: Lead / platform

Scope:

- shared entities
- API response types
- cross-app domain contracts

### `packages/shared-api`

Owner: Lead / platform

Scope:

- API client construction
- shared endpoint adapters
- web/native-safe request context

### `packages/shared-auth`

Owner: Lead / platform

Scope:

- auth bindings
- session abstractions
- provider contracts shared by web and native

### `packages/shared-storage`

Owner: Lead / platform

Scope:

- cache and session storage contracts
- browser/native storage adapters

### `packages/shared-runtime`

Owner: Lead / platform

Scope:

- runtime settings
- bootstrap contracts

### `packages/shared-player`

Owner: Lead / playback

Scope:

- playback progress repository
- stream source resolution
- entitlement and player-side shared logic

### `packages/shared-i18n`

Owner: Lead / localization

Scope:

- dictionaries
- locale normalization
- localize/remove-locale path helpers

## Enforcement

Guard rails live in:

- `scripts/check-import-boundaries.mjs`
- `.github/workflows/validate-monorepo.yml`

Required rule:

- packages depend only on packages or external libraries
