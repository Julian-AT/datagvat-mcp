# Phase 2: Navigation Restructuring - Research

**Researched:** 2026-01-21
**Domain:** Fumadocs documentation framework - navigation organization and meta.json configuration
**Confidence:** MEDIUM

## Summary

This research covers implementing advanced Fumadocs meta.json features to restructure documentation navigation from 7 root-level sections to 3-4 well-organized groups. The investigation focused on Fumadocs' file-based routing, meta.json syntax capabilities, and best practices for information architecture in technical documentation.

Fumadocs provides a rich meta.json configuration system for organizing documentation. The framework uses a loader-based approach where the page tree is generated from folder structure and controlled via meta.json files placed in each directory. Icons are resolved automatically through the lucideIconsPlugin when specified by string name.

The project already has Fumadocs Core v16.4.7 installed with lucideIconsPlugin configured in the source loader. The existing structure has 8 root-level folders (getting-started, guides, workflows, tools, examples, advanced, integration, best-practices, tutorials) with flat hierarchy, all marked as `root: true`.

**Primary recommendation:** Use folder groups with parentheses syntax `(group-name)` to logically organize related sections without adding navigation depth, combine with separator syntax `---Label---` for visual breaks, and leverage the rest operator `...` for automatic alphabetical inclusion of remaining items.

## Standard Stack

The established libraries/tools for Fumadocs documentation navigation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-core | 16.4.7 | Documentation framework core | Official Fumadocs headless library for page tree generation |
| fumadocs-ui | 16.4.7 | UI components and layouts | Official Fumadocs theme with DocsLayout component |
| fumadocs-mdx | 14.2.6 | MDX processing and file system loader | Generates page tree from file structure and meta.json |
| lucide-react | 0.562.0 | Icon library | Integrated via lucideIconsPlugin for meta.json icon strings |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next | 16.1.3 | React framework | Required for Fumadocs routing (already in use) |
| fumadocs-core/source/lucide-icons | 16.4.7 | Icon plugin | Automatically resolves icon strings in meta.json to React components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs meta.json | Manual page tree construction | Meta.json is declarative, type-safe via JSON schema, and integrates with Fumadocs conventions |
| Folder groups `(name)` | Additional folder nesting | Folder groups avoid URL changes while providing logical grouping in navigation |
| lucide-react icons | Custom icon components | Lucide provides 1000+ consistent icons; string-based references in meta.json are simpler than importing components |

**Installation:**
All dependencies already installed. No additional packages required.

## Architecture Patterns

### Recommended Project Structure
```
docs/content/docs/
├── meta.json                    # Root navigation with separators and folder groups
├── getting-started/             # Root folder - Level 1
│   ├── meta.json               # root: true, icon, title, description
│   ├── index.mdx
│   └── *.mdx
├── (guides)/                    # Folder group - logical grouping only
│   ├── guides/                 # Root folder - appears as sibling in nav
│   │   ├── meta.json          # root: true
│   │   └── *.mdx
│   ├── workflows/              # Root folder - appears as sibling in nav
│   │   ├── meta.json          # root: true
│   │   └── *.mdx
│   └── examples/               # Root folder - appears as sibling in nav
│       ├── meta.json          # root: true
│       └── *.mdx
├── reference/                   # Root folder - Level 1
│   ├── meta.json               # root: true
│   ├── tools/                  # Subfolder - Level 2
│   │   ├── meta.json
│   │   └── *.mdx
│   └── api/                    # Subfolder - Level 2 (if needed)
│       └── *.mdx
└── (advanced)/                  # Folder group
    ├── integration/
    ├── best-practices/
    └── advanced/
```

### Pattern 1: Root meta.json with Separators and Folder Groups
**What:** The top-level meta.json orchestrates navigation structure using separators for visual breaks and folder references for content sections.
**When to use:** Always for root-level navigation organization.
**Example:**
```json
{
  "$schema": ".source/json-schema/docs.meta.json",
  "pages": [
    "getting-started",
    "---Documentation---",
    "(guides)",
    "---Reference---",
    "reference",
    "---Advanced Topics---",
    "(advanced)"
  ]
}
```
**Source:** Verified in Fumadocs official documentation repository (fuma-nama/fumadocs)

