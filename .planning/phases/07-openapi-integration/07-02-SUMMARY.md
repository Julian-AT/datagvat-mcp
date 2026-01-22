---
phase: 07-openapi-integration
plan: 02
subsystem: api
tags: [fumadocs-openapi, yaml, openapi-3.0, schema-validation]

# Dependency graph
requires:
  - phase: 07-01
    provides: Downloaded and filtered data.gv.at OpenAPI schema
provides:
  - Auto-generated API reference documentation from data.gv.at OpenAPI schema
  - 63 API endpoint pages integrated into documentation navigation
  - Robust schema filtering handling empty content sections
affects: [07-03, documentation, api-reference]

# Tech tracking
tech-stack:
  added: [yaml@2.8.2]
  patterns: [fumadocs-openapi SchemaMap pattern, empty content placeholder generation]

key-files:
  created:
    - docs/content/docs/api-reference/meta.json
  modified:
    - docs/lib/openapi.ts
    - docs/scripts/download-openapi.ts
    - docs/data.gv.at-openapi.yaml

key-decisions:
  - "Use function returning SchemaMap instead of raw YAML strings for fumadocs-openapi input"
  - "Add placeholder application/json schemas for empty RDF content sections"
  - "Line-by-line indentation analysis over regex for reliable empty content detection"

patterns-established:
  - "fumadocs-openapi SchemaMap pattern: () => { 'schema-id': parsedSchemaObject }"
  - "Empty content detection: Compare next line indentation to detect truly empty sections"

# Metrics
duration: 14min
completed: 2026-01-22
---

# Phase 07 Plan 02: Configure API Documentation Summary

**fumadocs-openapi integrated with data.gv.at schema, generating 63 API endpoint pages with proper handling of RDF format limitations**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-22T15:55:47Z
- **Completed:** 2026-01-22T16:09:53Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Identified and fixed fumadocs-openapi input format issue (raw YAML vs schema objects)
- Fixed empty content section detection in schema filter script
- Generated 63 API endpoint documentation pages successfully
- Integrated API reference into documentation navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Update OpenAPI configuration** - `96b2e96` (previous checkpoint commit)
2. **Task 2: Update loader baseDir** - `f6a43f5` (previous checkpoint commit)
3. **Task 3: Debug and fix fumadocs-openapi integration**:
   - `7a760b4` - fix(07-02): fix fumadocs-openapi input format
   - `c13fb62` - fix(07-02): fix empty content detection in OpenAPI schema filter
   - `fe52467` - feat(07-02): add API reference navigation metadata

## Files Created/Modified
- `docs/lib/openapi.ts` - Fixed to parse YAML and return SchemaMap function
- `docs/scripts/download-openapi.ts` - Improved empty content detection with line-by-line indentation analysis
- `docs/data.gv.at-openapi.yaml` - Regenerated with proper placeholders for empty RDF content sections
- `docs/content/docs/api-reference/meta.json` - Created navigation metadata
- `docs/package.json` - Added yaml@2.8.2 dependency
- `docs/bun.lock` - Updated with yaml package

## Decisions Made

**Decision 1: Use SchemaMap function pattern for fumadocs-openapi**
- **Rationale:** fumadocs-openapi's `input` parameter accepts either file paths (strings) or a function returning schema objects. Raw YAML strings were interpreted as file paths, causing "Failed to resolve input" errors.
- **Solution:** Parse YAML to object using yaml package, pass as function: `input: () => ({ 'data.gv.at': schemaObject })`
- **Impact:** Proper schema resolution, builds succeed

**Decision 2: Replace regex-based empty content detection**
- **Rationale:** Original regex pattern `/^(\s+)content:\s*\n(?=\1(?:\S|$))/gm` failed to match empty content sections where next line had different indentation.
- **Solution:** Line-by-line analysis comparing indentation levels - if next line has <= indentation than `content:`, it's empty.
- **Impact:** Correctly detects and fixes all empty content sections (RDFBody, RDF200 responses)

**Decision 3: Add application/json placeholders for RDF content**
- **Rationale:** data.gv.at schema contained only RDF media types (text/turtle, application/rdf+xml, etc.) not supported by fumadocs-openapi. After filtering, requestBody/response content sections were empty, causing Object.entries errors.
- **Solution:** Insert placeholder `application/json` schema with descriptive message explaining original RDF format limitation.
- **Impact:** Valid OpenAPI schema, documentation builds successfully

## Deviations from Plan

### Root Cause Investigation

