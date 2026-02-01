# Roadmap: Austria MCP

## Overview

Multi-milestone roadmap transforming Austrian Open Government Data access from MCP server to interactive data playground. v1.0-v2.1 delivered comprehensive documentation infrastructure with AI-powered features. v2.2 adds chat-based data exploration with code execution in E2B sandboxes, inline visualizations, and multi-MCP orchestration across 60,000+ datasets.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 (shipped 2026-01-17)
- ✅ **v1.1 Documentation Excellence** - Phases 10, 16, 17 (shipped 2026-01-18)
- ✅ **v1.2 Documentation Rebuild** - Phases 18-24 (shipped 2026-01-20)
- ✅ **v2.0 Professional Documentation System** - Phases 2-9 (shipped 2026-01-22)
- ✅ **v2.1 Documentation Excellence & AI Features** - Phases 10-13 (shipped 2026-01-23)
- 🚧 **v2.2 Interactive Data Playground** - Phases 14-20 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-9) - SHIPPED 2026-01-17</summary>

Comprehensive MCP server for Austrian Open Government Data with smart search, quality insights, data preview, and AI-powered semantic matching.

</details>

<details>
<summary>✅ v1.1 Documentation Excellence (Phases 10, 16, 17) - SHIPPED 2026-01-18</summary>

Improved documentation infrastructure with i18n foundation, comprehensive polish, and two-workspace architecture.

</details>

<details>
<summary>✅ v1.2 Documentation Rebuild (Phases 18-24) - SHIPPED 2026-01-20</summary>

Comprehensive, production-ready documentation from foundation to polish, with auto-generated tool reference, progressive disclosure patterns, and visual architecture aids.

</details>

<details>
<summary>✅ v2.0 Professional Documentation System (Phases 2-9) - SHIPPED 2026-01-22</summary>

Enterprise-grade documentation infrastructure with modern tooling (Bun, Biome), shadcn-like CLI installer, live AI testing interface, and auto-generated API documentation from OpenAPI schema.

</details>

<details>
<summary>✅ v2.1 Documentation Excellence & AI Features (Phases 10-13) - SHIPPED 2026-01-23</summary>

**Milestone Goal:** Perfect the documentation experience with simplified navigation, comprehensive video content, AI-powered chat for docs Q&A, and professional repository polish.

### Phase 10: Navigation Simplification
**Goal**: Users navigate documentation through clear 3-tab structure (Docs/API/Try) with consistent information architecture, no duplicate titles, and professional repository presentation

**Depends on**: Nothing (first phase of v2.1)

**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, README-01, README-02, README-03, README-04, README-05, README-06, README-07, CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User sees 3 main navigation tabs (Docs/API/Try) instead of 8-section sidebar
2. User clicks existing external links and arrives at correct page via redirects
3. User views any documentation page without seeing duplicate H1 titles
4. User navigates on mobile viewport with clear, accessible tab structure
5. User reads README and understands project purpose, installation, and quick start within 5 minutes
6. User browses repository and finds consistent file organization with no unused files
7. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 6 plans

Plans:
- [x] 10-01: Consolidate navigation meta.json from 8 tabs to 3 (Docs/API/Try) with comprehensive redirect mapping
- [x] 10-02: Fix duplicate title rendering and validate all internal links
- [x] 10-03: Create state-of-the-art README with quick start guide and visual examples
- [x] 10-04: EditorConfig, gitignore, and config consolidation
- [x] 10-05: Unused file detection and dependency audit
- [x] 10-06: Comprehensive build verification

### Phase 11: CLI Excellence
**Goal**: Users interact with CLI through intuitive prompts, clear error messages, and self-maintenance commands matching shadcn-level polish

**Depends on**: Phase 10

**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CLI-08, CLI-09, CLI-10, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User runs interactive setup and receives guidance through configuration options
2. User provides invalid input and immediately sees clear error message with solution steps
3. User runs update command and sees diff preview before applying changes
4. User runs health check command and receives diagnostic information for configuration issues
5. User runs CLI in CI environment and commands succeed without interactive prompts
6. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Interactive prompts with validation feedback and CI detection
- [x] 11-02-PLAN.md — Diff preview, health check, and update commands
- [x] 11-03-PLAN.md — Semantic versioning, documentation, and build verification

### Phase 12: RAG Documentation Chat
**Goal**: Users ask natural language questions about documentation and receive accurate answers with source citations, streaming responses, and code examples

**Depends on**: Phase 10 (stable navigation URLs for citations)

**Requirements**: RAG-01, RAG-02, RAG-03, RAG-04, RAG-05, RAG-06, RAG-07, RAG-08, RAG-09, RAG-10, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User asks "How do I search for Vienna datasets?" and receives relevant answer with clickable documentation links
2. User asks off-topic question and receives polite redirect to documentation scope
3. User sees responses stream token-by-token within 1 second of asking
4. User asks troubleshooting question and receives code examples matching their scenario
5. User follows multiple-turn conversation and chat maintains context across messages
6. User clicks chat citation links and arrives at correct documentation section
7. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md — Vector indexing with build-time embedding and section-based chunking
- [x] 12-02-PLAN.md — RAG API route with streaming, citations, and similarity threshold validation
- [x] 12-03-PLAN.md — Chat UI integration with clickable citations and comprehensive build verification

