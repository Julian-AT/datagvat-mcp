# Coding Conventions

**Analysis Date:** 2025-01-16

## Naming Patterns

**Files:**
- Use lowercase with underscores: `client.py`, `discovery.py`, `test_client.py`
- Test files prefixed with `test_`: `test_models.py`, `test_tools.py`
- Module files named after their primary concern: `models.py`, `config.py`, `middleware.py`

**Functions:**
- Use snake_case for all functions: `get_piveau_client()`, `register_discovery_tools()`
- Async functions follow same pattern: `async def list_catalogues()`
- Private methods prefixed with underscore: `_request()`, `_parse_response()`, `_handle_http_error()`
- Factory/helper functions start with verb: `create_mock_context()`, `register_*_tools()`

**Variables:**
- Use snake_case: `catalogue_id`, `mock_client`, `sample_dataset`
- Constants in UPPER_CASE: `ACCEPT_HEADER`, `RDF_CONTENT_TYPES`, `WRITE_TOOLS`
- Type variables follow class convention: `AppState`, `Settings`

**Classes:**
- Use PascalCase: `PiveauClient`, `AuditMiddleware`, `Settings`
- Exception classes end with Error: `PiveauApiError`, `PiveauNotFoundError`, `PiveauAuthError`
- Pydantic models are nouns: `Dataset`, `Catalogue`, `Distribution`, `EligibilityResult`

**Enums:**
- Use PascalCase for class: `ValueType`, `IdentifierType`
- Use UPPER_CASE for values: `URI_REFS`, `EU_RA_DOI`

## Code Style

**Formatting:**
- Tool: Ruff (configured in `pyproject.toml`)
- Line length: 120 characters
- Target Python version: 3.11

**Linting:**
- Tool: Ruff
- Rules enabled: E (pycodestyle), F (pyflakes), I (isort), UP (pyupgrade)
- Rule E501 (line too long) ignored

**Configuration:**
```toml
# pyproject.toml
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]
ignore = ["E501"]
```

## Import Organization

**Order:**
1. Standard library imports
2. Third-party imports
3. Local/application imports

**Pattern from `app/server.py`:**
```python
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING

from fastmcp import FastMCP

from app.client import PiveauClient
from app.config import get_settings
```

**TYPE_CHECKING Pattern:**
- Use `TYPE_CHECKING` for imports only needed for type hints to avoid circular imports:
```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.config import Settings
```

**Path Aliases:**
- None used. All imports are relative to package root `app`.

## Type Annotations

**Required everywhere:**
- All function parameters must be typed
- All return values must be typed
- Use `Any` sparingly, prefer specific types

**Common patterns:**
```python
# Union types use | syntax (Python 3.10+)
def get_catalogue(self, catalogue_id: str) -> dict[str, Any]:

# Optional parameters
async def create_draft(self, catalogue_id: str, payload: dict[str, Any] | None = None) -> str:

# List with typed elements
async def list_catalogues(self, limit: int = 100) -> list[dict[str, Any]]:

# Annotated for tool parameters (FastMCP)
dataset_id: Annotated[str, "The dataset identifier"]
limit: Annotated[int, Field(ge=1, le=5000)] = 100
```

## Pydantic Model Patterns

**Model Configuration:**
```python
class Dataset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: dict[str, str] | str
    access_url: str | None = Field(None, alias="accessURL")
```

**Key patterns:**
- Use `ConfigDict(populate_by_name=True)` for alias support
- Use `Field(alias="...")` for JSON field name mapping
- Use `Field(default_factory=list)` for mutable defaults
- Support both string and dict types for multilingual fields: `dict[str, str] | str`

## Error Handling

**Exception Hierarchy:**
- Base class `PiveauApiError` with status_code and details
- Specific exceptions: `PiveauNotFoundError`, `PiveauAuthError`

**Pattern from `app/client.py`:**
```python
class PiveauApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details

class PiveauNotFoundError(PiveauApiError):
    pass
```

**HTTP Error Handling:**
```python
def _handle_http_error(self, error: httpx.HTTPStatusError) -> None:
    status = error.response.status_code
    if status == 404:
        raise PiveauNotFoundError("Resource not found", status_code=status, details=details)
    elif status in (401, 403):
        raise PiveauAuthError("Authentication failed", status_code=status, details=details)
    else:
        raise PiveauApiError(f"API error: {status}", status_code=status, details=details)
```

