# Phase 2: Navigation Restructuring - Research

**Researched:** 2026-01-21
**Domain:** Fumadocs navigation, meta.json configuration, information architecture
**Confidence:** HIGH

## Summary

Fumadocs provides advanced meta.json features for sophisticated documentation navigation. The project already uses folder groups `(guides)/` and root folders with proper meta.json configuration. Phase 2 will consolidate 7-8 shallow tabs into 3-4 deep navigation groups using folder groups, separators, and the rest operator.

**Key findings:**
- Fumadocs v16.4.7 (core/ui) and v14.2.6 (mdx) are installed
- Folder groups (parentheses) do NOT change routes/slugs - they only provide visual grouping
- Icon names in meta.json use PascalCase (e.g., "Rocket", "BookOpen")
- Schema paths use relative paths from meta.json location to `.source/json-schema/docs.meta.json`
- The 3-click rule is a myth - focus on clear information scent and wayfinding instead

**Primary recommendation:** Use git mv for all folder restructuring to preserve file history. Verify schema paths are correct relative paths after moving folders. Test navigation depth and information scent rather than counting clicks.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-ui | ^16.4.7 | UI components and layouts | Official Fumadocs UI library with DocsLayout, sidebar tabs |
| fumadocs-core | ^16.4.7 | Core page tree and navigation logic | Handles meta.json parsing, page tree building, folder groups |
| fumadocs-mdx | ^14.2.6 | MDX processing and config | Provides metaSchema for meta.json validation |
| lucide-react | ^0.562.0 | Icon library | Standard icon library, used throughout Fumadocs ecosystem |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js | 16.1.3 | App Router framework | Already integrated, handles file-system routing |
| zod | ^4.3.5 | Schema validation | Extended metaSchema for custom meta.json fields |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs | Nextra, Docusaurus | Fumadocs already integrated, migration would be costly |
| lucide-react | react-icons, heroicons | lucide-react already used, provides semantic names |

**Installation:**
Already installed. No additional packages needed for Phase 2.

## Architecture Patterns

### Recommended Project Structure
```
docs/content/docs/
├── meta.json                    # Root navigation with separators, folder groups
├── getting-started/             # Root folder (ungrouped)
│   └── meta.json               # root: true, icon, title, pages array
├── (guides)/                    # Folder group (visual grouping only)
│   ├── guides/                 # Root folder within group
│   │   └── meta.json          # root: true, pages with separators
│   ├── workflows/              # Root folder within group
│   │   └── meta.json          # root: true, organized pages
│   └── examples/               # Root folder within group
│       └── meta.json          # root: true, simple page list
├── reference/                   # Root folder (will contain tools/, api/)
│   └── meta.json               # root: true, uses extract operator
└── (advanced)/                  # Folder group (visual grouping only)
    ├── integration/            # Root folder within group
    ├── best-practices/         # Root folder within group
    └── advanced/               # Root folder within group
```

### Pattern 1: Root meta.json with Folder Groups
**What:** Top-level meta.json uses separators and folder group references for visual organization
**When to use:** Always for the root `docs/content/docs/meta.json`
**Example:**
```json
{
  "$schema": "..\\..\\..\\.source\\json-schema\\docs.meta.json",
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
    "external:[GitHub Repository](https://github.com/datagvat/datagvat-mcp)"
  ]
}
```
**Source:** Existing implementation in `docs/content/docs/meta.json`

