# Documentation Generation Scripts

Scripts for auto-generating API documentation from Python source code.

## generate_docs.py

Generates complete MCP tools reference from Python tool definitions.

**Usage:**
```bash
cd mcp
python scripts/generate_docs.py
```

**Output:** `docs/api/api/tools.mdx` (committed to git)

**When to regenerate:**
- After adding new MCP tools
- After changing tool parameters or descriptions
- After updating Pydantic Field annotations
- Before documentation releases

**How it works:**
1. Creates temporary FastMCP instance
2. Calls all `register_*_tools()` functions to register tools
3. Accesses registered tools from MCP instance tool registry (`mcp._tool_manager._tools`)
4. Extracts metadata from Tool objects' JSON Schema parameters
5. Formats types for TypeScript-style TypeTable display
6. Renders Jinja2 template with Accordion + TypeTable components
7. Writes output to docs workspace

**Architecture:**
- `extractors/tool_metadata.py` - Extract tool metadata from FastMCP Tool objects
- `extractors/type_formatter.py` - Format JSON Schema types for TypeScript display
- `templates/tools.mdx.j2` - Jinja2 MDX template
- `generate_docs.py` - Main script orchestrating extraction and rendering

**Critical Design:** Tools are nested functions inside `register_*_tools()` functions with `@mcp.tool` decorators. Extraction works by:
1. Calling registration functions to register tools with temporary MCP instance
2. Accessing tool registry from MCP instance (`_tool_manager._tools`)
3. Extracting metadata from Tool objects' pre-computed JSON Schema

**Requirements:**
- Python 3.11+
- Jinja2 (in pyproject.toml dependencies)
- Access to app.tools modules and FastMCP

**Troubleshooting:**
- "Module not found": Run from `mcp/` directory
- "Expected 25 tools, found N": Check all registration functions called
- "Type formatting errors": Check for unsupported type hints in tool signatures
- "Tool count != 25": Verify all 5 registration functions (discovery, analysis, preview, management, vocabularies) are called
