# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Monorepo with separate client-server architecture

**Key Characteristics:**
- Python MCP server providing tools/resources/prompts via FastMCP framework
- Next.js documentation site with AI chat interface consuming the MCP server
- CLI installer for MCP server configuration in AI tools
- Clear separation between data access layer (MCP) and presentation layer (docs)

## Layers

**MCP Server Layer (Python):**
- Purpose: Exposes Austrian Open Data via Model Context Protocol
- Location: `mcp/app/`
- Contains: FastMCP server, HTTP client, tools, prompts, resources
- Depends on: Piveau Hub API (data.gv.at backend), FastMCP framework
- Used by: Claude Desktop, Continue, Cline, and documentation site chat interface

**API Client Layer:**
- Purpose: Abstracts HTTP communication with Piveau Hub API
- Location: `mcp/app/client.py`
- Contains: `PiveauClient` class with async HTTP client, RDF parsing, error handling
- Depends on: httpx, rdflib
- Used by: Tool implementations (discovery, analysis, preview, vocabulary)

**Tool Layer:**
- Purpose: Implements MCP tools for dataset discovery and analysis
- Location: `mcp/app/tools/`
- Contains: Discovery tools (search, list, get), analysis tools (quality scoring), preview tools (data inspection), vocabulary tools (SKOS concepts)
- Depends on: API Client Layer, semantic search, similarity algorithms
- Used by: MCP server registration, AI assistants

**Business Logic Layer:**
- Purpose: Semantic search, similarity algorithms, data preview
- Location: `mcp/app/semantic.py`, `mcp/app/similarity.py`, `mcp/app/preview.py`
- Contains: Natural language query expansion, related dataset finder, CSV/JSON preview generators
- Depends on: API Client Layer, models
- Used by: Tool Layer

**CLI Layer:**
- Purpose: Installer and health checker for MCP server configuration
- Location: `mcp/app/cli/`
- Contains: `main.py` with Typer commands (init, doctor, update, uninstall)
- Depends on: Platform detection, JSON config management
- Used by: End users via `uvx datagvat-mcp`

**Documentation Site (Next.js):**
- Purpose: Documentation and interactive AI chat interface
- Location: `docs/`
- Contains: Next.js App Router pages, Fumadocs MDX content, AI chat API route
- Depends on: Fumadocs UI, Vercel AI SDK, MCP client
- Used by: Users browsing documentation and testing MCP tools

**Next.js App Router:**
- Purpose: Page routing and API endpoints
- Location: `docs/app/`
- Contains: Dynamic routes `[lang]/docs/[[...slug]]`, API routes `/api/chat`, `/api/search`
- Depends on: Fumadocs source loader, AI SDK
- Used by: Documentation rendering, chat interface

**AI Chat Layer:**
- Purpose: Provides interactive chat interface using MCP tools
- Location: `docs/app/api/chat/route.ts`
- Contains: POST handler with `streamText` from Vercel AI SDK, MCP client integration
- Depends on: `@ai-sdk/mcp`, `@ai-sdk/gateway`, MCP server
- Used by: Chat interface at `/chat`

**Component Layer:**
- Purpose: Reusable UI components for docs and chat
- Location: `docs/components/`
- Contains: AI elements (message, reasoning, prompt-input), UI components (shadcn/ui), MDX components
- Depends on: Radix UI primitives, Next.js
- Used by: Pages, layouts, MDX content

## Data Flow

**User Query → MCP Server → Piveau API:**

1. AI assistant receives user query (e.g., "Find health datasets in Vienna")
2. Assistant selects appropriate MCP tool (e.g., `semantic_search_datasets`)
3. FastMCP server routes tool call to `mcp/app/tools/discovery.py`
4. Tool uses `semantic.py` to expand natural language query into themes/keywords
5. `PiveauClient` sends HTTP request to Piveau Hub API with expanded parameters
6. API response parsed (JSON-LD or RDF) and transformed to DCAT-AP models
7. Results returned through MCP protocol to assistant
8. Assistant formats results for user

**Documentation Chat Flow:**

1. User sends message in `/chat` interface
2. POST to `/api/chat/route.ts` with message and model selection
3. Route creates MCP client connection to FastMCP server via HTTP transport
4. Calls `streamText` with AI Gateway model and MCP tools
5. Model decides which tools to call based on user query
6. Tool results streamed back through SSE to UI
7. `DataStreamHandler` updates UI with tool calls and responses

**CLI Installation Flow:**

1. User runs `uvx datagvat-mcp init`
2. CLI detects platform (macOS/Windows/Linux)
3. Scans for AI tool config files (Claude Desktop, Continue, Cline)
4. Prompts user to select tools to configure
5. Writes MCP server config to tool's JSON config file
6. Uses absolute path to `uvx` on macOS for GUI app compatibility
7. User restarts AI tool to load MCP server

