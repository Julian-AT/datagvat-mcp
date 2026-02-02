# Austria MCP

## What This Is

A comprehensive MCP server for Austrian Open Government Data via data.gv.at. The definitive way for data analysts and app developers to discover, analyze, download, preview, and understand Austrian open datasets through AI assistants.

## Core Value

Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## Current State

**Latest shipped:** v2.2 Interactive Data Playground (Foundation Complete) (2026-02-02)

**What's working:**
- **Chat Foundation:** Vercel ai-chatbot architecture (schema, routes, components)
- **MCP Integration:** Tool aggregation from data.gv.at + E2B servers with health monitoring
- **Message Persistence:** Chat history with parts array pattern, UUID primary keys
- **Database:** Neon Postgres with Drizzle ORM, migrations working
- **UI Components:** Artifact/canvas pattern for visualizations (created, untested)
- **Build Pipeline:** 481 static pages, successful builds
- **MCP Server:** 25 tools for Austrian open data discovery
- **Documentation:** Comprehensive docs with RAG chat, video tutorials, CLI

**What needs work (v2.3 goals):**
- Tool approval flow (security layer before code execution)
- Visualization rendering (test artifact/canvas components)
- Chat UI polish (streaming indicators, debug mode)
- E2B execution verification (sandbox lifecycle testing)
- TypeScript cleanup (~50 UI component type warnings)

## Current Milestone: v2.3 Production Playground

**Goal:** Make the interactive data playground production-ready with security, working visualizations, and polished UX.

**Target features:**
- Tool approval flow (user confirms before code execution)
- Visualization rendering (test artifact/canvas components with real data)
- E2B sandbox lifecycle (end-to-end execution + cleanup testing)
- Chat UI polish (streaming states, loading indicators, error handling)

## Requirements

### Validated

<!-- Shipped and confirmed valuable across releases -->

**v1.0 MVP (shipped 2026-01-17):**
- ✓ MCP server foundation with FastMCP framework
- ✓ Enterprise infrastructure (retry, rate limiting, structured logging, graceful degradation) — v1.0
- ✓ Advanced search filtering (theme, format, publisher, date range) — v1.0
- ✓ Fuzzy matching for typo tolerance — v1.0
- ✓ Quality-aware ranking and autocomplete suggestions — v1.0
- ✓ Semantic search with LLM query expansion (German/English) — v1.0
- ✓ Data preview capabilities (schema introspection, sample rows for CSV/JSON) — v1.0
- ✓ Related dataset discovery via content similarity — v1.0
- ✓ Comprehensive bilingual documentation (English/German) — v1.0
- ✓ Progress reporting for long-running operations — v1.0
- ✓ Input validation and sanitization across all tools — v1.0
- ✓ Discovery tools (list/get catalogues, datasets, distributions)
- ✓ Analysis tools (metrics, DOI eligibility, quality analysis)
- ✓ Management tools (drafts, publish, hide)
- ✓ Vocabulary tools (list/get/search)
- ✓ MCP Resources for direct data access
- ✓ MCP Prompts for common workflows
- ✓ Test suite with pytest (268 tests)
- ✓ CI/CD pipeline with GitHub Actions
- ✓ mypy --strict type safety compliance

**v1.1 Documentation Excellence (shipped 2026-01-18):**
- ✓ i18n routing foundation with Fumadocs middleware — v1.1
- ✓ Root HTML layout for Next.js App Router compliance — v1.1
- ✓ Icon plugin integration (lucide-react :icon[] syntax) — v1.1
- ✓ Austria brand colors in Tailwind theme — v1.1
- ✓ MCP server setup tested end-to-end (cloud + self-hosted) — v1.1
- ✓ Corrected documentation (directory structure, uv configuration) — v1.1
- ✓ Conversational German documentation (du-form) — v1.1
- ✓ ASCII architecture diagrams — v1.1
- ✓ 100% accurate code examples — v1.1
- ✓ Two-workspace Fumadocs architecture (learning + API) — v1.1
- ✓ Independent workspace configurations — v1.1
- ✓ Unified navigation across workspaces — v1.1

