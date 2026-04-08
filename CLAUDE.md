# TinyTale Build Rules

## Android Targets

- Main app packaging uses [`/Users/gabriel/tinytale/capacitor.config.ts`](/Users/gabriel/tinytale/capacitor.config.ts) and [`/Users/gabriel/tinytale/android`](/Users/gabriel/tinytale/android).
- The main user-facing Android package id is `top.tinytale.app`.
- `apps/native-shell` is a separate local-shell app under [`/Users/gabriel/tinytale/apps/native-shell`](/Users/gabriel/tinytale/apps/native-shell).
- The native-shell Android package id is `top.tinytale.shell`.

## Command Rules

- To build or install the main app, use root commands only:
  - `npm run verify:prod:web`
  - `npm run android:sync:prod`
  - `npm run android:package:prod`
  - `npm run android:install`
- To build the native shell, use workspace commands only:
  - `npm --workspace native-shell run build`
  - `npm --workspace native-shell run sync:android:assets`
  - `npm --workspace native-shell run android:assemble`

## Production Data Rules

- Main site pages and the main Android app must default to production endpoints, never `localhost`.
- The main Android app must load the production website entry at `https://tinytale.top`.
- The default API fallback for website and admin pages must be `https://api.tinytale.top`.
- Do not use `CAP_SERVER_URL`, `localhost:7001`, or `localhost:7002` for the main app packaging flow.

## Test And Deploy Rules

- Before any production website deploy, run `npm run verify:prod:web`.
- Before any main Android package build, run `npm run android:sync:prod` so Capacitor picks up the latest production web build and production config.
- After packaging the main Android app, install and smoke test on device before calling it ready.
- For native-shell work, validate separately with `npm --workspace native-shell run typecheck`, `npm --workspace native-shell run build`, and `npm --workspace native-shell run android:assemble`.
- Production website deploys should come from the root project on `main`, not from `apps/native-shell`.

## Safety Rules

- Never install [`/Users/gabriel/tinytale/apps/native-shell/android/app/build/outputs/apk/debug/app-debug.apk`](/Users/gabriel/tinytale/apps/native-shell/android/app/build/outputs/apk/debug/app-debug.apk) when the goal is to verify current website pages from [`/Users/gabriel/tinytale/src/app`](/Users/gabriel/tinytale/src/app).
- Before installing any APK, confirm which `capacitor.config.ts` produced it and which package id it will install.
- If the task is about startup shell, offline shell, native route rendering, or `apps/native-shell` screens, use the native-shell build chain.
- If the task is about the main site pages, use the root Android wrapper build chain.

## Context Notes

- The root Android wrapper and the native shell are different apps with different page sources.
- The root Android wrapper follows the website app flow.
- The native shell renders its own local screen set and can intentionally differ from the website until pages are migrated.
