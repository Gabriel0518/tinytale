# TinyTale Native Local Shell Phase 3-4 Task Breakdown

## Document Info

- Owner: `Lead Agent`
- Status: `Execution Blueprint`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md)
- Scope: `Phase 3`, `Phase 4`
- Goal: bootstrap the Native Shell, remove production dependency on remote HTML startup, and establish the first local-package app shell navigation flow.

## 1. Phase Goals

### Phase 3 Goal

Create a true Native Shell startup path that loads from the local app package in production.

### Phase 4 Goal

Migrate the app-level shell and the first set of core browsing screens so the user can enter the application through local UI even before remote data completes.

## 2. Required Result After Phase 3-4

At the end of Phase 3-4:

- production Capacitor startup must no longer depend on remote HTML
- the Native Shell must boot from local packaged assets
- the app must display a local launch sequence and shell immediately
- the first navigation layer must exist locally
- core browse surfaces must render local skeletons and local shell before remote APIs resolve

## 3. Phase 3: Native Shell Bootstrap

### 3.1 Create Native Shell Application

Inside `apps/native-shell`, create:

```text
apps/native-shell
├─ src
│  ├─ app
│  ├─ bootstrap
│  ├─ providers
│  ├─ router
│  ├─ bridges
│  ├─ theme
│  └─ screens
├─ public
├─ capacitor.config.ts
├─ vite.config.ts
├─ package.json
├─ tsconfig.json
└─ index.html
```

### 3.2 Recommended Initial File Set

```text
src/app/App.tsx
src/app/AppShell.tsx
src/app/NavigationFrame.tsx
src/bootstrap/boot-native-app.tsx
src/bootstrap/LaunchCoordinator.tsx
src/bootstrap/bootstrap-session.ts
src/bootstrap/bootstrap-runtime.ts
src/providers/QueryProvider.tsx
src/providers/AuthProvider.tsx
src/providers/I18nProvider.tsx
src/router/app-routes.tsx
src/router/protected-routes.tsx
src/router/route-names.ts
src/router/deep-links.ts
src/theme/tokens.css
src/theme/global.css
```

### 3.3 Native Tooling

Recommended stack:

- React 18
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Capacitor 8

Required scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "cap:sync:dev": "CAP_SERVER_URL=http://localhost:5173 npx cap sync android",
    "cap:sync:prod": "npx cap sync android",
    "android:run": "npx cap run android",
    "android:open": "npx cap open android"
  }
}
```

### 3.4 Capacitor Production Rules

Production Native Shell must:

- build local assets into `dist`
- point `webDir` to `dist`
- not set `server.url`

Development Native Shell may:

- use `server.url`
- use live reload

### 3.5 Capacitor Config Strategy

Recommended `capacitor.config.ts` behavior:

- `NODE_ENV=development` or explicit native dev mode
  - allow `server.url`
- production
  - `webDir: 'dist'`
  - no `server.url`

### 3.6 Android Packaging Rules

Android release pipeline must:

1. build `apps/native-shell`
2. copy `dist` into Capacitor assets
3. package the Android bundle

Android release pipeline must not:

- package the current Next `.next` directory
- depend on `tinytale.top` HTML for first paint

### 3.7 Existing Android Project Migration

The current project has `android/` and `capacitor.config.ts` at the repository root with critical customizations that must be preserved.

#### Customizations to Migrate

From `MainActivity.java`:

- User-Agent append: `TinyTaleNativeApp` token (frontend uses this to detect native app)
- Immersive Mode: system bar hiding for fullscreen experience
- Window Insets: custom insets handling, keyboard IME padding disabled
- WebView background: `#141414` to prevent white flash

From `AndroidManifest.xml`:

- `usesCleartextTraffic="true"` for development HTTP
- `supportsPictureInPicture="true"`
- Deep link intent filters for `tinytale.top`, `www.tinytale.top`, `top.tinytale.app://`

#### Migration Steps

1. copy `android/` into `apps/native-shell/android/`
2. update Gradle build paths to match the new project location
3. verify all `MainActivity.java` customizations are intact
4. update `capacitor.config.ts` import paths
5. update `AndroidManifest.xml` deep link URLs if needed
6. run a local build to verify `assembleDebug` succeeds
7. remove root-level `android/` only after Native Shell Android build is verified