**Checkpoint reached during Task 3 with build error:**
- **Symptom:** `[OpenAPI] Failed to resolve input: # An OpenAPI 3.0...` (truncated YAML content in error)
- **Initial hypothesis:** Schema format issue or fumadocs-openapi bug
- **Debug approach:** Examined TypeScript type definitions for createOpenAPI
- **Root cause found:** API expects file paths or SchemaMap function, not raw YAML strings

**Second issue discovered during testing:**
- **Symptom:** `TypeError: Cannot convert undefined or null to object at Object.entries` on `/de/docs/api-reference/createOrUpdateDatasetDraft`
- **Root cause found:** Empty `content:` sections in schema (all RDF media types were filtered out)
- **Fix:** Improved empty content detection in download-openapi.ts script

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing yaml package dependency**
- **Found during:** Task 3 (fumadocs-openapi debugging)
- **Issue:** YAML parsing required for SchemaMap pattern, yaml package not installed
- **Fix:** `bun add yaml` to install yaml@2.8.2
- **Files modified:** package.json, bun.lock
- **Verification:** Import succeeds, schema parses correctly
- **Committed in:** 7a760b4

**2. [Rule 1 - Bug] Unused variable in download-openapi.ts**
- **Found during:** Build pre-validation (biome check)
- **Issue:** `escapedType` variable declared but never used (remnant from regex approach)
- **Fix:** Removed unused variable declaration
- **Files modified:** scripts/download-openapi.ts
- **Verification:** Biome check passes
- **Committed in:** c13fb62

**3. [Rule 1 - Bug] Empty content sections causing Object.entries TypeError**
- **Found during:** Task 3 (build testing)
- **Issue:** Schema filter script's regex didn't detect empty content sections, fumadocs-openapi tried to iterate over null
- **Fix:** Replaced regex with line-by-line indentation comparison
- **Files modified:** scripts/download-openapi.ts, data.gv.at-openapi.yaml (regenerated)
- **Verification:** Build succeeds, 63 API pages generated
- **Committed in:** c13fb62

---

**Total deviations:** 3 auto-fixed (1 blocking dependency, 2 bugs)
**Impact on plan:** All fixes necessary for correct operation. Root cause investigation revealed API misunderstanding, not schema/fumadocs-openapi issues.

## Issues Encountered

**Issue 1: fumadocs-openapi input format misunderstanding**
- **Problem:** Initial implementation passed raw YAML string in array: `input: [schemaContent]`
- **Root cause:** TypeScript type definitions showed `input?: string[] | (() => SchemaMap)` - strings are interpreted as file paths/URLs, not raw content
- **Resolution:** Parse YAML to object, pass as function returning SchemaMap
- **Time cost:** ~5 minutes (TypeScript definitions inspection, fix implementation)

**Issue 2: Regex pattern didn't match empty content with variable indentation**
- **Problem:** Pattern expected next line to have exactly same indentation as `content:` line
- **Root cause:** YAML can have next sibling at any indentation <= current level
- **Resolution:** Explicit line-by-line indentation comparison logic
- **Time cost:** ~4 minutes (pattern debugging, rewrite, testing)

**Issue 3: Biome formatting failures on long template strings**
- **Problem:** Long description string exceeded line length, biome wanted reformatting
- **Resolution:** Applied biome auto-fix with `--write` flag
- **Time cost:** ~1 minute

## User Setup Required

None - no external service configuration required.

## Build Statistics

- **Total pages:** 401
- **API reference pages:** 63
- **Build time:** ~16.5 seconds (page generation)
- **Compile time:** ~49 seconds
- **Build size:** 1.55 GB

**Sample API endpoints documented:**
- checkIdentifierEligibility
- createDatasetDraft
- createDatasetIdentifier
- createOrUpdateDatasetDraft
- createOrUpdateVocabulary
- deleteCatalogue
- deleteCatalogueDatasetsOrigin
- deleteDataset
- deleteDatasetDraft
- getDataset
- listCatalogues
- etc. (63 total operations)

## Next Phase Readiness

**Ready for Phase 07-03 (Automated updates):**
- OpenAPI documentation fully functional
- Schema download and filtering script stable
- 63 API endpoints documented
- Navigation integrated

**Concerns:**
- API-03 requirement (request/response examples) limited by upstream schema quality
- Original data.gv.at schema has empty content sections (only RDF formats)
- Placeholders provide valid documentation but lack real examples
- This is an upstream data quality issue, not a documentation system limitation

**Recommendations for 07-03:**
- Weekly automation should re-download schema (captures API changes)
- Consider upstream contribution to improve schema quality (add JSON examples)
- Document RDF format limitation prominently in API reference introduction

---
*Phase: 07-openapi-integration*
*Completed: 2026-01-22*
