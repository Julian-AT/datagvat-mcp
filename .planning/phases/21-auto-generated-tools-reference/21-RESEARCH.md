# Phase 21: Auto-Generated Tools Reference - Research

**Researched:** 2026-01-20
**Domain:** Documentation automation, Python introspection, MDX generation
**Confidence:** HIGH

## Summary

Phase 21 creates an auto-generated API reference for all 25 MCP tools by extracting documentation from Python source code and generating MDX with Fumadocs components. The existing `docs/api/api/tools.mdx` demonstrates the target format: Accordion-based layout with TypeTable for parameters and JSON examples for returns.

**Key findings:**
- 25 tools confirmed across 5 modules (discovery: 9, analysis: 3, preview: 2, management: 7, vocabularies: 4)
- Python's `inspect` module + Pydantic Field metadata provide complete parameter documentation
- Fumadocs TypeTable, Accordion, and Files components already proven in Phase 18
- MDX generation is straightforward template rendering from extracted metadata

**Primary recommendation:** Build custom Python script using `inspect.signature()` to extract tool metadata from FastMCP decorators and Pydantic Field annotations, then generate MDX using Jinja2 templates.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python inspect | stdlib | Function signature introspection | Built-in, no dependencies, complete access to function metadata |
| Pydantic | 2.x | Type annotations and Field metadata | Already used in MCP tools for parameter validation |
| Jinja2 | 3.x | Template rendering for MDX generation | Industry standard for Python templating, flexible, well-documented |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ast | stdlib | Parse docstrings if complex | If docstrings need structured parsing beyond simple extraction |
| pathlib | stdlib | File path handling | Cross-platform path operations |
| typing | stdlib | Type hint inspection | Extract generic types, Optional, Union patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Jinja2 | f-strings/manual | Jinja2 provides better structure for complex templates with loops and conditionals |
| Custom script | Sphinx autodoc | Sphinx is overkill for 25 tools and requires RST conversion; custom script is simpler |
| Runtime extraction | Static AST parsing | Runtime extraction via inspect is simpler and captures decorated function metadata correctly |

**Installation:**
```bash
# Jinja2 only new dependency (inspect, ast, pathlib, typing are stdlib)
pip install jinja2
```

## Architecture Patterns

### Recommended Project Structure
```
mcp/
├── scripts/
│   ├── generate_docs.py           # Main generation script
│   ├── templates/
│   │   └── tools.mdx.j2           # MDX template
│   └── extractors/
│       ├── tool_metadata.py       # Extract tool info
│       └── type_formatter.py      # Format Pydantic types for TypeTable
docs/
└── api/
    └── api/
        └── tools.mdx              # Generated output (committed to git)
```

### Pattern 1: Tool Metadata Extraction
**What:** Use inspect.signature() to extract parameter metadata from FastMCP-decorated functions
**When to use:** During doc generation (not runtime)
**Example:**
```python
# Source: Python inspect stdlib documentation
import inspect
from typing import get_type_hints, get_args, get_origin

def extract_tool_metadata(tool_func):
    """Extract complete tool metadata for documentation."""
    sig = inspect.signature(tool_func)
    type_hints = get_type_hints(tool_func, include_extras=True)

    params = {}
    for name, param in sig.parameters.items():
        if name == 'ctx':  # Skip FastMCP Context
            continue

        # Extract Pydantic Field metadata from Annotated
        field_info = None
        if get_origin(type_hints[name]) is Annotated:
            args = get_args(type_hints[name])
            for arg in args[1:]:
                if hasattr(arg, 'description'):  # Pydantic Field
                    field_info = arg
                    break

        params[name] = {
            'type': format_type(type_hints[name]),
            'description': field_info.description if field_info else '',
            'default': param.default if param.default != inspect.Parameter.empty else None,
            'required': param.default == inspect.Parameter.empty
        }

    return {
        'name': tool_func.__name__,
        'description': tool_func.__doc__ or '',
        'parameters': params,
        'return_type': format_type(type_hints.get('return', 'Any'))
    }
```