**State Management:**
- MCP Server: Stateless per request, lifespan context for `PiveauClient` connection pooling
- Documentation Site: Client-side state via React hooks, no persistent session state
- API Chat: Streaming state via `resumable-stream` with Redis (optional)

## Key Abstractions

**FastMCP Server:**
- Purpose: Framework for implementing Model Context Protocol servers
- Examples: `mcp/app/server.py` defines `mcp` instance
- Pattern: Decorator-based tool registration (`@mcp.tool()`), middleware stack, lifespan context manager

**PiveauClient:**
- Purpose: HTTP client abstraction for data.gv.at Piveau Hub API
- Examples: `mcp/app/client.py`
- Pattern: Async context manager, content negotiation (JSON-LD, RDF), automatic retry with backoff

**Tool Functions:**
- Purpose: MCP-compatible async functions exposing dataset operations
- Examples: `search_datasets`, `get_dataset`, `semantic_search_datasets` in `mcp/app/tools/discovery.py`
- Pattern: Annotated parameters with Pydantic Field validation, Context for progress reporting, structured error handling with ToolError

**Pydantic Models:**
- Purpose: Type-safe data models for DCAT-AP entities
- Examples: `Dataset`, `Distribution`, `Catalogue` in `mcp/app/models.py`
- Pattern: Field aliases for camelCase API responses, Enums for constrained values

**Fumadocs Source Loader:**
- Purpose: Content aggregation from MDX files and OpenAPI specs
- Examples: `docs/lib/source.tsx` combines docs and API reference
- Pattern: Multiple sources merged with loader plugins, i18n support, page tree transformation

**UI Message Stream:**
- Purpose: Server-sent events for streaming AI responses
- Examples: `createUIMessageStream` in `docs/app/api/chat/route.ts`
- Pattern: Execute callback with writer, merge tool streams, resumable stream context

## Entry Points

**MCP Server:**
- Location: `mcp/app/server.py`
- Triggers: Invoked by AI tools via `uvx datagvat-mcp` command or via HTTP at `https://data-gv-at.fastmcp.app/mcp`
- Responsibilities: Initialize FastMCP instance, register tools/resources/prompts, start MCP protocol listener

**CLI:**
- Location: `mcp/app/cli/main.py`
- Triggers: User runs `uvx datagvat-mcp [command]`
- Responsibilities: Platform detection, AI tool configuration, health checks, MCP server invocation when no command provided

**Documentation Site:**
- Location: `docs/app/page.tsx` (root), `docs/app/[lang]/docs/[[...slug]]/page.tsx` (docs)
- Triggers: HTTP requests to domain
- Responsibilities: Render MDX documentation, serve OpenAPI reference, provide chat interface

**Chat API:**
- Location: `docs/app/api/chat/route.ts`
- Triggers: POST request from chat UI with messages and model selection
- Responsibilities: Validate request schema, create MCP client, stream AI responses with tool calls

## Error Handling

**Strategy:** Layered error handling with context-specific error types

**Patterns:**
- HTTP errors from Piveau API wrapped in `PiveauApiError` with status codes and details
- Tool-level errors raised as `ToolError` (FastMCP exception type) with user-friendly messages
- Network errors (ConnectError, TimeoutException) caught and re-raised with actionable guidance
- 404 errors mapped to `PiveauNotFoundError` for specific handling
- Authentication errors trigger `PiveauAuthError` when API key missing/invalid
- Chat API validates request schema with Zod, returns `ChatSDKError` on validation failure
- Unhandled errors logged with Vercel request ID for debugging

## Cross-Cutting Concerns

**Logging:**
- MCP Server: Python `logging` module with structured logging middleware (`StructuredLoggingMiddleware`)
- Log level configurable via `Settings.log_level` (default INFO)
- Payload length and token estimation logged, not full payloads (privacy)
- Documentation Site: Console logging in development, Vercel logging in production

**Validation:**
- MCP tools use Pydantic with `Annotated` types and `Field` constraints
- Regex patterns for dates (YYYY-MM-DD), string length constraints (1-200 chars)
- Enum validation for themes, sort options, value types
- Chat API uses Zod schema validation (`postRequestBodySchema`)
- TypeScript strict mode enforced in `tsconfig.json`

**Authentication:**
- MCP Server: Optional API key via `X-API-Key` header
- Chat API: Hardcoded Bearer token for FastMCP HTTP transport (should be env var)
- Documentation site uses Vercel geolocation for request hints (no user auth)

---

*Architecture analysis: 2026-01-31*
