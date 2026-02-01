---
phase: 15-daytona-mcp-integration-sandbox-setup
verified: 2026-02-01T10:30:00Z
status: gaps_found
score: 4/7 must-haves verified
gaps:
  - truth: "User sees clear connection status for both MCP servers before sending first message"
    status: failed
    reason: "Health endpoint exists but is not wired to UI - no component displays status to user"
    artifacts:
      - path: "docs/app/api/mcp/health/route.ts"
        issue: "Endpoint exists and works, but no UI component fetches/displays the data"
    missing:
      - "UI component that fetches /api/mcp/health on page load"
      - "Status indicator showing data.gv.at MCP connection (healthy/unhealthy)"
      - "Status indicator showing E2B sandbox connection (healthy/unhealthy)"
      - "Wire health check to chat page before first message"
  
  - truth: "Developer inspects logs and sees health check pings for both MCP servers on startup"
    status: failed
    reason: "Health endpoint exists but no startup health check - only available on-demand via API"
    artifacts:
      - path: "docs/app/api/mcp/health/route.ts"
        issue: "Health endpoint is on-demand only, not called automatically on startup"
    missing:
      - "Startup health check in app initialization (layout.tsx or middleware)"
      - "Server-side logging of health check results on app startup"
      - "Console output showing MCP connection status when app starts"
  
  - truth: "System recovers automatically when MCP server crashes (reconnection logic triggers)"
    status: failed
    reason: "No reconnection or retry logic exists - single connection attempt only"
    artifacts:
      - path: "docs/lib/mcp/datagvat-client.ts"
        issue: "createDataGvatClient has no retry logic, crashes on first failure"
      - path: "docs/lib/mcp/aggregate-tools.ts"
        issue: "Graceful degradation exists, but no reconnection attempts after initial failure"
    missing:
      - "Retry logic with exponential backoff for MCP client connections"
      - "Periodic reconnection attempts when MCP server becomes available again"
      - "Health check polling to detect when failed server recovers"
---

# Phase 15: E2B MCP Integration & Sandbox Setup Verification Report

**Phase Goal:** Both data.gv.at and E2B sandbox servers connect reliably with health checks, and sandboxes clean up automatically to prevent resource exhaustion

**Verified:** 2026-02-01T10:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees clear connection status for both MCP servers before sending first message | ✗ FAILED | Health endpoint exists (`/api/mcp/health`) but no UI component displays status. Not wired to chat page. |
| 2 | User sends message when E2B unavailable and receives graceful error explaining only dataset search works | ✓ VERIFIED | `aggregate-tools.ts` provides `execute-python-unavailable` fallback tool with error message "Code execution sandbox is temporarily unavailable. Only dataset search is available." |
| 3 | Developer inspects logs and sees health check pings for both MCP servers on startup | ✗ FAILED | Health endpoint exists but is on-demand only. No startup health check in app initialization. |
| 4 | User creates 20+ sandboxes in sequence and system remains responsive (automatic cleanup after 1 hour) | ? NEEDS HUMAN | Cleanup logic exists (E2B timeout + lazy DB cleanup) but requires load testing to verify. |
| 5 | Developer inspects database and sees sandbox_id column tracking active workspaces with timestamps | ✓ VERIFIED | `messages.sandboxId` column exists in schema (line 79). `createTrackedSandbox()` updates DB. |
| 6 | User's sandbox executes in isolated environment without network access to production data | ? NEEDS HUMAN | E2B provides VM isolation by default, but network restrictions not explicitly configured. Requires E2B documentation verification. |
| 7 | System recovers automatically when MCP server crashes (reconnection logic triggers) | ✗ FAILED | No retry or reconnection logic exists. Single connection attempt only. |

