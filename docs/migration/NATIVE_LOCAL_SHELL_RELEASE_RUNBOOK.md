# TinyTale Native Local Shell Release Runbook

## Purpose

This runbook defines the stable release path after the Native Local Shell refactor.

Phase 8 rule:

- Web and Native release steps are explicit and separate
- shared packages are validated before either app is released
- import boundaries are checked before builds

## Workspace Validation

Run before any release candidate:

```bash
npm run check:boundaries
npm run check:native-release-config
npm run typecheck:shared
npm run typecheck:web
npm run typecheck:native-shell
```

Recommended full validation:

```bash
npm run validate:workspace
```

## Web Release Flow

The production Web app still runs from the repository root Next.js app.

Validation:

```bash
npm run validate:web
```

Release notes:

- verify SSR pages still build
- verify user center, playback, admin, and help routes render
- confirm env vars for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`

Deployment:

```bash
npm run build:web
```

Then deploy through the existing Vercel path.

## Native Android Release Flow

The Android shell is built from `apps/native-shell`.

Validation:

```bash
npm run validate:native-shell:android
```

Release notes:

- production builds must not set `CAP_SERVER_URL`
- local-shell startup must come from `apps/native-shell/dist`
- web-only routes must open in Capacitor Browser, not local router screens
- `npm run check:native-release-config` must pass before sign-off

Local dev sync remains supported:

```bash
npm --workspace native-shell run cap:sync:dev
```

Production asset sync:

```bash
npm --workspace native-shell run cap:sync:prod
```

## Manual Regression Gate

Before a release candidate is accepted:

- verify guest cold start
- verify restored session cold start
- verify home, browse, drama detail, and playback
- verify offline shell and cached route fallback
- verify deep link route mapping
- verify push wake-up route mapping
- verify web-only links open in in-app browser

Optional adb-assisted smoke run:

```bash
npm run android:smoke:deeplinks
```

Record the manual pass/fail state in:

- `docs/migration/NATIVE_LOCAL_SHELL_RELEASE_CHECKLIST.md`
- `docs/migration/NATIVE_LOCAL_SHELL_DEVICE_SMOKE_CHECKLIST.md`
- `docs/migration/phase-7-test-report.md`
- `docs/migration/phase-8-test-report.md`

## Failure Handling

If validation fails:

- fix boundary violations first
- fix shared package type errors before app-specific errors
- re-run the narrow validation command for the affected surface
- re-run the full workspace validation before release sign-off
