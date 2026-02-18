# TinyTale Frontend Audit Report

> Audit Date: 2026-02-17
> Scope: Client-side frontend pages (19 pages)
> Status: Complete

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 7 | Blockers: auth bypass, broken flows, security issues |
| P1 | 41 | Functional bugs: broken buttons, missing API calls, type safety |
| P2 | 55 | Visual/UX: accessibility, responsive, inconsistent styles |
| P3 | 25 | Optimization: performance, SEO, code quality |
| **Total** | **128** |

---

## P0 — Blockers

### P0-01 Homepage SEO — No Server-Side Rendering
- Page: All Pages
- Category: SEO/Performance
- Location: All `page.tsx` line 1
- Description: All pages are `'use client'` with data fetched in `useEffect`. Zero SSR — crawlers see empty HTML shells. Severely impacts SEO, FCP, and LCP.
- Suggestion: Use Next.js 14 server components for data fetching. Keep interactive parts as client components.

### P0-02 Login — Facebook Login Bypasses Auth
- Page: Login
- Category: Security
- Location: `src/app/auth/login/page.tsx:52-54`
- Description: `handleFacebookLogin` navigates directly to `/user/profile` without any authentication. Sends unauthenticated user to a protected page.
- Suggestion: Implement real Facebook OAuth or remove the button. Show "Coming soon" toast instead.

### P0-03 Reset Password — Verification Code Lost Between Steps
- Page: Reset Password + Verify
- Category: Security
- Location: `src/app/auth/reset-password/page.tsx:59` + `verify/page.tsx:99`
- Description: Code is verified on step 1 but never passed to step 2. The verify page calls `resetPassword(email, "", newPassword)` with an empty code. Either always fails or bypasses code validation.
- Suggestion: Pass the verified code via query param, sessionStorage, or a server-issued reset token.

### P0-04 Reset Password Verify — Direct URL Access Bypass
- Page: Reset Password Verify
- Category: Security
- Location: `src/app/auth/reset-password/verify/page.tsx:72`
- Description: Email is read from URL query param with no validation. Anyone can navigate to `/auth/reset-password/verify?email=victim@example.com` and attempt password reset.
- Suggestion: Require proof of code verification (a token) to access this page.

### P0-05 Drama Detail — Favorite Toggle API Call Inverted
- Page: Drama Detail
- Category: Bug
- Location: `src/app/drama/[id]/page.tsx:101-111`
- Description: `toggleFavorite` reads `isFavorited` after `setIsFavorited(!isFavorited)`, but React state is async. The API call is always the opposite of user intent.
- Suggestion: Capture new value before setting state: `const newVal = !isFavorited; setIsFavorited(newVal); if (newVal) addFavorite() else removeFavorite()`.

### P0-06 Video Player — Locked Episodes Never Checked Against Unlock History
- Page: Video Player
- Category: Bug
- Location: `src/app/drama/[id]/play/[episodeId]/page.tsx:49-56`
- Description: All non-free episodes are always locked regardless of whether user has already unlocked them. Even paid users see the lock screen every time.
- Suggestion: Call an API endpoint to check user's unlock status for the episode.

### P0-07 Settings — Danger Zone Always Visible
- Page: Settings
- Category: Bug
- Location: `src/app/user/settings/page.tsx:439-443`
- Description: "Delete Account" section renders OUTSIDE the section conditionals — always visible regardless of active tab.
- Suggestion: Move inside `section === "security"` conditional or create a dedicated "account" section.

---

## P1 — Functional Bugs

### Homepage

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-01 | Category pills change visual state but never filter dramas | `page.tsx:17,40-45` | Filter dramas by `activeCategory` or remove pills |
| P1-02 | "My List" button has no onClick handler | `page.tsx:111-116` | Wire to favorites API |
| P1-03 | "Filters" button has no onClick handler | `page.tsx:143-148` | Implement or remove |
| P1-04 | `heroDrama.categories!.length` unsafe non-null assertion | `page.tsx:86` | Use optional chaining |

### Browse

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-05 | "Upcoming" status filter unimplemented — shows all dramas | `browse/page.tsx:70-76` | Add filter condition |
| P1-06 | `categoryParam` not in useEffect deps — URL changes ignored | `browse/page.tsx:36,47-67` | Add to dependency array |
| P1-07 | `getDramaBadge` uses hardcoded date `2024-09-01` | `browse/page.tsx:28` | Use relative date |

