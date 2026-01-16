# Architecture Research: Advanced Search, Sampling, and File Handling

**Researched:** 2026-01-16
**Domain:** MCP Server Architecture / FastMCP Patterns
**Confidence:** MEDIUM

## Executive Summary

The existing Austria MCP server has a well-structured layered architecture that provides clear integration points for advanced features. The architecture follows the pattern: **MCP Interface (FastMCP) -> Middleware -> Dependencies -> Client -> Models**. New features (search service, sampling, file handling, retry logic) should integrate at their appropriate layers without disrupting this structure.

The MCP protocol supports sampling through a request/response pattern where servers can request LLM completions from clients. File handling follows the MCP resources pattern with URI-based identification and content negotiation. Search functionality naturally fits into the existing tools/client layer, while retry and rate limiting belong in middleware or the HTTP client layer.

**Primary recommendation:** Add new components at their natural architectural boundaries - search as a service abstraction over the client, retry as middleware or client enhancement, sampling as a new capability layer, and file handling as an extension of the resources system.

## Current Architecture Analysis

### Existing Layer Structure

```
app/
├── server.py          # FastMCP setup, lifespan, middleware registration
├── config.py          # Settings via pydantic-settings
├── middleware.py      # AuditMiddleware, AuthMiddleware
├── dependencies.py    # Context accessors (get_piveau_client, get_settings)
├── client.py          # PiveauClient - HTTP client with error handling
├── models.py          # Pydantic models (Dataset, Catalogue, etc.)
├── resources.py       # MCP Resources (piveau:// URIs)
├── prompts.py         # MCP Prompts (workflow templates)
└── tools/
    ├── discovery.py   # list_catalogues, search_datasets, get_dataset
    ├── management.py  # CRUD operations on drafts
    ├── analysis.py    # Metrics, eligibility checks
    └── vocabularies.py# Vocabulary lookup tools
```

### Data Flow Pattern

```
[MCP Client Request]
        |
        v
  [FastMCP Server]
        |
        v
  [Middleware Chain]
    - AuditMiddleware (logging, timing)
    - AuthMiddleware (API key validation)
        |
        v
  [Tool/Resource/Prompt Handler]
        |
        v
  [Dependencies] -> get_piveau_client(ctx)
        |
        v
  [PiveauClient] -> HTTP requests to Piveau API
        |
        v
  [Response parsing] -> JSON/RDF handling
        |
        v
  [Return to client]
```

### Current Strengths

1. **Clear separation of concerns** - Each module has a single responsibility
2. **Dependency injection via Context** - Tools access services through `get_piveau_client(ctx)`
3. **Middleware pattern** - Cross-cutting concerns (audit, auth) isolated
4. **Async throughout** - All I/O operations are async
5. **Lifespan management** - Client lifecycle tied to server lifecycle

### Current Gaps

1. **No retry logic** - Client fails immediately on transient errors
2. **No rate limiting** - No protection against API abuse
3. **No search abstraction** - Search is basic list filtering, not full-text
4. **No sampling support** - Cannot request LLM completions
5. **No file download/content handling** - Only metadata, not actual file contents

## Integration Points

### Where New Features Fit

| Feature | Layer | Rationale |
|---------|-------|-----------|
| Advanced Search | New Service + Tools | Search logic abstracted from HTTP details |
| Retry Logic | PiveauClient or Middleware | HTTP-level concern, wrap requests |
| Rate Limiting | Middleware | Cross-cutting, applies to all requests |
| Sampling | New Capability Module | MCP protocol feature, parallel to tools |
| File Handling | Resources + New Tools | Extends existing resource pattern |

### Integration Diagram

```
                    NEW COMPONENTS

[FastMCP Server] -----> [SamplingCapability]  NEW
        |                       |
        v                       v
[Middleware Chain]        [Sampling Context]  NEW
  + RateLimitMiddleware   NEW
  + RetryMiddleware       NEW (or in client)
        |
        v
[Tool/Resource Handlers]
  + search_datasets_advanced  NEW
  + download_distribution     NEW
        |
        v
[Dependencies]
  + get_search_service()  NEW
        |
        v
[Services Layer]  NEW
  + SearchService         NEW
        |
        v
[PiveauClient]
  + with retry decorator  ENHANCED
  + with timeout config   ENHANCED
```

