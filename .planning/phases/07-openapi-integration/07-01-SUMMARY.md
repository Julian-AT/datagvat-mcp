---
phase: 07-openapi-integration
plan: 01
subsystem: infra
tags: [openapi, fumadocs, bun, documentation, api-schema]

# Dependency graph
requires:
  - phase: 01-infrastructure-modernization
    provides: Bun runtime, professional script patterns with console output
provides:
  - OpenAPI schema download script with validation
  - Automated schema fetching in prebuild pipeline
  - Baseline data.gv.at OpenAPI schema (3.0, 49 endpoints)
affects: [07-02, api-reference-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Schema download scripts with version validation
    - Prebuild schema existence checks with auto-download
    - Professional console output with ✓/✗/⚠️ prefixes

key-files:
  created:
    - docs/scripts/download-openapi.ts
    - docs/data.gv.at-openapi.yaml
  modified:
    - docs/scripts/prebuild.ts

key-decisions:
  - "Commit OpenAPI schema to git for PR review and offline builds"
  - "Auto-download schema in prebuild if missing for CI reliability"
  - "Validate OpenAPI version (3.0 or 3.1 required for fumadocs-openapi)"
  - "Use Bun native fetch for consistency with project runtime"

patterns-established:
  - "Schema download with content validation (openapi field, version check)"
  - "Professional error messages with HTTP status codes"
  - "Prebuild step 0 ensures schema exists before build"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 7 Plan 1: OpenAPI Schema Download & Validation Summary

**Automated data.gv.at OpenAPI 3.0 schema fetching with validation, prebuild integration, and 49 documented endpoints**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T15:13:06Z
- **Completed:** 2026-01-22T15:16:04Z
- **Tasks:** 3
- **Files modified:** 2 created, 1 modified

## Accomplishments
- Created robust schema download script with OpenAPI version validation
- Downloaded baseline data.gv.at OpenAPI schema (3.0, 72 KB, 49 endpoints)
- Integrated schema validation into prebuild pipeline (step 0)
- Schema committed to git for PR review and offline builds
- Auto-download mechanism ensures schema always available at build time

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schema download script with validation** - `27acdd6` (feat)
2. **Task 2: Download schema to establish baseline** - `117a5e0` (feat)
3. **Task 3: Integrate schema download into prebuild pipeline** - `1d722b2` (feat)

## Files Created/Modified

### Created
- `docs/scripts/download-openapi.ts` - Fetches OpenAPI schema from qs.data.gv.at with validation
  - Validates OpenAPI version (3.0 or 3.1 required)
  - Professional console output with ✓/✗ prefixes
  - Error handling with clear messages
  - Exit code 1 on failure for CI integration
  - Uses Bun native fetch

- `docs/data.gv.at-openapi.yaml` - Downloaded OpenAPI schema
  - Version: OpenAPI 3.0.3
  - Endpoints: 49 operations across catalogues, datasets, distributions
  - Size: 72 KB
  - Descriptions: 319 present (good documentation quality)
  - Examples: None inline (will use fumadocs code sample generation)

### Modified
- `docs/scripts/prebuild.ts` - Added schema existence check as step 0
  - Checks if data.gv.at-openapi.yaml exists
  - Auto-downloads if missing
  - Runs before Biome checks to prevent build failures

## Schema Completeness Assessment

**Schema Quality: Good**

- **Endpoints:** 49 operations documented
- **Categories:** Catalogues, Datasets, Distributions, Metrics, Pipes
- **Descriptions:** 319 descriptions present throughout schema
- **Operation summaries:** Clear, concise (e.g., "List catalogues", "Get dataset")
- **Request/Response:** Well-documented with $refs to components
- **Version:** OpenAPI 3.0.3 (compatible with fumadocs-openapi)

**Limitations Noted:**

- **No inline examples:** Schema lacks `example:` fields
- **Impact on API-03:** Requirement for request/response examples will need fumadocs code sample generation
- **Mitigation:** fumadocs-openapi supports generateCodeSamples for programmatic example generation

**Language:** Descriptions are in English, operation summaries clear and professional.

**Recommendation:** Schema is production-ready for documentation generation. No blocking issues for Phase 7 Plan 2 (OpenAPI config update).

## Decisions Made

**1. Commit schema to git instead of gitignore**
- **Rationale:** Enables PR review of schema changes, supports offline builds, aligns with RESEARCH.md Pitfall 3 recommendation
- **Alternative:** Could gitignore and download on every build
- **Tradeoff:** Larger repo size vs build reliability and review capability

**2. Auto-download in prebuild if schema missing**
- **Rationale:** Prevents cryptic build failures, works in CI without manual setup, graceful recovery from deleted schema
- **Alternative:** Fail fast with error message requiring manual download
- **Tradeoff:** Slightly slower prebuild on first run vs developer experience

**3. Validate OpenAPI version (3.0 or 3.1 only)**
- **Rationale:** fumadocs-openapi requires these versions, early validation prevents confusing build errors
- **Alternative:** Let fumadocs-openapi fail with internal error
- **Tradeoff:** Extra validation code vs clear error messages

**4. Use Bun native fetch instead of external HTTP libraries**
- **Rationale:** Consistency with Phase 1 decision (Bun as primary runtime), no extra dependencies, built-in performance
- **Alternative:** Could use axios, node-fetch
- **Tradeoff:** None - Bun fetch is standard web API

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All tasks completed without problems:
- Schema URL accessible and valid
- Download script worked on first try
- Prebuild integration tested successfully (both existing schema and missing schema scenarios)
- Schema validated as OpenAPI 3.0.3

## Next Phase Readiness

**Ready for Phase 7 Plan 2 (OpenAPI Config Update):**
- ✓ Schema download script operational
- ✓ Baseline schema downloaded and validated
- ✓ Prebuild integration prevents missing schema issues
- ✓ Schema format compatible with fumadocs-openapi (3.0)

**No blockers.** Schema completeness assessed - good quality with 49 endpoints and 319 descriptions. Lack of inline examples noted but not blocking (will use fumadocs code sample generation).

**Next steps in Phase 7:**
- Update lib/openapi.ts to point to data.gv.at-openapi.yaml
- Configure openapiSource in loader for virtual page generation
- Test API reference rendering in documentation

---
*Phase: 07-openapi-integration*
*Completed: 2026-01-22*
