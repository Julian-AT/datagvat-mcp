---
phase: 22-api-reference-&-integration
plan: 02
subsystem: documentation
tags: [error-handling, testing, advanced-guides, production-patterns]

requires:
  - "21-02: Parameter documentation patterns"
  - "22-01: FastMCP framework documentation"

provides:
  - "Error handling guide with production patterns"
  - "Testing guide with mock Context patterns"
  - "Complete advanced section navigation"

affects:
  - "Future phases can reference error handling patterns"
  - "Testing patterns available for validation guides"

tech-stack:
  added: []
  patterns:
    - "ToolError for all user-facing errors"
    - "Mock Context pattern for tool testing"
    - "In-memory FastMCP Client for integration tests"
    - "pytest fixtures for test data"

key-files:
  created:
    - docs/advanced/error-handling.mdx
    - docs/advanced/testing.mdx
  modified:
    - docs/advanced/meta.json

decisions:
  - id: error-hierarchy
    decision: "Use ToolError → PiveauApiError → specific errors hierarchy"
    rationale: "Clear separation between user-facing and internal errors, enables middleware to handle appropriately"
    date: 2026-01-20

  - id: mock-context-pattern
    decision: "create_mock_context() fixture with settings and client parameters"
    rationale: "Standardizes Context mocking across test suite, provides app state without real FastMCP server"
    date: 2026-01-20

  - id: in-memory-testing
    decision: "Use Client(mcp_server) for integration tests, not subprocess"
    rationale: "10-100x faster than subprocess, deterministic, no process management overhead"
    date: 2026-01-20

metrics:
  duration: "18 minutes"
  completed: "2026-01-20"
  files_created: 2
  files_modified: 1
  lines_added: 1325
---

# Phase 22 Plan 02: Error Handling & Testing Patterns Summary

**One-liner:** Production-ready error handling with ToolError hierarchy and comprehensive testing patterns using mock Context and in-memory FastMCP Client.

## What Was Built

Created two comprehensive guides documenting Austria MCP's production error handling and testing patterns:

### Error Handling Guide (540 lines)
- **Error hierarchy:** ToolError (user-facing), PiveauApiError (internal), specific errors (NotFound, Auth)
- **ToolError best practices:** Actionable messages, contextual details, friendly user communication
- **Middleware error flow:** How errors propagate through the middleware stack (Logging → Error → Retry → Rate → Audit → Auth)
- **Retry logic:** RetryMiddleware handles transient errors (network, 5xx), skips permanent errors (4xx, ToolError)
- **Error patterns:** Transient vs permanent, graceful degradation, fail-fast validation
- **Context-aware errors:** Using ctx.request_id for correlation and debugging
- **Common scenarios:** API unavailable, invalid parameters, rate limits, missing API keys
- **Production monitoring:** Structured logging, error rate dashboards, alerting patterns

### Testing Guide (766 lines)
- **Testing philosophy:** Fast unit tests (majority), selective integration tests, minimal E2E
- **Mock Context pattern:** create_mock_context() with settings and PiveauClient mocking
- **Tool testing patterns:** Happy path, error handling, validation, progress reporting
- **Middleware testing:** Isolation patterns, timing verification, error propagation
- **Integration testing:** In-memory FastMCP Client for tool discovery and full flow tests
- **Test fixtures:** Common test data (sample_dataset, sample_catalogues_list, test_settings)
- **Best practices:** Mock dependencies, test errors, descriptive names, avoid subprocess
- **Coverage and CI:** pytest --cov, GitHub Actions matrix testing Python 3.11/3.12
- **Debugging:** pytest --pdb, VS Code launch config, common failure solutions

### Navigation Update
Updated docs/advanced/meta.json to include error-handling and testing pages in logical order.

## Code Examples from Actual Codebase

All examples extracted from Austria MCP's production code:

**Error handling examples:**
- `mcp/app/client.py`: Connection error handling, HTTP status handling, ToolError usage
- `mcp/app/middleware.py`: AuthMiddleware API key enforcement, AuditMiddleware timing

**Testing examples:**
- `mcp/tests/conftest.py`: create_mock_context() fixture, sample data fixtures, mcp_server fixture
- `mcp/tests/test_tools.py`: Tool testing patterns (list_catalogues, search_datasets, get_dataset)
- `mcp/tests/test_middleware.py`: Middleware testing patterns (AuditMiddleware, AuthMiddleware)

## Decisions Made

### Error Hierarchy Design
**Decision:** Three-level error hierarchy with ToolError at boundary

**Context:** Tools need to handle multiple error types (network, API, validation) and present them appropriately to users.

**Options considered:**
1. Single error type for everything → Poor error context
2. Custom exceptions for every scenario → Inconsistent handling
3. Layered hierarchy with ToolError boundary → Chosen

