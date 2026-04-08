# TinyTale Native Local Shell Auth and Storage Design

## Document Info

- Owner: `Lead Agent`
- Status: `Domain Design`
- Depends on:
  - [NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_REFACTOR_BLUEPRINT.md)
  - [NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md](/Users/gabriel/tinytale/docs/NATIVE_LOCAL_SHELL_PHASE_0_2_TASKS.md)
- Goal: define the long-term auth, session, storage, cache, and runtime-state architecture for both Web and Native.

## 1. Design Goal

The current auth and storage model is browser-oriented and too coupled to `localStorage`.

The target design must:

- support Web and Native with shared contracts
- support secure token storage for Native
- support shell-first startup
- support background session refresh
- avoid page-level direct storage access

## 2. Design Principles

- auth state is repository-driven, not page-driven
- secure data storage is separate from UI cache storage
- startup must not block on remote user bootstrap
- storage adapters must be platform-specific, contracts must be shared
- session recovery must be incremental and fault-tolerant

## 3. Storage Layers

### 3.1 Secure Store

Use for:

- access token
- refresh token
- session secret
- device-bound secure session markers

Web implementation:

- secure cookie or controlled browser storage fallback where needed

Native implementation:

- iOS Keychain
- Android Keystore-backed secure storage

### 3.2 KV Preferences Store

Use for:

- locale
- runtime settings
- feature-flag snapshots
- lightweight shell preferences

Web implementation:

- localStorage

Native implementation:

- Capacitor Preferences

### 3.3 Cache Store

Use for:

- home feed cache
- browse cache
- category cache
- rankings cache
- favorites snapshot
- history snapshot
- notifications snapshot
- playback progress

Web implementation:

- IndexedDB preferred

Native implementation:

- SQLite preferred

## 4. Package Model

Recommended package split:

```text
packages/shared-auth/src
  /contracts
    auth-repository.ts
    session-repository.ts
    token-store.ts
  /services
    login-service.ts
    register-service.ts
    logout-service.ts
    bootstrap-session.ts
    refresh-user.ts
  /react
    AuthProvider.tsx
    useAuth.ts

packages/shared-storage/src
  /contracts
    secure-store.ts
    kv-store.ts
    cache-store.ts
  /web
  /native

packages/shared-runtime/src
  /runtime-settings
  /bootstrap
```

## 5. Session Model

### 5.1 Session States

Session should support:

- `unknown`
- `guest`
- `restoring`
- `authenticated`
- `expired`
- `recoverable-error`

### 5.2 Startup Rules

On cold start:

1. app shell renders
2. secure token store is read
3. cached user shell state is restored if present
4. background `me` refresh validates session
5. UI moves to authenticated or guest state

### 5.3 Invalid Session Handling

If token refresh fails:

- clear secure token store
- preserve shell
- degrade to guest state
- retain safe non-sensitive cached content

Never:

- block startup on token validation
- crash or blank the shell because token refresh failed

## 6. Auth Contracts

### 6.1 TokenStore

Responsibilities:

- read token set
- write token set
- clear token set
- expose secure token metadata

### 6.2 SessionRepository

Responsibilities:

- bootstrap session state
- validate and refresh session
- expose session transitions
- coordinate logout cleanup

### 6.3 AuthRepository

Responsibilities:

- login
- register
- social login
- forgot password
- reset password
- fetch user profile

### 6.4 Social Login Adapters

The current app supports Google and Apple Sign-In via `native-social-login.ts`. This must be abstracted into platform-specific adapters behind a shared contract.

Contract:

```ts
interface SocialLoginAdapter {
  isAvailable(): Promise<boolean>;
  signIn(provider: 'google' | 'apple'): Promise<SocialLoginResult>;
  signOut(provider: 'google' | 'apple'): Promise<void>;
}

interface SocialLoginResult {
  idToken: string;
  provider: 'google' | 'apple';
  email?: string;
  displayName?: string;
}
```

Web adapter:

- Google: use `@react-oauth/google` or redirect flow
- Apple: use Apple JS SDK or redirect flow

Native adapter:

