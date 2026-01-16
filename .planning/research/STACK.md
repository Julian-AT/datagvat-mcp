# Stack Research: Austria MCP v1.1+ Additions

**Researched:** 2026-01-16
**Domain:** MCP Server / Open Government Data / Enterprise Features
**Confidence:** HIGH (verified from installed FastMCP 2.14.1 source code)

## Executive Summary

For v1.1+, the existing stack (FastMCP 2.3.0+, httpx, Pydantic, rdflib) is solid. The key finding is that **FastMCP 2.14+ already includes enterprise-grade middleware** that the current codebase underutilizes. Rather than adding external libraries, leverage FastMCP's built-in capabilities:

- **RetryMiddleware** with exponential backoff (built into FastMCP)
- **RateLimitingMiddleware** with token bucket algorithm (built into FastMCP)
- **ResponseCachingMiddleware** with TTL support (built into FastMCP)
- **StructuredLoggingMiddleware** for JSON logging (built into FastMCP)
- **Sampling** for AI-assisted search enhancement (built into FastMCP Context)
- **Elicitation** for interactive user queries (built into FastMCP Context)

The primary additions needed are:
1. **structlog** (optional) - Only if you need log aggregation beyond FastMCP's StructuredLoggingMiddleware
2. **tenacity** (optional) - Only if httpx client retries need more control than FastMCP's RetryMiddleware provides

**Primary recommendation:** Upgrade to FastMCP >=2.14.0 and leverage its built-in enterprise middleware rather than adding external dependencies.

## Recommended Additions

### Core: FastMCP Upgrade

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| fastmcp | >=2.14.0 | Built-in middleware, sampling, elicitation | HIGH |

**Rationale:** Current project specifies `>=2.3.0` but FastMCP 2.14.x includes substantial improvements:
- Built-in RetryMiddleware, RateLimitingMiddleware, ResponseCachingMiddleware
- StructuredLoggingMiddleware for JSON logging
- Sampling API (`ctx.sample()`, `ctx.sample_step()`) for AI-assisted features
- Elicitation API (`ctx.elicit()`) for interactive user queries
- Image, Audio, File helper types for rich content
- Better progress reporting (`ctx.report_progress()`)

**Action:** Update `pyproject.toml`:
```toml
dependencies = [
    "fastmcp>=2.14.0",  # Was >=2.3.0
    ...
]
```

### Optional: HTTP Client Retries

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| tenacity | 9.1.2 | HTTP client retry logic with jitter | MEDIUM |

**Rationale:** FastMCP's RetryMiddleware handles MCP-level retries, but the httpx client (`PiveauClient`) makes external API calls that may need separate retry logic for transient failures. Options:

1. **httpx built-in transport retries** - Limited, no exponential backoff
2. **tenacity** - Full-featured, async-native, composable decorators
3. **stamina** - Simpler API but less flexible

Tenacity is the most mature option for wrapping `PiveauClient._request()`.

**When to add:** Only if the Piveau API returns transient 5xx errors or timeouts frequently enough to warrant client-level retries. Start without it; add if needed.

### Optional: Structured Logging Enhancement

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| structlog | 25.5.0 | Rich structured logging if needed beyond FastMCP | LOW |

**Rationale:** FastMCP 2.14 includes `StructuredLoggingMiddleware` that outputs JSON-formatted logs:

```python
from fastmcp.server.middleware.logging import StructuredLoggingMiddleware

mcp = FastMCP("austria-data", middleware=[
    StructuredLoggingMiddleware(
        include_payloads=False,
        include_payload_length=True,
    ),
])
```

Only add structlog if you need:
- Custom log processors (add request IDs, user context)
- Integration with specific log aggregation systems
- Log routing beyond what Python's logging provides

**When to add:** Only if StructuredLoggingMiddleware is insufficient for your observability needs.

## FastMCP Features to Leverage

### 1. Built-in Enterprise Middleware

FastMCP 2.14+ includes middleware in `fastmcp.server.middleware`:

#### RetryMiddleware (error_handling.py)
```python
from fastmcp.server.middleware.error_handling import RetryMiddleware

retry_middleware = RetryMiddleware(
    max_retries=3,
    base_delay=1.0,
    max_delay=60.0,
    backoff_multiplier=2.0,
    retry_exceptions=(ConnectionError, TimeoutError),
)

mcp = FastMCP("austria-data", middleware=[retry_middleware])
```

**Features:**
- Exponential backoff with configurable multiplier
- Configurable retry exceptions
- Max delay cap

