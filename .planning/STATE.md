# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.
**Current focus:** Phase 14 - Database Foundation & Message Persistence

## Current Position

Phase: 15 of 20 (Daytona MCP Integration & Sandbox Setup)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-01 — Completed 15-02-PLAN.md

Progress: [█░░░░░░░░░] 25% (5/20 plans complete in v2.2 estimate)

## Performance Metrics

**v2.1 Milestone (Complete):**
- Total plans completed: 14
- Average duration: 16.6 min
- Total execution time: 3.9 hours
- Build time: 152s (<5 min target maintained)

**v2.2 Milestone (Starting):**
- Plans completed: 5
- Average duration: 6.4 min ((19 + 2 + 3 + 4 + 4) / 5)
- Phase: Phase 15 in progress (2 plans complete)

**Recent Trend:**
- v2.1 completed with 15 plans across 4 phases
- v2.2: 5 plans complete - average 6.4 min (trend accelerating)
- Phase 14-01: 19 min (database setup, migrations)
- Phase 14-02: 2 min (configuration task)
- Phase 14-03: 3 min (API routes with validation)
- Phase 15-01: 4 min (E2B + MCP client setup)
- Phase 15-02: 4 min (health checks + graceful degradation)
- Trend: MCP foundation rapid, building on Phase 14 database

*Updated after v2.2 roadmap creation*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| ID | Decision | Status | Phase |
|----|----------|--------|-------|
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
- Phase 15: In progress (15-01: ✅ MCP clients, 15-02: ✅ health checks + graceful degradation, 15-03: tool aggregation pending)
- Phase 16: Tool aggregation and multi-MCP orchestration
- Phase 18: Security patterns (approval flow builds on execution_status)
- Phase 19: Image extraction (uses uploadImageFromBase64 from 14-03)
- Phase 20: Chat UI (uses message APIs from 14-03)

### Blockers/Concerns

**Phase 15 (MCP Integration):**
- ✅ RESOLVED: Daytona MCP verified non-existent via research (15-RESEARCH.md), using E2B Code Interpreter instead
- ✅ RESOLVED: Health check implementation complete (15-02: checkMCPHealth via tools() method)
- ✅ RESOLVED: Graceful degradation implemented (15-02: separate try/catch per service, fallback error tools)
- ❌ BLOCKER for testing: E2B_API_KEY required (get from https://e2b.dev/dashboard - free tier available)
- ❌ BLOCKER for testing: DATAGVAT_MCP_URL required (FastMCP server deployment needed)
- Pending: Tool aggregation for chat integration (Phase 15-03)

**Phase 14 (Database):**
- ✅ RESOLVED: All database schema and API infrastructure complete
- ❌ BLOCKER for testing: DATABASE_URL + BETTER_AUTH_SECRET + BLOB_READ_WRITE_TOKEN required (user must configure services)
- See: 14-03-USER-SETUP.md for Vercel Blob configuration

**Phase 15 (Sandbox Cleanup):**
- Sandbox resource exhaustion requires cleanup logic (1-hour timeout implemented in 15-01)
- Background job needed for orphaned sandbox cleanup (Phase 15-03)

## Session Continuity

Last session: 2026-02-01 09:12 UTC
Stopped at: Completed 15-02-PLAN.md (Health monitoring and graceful degradation)
Resume file: None
Next step: Continue Phase 15 (15-03: Tool aggregation for chat integration)

---

*v2.2 milestone: Interactive Data Playground - Transform docs into chat-based data exploration with code execution, visualizations, and multi-MCP orchestration*