### Phase 13: Video Tutorials
**Goal**: Users watch programmatically-generated video tutorials with captions demonstrating installation, workflows, and architecture

**Depends on**: Phase 10 (stable documentation structure for embedding videos)

**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03, VIDEO-04, VIDEO-05, VIDEO-06, VIDEO-07, VIDEO-08, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User watches quickstart video (2-3 min) demonstrating installation to first query
2. User watches workflow videos (3-5 min each) covering 3-4 key workflows with real data
3. User watches architecture video (5-7 min) understanding system design visually
4. User enables captions on any video and reads synchronized text for accessibility
5. User views video embedded in documentation page with native controls
6. Developer changes video code and runs render script to generate updated MP4 without manual filming
7. Developer runs full build and completes within 5 minutes (videos cached, not re-rendered)

**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md — Remotion infrastructure with build-time rendering and file-based caching
- [x] 13-02-PLAN.md — Video compositions (QuickStart 2.5min, Workflow 4min, Architecture 6min) with frame-based animations
- [x] 13-03-PLAN.md — WebVTT captions, responsive VideoPlayer component, documentation embedding, and build verification

</details>

### 🚧 v2.2 Interactive Data Playground (In Progress)

**Milestone Goal:** Transform docs from static site into interactive data playground where users chat with AI to explore 60,000+ Austrian datasets, execute Python code in E2B sandboxes after explicit approval, create visualizations, and persist conversations across sessions.

- [x] **Phase 14: Database Foundation & Message Persistence** - Neon Postgres with Drizzle ORM, message parts array, security-first schema
- [ ] **Phase 15: E2B MCP Integration & Sandbox Setup** - Multi-MCP orchestration, health checks, graceful degradation
- [ ] **Phase 16: Multi-MCP Orchestration & Data Discovery** - Tool aggregation, AI Gateway, context-aware dataset search
- [ ] **Phase 17: Code Execution Pipeline** - Sandbox lifecycle, timeout enforcement, error recovery
- [ ] **Phase 18: Tool Approval Flow** - Approval dialog, security layer, execution state tracking
- [ ] **Phase 19: Visualization Rendering** - Inline charts, base64 extraction, preview URLs
- [ ] **Phase 20: Chat Interface & Polish** - Streaming UI, debug mode, loading states, custom cards

## Phase Details

### Phase 14: Database Foundation & Message Persistence
**Goal**: User conversations persist across sessions with secure message storage that prevents approval bypass attacks

**Depends on**: Nothing (first phase of v2.2)

**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, PERSIST-06, PERSIST-07, SEC-03

**Success Criteria** (what must be TRUE):
1. User sends messages and sees them persist after browser refresh
2. User loads conversation and sees up to 50 messages per page with accurate history
3. User's tool calls and results appear in message history with correct formatting
4. Developer inspects database and sees JSONB parts array storing text, tool calls, and results
5. Developer inspects database schema and sees execution_status column preventing replay attacks
6. User conversation with 50+ images loads in under 2 seconds (images stored as blob URLs, not inline base64)
7. Guest user returns after 24 hours and resumes previous conversation via session cookie

**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md — Database schema and migrations (Neon + Drizzle, AI SDK parts pattern, GIN indexes)
- [x] 14-02-PLAN.md — Session management (better-auth with anonymous sessions, 7-day cookies)
- [x] 14-03-PLAN.md — Message persistence API (CRUD operations, cursor pagination, blob storage)

### Phase 15: E2B MCP Integration & Sandbox Setup
**Goal**: Both data.gv.at and E2B sandbox servers connect reliably with health checks, and sandboxes clean up automatically to prevent resource exhaustion

**Depends on**: Phase 14 (sandbox tracking in database)

**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, EXEC-04, EXEC-06, EXEC-10, SEC-04

**Success Criteria** (what must be TRUE):
1. User sees clear connection status for both MCP servers before sending first message
2. User sends message when E2B unavailable and receives graceful error explaining only dataset search works
3. Developer inspects logs and sees health check pings for both MCP servers on startup
4. User creates 20+ sandboxes in sequence and system remains responsive (automatic cleanup after 1 hour)
5. Developer inspects database and sees sandbox_id column tracking active workspaces with timestamps
6. User's sandbox executes in isolated environment without network access to production data
7. System recovers automatically when MCP server crashes (reconnection logic triggers)

**Plans**: 3 plans

Plans:
- [x] 15-01-PLAN.md — E2B client setup and data.gv.at MCP client with HTTP transport
- [x] 15-02-PLAN.md — Health checks via tool discovery and graceful degradation
- [x] 15-03-PLAN.md — Sandbox lifecycle management with lazy cleanup (no cron)

