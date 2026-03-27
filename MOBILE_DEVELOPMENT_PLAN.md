# TinyTale Mobile App Development Plan

> **Target**: Android First | **Framework**: Capacitor (Hybrid) | **Timeline**: ~8 weeks
> **Confirmed**: Mobile version does NOT include Creator Platform entry

---

## Current State Analysis

| Item | Status |
|------|--------|
| Responsive Layout | Basic (Navbar has hamburger menu at `md:` breakpoint) |
| PWA Setup | None (no manifest.json, no service worker) |
| Bottom Navigation | None (desktop-style top nav only) |
| Touch Optimization | Minimal (no swipe gestures, small tap targets) |
| Native App Wrapper | None (no Capacitor/TWA/Cordova) |
| Video Player | Video.js + HLS (Cloudflare Stream) - works on mobile browsers |
| Creator Platform | Has `/creator` routes + Navbar entry - needs hiding on mobile |
| i18n | 7 languages supported (en, es, pt, id, zh, ja, hi) |

### Routes to Include in Mobile App

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/browse` | Browse dramas |
| `/search` | Search |
| `/rankings` | Rankings |
| `/category` | Category filter |
| `/drama/[id]` | Drama detail |
| `/drama/[id]/play/[episodeId]` | Video player |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/auth/reset-password` | Password reset |
| `/auth/verify-otp` | OTP verification |
| `/user/*` | User center (profile, coins, favorites, history, notifications, settings, subscription, purchases) |
| `/help` | Help center |
| `/about`, `/terms`, `/privacy`, `/cookies` | Legal pages |
| `/ref/[code]` | Referral link |

### Routes to EXCLUDE from Mobile App

| Route | Reason |
|-------|--------|
| `/creator/*` | Creator platform - confirmed excluded |
| `/affiliate/*` | Affiliate/promoter portal - desktop business feature |
| `/admin/*` | Admin panel - desktop only |

---

## Phase 1: Mobile UI/UX Optimization (Week 1-2)

> Priority: Make the existing web app mobile-first before wrapping as native

### 1.1 Bottom Tab Navigation Bar

Replace the mobile hamburger menu with a native-style bottom tab bar.

**Tab Structure (5 tabs):**

| Tab | Icon | Route | Label |
|-----|------|-------|-------|
| Home | `Home` | `/` | Home |
| Browse | `Compass` | `/browse` | Browse |
| Rankings | `Trophy` | `/rankings` | Rankings |
| My List | `Heart` | `/user/favorites` | My List |
| Profile | `User` | `/user/profile` | Me |

**Implementation:**
- New component: `src/components/mobile/BottomTabBar.tsx`
- Show only on mobile (`md:hidden`), fixed at bottom
- Active tab highlight with accent color
- Hide during video playback (fullscreen)
- Badge on Profile tab for unread notifications
- Add `safe-area-inset-bottom` padding for notched devices

### 1.2 Mobile Navigation Refactoring

**Navbar Changes:**
- Remove Creator (`/creator`) and Affiliate (`/affiliate`) from `navLinks` on mobile
- Implement `isMobile` detection hook: `src/hooks/usePlatform.ts`
- Slim down mobile navbar: logo + search icon + notification bell only
- Reduce navbar height from `h-20` to `h-14` on mobile
- Add `env(safe-area-inset-top)` padding

**New File: `src/hooks/usePlatform.ts`**
```typescript
export function usePlatform() {
  // Returns { isMobile, isApp, isAndroid, isIOS }
  // Detects Capacitor native context vs browser
}
```

### 1.3 Touch-Optimized Components

| Component | Changes |
|-----------|---------|
| DramaCard | Min tap target 44x44px, larger thumbnails on mobile grid |
| Buttons | Min height 44px on mobile, wider touch area |
| Episode List | Swipeable row actions, larger episode items |
| Search | Full-screen search overlay on mobile |
| Modals | Bottom sheet style on mobile (slide up from bottom) |
| Toast | Move above bottom tab bar |
| Tabs | Horizontally scrollable on mobile |

### 1.4 Mobile Layout Adjustments

**Home Page (`/`):**
- Full-width hero carousel (edge-to-edge)
- 2-column grid for drama cards (was 4-5 on desktop)
- Horizontal scroll for category rows (Netflix-style)
- Pull-to-refresh gesture

**Browse Page (`/browse`):**
- Sticky filter bar below navbar
- 2-column card grid
- Infinite scroll instead of pagination

**Drama Detail (`/drama/[id]`):**
- Cover image as full-width header (no side margins)
- Sticky "Watch Now" CTA button at bottom
- Collapsible description text
- Horizontal scrolling episode list
- Tab-based layout: Episodes | Comments | Related

