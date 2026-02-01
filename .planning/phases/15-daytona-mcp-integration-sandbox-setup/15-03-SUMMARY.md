---
phase: 15-daytona-mcp-integration-sandbox-setup
plan: 03
subsystem: sandbox
tags: [e2b, code-interpreter, lifecycle-management, lazy-cleanup, database-tracking]

# Dependency graph
requires:
  - phase: 14-01
    provides: messages.sandboxId column for sandbox tracking
  - phase: 15-01
    provides: E2B client with createSandbox exposing sandboxId
provides:
  - Sandbox lifecycle manager with database tracking
  - Lazy cleanup strategy (no cron jobs required)
  - Message-level sandbox association
  - E2B built-in 1-hour timeout enforcement
affects: [17-code-execution, 16-tool-aggregation, 18-security-approval-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [lazy-cleanup-pattern, message-sandbox-tracking, multi-layer-cleanup]

key-files:
  created:
    - docs/lib/sandbox/manager.ts
  modified: []

key-decisions:
  - "Message-level sandbox tracking (not conversation-level) for accurate resource association"
  - "Lazy cleanup strategy: E2B timeout + try/finally + database cleanup on message access"
  - "No cron jobs or paid services (Vercel Cron) - fully open-source approach"
  - "SandboxWrapper type instead of E2B Sandbox type (matches createE2BClient return type)"

patterns-established:
  - "Multi-layer cleanup: Primary (try/finally), Timeout (E2B), Lazy (DB on access)"
  - "Lazy database cleanup via cleanupStaleSandbox on message load"
  - "SQL interval comparison for stale detection (1 hour)"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 15 Plan 03: Sandbox Lifecycle Management Summary

**Message-level sandbox tracking with lazy cleanup using E2B timeout, database tracking, and automatic stale reference cleanup on message access**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T09:14:55Z
- **Completed:** 2026-02-01T09:17:08Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Sandbox lifecycle manager with database tracking in messages table
- Three-layer cleanup strategy: E2B timeout, try/finally (Phase 17), lazy database cleanup
- Message-level sandbox association (not conversation-level) for accurate resource tracking
- Zero cron dependencies - fully open-source and self-hosted friendly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sandbox manager with lazy cleanup** - `2fb992d` (feat)

## Files Created/Modified
- `docs/lib/sandbox/manager.ts` - Sandbox lifecycle with createTrackedSandbox, cleanupSandbox, cleanupStaleSandbox, getSandboxForMessage

## Decisions Made

**1. Message-level sandbox tracking (not conversation-level)**
- Sandboxes are associated with specific messages (messages.sandboxId), not conversations
- Rationale: Code execution is message-specific. Multiple messages in same conversation may use different sandboxes
- Impact: More accurate resource tracking, enables future multi-sandbox support

**2. Lazy cleanup strategy (no cron jobs)**
- Primary defense: E2B built-in timeout (1 hour) auto-terminates sandboxes
- Secondary: try/finally cleanup in execution code (Phase 17 will implement)
- Tertiary: Lazy database cleanup via cleanupStaleSandbox on message access
- Rationale: Avoids paid cron services (Vercel Cron), keeps architecture simple and open-source
- Impact: Zero infrastructure dependencies, fully self-hosted friendly

**3. SandboxWrapper type instead of E2B Sandbox type**
- Used custom type matching createE2BClient return shape
- Rationale: createE2BClient wraps E2B Sandbox with { runCode, kill, sandboxId }
- Impact: Correct TypeScript types for wrapped sandbox interface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Type mismatch discovered during implementation:**
- Initially imported `type { Sandbox } from '@e2b/code-interpreter'`
- Discovered createE2BClient returns wrapped object, not raw E2B Sandbox
- Fixed by creating SandboxWrapper type matching actual return shape
- Resolution: Type-safe implementation matching 15-01 design

## User Setup Required

None - no external service configuration required. E2B_API_KEY already documented in Phase 15-01.

## Next Phase Readiness

**Ready for Phase 16 (Tool Aggregation):**
- Sandbox manager provides createTrackedSandbox for execution
- Database tracking ready for sandbox lifecycle queries
- Lazy cleanup ensures stale references automatically cleared

**Ready for Phase 17 (Code Execution):**
- TrackedSandbox interface ready for try/finally cleanup pattern
- getSandboxForMessage provides message-sandbox lookup
- cleanupSandbox ready for manual cleanup after execution

**Ready for Phase 18 (Security):**
- Sandbox isolation per message (SEC-04 requirement met)
- 1-hour timeout enforced (EXEC-06 requirement met)
- Database tracking enables audit trail for security analysis

**No blockers or concerns.**

---
*Phase: 15-daytona-mcp-integration-sandbox-setup*
*Completed: 2026-02-01*