### Phase 16: Multi-MCP Orchestration & Data Discovery
**Goal**: AI coordinates tools from both MCP servers and generates code using actual dataset schemas discovered via search

**Depends on**: Phase 15 (MCP servers connected and healthy)

**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05

**Success Criteria** (what must be TRUE):
1. User asks "analyze Vienna air quality" and AI searches datasets then generates code using discovered schema
2. User sees dataset quality metrics (completeness, freshness) before code generation
3. User receives code that references correct column names from dataset schema
4. Developer inspects AI requests and sees tools from both data.gv.at and E2B merged in single call
5. User asks question about Austrian energy data and AI uses semantic search to find relevant datasets
6. User clicks dataset download link from chat and receives CSV file
7. Developer verifies AI provider is Vercel AI Gateway with claude-sonnet-4.5 model

**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

### Phase 17: Code Execution Pipeline
**Goal**: AI-generated Python code executes in sandboxes with timeout enforcement, multi-file support, and automatic error recovery

**Depends on**: Phase 16 (AI generates code with correct schemas)

**Requirements**: EXEC-01, EXEC-05, EXEC-07, EXEC-08, EXEC-09

**Success Criteria** (what must be TRUE):
1. User requests analysis and AI generates Python code matching dataset schema
2. User's code executes and completes within 30 seconds (timeout enforced)
3. User requests multi-file project and AI creates proper Python package structure with imports
4. User's code fails with error and AI automatically regenerates fixed version
5. Developer inspects sandbox and sees full project structure (not just single script)
6. User sees stdout/stderr output from code execution for debugging
7. User's long-running code stops at 30 seconds with clear timeout message

**Plans**: TBD

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD

### Phase 18: Tool Approval Flow
**Goal**: User explicitly approves every code execution with full code preview, and approval state persists to prevent replay attacks

**Depends on**: Phase 17 (execution pipeline working)

**Requirements**: SEC-01, SEC-02, SEC-05, SEC-06, EXEC-02, EXEC-03, PERSIST-05

**Success Criteria** (what must be TRUE):
1. User receives approval dialog before ANY code execution with complete code preview
2. User clicks Approve and sees code execute in sandbox
3. User clicks Reject and conversation continues without execution
4. User reloads page and previous approved execution does not re-run (execution_status prevents replay)
5. Developer inspects approval dialog and sees syntax-highlighted code with full visibility
6. User's sandbox has network access only to approved domains (data.gv.at, matplotlib CDN)
7. Guest user operates without authentication (no login required for v2.2)

**Plans**: TBD

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD

### Phase 19: Visualization Rendering
**Goal**: User sees matplotlib, seaborn, and plotly charts inline in chat, with automatic compression for large images and support for E2B preview URLs

**Depends on**: Phase 18 (approved code executes and returns results)

**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05

**Success Criteria** (what must be TRUE):
1. User requests chart and sees matplotlib PNG rendered inline in chat as base64 image
2. User creates plotly interactive chart and clicks E2B preview URL to view in browser
3. User generates 2MB visualization and sees it compress automatically to under 500KB
4. User's visualization fails to render and receives clear error message with debugging context
5. Developer inspects tool results and sees AI receives stdout/stderr for error diagnosis
6. User sees seaborn charts with correct styling (not default matplotlib theme)
7. User creates multiple charts in sequence and all display inline without manual downloads

**Plans**: TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD

### Phase 20: Chat Interface & Polish
**Goal**: Users experience polished chat interface with streaming responses, debug mode for power users, and custom UI cards for dataset results

**Depends on**: Phase 19 (all backend features working)

**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, DATA-06

**Success Criteria** (what must be TRUE):
1. User sends message and sees response stream token-by-token within 1 second
2. User views message history with timestamps showing chronological conversation
3. User enables debug mode and sees MCP tool invocations with parameter details
4. User encounters error and sees clear, actionable error message explaining what happened
5. User reloads page and previous conversation loads with all messages intact
6. User receives dataset result and sees custom UI card (not plain text) with metadata
7. User sees loading spinner during AI processing and code execution

**Plans**: TBD

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD
- [ ] 20-03: TBD

## Progress

**Execution Order:**
v2.2 phases execute in numeric order: 14 → 15 → 16 → 17 → 18 → 19 → 20

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 14. Database Foundation | 3/3 | ✓ Complete | 2026-02-01 |
| 15. E2B MCP Integration | 3/3 | ⚠ Gaps found | 2026-02-01 |
| 16. Multi-MCP Orchestration | 0/TBD | Not started | - |
| 17. Code Execution Pipeline | 0/TBD | Not started | - |
| 18. Tool Approval Flow | 0/TBD | Not started | - |
| 19. Visualization Rendering | 0/TBD | Not started | - |
| 20. Chat Interface & Polish | 0/TBD | Not started | - |

---

*Last updated: 2026-02-01 after Phase 15 planning*
