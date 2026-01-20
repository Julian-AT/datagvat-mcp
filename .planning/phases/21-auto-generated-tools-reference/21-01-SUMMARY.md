---
phase: 21-auto-generated-tools-reference
plan: 01
subsystem: documentation
tags: [fastmcp, jinja2, python-introspection, mdx, fumadocs, json-schema]

# Dependency graph
requires:
  - phase: 18-documentation-foundation
    provides: Fumadocs workspace with TypeTable and Accordion components
  - phase: 17-fumadocs-workspace-restructuring
    provides: Separate API workspace at docs/api/api/
provides:
  - Auto-generation scripts for extracting tool metadata from FastMCP registry
  - Jinja2 template for rendering tools reference as MDX
  - Complete tools.mdx with all 25 MCP tools documented
  - Reproducible generation workflow (run script, commit updated MDX)
affects: [22-progressive-disclosure-examples, 24-interactive-improvements]

# Tech tracking
tech-stack:
  added: [jinja2>=3.1.0]
  patterns:
    - FastMCP Tool object extraction via _tool_manager._tools
    - JSON Schema to TypeScript type mapping
    - Jinja2 template with escaped braces for MDX syntax compatibility
    - Tool count assertion preventing incomplete documentation

key-files:
  created:
    - mcp/scripts/extractors/tool_metadata.py
    - mcp/scripts/extractors/type_formatter.py
    - mcp/scripts/templates/tools.mdx.j2
    - mcp/scripts/generate_docs.py
    - mcp/scripts/README.md
    - docs/api/api/tools.mdx
  modified:
    - mcp/pyproject.toml

key-decisions:
  - "Use FastMCP Tool object's JSON Schema instead of function introspection - more reliable and already formatted"
  - "Access tool registry via _tool_manager._tools (synchronous) instead of get_tools() (async) for simpler extraction"
  - "Handle anyOf patterns in JSON Schema for optional parameters (str | None, list[str] | None)"
  - "Escape Jinja2 braces using {\"{\"}}/{\"}\"}  for TypeTable MDX syntax compatibility"
  - "Generate tools.mdx and commit to git (not build artifact) for version control and review"

patterns-established:
  - "Tool metadata extraction: Use registered Tool objects from FastMCP instance, not source file parsing"
  - "Type formatting: Map JSON Schema types to TypeScript-style strings for TypeTable compatibility"
  - "Template rendering: Jinja2 template with category loops and tool parameter iteration"
  - "Generation verification: Assert tool count == 25 before writing output to prevent incomplete docs"

# Metrics
duration: 21min
completed: 2026-01-20
---

# Phase 21 Plan 01: Auto-Generated Tools Reference Summary

**Auto-generated tool reference using FastMCP registry extraction and Jinja2 MDX templates - all 25 tools documented with complete parameter schemas**

## Performance

- **Duration:** 21 min
- **Started:** 2026-01-20T07:55:09Z
- **Completed:** 2026-01-20T08:16:10Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 1

## Accomplishments

