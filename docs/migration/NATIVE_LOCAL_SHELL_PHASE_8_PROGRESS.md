# Native Local Shell Phase 8 Progress

## Scope

Phase 8 removes legacy coupling, formalizes app/package boundaries, and stabilizes release operations.

## Completed

- added custom import-boundary enforcement script at `scripts/check-import-boundaries.mjs`
- added workspace validation scripts in root `package.json`
- added GitHub Actions workflow for boundaries, typechecks, and app builds
- documented release flow for web and native
- documented long-term ownership split across `src/`, `apps/`, and `packages/`

## Current Repository Shape

- Web runtime remains the root Next.js app
- `apps/web` is a workspace compatibility entry
- `apps/native-shell` is the app-native Capacitor shell
- `packages/*` are the only approved shared dependency layer

## Remaining Follow-up

- move additional pure web logic from `src/` into packages when drift risk appears
- add Vitest coverage for route mapping and boundary-sensitive pure modules
- add device-side manual verification notes to the final release checklist
