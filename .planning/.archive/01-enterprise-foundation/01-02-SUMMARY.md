---
phase: 01-enterprise-foundation
plan: 02
subsystem: error-handling
tags: [fastmcp, error-handling, progress-reporting, toolerror, middleware]
status: complete
completed: 2026-01-16

requires:
  - "01-01: FastMCP 2.14 upgrade"
provides:
  - "Consistent ToolError-based error handling across all tools"
  - "Progress reporting for long-running operations"
  - "Enhanced user experience with operation visibility"
affects:
  - "Future tool implementations (must use ToolError)"
  - "Client error handling (consistent format)"

tech-stack:
  added: []
  patterns:
    - "ToolError for business logic failures"
    - "Progress reporting with ctx.report_progress()"
    - "Optional ctx parameter checking"

key-files:
  created: []
  modified:
    - app/tools/analysis.py
    - app/tools/discovery.py
    - app/tools/management.py
    - app/tools/vocabularies.py

decisions:
  - id: ERR-01
    title: "Use ToolError for all tool failures"
    rationale: "FastMCP's ErrorHandlingMiddleware wraps ToolError in consistent format, ensuring uniform error responses across all MCP clients"
    alternatives: "Return error dicts (rejected - inconsistent format)"
    impact: "All future tools must raise ToolError instead of returning error dicts"

  - id: PROG-01
    title: "Always check ctx before calling report_progress"
    rationale: "Context parameter is optional in some calling patterns, need defensive programming"
    alternatives: "Assume ctx always exists (rejected - causes failures)"
    impact: "All progress reporting must be wrapped in `if ctx:` checks"

  - id: PROG-02
    title: "Progress reporting on list operations and multi-step tools"
    rationale: "List operations can return many items (up to 5000), multi-step operations (analyze_dataset_quality) benefit from visibility"
    alternatives: "Only add to truly long-running operations (rejected - list operations qualify)"
    impact: "List and analysis tools provide progress feedback"

metrics:
  duration: "16 minutes"
  tasks-completed: 3
  files-modified: 4
  commits: 3
  tests-added: 0
---

# Phase 01 Plan 02: Error Handling & Progress Reporting

**One-liner:** Standardized all tools to use ToolError with contextual messages and added progress reporting to list/analysis operations.

## What Was Built

### Error Handling Standardization
- **Added ToolError imports** to all 4 tool modules
- **Wrapped all PiveauClient exceptions** with contextual ToolError messages
- **Removed error dict returns** from analyze_dataset_quality (replaced `{"error": "..."}` with ToolError raises)
- **Enhanced error messages** with context (dataset IDs, catalogue IDs, operation type)

### Progress Reporting
- **list_catalogues**: Added ctx check to existing progress reporting
- **search_datasets**: Added progress reporting with contextual messages (includes catalogue scope)
- **list_vocabularies**: Added progress reporting for vocabulary fetching
- **list_dataset_drafts**: Added progress reporting for draft listings
- **analyze_dataset_quality**: Added 4-step progress reporting for comprehensive analysis:
  1. Fetching dataset metadata
  2. Fetching distributions
  3. Fetching quality metrics
  4. Checking DOI eligibility

All progress reporting includes:
- Defensive `if ctx:` checks (ctx parameter is optional)
- Start progress (0 or 1)
- Completion progress (1/1 or 4/4)
- Descriptive messages

## Technical Implementation

### Error Handling Pattern
```python
try:
    return await client.operation(...)
except Exception as e:
    raise ToolError(f"Failed to {operation} '{identifier}': {e}") from e
```

**Benefits:**
- Consistent error format via FastMCP middleware
- Preserves exception chain (`from e`)
- Contextual error messages
- No error dict anti-pattern

### Progress Reporting Pattern
```python
if ctx:
    await ctx.report_progress(current, total, "Message...")
result = await long_operation()
if ctx:
    await ctx.report_progress(total, total, f"Retrieved {len(result)} items")
return result
```

**Benefits:**
- Works with or without ctx parameter
- Provides user visibility
- Consistent message format

## Verification

