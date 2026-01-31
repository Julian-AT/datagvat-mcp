# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Python: snake_case (e.g., `mcp/app/tools/discovery.py`, `mcp/tests/test_resources.py`)
- TypeScript/React: kebab-case for components and utilities (e.g., `docs/components/messages.tsx`, `docs/lib/utils.ts`)
- Test files: `test_*.py` prefix for Python tests
- Configuration files: lowercase with dots (e.g., `pyproject.toml`, `biome.json`, `tsconfig.json`)

**Functions:**
- Python: snake_case (e.g., `register_discovery_tools`, `get_piveau_client`, `calculate_quality_score`)
- TypeScript: camelCase (e.g., `generateUUID`, `getLocalStorage`, `convertToUIMessages`)
- Async functions: No special prefix; use `async def` (Python) or `async function` (TypeScript)

**Variables:**
- Python: snake_case (e.g., `mock_client`, `sample_dataset`, `app_state`)
- TypeScript: camelCase (e.g., `selectedModelId`, `isReadonly`, `messagesEndRef`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `ACCEPT_HEADER`, `RDF_CONTENT_TYPES`)

**Types:**
- Python: PascalCase for classes and Pydantic models (e.g., `PiveauClient`, `Dataset`, `AppState`)
- TypeScript: PascalCase for types and interfaces (e.g., `ChatMessage`, `MessagesProps`, `PostRequestBody`)
- Python Enums: PascalCase for class, SCREAMING_SNAKE_CASE for values (e.g., `ValueType.URI_REFS`)

## Code Style

**Formatting:**
- Python: Ruff formatter with 120-character line length (`mcp/pyproject.toml`)
- TypeScript/docs: Biome formatter with 100-character line length, 2-space indentation (`docs/biome.json`)
- Line endings: LF (enforced by `.editorconfig`)
- Final newline: Required in all files

**Linting:**
- Python: Ruff linter with rules ["E", "F", "I", "UP"], ignores E501 (line too long)
- TypeScript: Biome linter with recommended rules, custom rules for style, complexity, and accessibility
- Biome rules include: noNegationElse (error), useBlockStatements (warn), noExplicitAny (warn)

**Indentation:**
- Python: 4 spaces (`.editorconfig` line 27-28)
- TypeScript/JSON/YAML: 2 spaces (`.editorconfig` line 9, confirmed in `docs/biome.json`)

**Quotes:**
- TypeScript: Single quotes for JS/TS, double quotes for JSX attributes (`docs/biome.json` lines 45-46)
- Python: No strict enforcement; double quotes common in codebase

**Semicolons:**
- TypeScript: Always required (Biome config: `semicolons: "always"`)

**Trailing commas:**
- TypeScript: ES5-compatible trailing commas (`trailingCommas: "es5"`)

## Import Organization

**Order:**
1. Standard library imports (Python: `import logging`, TypeScript: `type` imports from libraries)
2. Third-party framework imports (Python: `fastmcp`, `httpx`, `pydantic`; TypeScript: `ai`, `next/server`)
3. Local application imports (Python: `from app.client import`, TypeScript: `@/components`, `@/lib`)

**Python example from `mcp/app/tools/analysis.py`:**
```python
import logging
from typing import Annotated, Any

from fastmcp import Context, FastMCP
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

from app.dependencies import get_piveau_client
from app.models import IdentifierType
```

**TypeScript example from `docs/components/messages.tsx`:**
```typescript
import type { UseChatHelpers } from '@ai-sdk/react';
import { ChevronDown } from 'lucide-react';
import { Greeting } from '@/components/greeting';
import { PreviewMessage, ThinkingMessage } from '@/components/message';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
```

**Path Aliases:**
- TypeScript: `@/*` maps to project root (configured in `docs/tsconfig.json` line 23)
- Python: Relative imports within `app` namespace (e.g., `from app.client import`)

**Import optimization:**
- Biome: Auto-organize imports on save (configured in `docs/biome.json` lines 60-62)

## Error Handling

**Patterns:**
- Python: Custom exception classes inherit from `Exception` (e.g., `PiveauApiError`, `PiveauNotFoundError`, `PiveauAuthError` in `mcp/app/client.py`)
- Python MCP tools: Wrap exceptions and raise `fastmcp.exceptions.ToolError` with descriptive messages
- TypeScript: Custom `ChatSDKError` class with error codes (see `docs/lib/errors.ts`)
- Async error handling: Use try/except (Python) or try/catch (TypeScript) blocks

**Python example from `mcp/app/tools/analysis.py`:**
```python
try:
    return await client.get_metrics(dataset_id, historic=include_history)
except Exception as e:
    raise ToolError(f"Failed to fetch metrics for dataset '{dataset_id}': {e}") from e
```