### Pattern 2: MDX Template Generation
**What:** Jinja2 template that renders tool metadata as Accordion + TypeTable MDX
**When to use:** After extracting all tool metadata
**Example:**
```jinja2
{# Source: Existing tools.mdx structure #}
---
title: MCP Tools Reference
description: Complete reference for all Austria MCP server tools
---

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { TypeTable } from 'fumadocs-ui/components/type-table';

# MCP Tools

The Austria MCP server provides comprehensive tools for discovering, analyzing, and managing Austrian Open Data datasets.

{% for category in categories %}
## {{ category.title }}

<Accordions type="single" collapsible>
{% for tool in category.tools %}
  <Accordion title="{{ tool.name }}" id="{{ tool.id }}">
    {{ tool.description }}

    **Parameters:**

    <TypeTable type={{
{% for param_name, param_info in tool.parameters.items() %}
      {{ param_name }}: {
        type: "{{ param_info.type }}",
        description: "{{ param_info.description }}",
{% if param_info.default is not none %}
        default: {{ param_info.default }}{% if not loop.last %},{% endif %}
{% endif %}
      }{% if not loop.last %},{% endif %}
{% endfor %}
    }} />

    **Returns:**

    ```json
    {{ tool.return_example | tojson(indent=2) }}
    ```

    **Example:**

    ```python
    {{ tool.usage_example }}
    ```
  </Accordion>
{% endfor %}
</Accordions>
{% endfor %}
```

### Pattern 3: Pydantic Type Formatting
**What:** Convert Python type hints to user-friendly TypeScript-style strings for TypeTable
**When to use:** When formatting parameter types for display
**Example:**
```python
# Source: Existing tools.mdx patterns
from typing import get_origin, get_args

def format_type(type_hint) -> str:
    """Format Python type hint as TypeScript-style string."""
    origin = get_origin(type_hint)

    # Handle Annotated types
    if origin is Annotated:
        return format_type(get_args(type_hint)[0])

    # Handle Optional (Union with None)
    if origin is Union:
        args = get_args(type_hint)
        if type(None) in args:
            non_none = [a for a in args if a is not type(None)]
            if len(non_none) == 1:
                return format_type(non_none[0])

    # Handle list types
    if origin is list:
        inner = get_args(type_hint)[0] if get_args(type_hint) else 'Any'
        return f"{format_type(inner)}[]"

    # Handle dict types
    if origin is dict:
        return "object"

    # Basic types
    type_map = {
        int: 'integer',
        float: 'number',
        str: 'string',
        bool: 'boolean',
        dict: 'object',
        list: 'array'
    }

    return type_map.get(type_hint, str(type_hint))
```

### Anti-Patterns to Avoid
- **Hardcoding tool lists:** Extract dynamically from source code to avoid sync issues
- **Runtime doc generation:** Generate docs at build time, commit to git for version control
- **Ignoring Field metadata:** Pydantic Field has description, ge/le constraints, patterns - extract all of it
- **Manual MDX editing:** All MDX should be generated; manual edits will be overwritten

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type hint parsing | Custom regex parser | typing.get_origin/get_args + inspect | Handles generics, Annotated, Union correctly; edge cases are subtle |
| Template formatting | Manual string concatenation | Jinja2 | Template logic (loops, conditionals) becomes unmaintainable with f-strings |
| MDX escaping | Manual quote handling | Jinja2 autoescape + tojson filter | JSON serialization handles quotes, nested structures correctly |
| File watching for re-gen | Custom file watcher | npm/pnpm script hook | Build tool integration is standard practice |

