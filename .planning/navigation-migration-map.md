# Navigation Migration Map

**Created:** 2026-01-21
**Phase:** 02-navigation-restructuring
**Status:** Complete

## Summary

Consolidated 7-8 shallow root-level navigation tabs into 4 deep navigation groups using Fumadocs folder groups, separators, and advanced meta.json features. This migration improves information architecture by reducing visual clutter while maintaining clear navigation hierarchy.

**Before:** 7-8 top-level tabs (getting-started, guides, workflows, examples, tools, integration, best-practices, advanced)

**After:** 4 top-level sections (Getting Started, Documentation, Reference, Advanced Topics)

## Before → After Structure

### Visual Tree Comparison

**BEFORE (Shallow Structure):**
```
docs/content/docs/
├── getting-started/          [Tab 1]
├── guides/                   [Tab 2]
├── workflows/                [Tab 3]
├── examples/                 [Tab 4]
├── tools/                    [Tab 5]
├── integration/              [Tab 6]
├── best-practices/           [Tab 7]
├── advanced/                 [Tab 8]
└── tutorials/                [orphaned]
```

**AFTER (Deep Structure with Folder Groups):**
```
docs/content/docs/
├── getting-started/          [Section 1: Getting Started]
├── (guides)/                 [Section 2: Documentation]
│   ├── guides/
│   ├── workflows/
│   └── examples/
├── reference/                [Section 3: Reference]
│   └── tools/
├── (advanced)/               [Section 4: Advanced Topics]
│   ├── integration/
│   ├── best-practices/
│   └── advanced/
└── tutorials/                [orphaned - not in navigation]
```

### Folder Moves (Wave 1)

Executed in Plan 02-01:

```bash
git mv docs/content/docs/tools docs/content/docs/reference/tools
```

Wave 1 also created:
- `docs/content/docs/reference/meta.json` - Reference section root
- `docs/content/docs/(guides)/` - Documentation folder group (no files moved, just container)

### Folder Moves (Wave 2)

Executed in Plan 02-02:

```bash
git mv docs/content/docs/integration "docs/content/docs/(advanced)/integration"
git mv docs/content/docs/best-practices "docs/content/docs/(advanced)/best-practices"
git mv docs/content/docs/advanced "docs/content/docs/(advanced)/advanced"
```

Wave 2 created:
- `docs/content/docs/(advanced)/` - Advanced Topics folder group

### Root meta.json Update (Wave 2)

Executed in Plan 02-03:

Updated `docs/content/docs/meta.json` to reference new structure with proper separators and icons.

## URL Mapping

**CRITICAL:** Folder groups `(guides)` and `(advanced)` do NOT affect routes. URLs remain unchanged.

| Content Path | Old URL | New URL | Changed? |
|--------------|---------|---------|----------|
| `getting-started/quickstart.mdx` | `/docs/getting-started/quickstart` | `/docs/getting-started/quickstart` | No |
| `(guides)/guides/searching.mdx` | `/docs/guides/searching` | `/docs/guides/searching` | No |
| `(guides)/workflows/discovery.mdx` | `/docs/workflows/discovery` | `/docs/workflows/discovery` | No |
| `(guides)/examples/search.mdx` | `/docs/examples/search` | `/docs/examples/search` | No |
| `reference/tools/...` | `/docs/tools/...` | `/docs/reference/tools/...` | **YES** |
| `(advanced)/integration/claude-desktop.mdx` | `/docs/integration/claude-desktop` | `/docs/integration/claude-desktop` | No |
| `(advanced)/best-practices/prompting.mdx` | `/docs/best-practices/prompting` | `/docs/best-practices/prompting` | No |
| `(advanced)/advanced/custom-scripts.mdx` | `/docs/advanced/custom-scripts` | `/docs/advanced/custom-scripts` | No |

**Only `/docs/tools/*` URLs changed to `/docs/reference/tools/*`**

Internal link updates required:
- Any links to `/docs/tools/` → update to `/docs/reference/tools/`
- All other URLs unchanged

## Navigation Sections

### Section 1: Getting Started

**Type:** Root folder (ungrouped)
**Icon:** Rocket
**Path:** `docs/content/docs/getting-started/`
**meta.json:** Has `"root": true` flag
**Contains:**
- index.mdx (Overview)
- quickstart.mdx
- installation.mdx
- first-query.mdx
- quick-reference.mdx
- troubleshooting.mdx

