---
phase: 05-related-datasets
plan: 01
subsystem: api
tags: [similarity, content-based-matching, themes, keywords, mcp-tool]

# Dependency graph
requires:
  - phase: 02-basic-search
    provides: search_datasets_advanced client method for candidate discovery
  - phase: 01-enterprise-foundation
    provides: PiveauClient and ToolError patterns
provides:
  - Content-based similarity matching for datasets
  - find_related_datasets MCP tool
  - Similarity scoring (themes 30pts, keywords 10pts, publisher 15pts)
affects: [06-advanced-search, future-recommendations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Feature extraction from RDF/JSON dataset metadata
    - Weighted similarity scoring with capped components

key-files:
  created:
    - app/similarity.py
    - tests/test_similarity.py
  modified:
    - app/tools/discovery.py

key-decisions:
  - "Theme matches weighted 3x higher than keyword matches (30 vs 10 points)"
  - "Publisher bonus 15 points for same-org datasets"
  - "Score components capped (themes 60, keywords 30, total 100)"
  - "Minimum score threshold 20 points default to filter weak matches"

patterns-established:
  - "Feature extraction handles both RDF (@id URIs) and JSON formats"
  - "Similarity scoring with weighted, capped components"

# Metrics
duration: 8min
completed: 2026-01-17
---

# Phase 5 Plan 1: Related Datasets Summary

**Content-based similarity matching with weighted scoring for theme, keyword, and publisher overlap**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-17T10:00:00Z
- **Completed:** 2026-01-17T10:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created similarity service with feature extraction and scoring
- Added find_related_datasets MCP tool to discovery tools
- Comprehensive test coverage with 24 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create similarity service module** - `4d16159` (feat)
2. **Task 2: Add find_related_datasets MCP tool** - `fa61013` (feat)
3. **Task 3: Add comprehensive test coverage** - `aeca954` (test)

## Files Created/Modified
- `app/similarity.py` - Similarity service with extract_features, calculate_similarity_score, find_related
- `app/tools/discovery.py` - Added find_related_datasets tool with proper annotations
- `tests/test_similarity.py` - 24 tests for feature extraction, scoring, and find_related

## Decisions Made
- Theme matches weighted 30 points each (up to 60) - themes are curated EU DCAT-AP vocabulary
- Keyword matches weighted 10 points each (up to 30) - keywords are free-text, less reliable
- Same publisher bonus 15 points - datasets from same org often related
- Total score capped at 100 - prevents inflation from very similar datasets
- Default min_score 20 - filters out weak matches with only one keyword overlap

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- pytest not installed in venv - installed via `uv pip install pytest pytest-asyncio`
- Lint issues (unused import, unsorted imports) - auto-fixed with ruff

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- find_related_datasets tool ready for use
- Similarity scoring tested and verified
- Ready for Phase 6 (Advanced Search) or user testing

---
*Phase: 05-related-datasets*
*Completed: 2026-01-17*
