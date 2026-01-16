# Architecture

**Analysis Date:** 2025-01-16

## Pattern Overview

**Overall:** MCP Server with Layered Architecture

**Key Characteristics:**
- Model Context Protocol (MCP) server built on FastMCP framework
- Clear separation between API client, tools, resources, and prompts
- Async-first design using httpx for HTTP operations
- Dependency injection via FastMCP Context and lifespan pattern
- Middleware pipeline for cross-cutting concerns (auth, audit)

## Layers

**MCP Interface Layer:**
- Purpose: Expose functionality via MCP protocol (tools, resources, prompts)
- Location: `app/tools/`, `app/resources.py`, `app/prompts.py`
- Contains: MCP tool definitions, resource endpoints, prompt templates
- Depends on: Dependencies layer, Client layer
- Used by: MCP clients (Claude Desktop, etc.)

**Middleware Layer:**
- Purpose: Cross-cutting concerns for request processing
- Location: `app/middleware.py`
- Contains: AuditMiddleware (logging/timing), AuthMiddleware (API key enforcement)
- Depends on: FastMCP middleware framework, AppState
- Used by: Server layer (registered at startup)

**Dependencies Layer:**
- Purpose: Dependency injection helpers to extract state from context
- Location: `app/dependencies.py`
- Contains: Helper functions to get client, settings, state from Context
- Depends on: FastMCP Context
- Used by: Tools, Resources

**Client Layer:**
- Purpose: HTTP communication with Piveau Hub API
- Location: `app/client.py`
- Contains: PiveauClient class with all API operations
- Depends on: httpx, rdflib (for RDF parsing), Models layer
- Used by: Tools, Resources

**Models Layer:**
- Purpose: Data structures and validation
- Location: `app/models.py`
- Contains: Pydantic models (Dataset, Catalogue, Distribution), enums (ValueType, IdentifierType)
- Depends on: Pydantic
- Used by: Client layer

**Configuration Layer:**
- Purpose: Environment-based configuration
- Location: `app/config.py`
- Contains: Settings class with pydantic-settings, singleton pattern
- Depends on: pydantic-settings
- Used by: Server layer (lifespan), Middleware

## Data Flow

**Read Operation (e.g., get_dataset):**

1. MCP client calls tool via MCP protocol
2. AuditMiddleware logs start, timestamps request
3. AuthMiddleware checks if write operation (passes for reads)
4. Tool function receives Context, calls `get_piveau_client(ctx)`
5. Dependencies layer extracts PiveauClient from AppState
6. PiveauClient makes HTTP request to Piveau API
7. Response parsed (JSON or RDF via rdflib)
8. Result returned through middleware chain
9. AuditMiddleware logs completion with timing

**Write Operation (e.g., create_dataset_draft):**

1. MCP client calls tool via MCP protocol
2. AuditMiddleware logs start
3. AuthMiddleware checks WRITE_TOOLS set, verifies API key exists
4. If no API key: raises ToolError, request rejected
5. If API key present: proceeds to tool function
6. Tool builds payload, calls PiveauClient method
7. PiveauClient adds X-API-Key header, makes authenticated request
8. Result returned through middleware chain

**State Management:**
- AppState dataclass holds Settings and PiveauClient
- Created during lifespan startup, yielded to handlers
- Accessed via Context.request_context.lifespan_context
- PiveauClient closed during lifespan shutdown

## Key Abstractions

**FastMCP:**
- Purpose: MCP protocol server framework
- Examples: `app/server.py` (mcp instance)
- Pattern: Decorator-based registration (@mcp.tool, @mcp.resource, @mcp.prompt)

**PiveauClient:**
- Purpose: Async HTTP client for Piveau Hub API
- Examples: `app/client.py`
- Pattern: Repository pattern - encapsulates all API operations

**AppState:**
- Purpose: Application state container for lifespan
- Examples: `app/server.py` (dataclass definition)
- Pattern: Dependency container passed through Context

**Middleware:**
- Purpose: Request/response interception
- Examples: `app/middleware.py` (AuditMiddleware, AuthMiddleware)
- Pattern: Chain of responsibility via call_next

## Entry Points

**Main Entry (`app/server.py`):**
- Location: `app/server.py`
- Triggers: `python -m app.server` or `fastmcp run app.server:mcp`
- Responsibilities:
  - Create FastMCP instance
  - Register middleware (AuditMiddleware, AuthMiddleware)
  - Register tools, resources, prompts
  - Define lifespan (settings load, client creation)
  - Call mcp.run() when executed directly

**Package Init (`app/__init__.py`):**
- Location: `app/__init__.py`
- Triggers: Package import
- Responsibilities: Export version string

## Error Handling

**Strategy:** Exception hierarchy with specific error types

**Patterns:**
- `PiveauApiError` - Base exception for API errors
- `PiveauNotFoundError` - 404 responses
- `PiveauAuthError` - 401/403 responses
- `ToolError` (FastMCP) - Used by AuthMiddleware for auth failures
- Client methods raise specific exceptions, tools can catch and transform
- `analyze_dataset_quality` demonstrates graceful degradation (catches errors, returns partial results)

## Cross-Cutting Concerns

**Logging:**
- Standard library logging, configured in lifespan
- AuditMiddleware logs tool executions with timing
- Logger name pattern: `logging.getLogger(__name__)`

**Validation:**
- Pydantic models for data structures
- Pydantic Field constraints for tool parameters (ge, le)
- Annotated types for tool parameter documentation

**Authentication:**
- AuthMiddleware enforces API key for write operations
- WRITE_TOOLS set defines which tools require auth
- API key passed via X-API-Key header to Piveau API
- Environment variable: AUSTRIA_MCP_PIVEAU_API_KEY

---

*Architecture analysis: 2025-01-16*