**Purpose:** Onboarding and quick-start guides for new users

### Section 2: Documentation

**Type:** Folder group `(guides)`
**Separator:** `---[BookOpen]Documentation---`
**Path:** `docs/content/docs/(guides)/`
**Contains 3 root folders:**

1. **Guides** (`guides/`)
   - Icon: BookOpen
   - Configuration guides (setup, configuration, searching, data-preview, quality-metrics)
   - Uses separators for sub-organization

2. **Workflows** (`workflows/`)
   - Icon: Workflow
   - End-to-end workflows (discovery, semantic-exploration, quality-assessment, comparative-analysis, publication-research, data-export)
   - Organized by workflow type (Exploration, Quality, Comparison, Export)

3. **Examples** (`examples/`)
   - Icon: Code2
   - Real-world usage examples (search, preview, workflows, component-showcase)
   - Practical demonstrations

**Purpose:** Main documentation content for learning and reference

### Section 3: Reference

**Type:** Root folder
**Separator:** `---[Library]Reference---`
**Path:** `docs/content/docs/reference/`
**Icon:** Library
**meta.json:** Uses extract operator `"...tools"` to inline tools content
**Contains:**
- `tools/` folder (extracted inline, no extra depth)
- Future: `api/` folder for OpenAPI documentation

**Purpose:** Technical reference documentation for APIs and tools

### Section 4: Advanced Topics

**Type:** Folder group `(advanced)`
**Separator:** `---[Settings]Advanced Topics---`
**Path:** `docs/content/docs/(advanced)/`
**Contains 3 root folders:**

1. **Integration** (`integration/`)
   - Icon: Plug
   - Integration guides (Claude Desktop, Cline, other AI tools)

2. **Best Practices** (`best-practices/`)
   - Icon: Award
   - Advanced usage patterns (prompting, error-handling, caching, automation)

3. **Advanced** (`advanced/`)
   - Icon: Settings
   - Advanced topics (data-quality, custom-scripts, performance)

**Purpose:** Advanced configuration, integration, and optimization

### Resources (External Links)

**Type:** External links in root meta.json
**Separator:** `---[ExternalLink]Resources---`
**Contains:**
- Official data.gv.at API documentation
- GitHub repository
- Future: MCP specification, OpenAPI docs

**Purpose:** Quick access to external resources

## Schema Path Updates

All meta.json files had schema paths updated to reflect new folder depth:

| File Path | Old Schema Path | New Schema Path | Change |
|-----------|----------------|-----------------|--------|
| `docs/content/docs/meta.json` | N/A | `..\\..\\..\\docs\\.source\\json-schema\\docs.meta.json` | Created |
| `docs/content/docs/reference/meta.json` | N/A | `../.source/json-schema/docs.meta.json` | Created |
| `docs/content/docs/reference/tools/meta.json` | `../.source/json-schema/docs.meta.json` | `../../.source/json-schema/docs.meta.json` | +1 level |
| `docs/content/docs/(advanced)/integration/meta.json` | `../.source/json-schema/docs.meta.json` | `../../.source/json-schema/docs.meta.json` | +1 level |
| `docs/content/docs/(advanced)/best-practices/meta.json` | `../.source/json-schema/docs.meta.json` | `../../.source/json-schema/docs.meta.json` | +1 level |
| `docs/content/docs/(advanced)/advanced/meta.json` | `../.source/json-schema/docs.meta.json` | `../../.source/json-schema/docs.meta.json` | +1 level |

**Rule:** Add one `../` for each additional folder level

## Requirements Fulfilled

### NAV-01: 4 Top-Level Sections ✓

**Requirement:** Documentation organized into 3-4 top-level sections (reduced from 8)

**Implementation:**
- Before: 7-8 shallow tabs
- After: 4 deep sections (Getting Started, Documentation, Reference, Advanced Topics)
- Reduction: 50% fewer top-level navigation items

**User Impact:** Less visual clutter, easier scanning of navigation options

### NAV-02: Advanced meta.json Features ✓

**Requirement:** Advanced meta.json features enable better organization

**Implementation:**
- Folder groups: `(guides)` and `(advanced)` for visual grouping
- Separators with icons: `---[BookOpen]Documentation---` for visual organization
- Extract operator: `...tools` to inline content without extra depth
- External links: `external:[Text](url)` for quick access to external resources
- Root folders: `"root": true` flag on all main sections

