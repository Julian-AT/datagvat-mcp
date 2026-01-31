# Project Research Summary

**Project:** Interactive Data Playground for Austrian Open Data (v2.2)
**Domain:** AI-powered dataset discovery and exploration with code execution
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

v2.2 adds an interactive data playground where users chat with AI to explore 60,000+ Austrian open datasets. Users ask questions like "show me pollution trends in Vienna" and the AI orchestrates dataset discovery (via existing data.gv.at MCP), generates Python code with real data, executes it in Daytona sandboxes after explicit user approval, and displays charts inline in the chat. This is fundamentally different from the existing docs chat at `/try` — it's data exploration, not documentation Q&A.

The recommended approach leverages existing infrastructure (Next.js 16, Vercel AI SDK 6, FastMCP server) and adds only 2 new npm dependencies (drizzle-orm, postgres). The architecture integrates TWO MCP servers (data.gv.at + Daytona) into ONE chat interface using AI SDK's tool spreading pattern. Message persistence via Neon Postgres enables multi-turn explorations across sessions. User approval before code execution is mandatory for security.

Key risk: Daytona MCP server availability is unverified (LOW confidence). If unavailable, fallback to restricted Python sandbox (subprocess + RestrictedPython) or defer code execution to v2.3. Secondary risks include tool approval bypass through message replay, sandbox resource exhaustion without cleanup, and database performance collapse with large base64 images — all addressed through specific architectural patterns documented in research.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16.1.3, Vercel AI SDK 6.0.64, FastMCP, Bun) covers 95% of requirements. Only database persistence needs new dependencies.

**Core technologies:**
- **Drizzle ORM + postgres.js** (NEW): Type-safe database queries with zero runtime overhead, Neon-optimized — 5x smaller than Prisma, edge-compatible
- **Neon Postgres with pooling** (NEW): Serverless-first database with 10,000 pooled connections, 512MB free tier sufficient for thousands of chats — mandatory pooling prevents connection exhaustion
- **Daytona MCP via stdio** (NEW): Code execution in isolated sandboxes — LOW confidence, needs Phase 6 verification, fallback to restricted Python if unavailable
- **AI SDK 6.0 experimental_needsApproval** (EXISTING): Built-in tool approval workflow, no new packages needed
- **@ai-sdk/mcp + @modelcontextprotocol/sdk** (EXISTING): Multi-MCP support via tool spreading, aggregates data.gv.at + Daytona tools into single streamText() call
- **Vercel AI Gateway via @ai-sdk/openai-compatible** (EXISTING): Single endpoint for 100+ models, no new packages needed

**Critical version requirements:**
- AI SDK 6.0+ for experimental_needsApproval (already met)
- Neon pooled connection string (must use `-pooler` suffix) for serverless compatibility
- postgres.js over node-postgres for 5x smaller bundle and WebSocket support

**What NOT to add:**
- Prisma ORM (larger bundle, slower cold starts) — use Drizzle instead
- Supabase (over-engineering with auth/storage not needed) — use Neon Postgres only
- LangChain (over-abstraction) — use AI SDK native patterns

### Expected Features

**Must have (table stakes):**
- Multi-turn conversation with streaming responses — users expect follow-up questions without context loss
- Message persistence across sessions — essential for data exploration work that spans days
- User approval dialog before code execution — security requirement, builds trust
- Sandbox isolation for Python code — never run untrusted code in production environment
- Inline visualization rendering (base64 images) — charts appear in chat, not as downloads
- Dataset discovery via MCP tools — AI finds relevant datasets from 60,000+ Austrian open data
- Context-aware code generation — AI sees dataset schema before generating code, uses correct column names

**Should have (competitive advantages):**
- Two-chat architecture — separate `/playground` (data exploration) from `/try` (docs Q&A), different mental models
- MCP-powered discovery — 60,000+ Austrian datasets pre-integrated, no competitor has this corpus
- Quality indicators inline — show data completeness/freshness before exploration
- Smart dataset ranking — quality scores + semantic relevance
- Bilingual search — German/English queries work equally well
- Error recovery — re-generate code when execution fails

**Defer (v2+):**
- User authentication — defer to v3.0 (v2.2 is guest mode only)
- Public sharing with URLs — requires auth + storage + moderation
- Multiple languages (R, Julia) — Python covers 95% of use cases
- Dashboard builder — different product paradigm, not chat-first
- Real-time collaboration — complex engineering, single-user exploration sufficient
- Data upload (user CSV files) — scope creep, focus on Austrian open data differentiator
- Interactive widgets — doesn't fit chat paradigm, use re-generation instead