**v1.2 Documentation Rebuild (shipped 2026-01-20):**
- ✓ Complete documentation infrastructure with 7-section hierarchy — v1.2
- ✓ Auto-generated tool reference for all 25 MCP tools (71 parameters, 100% coverage) — v1.2
- ✓ Getting Started section (6 pages: overview, installation, quickstart, first query, quick reference, troubleshooting) — v1.2
- ✓ Guides section (6 pages: searching, data preview, quality metrics, workflow patterns + task-oriented structure) — v1.2
- ✓ Workflows section (6 end-to-end workflows: discovery, quality assessment, data export, comparative analysis, publication research, semantic exploration) — v1.2
- ✓ API Reference section (architecture, MCP protocol, resources, prompts, type system) — v1.2
- ✓ Integration section (Claude Desktop, custom clients, FastMCP internals, error handling, testing patterns) — v1.2
- ✓ Best Practices section (optimization, quality interpretation, rate limiting, caching, comparison tables) — v1.2
- ✓ Progressive disclosure with Basic/Advanced Tabs throughout (persistent state) — v1.2
- ✓ Interactive components (Tabs, Steps, TypeTable, Files, Accordion, Mermaid) — v1.2
- ✓ Visual architecture aids (4 Mermaid diagrams, screenshot infrastructure) — v1.2
- ✓ Production-ready quality (100% sampled examples work, 60/60 requirements verified) — v1.2

**v2.0 Professional Documentation System (shipped 2026-01-22):**
- ✓ Modern build infrastructure (Bun, Biome, professional scripts) — v2.0
- ✓ Streamlined navigation system (3-4 tabs with advanced meta.json) — v2.0
- ✓ Comprehensive link validation and fixes — v2.0
- ✓ Manual documentation rewrite (MS/Google style guides) — v2.0
- ✓ Code quality improvements (remove emojis, clean comments) — v2.0
- ✓ Enhanced CI/CD (GitHub Actions, pre-commit hooks) — v2.0
- ✓ Auto-generated OpenAPI documentation from data.gv.at — v2.0
- ✓ shadcn-like CLI installer for AI tools — v2.0
- ✓ Live AI assistant testing with Vercel AI SDK — v2.0

**v2.1 Documentation Excellence & AI Features (shipped 2026-01-23):**
- ✓ Simplified navigation (8 tabs → 3: Docs/API/Try) with permanent redirects — v2.1
- ✓ Fixed duplicate title rendering (frontmatter + H1) — v2.1
- ✓ State-of-the-art project README with badges and visual examples — v2.1
- ✓ AI-powered documentation chat with full RAG pipeline (Vectra, OpenAI embeddings) — v2.1
- ✓ Comprehensive video tutorials via Remotion (3 videos, 36.1MB, WebVTT captions) — v2.1
- ✓ shadcn-quality CLI improvements (interactive prompts, health checks, self-updates) — v2.1
- ✓ Complete repository cleanup (EditorConfig, .gitignore, dependency audit) — v2.1
- ✓ Build verification after every phase (152s build time under 5-minute constraint) — v2.1

**v2.2 Interactive Data Playground Foundation (shipped 2026-02-02):**
- ✓ Chat foundation (Vercel ai-chatbot architecture: schema, routes, components) — v2.2
- ✓ MCP integration (tool aggregation from data.gv.at + E2B servers with health monitoring) — v2.2
- ✓ Message persistence (chat history with parts array pattern, UUID primary keys) — v2.2
- ✓ Database (Neon Postgres with Drizzle ORM, migrations working) — v2.2
- ✓ UI components (artifact/canvas pattern for visualizations, created but untested) — v2.2
- ✓ Build pipeline (481 static pages, successful builds, TypeScript compiling) — v2.2

### Active

<!-- v2.3 scope: Security, testing, and polish -->

**v2.3 Production Playground:**
- [ ] Tool approval flow (experimental_needsApproval implementation)
- [ ] Visualization rendering verification (artifact/canvas components with matplotlib/plotly)
- [ ] E2B execution testing (sandbox create/execute/cleanup lifecycle)
- [ ] Chat UI polish (streaming states, loading indicators, error messages, retry flows)
- [ ] End-to-end testing (dataset discovery → code generation → execution → visualization)
- [ ] Error recovery patterns (failed execution, sandbox errors, network issues)
- [ ] Documentation updates (playground usage guide, security model, troubleshooting)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

**v2.3 Explicit Exclusions:**
- TypeScript cleanup (~50 UI warnings) — defer to v2.4, functional features take priority
- User authentication — still guest mode only, defer to v3.0
- Public sharing with URLs — requires auth + storage, defer to v3.0
- Multiple programming languages (R, Julia) — Python covers 95% of use cases
- Real-time collaboration — complex engineering, single-user sufficient for now
- Data upload (user CSV files) — focus on Austrian open data differentiator

**v2.2 Explicit Exclusions:**
- User authentication — guest mode only, defer to v3.0
- Teams/collaboration features — single-user focus for v2.2
- Billing integration — free tier only for v2.2
- Multiple sandbox templates — single Python template for v2.2
- Interactive dashboards — basic visualizations only for v2.2
- Public sharing with URLs — defer to v2.3

**General Exclusions:**
- Publishing workflow optimizations — primary users are consumers (analysts, developers), not publishers
- Custom data transformations — out of scope for MCP server; users handle post-download
- Multi-language UI — MCP protocol handles this at client level

