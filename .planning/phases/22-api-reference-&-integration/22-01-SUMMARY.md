---
phase: 22-api-reference-&-integration
plan: 01
subsystem: documentation
tags: [fastmcp, mcp-protocol, middleware, context-injection, decorator-patterns, client-integration]

# Dependency graph
requires:
  - phase: 21-auto-generated-tools-reference
    provides: Auto-generated tool documentation with TypeTable formatting
  - phase: 20-guides-and-workflows
    provides: Guide structure and progressive disclosure patterns
  - phase: 18-documentation-foundation
    provides: 7-section hierarchy and advanced topics section
provides:
  - FastMCP framework internals documentation (1112 lines)
  - FastMCP client integration patterns (in-memory, subprocess, HTTP)
  - Middleware development guide with real Austria MCP examples
  - Context injection and lifespan management patterns
  - Cross-references between integration and advanced guides
affects: [22-02-api-reference-enhancement, testing-documentation, deployment-guides]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Decorator-based tool registration with type hints
    - Context injection for dependency access
    - Middleware order pattern (Logging → Error → Retry → Rate → Audit → Auth)
    - Lifespan async context manager for startup/shutdown
    - Pydantic models for complex type schemas
    - In-memory Client pattern for testing
    - Subprocess Client pattern for production
    - HTTP Client pattern for web applications

key-files:
  created: []
  modified:
    - docs/advanced/fastmcp-internals.mdx
    - docs/integration/other-clients.mdx
    - docs/advanced/meta.json
    - docs/.source/browser.ts
    - docs/.source/server.ts

key-decisions:
  - "FastMCP internals guide covers 7 consolidated sections (reduced from 10 via focused consolidation)"
  - "Code examples extracted from actual Austria MCP codebase (mcp/app/server.py, middleware.py, tools/discovery.py)"
  - "Middleware order documentation emphasizes why order matters with failure scenarios"
  - "Three FastMCP client patterns documented: in-memory (testing), subprocess (production), HTTP (web)"
  - "Common pitfalls section includes diagnostic steps for troubleshooting"

patterns-established:
  - "Pattern 1: Always accept `ctx: Context` as first parameter in tools for dependency injection"
  - "Pattern 2: Middleware order is critical - document with inbound/outbound flow diagrams"
  - "Pattern 3: Use Pydantic models for complex types to leverage FastMCP schema generation"
  - "Pattern 4: Extract code examples from real implementation, not pseudo-code"
  - "Pattern 5: Include diagnostic steps in pitfall documentation (symptoms → fix → verification)"

# Metrics
duration: 15min
completed: 2026-01-20
---

# Phase 22 Plan 01: FastMCP Internals & Client Integration

**Comprehensive FastMCP framework guide (1112 lines) with decorator patterns, Context injection, middleware development, and three client integration patterns extracted from Austria MCP codebase**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-20T12:30:13Z
- **Completed:** 2026-01-20T12:45:43Z
- **Tasks:** 3 (all tasks already complete from previous session)
- **Files modified:** 5 (verified content, committed navigation updates)

## Accomplishments

- **FastMCP Internals Guide** - 1112-line comprehensive guide covering decorator patterns, Context injection, middleware development, lifespan management, resources/prompts, and common pitfalls with real Austria MCP examples
- **Enhanced Client Integration** - other-clients.mdx updated to 607 lines with three FastMCP client patterns (in-memory, subprocess, HTTP) with error handling, progress tracking, and testing examples
- **Navigation Structure** - meta.json updated to include fastmcp-internals in logical position (after architecture, before specialized topics)
- **Cross-References Established** - Bidirectional links between integration and advanced guides for workflow coherence

## Task Commits

All work was completed in a previous session. This execution verified content and committed navigation updates:

1. **Task 1: Create FastMCP Internals Guide** - Already complete (1112 lines, 7 sections)
2. **Task 2: Enhance Custom Client Integration Guide** - Already complete (607 lines with FastMCP patterns)
3. **Task 3: Update Advanced Section Navigation** - `f4b87a3` (feat: update navigation and auto-generated sources)

**Plan metadata:** (no separate metadata commit - all work verified as complete)

## Files Created/Modified

### Documentation Files (verified complete from previous session)

- `docs/advanced/fastmcp-internals.mdx` (1112 lines)
  - **Section 1: Introduction** - What FastMCP abstracts, when to use vs raw SDK, Austria MCP as reference
  - **Section 2: Decorator-Based Tool Registration** - @mcp.tool() pattern, schema generation, parameter validation with Pydantic
  - **Section 3: Context Injection** - App state access, progress reporting, request correlation
  - **Section 4: Middleware Development** - Middleware order importance, custom middleware patterns, real examples (AuditMiddleware, AuthMiddleware)
  - **Section 5: Lifespan Management & Type System** - Async context manager, type-safe config with Pydantic, complex types with JSON Schema generation
  - **Section 6: Resources & Prompts** - URI-based resources, reusable workflow prompts
  - **Section 7: Extension Patterns & Common Pitfalls** - Templates for custom tools/middleware, diagnostic steps for 4 common pitfalls

- `docs/integration/other-clients.mdx` (607 lines, enhanced sections)
  - **In-Memory Client Pattern** - Direct connection without subprocess, 10-100x faster for testing
  - **Subprocess Client Pattern** - Production pattern with process isolation
  - **HTTP Client Pattern (SSE)** - Web applications and remote access
  - **Error Handling** - ToolError, ConnectionError, TimeoutError with examples
  - **Progress Tracking** - Long-running operation feedback
  - **Batch Operations** - Parallel tool calls with asyncio.gather
  - **Testing with FastMCP Client** - Unit testing patterns

### Navigation & Auto-Generated Files (committed this session)

- `docs/advanced/meta.json` - Added fastmcp-internals, error-handling, testing entries
- `docs/.source/browser.ts` - Regenerated Fumadocs browser source
- `docs/.source/server.ts` - Regenerated Fumadocs server source

## Decisions Made

None - plan executed exactly as written. All content already complete from previous session, this execution verified and committed navigation updates.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files were already complete from a previous session. This execution:
1. Verified content meets requirements (line counts, cross-references, code examples)
2. Committed navigation and auto-generated source updates
3. Documented execution in SUMMARY.md

## Code Examples Extracted

All code examples are from actual Austria MCP codebase:

**From mcp/app/server.py:**
- FastMCP initialization with middleware stack
- Lifespan async context manager with AppState
- Tool registration pattern

**From mcp/app/middleware.py:**
- AuditMiddleware implementation (timing and logging)
- AuthMiddleware implementation (API key validation)
- MiddlewareContext access patterns

**From mcp/app/tools/discovery.py:**
- list_catalogues tool with Context usage
- Progress reporting with ctx.report_progress()
- Exception conversion to ToolError

**From mcp/app/client.py (referenced in research):**
- PiveauClient HTTP client patterns
- Error handling and retry logic

## Next Phase Readiness

**Ready for Phase 22-02 (Application Patterns):**
- Framework patterns documented (decorator, Context, middleware)
- Client integration patterns established
- Navigation structure includes error-handling and testing pages
- Cross-references enable workflow discovery

**No blockers identified.**

**Recommendation for Phase 22-02:**
- Document application patterns (error handling, testing, configuration management)
- Build on framework patterns established in 22-01
- Use same code extraction approach (real examples from Austria MCP)

---
*Phase: 22-api-reference-&-integration*
*Completed: 2026-01-20*