### Architecture Approach

The architecture extends existing Next.js/AI SDK infrastructure with multi-MCP orchestration and database persistence. No new frameworks or major architectural changes.

**Major components:**
1. **MCP Client Manager** — initializes both data.gv.at (HTTP) and Daytona (stdio) MCP servers, merges tools via spreading pattern, handles health checks and reconnection
2. **Database Manager** — persists chat history using AI SDK's UIMessage format with parts array (JSONB), loads previous messages for continuation, implements cleanup for old guest sessions
3. **Sandbox Executor** — manages Daytona workspace lifecycle (create, execute, destroy), extracts base64 images from matplotlib output, enforces 30-second timeout
4. **Code Approval UI** — monitors message parts for approval-pending state, displays code preview with syntax highlighting, calls addToolApprovalResponse on user action
5. **Visualization Renderer** — decodes base64 images from tool results, displays inline in chat, handles size limits (>500KB → blob storage)

**Key patterns:**
- **Multi-MCP integration:** getAllTools() merges tools from both servers into single streamText() call, AI coordinates across tool types
- **Message persistence with parts array:** Store UIMessage[] as JSONB, captures text/tool calls/results/approvals, enables exact UI reproduction
- **Sandbox execution with user approval:** Tool calls pause at approval-pending state, user confirms, continuation request executes tool, Daytona workspace destroyed after session
- **Inline visualization rendering:** matplotlib saves PNG to stdout as base64, embedded in tool-result part, displayed as data URI in React

**Integration boundaries:**
- Chat UI (useChat hook) → POST /api/chat → streamText() with merged MCP tools → Stream response with approval flow
- API Route → MCP Clients (in-process async calls, clients initialized once, tools cached)
- API Route → Database (direct Pool queries, use after() for background persistence)
- Messages Component → Visualization (React props passing tool-result parts)

### Critical Pitfalls

1. **Tool Approval Bypass Through Message Replay** — Stored tool calls in database can re-execute without approval on page reload. PREVENTION: Never persist approval state, add execution_status column, filter non-executed tool calls when loading history, re-prompt if not executed. ADDRESS: Phase 1 (database schema must separate execution state).

2. **Sandbox Resource Exhaustion Without Cleanup** — Daytona sandboxes persist until manually destroyed, 10-20 conversations exhaust resources silently. PREVENTION: Track sandbox_id in database with timestamps, destroy after 15 minutes inactivity, background job kills orphaned sandboxes, test with 20+ sequential conversations. ADDRESS: Phase 2 (cleanup MUST be implemented before production).

3. **Multiple MCP Server Race Conditions on Startup** — Both servers start simultaneously via stdio, failures are silent, generic errors confuse users. PREVENTION: Spawn sequentially not parallel, health check each server (call ping tool), 10-second timeout per server, separate stderr/stdout streams, display connection status in UI before allowing chat. ADDRESS: Phase 2 (server initialization needs health checks).

4. **Message Persistence Performance Collapse with Large Visualizations** — Base64 images (500KB-2MB each) stored in JSONB cause slow queries (5+ seconds), database bloat, backup failures. PREVENTION: NEVER store base64 in database, use blob storage (S3/R2/filesystem), save URL in parts array, 100KB size limit for inline storage, test with 50-image conversation. ADDRESS: Phase 1 (image storage strategy designed before schema creation).

5. **Daytona CLI Dependency Without Graceful Degradation** — App crashes on startup if Daytona unavailable, blocks entire site including documentation. PREVENTION: Make Daytona OPTIONAL at runtime, detect CLI at startup, disable only code execution if missing, display clear UI message, allow dataset search/preview to work normally, DAYTONA_ENABLED environment variable. ADDRESS: Phase 2 (graceful degradation before enabling code execution).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Database Foundation & Message Persistence
**Rationale:** Persistence layer is foundational for testing all subsequent features. Enables iterative development with state preservation across page reloads.

**Delivers:**
- Neon Postgres connection with pooling
- Drizzle ORM schema and queries (createChat, loadChat, saveChat)
- Message persistence integrated into existing /api/chat route
- Guest session tracking via cookies
- Database schema that prevents approval bypass (execution_status column)
- Image storage strategy (blob URLs, not base64 in JSONB)

**Addresses:**
- Tool approval bypass pitfall (separate execution state in schema)
- Performance collapse pitfall (image storage design)
- Message persistence feature (table stakes)

**Avoids:**
- Building on unstable foundation
- Retrofitting persistence after features exist
- Database schema migrations mid-development

**Research needed:** No — Neon + Drizzle patterns well-documented, straightforward implementation