### Pattern 2: Folder Groups with Parentheses
**What:** Directories named with parentheses syntax `(group-name)` contain multiple root folders that appear as siblings in navigation without the group folder appearing in URLs or nav hierarchy.
**When to use:** When you want to logically organize related sections in the file system without adding navigation depth.
**Example:**
```
(guides)/          # Not in navigation, not in URLs
  guides/          # Appears in top-level navigation
  workflows/       # Appears in top-level navigation
  examples/        # Appears in top-level navigation
```
**Source:** https://github.com/fuma-nama/fumadocs/tree/main/apps/docs/content/docs shows `(framework)` folder group

### Pattern 3: Root Folder meta.json Configuration
**What:** Folders marked with `"root": true` appear in top-level navigation tabs/sidebar.
**When to use:** For all main documentation sections that should be independently accessible.
**Example:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Fumadocs Core",
  "description": "The headless library",
  "icon": "Cuboid",
  "root": true,
  "pages": [
    "---Guide---",
    "index",
    "search",
    "---API References---",
    "page-tree",
    "..."
  ]
}
```
**Source:** https://raw.githubusercontent.com/fuma-nama/fumadocs/main/apps/docs/content/docs/headless/meta.json

### Pattern 4: Separator Syntax for Visual Breaks
**What:** Strings matching `---Label---` in the pages array create visual section breaks in navigation.
**When to use:** To group related items visually within a folder's navigation.
**Example:**
```json
{
  "pages": [
    "---Introduction---",
    "index",
    "getting-started",
    "---API Reference---",
    "tools",
    "types"
  ]
}
```
**Source:** Verified in Fumadocs headless/meta.json

### Pattern 5: Rest Operator for Automatic Inclusion
**What:** The `...` operator in pages array includes all remaining items in the folder alphabetically.
**When to use:** When you want to specify order for key pages but include all others automatically.
**Example:**
```json
{
  "pages": [
    "index",
    "important-page",
    "..."
  ]
}
```
**Source:** https://raw.githubusercontent.com/fuma-nama/fumadocs/main/apps/docs/content/docs/ui/meta.json

### Pattern 6: Icon String References
**What:** Icons specified as strings in meta.json are resolved by lucideIconsPlugin to React components from lucide-react.
**When to use:** Always for folder and root-level icons.
**Example:**
```json
{
  "icon": "Rocket",
  "root": true
}
```
The plugin resolves "Rocket" to `<Rocket />` component from lucide-react.
**Source:** Project source.tsx shows lucideIconsPlugin() in loader plugins array

### Anti-Patterns to Avoid
- **Deeply nested folder structures:** Fumadocs defaults to URL structure matching file paths. Deep nesting creates long URLs and poor UX. Use folder groups instead.
- **Inconsistent root property:** Mixing folders with and without `root: true` at the same level creates confusing navigation hierarchy.
- **Missing descriptions:** The `description` property provides context in navigation hovers and should be included for all root folders.
- **Icon-less root folders:** Root folders without icons look inconsistent in tabbed navigation UI.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation state management | Custom React context for sidebar open/closed state | DocsLayout component from fumadocs-ui | Handles responsive behavior, keyboard navigation, focus management |
| Icon component imports | Import individual icon components and map in code | lucideIconsPlugin with string references | Plugin resolves strings automatically, no import management needed |
| Page tree generation | Custom folder scanning and tree building | fumadocs-mdx loader with meta.json | Handles i18n, caching, incremental builds, and meta.json parsing |
| Separator rendering | Custom sidebar components with dividers | Built-in separator support via `---Label---` syntax | Integrated with theme styling and collapsible behavior |
| URL generation from file paths | Custom slug builders | Fumadocs' automatic slug generation from file paths | Handles special characters, i18n paths, index.mdx conventions |

**Key insight:** Fumadocs is a comprehensive framework. Attempting to customize low-level navigation behavior often breaks theme integration, accessibility features, or i18n support that are built into the standard components.

## Common Pitfalls

### Pitfall 1: Breaking Internal Links During File Migration
**What goes wrong:** Moving files with `git mv` changes URLs but doesn't update internal links in MDX files. Links like `[Guide](/guides/searching)` break when files move to new paths.
**Why it happens:** Next.js routing is file-path-based. Moving `guides/searching.mdx` to `reference/guides/searching.mdx` changes the URL from `/docs/guides/searching` to `/docs/reference/guides/searching`.
**How to avoid:**
1. Create migration map document listing all path changes before moving files
2. Use grep to find all internal links referencing moved files: `grep -r "\[.*\](.*old-path.*)" docs/content/docs`
3. Update links systematically before testing build
4. Use `next-validate-link` (already configured in project) to catch broken links in pre-build
**Warning signs:** Build succeeds but navigation shows broken links, 404 errors when clicking nav items

### Pitfall 2: Folder Groups Without Contained Root Folders
**What goes wrong:** Creating `(guides)/` folder group but forgetting to mark contained folders with `"root": true` causes them to be nested under parent navigation instead of appearing as siblings.
**Why it happens:** Folder groups are a file system convenience. The navigation structure still comes from meta.json root properties. Without `root: true`, folders are treated as subfolders of their parent.
**How to avoid:**
1. Every folder inside a folder group MUST have meta.json with `"root": true`
2. Test navigation structure immediately after creating folder groups
3. Verify in browser that folders appear at expected hierarchy level
**Warning signs:** Folders appear nested in navigation instead of as top-level tabs

### Pitfall 3: Icon Name Typos or Non-existent Icons
**What goes wrong:** Using icon string "Code2" (doesn't exist in lucide-react) causes runtime error or missing icon in navigation.
**Why it happens:** lucideIconsPlugin resolves strings to component names. Typos or non-existent icon names fail silently or throw errors.
**How to avoid:**
1. Verify all icon names against lucide.dev before using
2. Use exact PascalCase names from Lucide library
3. Test navigation rendering after adding icons
4. Note: "Code2" doesn't exist - use "Code" instead
**Warning signs:** Missing icons in sidebar, console warnings about unresolved components, or build errors

### Pitfall 4: Separator Syntax Variations
**What goes wrong:** Using incorrect separator syntax like `"--- Label ---"` (spaces), `"[Icon]Label"` (missing dashes), or `"---Label"` (missing closing dashes) causes separators to be treated as page references.
**Why it happens:** The parser looks for exact pattern `---Text---`. Variations are interpreted as file/folder names.
**How to avoid:**
1. Always use exact syntax: `---Label---` with no spaces around dashes
2. For icon separators (if supported), pattern would be `---[Icon]Label---`
3. Verify separator rendering in browser after adding
**Warning signs:** 404 errors for separator "pages", separators appearing as links instead of dividers

### Pitfall 5: Missing Schema Reference After Migration
**What goes wrong:** Moving files changes relative paths, breaking `"$schema": "../.source/json-schema/docs.meta.json"` references in meta.json files.
**Why it happens:** Schema path is relative to meta.json location. Moving meta.json changes path depth.
**How to avoid:**
1. After moving folders, update $schema path to maintain correct relative reference
2. Count `..` levels: each parent directory up requires one `..`
3. Verify schema validation still works in IDE
**Warning signs:** Loss of autocomplete in meta.json files, schema validation errors

## Code Examples

Verified patterns from official sources:

### Root meta.json with Comprehensive Structure
```json
{
  "$schema": ".source/json-schema/docs.meta.json",
  "pages": [
    "getting-started",
    "---Documentation---",
    "(guides)",
    "---Reference---",
    "reference",
    "---Advanced Topics---",
    "(advanced)"
  ]
}
```
**Source:** Adapted from project requirements and Fumadocs patterns

### Root Folder meta.json (Complete)
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Getting Started",
  "description": "Quick start guide and installation instructions",
  "icon": "Rocket",
  "root": true,
  "defaultOpen": true,
  "pages": [
    "index",
    "installation",
    "quickstart",
    "first-query",
    "quick-reference",
    "troubleshooting"
  ]
}
```
**Source:** Existing project file docs/content/docs/getting-started/meta.json