#### RateLimitingMiddleware (rate_limiting.py)
```python
from fastmcp.server.middleware.rate_limiting import RateLimitingMiddleware

rate_limiter = RateLimitingMiddleware(
    max_requests_per_second=10.0,
    burst_capacity=20,
    global_limit=False,  # Per-client limiting
)

mcp = FastMCP("austria-data", middleware=[rate_limiter])
```

**Features:**
- Token bucket algorithm
- Per-client or global limiting
- Configurable burst capacity
- Also available: `SlidingWindowRateLimitingMiddleware`

#### ResponseCachingMiddleware (caching.py)
```python
from fastmcp.server.middleware.caching import ResponseCachingMiddleware

cache_middleware = ResponseCachingMiddleware(
    list_tools_settings={"ttl": 300},  # 5 min
    list_resources_settings={"ttl": 300},
    call_tool_settings={
        "ttl": 3600,  # 1 hour
        "included_tools": ["list_catalogues", "list_vocabularies"],
        "excluded_tools": ["create_dataset_draft"],
    },
)
```

**Features:**
- Per-method TTL configuration
- Tool inclusion/exclusion lists
- Statistics tracking via `.statistics()`

#### StructuredLoggingMiddleware (logging.py)
```python
from fastmcp.server.middleware.logging import StructuredLoggingMiddleware

logging_middleware = StructuredLoggingMiddleware(
    include_payloads=False,
    include_payload_length=True,
    estimate_payload_tokens=True,
)
```

**Features:**
- JSON-formatted output
- Optional payload logging
- Token estimation

### 2. Sampling API for AI-Assisted Search

FastMCP Context provides sampling for LLM-powered features:

```python
from fastmcp import Context

@mcp.tool
async def smart_search(query: str, ctx: Context) -> dict:
    """AI-assisted dataset search with relevance scoring."""

    # Get initial results
    datasets = await client.list_datasets(limit=50)

    # Use sampling for relevance analysis
    result = await ctx.sample(
        messages=f"Rank these datasets by relevance to: {query}\n{datasets}",
        system_prompt="You are a data catalog expert. Return top 10 most relevant.",
        max_tokens=1024,
        model_preferences=["claude-3-5-sonnet", "gpt-4o"],
    )

    return {"ranked_results": result.text, "query": query}
```

**Key methods:**
- `ctx.sample()` - Full agentic loop with tool use
- `ctx.sample_step()` - Single LLM call for fine-grained control
- Supports structured output via `result_type` parameter

**Use cases for Austria MCP:**
- Relevance ranking of search results
- Natural language query understanding
- Dataset recommendation
- Autocomplete suggestions

### 3. Elicitation for Interactive Queries

Request additional user input during tool execution:

```python
from fastmcp import Context
from pydantic import BaseModel

class SearchFilters(BaseModel):
    themes: list[str]
    date_range: str | None = None
    language: str = "de"

@mcp.tool
async def guided_search(ctx: Context) -> list[dict]:
    """Interactive dataset search with filter refinement."""

    # Ask user for filters
    result = await ctx.elicit(
        message="Please specify your search criteria:",
        response_type=SearchFilters,
    )

    if isinstance(result, AcceptedElicitation):
        filters = result.data
        return await client.search_datasets(
            themes=filters.themes,
            language=filters.language,
        )

    return {"error": "Search cancelled"}
```

**Use cases:**
- Guided search refinement
- Confirmation for write operations
- Multi-step data collection workflows

### 4. Progress Reporting

Already used in discovery.py but can be enhanced:

```python
@mcp.tool
async def bulk_analysis(dataset_ids: list[str], ctx: Context) -> dict:
    """Analyze multiple datasets with progress."""
    results = []
    total = len(dataset_ids)

    for i, dataset_id in enumerate(dataset_ids):
        await ctx.report_progress(
            progress=i,
            total=total,
            message=f"Analyzing {dataset_id}..."
        )
        result = await analyze_dataset(dataset_id)
        results.append(result)

    await ctx.report_progress(total, total, "Complete")
    return {"analyzed": len(results), "results": results}
```

### 5. Rich Content Types

FastMCP provides helper types for returning rich content:

```python
from fastmcp.utilities.types import Image, File

@mcp.tool
async def export_dataset_preview(dataset_id: str) -> File:
    """Export dataset preview as downloadable file."""
    data = await generate_preview(dataset_id)
    return File(data=data, format="json", name=f"{dataset_id}_preview")
```

**Available types:**
- `Image` - For visualizations (charts, maps)
- `Audio` - For audio content
- `File` - For downloadable files