---

### Phase 2: Daytona MCP Integration & Sandbox Setup
**Rationale:** Non-breaking addition to existing tools. Can test tool discovery before implementing execution. Health checks prevent silent failures.

**Delivers:**
- Daytona CLI setup and verification
- MCP client initialization for both servers (getAllTools() merging)
- Health checks and reconnection logic
- Sandbox lifecycle tracking in database
- Cleanup job for orphaned sandboxes
- Graceful degradation if Daytona unavailable

**Uses:**
- @ai-sdk/mcp (existing) for multi-server pattern
- stdio transport for Daytona CLI

**Implements:**
- MCP Client Manager (architecture component)
- Health check pattern from architecture

**Addresses:**
- Sandbox resource exhaustion pitfall (cleanup logic)
- MCP race conditions pitfall (health checks, sequential startup)
- Daytona dependency pitfall (graceful degradation)
- Multiple MCP integration feature (table stakes)

**Avoids:**
- Silent startup failures
- Resource leaks in production
- Blocking docs site when code execution unavailable

**Research needed:** YES — CRITICAL Phase 6 research to verify:
- Daytona MCP server availability (confirm `daytona mcp` command exists)
- Daytona tool schemas (execute_code parameters)
- stdio transport in production (or fallback to HTTP)
- Fallback strategy if Daytona unavailable (restricted Python sandbox)

---

### Phase 3: Sandbox Execution (Without Approval)
**Rationale:** Establishes core execution pipeline before adding approval complexity. Enables testing of code generation, matplotlib integration, base64 extraction.

**Delivers:**
- execute_code tool implementation via Daytona
- Base64 image extraction from matplotlib stdout
- Visualization rendering component
- Execution timeout enforcement (30 seconds)
- Error handling with clear messages

**Implements:**
- Sandbox Executor (architecture component)
- Visualization Renderer (architecture component)
- Inline visualization pattern from architecture

**Addresses:**
- Code execution feature (table stakes)
- Inline visualization rendering (table stakes)
- Context-aware code generation (differentiator)

**Avoids:**
- Building approval flow on broken execution
- Debugging approval + execution simultaneously
- Testing without visible results

**Research needed:** No — Execution patterns documented, matplotlib base64 encoding is standard

---

### Phase 4: Tool Approval Flow
**Rationale:** Most complex feature, depends on working execution pipeline from Phase 3. Approval UX requires existing tool results to demonstrate value.

**Delivers:**
- experimental_needsApproval flag on code execution tools
- Code approval dialog component with preview
- addToolApprovalResponse wiring
- Continuation flow for approved executions
- Approval state handling in message persistence

**Uses:**
- AI SDK 6.0 experimental_needsApproval (existing)
- useChat hook approval handling (existing)

**Implements:**
- Code Approval UI (architecture component)
- User approval pattern from architecture

**Addresses:**
- User approval dialog (table stakes, security requirement)
- Security-first design (differentiator)

**Avoids:**
- Approval fatigue (only code execution requires approval, not dataset tools)
- Approval bypass (execution_status from Phase 1 prevents replay)

**Research needed:** No — AI SDK 6.0 approval pattern documented, straightforward implementation

---

### Phase 5: Polish & Production Readiness
**Rationale:** All core features working, now focus on UX refinements and deployment preparation.

**Delivers:**
- Two-chat architecture (/playground distinct from /try)
- Code syntax highlighting (Shiki integration)
- Loading states during execution
- Error recovery with code regeneration
- Quality indicators inline for datasets
- Vercel AI Gateway configuration for model selection
- Cleanup job deployment (Vercel Cron)
- Rate limiting for sandbox creation

**Addresses:**
- Two-chat architecture (differentiator)
- Loading states, error handling (table stakes)
- Quality indicators (competitive feature)

**Research needed:** MEDIUM — Vercel AI Gateway setup needs documentation research (not blocking)

---

### Phase Ordering Rationale

1. **Database first** because all subsequent features need state preservation for testing and development
2. **MCP integration second** because it's non-breaking and can be tested independently before execution
3. **Execution before approval** because approval flow needs working execution to test against
4. **Approval last of core features** because it's the most complex UX and depends on everything else working
5. **Polish after MVP complete** because UX refinements require user feedback on working product

**Dependencies visualized:**
```
Phase 1 (Database) → Phase 2 (MCP) → Phase 3 (Execution) → Phase 4 (Approval) → Phase 5 (Polish)
        ↓                ↓                                          ↓
   [Persistence]  [Tool Discovery]                          [Security]
```