## New Components

| Component | Layer | Purpose | Dependencies |
|-----------|-------|---------|--------------|
| `SearchService` | services/ | Advanced search with facets, pagination | PiveauClient, Settings |
| `RateLimitMiddleware` | middleware.py | Request throttling per tool/client | Settings (rate config) |
| `RetryMiddleware` | middleware.py | Retry failed requests with backoff | Settings (retry config) |
| `SamplingHandler` | sampling.py | Request LLM completions via MCP | FastMCP Context |
| `FileHandler` | tools/files.py | Download and process distribution files | PiveauClient, temp storage |
| `ContentService` | services/ | Parse/validate file contents | File handlers per format |

### Detailed Component Specifications

#### SearchService

**Purpose:** Abstract advanced search capabilities with faceting, filtering, and pagination.

**Location:** `app/services/search.py`

**Interface:**
```python
class SearchService:
    def __init__(self, client: PiveauClient, settings: Settings): ...

    async def search(
        self,
        query: str | None = None,
        filters: dict[str, Any] | None = None,
        facets: list[str] | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "relevance",
    ) -> SearchResult: ...

    async def suggest(self, prefix: str, field: str) -> list[str]: ...
```

**Dependencies:** PiveauClient, Settings
**Used by:** search_datasets_advanced tool

#### RateLimitMiddleware

**Purpose:** Prevent abuse by limiting request rates per tool or globally.

**Location:** `app/middleware.py` (extend existing)

**Pattern:**
```python
class RateLimitMiddleware(Middleware):
    def __init__(self, requests_per_minute: int = 60, burst: int = 10): ...

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        # Check rate limit
        # Either proceed or raise ToolError with retry-after
```

**Configuration via Settings:**
- `rate_limit_rpm: int` - Requests per minute
- `rate_limit_burst: int` - Burst allowance

#### RetryMiddleware vs Client-Level Retry

Two valid approaches:

**Option A: Middleware (recommended for simplicity)**
```python
class RetryMiddleware(Middleware):
    async def on_call_tool(self, context, call_next):
        for attempt in range(max_retries):
            try:
                return await call_next(context)
            except RetryableError:
                await asyncio.sleep(backoff)
        raise
```

**Option B: Client-Level (recommended for granularity)**
```python
# In PiveauClient
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError))
)
async def _request(self, method, path, ...): ...
```

**Recommendation:** Use client-level retry with `tenacity` library for HTTP-specific retry logic. This keeps retry close to the I/O operation and allows different retry policies for different endpoints.

#### SamplingHandler

**Purpose:** Enable tools to request LLM completions from the MCP client.

**MCP Sampling Protocol (from official docs):**
- Server sends `sampling/createMessage` request to client
- Client handles LLM interaction, returns completion
- Human-in-the-loop for approval

**Location:** `app/sampling.py`

**Interface:**
```python
class SamplingHandler:
    def __init__(self, ctx: Context): ...

    async def create_message(
        self,
        messages: list[Message],
        model_preferences: ModelPreferences | None = None,
        system_prompt: str | None = None,
        max_tokens: int = 1000,
    ) -> SamplingResult: ...
```

**Usage in tools:**
```python
@mcp.tool()
async def analyze_with_llm(ctx: Context, dataset_id: str):
    dataset = await get_piveau_client(ctx).get_dataset(dataset_id)

    sampling = SamplingHandler(ctx)
    result = await sampling.create_message(
        messages=[{"role": "user", "content": f"Analyze: {dataset}"}],
        model_preferences={"intelligencePriority": 0.8},
    )
    return result.content
```

**Note:** Sampling requires client capability declaration. Server should check `ctx.client_capabilities.sampling` before using.

#### FileHandler / ContentService

**Purpose:** Download distribution files and process their contents.

**Location:** `app/tools/files.py`, `app/services/content.py`

**Approach:**
1. Get distribution metadata (existing)
2. Download file to temp storage
3. Parse based on content type
4. Return structured content or summary