### Search

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-08 | Client-side search against only 50 dramas — incomplete results | `search/page.tsx:44,71-76` | Use backend search API |
| P1-09 | Loading state set/unset synchronously — never visible | `search/page.tsx:68,78` | Remove or use server-side search |
| P1-10 | Pagination only shows first 3 pages — can't reach page 4+ | `search/page.tsx:302-314` | Implement sliding window pagination |
| P1-11 | Search doesn't update URL — not shareable/bookmarkable | `search/page.tsx:59-79` | Use `router.push` with query params |

### Rankings

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-12 | Period selector (Daily/Weekly/Monthly) always sends hardcoded 'rating' | `rankings/page.tsx:38-52` | Pass `period` to API |
| P1-13 | "Most Collected" uses fake metric `viewCount/3` | `rankings/page.tsx:217` | Use real favorites count |

### Category

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-14 | Retry button is broken — sets same state value, React skips re-render | `category/page.tsx:150-155` | Use retry counter or callable function |
| P1-15 | URL doesn't sync with selected category | `category/page.tsx:13,19` | Update URL on category change |
| P1-16 | Multiple `any` type assertions bypass TypeScript safety | `category/page.tsx:25,39,45` | Use proper generic types |

### Drama Detail

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-17 | Favorite state never initialized from server | `drama/[id]/page.tsx:51` | Fetch favorite status on mount |
| P1-18 | No auth check before favorite/review actions — fails silently | `drama/[id]/page.tsx:104,116` | Check token, redirect to login if missing |
| P1-19 | Episode unlock never calls `coinsApi.unlock()` — bypasses payment | `drama/[id]/page.tsx:90-98` | Call unlock API after confirmation |
| P1-20 | Locked episodes can still play — no gate on videoUrl | `drama/[id]/page.tsx:180` | Don't set src for locked episodes |
| P1-21 | `useSearchParams()` without Suspense boundary | `drama/[id]/page.tsx:41` | Wrap in Suspense |
| P1-22 | Silent error swallowing on review/favorite failures | `drama/[id]/page.tsx:110,125` | Show error toast, rollback state |

### Video Player

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-23 | `isPlaying` desyncs from actual video state | `play/[episodeId]/page.tsx:99-109` | Use onPlay/onPause events |
| P1-24 | No error/not-found state for missing drama/episode | `play/[episodeId]/page.tsx:38-46` | Show "not found" message |
| P1-25 | Video has no `poster` attribute — shows black rectangle | `play/[episodeId]/page.tsx:232-240` | Add poster prop |
| P1-26 | Custom controls don't work on mobile (mouse events only) | `play/[episodeId]/page.tsx:229-230` | Add touch events + auto-hide timeout |
| P1-27 | No next/previous episode navigation | `play/[episodeId]/page.tsx:238` | Add nav buttons + auto-advance |
| P1-28 | Watch history never recorded | `play/[episodeId]/page.tsx` (entire) | Call `userApi.addHistory()` |
| P1-29 | Fullscreen hides custom controls (requested on video, not container) | `play/[episodeId]/page.tsx:131-139` | Request fullscreen on container div |

### Auth Pages

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-30 | Register Facebook button has no onClick — dead button | `register/page.tsx:226-234` | Implement or remove |
| P1-31 | All auth catch blocks use `err: any` | Multiple files | Use `catch (err: unknown)` |
| P1-32 | Register page has no `<label>` elements at all | `register/page.tsx:96-176` | Add labels with htmlFor |
| P1-33 | Login labels not associated with inputs (no htmlFor/id) | `login/page.tsx:94,116` | Add htmlFor/id pairs |

### User Pages

| ID | Description | Location | Suggestion |
|----|-------------|----------|------------|
| P1-34 | Coins/Purchases/Subscription auth guard redirects during hydration | Multiple files | Check `loading` from useAuth |
| P1-35 | History remove/clear are client-only — never persisted to backend | `history/page.tsx:81-88` | Call backend API |
| P1-36 | Settings preferences/sessions/2FA/connected accounts are all local state only | `settings/page.tsx` | Wire to API endpoints |
| P1-37 | Settings auth guard calls router.push during render (not in useEffect) | `settings/page.tsx:81-84` | Move to useEffect |
| P1-38 | Subscription VIP expiry hardcoded to 365 days regardless of plan | `subscription/page.tsx:79` | Use `selected.duration` |
| P1-39 | Profile WalletTab uses hardcoded mock transactions | `profile/page.tsx:22-27` | Fetch from API |
| P1-40 | Coins sidebar/settings sidebar don't stack on mobile | `coins/page.tsx:168`, `settings/page.tsx:143` | Add `flex-col lg:flex-row` |
| P1-41 | Navbar hamburger menu has no aria-label or aria-expanded | `Navbar.tsx:151-167` | Add accessibility attributes |