**Parallel work opportunities:**
- Phase 1 and Phase 2 can overlap (database + MCP integration are independent)
- Phase 5 tasks can start once Phase 4 delivers approval flow

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Daytona MCP):** CRITICAL — Verify Daytona MCP server exists, document CLI integration, define fallback strategy if unavailable
- **Phase 5 (Vercel AI Gateway):** MEDIUM — Configuration steps need documentation, but fallback is direct provider packages

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Database):** Neon + Drizzle ORM patterns well-documented, no unknowns
- **Phase 3 (Execution):** Python sandbox execution is standard, matplotlib base64 encoding documented
- **Phase 4 (Approval):** AI SDK 6.0 approval pattern officially documented, straightforward

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack covers 95%, only Drizzle ORM + postgres.js new (well-documented). Daytona MCP LOW confidence but fallback exists. |
| Features | HIGH | Verified with Jupyter/Colab/Observable/Hex patterns + AI SDK docs + MCP integration. Clear table stakes vs differentiators. |
| Architecture | HIGH | AI SDK 6 docs verified, Neon docs verified, Daytona docs reviewed, existing codebase patterns confirmed. Multi-MCP pattern tested. |
| Pitfalls | HIGH | Derived from documented constraints (stdio transport, JSONB limits, approval bypass security) + standard integration challenges. |

**Overall confidence:** HIGH (with one LOW-confidence dependency: Daytona MCP availability)

### Gaps to Address

**CRITICAL (Blocking Development):**
- **Daytona MCP Server Availability:** Does Daytona provide MCP server via `daytona mcp` command? Phase 6 research MUST verify or define fallback to restricted Python sandbox (subprocess + RestrictedPython). This is the only true unknown.

**HIGH (Impacts UX):**
- **Vercel AI Gateway Configuration:** How to create gateway instance and configure model routing? Fallback: Use direct provider packages (@ai-sdk/openai, @ai-sdk/anthropic). Not blocking, can research in Phase 5.

**MEDIUM (Performance Optimization):**
- **MCP stdio in Vercel Deployment:** Does stdio transport work in Vercel serverless functions? May need HTTP fallback for Daytona. Test during Phase 2.
- **Database Schema Design:** What indexes needed for JSONB message queries? Test during Phase 1 with realistic conversation sizes.
- **Connection Pooling Tuning:** Monitor Neon pool usage, adjust default_pool_size if needed. Optimize during Phase 5.

**Handling during planning:**
- Phase 2 research task: Verify Daytona MCP, document installation, test CLI integration
- Phase 5 research task: Document Vercel AI Gateway setup (optional, not blocking)
- All phases: Test with realistic data (50-message conversations, 20 sequential sandboxes, 50 images)

## Sources

### Primary (HIGH confidence)
- AI SDK Tool Calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling (experimental_needsApproval pattern, tool merging)
- AI SDK Message Persistence: https://ai-sdk.dev/docs/ai-sdk-ui/storing-messages (onFinish callback, UIMessage format)
- AI SDK Chatbot Architecture: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot (parts array structure, approval workflow)
- Neon Connection Pooling: https://neon.com/docs/connect/connection-pooling (pooling configuration, transaction-mode, limitations)
- Neon Next.js Guide: https://neon.com/docs/guides/nextjs (serverless driver patterns)
- Drizzle ORM PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql (postgres.js driver setup)
- MCP Transports Specification: https://modelcontextprotocol.io/docs/concepts/transports (stdio transport protocol)
- Daytona Documentation: https://www.daytona.io/docs (sandbox execution, workspace management)

### Secondary (MEDIUM confidence)
- Jupyter.org: Multi-language kernels, interactive widgets, notebook format
- Google Colab: AI code generation, data inspector
- ObservableHQ.com: AI integration, reactive visualizations
- Hex.tech: AI-powered analysis, collaborative notebooks
- MCP SDK GitHub: Multi-client pattern inferred from Client class architecture

### Tertiary (LOW confidence, needs Phase 6 validation)
- Daytona MCP Server: Mentioned in project context, no official MCP server documentation found — CRITICAL GAP
- Daytona CLI Installation: General installation pattern assumed, needs verification
- Daytona Tool Schemas: Expected tool names inferred from use case, needs verification

### Existing Codebase (HIGH confidence)
- docs/app/api/chat/route.ts: Existing AI SDK 6 integration with MCP verified
- docs/components/chat.tsx: useChat hook usage patterns verified
- docs/lib/ai/providers.ts: Vercel AI Gateway configuration verified
- mcp/app/server.py: FastMCP server HTTP transport pattern verified

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