- [x] All tools import ToolError
- [x] No tools return `{"error": "..."}` dicts
- [x] Progress reporting on all list/iterative operations
- [x] All progress reporting includes ctx checks
- [x] Code is syntactically valid

## Files Modified

### app/tools/analysis.py
- Added ToolError import
- Wrapped get_dataset_metrics with ToolError
- Wrapped check_doi_eligibility with ToolError
- Replaced error dict pattern in analyze_dataset_quality with None for optional fields
- Made dataset metadata fetch critical (raises ToolError on failure)
- Added 4-step progress reporting to analyze_dataset_quality

### app/tools/discovery.py
- Added ToolError import
- Added ctx check to list_catalogues progress reporting
- Wrapped all tool functions with ToolError (get_catalogue, search_datasets, get_dataset, get_dataset_distributions, get_catalogue_record)
- Added progress reporting to search_datasets

### app/tools/management.py
- Added ToolError import
- Wrapped all tool functions with ToolError (list_dataset_drafts, get_dataset_draft, create_dataset_draft, update_dataset_draft, delete_dataset_draft, publish_dataset, hide_dataset)
- Added progress reporting to list_dataset_drafts

### app/tools/vocabularies.py
- Added ToolError import
- Wrapped all tool functions with ToolError (list_vocabularies, get_vocabulary, search_vocabulary_terms, get_resource_types)
- Added progress reporting to list_vocabularies

## Commits

1. **f828804** - `feat(01-02): standardize error handling with ToolError`
   - Added ToolError imports and exception wrapping across all tools
   - Removed error dict returns
   - Key files: analysis.py (11 changes), discovery.py, management.py, vocabularies.py

2. **70ff71c** - `feat(01-02): add progress reporting to long-running tools`
   - Added progress reporting to analyze_dataset_quality
   - Updated list_catalogues with ctx check
   - Key file: analysis.py

3. **45ca9b1** - `fix(01-02): re-add progress reporting removed by linter`
   - Re-added ctx checks and progress reporting to list_catalogues, search_datasets, list_vocabularies, list_dataset_drafts
   - Linter had removed these in previous commit
   - Key files: discovery.py, management.py, vocabularies.py

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added degradation tracking to analyze_dataset_quality**
- **Found during:** Task 2 (error standardization)
- **Issue:** Linter added degradation tracking (logging warnings, tracking degradation reasons)
- **Fix:** Accepted linter's improvement - better user experience by explaining partial failures
- **Files modified:** app/tools/analysis.py
- **Commit:** Included in f828804

**Rationale:** The degradation tracking is a critical improvement for user experience. When analyze_dataset_quality can't fetch optional data (distributions, metrics, DOI eligibility), the response now includes:
- `"degraded": true/false` flag
- `"degradation_reasons": [...]` array explaining what failed

This is better than silently returning `None` for failed fields.

**2. [Rule 3 - Blocking] Linter removed progress reporting**
- **Found during:** Between commits
- **Issue:** Linter/formatter removed progress reporting from vocabularies.py, management.py, and search_datasets
- **Fix:** Re-added progress reporting with proper ctx checks in commit 45ca9b1
- **Files modified:** All tool files
- **Commit:** 45ca9b1

**Rationale:** Progress reporting is required by the plan. The linter's removal was blocking Task 3 completion.

## Next Phase Readiness

**Ready for:** Phase 01 Plan 03 (Input Validation)

**Provides foundation for:**
- Consistent error handling across all future tools
- Progress reporting pattern for future long-running operations
- Enhanced debugging via ToolError exception chains

**Dependencies satisfied:**
- All tools now use ToolError (required for consistent error format)
- All long-running tools report progress (required for user visibility)

**No blockers.**

## Notes

- **Linter interaction:** The codebase has an active linter that reformats code between edits. Had to re-apply progress reporting after it was removed.
- **Degradation pattern:** analyze_dataset_quality now gracefully degrades when optional data isn't available, logging warnings and tracking reasons. This is better UX than failing completely.
- **Error message quality:** All ToolError messages include context (IDs, operation type) for easier debugging.
- **Progress reporting coverage:** All list operations (catalogues, datasets, vocabularies, drafts) and the multi-step analyze_dataset_quality operation now report progress.