**Tool Error Handling (Graceful Degradation):**
```python
# From app/tools/analysis.py - continue on partial failure
try:
    analysis["metrics"] = await client.get_metrics(dataset_id)
except Exception:
    analysis["metrics"] = None
```

## Logging

**Framework:** Python standard `logging` module

**Setup Pattern:**
```python
import logging
logger = logging.getLogger(__name__)
```

**Log Levels Used:**
- INFO: Tool execution start/completion, server lifecycle
- ERROR: Tool/request failures with timing
- WARNING: Non-fatal issues like RDF parse failures

**Pattern from `app/middleware.py`:**
```python
logger.info(f"[{request_id}] {tool_name} started")
logger.info(f"[{request_id}] {tool_name} completed in {elapsed:.2f}ms")
logger.error(f"[{request_id}] {tool_name} failed after {elapsed:.2f}ms: {e}")
```

## Async Patterns

**Context Managers:**
```python
async def __aenter__(self) -> "PiveauClient":
    return self

async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
    await self.close()
```

**Lifespan Pattern (FastMCP):**
```python
@asynccontextmanager
async def lifespan(mcp: FastMCP):
    # Setup
    client = PiveauClient(...)
    try:
        yield AppState(settings=settings, piveau_client=client)
    finally:
        await client.close()
```

## Dependency Injection

**Pattern from `app/dependencies.py`:**
```python
def get_app_state(ctx: Context) -> "AppState":
    """Get the AppState from lifespan context."""
    return ctx.request_context.lifespan_context

def get_piveau_client(ctx: Context) -> "PiveauClient":
    """Get the PiveauClient from server state."""
    return get_app_state(ctx).piveau_client
```

**Usage in tools:**
```python
async def get_dataset(ctx: Context, dataset_id: str) -> dict[str, Any]:
    client = get_piveau_client(ctx)
    return await client.get_dataset(dataset_id)
```

## Tool Registration Pattern

**Use decorator-based registration with register functions:**
```python
def register_discovery_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        name="list_catalogues",
        description="List available data catalogues...",
        annotations={"readOnlyHint": True},
    )
    async def list_catalogues(ctx: Context, ...) -> list[dict[str, Any]]:
        ...
```

**Tool Annotations:**
- `readOnlyHint: True` for read operations
- `readOnlyHint: False, destructiveHint: False` for create operations
- `readOnlyHint: False, idempotentHint: True` for update operations
- `readOnlyHint: False, destructiveHint: True` for delete operations

## Middleware Pattern

**From `app/middleware.py`:**
```python
class AuditMiddleware(Middleware):
    async def on_call_tool(self, context: MiddlewareContext, call_next):
        # Pre-processing
        start = time.perf_counter()
        try:
            result = await call_next(context)
            # Post-processing on success
            return result
        except Exception as e:
            # Post-processing on failure
            raise
```

## Configuration Pattern

**Use pydantic-settings with environment prefix:**
```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AUSTRIA_MCP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    piveau_api_base: str = Field(default="https://qs.data.gv.at/api/hub/repo")
    piveau_api_key: SecretStr | None = Field(default=None)
```

**Singleton getter pattern:**
```python
_settings: Settings | None = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
```

## Comments and Documentation

**When to Comment:**
- Module docstrings at top of every file
- Class docstrings for non-obvious classes
- Function docstrings for public API functions

**Docstring Style:**
```python
"""Austria Open Data MCP Server."""

"""HTTP client for the Piveau Hub API."""

"""Get the AppState from lifespan context."""
```

**Inline comments for complex logic only.**

## Constants

**Define as class attributes or module-level:**
```python
# Class-level
class PiveauClient:
    ACCEPT_HEADER = "application/ld+json, application/json;q=0.9, text/turtle;q=0.8"
    RDF_CONTENT_TYPES = frozenset(["text/turtle", "application/rdf+xml", ...])

# Use frozenset for immutable sets
class AuthMiddleware:
    WRITE_TOOLS = frozenset({
        "create_dataset_draft",
        "update_dataset_draft",
        ...
    })
```

---

*Convention analysis: 2025-01-16*
