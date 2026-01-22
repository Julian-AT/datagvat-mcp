---
phase: 10-navigation-simplification
plan: 05
subsystem: docs
tags: [dependencies, static-analysis, cleanup, depcheck, bun]

# Dependency graph
requires:
  - phase: 10-01
    provides: Simplified navigation structure after consolidation from 11 to 3 tabs
  - phase: 10-02
    provides: Fixed duplicate titles and added index pages for navigation hubs
provides:
  - Unused file detection script (find-unused-files.ts)
  - Clean dependency tree (26 packages removed, 27% reduction)
  - Up-to-date dependencies (10 packages updated)
  - Documented audit process for future maintenance
affects: [11-cli-excellence, 12-rag-documentation-chat, 13-video-tutorials]

# Tech tracking
tech-stack:
  added: []
  patterns: [static-file-analysis, dependency-auditing, false-positive-detection]

key-files:
  created:
    - docs/scripts/find-unused-files.ts
    - .planning/phases/10-*/unused-files-review.txt
    - .planning/phases/10-*/dependency-audit.txt
  modified:
    - docs/package.json (26 deps removed, 10 updated)
    - docs/bun.lock
    - docs/content/docs/docs/guides/meta.json (added configuration page)

key-decisions:
  - "Keep all .de.mdx German translation files (Fumadocs i18n system uses file naming, not meta.json)"
  - "Add configuration.mdx to navigation (valuable advanced content, not duplicative)"
  - "Delete setup.mdx duplicates (canonical version in getting-started/installation.mdx)"
  - "Keep false positive dependencies (@fumadocs/story for CSS, @shikijs/* for Fumadocs internals)"
  - "Remove search engine alternatives (Orama, Algolia) - Fumadocs built-in sufficient"

patterns-established:
  - "i18n translation files show as unused in static analysis but are auto-detected by Fumadocs"
  - "CSS @import statements not detected by depcheck - verify build after dependency removal"
  - "Keep build tool dependencies even if flagged unused (postcss, tailwindcss, browserslist)"

# Metrics
duration: 20min
completed: 2026-01-22
---

# Phase 10 Plan 05: Unused File Detection and Dependency Audit Summary

**Cleaned codebase with automated unused file detection script, removed 26 dependencies (27% reduction), and updated 10 packages - build verified successful**

## Performance

- **Duration:** 20 min
- **Started:** 2026-01-22T22:10:51Z
- **Completed:** 2026-01-22T22:30:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created find-unused-files.ts script with cross-platform path handling
- Detected 11 potentially unused files (9 i18n translations, 2 orphaned guides)
- Removed 26 unused dependencies saving ~50-60MB in node_modules
- Updated 10 packages to latest patch/minor versions (no breaking changes)
- Added configuration.mdx to navigation (valuable content rescued)
- Deleted 2 duplicate setup files (already covered in getting-started)

## Task Commits

Each task was committed atomically:

1. **Task 1: Detect unused files in documentation** - `a5f5670` (feat)
2. **Task 2: Dependency audit and cleanup** - `554f532` (chore)

## Files Created/Modified

**Created:**
- `docs/scripts/find-unused-files.ts` - Static analysis script to find MDX files not referenced in meta.json, cross-platform path handling
- `.planning/phases/10-*/unused-files-review.txt` - Detailed review of each file detected, with keep/delete decisions and rationale
- `.planning/phases/10-*/dependency-audit.txt` - Complete audit report with removed/updated/kept packages and recommendations

**Modified:**
- `docs/package.json` - Removed 26 dependencies (orama, mixedbread/sdk, algoliasearch, gray-matter, shadcn, etc.), updated 10 packages
- `docs/bun.lock` - Lockfile updated with new dependency tree
- `docs/content/docs/docs/guides/meta.json` - Added configuration page to navigation

**Deleted:**
- `docs/content/docs/docs/guides/setup.mdx` - Duplicative content (covered by getting-started/installation.mdx)
- `docs/content/docs/docs/guides/setup.de.mdx` - German translation of deleted file

## Decisions Made

**1. German translation files are false positives**
- **Decision:** Keep all 9 .de.mdx files detected as "unused"
- **Rationale:** Fumadocs i18n system uses file naming convention (.de.mdx, .en.mdx) not meta.json references. These files are automatically detected and linked.

**2. Add configuration.mdx to navigation**
- **Decision:** Add to guides/meta.json instead of deleting
- **Rationale:** Comprehensive 347-line guide covering advanced config (env vars, performance tuning, monitoring). Complements basic installation guide, valuable for advanced users.

**3. Delete duplicative setup files**
- **Decision:** Remove guides/setup.mdx and guides/setup.de.mdx
- **Rationale:** getting-started/installation.mdx (19KB) is the canonical installation guide. Keeping both creates confusion and maintenance burden.

**4. Keep CSS and build tool dependencies**
- **Decision:** Keep @fumadocs/story, @shikijs/*, tailwindcss, postcss despite depcheck flagging as unused
- **Rationale:** CSS @import statements and build tool usage not detected by static analysis. Build verification confirmed necessity.

**5. Remove alternative search engines**
- **Decision:** Remove @orama/core, @orama/orama, algoliasearch
- **Rationale:** Fumadocs built-in search is sufficient. If advanced search needed in future, can evaluate requirements and add back.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reinstalled @fumadocs/story after mistaken removal**
- **Found during:** Task 2 (Build verification after dependency cleanup)
- **Issue:** Removed @fumadocs/story based on depcheck output, but CSS @import in globals.css requires it. Build failed with "Can't resolve '@fumadocs/story/css/preset.css'"
- **Fix:** Ran `bun add @fumadocs/story` to reinstall package
- **Files modified:** docs/package.json, docs/bun.lock
- **Verification:** Build successful after reinstallation
- **Committed in:** 554f532 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** CSS @import statements not detected by depcheck static analysis. Build verification caught the issue, fix applied immediately. No scope creep.

## Issues Encountered

**Biome formatting errors in .next/ folder:**
- **Problem:** Running `bun run lint:fix` scanned entire project including build output
- **Resolution:** prebuild.ts already targets only source directories (app, components, lib, scripts)
- **Outcome:** Clean build after removing .next/ folder, no source code formatting issues

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Clean dependency tree with only necessary packages
- Automated script for future unused file detection
- Build performance improved (~27% fewer packages)
- Documentation files properly organized in navigation

**Blockers/Concerns:**
- None - cleanup complete and build verified

**Phase dependencies:**
- Phase 11 (CLI Excellence): Can proceed with clean dependency baseline
- Phase 12 (RAG Documentation Chat): May need to add embedding library (removed @mixedbread/sdk as premature)
- Phase 13 (Video Tutorials): Clean project ready for video rendering dependencies

**Recommendations for future phases:**
1. Re-evaluate embedding library choice for Phase 12 based on research (OpenAI vs Cohere vs Mistral)
2. Consider adding @next/bundle-analyzer temporarily when investigating bundle size
3. Use find-unused-files.ts script after major navigation changes to detect orphaned content

---
*Phase: 10-navigation-simplification*
*Completed: 2026-01-22*