**Supported formats (prioritized):**
- CSV -> pandas DataFrame summary
- JSON/JSON-LD -> parsed dict
- XML -> parsed dict
- PDF -> text extraction (optional, requires dependency)

**Tool interface:**
```python
@mcp.tool()
async def download_distribution(
    ctx: Context,
    dataset_id: str,
    distribution_index: int = 0,
    preview_rows: int = 10,
) -> dict[str, Any]:
    """Download and preview a dataset distribution."""
```

**Security considerations:**
- Validate download URLs (no local file access)
- Limit file size
- Timeout downloads
- Sanitize content before returning

## Data Flow

### Search Query Flow

```
[search_datasets_advanced tool]
        |
        v
[get_search_service(ctx)]
        |
        v
[SearchService.search()]
        |
        v
[PiveauClient._request()] -- with retry
        |
        v
[Piveau Search API]
        |
        v
[Parse response, extract facets]
        |
        v
[Return SearchResult to tool]
```

### Sampling Request Flow

```
[Tool needs LLM analysis]
        |
        v
[SamplingHandler.create_message()]
        |
        v
[Check client capabilities]
        |
        v
[Send sampling/createMessage via MCP]
        |
        v
[Client presents to user for approval]
        |
        v
[Client sends to LLM]
        |
        v
[Return SamplingResult to tool]
```

### File Download Flow

```
[download_distribution tool]
        |
        v
[Get distribution metadata]
        |
        v
[Validate download URL]
        |
        v
[Download with streaming + size limit]
        |
        v
[ContentService.parse(content, mime_type)]
        |
        v
[Return preview/summary]
```

## Build Order

Based on dependencies and complexity, recommended implementation order:

### Phase 1: Foundation (No new dependencies)

1. **Retry logic in PiveauClient**
   - Add `tenacity` to dependencies
   - Wrap `_request` with retry decorator
   - Configure via Settings
   - **Why first:** Improves reliability immediately, no API changes

2. **Rate limiting middleware**
   - Simple token bucket implementation
   - Configure via Settings
   - **Why early:** Protects API, simple to implement

### Phase 2: Search Enhancement

3. **SearchService abstraction**
   - New `app/services/` directory
   - SearchService class
   - Dependency injection pattern
   - **Depends on:** Retry logic (for reliable search)

4. **Advanced search tools**
   - `search_datasets_advanced` tool
   - Faceted search, sorting, suggestions
   - **Depends on:** SearchService

### Phase 3: File Handling

5. **ContentService for parsing**
   - CSV, JSON, XML parsers
   - Size limits, sanitization
   - **Why before tool:** Logic reusable across tools

6. **File download tools**
   - `download_distribution` tool
   - `preview_distribution` tool
   - **Depends on:** ContentService

### Phase 4: Sampling Integration

7. **SamplingHandler**
   - MCP sampling protocol implementation
   - Client capability checking
   - **Why last:** Most complex, requires client support

8. **Sampling-powered tools**
   - `analyze_dataset_with_llm` tool
   - `suggest_improvements` tool
   - **Depends on:** SamplingHandler

### Dependency Graph

```
[Settings Extensions]
        |
        v
[Retry in Client] -----> [RateLimitMiddleware]
        |
        v
[SearchService] -------> [ContentService]
        |                       |
        v                       v
[Search Tools]           [File Tools]
        |                       |
        +----------+------------+
                   |
                   v
           [SamplingHandler]
                   |
                   v
           [Sampling Tools]
```

## Middleware Patterns

### Recommended Middleware Stack Order

```python
mcp = FastMCP(
    name="austria-data",
    middleware=[
        RateLimitMiddleware(rpm=60, burst=10),  # First: reject early
        AuditMiddleware(),                       # Second: log everything
        AuthMiddleware(),                        # Third: auth check
        # RetryMiddleware() if using middleware approach
    ],
)
```

### Error Handling Pattern

**Layer-appropriate errors:**

