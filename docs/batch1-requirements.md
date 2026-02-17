# Batch 1 Development Requirements - Round 1

**Author:** Product Agent
**Date:** 2026-02-17
**Project:** TinyTale (ReelShort Web)

---

## Task 1: Design System Update (for Design Agent)

**Acceptance Criteria:**
- [ ] All design tokens from specs P-01, P-07, P-11, P-15 are consolidated into `tailwind.config.ts`
- [ ] No hardcoded color values remain in page files (all use Tailwind tokens)
- [ ] Font families are registered via `next/font` and exposed as CSS variables
- [ ] All keyframe animations are defined in `tailwind.config.ts` or `globals.css`
- [ ] Glassmorphism utility classes are available globally

**Design Spec Reference:** P-01, P-07, P-11, P-15, P-16-1, P-16-2

**Detailed Requirements:**

### 1.1 Color Tokens

Current `tailwind.config.ts` already defines some tokens. The following are MISSING and must be added:

| Token Name | Hex Value | Source Spec | Usage |
|---|---|---|---|
| `accent.gold` | `#FFD700` | P-11 (already exists) | VIP badges, gold accents |
| `accent.gold-warm` | `#F2B90D` | P-16-1 | Payment success warm gold |
| `accent.gold-classic` | `#D4AF37` | P-07, P-12, P-19 | Login gold accents, watchlist, subscription |
| `accent.plasma-red` | `#FF3B5C` | P-11 | User center primary |
| `accent.blue` | `#1978E5` | P-19 | Subscription modal primary |
| `bg.dark-gold` | `#221E10` | P-16-1 | Payment success background |
| `bg.surface` | `#1F1F1F` | P-08 (already `bg.secondary`) | Confirm alias |
| `social.hover` | `#2A2D35` | P-07 | Social button hover |
| `social.default` | `#24262D` | P-07 | Social button default |
| `error.glow` | `#DC2626` | P-16-2 | Payment failure red |

### 1.2 Font Families

| Font | Usage | Source Spec |
|---|---|---|
| `Playfair Display` | Headings, hero titles | P-07, P-12 |
| `Inter` | Body text (already configured as `--font-inter`) | P-07 |
| `Plus Jakarta Sans` | User center, watchlist body | P-11, P-12 |
| `Spline Sans` | Payment modals, modern display | P-16-1 |

Add to `tailwind.config.ts`:
```
fontFamily: {
  sans: ['var(--font-inter)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  display: ['Playfair Display', 'serif'],
  modern: ['Spline Sans', 'system-ui', 'sans-serif'],
}
```

### 1.3 Animations & Keyframes

| Animation Name | Definition | Source Spec |
|---|---|---|
| `shine` | `background-position: 200% center` over 3s linear infinite | P-15 (gold text shimmer) |
| `fade-in-up` | `y:20, opacity:0` -> `y:0, opacity:1` over 0.5s | P-07 (AuthCard entrance) |
| `glow-pulse` | `box-shadow` pulse between 0 and `0 0 15px rgba(242,185,13,0.3)` | P-16-1 (success icon) |
| `stroke-draw` | `stroke-dashoffset: 100` -> `0` over 0.6s | P-16-1 (checkmark SVG) |
| `shake` | translateX oscillation for login error | P-07 |

### 1.4 Glassmorphism Utilities