---

## P2 — Visual / UX Issues

### Accessibility (across pages)
- Missing `role="alert"` on error messages (login, register, reset-password, coins, settings)
- Missing `aria-label` on icon buttons (password toggles, search, notifications, back buttons, video controls)
- Missing `aria-expanded` on FAQ accordions, mobile menu
- Missing `aria-pressed`/`aria-selected` on filter buttons, plan selection
- Missing form labels on help page contact form, coins redeem input, settings inputs
- DramaCard uses `onClick` on `<div>` — not keyboard accessible (needs role/tabIndex)
- Modals (history clear, settings delete) lack focus trap, `role="dialog"`, `aria-modal`
- Star rating buttons have no accessible labels
- Breadcrumb nav needs `aria-label="Breadcrumb"`
- Video seek bar needs `aria-label`

### Responsive Design
- Coins package grid `grid-cols-3` too narrow on mobile → use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Purchases 12-column grid breaks on mobile → use card layout on small screens
- Settings sidebar doesn't collapse on mobile → add responsive navigation
- Footer `grid-cols-4` without responsive breakpoints on coins/purchases/settings/subscription
- Help page sidebar hidden on mobile with no alternative navigation
- Video player episodes sidebar overlaps content on smaller screens

### Style Inconsistencies
- Auth pages use different accent colors: login=amber, register=red, verify=red
- Footer copyright year inconsistent: some "2025", some "2026" → use `new Date().getFullYear()`
- Footer markup duplicated across all pages with different content → extract shared Footer component
- Category page uses semantic tokens (bg-bg-primary) while help page uses raw Tailwind (bg-black)
- `next/image` imported but `<img>` used for drama covers across all pages

### UX Issues
- Drama Detail "Now Playing" overlay covers native video controls → position higher
- Drama Detail "Unlock All" shows `window.alert()` → disable or implement
- Drama Detail share button uses `alert()` → use toast
- Browse filter change doesn't reset scroll position
- Search "Relevance"/"Filter" buttons are non-functional
- Purchases "Download Invoice" button has no onClick
- Profile "Redeem Code" button has no onClick
- Subscription allows plan selection when already VIP (confusing)
- History progress bar uses `Math.random()` — changes on every render
- No redirect guard for authenticated users visiting auth pages
- No "return URL" handling after login/register
- No success feedback after password reset (immediate redirect)
- Help form "Sent" status never resets
- Help footer legal links don't scroll to top

### Performance
- All drama cover images use `<img>` instead of `next/image` (no lazy loading, no WebP, no responsive)
- Homepage hero uses CSS background-image — bypasses Next.js image optimization
- Computed arrays (trending, newReleases, filtered) not memoized
- Video player `handleTimeUpdate` fires ~4x/sec causing re-renders → throttle
- Subscription page fetches drama API just for decorative background images
- Help page injects `<style>` tag on every render → move to globals.css
- No shared data layer — every page independently fetches overlapping data

---

## P3 — Optimization

- Extract shared `Footer` component (duplicated ~70 lines × 10+ pages)
- Extract shared `getDramaBadge` utility (duplicated in browse + search with different logic)
- All pages lack page-specific metadata (title, description, OG tags)
- `hotSearchItems` and `trendingTags` in search page are hardcoded — should come from API
- Navbar notification badge count "3" is hardcoded
- Actor images use random picsum.photos — should use real actor photos
- Episode sidebar height calc `lg:h-[calc(56.25vw*0.5625)]` is unclear
- `handleEpisodeClick` calls `videoRef.load()` before React updates src → move to useEffect
- `searchParams` object in useEffect deps causes unnecessary re-fetches
- Token in video player useEffect deps may cause unnecessary re-fetches
- Register page has no nickname validation (length, allowed chars)
- Settings "Last changed 3 months ago" for password is hardcoded text
- Coins page duplicate SVG gradient definitions
- Price display doesn't enforce 2 decimal places (`$5` vs `$5.00`)
- `params.id` cast as `string` is unsafe — could be `string[]`

---

## Recommended Fix Priority

1. **P0 fixes first** — Security issues (auth bypass, password reset flow) and the favorite toggle inversion
2. **P1 functional bugs** — Broken buttons, missing API integrations, auth guards
3. **P2 accessibility** — Form labels, ARIA attributes, keyboard navigation
4. **P2 responsive** — Mobile layout fixes
5. **P3 optimization** — Shared components, memoization, SEO
