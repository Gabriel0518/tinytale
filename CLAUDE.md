# TinyTale Build Rules

## Android Targets

- Main app packaging uses [`/Users/gabriel/tinytale/capacitor.config.ts`](/Users/gabriel/tinytale/capacitor.config.ts) and [`/Users/gabriel/tinytale/android`](/Users/gabriel/tinytale/android).
- The main user-facing Android package id is `top.tinytale.app`.
- `apps/native-shell` is a separate local-shell app under [`/Users/gabriel/tinytale/apps/native-shell`](/Users/gabriel/tinytale/apps/native-shell).
- The native-shell Android package id is `top.tinytale.shell`.

## Command Rules

- To build or install the main app, use root commands only:
  - `npm run android:assemble`
  - `npm run android:install`
- To build the native shell, use workspace commands only:
  - `npm --workspace native-shell run build`
  - `npm --workspace native-shell run sync:android:assets`
  - `npm --workspace native-shell run android:assemble`

## Safety Rules

- Never install [`/Users/gabriel/tinytale/apps/native-shell/android/app/build/outputs/apk/debug/app-debug.apk`](/Users/gabriel/tinytale/apps/native-shell/android/app/build/outputs/apk/debug/app-debug.apk) when the goal is to verify current website pages from [`/Users/gabriel/tinytale/src/app`](/Users/gabriel/tinytale/src/app).
- Before installing any APK, confirm which `capacitor.config.ts` produced it and which package id it will install.
- If the task is about startup shell, offline shell, native route rendering, or `apps/native-shell` screens, use the native-shell build chain.
- If the task is about the main site pages, use the root Android wrapper build chain.

## Context Notes

- The root Android wrapper and the native shell are different apps with different page sources.
- The root Android wrapper follows the website app flow.
- The native shell renders its own local screen set and can intentionally differ from the website until pages are migrated.