| Layer | Error Type | Handling |
|-------|------------|----------|
| HTTP Client | `PiveauApiError` | Retry transient, propagate permanent |
| Middleware | `ToolError` | Return to client with message |
| Tool | Return with `isError: true` | MCP protocol error response |

**Example error hierarchy:**
```python
# client.py - HTTP errors
class PiveauApiError(Exception): ...
class PiveauNotFoundError(PiveauApiError): ...
class PiveauRateLimitError(PiveauApiError): ...  # NEW

# middleware.py - MCP errors
from fastmcp.exceptions import ToolError

class RateLimitExceeded(ToolError):
    def __init__(self, retry_after: int):
        super().__init__(f"Rate limit exceeded. Retry after {retry_after}s")
        self.retry_after = retry_after
```

### Retry Configuration Pattern

```python
# config.py additions
class Settings(BaseSettings):
    # Existing...

    # Retry settings
    retry_max_attempts: int = Field(default=3, ge=1, le=10)
    retry_base_delay: float = Field(default=1.0, ge=0.1, le=30.0)
    retry_max_delay: float = Field(default=30.0, ge=1.0, le=120.0)
    retry_exponential_base: float = Field(default=2.0, ge=1.5, le=4.0)

    # Rate limit settings
    rate_limit_rpm: int = Field(default=60, ge=1, le=1000)
    rate_limit_burst: int = Field(default=10, ge=1, le=100)
```

### Rate Limiting Implementation Pattern

```python
import asyncio
import time

class RateLimitMiddleware(Middleware):
    def __init__(self, requests_per_minute: int = 60, burst: int = 10):
        self.rpm = requests_per_minute
        self.burst = burst
        self.tokens = burst
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.burst, self.tokens + elapsed * (self.rpm / 60))
            self.last_update = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) * (60 / self.rpm)
                raise ToolError(f"Rate limit exceeded. Retry after {wait_time:.1f}s")

            self.tokens -= 1

        return await call_next(context)
```

## Sampling Integration Architecture

### MCP Sampling Protocol Summary

From official MCP documentation:

1. **Capability negotiation:** Client declares `sampling` capability
2. **Request format:** Server sends `sampling/createMessage` with messages, preferences
3. **Human-in-the-loop:** Client should allow user review/approval
4. **Response:** Client returns LLM completion result

### FastMCP Sampling Pattern

```python
# sampling.py
from dataclasses import dataclass
from typing import Any
from fastmcp import Context

@dataclass
class SamplingResult:
    content: str
    model: str
    stop_reason: str

class SamplingHandler:
    def __init__(self, ctx: Context):
        self.ctx = ctx

    def is_available(self) -> bool:
        """Check if client supports sampling."""
        try:
            caps = self.ctx.client_capabilities
            return caps is not None and hasattr(caps, 'sampling')
        except Exception:
            return False

    async def create_message(
        self,
        messages: list[dict[str, Any]],
        model_preferences: dict[str, Any] | None = None,
        system_prompt: str | None = None,
        max_tokens: int = 1000,
    ) -> SamplingResult:
        if not self.is_available():
            raise ToolError("Sampling not supported by client")

        # Use FastMCP's sampling API
        result = await self.ctx.sample(
            messages=messages,
            model_preferences=model_preferences,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
        )

        return SamplingResult(
            content=result.content,
            model=result.model,
            stop_reason=result.stop_reason,
        )
```

### Sampling Tool Pattern

```python
# tools/analysis.py - extended
@mcp.tool(
    name="analyze_dataset_quality_llm",
    description="Use LLM to analyze dataset quality and suggest improvements.",
)
async def analyze_dataset_quality_llm(
    ctx: Context,
    dataset_id: str,
) -> dict[str, Any]:
    sampling = SamplingHandler(ctx)
    if not sampling.is_available():
        return {"error": "LLM analysis requires sampling capability"}

    # Gather dataset info
    client = get_piveau_client(ctx)
    dataset = await client.get_dataset(dataset_id)
    metrics = await client.get_metrics(dataset_id)

    # Request LLM analysis
    result = await sampling.create_message(
        messages=[{
            "role": "user",
            "content": f"""Analyze this dataset for quality issues:

Dataset: {dataset.get('title')}
Description: {dataset.get('description')}
Metrics: {metrics}

Provide specific recommendations for improvement."""
        }],
        model_preferences={
            "intelligencePriority": 0.8,
            "speedPriority": 0.5,
        },
        max_tokens=500,
    )

    return {
        "dataset_id": dataset_id,
        "analysis": result.content,
        "model_used": result.model,
    }
```