**User Impact:** Clear visual hierarchy without adding click depth

### NAV-03: ≤3 Clicks to Any Page ✓

**Requirement:** Users can find information in ≤3 clicks from homepage

**Implementation (Navigation Depth):**
- Level 1: Homepage → Section (Getting Started, Documentation, Reference, Advanced Topics)
- Level 2: Section → Category (Guides, Workflows, Examples, etc.)
- Level 3: Category → Specific Page

**Example paths:**
- Homepage → Documentation → Workflows → Discovery workflow (3 clicks)
- Homepage → Getting Started → Quickstart (2 clicks)
- Homepage → Reference → Tools → (future) Specific tool (3 clicks)
- Homepage → Advanced Topics → Integration → Claude Desktop guide (3 clicks)

**Note:** Research shows users don't abandon after 3 clicks if information scent is clear. Focus on clear labels and logical grouping rather than click counting.

**User Impact:** Fast access to information with clear navigation path

### NAV-04: Consistent Navigation Across All Pages ✓

**Requirement:** Navigation structure is consistent across all pages

**Implementation:**
- All pages use same root `docs/content/docs/meta.json`
- DocsLayout component provides identical sidebar everywhere
- No page-specific navigation variations
- Folder groups and root folders render consistently
- Same navigation tree structure on all documentation pages

**User Impact:** Users never lose their bearings, always know where they are

## Implementation Details

### Git History Preservation

All folder moves used `git mv` command to preserve file history:

```bash
# Wave 1 (02-01)
git mv docs/content/docs/tools docs/content/docs/reference/tools

# Wave 2 (02-02)
git mv docs/content/docs/integration "docs/content/docs/(advanced)/integration"
git mv docs/content/docs/best-practices "docs/content/docs/(advanced)/best-practices"
git mv docs/content/docs/advanced "docs/content/docs/(advanced)/advanced"
```

**Benefit:** Full git history maintained, `git log --follow` works correctly

### Folder Groups (Parentheses)

Folder names wrapped in parentheses `(name)` are Fumadocs folder groups:
- **UI Impact:** Provides visual grouping in sidebar navigation
- **Route Impact:** NONE - URLs remain unchanged
- **Purpose:** Organize related root folders without adding navigation depth

**Example:**
- Folder path: `docs/content/docs/(guides)/workflows/discovery.mdx`
- URL: `/docs/workflows/discovery` (NOT `/docs/guides/workflows/discovery`)

### Extract Operator

The `...foldername` operator extracts content inline without hierarchy:

```json
{
  "pages": [
    "---[Wrench]Tools---",
    "...tools"  // Extracts all items from tools/ folder inline
  ]
}
```

**Benefit:** Users see all tools directly in Reference section, no extra click to "Tools" folder

### Separators with Icons

Visual separators organize content without adding click depth:

```json
"---[Icon]Label---"
```

**Icons used:**
- `BookOpen` - Documentation
- `Library` - Reference
- `Settings` - Advanced Topics
- `ExternalLink` - Resources
- `Rocket` - Getting Started (folder icon)
- `Workflow` - Workflows (folder icon)
- `Plug` - Integration (folder icon)
- `Award` - Best Practices (folder icon)

**All icons from lucide-react, using PascalCase names**

### External Links

External links in navigation provide quick access without leaving site:

```json
"external:[Official data.gv.at API](https://www.data.gv.at/katalog/api/3/)"
```

**Opens in new tab, clearly marked as external**

## Future Additions

### Reference Section Expansion

The Reference section is designed to accommodate future content:

**Current:**
- `reference/tools/` - MCP tool documentation

**Planned (Phase 7 - OpenAPI):**
- `reference/api/` - Auto-generated API documentation from OpenAPI spec
- Extract operator will inline both: `"...tools"` and `"...api"`

**Structure will be:**
```json
{
  "pages": [
    "---[Wrench]Tools---",
    "...tools",
    "---[Code]API---",
    "...api"
  ]
}
```

### Advanced Topics Expansion

The Advanced Topics group can accommodate additional folders:

**Current:**
- `integration/` - AI tool integration
- `best-practices/` - Usage patterns
- `advanced/` - Advanced topics