**Key insight:** Python's inspect + typing modules already solve introspection comprehensively. Don't parse source code as text or use AST unless you need docstring structure parsing (which we don't - FastMCP uses description parameter).

## Common Pitfalls

### Pitfall 1: Missing Pydantic Field Metadata
**What goes wrong:** Parameters show no descriptions or constraints in docs
**Why it happens:** Not extracting metadata from Annotated[Type, Field(...)] wrapper
**How to avoid:** Use get_args() on Annotated types to find Field objects, extract description/ge/le/pattern
**Warning signs:** Generated TypeTable shows empty descriptions or missing defaults

### Pitfall 2: Context Parameter in Docs
**What goes wrong:** Generated docs include `ctx: Context` parameter that users never provide
**Why it happens:** Context is injected by FastMCP, not a user parameter
**How to avoid:** Skip parameters named 'ctx' or typed as Context when extracting
**Warning signs:** Tool examples show ctx parameter in usage

### Pitfall 3: Type Display Inconsistency
**What goes wrong:** Same type shows as "str" in one place, "string" in another
**Why it happens:** Mixing Python type names with TypeScript conventions
**How to avoid:** Consistent type_map: int->integer, str->string, bool->boolean, list->array
**Warning signs:** TypeTable mixes "str[]" and "array[string]" styles

### Pitfall 4: JSON Example Hardcoding
**What goes wrong:** Return examples become outdated when API changes
**Why it happens:** Examples manually written instead of derived from real tool responses
**How to avoid:**
- Option 1: Extract examples from docstrings as JSON blocks
- Option 2: Use actual tool responses (requires test data)
- Option 3: Template generic examples based on return type schema
**Warning signs:** Examples show fields that no longer exist in return values

### Pitfall 5: Import Statement Duplication
**What goes wrong:** Generated MDX has redundant import statements
**Why it happens:** Template includes imports for every tool instead of once at top
**How to avoid:** Single import block in template header, not per-tool
**Warning signs:** MDX has multiple `import { Accordion } from ...` lines

## Code Examples

Verified patterns from official sources:

### Extracting FastMCP Tool Registry
```python
# Source: FastMCP server structure (mcp/app/server.py)
# Tools are registered via register_*_tools(mcp) functions

from app.tools.discovery import register_discovery_tools
from app.tools.analysis import register_analysis_tools
from app.tools.preview import register_preview_tools
from app.tools.management import register_management_tools
from app.tools.vocabularies import register_vocabulary_tools

# Strategy: Import module and inspect functions with @mcp.tool decorator
import inspect
from app.tools import discovery, analysis, preview, management, vocabularies

def find_mcp_tools(module):
    """Find all functions decorated with @mcp.tool in a module."""
    tools = []
    for name, obj in inspect.getmembers(module, inspect.isfunction):
        # Check if function is defined in this module (not imported)
        if obj.__module__ == module.__name__:
            # FastMCP tools have __wrapped__ attribute from decorator
            if hasattr(obj, '__wrapped__') or name.startswith(('list_', 'get_', 'search_', 'find_', 'check_', 'analyze_', 'preview_', 'create_', 'update_', 'delete_', 'publish_', 'hide_')):
                tools.append(obj)
    return tools

# Collect all tools
all_tools = {
    'Discovery Tools': find_mcp_tools(discovery),
    'Analysis Tools': find_mcp_tools(analysis),
    'Preview Tools': find_mcp_tools(preview),
    'Management Tools': find_mcp_tools(management),
    'Vocabulary Tools': find_mcp_tools(vocabularies),
}
```

### Complete Generation Script Structure
```python
# Source: Combined patterns from research
#!/usr/bin/env python3
"""Generate API documentation from MCP tool definitions."""

import inspect
import json
from pathlib import Path
from typing import Any, get_args, get_origin, get_type_hints
from jinja2 import Environment, FileSystemLoader

# Tool extraction logic
def extract_all_tools() -> dict[str, list[dict[str, Any]]]:
    """Extract metadata from all MCP tools."""
    from app.tools import discovery, analysis, preview, management, vocabularies

    modules = {
        'Discovery Tools': discovery,
        'Analysis Tools': analysis,
        'Preview Tools': preview,
        'Management Tools': management,
        'Vocabulary Tools': vocabularies,
    }

    results = {}
    for category, module in modules.items():
        tools = []
        for name, func in inspect.getmembers(module, inspect.isfunction):
            if func.__module__ == module.__name__ and not name.startswith('_'):
                metadata = extract_tool_metadata(func)
                if metadata:
                    tools.append(metadata)
        results[category] = tools

    return results

# MDX generation
def generate_tools_mdx(output_path: Path):
    """Generate tools.mdx from extracted tool metadata."""
    tools_data = extract_all_tools()

    # Load Jinja2 template
    env = Environment(loader=FileSystemLoader('scripts/templates'))
    template = env.get_template('tools.mdx.j2')

    # Render MDX
    mdx_content = template.render(categories=tools_data)

    # Write output
    output_path.write_text(mdx_content, encoding='utf-8')
    print(f"Generated {output_path}")

if __name__ == '__main__':
    output = Path('docs/api/api/tools.mdx')
    generate_tools_mdx(output)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual API docs | Auto-generated from code | 2020s (OpenAPI era) | Docs stay in sync with code, reduces maintenance |
| Runtime introspection | Build-time generation | 2023+ (static site generation) | Faster page loads, version-controlled docs |
| RST/Sphinx for Python | MDX for modern docs | 2024+ (Fumadocs, Nextra) | React components in docs, better interactivity |
| Docstring parsing (AST) | Type hints + Field metadata | 2024+ (Pydantic 2.x era) | Rich metadata in type system, no docstring conventions needed |

**Deprecated/outdated:**
- Sphinx autodoc for API docs: Too heavyweight for small tool sets, generates RST not MDX
- Manual TypeTable creation: Error-prone, becomes stale immediately
- Separate parameter docs in docstrings: Pydantic Field.description is the source of truth

## Open Questions

Things that couldn't be fully resolved:

1. **Return value schema generation**
   - What we know: Tools return dict[str, Any] with varying structures
   - What's unclear: Whether to generate return schemas from type hints or use example JSON
   - Recommendation: Use example JSON (existing pattern in tools.mdx), extract from docstrings as ```json blocks or hardcode representative examples per tool

2. **Cross-reference linking**
   - What we know: API-04 requires links between related tools
   - What's unclear: How to detect relationships automatically (similar parameters? sequential workflow?)
   - Recommendation:
     - Phase 21: Manual relationship mapping in generation script (dict of tool_name -> [related_tool_names])
     - Future: Could analyze call patterns or shared parameter types

3. **Files component usage for directory structures**
   - What we know: COMP-04 requires Files component, useful for project structure examples
   - What's unclear: Which tools need directory structure documentation
   - Recommendation:
     - Not applicable to most MCP tools (they operate on data, not files)
     - Could use Files in "Getting Started" to show MCP configuration structure
     - Phase 21: Focus on TypeTable + Accordion, defer Files to Phase 22 (Integration)

4. **Tool example freshness**
   - What we know: Examples need to be accurate and copy-paste ready (QUAL-01)
   - What's unclear: How to validate examples automatically
   - Recommendation:
     - Phase 21: Use examples from existing tools.mdx (already validated)
     - Phase 24: Add example validation tests (call tool with example params, check response)

## Sources

### Primary (HIGH confidence)
- Python inspect module documentation (stdlib, verified in Python 3.12)
- Pydantic Field API (used throughout MCP tools, verified in source code)
- Fumadocs TypeTable component (https://www.fumadocs.dev/docs/ui/components/type-table)
- Fumadocs Accordion component (https://www.fumadocs.dev/docs/ui/components/accordion)
- Fumadocs Files component (https://www.fumadocs.dev/docs/ui/components/files)
- Existing tools.mdx structure (C:\GitHub\datagvat-mcp\docs\api\api\tools.mdx)

### Secondary (MEDIUM confidence)
- Jinja2 documentation (industry standard, but template structure is custom)
- MCP tool count verification (25 tools across 5 modules, counted via @mcp.tool decorators)

### Tertiary (LOW confidence - marked for validation)
- Optimal return example format (existing JSON examples work, but unclear if schema-based would be better)
- Tool relationship detection (manual mapping recommended, automated detection not researched)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - inspect/Pydantic/Jinja2 are proven, no experimental dependencies
- Architecture: HIGH - Patterns verified in existing tools.mdx and Python stdlib docs
- Pitfalls: MEDIUM - Based on common Python introspection issues, but not MCP-specific tested

**Research date:** 2026-01-20
**Valid until:** 60 days (Stack is stable: stdlib + Pydantic 2.x + Fumadocs established)

**Notes:**
- 25 tools confirmed (not 24 as initial estimate): 9 discovery + 3 analysis + 2 preview + 7 management + 4 vocabularies
- Existing tools.mdx provides complete template for generation (1131 lines, covers all patterns needed)
- No Context7 documentation available for FastMCP specifics, relying on source code inspection
- Python inspect module is sufficient; no need for heavier tools like Sphinx or mkdocstrings