### Using Rest Operator
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Guides",
  "description": "Task-oriented guides for common workflows",
  "icon": "BookOpen",
  "root": true,
  "pages": [
    "---Essential Guides---",
    "searching",
    "data-preview",
    "---Additional Topics---",
    "..."
  ]
}
```
**Source:** Fumadocs UI meta.json pattern applied to project structure

### Git Migration Preserving History
```bash
# Create target directory if needed
mkdir -p docs/content/docs/reference

# Move files preserving git history
git mv docs/content/docs/tools docs/content/docs/reference/tools

# Update meta.json schema path (if needed)
# From: "$schema": "../.source/json-schema/docs.meta.json"
# To:   "$schema": "../../.source/json-schema/docs.meta.json"

# Stage changes
git add docs/content/docs/reference/tools/meta.json
```
**Source:** Git best practices for preserving file history

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat root sections | Folder groups with `(name)` syntax | Fumadocs v13+ | Enables logical grouping without URL changes or nav depth |
| Icon component imports | String-based icon resolution via plugin | fumadocs-core v14+ | Simplifies meta.json, no import management |
| Manual page ordering | Rest operator `...` for auto-inclusion | fumadocs-mdx v10+ | Reduces maintenance, auto-includes new pages |
| Static separators in code | Declarative separators in meta.json | fumadocs-core v12+ | Navigation structure is data-driven, not code-driven |

**Deprecated/outdated:**
- **pages: ["*"]** glob syntax - Replaced by `...` rest operator for clarity
- **Icon prop as ReactElement in meta.json** - String-based resolution via lucideIconsPlugin is now standard

## Open Questions

Things that couldn't be fully resolved:

1. **External Link Syntax in meta.json**
   - What we know: CONTEXT.md mentions `external:[Text](url)` syntax for external links in pages array
   - What's unclear: This syntax is not documented in official Fumadocs sources found during research; may be custom implementation or proposed feature
   - Recommendation: Verify syntax exists in current fumadocs-mdx version by testing in development, or implement as page tree transformation in source loader if needed

2. **Extract Operator (`...folder`) Syntax**
   - What we know: CONTEXT.md mentions `...folder` to pull items from subfolder into parent navigation
   - What's unclear: Not found in official Fumadocs documentation or examples
   - Recommendation: Test in development; if unsupported, achieve similar effect using explicit page references or custom loader plugin

3. **Reversed Rest (`z...a`) Syntax**
   - What we know: CONTEXT.md mentions reverse alphabetical ordering for workflows
   - What's unclear: Not documented in Fumadocs; may require custom implementation
   - Recommendation: Use explicit page ordering in meta.json pages array instead, or implement custom sort in loader transformation

4. **Exclude Operator (`!item`) Syntax**
   - What we know: CONTEXT.md mentions `!item` to exclude specific items
   - What's unclear: Not found in official Fumadocs meta.json parser documentation
   - Recommendation: Omit items from pages array instead of using exclusion; simpler and definitely supported

5. **Icon Separators Syntax (`---[Icon]Label---`)**
   - What we know: CONTEXT.md specifies icon separators like `---[BookOpen]Documentation---`
   - What's unclear: Basic separators `---Label---` are confirmed, but icon syntax within separators not verified
   - Recommendation: Test icon separator syntax in development; if unsupported, use plain separators and rely on folder icons for visual cues

## Sources

### Primary (HIGH confidence)
- Fumadocs official repository structure: https://github.com/fuma-nama/fumadocs/tree/main/apps/docs/content/docs
- Fumadocs headless meta.json: https://raw.githubusercontent.com/fuma-nama/fumadocs/main/apps/docs/content/docs/headless/meta.json
- Fumadocs UI meta.json: https://raw.githubusercontent.com/fuma-nama/fumadocs/main/apps/docs/content/docs/ui/meta.json
- Project source code: docs/lib/source.tsx (lucideIconsPlugin configuration)
- Project existing meta.json files: docs/content/docs/*/meta.json

### Secondary (MEDIUM confidence)
- Fumadocs page tree documentation: https://www.fumadocs.dev/docs/headless/page-tree (separator, icon, root properties verified)
- Fumadocs documentation structure: https://www.fumadocs.dev/docs (navigation patterns observed)
- Lucide icons verification: https://lucide.dev/icons (all specified icons except Code2 confirmed)

### Tertiary (LOW confidence - requiring validation)
- CONTEXT.md advanced syntax (external:, ...folder, z...a, !item, ---[Icon]---) - Not found in official Fumadocs documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in package.json, versions confirmed
- Architecture: HIGH - Folder groups, root property, and separator syntax verified in Fumadocs source
- Pitfalls: MEDIUM - Based on Fumadocs behavior and Next.js routing principles, not all experienced firsthand
- Advanced meta.json syntax: LOW - Several features from CONTEXT.md not verified in official sources

**Research date:** 2026-01-21
**Valid until:** Approximately 30 days (Fumadocs stable API, but rapid development)

**Notes on advanced syntax:**
The CONTEXT.md file specifies several meta.json features (external links, extract operator, reversed rest, exclude operator, icon separators) that could not be verified in official Fumadocs documentation or source code during research. These may be:
- Custom implementations in the project
- Proposed features for this phase
- Features from newer Fumadocs versions not yet documented
- Misunderstandings in requirements gathering

Recommendation: Test all advanced syntax features in development environment before finalizing implementation plan. If unsupported, either implement as custom loader transformations or use standard Fumadocs features to achieve similar goals.