- Google: use `@capgo/capacitor-social-login` or `@codetrix-studio/capacitor-google-auth`
- Apple: use Capacitor Sign In with Apple plugin
- Both return `idToken` which the backend validates server-side

Integration:

- `shared-auth/services/login-service.ts` accepts a `SocialLoginAdapter` dependency
- `apps/web` provides the Web adapter
- `apps/native-shell` provides the Native adapter
- backend `/api/auth/social-login` endpoint remains the same for both

### 6.5 Payment Session Handling

Payment flows interact with auth state in several ways:

- coin purchase requires an authenticated session
- payment confirmation may arrive via webhook after the user has backgrounded the app
- subscription status changes must refresh the user profile

Rules:

- payment screens must verify auth state before initiating payment
- if auth expires during payment, the payment screen must not crash — show a re-login prompt
- after successful payment webhook, the next `me` refresh must pick up the updated coin balance
- VIP subscription changes must invalidate the entitlement cache in `shared-player`

## 7. Storage Contracts

### 7.1 `SecureStore`

```ts
interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

### 7.2 `KVStore`

```ts
interface KVStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
```

### 7.3 `CacheStore`

```ts
interface CacheStore {
  get<T>(namespace: string, key: string): Promise<T | null>;
  set<T>(namespace: string, key: string, value: T, ttlMs?: number): Promise<void>;
  remove(namespace: string, key: string): Promise<void>;
  clearNamespace(namespace: string): Promise<void>;
}
```

## 8. Current Code to Replace

The following patterns should be eliminated progressively:

- direct `localStorage.getItem('token')`
- direct `localStorage.getItem('user')`
- page-level `localStorage` writes for auth state
- mixed token persistence and UI state persistence in the same module

Current examples include:

- [src/lib/authContext.tsx](/Users/gabriel/tinytale/src/lib/authContext.tsx)
- [src/lib/runtime-settings.ts](/Users/gabriel/tinytale/src/lib/runtime-settings.ts)
- [src/lib/view-cache.ts](/Users/gabriel/tinytale/src/lib/view-cache.ts)
- [src/lib/playback-progress-cache.ts](/Users/gabriel/tinytale/src/lib/playback-progress-cache.ts)

## 9. Runtime Settings Model

Runtime settings should move into a repository pattern.

Suggested sections:

- notifications
- playback preferences
- locale
- feature flags
- device registration metadata

Required features:

- bootstrap from local store
- emit updates through provider or event bus
- sync user-editable settings to API when required
- separate local-only settings from remote-account settings

## 10. Cache Strategy

### 10.1 Cache Namespaces

Suggested namespaces:

- `home-feed`
- `browse-feed`
- `categories`
- `rankings`
- `favorites`
- `history`
- `notifications`
- `playback-progress`
- `stream-info`

### 10.2 TTL Guidance

| Namespace | TTL |
|---|---|
| `home-feed` | 5-15 min |
| `browse-feed` | 15-30 min |
| `categories` | 1-6 h |
| `rankings` | 30-60 min |
| `favorites` | session |
| `history` | session |
| `notifications` | short session cache |
| `playback-progress` | persistent |
| `stream-info` | seconds |

## 11. Recommended React Provider Topology

Recommended provider order:

```text
App
└─ QueryProvider
   └─ RuntimeProvider
      └─ I18nProvider
         └─ AuthProvider
            └─ AppShell
```

Reasoning:

- query cache must exist before auth bootstrap
- runtime settings and locale should be available during auth UI
- app shell should not own persistence directly

## 12. Security Rules

- access tokens must not be stored in plaintext browser-like storage on Native
- logout must clear secure tokens and sensitive cache
- user profile cache must not contain secrets
- payment/session identifiers must be treated as sensitive metadata

## 13. Acceptance Criteria

This design is successfully implemented only if:

- Web and Native both consume the same auth contracts
- Native uses secure storage for tokens
- session recovery does not block shell rendering
- invalid session degrades cleanly to guest mode
- runtime settings are managed through repository APIs
- no page reads or writes auth state directly from raw storage
- social login works on both Web and Native via platform-specific adapters
- payment screens handle auth expiry gracefully
- VIP/subscription changes propagate to entitlement cache