### 6. Context State Management

Share data across middleware and tool calls:

```python
@mcp.tool
async def search_with_context(query: str, ctx: Context) -> list[dict]:
    # Track search history in context
    history = ctx.get_state("search_history") or []
    history.append(query)
    ctx.set_state("search_history", history[-10:])  # Keep last 10

    # Use history for better results
    return await enhanced_search(query, previous_queries=history)
```

## What NOT to Use

### 1. External Retry Libraries (Initially)

**Avoid:** tenacity, stamina, backoff for MCP-level retries

**Why:** FastMCP's RetryMiddleware already handles this:
```python
RetryMiddleware(
    max_retries=3,
    base_delay=1.0,
    retry_exceptions=(ConnectionError, TimeoutError),
)
```

**When to reconsider:** If you need httpx client-level retries separate from MCP retries.

### 2. External Rate Limiting Libraries

**Avoid:** slowapi, limits, ratelimit

**Why:** FastMCP's RateLimitingMiddleware provides:
- Token bucket algorithm
- Per-client tracking
- Configurable burst capacity

### 3. External Caching Libraries (Initially)

**Avoid:** aiocache, cashews, cachetools

**Why:** FastMCP's ResponseCachingMiddleware provides:
- TTL-based caching
- Per-method configuration
- Tool inclusion/exclusion

**When to reconsider:** If you need:
- Redis/Memcached backend (FastMCP uses in-memory by default)
- Cache invalidation webhooks
- Distributed caching across multiple server instances

### 4. Loguru

**Avoid:** loguru for structured logging

**Why:**
- FastMCP uses Python's standard logging
- StructuredLoggingMiddleware provides JSON output
- Mixing loguru with logging creates complexity

**Alternative:** If you need more than StructuredLoggingMiddleware, use structlog which integrates cleanly with Python's logging.

### 5. Custom Middleware When Built-in Exists

**Avoid:** Writing custom middleware for:
- Timing (use TimingMiddleware)
- Error transformation (use ErrorHandlingMiddleware)
- Request logging (use LoggingMiddleware)

The existing `AuditMiddleware` and `AuthMiddleware` are appropriate for app-specific logic.

## Migration Path

### Phase 1: Upgrade FastMCP
```toml
# pyproject.toml
dependencies = [
    "fastmcp>=2.14.0",
    # ... rest unchanged
]
```

### Phase 2: Replace Custom Middleware
Replace any custom retry/rate-limit logic with FastMCP middleware:

```python
# server.py
from fastmcp.server.middleware.error_handling import RetryMiddleware, ErrorHandlingMiddleware
from fastmcp.server.middleware.rate_limiting import RateLimitingMiddleware
from fastmcp.server.middleware.logging import StructuredLoggingMiddleware

mcp = FastMCP(
    name="austria-data",
    middleware=[
        StructuredLoggingMiddleware(),
        ErrorHandlingMiddleware(),
        RetryMiddleware(max_retries=3),
        RateLimitingMiddleware(max_requests_per_second=10),
        AuditMiddleware(),  # Keep app-specific middleware
        AuthMiddleware(),
    ],
)
```

### Phase 3: Add Sampling Features
Implement AI-assisted search using `ctx.sample()`.

### Phase 4: Add Elicitation (Optional)
Add interactive refinement for guided search workflows.

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| FastMCP Middleware | HIGH | Verified from installed source code |
| FastMCP Sampling | HIGH | Verified from context.py source |
| FastMCP Elicitation | HIGH | Verified from elicitation.py source |
| tenacity recommendation | MEDIUM | Standard library, not project-tested |
| structlog recommendation | LOW | May not be needed given FastMCP logging |

## Sources

### Primary (HIGH confidence)
- FastMCP 2.14.1 installed source code:
  - `fastmcp/server/middleware/rate_limiting.py`
  - `fastmcp/server/middleware/caching.py`
  - `fastmcp/server/middleware/error_handling.py`
  - `fastmcp/server/middleware/logging.py`
  - `fastmcp/server/context.py`
  - `fastmcp/server/elicitation.py`
  - `fastmcp/utilities/types.py`

### Package Versions (Verified via pip index)
- FastMCP: 2.14.3 (latest), 2.14.1 (installed)
- tenacity: 9.1.2 (latest)
- structlog: 25.5.0 (latest)
- stamina: 25.2.0 (latest)

### Project Context
- Current pyproject.toml: `fastmcp>=2.3.0`
- Current middleware: AuditMiddleware, AuthMiddleware (custom)
- Current client: PiveauClient with httpx