**Rationale:**
- ToolError for user-facing errors (shown to Claude)
- PiveauApiError for internal API errors (logged, converted)
- Specific errors (NotFoundError, AuthError) for precise handling
- Middleware can distinguish and handle appropriately (retry vs fail-fast)

**Impact:** Consistent error handling across all tools, better user experience, easier debugging

### Mock Context Testing Pattern
**Decision:** Standardized create_mock_context() fixture with parameters

**Context:** Every tool test needs Context with app state (settings, client), but creating it manually is verbose and error-prone.

**Options considered:**
1. Mock Context in every test → 20+ lines of boilerplate
2. Fixture with hardcoded values → Not flexible
3. Fixture with parameters (settings, client) → Chosen

**Rationale:**
- Reduces test boilerplate from 20 lines to 1 line
- Allows customization when needed (different settings, mock responses)
- Standardizes Context structure across test suite
- Provides app state without real FastMCP server

**Impact:** Faster test writing, consistent patterns, easier maintenance

### In-Memory Integration Testing
**Decision:** Use Client(mcp_server) instead of subprocess

**Context:** Need to test full MCP server (tool registration, middleware, request flow) without slow, flaky subprocess tests.

**Options considered:**
1. Subprocess with stdio transport → 10-100x slower, flaky
2. In-memory Client with FastMCP instance → Chosen
3. Mock entire server → Doesn't test integration

**Rationale:**
- FastMCP provides in-memory Client since 2.14+
- 10-100x faster than subprocess (milliseconds vs seconds)
- Deterministic (no process timing issues)
- No process cleanup needed
- Tests real tool registration and middleware stack

**Impact:** Fast integration tests, better CI performance, less flakiness

## Deviations from Plan

None - plan executed exactly as written. All sections documented, all code examples extracted from actual codebase, all verification steps passed.

## Key Links Established

**error-handling.mdx links to:**
- mcp/app/client.py: Error handling patterns (PiveauClient._request, _handle_http_error)
- mcp/app/middleware.py: Middleware error flow (AuthMiddleware, AuditMiddleware)
- Pattern matches: ToolError, PiveauApiError, raise

**testing.mdx links to:**
- mcp/tests/conftest.py: Testing fixtures (create_mock_context, sample data, mcp_server)
- mcp/tests/test_tools.py: Tool testing examples (list_catalogues, search_datasets, error handling)
- mcp/tests/test_middleware.py: Middleware testing examples (AuditMiddleware timing, AuthMiddleware auth)
- Pattern matches: create_mock_context, pytest.fixture, async def test_.*tool

**Cross-references:**
- error-handling.mdx ↔ testing.mdx: Error testing examples
- error-handling.mdx → fastmcp-internals.mdx: Context and middleware details
- testing.mdx → fastmcp-internals.mdx: Context understanding
- Both → configuration.mdx: Log configuration, test environment

## Next Phase Readiness

**Phase 22 Plan 03 ready to start:**
- Error handling patterns documented for integration examples
- Testing patterns available for validating integration code
- Advanced section navigation complete with all foundation guides

**Dependencies satisfied:**
- Plan 22-01: FastMCP internals documented (Context, middleware, decorators)
- Plan 21-02: Parameter documentation established (patterns for describing types)

**Provides for future:**
- Error handling examples for integration guides
- Testing patterns for validation and quality guides
- Production monitoring patterns for deployment guides

## Developer Capabilities Enabled

After reading these guides, developers can:

1. **Implement robust error handling:**
   - Choose between ToolError, custom exceptions, and graceful degradation
   - Write actionable, contextual error messages
   - Understand retry vs fail-fast patterns
   - Debug errors using request IDs and structured logging

2. **Write comprehensive tests:**
   - Create mock Context for tool unit tests
   - Mock PiveauClient to isolate external dependencies
   - Write integration tests using in-memory Client
   - Use fixtures for common test data
   - Debug test failures effectively

3. **Follow production patterns:**
   - Monitor error rates and set alerts
   - Use correlation IDs for cross-system tracing
   - Structure logs for parsing and analysis
   - Distinguish transient vs permanent errors

## Commits

- 29d34ce: docs(22-02): add error handling guide
- be7b7fa: docs(22-02): update advanced navigation

## Verification

✅ error-handling.mdx created with 540 lines (>200 required)
✅ testing.mdx created with 766 lines (>250 required)
✅ meta.json includes error-handling and testing
✅ All code examples from actual Austria MCP codebase
✅ Mock Context pattern documented from conftest.py
✅ Error handling examples from client.py showing ToolError usage
✅ Testing patterns from test_tools.py showing tool unit tests
✅ Build succeeds with zero warnings (485 static pages generated)
✅ Cross-references work (error-handling ↔ testing ↔ fastmcp-internals)
✅ Python code blocks are syntactically valid
✅ All paths use Windows-compatible absolute paths where needed

**Build output:** Successfully generated 485 static pages in 3.2 minutes with TypeScript compilation, page data collection, and OG image generation.
