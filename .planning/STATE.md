# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.
**Current focus:** Phase 14 - Database Foundation & Message Persistence

## Current Position

Phase: 17.1 of 20 (Chat Foundation Reset - INSERTED)
Plan: 8 of TBD in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 17.1-08-PLAN.md (Chat Route Replacement)

Progress: [█████░░░░░] 73% (19/24 plans complete in v2.2, 17.1-01 through 17.1-08 complete)

## Performance Metrics

**v2.1 Milestone (Complete):**
- Total plans completed: 14
- Average duration: 16.6 min
- Total execution time: 3.9 hours
- Build time: 152s (<5 min target maintained)

**v2.2 Milestone (Starting):**
- Plans completed: 19
- Average duration: 5.2 min ((19 + 2 + 3 + 4 + 4 + 2 + 1 + 4 + 2 + 2 + 3 + 30 + 3 + 2 + 2 + 4 + 2 + 2 + 5) / 19)
- Phase: Phase 17.1 in progress (8 plans complete)

**Recent Trend:**
- v2.1 completed with 15 plans across 4 phases
- v2.2: 13 plans complete - average 6.6 min
- Phase 14-01: 19 min (database setup, migrations)
- Phase 14-02: 2 min (configuration task)
- Phase 14-03: 3 min (API routes with validation)
- Phase 15-01: 4 min (E2B + MCP client setup)
- Phase 15-02: 4 min (health checks + graceful degradation)
- Phase 15-03: 2 min (sandbox lifecycle manager)
- Phase 15-04: 1 min (health status UI - gap closure)
- Phase 15-05: 4 min (startup health checks - Gap 2 closure)
- Phase 15-06: 2 min (reconnection logic - Gap 3 closure)
- Phase 16-01: 2 min (AI model config + dataset discovery prompt)
- Phase 16-02: 3 min (streaming chat endpoint + multi-MCP tool orchestration)
- Phase 16-03: 30 min (chat persistence integration with message history + tool preservation)
- Phase 17-01: 3 min (enhanced execute-python tool with timeout + multi-file support)
- Phase 17.1-01: 2 min (schema foundation + architecture analysis - GIN index migration ready)
- Phase 17.1-02: 2 min (blob upload helpers with format support)
- Phase 17.1-03: 4 min (immediate persistence pattern + clean streaming)
- Phase 17.1-04: 2 min (execute-python immediate upload - eliminates context explosion)
- Phase 17.1-05: 2 min (parts-based message rendering - replaced custom visualization handling)
- Phase 17.1-06: 2 min (Vercel schema migration - chat/message/document with UUID primary keys)
- Phase 17.1-07: 2 min (query layer replacement - convertToUIMessages fixes conversation history)
- Phase 17.1-08: 5 min (chat route replacement - Vercel streaming pattern with history loading)
- Trend: Phase 17.1 in progress (8/TBD plans), Vercel ai-chatbot foundation complete with working chat memory