- Created extraction system using FastMCP Tool object's pre-computed JSON Schema parameters
- Built Jinja2 template rendering Accordion-based MDX with TypeTable components
- Generated complete tools.mdx with all 25 tools across 5 categories
- Documentation builds successfully without errors (485 static pages generated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tool Metadata Extraction and Type Formatting** - `06fdad0` (feat)
   - tool_metadata.py: Extract from FastMCP Tool objects via _tool_manager._tools
   - type_formatter.py: Map JSON Schema types to TypeScript-style strings
   - Handle anyOf patterns for optional parameters

2. **Task 2: Create MDX Template and Generation Script** - `10bc808` (feat)
   - tools.mdx.j2: Jinja2 template with escaped braces for MDX compatibility
   - generate_docs.py: Main script with tool count verification
   - Added Jinja2 dependency to pyproject.toml

3. **Task 3: Generate and Verify Complete Tool Reference** - `cc1bfba` (feat)
   - Generated tools.mdx with all 25 tools documented
   - Created scripts/README.md documenting workflow
   - Verified documentation builds successfully

## Files Created/Modified

### Created
- `mcp/scripts/extractors/__init__.py` - Package marker
- `mcp/scripts/extractors/tool_metadata.py` - Extract metadata from FastMCP Tool objects
- `mcp/scripts/extractors/type_formatter.py` - Format JSON Schema types for TypeScript display
- `mcp/scripts/templates/tools.mdx.j2` - Jinja2 MDX template for tool reference
- `mcp/scripts/generate_docs.py` - Main generation script with verification
- `mcp/scripts/README.md` - Generation workflow documentation
- `docs/api/api/tools.mdx` - Generated tool reference (983 lines, 25 tools)

### Modified
- `mcp/pyproject.toml` - Added jinja2>=3.1.0 dependency

## Decisions Made

**1. Use Tool object's JSON Schema instead of function introspection**
- **Rationale:** FastMCP Tool objects already have pre-computed JSON Schema parameters with descriptions extracted from Pydantic Fields. More reliable than manual introspection.
- **Impact:** Simpler extraction code, guaranteed accuracy with FastMCP's own serialization

**2. Access _tool_manager._tools (synchronous) instead of get_tools() (async)**
- **Rationale:** get_tools() is async, requiring asyncio event loop for simple extraction script. _tool_manager._tools provides synchronous dict access.
- **Impact:** Simpler generation script, no async boilerplate needed

**3. Handle anyOf JSON Schema patterns**
- **Rationale:** Optional parameters (str | None, list[str] | None) use anyOf in JSON Schema. Need to extract non-null type for TypeTable display.
- **Impact:** Correct type formatting for all parameters including optional ones

**4. Escape Jinja2 braces using {\"{\"}}/{\"}\"}**
- **Rationale:** TypeTable uses {{...}} syntax which conflicts with Jinja2's {{...}} template syntax.
- **Impact:** Template renders valid MDX TypeTable syntax without Jinja2 parsing errors

**5. Commit generated tools.mdx to git**
- **Rationale:** Documentation is reviewable artifact, not ephemeral build output. Version control enables diffing changes when tools are updated.
- **Impact:** tools.mdx tracked in git, changes visible in PR reviews

## Deviations from Plan

None - plan executed exactly as written.

**Tool count verification:** All 25 tools extracted and documented across 5 categories (Discovery: 8, Analysis: 3, Preview: 2, Management: 7, Vocabulary: 5)

## Issues Encountered

**1. Unicode encoding issue with checkmark character**
- **Problem:** Windows console (cp1252) couldn't encode ✓ character in print output
- **Solution:** Changed to ASCII "[OK]" prefix instead
- **Impact:** No functional impact, just cosmetic output change

**2. Jinja2 template syntax conflict with MDX**
- **Problem:** TypeTable {{...}} syntax conflicted with Jinja2 {{...}} delimiters
- **Solution:** Used Jinja2 string literals {\"{\"}  and {\"}\"} to escape braces
- **Impact:** Template successfully renders valid MDX

## Next Phase Readiness

**Ready for Phase 22 (Progressive Disclosure Examples):**
- Complete tool reference provides foundation for example selection
- All 25 tools documented with parameters - can identify which tools need basic/advanced examples
- Generated MDX structure proven to work with Fumadocs build

**Ready for Phase 24 (Interactive Improvements):**
- Auto-generation infrastructure in place for adding return value schemas
- Template structure supports additional sections (cross-references, related tools)
- Regeneration workflow documented for iterative improvements

**Deferred requirements tracking:**
- API-03 (Return value schemas): Generic placeholders only. Full schema extraction deferred to Phase 24.
- API-04 (Cross-references): Manual relationship mapping deferred to Phase 24. Requires editorial decisions about which tools relate.

---
*Phase: 21-auto-generated-tools-reference*
*Completed: 2026-01-20*
