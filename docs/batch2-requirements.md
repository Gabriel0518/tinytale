# Batch 2 Requirements — TinyTale Frontend Fixes

**Author**: Product Agent
**Date**: 2025-02-17
**Status**: Ready for Design + Dev

---

## Task 1: Category Page Overhaul (P0)

**Problem**: `/src/app/category/page.tsx` uses mock data and has no dynamic routing — cards are not clickable.

**Approach**: Refactor to use `useSearchParams()` with `?category=slug` pattern (simpler, no file move needed). Replace mock data with real API calls.

**Files to modify**:
- `/src/app/category/page.tsx`

**Reference**: PRD-category-search.md Section 1; UI-category-search.md Section 1; browse/page.tsx (API pattern)

**Acceptance criteria**:
1. Page fetches categories via `categoriesApi.getAll()` and dramas via `dramasApi.getAll({ category })` — same pattern as browse/page.tsx
2. Each DramaCard is wrapped in `<Link href={/drama/${drama._id}}>` for navigation
3. Loading state shows skeleton grid; error state shows retry message; empty state shows "No dramas found"
4. Category selection updates `selectedCategory` state and re-fetches dramas
5. No mock data imports remain

---

## Task 2: Profile Page Navbar (P1)

**Problem**: `/src/app/user/profile/page.tsx` uses an inline `<nav>` instead of the shared `<Navbar />` component.

**Files to modify**:
- `/src/app/user/profile/page.tsx`

**Reference**: UI-design.md Section 2.4 (User Profile layout)

**Acceptance criteria**:
1. Inline `<nav>` element is removed
2. `<Navbar />` component is imported from `@/components/features/Navbar` and rendered
3. Visual output matches other user/* pages (favorites, history, wallet)

---

## Task 3: Player Page Alert Replacement (P1)

**Problem**: `alert()` call on line ~81 of the player page blocks the UI thread. PaymentFailedModal is too heavy for this use case.

**Files to modify**:
- `/src/app/drama/[id]/play/[episodeId]/page.tsx`

**Reference**: UI-detail-play.md Section 4.3 (Error states: "toast提示")

**Acceptance criteria**:
1. `alert()` call is replaced with an inline error banner (red background, white text)
2. Banner appears at the top of the player area and auto-dismisses after 4 seconds
3. No modal or external toast library required — a simple `useState`-driven `<div>` is sufficient
4. Banner does not block video playback controls

---

## Task 4: Homepage Quick Fixes (P2)

**Problem**: "More Info" button is not clickable; hero height is shorter than spec; copyright year is hardcoded.

**Files to modify**:
- `/src/app/page.tsx`

**Reference**: UI-design.md Section 2.1 (Hero: 80vh desktop); PRD-frontend.md Section 2.1

**Acceptance criteria**:
1. "More Info" button navigates to `/drama/${heroDrama._id}` via `<Link>` or `router.push()`
2. Hero section class changes from `md:h-[70vh]` to `md:h-[80vh]`
3. Footer copyright changes from hardcoded `2024` to `{new Date().getFullYear()}`

---

## Task 5: Design Token Alignment (P2)

**Problem**: Login and register pages use hardcoded hex/gray values instead of the design tokens defined in `tailwind.config.ts`.

**Files to modify**:
- `/src/app/auth/login/page.tsx`
- `/src/app/auth/register/page.tsx`

**Reference**: UI-design.md Section 4 (Color System); tailwind.config.ts `colors.bg.*`

**Token mapping**:
| Current class | Replace with |
|---|---|
| `bg-[#141414]` | `bg-bg-primary` |
| `border-gray-700` | `border-white/10` |
| `bg-gray-900` | `bg-bg-secondary` |
| `bg-gray-800` | `bg-bg-elevated` |

**Acceptance criteria**:
1. All four replacements applied in both login and register pages
2. No visual regression — colors should match since tokens map to the same hex values
3. No hardcoded `#141414`, `gray-900`, `gray-800`, or `gray-700` remain in these two files

---

## Task 6: Episode Grid Fix (P2)

**Problem**: Episode grid on detail page shows 2 columns on mobile; design spec calls for 3 columns.

**Files to modify**:
- `/src/app/drama/[id]/page.tsx`

**Reference**: UI-detail-play.md Section 1.2 ("手机: 3列"); UI-design.md Section 2.2 ("3列 Mobile")

**Acceptance criteria**:
1. Episode grid base class changes from `grid-cols-2` to `grid-cols-3`
2. Tablet and desktop breakpoints remain unchanged

---

## Task 7: Navbar Mobile Menu Fix (P3)

**Problem**: Mobile menu stays open after tapping a link — user must manually close it.

**Files to modify**:
- `/src/components/features/Navbar.tsx`

**Reference**: General UX best practice (mobile nav auto-close on navigation)

**Acceptance criteria**:
1. Every `<Link>` inside the mobile menu has `onClick={() => setIsMenuOpen(false)}`
2. Menu closes immediately on link tap
3. Desktop nav is unaffected
