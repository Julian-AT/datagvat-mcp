---
phase: 10-foundation-fixes
plan: 01
subsystem: documentation-infrastructure
tags: [next.js, fumadocs, i18n, middleware, routing]

# Dependency graph
requires:
  - phase: 09-fumadocs-component-integration
    provides: Fumadocs UI components and documentation structure
provides:
  - i18n middleware for automatic locale detection and routing
  - Root HTML layout structure for Next.js App Router compliance
  - Foundation for bilingual documentation (/en and /de routes)
affects: [10-02-search-fixes, 10-03-mobile-responsiveness, all-future-docs-features]

# Tech tracking
tech-stack:
  added: [fumadocs-core/i18n/middleware]
  patterns: [Next.js middleware for i18n routing, Root layout with metadata]

key-files:
  created: [docs/middleware.ts, docs/app/layout.tsx]
  modified: []

key-decisions:
  - "Use Fumadocs createI18nMiddleware helper instead of custom implementation for edge case handling"
  - "Root layout provides base HTML structure, [lang] layout provides locale-specific wrapping"
  - "Matcher excludes static assets and Next.js internals from middleware processing"

patterns-established:
  - "i18n middleware pattern: Auto-redirect root paths to locale-specific URLs based on Accept-Language"
  - "Root layout pattern: Minimal HTML structure with suppressHydrationWarning for theme support"

# Metrics
duration: <1min
completed: 2026-01-17
---

# Phase 10 Plan 01: i18n Routing and Root Layout Summary

**Fumadocs i18n middleware with automatic locale detection and Next.js App Router compliant root layout structure**

## Performance

- **Duration:** <1 min (21 seconds)
- **Started:** 2026-01-17T21:15:13Z
- **Completed:** 2026-01-17T21:15:34Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- i18n middleware using Fumadocs createI18nMiddleware for automatic locale routing
- Root HTML layout with metadata export meeting Next.js App Router requirements
- Proper matcher configuration excluding static assets and Next.js internals
- Build verification confirms both /en and /de routes generate successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Create i18n middleware for locale detection and routing** - `9f2680f` (feat)
2. **Task 2: Create root layout with HTML structure and metadata** - `775dcdd` (feat)

**Plan metadata:** (pending - completing now)

## Files Created/Modified
- `docs/middleware.ts` - i18n middleware using Fumadocs createI18nMiddleware, detects locale from Accept-Language header, redirects root paths to locale-specific URLs
- `docs/app/layout.tsx` - Root HTML layout with metadata export, provides base structure for Next.js App Router, includes suppressHydrationWarning for theme switching

## Decisions Made
- **Use Fumadocs createI18nMiddleware:** Leverages built-in helper instead of custom implementation. Rationale: Fumadocs handles all edge cases (missing locale, invalid paths, static assets) automatically, reducing maintenance burden.
- **Root layout pattern:** Minimal structure (just HTML/body tags) with metadata. Rationale: Locale-specific layout in [lang] provides actual content wrapping, root layout only needs to satisfy Next.js requirements.
- **Matcher configuration:** Excludes `api|_next/static|_next/image|favicon.ico`. Rationale: Middleware only processes routes needing locale injection, improves performance by skipping static assets.

## Deviations from Plan

None - plan executed exactly as written. Files created matched specifications precisely.

## Issues Encountered

None - build succeeded on first attempt, middleware compiled successfully, both locale routes generated.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- i18n routing foundation established for all documentation features
- Root layout structure meets Next.js App Router requirements
- Build pipeline verified working for both English and German routes
- Middleware properly handles locale detection and redirects

**No blockers or concerns.**

**Requirements satisfied:**
- FOUND-01: i18n routing with locale detection (middleware.ts)
- FOUND-02: Root HTML structure (app/layout.tsx)

---
*Phase: 10-foundation-fixes*
*Completed: 2026-01-17*