#### Verification

- `adb install` the APK and confirm immersive mode works
- confirm User-Agent contains `TinyTaleNativeApp`
- confirm WebView background is `#141414`
- confirm deep links resolve correctly

### 3.8 LaunchCoordinator Design

`LaunchCoordinator` owns cold-start orchestration:

- native splash handoff
- shell visibility timing
- session bootstrap timing
- locale bootstrap timing
- runtime settings bootstrap timing
- home cache warm restore

Responsibilities:

- decide when native splash can hide
- decide when shell is ready to appear
- prevent black frames during handoff
- avoid blocking shell on remote API

### 3.9 Bootstrap Sequence

Target startup flow:

1. native splash displays branded screen
2. local `index.html` loads
3. `LaunchCoordinator` mounts app shell frame
4. local theme and tokens load immediately
5. local auth/session restore begins
6. runtime settings restore begins
7. route shell renders skeleton
8. native splash hides
9. remote API data starts hydrating visible content

### 3.10 Native Startup Acceptance

Phase 3 is not complete until:

- there is no remote HTML dependency in production
- there is no pure black waiting period caused by remote page fetch
- local shell appears before data fetch completes

## 4. Phase 4: Core Navigation and Shell Screens

### 4.1 Shell Screens to Implement First

Implement local shell versions of:

- home
- browse
- search
- category
- rankings

These should be local shell screens, not complete native rewrites of every data behavior yet.

### 4.2 Route Layer

Create route names:

- `home`
- `browse`
- `search`
- `category`
- `rankings`
- `dramaDetail`
- `playEpisode`
- `login`
- `register`
- `profile`

Create path builders for:

- localized path generation
- deep-link normalization
- app route mapping from push/deep links

### 4.3 Navigation Frame

`NavigationFrame` should contain:

- top header
- bottom tab navigation
- safe-area handling
- route container
- global offline banner slot
- global toast host
- global modal portal

### 4.4 App Shell UI Inventory

Local shell must include:

- branded launch overlay
- header shell
- bottom tab shell
- home hero skeleton
- shelf skeleton
- search shell
- category shell
- rankings shell
- global empty/error skeleton states

### 4.5 Data Strategy for First Screens

For each first-wave screen:

- render local skeleton immediately
- hydrate from cache if available
- refresh from remote API afterward

Target screens and data:

`Home`

- local skeleton
- cached homepage feed
- remote refresh

`Browse`

- local skeleton
- cached browse feed and category filter model
- remote refresh

`Search`

- local search UI
- recent searches from local storage adapter
- remote results after query

`Category`

- local layout shell
- cached category result set if available
- remote refresh

`Rankings`

- local layout shell
- cached rankings list if available
- remote refresh

### 4.6 Deep Link Entry

Phase 4 must already support:

- app open to home
- app open to browse
- app open to category
- app open to rankings

Phase 4 may defer:

- direct drama detail hydration from push payload
- play route deep-link playback bootstrap

Those can be completed later, but route parsing should exist now.

### 4.7 Native Design Constraints

Do not redesign Web while implementing Native shell.

Rules:

- preserve TinyTale's established visual system
- keep dark streaming app look
- local shell should feel like the same product, not a different app
- create motion and shell transitions that improve startup continuity

### 4.8 Shared UI Extraction During Phase 4

Move or mirror pure presentational elements into `packages/shared-ui`:

- buttons
- inputs
- badges
- empty states
- tabs
- poster cards
- skeleton blocks
- shell section headers

Do not move:

- screen-level fetch orchestration
- SSR entry components
- admin-specific UI

### 4.9 Tailwind CSS Sharing Strategy

Both `apps/web` (Next.js) and `apps/native-shell` (Vite) need Tailwind CSS. The configuration must be shared to prevent visual drift.

Recommended approach:

- create a shared Tailwind preset in `packages/shared-ui/tailwind.preset.ts`
- the preset exports the TinyTale design tokens: colors, fonts, spacing, border-radius
- both `apps/web/tailwind.config.ts` and `apps/native-shell/tailwind.config.ts` extend this preset
- each app adds its own content paths