*Updated after v2.2 roadmap creation*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| ID | Decision | Status | Phase |
|----|----------|--------|-------|
| 17.1-08-anthropic-direct | Use anthropic model directly via @ai-sdk/anthropic (not getLanguageModel abstraction) | Implemented | 17.1-08 |
| 17.1-08-chatid-terminology | chatId (string UUID) replaces conversationId (number) system-wide for Vercel compatibility | Implemented | 17.1-08 |
| 17.1-08-parts-filtering | Filter reasoning parts from AI SDK before database persistence | Implemented | 17.1-08 |
| 17.1-08-blob-folder | Blob storage uses chats/{chatId}/ folder structure | Implemented | 17.1-08 |
| 17.1-06-uuid-primary-keys | Use UUID primary keys with gen_random_uuid() for chat/message/document tables | Implemented | 17.1-06 |
| 17.1-06-attachments-separate | Separate attachments JSONB column from parts array for cleaner file metadata | Implemented | 17.1-06 |
| 17.1-06-document-table | Create document table for artifacts/canvas pattern (kind: text | code) | Implemented | 17.1-06 |
| 17.1-06-data-preservation | Migrate existing conversations/messages via user_id + created_at mapping | Implemented | 17.1-06 |
| 17.1-03-immediate-persistence | User message saved BEFORE streaming starts (never lost if stream fails) | Implemented | 17.1-03 |
| 17.1-03-no-transform | Removed experimental_transform for clean stream flow | Implemented | 17.1-03 |
| 17.1-03-simple-onfinish | onFinish only saves assistant message (no visualization processing) | Implemented | 17.1-03 |
| 17.1-03-queries-helpers | Created queries.ts with saveMessages, getMessagesByChatId, getConversationById, saveConversation | Implemented | 17.1-03 |
| 17.1-04-upload-first | Visualizations upload immediately DURING tool execution (not after stream) | Implemented | 17.1-04 |
| 17.1-04-no-cache | Remove visualizationCache - upload immediately, return URLs only | Implemented | 17.1-04 |
| 17.1-04-parallel-upload | Upload all formats (PNG, SVG, HTML) in parallel via Promise.all | Implemented | 17.1-04 |
| 17.1-04-fail-fast | Fail fast if conversationId missing (required for upload) | Implemented | 17.1-04 |
| 17.1-01-gin-index-parts | GIN index on messages.parts for efficient JSONB queries by part type | Implemented | 17.1-01 |
| 17.1-01-custom-visualization-type | Custom type: visualization extends ai-chatbot schema for semantic clarity | Implemented | 17.1-01 |
| 17.1-01-defer-migration | Defer migration execution to Plan 05 for consolidated database updates | Implemented | 17.1-01 |
| 17-02-5mb-limit | File size limit set to 5MB for visualization support | Implemented | 17-02 |
| 17-02-mime-types | Accept JPEG, PNG, SVG, HTML for images and visualizations | Implemented | 17-02 |
| 17-02-random-suffix | addRandomSuffix prevents filename collisions | Implemented | 17-02 |
| 17-01-30s-timeout | Enforce 30-second execution timeout via EXECUTION_TIMEOUT_MS constant | Implemented | 17-01 |
| 17-01-structured-error | ExecutionError with traceback enables AI-driven error recovery | Implemented | 17-01 |
| 17-01-multi-file-write | Multi-file support via sandbox.files.write() before code execution | Implemented | 17-01 |
| 17-01-separated-logs | Separated stdout/stderr in logs object for debugging visibility | Implemented | 17-01 |
| 17-01-timeout-guidance | Add optimization suggestions to error messages when isTimeout is true | Implemented | 17-01 |
| 16-03-uuid-preference | User prefers UUIDs over serial IDs for future phases (security + Vercel compatibility) | Noted | 16-03 |
| 16-03-graceful-persistence | Wrap message persistence in try/catch - never block streaming | Implemented | 16-03 |
| 16-03-onfinish-pattern | Use AI SDK onFinish callback to save messages after stream completes | Implemented | 16-03 |
| 16-03-history-merge | Load conversation history and merge with new messages before AI processing | Implemented | 16-03 |
| 16-03-auto-conversation | Create conversation automatically on first message if no conversationId | Implemented | 16-03 |
| 16-02-runtime-tool-aggregation | Call getAvailableTools() per request for dynamic tool availability | Implemented | 16-02 |
| 16-02-single-agent-direct-prompt | Use datasetDiscoveryPrompt directly, no routing helper | Implemented | 16-02 |
| 16-02-remove-geolocation | Removed geolocation/RequestHints (not needed for Austrian dataset focus) | Implemented | 16-02 |
| 16-01-model-claude-sonnet-4.5 | claude-sonnet-4.5 as DEFAULT_CHAT_MODEL for superior tool calling | Implemented | 16-01 |
| 16-01-unified-prompt | Single datasetDiscoveryPrompt for both discovery and code generation | Implemented | 16-01 |
| 16-01-anti-hallucination-priority | Enforce "always verify datasets from trusted sources" workflow | Implemented | 16-01 |
| 16-01-schema-prefetch-via-prompt | System prompt instructs AI to call analyze_distribution_schema before pandas code | Implemented | 16-01 |
| 15-06-exponential-backoff | Exponential backoff with 1s-30s delays, 5 retries max | Implemented | 15-06 |
| 15-06-reusable-wrapper | Generic resilient client wrapper (not MCP-specific, reusable pattern) | Implemented | 15-06 |
| 15-06-state-logging | Console logging for connection state transitions | Implemented | 15-06 |
| 15-05-startup-no-throw | Startup health checks log but don't throw errors (app continues even if MCP unhealthy) | Implemented | 15-05 |
| 15-05-separate-routes | Separate /api/mcp/startup (logging) from /api/mcp/health (data) routes | Implemented | 15-05 |
| 15-05-log-prefix | [MCP Startup] prefix distinguishes startup checks from runtime health checks | Implemented | 15-05 |
| 15-04-30s-polling | 30-second polling interval for health status updates | Implemented | 15-04 |
| 15-04-always-visible | Health status always visible (not lazy loaded or conditional) | Implemented | 15-04 |
| 15-03-message-sandbox-tracking | Message-level sandbox tracking (not conversation-level) for accurate resource association | Implemented | 15-03 |
| 15-03-lazy-cleanup | Lazy cleanup strategy: E2B timeout + try/finally + DB cleanup on message access (no cron jobs) | Implemented | 15-03 |
| 15-03-no-cron | No cron jobs or paid services (Vercel Cron) - fully open-source approach | Implemented | 15-03 |
| 15-02-tools-health-probe | Use tools() method as health probe for MCP servers (no health protocol in spec) | Implemented | 15-02 |
| 15-02-e2b-not-mcp | E2B health check via direct SDK (E2B is not an MCP server) | Implemented | 15-02 |
| 15-02-isolated-failures | Separate try/catch blocks per service to isolate failures | Implemented | 15-02 |
| 15-02-fallback-tools | Provide fallback error tools when services unavailable (EXEC-10) | Implemented | 15-02 |
| 15-01-e2b-not-daytona | E2B Code Interpreter instead of Daytona MCP (Daytona MCP doesn't exist) | Implemented | 15-01 |
| 15-01-http-transport | HTTP transport for data.gv.at MCP client (serverless compatible) | Implemented | 15-01 |
| 15-01-1hour-timeout | 1-hour sandbox timeout default (EXEC-06 requirement) | Implemented | 15-01 |
| 15-01-expose-sandboxid | Expose sandboxId from createSandbox for database tracking | Implemented | 15-01 |
| 14-03-session-ownership | Session validates conversation ownership only (not access control) | Implemented | 14-03 |
| 14-03-cursor-pagination | Cursor pagination with limit + 1 pattern for hasMore detection | Implemented | 14-03 |
| 14-03-replay-prevention | execution_status prevents replay attacks (enforced in Phase 18) | Implemented | 14-03 |
| 14-03-blob-public | Vercel Blob with public access and immutable file naming | Implemented | 14-03 |
| 14-02-direct-session | Create sessions via direct database insert (not better-auth API) | Implemented | 14-02 |
| 14-02-null-email-guest | Guest users identified by email: null in user table | Implemented | 14-02 |
| 14-02-session-scope | Sessions for conversation ownership only, NOT access control | Implemented | 14-02 |
| 14-01-jsonb-parts | Use JSONB for AI SDK parts array (not separate tables) | Implemented | 14-01 |
| 14-01-execution-status | Add execution_status column for replay attack prevention | Implemented | 14-01 |
| 14-01-blob-urls | Store file parts as blob URLs (never base64) | Implemented | 14-01 |
| 14-01-edge-compat | Configure poolQueryViaFetch for edge runtime | Implemented | 14-01 |

**Prior v2.2 decisions:**
- v2.2: Vercel AI Gateway - Single endpoint for 100+ models, no separate API keys (pending verification)
- v2.2: E2B Code Interpreter for sandboxes - ✅ VERIFIED (15-01): Daytona MCP doesn't exist, E2B is production-ready alternative
- v2.2: Neon Postgres for persistence - Serverless, generous free tier, Drizzle ORM support (✅ implemented in 14-01)
- v2.2: Guest mode only (no auth) - Simplify v2.2 scope, defer user accounts to v3.0 (schema ready for v3.0)

### Pending Todos

**From v2.1 (inherited):**
- 56 search queries for manual testing (non-blocking)
- 5-7 Claude Desktop screenshots (non-blocking)

**v2.2 phase planning:**
- Phase 14: ✅ Complete (14-01: schema, 14-02: sessions, 14-03: message APIs)
- Phase 15: ✅ Complete (15-01: MCP clients, 15-02: health checks + graceful degradation, 15-03: sandbox lifecycle, 15-04-06: gap closure)
- Phase 16: ✅ Complete (16-01: AI config, 16-02: chat endpoint, 16-03: message persistence)
- Phase 17.1: 🚧 In progress (17-01: enhanced execute-python tool, 17-02: file upload API)
- Phase 18: Security patterns (approval flow builds on execution_status)
- Phase 19: Image extraction (uses uploadImageFromBase64 from 14-03)
- Phase 20: Chat UI (uses message APIs from 14-03)

### Blockers/Concerns

**Phase 17.1 (Chat Foundation Reset): ⚡ ARCHITECTURAL PIVOT**
- Custom visualization handling (commit b6be233) hit fundamental issues:
  - Context window explosion: 236K tokens from base64 in tool results
  - WebSocket payload errors from streaming large data
  - Tool results not appearing in onFinish callback
  - Visualizations not persisting to database
  - Fighting AI SDK framework instead of using it properly
- **Solution**: Adopt vercel/ai-chatbot proven architecture (2-3 hour investment vs days of debugging)
- **Scope**: Their components, API routes, DB schema, data stream patterns - all battle-tested
- **Commitment saved**: b6be233 for potential revert if needed
- **User authorization**: Full permission to replace custom code with their proven patterns

**Phase 15 (MCP Integration): ✅ GAP CLOSURE COMPLETE**
- ✅ CORE PLANS COMPLETE: 15-01, 15-02, 15-03 (MCP clients, health checks, sandbox lifecycle)
- ✅ GAP 1 CLOSED (15-04): Users see MCP server connection status before sending first message
- ✅ GAP 2 CLOSED (15-05): Developers see startup health check logs with performStartupHealthCheck + /api/mcp/startup
- ✅ GAP 3 CLOSED (15-06): System recovers automatically when MCP server crashes (exponential backoff retry logic)
- ✅ RESOLVED: Daytona MCP verified non-existent via research (15-RESEARCH.md), using E2B Code Interpreter instead
- ✅ RESOLVED: Health check implementation complete (15-02: checkMCPHealth via tools() method)
- ✅ RESOLVED: Graceful degradation implemented (15-02: separate try/catch per service, fallback error tools)
- ✅ RESOLVED: Sandbox lifecycle manager with lazy cleanup (15-03: no cron jobs required)
- ❌ BLOCKER for testing: E2B_API_KEY required (get from https://e2b.dev/dashboard - free tier available)
- ❌ BLOCKER for testing: DATAGVAT_MCP_URL required (FastMCP server deployment needed)

**Phase 14 (Database): ✅ COMPLETE**
- ✅ RESOLVED: All database schema and API infrastructure complete
- ❌ BLOCKER for testing: DATABASE_URL + BETTER_AUTH_SECRET + BLOB_READ_WRITE_TOKEN required (user must configure services)
- See: 14-03-USER-SETUP.md for Vercel Blob configuration

## Session Continuity

Last session: 2026-02-01 19:57 UTC
Stopped at: Completed 17.1-08-PLAN.md (Chat Route Replacement)
Resume file: None
Next step: Phase 17.1 in progress (8/TBD plans done) - Chat route with history loading complete, proceed to Plan 09 or 10

---

*v2.2 milestone: Interactive Data Playground - Transform docs into chat-based data exploration with code execution, visualizations, and multi-MCP orchestration*