## File Handling Architecture

### Resource Pattern Extension

Extend existing resources to support file content:

```python
# resources.py - extended
@mcp.resource("piveau://datasets/{dataset_id}/distributions/{dist_id}/content")
async def distribution_content_resource(
    ctx: Context,
    dataset_id: str,
    dist_id: str,
) -> dict[str, Any]:
    """Distribution file content (preview)."""
    content_service = get_content_service(ctx)
    return await content_service.get_preview(dataset_id, dist_id)
```

### Content Service Pattern

```python
# services/content.py
import httpx
from io import BytesIO

class ContentService:
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    PREVIEW_ROWS = 10

    def __init__(self, client: PiveauClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def download(
        self,
        url: str,
        max_size: int | None = None,
    ) -> tuple[bytes, str]:
        """Download file with size limit."""
        max_size = max_size or self.MAX_FILE_SIZE

        async with httpx.AsyncClient() as http:
            async with http.stream("GET", url) as response:
                response.raise_for_status()

                content_type = response.headers.get("content-type", "")
                chunks = []
                size = 0

                async for chunk in response.aiter_bytes():
                    size += len(chunk)
                    if size > max_size:
                        raise ValueError(f"File exceeds {max_size} byte limit")
                    chunks.append(chunk)

                return b"".join(chunks), content_type

    async def parse(
        self,
        content: bytes,
        content_type: str,
    ) -> dict[str, Any]:
        """Parse file content based on type."""
        if "csv" in content_type:
            return self._parse_csv(content)
        elif "json" in content_type:
            return self._parse_json(content)
        elif "xml" in content_type:
            return self._parse_xml(content)
        else:
            return {"raw": content[:1000].decode("utf-8", errors="replace")}
```

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `app/server.py`, `app/middleware.py`, `app/client.py`
- MCP Official Documentation: https://modelcontextprotocol.io/docs/concepts/architecture
- MCP Sampling Specification: https://modelcontextprotocol.io/docs/concepts/sampling
- MCP Resources Specification: https://modelcontextprotocol.io/docs/concepts/resources
- MCP Tools Specification: https://modelcontextprotocol.io/docs/concepts/tools

### Secondary (MEDIUM confidence)
- FastMCP library patterns (inferred from existing middleware implementation)
- httpx async patterns (from existing PiveauClient)
- pydantic-settings patterns (from existing config.py)

### Tertiary (LOW confidence - needs validation)
- Tenacity retry patterns (common Python pattern, not verified against FastMCP)
- Token bucket rate limiting (standard algorithm, implementation details may vary)
- Sampling handler interface (based on MCP spec, FastMCP API may differ)

## Open Questions

1. **FastMCP Sampling API:** Exact Context.sample() API needs verification against FastMCP 2.3+ documentation. The pattern shown is based on MCP spec, but FastMCP may have different method names.

2. **Rate Limiting Scope:** Should rate limiting be global, per-tool, or per-client? Current design is global. May need adjustment based on actual usage patterns.

3. **File Size Limits:** 10MB default may be too small for some datasets. Consider making configurable or implementing streaming for large files.

4. **Search API Capabilities:** Actual Piveau search API capabilities need verification. Current SearchService interface assumes faceted search support.

## Metadata

**Confidence breakdown:**
- Existing architecture analysis: HIGH - Direct code inspection
- Integration points: HIGH - Follows established patterns
- New component interfaces: MEDIUM - Based on MCP spec, FastMCP details unverified
- Build order: HIGH - Based on dependency analysis
- Middleware patterns: MEDIUM - Patterns are standard but FastMCP specifics unverified

**Research date:** 2026-01-16
**Valid until:** 2026-02-16 (30 days - stable architecture, FastMCP may update)
