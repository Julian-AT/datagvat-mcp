# Phase 2: Navigation Restructuring - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure documentation navigation from 7 shallow root-level tabs to 3-4 deep root folders using advanced Fumadocs meta.json features. Users must be able to reach any page in 3 clicks or fewer with clear visual hierarchy and logical grouping.

</domain>

<decisions>
## Implementation Decisions

### Target Navigation Structure
- 3 main content groups: Getting Started, Documentation (guides/workflows/examples), Reference
- 1 advanced topics group: Integration, Best Practices, Advanced
- Folder groups (parentheses syntax) to organize related sections: `(guides)`, `(advanced)`
- Root folders marked with `"root": true` for top-level navigation

### Section Consolidation Strategy
**Current → Target mapping:**
- `getting-started/` → Remains as root folder with enhanced meta.json
- `guides/`, `workflows/`, `examples/` → Grouped under `(guides)` folder group
- `tools/`, `api/` → Moved to `reference/` root folder as subfolders
- `integration/`, `best-practices/`, `advanced/` → Grouped under `(advanced)` folder group

### meta.json Advanced Features Usage
**Separators with icons:** `---[Icon]Label---` for visual section breaks
- Example: `---[BookOpen]Documentation---`, `---[Code]Reference---`

**External links:** `external:[Text](url)` for ecosystem resources
- Example: `external:[Official data.gv.at API](https://www.data.gv.at/katalog/api/3/)`

**Rest operator:** `...` to include remaining items alphabetically

**Reversed rest:** `z...a` for reverse alphabetical order (workflows)

**Extract operator:** `...folder` to pull items from subfolder into parent

**Exclude operator:** `!item` to omit specific items (e.g., `!deprecated-guide`)

### Folder Organization Rules
**Root folders require:**
- `"root": true` property
- `"title"` descriptive name
- `"description"` for navigation context
- `"icon"` from lucide-react icon set
- Optional: `"defaultOpen": true` for getting-started

**Folder groups (parentheses):**
- Use `(guides)` syntax for logical grouping without extra nav level
- Contains multiple root folders that appear as siblings in navigation
- No meta.json at group level - only in contained folders

### Navigation Hierarchy Depth
- **Level 1:** Root folders (getting-started, (guides), reference, (advanced))
- **Level 2:** Sections within root folders (guides/, workflows/, examples/)
- **Level 3:** Topic pages within sections (searching-datasets, quality-assessment)
- **Max depth:** 3 clicks to reach any page

### File Migration Strategy
- Use `git mv` to preserve history when moving files
- Document all path changes in `.planning/navigation-migration-map.md`
- Update internal links in moved files
- Key moves:
  - `docs/content/docs/tools/` → `docs/content/docs/reference/tools/`
  - `docs/content/docs/api/` → `docs/content/docs/reference/api/` (if needed)

### Visual Organization
**Separator categories defined:**
- Quick Start (Zap icon)
- Core Concepts (Brain icon)
- Discovery (Search icon)
- Analysis (BarChart icon)
- Exploration (Compass icon)
- Quality (FileCheck icon)
- Export (Download icon)
- Regional Examples (Map icon)
- Health & Social (Activity icon)
- MCP Tools (Wrench icon)
- API Reference (Globe icon)
- Types (FileText icon)
- AI Tools (Bot icon)
- MCP Ecosystem (ExternalLink icon)

### Icon Selection
All icons from lucide-react library:
- Getting Started: Rocket
- Documentation: BookOpen
- Workflows: Workflow
- Examples: Code2
- Reference: Library
- Integration: Plug
- Advanced Topics: Wrench

### Claude's Discretion
- Exact wording of section descriptions
- Order of items within sections (unless specified by rest operators)
- Additional subsection groupings within Level 3 if needed for clarity
- Whether to use `defaultOpen` on sections beyond getting-started

</decisions>

<specifics>
## Specific Ideas

**Root meta.json structure:**
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

**Example folder group (guides):**
- Contains: guides/, workflows/, examples/ as root folders
- Each appears in top-level navigation but logically grouped
- Visual separator before the group in parent meta.json

**Example rest operators usage:**
- `"..."` in guides for alphabetical remaining items
- `"z...a"` in workflows for reverse chronological
- `"...regional"` to extract all regional examples
- `"!deprecated-guide"` to exclude specific outdated content

**Verification checklist provided:**
- Root meta.json uses separators and external links
- All root folders have `"root": true`
- Folder groups use parentheses
- Icons from lucide-react specified
- Tools moved to `/reference/tools/`
- Build succeeds

</specifics>

<deferred>
## Deferred Ideas

None — prompt provided complete implementation specification within phase scope.

</deferred>

---

*Phase: 02-navigation-restructuring*
*Context gathered: 2026-01-21*