## Context

**v1.0 Shipped (2026-01-17):**
- 3,534 lines Python (async, typed with mypy --strict)
- 11,526 lines MDX documentation (bilingual)
- 25 MCP tools, 268 tests
- Layered architecture: MCP interface → Middleware → Dependencies → Client → Models
- Piveau Hub API integration via httpx
- CI/CD pipeline with GitHub Actions

**v1.1 Shipped (2026-01-18):**
- i18n routing and two-workspace Fumadocs architecture
- 100% accurate code examples through grep-based verification
- Conversational German documentation (du-form)

**v1.2 Shipped (2026-01-20):**
- 112 MDX files, 481 static routes generated
- Auto-generation tooling (TypeScript script: Python docstrings → MDX)
- 7-section documentation hierarchy with progressive disclosure
- 6 end-to-end workflow guides with Steps component
- 4 Mermaid architecture diagrams
- 100% of sampled code examples work without modification
- 60/60 requirements verified complete

**v2.1 Shipped (2026-01-23):**
- 14 plans across 4 phases (3.9 hours total)
- 3 Remotion videos (36.1MB total) with WebVTT captions
- RAG chat with Vectra vector DB and OpenAI embeddings
- CLI v0.2.0 with Zod validation and ci-info detection
- 152s build time maintaining <5 minute target

**Technical Stack:**
- **Backend**: FastMCP 2.14+ with enterprise middleware (retry, rate limiting, logging)
- **Frontend**: Next.js 16.1.3 with Tailwind CSS v4, Fumadocs for documentation
- **MCP Server**: Python 3.11+ with async/await, httpx, rdflib, pydantic
- **AI SDK**: Vercel AI SDK 6.0.41 with useChat hook and streaming
- **Database**: Neon Postgres + Drizzle ORM (v2.2 addition)
- **AI Provider**: Vercel AI Gateway with anthropic/claude-sonnet-4 (v2.2 addition)
- **Sandbox**: Daytona MCP via CLI stdio transport (v2.2 addition)

**Deployment Ready:**
- Production build succeeds (481 static pages, zero warnings)
- All 60 v1.2 requirements satisfied
- Comprehensive automated verification complete
- Manual verification deferred to user todo (non-blocking)

## Constraints

- **Framework**: FastMCP 2.3.0+ — established, do not change
- **API**: Piveau Hub API — external dependency, work within its capabilities
- **Python**: 3.11+ — established runtime requirement
- **Protocol**: MCP — tools, resources, prompts, sampling as interface
- **Async**: All I/O operations must be async — established pattern
- **Package Manager**: Bun — established in v2.0, maintain consistency
- **Preserve**: mcp/ directory and existing MCP server — working production code
- **Preserve**: docs/ structure and documentation content — v2.1 investment

## Code Quality Standards

- **Best practices**: Follow established patterns for the stack (Next.js, Drizzle, Vercel AI SDK)
- **Clean code**: Minimize comments — code should be self-explanatory through clear naming
- **Comments**: Only when logic is non-obvious or requires context (WHY, not WHAT)
- **No AI slop**: Avoid verbose documentation blocks, excessive comments, or over-explanation
- **Simple and readable**: Prioritize clarity and maintainability over cleverness

## Quality Assurance Tools

- **web-design-guidelines**: Use for UI code review (accessibility, UX patterns, best practices)
- **Integration**: Invoke after implementing UI components in phases 16-20 (chat interface, approval dialog, visualization rendering)

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastMCP as framework | MCP protocol compliance, active development | ✓ Good |
| httpx for HTTP | Async support, modern API | ✓ Good |
| Pydantic for models | Validation, serialization, settings | ✓ Good |
| Consumers over publishers | Primary audience is analysts/developers | ✓ Good |
| Fumadocs for documentation | Modern framework, i18n support, interactive components | ✓ Good — v1.0 |
| German/English bilingual | Austrian data users speak both languages | ✓ Good — v1.0 |
| Vercel AI SDK for AI features | Mature, streaming support, MCP tool integration | ✓ Good — v2.1 |
| Vercel AI Gateway | Single endpoint for 100+ models, no separate API keys | — Pending — v2.2 |
| Daytona MCP for sandboxes | Secure code execution, CLI-based integration | — Pending — v2.2 |
| Neon Postgres for persistence | Serverless, generous free tier, Drizzle ORM support | — Pending — v2.2 |
| Guest mode only (no auth) | Simplify v2.2 scope, defer user accounts to v3.0 | — Pending — v2.2 |
| Clean code without AI slop | Minimize comments, self-explanatory code, best practices | ✓ Good — v2.2 coding standard |

---
*Last updated: 2026-02-02 after v2.3 milestone started
