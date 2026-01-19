---
phase: 20-guides-and-workflows
plan: 02
subsystem: documentation
tags: [fumadocs, mdx, guides, workflow-patterns, navigation, research, validation]

# Dependency graph
requires:
  - phase: 19-getting-started-content
    provides: Getting Started section complete
  - phase: 18-documentation-foundation
    provides: Section structure and navigation requirements (FOUND-04, FOUND-05)
provides:
  - Workflow patterns guide with reusable research and validation templates
  - Complete guides navigation with all 4 guides in learning progression order
  - Task-oriented guide structure implementing FOUND-04/FOUND-05
affects: [workflow-documentation, guide-completion, navigation-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Workflow templates with Overview/Detailed tabs for progressive disclosure
    - Pattern-based organization (Research, Validation, Iterative, Comparative)
    - Troubleshooting subsections integrated with patterns
    - Cross-referencing between related guides

key-files:
  created:
    - docs/guides/workflow-patterns.mdx
  modified:
    - docs/guides/meta.json

key-decisions:
  - "Learning progression order: searching → data-preview → quality-metrics → workflow-patterns (discovery to integration flow)"
  - "Remove non-existent configuration guide from navigation (incomplete from Phase 18)"
  - "Task-oriented description emphasizes workflows over technical features"
  - "Overview/Detailed tabs for each pattern to serve both quick reference and detailed learning needs"

patterns-established:
  - "Workflow pattern structure: Goal → When to use → Pattern (tabs) → Success criteria"
  - "Quick pattern: Numbered steps with time estimate and success checklist"
  - "Detailed pattern: Step-by-step code examples with cross-references"
  - "Troubleshooting patterns: Symptom → Solutions format integrated with workflows"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 20 Plan 02: Workflow Patterns and Navigation Summary

**Reusable workflow templates for research and validation with complete guides navigation implementing FOUND-04/FOUND-05 requirements**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T04:51:30Z
- **Completed:** 2026-01-20T04:54:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created workflow-patterns.mdx with 4 reusable patterns (Research, Validation, Iterative Exploration, Comparative Analysis)
- Each pattern has Overview/Detailed tabs for progressive disclosure
- 9 cross-references to other guides for connected learning
- Updated guides navigation to implement FOUND-04 (complete navigation structure) and FOUND-05 (consistent naming)
- Learning progression order: searching → data-preview → quality-metrics → workflow-patterns
- Removed non-existent configuration guide from navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workflow-patterns.mdx** - `cbfc49d` (feat)
2. **Task 2: Update guides meta.json** - `9ff33f1` (feat)

## Files Created/Modified

- `docs/guides/workflow-patterns.mdx` - Reusable workflow templates with research, validation, iterative, and comparative patterns (339 lines, 4 major patterns, 9 cross-references)
- `docs/guides/meta.json` - Updated navigation implementing FOUND-04/FOUND-05 with all 4 guides in learning progression order

## Decisions Made

1. **Learning progression order:** Guides ordered by natural workflow: searching (find) → data-preview (inspect) → quality-metrics (evaluate) → workflow-patterns (integrate). Implements FOUND-05 consistent naming pattern.

2. **Remove configuration guide:** Removed non-existent "configuration" page from navigation (was incomplete from Phase 18). Now navigation shows only existing, complete guides.

3. **Task-oriented description:** Changed description from "Comprehensive guides for using Austria MCP" to "Task-oriented guides for common Austria MCP workflows" to emphasize practical workflow approach per FOUND-05.

4. **Overview/Detailed tabs for patterns:** Each workflow pattern has two disclosure levels - Overview for quick reference (5-minute read) and Detailed for step-by-step implementation (15-minute read). Uses groupId="workflow-style" persist for state preservation.

5. **Pattern troubleshooting integration:** Troubleshooting guidance integrated directly with patterns (e.g., "Pattern fails at search step") rather than separate section, making fixes contextual and discoverable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward content creation and navigation update.

## User Setup Required

None - no external configuration needed.

## Next Phase Readiness

**Ready for Phase 20 Plan 03 (remaining guides/workflows):**
- Complete guides navigation structure established (FOUND-04 satisfied)
- Consistent naming conventions implemented (FOUND-05 satisfied)
- Workflow pattern templates ready for end-to-end workflows to reference
- Cross-reference network connects all guides
- Navigation learning progression validated

**Content quality:**
- 4 reusable workflow patterns with dual disclosure levels
- 9 cross-references connecting guides into coherent learning path
- Research pattern targets 85+ quality score for academic use
- Validation pattern targets 70+ quality score for production use
- Troubleshooting guidance integrated with each pattern
- All 4 guides visible in navigation with task-oriented titles

---
*Phase: 20-guides-and-workflows*
*Completed: 2026-01-20*