**User Profile (`/user/profile`):**
- Card-based menu items (not list)
- VIP badge prominent display
- Quick action buttons (coins, subscription)

### 1.5 CSS/Tailwind Updates

**`tailwind.config.ts` additions:**
```typescript
theme: {
  extend: {
    spacing: {
      'safe-top': 'env(safe-area-inset-top)',
      'safe-bottom': 'env(safe-area-inset-bottom)',
      'safe-left': 'env(safe-area-inset-left)',
      'safe-right': 'env(safe-area-inset-right)',
    },
    height: {
      'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
    },
  }
}
```

**`globals.css` additions:**
```css
/* Safe area for notched devices */
html {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Bottom tab bar spacing */
.has-bottom-bar {
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}

/* Mobile smooth scroll */
.mobile-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

---

## Phase 2: Mobile Video Player Experience (Week 2-3)

> Goal: TikTok/ReelShort-style vertical video experience

### 2.1 Full-Screen Vertical Player

**Key Features:**
- Auto-enter fullscreen on play (portrait mode)
- Swipe up/down to navigate between episodes
- Tap to toggle controls visibility
- Double-tap left/right to seek -10s/+10s
- Long press for playback speed

**Implementation:**
- New component: `src/components/player/MobilePlayer.tsx`
- Uses existing `CloudflarePlayer` + `SimplePlayer` underneath
- Adds gesture layer on top

### 2.2 Gesture Controls

| Gesture | Action |
|---------|--------|
| Tap center | Toggle play/pause |
| Double-tap left | Rewind 10s |
| Double-tap right | Forward 10s |
| Swipe up | Next episode |
| Swipe down | Previous episode / minimize player |
| Swipe left/right | Seek (scrub) |
| Long press | Speed menu (1x, 1.25x, 1.5x, 2x) |
| Pinch | Zoom (aspect fit/fill) |

### 2.3 Mini Player / PiP

- Minimize player to floating mini-player while browsing
- Support Android Picture-in-Picture (PiP) via Capacitor plugin
- Mini player shows: thumbnail, title, play/pause, close

### 2.4 Player Paywall Optimization

- Mobile-optimized paywall overlay
- One-tap coin purchase flow
- "Watch with VIP" prominent CTA
- Price displayed in local currency

---

## Phase 3: PWA Implementation (Week 3-4)

> Required for Capacitor wrapper and standalone mobile web experience

### 3.1 Web App Manifest

**New File: `public/manifest.json`**
```json
{
  "name": "TinyTale - Short Drama Streaming",
  "short_name": "TinyTale",
  "description": "Watch premium short dramas anytime",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#141414",
  "theme_color": "#141414",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 3.2 Service Worker (App Shell Caching)

- Cache static assets (CSS, JS, fonts, icons)
- Cache API responses for offline browsing (drama list, categories)
- Network-first strategy for dynamic content
- Offline fallback page
- Use `next-pwa` or `workbox` integration

### 3.3 App Icons

Generate icon set from TinyTale logo:
- Android adaptive icons (foreground + background)
- Multiple sizes: 72, 96, 128, 144, 152, 192, 384, 512
- Maskable variant for Android adaptive icons

### 3.4 Splash Screens

- Dark background (#141414) + TinyTale logo centered
- Match brand identity
- Multiple resolutions for different Android devices

---

## Phase 4: Capacitor Android App (Week 4-6)

> Wrapping the Next.js web app as a native Android app

### 4.1 Capacitor Setup

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init TinyTale top.tinytale.app --web-dir=out

# Add Android platform
npm install @capacitor/android
npx cap add android

# Essential plugins
npm install @capacitor/app          # App lifecycle
npm install @capacitor/browser      # External links (Stripe checkout)
npm install @capacitor/haptics      # Haptic feedback
npm install @capacitor/keyboard     # Keyboard handling
npm install @capacitor/network      # Network status
npm install @capacitor/push-notifications  # Push notifications
npm install @capacitor/share        # Native share
npm install @capacitor/splash-screen     # Splash screen
npm install @capacitor/status-bar   # Status bar control
npm install @capacitor/preferences  # Local storage
```

### 4.2 Capacitor Configuration

**`capacitor.config.ts`**
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'top.tinytale.app',
  appName: 'TinyTale',
  webDir: 'out',
  server: {
    // Production: load from deployed web app
    url: 'https://tinytale.top',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: 'keys/tinytale-release.keystore',
      keystoreAlias: 'tinytale',
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#141414',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#141414',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### 4.3 Next.js Static Export Configuration

For Capacitor, need `output: 'export'` in next.config.mjs, OR use the live server URL approach:

**Recommended: Live Server Approach**
- Capacitor WebView loads `https://tinytale.top` directly
- No need to change Next.js build process
- Hot updates without app store release
- Same codebase serves web + app

**Alternative: Static Export (Offline-first)**
- Requires `output: 'export'` + SSG-compatible pages
- More work but better offline experience
- Would need significant refactoring of dynamic routes

**Decision: Use Live Server approach** (load tinytale.top in Capacitor WebView)

### 4.4 Native Bridge Layer

**`src/lib/capacitor-bridge.ts`** - Abstraction layer for native features:

```typescript
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';

// Feature flags for mobile app
export const mobileFeatures = {
  hideCreatorPlatform: true,   // Always hide on mobile
  hideAffiliate: true,         // Hide on mobile
  useBottomTabNav: true,       // Bottom tabs instead of hamburger
  enablePushNotifications: true,
  enableNativeShare: true,
  enableHaptics: true,
};
```

### 4.5 Deep Linking

Configure Android App Links:
- `tinytale.top/drama/*` opens in-app
- `tinytale.top/ref/*` opens for referral tracking
- Support for share URLs

**`android/app/src/main/AndroidManifest.xml` addition:**
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="tinytale.top" />
</intent-filter>
```

### 4.6 Android Specific Adjustments

| Feature | Implementation |
|---------|---------------|
| Status bar | Transparent overlay, dark icons |
| Navigation bar | Match app background (#141414) |
| Back button | Handle in-app navigation, confirm on exit |
| Splash screen | Custom dark splash with logo |
| Orientation | Lock to portrait (except video player) |
| Minimum API | Android 7.0 (API 24) |
| Target SDK | Android 14 (API 34) |

---

## Phase 5: Mobile-Specific Features (Week 5-6)

### 5.1 Push Notifications (Firebase + Capacitor)

**Notification Types:**
| Type | Trigger |
|------|---------|
| New Episode | Drama user follows has new episode |
| Coin Bonus | Daily login bonus, promotional offers |
| VIP Expiry | VIP subscription about to expire |
| Recommendation | Personalized drama recommendations |
| System | Account security, payment confirmation |

**Backend Changes:**
- New API: `POST /api/notifications/register-device` (store FCM token)
- New API: `DELETE /api/notifications/unregister-device`
- Firebase Admin SDK integration in tinytale-api

### 5.2 Native Share

Replace web share with native Android share:
- Share drama page links
- Share episodes with deep links
- Share referral codes
- Custom share sheet with app logo

### 5.3 Network Awareness

- Detect offline/online status
- Show offline banner when disconnected
- Queue actions (favorites, history) for sync when back online
- Reduce video quality on slow connections

### 5.4 Mobile Payment Optimization

- Stripe Mobile SDK integration for smoother checkout
- Google Pay integration via Stripe
- In-app coin purchase flow (no redirect to Stripe Checkout page)
- Payment sheet (bottom sheet) instead of redirect

### 5.5 Performance Optimizations

| Optimization | Description |
|-------------|-------------|
| Image lazy loading | Native `loading="lazy"` + intersection observer |
| Skeleton screens | Show content placeholders during load |
| Route prefetching | Prefetch likely next routes |
| Video preloading | Preload next episode while watching |
| Bundle optimization | Tree-shake unused desktop components |
| Font subsetting | Load only used character ranges |

---

## Phase 6: Creator Platform Exclusion (Week 1, continuous)

### 6.1 Implementation Strategy

**Conditional Navigation:**
```typescript
// In Navbar.tsx - filter navLinks based on platform
const filteredNavLinks = navLinks.filter(link => {
  if (isNativeApp() || isMobileView) {
    // Hide creator and affiliate on mobile
    return !['/creator', '/affiliate'].includes(link.href);
  }
  return true;
});
```

**Route Guard (optional):**
- Redirect `/creator/*` to home on mobile app
- Show "Available on desktop" message if user manually navigates

**Footer:**
- Remove Creator Hub link from mobile footer
- Remove Affiliate link from mobile footer

### 6.2 Files to Modify

| File | Change |
|------|--------|
| `src/components/features/Navbar.tsx` | Filter out creator/affiliate links on mobile |
| `src/components/features/Footer.tsx` | Remove creator/affiliate links on mobile |
| `src/app/creator/layout.tsx` | Add mobile redirect |
| `src/app/affiliate/layout.tsx` | Add mobile redirect |

---

## Phase 7: Testing & Release (Week 7-8)

### 7.1 Testing Matrix

| Category | Tests |
|----------|-------|
| Devices | Samsung Galaxy S23, Pixel 7, budget phones (Redmi Note 12) |
| Android Versions | API 24 (7.0) through API 34 (14) |
| Network | WiFi, 4G, 3G, offline |
| Browsers | Chrome, Samsung Internet, WebView |
| Screen Sizes | 5", 6.1", 6.7", tablets (if supported) |

### 7.2 Quality Checklist

- [ ] All touch targets >= 44x44px
- [ ] Video playback smooth on mid-range devices
- [ ] Safe area handled for notch/punch-hole
- [ ] Bottom tab bar visible and functional
- [ ] No Creator Platform entry visible anywhere
- [ ] Push notifications delivered and actionable
- [ ] Deep links open correct in-app content
- [ ] Back button behavior correct (no WebView trap)
- [ ] Payment flow completes successfully
- [ ] Offline state handled gracefully
- [ ] App startup < 3 seconds (splash to content)
- [ ] Scroll performance smooth (60fps)

### 7.3 Google Play Store Preparation

| Item | Details |
|------|---------|
| App Name | TinyTale - Short Drama Streaming |
| Package ID | `top.tinytale.app` |
| Category | Entertainment |
| Content Rating | Teen (13+) |
| Target Audience | 18-35 |
| Pricing | Free (with in-app purchases) |
| Store Listing | Screenshots (phone + 7" tablet), feature graphic, description in EN/ES/PT |
| Privacy Policy | `https://tinytale.top/privacy` |
| Support Email | From help center |
| Signing | Google Play App Signing |

### 7.4 Release Plan

1. **Internal Testing** - Team only (1 week)
2. **Closed Alpha** - 50-100 test users (1 week)
3. **Open Beta** - Public beta on Play Store (2 weeks)
4. **Production Release** - Full launch

---

## File Structure (New/Modified)

```
/tinytale/
  /android/                          # NEW - Capacitor Android project
    /app/
      /src/main/
        /AndroidManifest.xml        # Deep links, permissions
        /res/                       # Icons, splash screens
  /src/
    /components/
      /mobile/                      # NEW - Mobile-specific components
        /BottomTabBar.tsx          # Bottom navigation
        /MobileSearch.tsx          # Full-screen search overlay
        /BottomSheet.tsx           # Bottom sheet modal
        /PullToRefresh.tsx         # Pull to refresh
      /player/
        /MobilePlayer.tsx          # NEW - Mobile gesture player
        /MiniPlayer.tsx            # NEW - Floating mini player
      /features/
        /Navbar.tsx                # MODIFIED - Mobile slim version
        /Footer.tsx                # MODIFIED - Mobile layout
    /hooks/
      /usePlatform.ts             # NEW - Platform detection
      /useGesture.ts              # NEW - Touch gesture hooks
    /lib/
      /capacitor-bridge.ts        # NEW - Native bridge abstraction
      /push-notifications.ts      # NEW - FCM registration
  /public/
    /manifest.json                 # NEW - PWA manifest
    /icons/                        # NEW - App icons
    /sw.js                         # NEW - Service worker
  /capacitor.config.ts             # NEW - Capacitor config
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@capacitor/core": "^7.x",
    "@capacitor/app": "^7.x",
    "@capacitor/browser": "^7.x",
    "@capacitor/haptics": "^7.x",
    "@capacitor/keyboard": "^7.x",
    "@capacitor/network": "^7.x",
    "@capacitor/push-notifications": "^7.x",
    "@capacitor/share": "^7.x",
    "@capacitor/splash-screen": "^7.x",
    "@capacitor/status-bar": "^7.x",
    "@capacitor/preferences": "^7.x"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.x",
    "@capacitor/android": "^7.x"
  }
}
```

---

## Key Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| App Framework | Capacitor (not TWA) | Better native plugin ecosystem, more control over WebView, supports push notifications and deep links |
| Content Loading | Live Server (not static export) | Avoids major Next.js refactoring, enables instant content updates without app store release, keeps SSR benefits |
| Navigation | Bottom Tab Bar | Industry standard for content apps (Netflix, TikTok, YouTube), better thumb reachability |
| Creator Platform | Hidden via conditional rendering | Clean separation, same codebase, no route splitting needed |
| Video Player | Enhanced existing player + gesture layer | Reuse Video.js/HLS infrastructure, add mobile-native gestures on top |
| Payment | Stripe Mobile Elements (not IAP) | Consistent with web, avoids Google Play 15-30% cut on digital goods, Stripe handles Google Pay |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| WebView performance on low-end devices | Video stuttering, slow navigation | Performance testing on budget devices, reduce animations, lazy load |
| Google Play rejection (payment policy) | App removed from store | Ensure compliance with Google Play billing policy; digital content via web billing may need review |
| Deep link conflicts | Wrong content opens | Thorough testing of App Links verification, fallback handling |
| Push notification deliverability | Users miss updates | FCM with high-priority channels, notification categories |
| WebView cookie/auth issues | Users logged out randomly | Use Capacitor Preferences for token storage, bridge with web auth |

---

*Document created: 2026-03-26*
*Last updated: 2026-03-26*