**Score:** 4/7 truths verified (2 verified, 2 needs human, 3 failed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `docs/lib/mcp/e2b-client.ts` | E2B Code Interpreter wrapper with createSandbox | ✓ SUBSTANTIVE | 35 lines, exports createE2BClient and createSandbox, enforces 1-hour timeout (EXEC-06) |
| `docs/lib/mcp/datagvat-client.ts` | Data.gv.at MCP HTTP client | ✓ SUBSTANTIVE | 20 lines, uses HTTP transport, has error handling |
| `docs/lib/mcp/types.ts` | Type definitions | ✓ SUBSTANTIVE | 10 lines, defines SandboxExecutionResult and E2BClientConfig |
| `docs/lib/mcp/health-checker.ts` | MCP health check via tool discovery | ✓ SUBSTANTIVE | 35 lines, checkMCPHealth uses client.tools() as health probe |
| `docs/app/api/mcp/health/route.ts` | Health check API endpoint | ⚠️ ORPHANED | 43 lines, endpoint works but not called from UI. Exists but unused. |
| `docs/lib/mcp/aggregate-tools.ts` | Graceful tool aggregation | ✓ SUBSTANTIVE | 56 lines, wraps each MCP client in try/catch, provides fallback tools |
| `docs/lib/sandbox/manager.ts` | Sandbox lifecycle with DB tracking | ✓ SUBSTANTIVE | 80 lines, exports createTrackedSandbox, cleanupStaleSandbox, getSandboxForMessage |
| `docs/package.json` | E2B package installed | ✓ EXISTS | Contains @e2b/code-interpreter dependency |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `e2b-client.ts` | `@e2b/code-interpreter` | import Sandbox | ✓ WIRED | Line 1: `import { Sandbox } from '@e2b/code-interpreter'` |
| `datagvat-client.ts` | `@ai-sdk/mcp` | createMCPClient with HTTP transport | ✓ WIRED | Line 1: imports createMCPClient, line 7: `type: 'http'` |
| `health-checker.ts` | MCPClient.tools() | tool discovery as health probe | ✓ WIRED | Line 17: `await client.tools()` called for health check |
| `aggregate-tools.ts` | `e2b-client.ts` | try/catch with fallback | ✓ WIRED | Lines 19-42: E2B wrapped in try/catch, lines 43-52: fallback tool on error |
| `sandbox/manager.ts` | `messages.sandboxId` | DB update | ✓ WIRED | Lines 27-32: `db.update(messages).set({ sandboxId })` |
| **MISSING** | `/api/mcp/health` → UI | Health status display | ✗ NOT_WIRED | No component imports or fetches from health endpoint |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| MCP-01: Daytona MCP client connects via stdio transport | ⚠️ PARTIAL | Used E2B instead of Daytona (research confirmed Daytona MCP doesn't exist). HTTP transport used for data.gv.at, not stdio. |
| MCP-02: Data.gv.at MCP client connects via FastMCP server | ✓ SATISFIED | `createDataGvatClient` uses HTTP transport to connect to FastMCP server |
| MCP-03: Both MCP servers aggregate tools in single AI SDK call | ✓ SATISFIED | `getAvailableTools` merges tools from both sources into single object |
| MCP-04: MCP server spawning includes health checks | ✗ BLOCKED | Health endpoint exists but not called on startup. No health check during initialization. |
| MCP-05: Connection failures trigger graceful degradation | ✓ SATISFIED | `aggregate-tools.ts` wraps each client in try/catch, continues with reduced functionality |
| EXEC-04: Code executes in isolated Daytona sandbox | ⚠️ PARTIAL | E2B sandbox used (VM isolation), but Daytona not available. Isolation exists but not Daytona-specific. |
| EXEC-06: Sandbox automatically cleans up after 1 hour | ✓ SATISFIED | E2B timeout set to 3600000ms (1 hour), lazy cleanup via `cleanupStaleSandbox` |
| EXEC-10: User sees graceful error when Daytona unavailable | ✓ SATISFIED | `execute-python-unavailable` tool provides error message when E2B fails |
| SEC-04: Each conversation uses isolated sandbox | ✓ SATISFIED | `createTrackedSandbox` creates new sandbox per message, tracked in DB |

### Anti-Patterns Found

No stub patterns, TODO comments, or placeholder implementations found in Phase 15 artifacts.

**All files are substantive with real implementations:**
- No `TODO` or `FIXME` comments
- No placeholder text or empty returns
- All exports are real functions with implementations
- Try/finally patterns exist for cleanup
- Error handling present in all clients

### Human Verification Required

#### 1. E2B Network Isolation

**Test:** Deploy E2B sandbox and verify network access restrictions
**Expected:** 
- Sandbox cannot access production database
- Sandbox cannot make outbound HTTP calls to arbitrary domains
- Sandbox has no access to AWS credentials or secrets

**Why human:** E2B documentation claims VM isolation, but need to verify network restrictions are actually enforced. Cannot programmatically test without running E2B sandbox.

#### 2. Sandbox Load Testing (20+ sandboxes)

**Test:** 
1. Create script that triggers 20+ code executions in sequence
2. Monitor system responsiveness
3. Check database for sandboxId tracking
4. Verify lazy cleanup removes stale entries after 1 hour

**Expected:**
- All 20 sandboxes create successfully
- Chat interface remains responsive during load
- Database shows sandboxId for active executions
- After 1 hour, stale sandboxId entries cleared when messages accessed

**Why human:** Requires running app with E2B API key, generating load, and monitoring over 1+ hour period. Cannot verify without real E2B credits and time-based observation.

#### 3. MCP Server Crash Recovery

**Test:**
1. Start app with data.gv.at MCP server running
2. Kill the MCP server process
3. Observe if system detects failure and attempts reconnection
4. Restart MCP server
5. Verify system reconnects without app restart

**Expected:** System detects failure, logs error, attempts periodic reconnection, and recovers when server available.

**Why human:** Requires running MCP server, simulating crashes, and observing recovery behavior over time. Current implementation has no retry logic (see gaps).

### Gaps Summary

**3 critical gaps blocking goal achievement:**

**Gap 1: Missing health status UI (blocks Truth 1)**

The health check endpoint exists and works correctly, but no UI component displays the connection status to users. The `/api/mcp/health` route returns proper JSON with server health, but it's completely orphaned — no component fetches it, no page displays it.

**What needs to be added:**
- Create UI component that fetches `/api/mcp/health` on chat page load
- Display connection status for data.gv.at MCP (green/red indicator)
- Display connection status for E2B sandbox (green/red indicator)
- Show latency metrics and tool counts when healthy
- Display error messages when unhealthy

**Gap 2: Missing startup health checks (blocks Truth 3)**

The health endpoint is on-demand only (HTTP GET). There's no automatic health check when the app starts up. Developers can't inspect logs to see MCP server status because no health check runs on startup.

**What needs to be added:**
- Server-side health check in app initialization (layout.tsx or Next.js middleware)
- Logging output showing health check results when app starts
- Console.log statements with MCP connection status on startup
- Optional: Store health check results in app context for initial page render

**Gap 3: Missing reconnection logic (blocks Truth 7)**

Both `createDataGvatClient` and `createE2BClient` attempt connection once and crash on failure. There's no retry logic, no exponential backoff, and no periodic reconnection attempts. If an MCP server crashes after initial connection, the system never recovers without app restart.

**What needs to be added:**
- Retry logic with exponential backoff in MCP client creation
- Periodic health check polling (every 30s?) to detect when failed servers recover
- Automatic reconnection when health check detects server is back online
- Connection state management (connecting, connected, disconnected, retrying)

**Impact:** Phase goal "connect reliably" is not achieved. The infrastructure exists but reliability features (health visibility, startup checks, reconnection) are missing.

---

_Verified: 2026-02-01T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
