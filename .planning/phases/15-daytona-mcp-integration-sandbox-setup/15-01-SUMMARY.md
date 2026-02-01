---
phase: 15-daytona-mcp-integration-sandbox-setup
plan: 01
subsystem: mcp
tags: [e2b, mcp, sandbox, code-execution, ai-sdk]

# Dependency graph
requires:
  - phase: 14-database-foundation-message-persistence
    provides: Database schema with sandbox_id tracking column
provides:
  - E2B Code Interpreter SDK integration with type-safe wrapper
  - Data.gv.at MCP client with HTTP transport
  - MCP client type definitions for sandbox execution
affects: [16-tool-aggregation, 17-ai-chat-integration, 18-approval-flow]

# Tech tracking
tech-stack:
  added:
    - "@e2b/code-interpreter: ^2.3.3"
  patterns:
    - "E2B sandbox lifecycle: create → runCode → kill"
    - "MCP HTTP transport for serverless compatibility"
    - "1-hour timeout default for code execution (EXEC-06)"

key-files:
  created:
    - "docs/lib/mcp/e2b-client.ts"
    - "docs/lib/mcp/datagvat-client.ts"
    - "docs/lib/mcp/types.ts"
  modified:
    - "docs/package.json"

key-decisions:
  - "Use E2B Code Interpreter instead of Daytona MCP (research confirmed Daytona MCP doesn't exist)"
  - "HTTP transport for data.gv.at MCP client (serverless compatible vs stdio)"
  - "1-hour sandbox timeout as default (EXEC-06 requirement)"
  - "Expose sandboxId from createSandbox for database tracking"

patterns-established:
  - "Pattern 1: E2B wrapper exports createE2BClient and createSandbox with timeout enforcement"
  - "Pattern 2: MCP client factories accept configuration via function parameters (not environment variables directly)"
  - "Pattern 3: Type-safe execution results with SandboxExecutionResult interface"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 15 Plan 01: MCP Client Foundation Summary

**E2B Code Interpreter SDK integration with 1-hour timeout enforcement and data.gv.at HTTP MCP client for multi-MCP orchestration**

## Performance

- **Duration:** 4 min 24 sec
- **Started:** 2026-02-01T09:00:31Z
- **Completed:** 2026-02-01T09:04:55Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- E2B Code Interpreter package installed with type-safe wrapper enforcing 1-hour timeouts
- Data.gv.at MCP client using HTTP transport (serverless compatible)
- Type definitions supporting both sandbox execution and MCP client initialization

## Task Commits

Each task was committed atomically:

1. **Task 1: Install E2B Code Interpreter SDK** - `5dc4fc0` (chore)
2. **Task 2: Create E2B client wrapper** - `a13e707` (feat)
3. **Task 3: Create data.gv.at MCP client** - `52940ae` (feat)

## Files Created/Modified
- `docs/package.json` - Added @e2b/code-interpreter dependency (v2.3.3)
- `docs/lib/mcp/e2b-client.ts` - E2B sandbox wrapper with createE2BClient and createSandbox functions
- `docs/lib/mcp/datagvat-client.ts` - Data.gv.at MCP HTTP client factory
- `docs/lib/mcp/types.ts` - Shared type definitions (SandboxExecutionResult, E2BClientConfig)

## Decisions Made

**1. E2B instead of Daytona MCP**
- Research (15-RESEARCH.md) confirmed Daytona MCP server doesn't exist
- E2B Code Interpreter is production-ready with 200ms startup and battle-tested isolation
- Already have @ai-sdk/mcp (v1.0.16) for multi-MCP orchestration

**2. HTTP transport for data.gv.at MCP client**
- stdio transport cannot deploy to Vercel serverless
- HTTP transport matches FastMCP server capabilities
- Enables production deployment on serverless infrastructure

**3. 1-hour sandbox timeout default**
- Per EXEC-06 requirement from research
- Prevents runaway code execution draining E2B credits
- Configurable via E2BClientConfig.timeoutMs parameter

**4. Expose sandboxId from createSandbox**
- Enables database tracking via conversations.sandbox_id column (Phase 14 schema)
- Required for sandbox lifecycle management and cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used --legacy-peer-deps for E2B installation**
- **Found during:** Task 1 (npm install @e2b/code-interpreter)
- **Issue:** Peer dependency conflict between better-auth (requires drizzle-orm >=0.41.0) and project's drizzle-orm ^0.38.0
- **Fix:** Installed with `npm install @e2b/code-interpreter --legacy-peer-deps` to bypass conflict
- **Files modified:** docs/package.json
- **Verification:** Package installed successfully, import works
- **Committed in:** 5dc4fc0 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed E2B SDK type compatibility**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** ExecutionError doesn't have .message property (has .name and .value instead), logs.stdout is string[] not string
- **Fix:** Changed error formatting to `${error.name}: ${error.value}` and removed array wrapping for logs
- **Files modified:** docs/lib/mcp/e2b-client.ts
- **Verification:** TypeScript compilation passes without errors
- **Committed in:** a13e707 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for installation and type correctness. No scope creep.

## Issues Encountered

**Pre-existing zod library errors**
- TypeScript compilation shows esModuleInterop warnings in zod v4 locale files
- These are pre-existing project configuration issues, not related to our MCP client code
- Verified by checking that no errors appear in lib/mcp/*.ts files specifically

## User Setup Required

**E2B API key required for code execution.** Environment variable needed:

- `E2B_API_KEY` - Get from https://e2b.dev/dashboard (free tier: $100 one-time credits)

**Data.gv.at MCP server URL required.** Environment variable needed:

- `DATAGVAT_MCP_URL` - URL of deployed FastMCP server (to be configured in Phase 15-02)

## Next Phase Readiness

**Ready for Phase 16 (Tool Aggregation):**
- E2B client wrapper provides createSandbox with timeout enforcement
- Data.gv.at MCP client provides HTTP transport for tool discovery
- Both clients follow research patterns (15-RESEARCH.md Pattern 1 & 2)
- Type-safe interfaces ready for AI SDK integration

**Pending for Phase 15-02:**
- Health check endpoint for MCP service monitoring
- Graceful degradation when MCP services unavailable
- Tool discovery and aggregation logic

---
*Phase: 15-daytona-mcp-integration-sandbox-setup*
*Completed: 2026-02-01*