Add to `globals.css`:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-header {
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.gold-gradient-bg {
  background: linear-gradient(135deg, #F2B90D 0%, #D4AF37 50%, #FFD700 100%);
}

.gold-text-gradient {
  background: linear-gradient(90deg, #F2B90D, #FFD700, #D4AF37, #F2B90D);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gold-border-glow {
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
  border-color: #D4AF37;
}
```

### 1.5 Box Shadow Extensions

Add to `tailwind.config.ts` `extend.boxShadow`:
```
'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
'error-glow': '0 0 15px rgba(220, 38, 38, 0.3)',
```

---

## Task 2: Shared Navbar Unification (for Dev Agent)

**Acceptance Criteria:**
- [ ] All client-facing pages use the shared `<Navbar />` component from `/src/components/features/Navbar.tsx`
- [ ] No inline `<nav>` blocks remain in any page file
- [ ] Navbar supports `activePath` prop to highlight the current page link
- [ ] Navbar supports authenticated state (show user avatar + coins vs Sign In/Get Started)
- [ ] Navbar supports `variant` prop for pages that need transparent/overlay style (e.g., homepage hero)

**Design Spec Reference:** P-01 (Header), P-02 (Header), P-04 (HeaderNav), P-12 (Header)

**Detailed Requirements:**

### 2.1 Files That Need Navbar Replacement

The following 6 page files contain inline `<nav>` blocks that must be replaced with `<Navbar />`:

| File | Line Range | Active Link | Notes |
|---|---|---|---|
| `/Users/gabriel/tinytale/src/app/page.tsx` | Lines 41-82 | "Home" | Has search icon link, Sign In, Get Started |
| `/Users/gabriel/tinytale/src/app/browse/page.tsx` | Lines 55-90 | "Browse" | Has search icon, Sign In only (no Get Started) |
| `/Users/gabriel/tinytale/src/app/rankings/page.tsx` | Lines 39-~75 | "Rankings" | Same pattern as browse |
| `/Users/gabriel/tinytale/src/app/search/page.tsx` | Lines 47-~80 | None | Same pattern |
| `/Users/gabriel/tinytale/src/app/drama/[id]/page.tsx` | Lines 73-105 | None | Same pattern |
| `/Users/gabriel/tinytale/src/app/user/coins/page.tsx` | Lines 105-119 | None | Simplified version (only Logo + Profile link) |

### 2.2 Required Navbar Props

The shared Navbar must support these props to cover all current use cases:

```typescript
interface NavbarProps {
  activePath?: string;           // Highlights the matching nav link (e.g., "/", "/browse", "/rankings")
  variant?: 'default' | 'transparent'; // 'transparent' for homepage hero overlay
  showSearch?: boolean;          // Whether to show the search input (default: true)
  showAuthButtons?: boolean;     // Whether to show Sign In / Get Started (default: true)
  className?: string;            // Additional classes
}
```

### 2.3 Authenticated State

The current Navbar only shows "Sign In" / "Get Started". Per specs P-02, P-04, P-11, P-12, the authenticated navbar should show:
- Coin balance with gold coin icon + "ADD" button (links to `/user/coins`)
- Notification bell icon
- User avatar (links to `/user/profile`)

This requires reading auth state from `useAuth()` context.

### 2.4 Navigation Links

Standardize to: Home (`/`), Browse (`/browse`), Rankings (`/rankings`)

The current shared Navbar at `/Users/gabriel/tinytale/src/components/features/Navbar.tsx` uses "Categories" (`/category`) and "Dramas" (`/dramas`) which do not match the inline navbars. Unify to match the inline pattern.

---

## Task 3: Password Show/Hide Toggle (for Dev Agent)

**Acceptance Criteria:**
- [ ] Login page password field has a clickable eye icon to toggle visibility
- [ ] Register page password AND confirm password fields both have eye icon toggles
- [ ] Icon switches between "eye" (visible) and "eye-off" (hidden) states
- [ ] Toggle does not trigger form submission
- [ ] Input type switches between `password` and `text`
- [ ] Focus state on the input is not disrupted when toggling

**Design Spec Reference:** P-07 Section 2 Module B, P-08 Section 2 Module B

**Detailed Requirements:**

### 3.1 Login Page (`/Users/gabriel/tinytale/src/app/auth/login/page.tsx`)

**Current state:** Line 86-93 has a plain `<input type="password">` with no toggle.

**Required changes:**
- Add state: `const [showPassword, setShowPassword] = useState(false)`
- Wrap the password input in a `relative` container
- Add an icon button positioned `absolute right-3 top-1/2 -translate-y-1/2`
- Icon: Use Lucide React `Eye` / `EyeOff` icons (already in project dependencies)
- Input type: `type={showPassword ? "text" : "password"}`
- Button must have `type="button"` to prevent form submission
- Icon color: `text-gray-500 hover:text-gray-300`
- Icon size: 20px (`size={20}`)

### 3.2 Register Page (`/Users/gabriel/tinytale/src/app/auth/register/page.tsx`)

**Current state:** Lines 100-110 (password) and 113-121 (confirm password) are plain `<input type="password">` with no toggles.

**Required changes:**
- Add two states: `showPassword` and `showConfirmPassword`
- Apply the same eye icon toggle pattern to BOTH fields
- Each field toggles independently

### 3.3 Interaction Behavior (from P-07 spec)

- The toggle icon sits inside the input field, right-aligned
- On focus, the input border glows gold (`gold-border-glow` class from Task 1) per P-07 spec, but current implementation uses `focus:border-red-600` -- keep the current red focus for now (gold focus is a P2 visual polish item)
- The icon should have `cursor-pointer` and a subtle hover transition

---

## Task 4: Card Status Badges (for Dev/Design Agent)

**Acceptance Criteria:**
- [ ] All badge types from specs are defined with consistent colors
- [ ] Badge component supports all required variants
- [ ] Badges render at the correct position on DramaCard (top-left corner)
- [ ] Badge colors match the spec exactly
- [ ] VIP badge has a distinct gold/premium style

**Design Spec Reference:** P-02 Section 3, P-04 Section 4.1, P-12 Section Module 3

**Detailed Requirements:**

### 4.1 Badge Types and Colors

Consolidated from all specs:

| Badge Type | Background | Text Color | Source |
|---|---|---|---|
| `HOT` | `bg-red-600` | `text-white` | P-02, P-04 |
| `NEW` | `bg-blue-600` | `text-white` | P-02, P-04, P-12 |
| `VIP` | `bg-gradient-to-r from-amber-500 to-yellow-600` | `text-black` | P-02, P-04, P-12 |
| `Completed` | `bg-gray-600` | `text-white` | P-02, P-12 |
| `Ongoing` | `bg-green-600` | `text-white` | P-02, P-12 |
| `Coming Soon` | `bg-purple-600` | `text-white` | P-02 |

### 4.2 Current Badge Component Gap Analysis

The existing Badge at `/Users/gabriel/tinytale/src/components/ui/Badge.tsx` supports: `default`, `success`, `warning`, `error`, `gold`. It does NOT support:
- `hot` variant (red, distinct from `error`)
- `new` variant (blue)
- `vip` variant (gold gradient, not just gold background)
- `completed` variant (gray)
- `ongoing` variant (green, similar to `success` but semantically different)
- `coming-soon` variant (purple)

**Action:** Add these variants to the Badge component.

### 4.3 DramaCard Integration

The existing DramaCard at `/Users/gabriel/tinytale/src/components/features/DramaCard.tsx` does NOT render any status badges. The `Drama` type needs a `tags` or `status` field.

**Placement rules (from P-02, P-04):**
- Badge position: top-left corner of the card poster (`absolute left-2 top-2`)
- If a card has both a status badge (Ongoing/Completed) AND a tag badge (HOT/NEW), show the tag badge on top-left and status badge on bottom-left
- VIP badge: top-right corner (opposite side from HOT/NEW)
- Rating badge already exists at top-left -- move it to top-right if a status badge is present, or keep both with a small gap

### 4.4 Data Source

Per P-02 API spec, the drama list API returns:
```json
{ "tags": ["HOT", "VIP", "NEW"] }
```
And per P-04:
```typescript
status: "Ongoing" | "Completed" | "New" | "Hot"
badge?: "HOT" | "NEW" | null
```

The DramaCard should accept both `tags: string[]` and `status: string` from the Drama type.

---

## Task 5: Payment Flow Fix (for Dev Agent)

**Acceptance Criteria:**
- [ ] PaymentSuccessModal shows transaction ID, gold amount, and updated balance
- [ ] PaymentSuccessModal has "Start Watching" and "Back to Store" action buttons
- [ ] PaymentSuccessModal has success checkmark animation (SVG stroke draw)
- [ ] PaymentFailedModal shows error reason and copyable transaction/error ID
- [ ] PaymentFailedModal has retry button with rotating refresh icon on hover
- [ ] PaymentFailedModal has "Contact Support" button linking to help center
- [ ] VipSubscriptionModal shows perks list, monthly vs annual pricing cards
- [ ] VipSubscriptionModal annual card has "Best Value" label and gold glow
- [ ] Coins page (`/user/coins`) replaces `alert()` calls with proper modals
- [ ] Modal open/close uses Framer Motion scale + fade animation

**Design Spec Reference:** P-16-1, P-16-2, P-19

**Detailed Requirements:**

### 5.1 PaymentSuccessModal Gaps

**Current file:** `/Users/gabriel/tinytale/src/components/features/PaymentSuccessModal.tsx`

**Missing per P-16-1 spec:**

| Feature | Spec Requirement | Current State |
|---|---|---|
| Transaction ID | Display `transactionId` in `font-mono` | Not present |
| Updated balance | Show `newBalance` with gold styling | Not present |
| Start Watching button | Gold gradient, links to player | Only has generic "Continue" |
| Back to Store button | Transparent border secondary action | Not present |
| Success icon animation | SVG stroke-draw + glow pulse | Static Lucide icon |
| Glass panel background | `backdrop-blur` on modal container | Uses standard Modal |

**Required new props:**
```typescript
interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount?: number;
  coins?: number;
  transactionId?: string;    // NEW
  newBalance?: number;       // NEW
  type?: "coins" | "subscription";
  onNavigate?: (target: 'player' | 'store') => void;  // NEW
}
```

### 5.2 PaymentFailedModal Gaps

**Current file:** `/Users/gabriel/tinytale/src/components/features/PaymentFailedModal.tsx`

**Missing per P-16-2 spec:**

| Feature | Spec Requirement | Current State |
|---|---|---|
| Transaction/Error ID | Copyable ID with Clipboard API | Not present |
| Error icon glow | Red `shadow-glow` effect | No glow |
| Retry icon animation | Refresh icon rotates 180deg on hover | No icon animation |
| Contact Support button | Links to help center | Not present |
| Toast on copy | Show toast when ID is copied | Not present |

**Required new props:**
```typescript
interface PaymentFailedModalProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage?: string;
  transactionId?: string;    // NEW
  onContactSupport?: () => void;  // NEW
}
```

### 5.3 VipSubscriptionModal Gaps

**Current file:** `/Users/gabriel/tinytale/src/components/features/VipSubscriptionModal.tsx`

**Missing per P-19 spec:**

| Feature | Spec Requirement | Current State |
|---|---|---|
| Perks list | 4-6 perk items with icons (Ad-free, 4K, Early Access, etc.) | Not present |
| Background layer | Blurred movie poster grid behind modal | Not present |
| Hero header | Premium gradient header with star badge | Simple crown icon |
| Annual card gold glow | `gold-glow` box-shadow on recommended plan | Only border highlight |
| "Best Value" label | Capsule label on annual plan | Shows "Most Popular" on quarterly |
| Payment methods | Show Stripe/PayPal/Apple Pay icons | Not present |
| Subscription disclaimer | Legal text at bottom | Only "Cancel anytime. Terms apply." |
| Monthly equivalent | "Equivalent to $8.33/month" on annual | Not present |

**Plan structure should match P-19:**
- Monthly: $9.99/month (Standard)
- Annual: $99.99/year with "Best Value" + "Save 16%" + "$8.33/month equivalent"

### 5.4 Integration Point: Coins Page

**File:** `/Users/gabriel/tinytale/src/app/user/coins/page.tsx`

Lines 81 and 87 use `alert()` for success/failure feedback. These must be replaced:
- On success (line 81): Open `PaymentSuccessModal` with `coins`, `amount`, `transactionId`, `newBalance`
- On failure (line 87): Open `PaymentFailedModal` with `errorMessage`, `transactionId`, `onRetry`

---

## Task 6: Homepage Carousel (for Dev Agent)

**Acceptance Criteria:**
- [ ] Homepage has a horizontal scrolling carousel for recommended dramas
- [ ] Carousel supports mouse drag and touch swipe
- [ ] Carousel shows left/right navigation arrows on desktop
- [ ] Each card shows poster, title, rating, category, year, episode count
- [ ] Cards have hover effect showing "Watch Now" and "+ My List" buttons
- [ ] Carousel is responsive: 2 cards on mobile, 3 on tablet, 5 on desktop
- [ ] Data comes from `GET /api/videos/recommendations` (or existing `dramasApi.getFeatured()`)

**Design Spec Reference:** P-01 Section 1 (HomeCarousel)

**Detailed Requirements:**

### 6.1 Current Homepage State

**File:** `/Users/gabriel/tinytale/src/app/page.tsx`

The homepage currently has:
- Lines 84-118: Hero banner (static, shows first drama)
- Lines 120-139: Category pills (horizontal scroll)
- Lines 141-164: Featured section (static grid, NOT a carousel)
- Lines 166-198: Trending section (static grid)

**What's missing:** A proper `HomeCarousel` component with horizontal scroll behavior. The "Featured" section (lines 141-164) is the closest candidate for conversion.

### 6.2 Carousel Component Requirements

**Component name:** `HomeCarousel`
**Location:** `/src/components/features/HomeCarousel.tsx`

**Props:**
```typescript
interface HomeCarouselProps {
  title: string;              // Section title (e.g., "Featured", "Trending")
  dramas: Drama[];            // Array of drama data
  className?: string;
}
```

**Scroll behavior:**
- Horizontal scroll with CSS `overflow-x: auto` and `scroll-snap-type: x mandatory`
- Each card has `scroll-snap-align: start`
- Hide scrollbar: `scrollbar-width: none` / `::-webkit-scrollbar { display: none }`
- Support mouse drag scrolling (track mousedown/mousemove/mouseup)
- Support touch swipe natively via overflow scroll

**Navigation arrows:**
- Left/right chevron buttons, positioned at vertical center of the carousel
- Only visible on desktop (`hidden md:flex`)
- Left arrow hidden when scrolled to start; right arrow hidden when scrolled to end
- On click: scroll by `containerWidth * 0.8` with `scroll-behavior: smooth`

### 6.3 Card Layout Within Carousel

Each card in the carousel should use the existing `DramaCard` component or a variant that shows:
- Poster image (aspect ratio 2:3)
- Title (truncated to 2 lines)
- Rating (star + number)
- Category tags
- Year
- Episode count
- Hover overlay: "Watch Now" button + "+ My List" button

**Card width:** Fixed per breakpoint
- Mobile: `calc(50vw - 24px)` (2 visible cards)
- Tablet (md): `calc(33.33vw - 24px)` (3 visible cards)
- Desktop (lg+): `calc(20vw - 24px)` (5 visible cards)

Gap between cards: `16px` (gap-4)

### 6.4 Data Source

Use the existing API call already in `page.tsx`:
```typescript
const featuredRes = await dramasApi.getFeatured();
```

The Featured section and Trending section should both be converted to `HomeCarousel` instances:
```jsx
<HomeCarousel title="Featured" dramas={featured.featured || []} />
<HomeCarousel title="Trending" dramas={dramas} />
```

### 6.5 Responsive Breakpoints

| Breakpoint | Cards Visible | Card Width | Arrow Visibility |
|---|---|---|---|
| < 640px (mobile) | 2 | ~45vw | Hidden |
| 640-1024px (tablet) | 3 | ~30vw | Visible |
| 1024-1280px (desktop) | 4 | ~23vw | Visible |
| > 1280px (xl) | 5 | ~18vw | Visible |

---

*End of Batch 1 Requirements*
