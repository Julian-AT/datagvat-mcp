# Phase 2: Navigation Restructuring - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure documentation navigation from 7 shallow root-level tabs to 3-4 deep root folders using Fumadocs folder groups and advanced meta.json features. Users should reach any page in ≤3 clicks from homepage. Navigation must be consistent across all pages.

</domain>

<decisions>
## Implementation Decisions

### Target Structure
- **3 main navigation groups** using folder groups:
  1. `getting-started/` (root folder, ungrouped)
  2. `(guides)/` folder group containing: `guides/`, `workflows/`, `examples/`
  3. `reference/` (root folder) containing: `tools/`, `api/`
  4. `(advanced)/` folder group containing: `integration/`, `best-practices/`, `advanced/`

- **Current 7 tabs consolidate as follows**:
  - `getting-started` → stays as root folder
  - `guides`, `workflows`, `examples` → grouped under `(guides)/`
  - `tools` → moves to `reference/tools/`
  - `integration`, `best-practices`, `advanced` → grouped under `(advanced)/`

### Advanced meta.json Features to Use
1. **Separators with icons**: `---[Icon]Label---` for visual organization
2. **External links**: `external:[Text](url)` for official resources
3. **Rest operator**: `...` to include remaining items
4. **Reversed rest**: `z...a` for reverse alphabetical
5. **Extract**: `...folder` to pull in folder contents
6. **Except**: `!item` to exclude specific items
7. **Root folders**: `"root": true` flag for top-level navigation
8. **Folder groups**: Parentheses `(guides)` for visual grouping without nesting

### Navigation Hierarchy Depth
- **Maximum 3 levels deep**: Root → Category → Page
- **Root meta.json**: Uses separators and folder groups for visual organization
- **Each root folder**: Has its own meta.json with icon, title, description
- **Sidebar structure**: Folder groups provide visual separation without adding click depth

### File Organization
- Move `docs/content/docs/tools/` → `docs/content/docs/reference/tools/`
- Use git mv to preserve history
- Create migration map document: `.planning/navigation-migration-map.md`

### Icons
- All icons from `lucide-react` library
- Semantic icon choices:
  - Getting Started: `Rocket`
  - Guides: `BookOpen`
  - Workflows: `Workflow`
  - Examples: `Code2`
  - Reference: `Library`
  - Integration: `Plug`
  - Best Practices: `Award`
  - Advanced: `Settings`

### 3-Click Access Pattern
- **Click 1**: From homepage to top-level section (Getting Started, Guides, Reference, Advanced)
- **Click 2**: To sub-section within folder group (e.g., Workflows within Guides)
- **Click 3**: To specific page (e.g., Discovery workflow)
- Separators are visual only, don't count as clicks
- External links in navigation for quick access to official resources

### Claude's Discretion
- Exact separator placement within each meta.json
- Specific icon choices for sub-sections (as long as they're from lucide-react)
- Order of pages within sections (unless user specifies)
- Whether to use `defaultOpen: true` for certain sections

</decisions>

<specifics>
## Specific Implementation Details

### Root meta.json Structure
```json
{
  "$schema": ".source/json-schema/docs.meta.json",
  "pages": [
    "getting-started",
    "---[BookOpen]Documentation---",
    "(guides)",
    "---[Code]Reference---",
    "reference",
    "---[Wrench]Advanced Topics---",
    "(advanced)",
    "---[ExternalLink]Resources---",
    "external:[Official data.gv.at API](https://www.data.gv.at/katalog/api/3/)",
    "external:[GitHub Repository](https://github.com/yourusername/datagvat-mcp)"
  ]
}
```

### Root Folder meta.json Pattern
All root folders (`getting-started`, `guides`, `workflows`, `examples`, `reference`, `integration`, `best-practices`, `advanced`) should have:
- `"root": true` flag
- `title`, `description`, `icon` fields
- Schema reference to correct relative path
- `pages` array using advanced features (separators, rest operators, etc.)

### Folder Group Naming
- Use parentheses: `(guides)`, `(advanced)`
- Contains multiple root folders
- Provides visual grouping in navigation without adding hierarchy depth

### External Links Format
- `external:[Display Text](URL)`
- Used for official API docs, GitHub, MCP specification
- Placed in appropriate sections with separator labels

</specifics>

<deferred>
## Deferred Ideas

None — discussion provided complete implementation specification within phase scope.

</deferred>

---

*Phase: 02-navigation-restructuring*
*Context gathered: 2026-01-21*