### Pattern 2: Root Folder meta.json
**What:** Folders marked with `"root": true` become sidebar tabs
**When to use:** For all main navigation sections (getting-started, guides, workflows, etc.)
**Example:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "How-To Guides",
  "description": "Step-by-step guides for common tasks",
  "icon": "BookOpen",
  "root": true,
  "defaultOpen": true,
  "pages": [
    "---[Search]Discovery---",
    "searching",
    "data-preview",
    "---[BarChart]Analysis---",
    "quality-metrics",
    "..."
  ]
}
```
**Source:** Fumadocs documentation + existing implementation

### Pattern 3: Folder Groups for Visual Organization
**What:** Folders wrapped in parentheses group related sections without affecting routes
**When to use:** When multiple root folders belong conceptually together
**Example:**
```
(guides)/           # Folder group - no route impact
├── guides/         # Route: /docs/guides/...
├── workflows/      # Route: /docs/workflows/...
└── examples/       # Route: /docs/examples/...
```
**Important:** Parentheses only affect sidebar visual grouping, NOT routes or slugs
**Source:** Fumadocs documentation at https://www.fumadocs.dev/docs/headless/page-conventions

### Pattern 4: Advanced pages Array Features
**What:** meta.json `pages` array supports multiple organizational features
**When to use:** To control page ordering, add separators, include/exclude items
**Available operators:**
- `"page-name"` - Include specific page
- `"---Label---"` - Add separator (visual only)
- `"---[Icon]Label---"` - Separator with icon
- `"..."` - Include remaining pages (alphabetically)
- `"z...a"` - Include remaining pages (reverse alphabetical)
- `"...folder"` - Extract/inline items from another folder
- `"!item"` - Exclude specific item from rest operators
- `"[Text](url)"` - Internal link
- `"external:[Text](url)"` - External link (opens new tab)

**Source:** Fumadocs documentation at https://www.fumadocs.dev/docs/headless/page-conventions

### Pattern 5: Schema Path Resolution
**What:** Schema paths are relative from meta.json location to schema file
**When to use:** Every meta.json file needs correct $schema reference
**Pattern:**
- Root meta.json: `"..\\..\\..\\docs\\.source\\json-schema\\docs.meta.json"`
- First-level folder: `"../.source/json-schema/docs.meta.json"`
- Folder group child: `"../../.source/json-schema/docs.meta.json"`

**Note:** Both forward slashes (`/`) and backslashes (`\\`) work, but backslashes are Windows-style
**Source:** Verified from existing meta.json files in project

### Anti-Patterns to Avoid

- **Don't flatten everything to avoid clicks:** Excessive top-level categories burden scanning. Use folder groups and separators for organization without depth.
- **Don't count clicks as the only metric:** Research shows users don't abandon after 3 clicks. Focus on clear labels ("information scent") instead.
- **Don't forget `pages` excludes unlisted items:** When you add a `pages` array, any page NOT listed is excluded. Use `"..."` to include remaining pages.
- **Don't use kebab-case for icon names:** Fumadocs expects PascalCase (e.g., "BookOpen" not "book-open") in meta.json.
- **Don't assume parentheses change routes:** Folder groups `(name)/` only affect sidebar visual grouping, NOT URL slugs.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon rendering in navigation | Custom icon component | Fumadocs built-in icon handler + lucide-react | Fumadocs automatically maps icon names to components |
| Sidebar state management | useState for open/closed folders | Fumadocs defaultOpen + collapsible in meta.json | Built-in state management with localStorage persistence |
| Page tree building | Custom file-system parser | fumadocs-core source.getPageTree() | Already handles folder groups, root folders, meta.json parsing |
| Navigation breadcrumbs | Custom breadcrumb logic | Fumadocs page tree utilities | findSiblings() and tree structure provide relationships |
| Schema validation | Custom JSON validation | fumadocs-mdx metaSchema with zod extensions | Type-safe validation with autocomplete in IDEs |

**Key insight:** Fumadocs provides a complete navigation system. Don't reimplement features that already exist in the page tree and layout components.

## Common Pitfalls

### Pitfall 1: Missing Pages After Adding `pages` Array
**What goes wrong:** When you add a `pages` array to meta.json, suddenly most pages disappear from navigation.
**Why it happens:** `pages` array is explicit-only. Unlisted items are excluded by default.
**How to avoid:** Always use `"..."` (rest operator) to include remaining pages, or explicitly list all pages.
**Warning signs:** Fewer navigation items than expected, missing recently-added pages.
**Example:**
```json
{
  "pages": [
    "important-page",
    "..." // Include all other pages alphabetically
  ]
}
```

### Pitfall 2: Incorrect Schema Paths After Restructuring
**What goes wrong:** After moving folders, schema validation breaks and VSCode stops providing autocomplete.
**Why it happens:** Schema paths are relative. Moving a meta.json changes the relative path to `.source/json-schema/`.
**How to avoid:** Update `$schema` path when moving meta.json files. Test by opening in VSCode - you should see autocomplete.
**Warning signs:** No autocomplete in meta.json, schema validation errors, unexpected quotation marks.
**Path calculation:**
- From `docs/content/docs/meta.json` → `"..\\..\\..\\docs\\.source\\json-schema\\docs.meta.json"`
- From `docs/content/docs/folder/meta.json` → `"../.source/json-schema/docs.meta.json"`
- From `docs/content/docs/(group)/folder/meta.json` → `"../../.source/json-schema/docs.meta.json"`

### Pitfall 3: Wrong Icon Name Format
**What goes wrong:** Icons don't appear in navigation, console shows errors about missing icon.
**Why it happens:** lucide-react exports use PascalCase (BookOpen), but developers try kebab-case (book-open) from the website.
**How to avoid:** Use PascalCase for all icon names in meta.json. Check existing meta.json files for examples.
**Warning signs:** Missing icons in sidebar, browser console errors about unknown icon names.
**Valid examples:** "Rocket", "BookOpen", "Workflow", "Code", "Library", "Plug", "Award", "Settings"
**Invalid examples:** "book-open", "Code2", "BarChart", "HelpCircle" (these don't exist in lucide-react)

### Pitfall 4: Assuming Parentheses Change Routes
**What goes wrong:** After creating `(guides)/workflows/`, expecting route to be `/docs/guides/workflows/` but it's `/docs/workflows/`.
**Why it happens:** Folder groups (parentheses) only affect sidebar visual organization, NOT file-system routing.
**How to avoid:** Understand folder groups are UI-only. If you need route changes, rename folders without parentheses.
**Warning signs:** 404 errors, links pointing to wrong URLs, breadcrumb confusion.
**Example:** `(guides)/workflows/page.mdx` → URL is `/docs/workflows/page`, NOT `/docs/guides/workflows/page`

### Pitfall 5: Git History Loss When Restructuring
**What goes wrong:** After moving files with `mv` or copy-paste, git blame shows all lines as new, losing history.
**Why it happens:** Git tracks renames only if you use `git mv` command.
**How to avoid:** Always use `git mv old/path new/path` for all file and folder moves.
**Warning signs:** All files show as "new" in git diff, unable to trace historical changes, blame shows wrong authors.
**Example:**
```bash
# Wrong
mv docs/content/docs/tools docs/content/docs/reference/tools