Example preset:

```ts
// packages/shared-ui/tailwind.preset.ts
export default {
  theme: {
    extend: {
      colors: { /* TinyTale color system */ },
      fontFamily: { /* TinyTale fonts */ },
      borderRadius: { /* TinyTale shape tokens */ },
    }
  }
}
```

Example consumer:

```ts
// apps/native-shell/tailwind.config.ts
import preset from '@ui/tailwind.preset'
export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/shared-ui/src/**/*.{ts,tsx}'],
}
```

### 4.10 Service Worker Exclusion for Native Shell

The current project has `public/sw.js` for PWA caching. This must NOT be included in the Native Shell build.

Rules:

- `apps/native-shell` must not copy or register `sw.js`
- `apps/native-shell/public/` must not contain `sw.js`
- if a service worker is accidentally registered inside the Capacitor WebView, it can intercept local file requests and cause stale content or broken navigation
- `apps/web` retains `sw.js` for PWA support

Verification:

- after building `apps/native-shell`, confirm `dist/sw.js` does not exist
- confirm no `navigator.serviceWorker.register` call exists in Native Shell code

## 5. Deliverables

### Phase 3 Deliverables

- `apps/native-shell` bootstrapped
- existing Android project migrated with all customizations preserved
- local packaged build works
- Capacitor production config does not use remote HTML
- Android sync path targets Native Shell `dist`
- `LaunchCoordinator` exists

### Phase 4 Deliverables

- route shell exists
- home shell exists
- browse shell exists
- search shell exists
- category shell exists
- rankings shell exists
- local navigation frame exists

## 6. Work Breakdown by Owner

### Lead Agent

Responsible for:

- shell architecture
- launch sequencing
- routing contracts
- Capacitor prod/dev mode split
- package boundaries during shell extraction

### Product Agent

Responsible for:

- first-wave route inventory
- shell acceptance criteria
- startup behavior requirements
- route and deep-link priority

### Design Agent

Responsible for:

- launch overlay system
- shell motion rules
- skeleton system
- shared shell components

### Dev Agent

Responsible for:

- implementing Native shell app
- implementing first route frame
- integrating shared packages
- syncing Android packaging path

### Audit Agent

Responsible for:

- cold start verification
- route shell verification
- weak-network verification
- black-screen regression verification

## 7. Validation Checklist

### Phase 3

- local build generates `dist`
- Android production build uses local `dist`
- app opens without requesting remote HTML before first UI
- native splash handoff has no blank frame

### Phase 4

- home route opens into local shell
- browse route opens into local shell
- category route opens into local shell
- rankings route opens into local shell
- search opens instantly into local shell
- cached data can render before remote refresh

## 8. Risks

| Risk | Description | Mitigation |
|---|---|---|
| Packaging confusion | Android may still point at old asset strategy | separate Native Shell capacitor config and release scripts |
| Shell/data race | shell may wait on remote bootstrap by mistake | enforce local shell-first startup contract |
| Route duplication | route names and path builders may diverge from Web | centralize semantic route definitions in shared contract layer |
| Visual mismatch | Native shell may drift from Web brand language | Design Agent owns shell tokens and skeleton spec |

## 9. Rollback Points

- Rollback Point 5: Native Shell scaffold builds but is not wired to release
- Rollback Point 6: Capacitor dev startup uses Native Shell locally
- Rollback Point 7: production packaging switched to local assets
- Rollback Point 8: first-wave local shell screens available

Each rollback point must be a separate commit or PR boundary.

## 10. Exit Criteria

Phase 3-4 is complete only if:

- production Native app startup is local-package based
- first visible app UI is local shell, not remote HTML
- user can enter core browse routes through the local shell
- black startup period caused by remote page loading is eliminated

## 11. Next Documents

After this document, the next required documents are:

- [NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_5_8_TASKS.md)
- [NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PLAYBACK_REFACTOR.md)
- [NATIVE_LOCAL_SHELL_AUTH_STORAGE_DESIGN.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_AUTH_STORAGE_DESIGN.md)
- [NATIVE_LOCAL_SHELL_TEST_ACCEPTANCE_PLAN.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_TEST_ACCEPTANCE_PLAN.md)

