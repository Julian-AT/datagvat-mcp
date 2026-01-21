---
phase: 17-fumadocs-workspace-restructuring
plan: 01
subsystem: documentation
tags: [fumadocs, workspace, mdx, nextjs, documentation-architecture]

# Dependency graph
requires:
  - phase: 16-documentation-polish-and-release-prep
    provides: High-quality polished documentation content across guides, tutorials, examples, and API reference
provides:
  - Two-workspace Fumadocs architecture separating learning content from API reference
  - Independent source.config.ts per workspace for customization
  - Unified navigation and i18n across both workspaces
  - Preserved URL structure (/docs/guides/*, /docs/api/*)
affects: [future-documentation-scaling, submodule-structure, multi-repo-docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fumadocs multiple() loader for workspace composition"
    - "API workspace with independent configuration at docs/content/api/"
    - "Subdirectory structure to preserve URL paths (api/api/ → /api/)"

key-files:
  created:
    - docs/content/api/source.config.ts
    - docs/.source/api/server.ts
    - docs/.source/api/browser.ts
    - docs/.source/api/dynamic.ts
  modified:
    - docs/source.config.ts
    - docs/lib/source.ts

key-decisions:
  - "Import generated API workspace from .source/api/server instead of virtual module path"
  - "API workspace includes lastModified plugin for consistency with root workspace"
  - "API content structured at api/api/ to preserve /api/ URL paths while maintaining workspace isolation"
  - "Both workspaces use shared mdxOptions (rehype plugins, transformers) from root config"

patterns-established:
  - "Workspace pattern: independent configs per content type, unified at loader level"
  - "URL preservation via subdirectory structure matching desired URL paths"
  - "Generated source files in .source/{workspace}/ for each workspace"

# Metrics
duration: 14min
completed: 2026-01-18
---

# Phase 17 Plan 01: Fumadocs Workspace Restructuring Summary

**Two-workspace architecture separating learning content (guides, tutorials) from API reference with independent configs and unified navigation**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-18T18:25:17Z
- **Completed:** 2026-01-18T18:39:21Z
- **Tasks:** 4
- **Files modified:** 6
- **Commits:** 4 (3 task commits + 1 fix commit)

## Accomplishments
- Clean separation of content types into logical workspaces
- API reference isolated with independent configuration
- URL structure preserved (/en/api/tools, /en/guides/setup)
- Unified navigation seamless across both workspaces
- i18n works correctly for both English and German in both workspaces
- Foundation for future scalability (submodules, multi-repo)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create API workspace with independent configuration** - `d69c730` (feat)
   - Created docs/content/api/ workspace
   - Moved API files from docs/api/ to content/api/
   - Added source.config.ts for API workspace

2. **Task 2: Configure workspace integration in root config** - `350dc7a` (feat)
   - Added workspaces section to root config
   - Defined 'api' workspace pointing to content/api/
   - Root workspace remains at content/docs

3. **Task 3: Integrate both workspaces with multiple() loader** - `da13e76` (feat)
   - Updated lib/source.ts to use multiple() loader
   - Combined root and api workspaces
   - baseUrl preserved at "/" for URL consistency

4. **Task 4: Test and fix workspace configuration** - `0522060` (fix)
   - Fixed import path to use .source/api/server instead of virtual module
   - Added lastModified plugin to API workspace config
   - Restructured API content to api/api/ to preserve /api/ URLs
   - Verified build success and URL routing

## Files Created/Modified

**Created:**
- `docs/content/api/source.config.ts` - Independent API workspace configuration with lastModified plugin
- `docs/.source/api/server.ts` - Generated API workspace server collection
- `docs/.source/api/browser.ts` - Generated API workspace browser collection
- `docs/.source/api/dynamic.ts` - Generated API workspace dynamic imports

**Modified:**
- `docs/source.config.ts` - Added workspaces section integrating API workspace
- `docs/lib/source.ts` - Updated to use multiple() loader combining both workspaces
- `docs/.source/server.ts` - Regenerated with workspace-aware imports
- `docs/.source/browser.ts` - Regenerated with workspace-aware imports

**Restructured:**
- API content moved: `docs/content/api/*.mdx` → `docs/content/api/api/*.mdx` (preserves /api/ URL path)

## Decisions Made

**Import strategy:** Used direct import from `.source/api/server` instead of virtual module path `fumadocs-mdx:collections/api/server`. The generated files in .source/ are the actual compiled collections, so importing them directly is more reliable and avoids TypeScript module resolution issues.

**Plugin consistency:** API workspace includes lastModified plugin matching root workspace configuration. This ensures consistent metadata across all documentation pages regardless of workspace, preventing TypeScript errors when pages are rendered.

**URL preservation via structure:** Placing API content at `docs/content/api/api/` preserves the `/api/` URL path segment. Fumadocs uses the directory structure within a workspace to determine URLs, so `api/tools.mdx` becomes `/api/tools`. This maintains backward compatibility while enabling workspace separation.

**Shared mdxOptions:** Both workspaces share rehype code options and transformers from root config. This provides consistent code highlighting and Markdown processing across all documentation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed module import path for API workspace**
- **Found during:** Task 4 (Build verification)
- **Issue:** TypeScript error "Cannot find module 'fumadocs-mdx:collections/api/server'". The virtual module path expected by plan didn't resolve correctly.
- **Fix:** Changed import to direct path `from "../.source/api/server"` referencing the actual generated file
- **Files modified:** docs/lib/source.ts
- **Verification:** Build succeeded, TypeScript compilation passed
- **Committed in:** 0522060 (Task 4 commit)

**2. [Rule 2 - Missing Critical] Added lastModified plugin to API workspace**
- **Found during:** Task 4 (Build verification)
- **Issue:** TypeScript error "Property 'lastModified' does not exist" when rendering API pages. Root workspace had lastModified plugin but API workspace didn't, causing type mismatch.
- **Fix:** Added lastModified plugin to API workspace config in source.config.ts
- **Files modified:** docs/content/api/source.config.ts
- **Verification:** Build succeeded, API pages render with last modified dates
- **Committed in:** 0522060 (Task 4 commit)

**3. [Rule 3 - Blocking] Restructured API content to preserve URL paths**
- **Found during:** Task 4 (URL verification)
- **Issue:** API pages were building at `/en/tools.html` instead of `/en/api/tools.html`. The flat structure in content/api/ caused URL flattening.
- **Fix:** Moved API content into `api/` subdirectory within workspace: `content/api/api/*.mdx`. Fumadocs uses directory structure for URLs, so this preserves the `/api/` path segment.
- **Files modified:** All API MDX files moved to subdirectory
- **Verification:** Build output shows correct paths: `/en/api/tools.html`, `/de/api/resources.html`, etc.
- **Committed in:** 0522060 (Task 4 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** All fixes necessary for correct operation. Import path adjustment required for TypeScript resolution. LastModified plugin required for type consistency. URL structure adjustment required to maintain backward compatibility. No scope creep.

## Issues Encountered

**Module resolution:** Fumadocs virtual module paths (`fumadocs-mdx:collections/{workspace}/server`) don't resolve correctly in TypeScript strict mode. Solution: Import generated files directly from `.source/{workspace}/` which are the actual compiled collections.

**URL path flattening:** Workspace content at flat structure loses path segments in URLs. Solution: Mirror desired URL structure in workspace directory layout. For `/api/` URLs, place content in `api/` subdirectory within workspace.

Both issues were straightforward to diagnose and fix based on generated file structure and Fumadocs path conventions.

## User Setup Required

None - no external service configuration required. This is purely architectural restructuring of existing documentation.

## Next Phase Readiness

**Ready for next phase:**
- Two-workspace architecture operational
- All documentation accessible via correct URLs
- Navigation unified and seamless
- i18n working across both workspaces
- Build pipeline generates both workspaces correctly
- Foundation for future workspace expansion (submodules, additional content types)

**No blockers or concerns.**

Architecture supports future scalability:
- Additional workspaces can be added following same pattern
- Each workspace can have independent build/deploy if needed
- Submodule structure possible (workspaces can reference external repos)
- Multi-language expansion maintainable per workspace

---
*Phase: 17-fumadocs-workspace-restructuring*
*Completed: 2026-01-18*