# Right
git mv docs/content/docs/tools docs/content/docs/reference/tools
```

### Pitfall 6: Over-optimizing for 3-Click Rule
**What goes wrong:** Navigation becomes too flat with too many top-level items, harder to scan.
**Why it happens:** Misunderstanding the "3-click rule" as a hard requirement.
**How to avoid:** Focus on clear labels and information scent. Users handle 4+ clicks fine if each step is obvious.
**Warning signs:** More than 7 top-level navigation items, difficulty finding related content, no logical grouping.
**Research:** Nielsen Norman Group research shows "user dropoff does not increase when the task involves more than 3 clicks, nor does satisfaction decrease."
**Source:** https://www.nngroup.com/articles/3-click-rule/

## Code Examples

Verified patterns from official sources and existing implementation:

### Root meta.json with All Features
```json
{
  "$schema": "..\\..\\..\\docs\\.source\\json-schema\\docs.meta.json",
  "pages": [
    "getting-started",
    "---[BookOpen]Documentation---",
    "(guides)",
    "---[Code]Reference---",
    "reference",
    "---[Settings]Advanced Topics---",
    "(advanced)",
    "---[ExternalLink]Resources---",
    "external:[Official API Docs](https://www.data.gv.at/katalog/api/3/)",
    "external:[GitHub Repository](https://github.com/datagvat/datagvat-mcp)"
  ]
}
```
**Source:** Current implementation in `docs/content/docs/meta.json`

### Root Folder meta.json with Separators
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Workflows",
  "description": "Complete end-to-end workflows",
  "icon": "Workflow",
  "root": true,
  "pages": [
    "---[Compass]Exploration---",
    "discovery",
    "semantic-exploration",
    "---[FileCheck]Quality---",
    "quality-assessment",
    "---[GitCompare]Comparison---",
    "comparative-analysis",
    "publication-research",
    "---[Download]Export---",
    "data-export"
  ]
}
```
**Source:** Existing `docs/content/docs/(guides)/workflows/meta.json`

