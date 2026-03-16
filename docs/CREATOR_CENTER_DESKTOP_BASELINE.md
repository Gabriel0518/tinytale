# Creator Center Desktop Baseline

## Scope

This document defines the active desktop implementation baseline for the TinyTale Creator Center.

Applicable routes:

- `/creator/dashboard`
- `/creator/dramas/*`
- `/creator/analytics/*`
- `/creator/contract`
- `/creator/settlements/*`
- `/creator/tickets/*`
- `/creator/settings/*`
- `/creator/notifications`

## Desktop Baseline

- Primary desktop design/development baseline: `1920 x 1080`
- Secondary responsive support: `1440px`, `1280px`, tablet, mobile
- Target visual outcome on `1920px`:
  - Modules should not feel oversized
  - Typography should read denser than the previous `1200px`-style layout
  - Content should make better use of wide desktop canvas

## Implementation Rules

- Do not cap core creator-center pages to `1200px` desktop content width unless the page is a focused workflow form.
- Prefer denser desktop spacing for shell pages:
  - smaller card paddings
  - tighter section gaps
  - reduced oversized headings
  - reduced KPI numeral scale where readability allows
- Shared creator shell should assume wide desktop space:
  - slimmer sidebar than the previous oversized variant
  - tighter top header height and controls
  - larger usable main-content width

## Exceptions

The following flows may keep narrower reading widths because they are step-based forms or state pages:

- creator application steps
- pending / status feedback pages
- other single-task approval flows

## Analytics Data Source Rules

Creator analytics pages must use backend APIs instead of frontend mock data:

- `GET /api/creator/analytics/revenue?range=7d|30d|90d`
- `GET /api/creator/analytics/audience?range=7d|30d|90d`
- `GET /api/creator/dramas/:id/analytics?range=7d|30d|90d`

Fallback to frontend mock snapshots is allowed only when the API request fails, so the page remains usable during partial backend rollout.

## Currency Rule

- Creator revenue, settlement, and audience monetization views use `USD` as the single display currency.