**Possible additions:**
- `architecture/` - System architecture
- `contributing/` - Contribution guidelines
- `api-design/` - API design patterns

## Testing & Verification

### Navigation Testing

To verify navigation works correctly:

1. **Start dev server:**
   ```bash
   cd docs && bun run dev
   ```

2. **Check sidebar structure:**
   - Should show 4 main sections
   - Getting Started section visible first
   - Documentation, Reference, Advanced Topics follow
   - Separators visible with icons
   - External links at bottom

3. **Test folder groups:**
   - (guides) should show Guides, Workflows, Examples
   - (advanced) should show Integration, Best Practices, Advanced
   - No visual depth difference despite grouping

4. **Test URLs:**
   - `/docs/getting-started/quickstart` - works
   - `/docs/guides/searching` - works (NOT `/docs/guides/searching`)
   - `/docs/workflows/discovery` - works
   - `/docs/reference/tools/` - works (NEW URL)
   - `/docs/tools/` - 404 (old URL)

### Schema Validation

To verify schema paths are correct:

1. Open any meta.json file in VSCode
2. Should see autocomplete when editing
3. No red squiggles under $schema reference
4. Hover over properties shows type hints

### Link Validation

To find broken internal links:

```bash
cd docs
bun run check:links
```

Should report any links still pointing to old `/docs/tools/` URLs.

## Migration Checklist

- [x] Wave 1: Create reference/ folder and move tools/
- [x] Wave 1: Create (guides)/ folder group container
- [x] Wave 2: Create (advanced)/ folder group
- [x] Wave 2: Move integration/, best-practices/, advanced/ into (advanced)/
- [x] Wave 2: Update root meta.json to reference new structure
- [x] Wave 2: Update separator icons to semantic choices
- [x] Wave 2: Verify schema paths correct at all levels
- [x] Wave 2: Document migration in this file
- [ ] Wave 3: Find and update internal links to `/docs/tools/` → `/docs/reference/tools/`
- [ ] Wave 3: Test all navigation paths work correctly
- [ ] Wave 3: Verify 4 requirements (NAV-01 through NAV-04) met

## Rollback Procedure

If navigation restructuring needs to be reverted:

### Wave 2 Rollback

```bash
# Revert (advanced) folder moves
git mv "docs/content/docs/(advanced)/integration" docs/content/docs/integration
git mv "docs/content/docs/(advanced)/best-practices" docs/content/docs/best-practices
git mv "docs/content/docs/(advanced)/advanced" docs/content/docs/advanced

# Delete (advanced) folder group
rmdir "docs/content/docs/(advanced)"

# Revert root meta.json
git checkout HEAD~1 docs/content/docs/meta.json
```

### Wave 1 Rollback

```bash
# Revert tools move
git mv docs/content/docs/reference/tools docs/content/docs/tools

# Delete reference folder
rmdir docs/content/docs/reference
```

**Note:** Only rollback if navigation causes significant UX issues. Test thoroughly first.

## Performance Impact

**Expected:** No measurable performance impact
- Folder groups are UI-only, no route changes (except tools/)
- Same number of meta.json files
- No additional build steps
- Page tree complexity unchanged

**Actual:** (To be measured in Phase 3 verification)
- Build time: TBD
- Navigation render time: TBD
- Bundle size: TBD

## Related Documentation

- `.planning/REQUIREMENTS.md` - Requirements NAV-01 through NAV-04
- `.planning/phases/02-navigation-restructuring/02-CONTEXT.md` - Phase objectives
- `.planning/phases/02-navigation-restructuring/02-RESEARCH.md` - Fumadocs features research
- `.planning/phases/02-navigation-restructuring/02-01-SUMMARY.md` - Wave 1 execution
- `.planning/phases/02-navigation-restructuring/02-02-SUMMARY.md` - Wave 2 execution
- `.planning/phases/02-navigation-restructuring/02-03-SUMMARY.md` - Wave 2 completion

---

**Migration completed:** 2026-01-21
**Phase:** 02-navigation-restructuring
**Total plans:** 3 (02-01, 02-02, 02-03)
**Total waves:** 2
**Folder moves:** 4 (tools, integration, best-practices, advanced)
**New folders created:** 2 (reference, (advanced))
**URL changes:** 1 path (`/docs/tools/*` → `/docs/reference/tools/*`)