### Using Extract Operator
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Reference",
  "description": "Complete API and tools reference",
  "icon": "Library",
  "root": true,
  "pages": [
    "---[Wrench]Tools---",
    "...tools",
    "---[Code]API---",
    "...api"
  ]
}
```
**Purpose:** Pull in items from `tools/` and `api/` folders inline without extra hierarchy

### Using Rest with Exclusions
```json
{
  "pages": [
    "overview",
    "---[Zap]Quick Start---",
    "quickstart",
    "installation",
    "...",
    "!deprecated-page"
  ]
}
```
**Purpose:** Include all remaining pages except deprecated-page

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat folder structure with 8 root tabs | Folder groups with nested root folders | Already implemented | Better organization, maintains shallow click depth |
| Manual icon imports | String-based icon names in meta.json | Fumadocs v15+ | Simpler configuration, automatic icon resolution |
| Pages sorted manually | Rest operator `"..."` with alphabetical sort | Available since early Fumadocs | Less maintenance, automatic inclusion of new pages |
| Separate navigation config files | meta.json co-located with content | Standard in Fumadocs | Easier to maintain, locality of behavior |

**Deprecated/outdated:**
- **Separate sidebar config:** Early versions of docs frameworks used separate sidebar.js files. Fumadocs uses co-located meta.json.
- **Manual page trees:** Don't build page trees manually. Use `source.getPageTree()` from fumadocs-core.
- **Icon components in meta.json:** Don't try to import React components in meta.json. Use string names only.

## Open Questions

Things that couldn't be fully resolved:

1. **Icon name discrepancy in existing code**
   - What we know: Current code uses "Code2", "BarChart", "HelpCircle" in context decisions
   - What's unclear: These names don't exist in lucide-react (should be "Code", "ChartBar", "CircleHelp")
   - Recommendation: Use verified icon names from lucide.dev. Test in UI to confirm rendering.

2. **Schema path consistency (forward vs backslashes)**
   - What we know: Both `/` and `\\` work in schema paths. Current project has mixed usage.
   - What's unclear: Is there a preference for Windows development environments?
   - Recommendation: Use forward slashes `/` for cross-platform consistency. Update all to match.

3. **Navigation depth best practices**
   - What we know: 3-click rule is debunked. Information scent matters more.
   - What's unclear: What's the ideal depth for this specific documentation (2, 3, or 4 levels)?
   - Recommendation: Test with users. Start with 3 levels max, measure if users find content easily.

## Sources

### Primary (HIGH confidence)
- Fumadocs documentation at https://www.fumadocs.dev/docs/headless/page-conventions - meta.json features, folder groups, root folders
- Fumadocs documentation at https://www.fumadocs.dev/docs/ui/layouts/docs - sidebar tabs, page tree, DocsLayout
- lucide.dev at https://lucide.dev - icon names and conventions
- Existing implementation in `docs/content/docs/` - verified patterns and schema paths
- package.json - Fumadocs versions (v16.4.7 core/ui, v14.2.6 mdx)

### Secondary (MEDIUM confidence)
- Nielsen Norman Group at https://www.nngroup.com/articles/3-click-rule/ - 3-click rule research, information architecture

### Tertiary (LOW confidence)
- None - all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json and official Fumadocs docs
- Architecture: HIGH - verified from existing implementation and official docs
- Pitfalls: HIGH - derived from official docs warnings and existing code patterns
- Icon names: MEDIUM - lucide.dev confirmed most names, but context decisions use non-existent names

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (60 days) - Fumadocs is mature, breaking changes unlikely