**TypeScript example from `docs/lib/utils.ts`:**
```typescript
try {
  const response = await fetch(input, init);
  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }
  return response;
} catch (error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ChatSDKError('offline:chat');
  }
  throw error;
}
```

**Graceful degradation:**
- Non-critical operations log warnings and continue (e.g., `mcp/app/tools/analysis.py` lines 94-96, 104-106)
- Track degraded state in responses with `degraded` and `degradation_reasons` fields

## Logging

**Framework:**
- Python: Built-in `logging` module
- TypeScript: `console.log`, `console.error`

**Patterns:**
- Python: Create logger per module: `logger = logging.getLogger(__name__)`
- Log levels: INFO for startup/shutdown, WARNING for degraded operations, ERROR for failures
- Python example from `mcp/app/server.py`:
```python
logger = logging.getLogger(__name__)
logger.info("Starting Austria MCP Server")
```
- Python example from `mcp/app/tools/analysis.py`:
```python
logger.warning(f"Distributions unavailable for dataset {dataset_id}: {e}")
```

**Configuration:**
- Python: Configured in lifespan with basicConfig (see `mcp/app/server.py` lines 39-42)
- Log format: `"%(asctime)s [%(levelname)s] %(name)s: %(message)s"`
- Level set from `settings.log_level` environment variable

## Comments

**When to Comment:**
- Docstrings: Required for public functions, classes, and methods
- Inline comments: Used sparingly for complex logic or non-obvious behavior
- Type hints preferred over comments for describing parameters

**Python Docstrings:**
- Use triple double-quotes
- Include Args, Returns, Raises sections
- Example from `mcp/app/tools/discovery.py`:
```python
def calculate_quality_score(dataset: dict[str, Any]) -> float:
    """Calculate quality score for a dataset based on metadata completeness.

    Score components (0-100 scale):
    - Has title: 10 points
    - Has description: 15 points
    [...]

    Returns:
        Float score 0-100 where 100 is highest quality.
    """
```

**TypeScript JSDoc:**
- Minimal usage; TypeScript types provide sufficient documentation
- Type annotations preferred over JSDoc comments
- Example from `docs/components/messages.tsx`:
```typescript
type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>['addToolApprovalResponse'];
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  // ... more properties with explicit types
};
```

## Function Design

**Size:**
- Python: Functions typically 20-100 lines; complex operations split into helpers (e.g., `calculate_quality_score` in `mcp/app/tools/discovery.py`)
- TypeScript: React components 30-90 lines; utility functions 10-40 lines

**Parameters:**
- Python: Use `Annotated` types with Pydantic `Field` for validation and descriptions
- TypeScript: Use typed objects for multiple related parameters (e.g., `MessagesProps`)
- Example from `mcp/app/tools/analysis.py`:
```python
async def get_dataset_metrics(
    ctx: Context,
    dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="...")],
    include_history: Annotated[bool, Field(description="...")] = False,
) -> dict[str, Any]:
```

**Return Values:**
- Python: Explicit return type hints (e.g., `-> dict[str, Any]`, `-> list[dict[str, Any]]`)
- TypeScript: Inferred or explicit return types for complex functions
- Prefer structured dicts/objects over tuples

**Progress Reporting:**
- Python MCP tools: Check if `ctx` exists before calling `await ctx.report_progress(current, total, message)`
- Example from `mcp/app/tools/analysis.py`:
```python
if ctx:
    await ctx.report_progress(1, total_steps, "Fetching dataset metadata...")
```

## Module Design

**Exports:**
- Python: Define `__all__` in `__init__.py` files (e.g., `mcp/app/tools/__init__.py`)
- TypeScript: Named exports for components and utilities; avoid default exports except for page components

**Barrel Files:**
- Python: `__init__.py` files import key exports for convenience
- TypeScript: Limited usage; prefer explicit imports from individual files

**Module structure:**
- Python: Organize by feature (e.g., `tools/discovery.py`, `tools/analysis.py`, `tools/vocabularies.py`)
- Registration pattern: Each module provides `register_*_tools(mcp: FastMCP)` function
- Example from `mcp/app/server.py`:
```python
register_discovery_tools(mcp)
register_analysis_tools(mcp)
register_vocabulary_tools(mcp)
register_preview_tools(mcp)
register_resources(mcp)
register_prompts(mcp)
```

## Type Safety

**Python:**
- Use Pydantic models for data validation (`mcp/app/models.py`)
- Type hints required for function signatures
- Enums for fixed value sets (e.g., `ValueType`, `IdentifierType`)
- `TYPE_CHECKING` imports for circular dependency resolution

**TypeScript:**
- Strict mode enabled (`docs/tsconfig.json` line 11: `"strict": true`)
- Explicit `type` imports for type-only references
- Utility types from `ai` package (e.g., `UseChatHelpers<ChatMessage>`)
- Avoid `any`; use `unknown` with type guards when necessary

---

*Convention analysis: 2026-01-31*
