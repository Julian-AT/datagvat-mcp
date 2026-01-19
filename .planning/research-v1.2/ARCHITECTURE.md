# Documentation Architecture Patterns

**Domain:** MCP Server Technical Documentation
**Researched:** 2026-01-19

## Executive Summary

Documentation for MCP servers requires a **dual-audience architecture** serving both workflow-oriented data analysts and reference-seeking developers. The architecture must support progressive disclosure (quick start → comprehensive guides → detailed reference), enable auto-generation for API stability, and maintain clear content type boundaries.

**Key architectural pattern:** Diataxis-based quadrant system (Tutorials, How-to Guides, Reference, Explanation) mapped to MCP-specific content types (Getting Started, Guides/Workflows, Tools/API Reference, Best Practices/Architecture).

**Critical insight from MCP official docs:** Separate "Documentation" (user-facing, task-oriented) from "Specification" (implementer-facing, protocol-level) as distinct navigation trees. This pattern is essential for MCP servers where users need practical guides while integrators need precise technical references.

## Recommended Architecture

### High-Level Structure

```
Documentation Hub (Single unified site)
├── Getting Started (Tutorials quadrant)
│   ├── Introduction / What is [Project]?
│   ├── Installation / Setup
│   └── First Query / Quick Win
│
├── Guides (How-to quadrant)
│   ├── Task-oriented pages (Searching, Filtering, Analysis)
│   ├── Feature-specific guides (Quality Metrics, Preview)
│   └── Configuration guides (Environment, Credentials)
│
├── Workflows (How-to quadrant, end-to-end)
│   ├── Complete use-case examples
│   ├── Multi-step scenarios
│   └── Real-world patterns
│
├── Tools Reference (Reference quadrant - AUTO-GENERATED)
│   ├── tools/
│   ├── resources/
│   └── prompts/
│
├── API Reference (Reference quadrant)
│   ├── Architecture overview
│   ├── Protocol details
│   ├── Type definitions
│   └── Extension points
│
├── Integration (How-to + Explanation)
│   ├── Setup instructions
│   ├── Custom clients
│   └── Extension guides
│
└── Best Practices (Explanation quadrant)
    ├── Performance optimization
    ├── Production deployment
    └── Common pitfalls
```

### Content Type Boundaries

| Content Type | Quadrant | Audience | Purpose | Generation |
|--------------|----------|----------|---------|------------|
| **Getting Started** | Tutorial | All users | Onboarding, first success | Manual |
| **Guides** | How-to | Practitioners | Solve specific problems | Manual |
| **Workflows** | How-to | Practitioners | Complete scenarios | Manual |
| **Tools Reference** | Reference | Developers | Lookup API details | **AUTO-GENERATED** |
| **API Reference** | Reference | Integrators | Protocol/type reference | **AUTO-GENERATED** |
| **Integration** | How-to + Explanation | Developers | Extend/customize | Manual |
| **Best Practices** | Explanation | Practitioners | Understanding/context | Manual |

### Component Communication

```
┌─────────────────┐
│  Fumadocs UI    │ ← Navigation shell, search, theme
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
┌────────▼────────┐              ┌─────────▼──────────┐
│  Manual Content │              │ Generated Content  │
│  Workspace      │              │ Workspace          │
│                 │              │                    │
│  - MDX files    │              │  - TypeScript      │
│  - meta.json    │              │    source          │
│  - images       │              │  - JSDoc comments  │
└────────┬────────┘              │  - fumadocs-       │
         │                       │    typescript      │
         │                       └─────────┬──────────┘
         │                                 │
         ├─────────────────────────────────┤
         │                                 │
┌────────▼─────────────────────────────────▼──────┐
│         Fumadocs Loader (multiple())            │
│  - Merges page trees                            │
│  - Resolves navigation                          │
│  - Handles slugs/URLs                           │
└────────┬────────────────────────────────────────┘
         │
┌────────▼────────┐
│  Search Index   │ ← Orama/Algolia integration
└─────────────────┘
```

**Key interfaces:**

1. **Fumadocs Loader** (`loader()`) - Server-side API that merges content from multiple workspaces
2. **meta.json** - Navigation metadata (title, description, icon, page order)
3. **Page Tree** - Hierarchical structure of all documentation nodes
4. **Search Index** - Full-text index of content (automatically generated)

### Workspace Strategy (Two-Workspace Pattern)

**Pattern:** Separate manual content from generated content into distinct workspaces, merge at load time.

| Workspace | Purpose | Source | Update Frequency |
|-----------|---------|--------|------------------|
| **Manual Workspace** | Hand-written guides, tutorials, explanations | `/docs/getting-started/`, `/docs/guides/`, etc. | Per feature/release |
| **Generated Workspace** | Auto-generated API reference | TypeScript source code with JSDoc | Every build |

**Why separate workspaces?**
- **Stability:** Generated content can be rebuilt without touching manual content
- **Ownership:** Different authorship (docs team vs code comments)
- **Build process:** Generated content uses `fumadocs-typescript` plugin, manual content uses standard MDX
- **Git hygiene:** Generated files can be gitignored or committed separately

**Implementation via `source.config.ts`:**
```typescript
import { multiple } from 'fumadocs-mdx/loader';

export const { docs, meta } = multiple([
  manualWorkspaceLoader,     // From /docs/content/
  generatedWorkspaceLoader,  // From TypeScript source
]);
```

## Information Architecture Patterns

### 1. Progressive Disclosure (Onion Model)

Users move from surface to depth as expertise grows.

**Layer 1: Quick Start (5 minutes)**
- What is this?
- Installation
- First success (single query example)

**Layer 2: Common Tasks (30 minutes)**
- Task-oriented guides (Searching, Preview, Analysis)
- Specific features (Quality Metrics, Filtering)

**Layer 3: Complete Scenarios (2 hours)**
- End-to-end workflows
- Multi-step examples
- Real-world patterns

**Layer 4: Deep Reference (As needed)**
- API documentation
- Protocol details
- Type definitions

**Layer 5: Expert Context (As needed)**
- Architecture decisions
- Performance tuning
- Production deployment

### 2. Task-First Navigation (Stripe Pattern)

**DO:** Organize by user task, not system structure
- "Search for quality metrics" (task)
- "Preview dataset samples" (task)
- "Analyze field distributions" (task)

**DON'T:** Organize by technical component
- "searchResources tool" (component)
- "DataResource.preview method" (component)

**Implementation in meta.json:**
```json
{
  "title": "Guides",
  "pages": [
    "searching",          // Task: Find datasets
    "quality-metrics",    // Task: Assess quality
    "data-preview"        // Task: Inspect samples
  ]
}
```

### 3. Dual-Audience Navigation (MCP Official Docs Pattern)

**Pattern:** Separate navigation trees for different audience needs

**For Austria MCP:**

**Primary Navigation** (Data Analysts - workflow focus):
- Getting Started
- Guides (task-oriented)
- Workflows (end-to-end scenarios)
- Best Practices

**Secondary Navigation** (Developers - reference focus):
- Tools Reference (auto-generated)
- API Reference
- Integration (custom clients)

**Implementation:** Use Fumadocs tabs or sidebar sections to separate concerns.

### 4. Diataxis Quadrants Mapping

The [Diataxis framework](https://diataxis.fr/) prescribes four content types based on user needs:

| Diataxis Quadrant | MCP Content Type | User Need | Characteristics |
|-------------------|------------------|-----------|-----------------|
| **Tutorials** | Getting Started | Learning-oriented | Step-by-step, safe environment, guaranteed success |
| **How-to Guides** | Guides + Workflows | Problem-solving | Goal-oriented, assumes knowledge, multiple paths |
| **Reference** | Tools + API Reference | Information-seeking | Structure-oriented, accurate, complete |
| **Explanation** | Best Practices + Architecture | Understanding-oriented | Context, alternatives, why not just how |

**Critical distinction:**
- **Tutorials** (Getting Started): "Teaching you to use X"
- **How-to Guides** (Guides/Workflows): "Showing you how to solve Y"
- **Reference** (API docs): "Describing what Z does"
- **Explanation** (Best Practices): "Clarifying why Z works this way"

### 5. Auto-Generation Boundaries

**Pattern:** Generate what changes frequently, manually write what needs narrative.

**Auto-generate:**
- Tool definitions (from TypeScript interfaces)
- Parameter descriptions (from JSDoc)
- Type definitions (from TypeScript types)
- Example calls (from inline code examples)

**Manually write:**
- Conceptual overviews
- Task-oriented guides
- Workflow examples
- Architecture explanations
- Best practices

**Tool:** Use `fumadocs-typescript` for TypeScript auto-generation:
```typescript
// In source code
/**
 * Search for datasets in Data.gv.at catalog
 * @param query - Search query string
 * @param limit - Maximum results to return
 */
export async function searchDatasets(query: string, limit: number = 20) {
  // Implementation
}
```

→ Generates reference page with parameter table, description, example.

## Navigation Structure Recommendations

### Sidebar Organization (Fumadocs Pattern)

**Pattern:** Folder-based navigation with `meta.json` controlling order and metadata.

```
/docs/
  meta.json                    ← Root navigation
  getting-started/
    meta.json                  ← Section metadata
    index.mdx
    installation.mdx
    first-query.mdx
  guides/
    meta.json
    searching.mdx
    quality-metrics.mdx
    data-preview.mdx
  workflows/
    meta.json
    search-analyze-export.mdx
    quality-assessment.mdx
  tools/
    meta.json
    [auto-generated].mdx       ← From TypeScript
  api/
    meta.json
    architecture.mdx
    protocol.mdx
    types.mdx                  ← From TypeScript
```

**meta.json structure:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Getting Started",
  "description": "Quick start guide and installation",
  "icon": "Rocket",
  "root": true,
  "pages": [
    "index",
    "installation",
    "first-query"
  ]
}
```

**Key attributes:**
- `root: true` - Top-level navigation item
- `pages` - Order of child pages
- `icon` - Lucide icon name
- `"---Section---"` - Visual separator in navigation

### Search Strategy

**Pattern:** Full-text search via Orama (built-in) or Algolia (external).

**Content to index:**
- Page titles and descriptions (high weight)
- Headings (medium weight)
- Body text (standard weight)
- Code examples (low weight)

**Search features:**
- Keyboard shortcut (Cmd+K / Ctrl+K)
- Recent searches
- Section filters (Getting Started, Guides, Reference)
- Type filters (Page, Heading, API)

**Implementation:** Fumadocs provides built-in Orama search requiring no configuration.

### URL Structure

**Pattern:** Mirror navigation hierarchy in URLs.

```
/docs/getting-started/installation
/docs/guides/searching
/docs/workflows/quality-assessment
/docs/tools/search-resources
/docs/api/architecture
```

**Best practices:**
- Keep URLs stable (documentation is referenced externally)
- Use slugs, not IDs (`/tools/search-resources` not `/tools/1`)
- Mirror folder structure for predictability
- Support old URLs with redirects when restructuring

## Component Boundaries

### 1. Navigation Layer

**Responsibility:** Global navigation, breadcrumbs, sidebar, mobile menu

**Communicates with:**
- Page Tree (for structure)
- Search Index (for search dialog)
- i18n config (for language switching)

**Technology:** Fumadocs UI components (`<DocsLayout>`, `<DocsPage>`)

### 2. Content Layer

**Responsibility:** Render MDX content, handle components, manage frontmatter

**Communicates with:**
- Fumadocs Loader (to fetch page data)
- MDX Components (to render content)
- TOC Generator (for table of contents)

**Technology:** Next.js App Router, `fumadocs-mdx`

### 3. Search Layer

**Responsibility:** Index content, provide search interface, rank results

**Communicates with:**
- Page Tree (to index all pages)
- Navigation Layer (to open search dialog)
- Content Layer (to highlight results)

**Technology:** Orama (built-in) or Algolia (external)

### 4. Generation Layer

**Responsibility:** Auto-generate API reference from source code

**Communicates with:**
- TypeScript source (reads JSDoc comments)
- Content Layer (outputs MDX files)
- Page Tree (registers generated pages)

**Technology:** `fumadocs-typescript`, JSDoc parser

### 5. Metadata Layer

**Responsibility:** Provide page metadata (title, description, OG image)

**Communicates with:**
- Content Layer (reads frontmatter)
- Next.js Metadata API (for SEO)
- OG Image Generator (for social cards)

**Technology:** Fumadocs frontmatter schema, Next.js `generateMetadata()`

## Data Flow

### Page Rendering Flow

```
User requests /docs/guides/searching
         ↓
Next.js App Router matches /[lang]/docs/[[...slug]]/page.tsx
         ↓
getDocPage(slug) calls Loader to fetch page data
         ↓
Loader resolves slug → page node → MDX file
         ↓
MDX file processed (frontmatter extracted, components rendered)
         ↓
<DocsPage> renders content with TOC, breadcrumbs, footer
         ↓
Client-side hydration enables interactive components
```

### Search Indexing Flow

```
Build time
         ↓
Fumadocs Loader generates Page Tree
         ↓
Search plugin walks tree, extracts content
         ↓
Orama builds full-text index (JSON)
         ↓
Index embedded in client bundle or fetched at runtime
         ↓
User types in search box → instant client-side filtering
```

### Auto-Generation Flow

```
TypeScript source code with JSDoc
         ↓
fumadocs-typescript plugin scans files
         ↓
Extracts type definitions, function signatures, comments
         ↓
Generates MDX files in /docs/tools/ or /docs/api/types/
         ↓
Fumadocs Loader includes generated files in Page Tree
         ↓
Navigation sidebar shows generated pages
```

## Patterns to Follow

### Pattern 1: Separate Manual and Generated Content

**What:** Use two workspaces, merge at load time

**When:** Project has both hand-written guides and auto-generated API docs

**Example:**
```typescript
// source.config.ts
import { multiple } from 'fumadocs-mdx/loader';
import { loader } from 'fumadocs-core/source';

const manualDocs = loader({
  baseUrl: '/docs',
  rootDir: 'docs',
  source: manualSource,
});

const generatedDocs = loader({
  baseUrl: '/docs',
  rootDir: 'generated',
  source: typescriptSource,
});

export const { docs, meta } = multiple([manualDocs, generatedDocs]);
```

**Benefits:**
- Generated content rebuilds independently
- Manual content remains stable
- Clear ownership boundaries

### Pattern 2: Task-First Navigation with Reference Fallback

**What:** Primary navigation by task, secondary navigation by reference

**When:** Dual audience (practitioners + developers)

**Example:**
```json
// Primary sidebar (task-oriented)
{
  "pages": [
    "---Common Tasks---",
    "searching",
    "filtering",
    "analysis",
    "---Complete Workflows---",
    "...workflows",
    "---Reference---",
    "...tools",
    "...api"
  ]
}
```

**Benefits:**
- Practitioners find solutions quickly
- Developers can deep-dive to reference
- Reduces cognitive load

### Pattern 3: Progressive Disclosure via Folding Sections

**What:** Nest detailed content under high-level pages

**When:** Content depth varies by user expertise

**Example:**
```
/docs/guides/searching.mdx          ← Overview with common cases
/docs/guides/searching/
  filters.mdx                       ← Deep dive: filters
  pagination.mdx                    ← Deep dive: pagination
  advanced-queries.mdx              ← Deep dive: advanced
```

**Benefits:**
- Beginners aren't overwhelmed
- Experts can navigate to depth
- Content remains discoverable

### Pattern 4: Example-First API Documentation

**What:** Show example code before parameter tables

**When:** Documenting tools, functions, APIs

**Example:**
```mdx
# searchDatasets

Search for datasets in the Data.gv.at catalog.

## Example

```typescript
const results = await mcp.callTool('searchDatasets', {
  query: 'gesundheit',
  limit: 10
});
```

## Parameters

| Name | Type | Description |
|------|------|-------------|
| query | string | Search query |
| limit | number | Max results (default: 20) |
```

**Benefits:**
- Users see what they need first (working code)
- Parameter details available for reference
- Reduces time-to-first-success

### Pattern 5: Versioned Specification Separate from User Docs

**What:** Keep protocol specification in separate navigation tree

**When:** Documenting protocols, standards, or APIs with strict versioning

**Example (from MCP official docs):**
```
/docs/              ← User-facing guides
/specification/     ← Protocol specification
  2025-11-25/       ← Versioned spec
  latest/           ← Redirects to latest
```

**Benefits:**
- User docs can evolve freely
- Specification remains stable and versioned
- Different audiences don't interfere

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixing Content Types in Same Section

**What goes wrong:** Putting tutorials, guides, and reference in one folder

**Why it happens:** "Everything is documentation"

**Consequences:**
- Users can't predict what a page contains
- Navigation becomes overwhelming
- Search results are confusing

**Prevention:** Use Diataxis quadrants to organize folders

**Instead:**
```
✗ /docs/tools/   ← Mixed: overview, guide, reference
✓ /docs/guides/tools/searching.mdx  ← How-to guide
✓ /docs/tools/searchDatasets.mdx   ← Reference
```

### Anti-Pattern 2: Deep Nesting (>3 levels)

**What goes wrong:** `/docs/guides/data-analysis/quality-metrics/field-completeness/introduction.mdx`

**Why it happens:** Mirroring code structure in documentation

**Consequences:**
- Long URLs, hard to remember
- Navigation sidebar becomes cluttered
- Users get lost

**Prevention:** Flatten structure, use grouping in meta.json instead

**Instead:**
```
✗ /docs/guides/data-analysis/quality-metrics/field-completeness.mdx
✓ /docs/guides/quality-metrics.mdx  ← Flatten
```

### Anti-Pattern 3: Auto-Generated Content Without Curation

**What goes wrong:** Generating 100 API pages with no overview or grouping

**Why it happens:** "Just run the doc generator"

**Consequences:**
- Users don't know where to start
- Navigation becomes unusable
- Important content is buried

**Prevention:** Curate generated content with manual overview pages

**Instead:**
```
✓ /docs/tools/index.mdx          ← Manual overview
✓ /docs/tools/search/             ← Group related tools
    searchDatasets.mdx            ← Generated
    filterResults.mdx             ← Generated
```

### Anti-Pattern 4: No Search or Poor Search

**What goes wrong:** Users can't find content even when it exists

**Why it happens:** Assuming navigation is sufficient

**Consequences:**
- Users give up and ask support
- Documentation feels incomplete
- Time-to-solution increases

**Prevention:** Implement full-text search from day one (Fumadocs provides this built-in)

### Anti-Pattern 5: Orphaned Pages (No Navigation Entry)

**What goes wrong:** Creating pages that aren't linked from anywhere

**Why it happens:** Forgetting to add page to meta.json

**Consequences:**
- Pages only accessible via direct URL
- Users don't know content exists
- Wasted documentation effort

**Prevention:** CI check that all MDX files are in a meta.json

**Detection:**
```bash
# Find MDX files not in any meta.json
find docs -name "*.mdx" | while read f; do
  grep -q "$(basename $f .mdx)" docs/**/meta.json || echo "Orphaned: $f"
done
```

## Build Order and Dependencies

### Phase 1: Foundation (No Dependencies)

**Content:**
- Root meta.json (navigation structure)
- Landing page (index.mdx)

**Reason:** Establishes navigation skeleton before any content exists

### Phase 2: Getting Started (Depends on: Foundation)

**Content:**
- Introduction page
- Installation guide
- First query tutorial

**Reason:** New users need immediate success path before exploring deeper content

### Phase 3: Guides (Depends on: Getting Started)

**Content:**
- Task-oriented guides (Searching, Filtering, Analysis)
- Feature-specific guides (Quality Metrics, Preview)

**Reason:** Assumes user completed Getting Started, now solving specific problems

### Phase 4: Tools Reference (Depends on: TypeScript source)

**Content:**
- Auto-generated tool documentation
- Parameter tables
- Example code

**Reason:** Generated from code, requires stable tool interfaces

**Blocker:** TypeScript source must have JSDoc comments

### Phase 5: Workflows (Depends on: Guides, Tools Reference)

**Content:**
- End-to-end scenarios
- Multi-step examples
- Real-world patterns

**Reason:** Combines multiple guides and tools, requires prior content for linking

### Phase 6: API Reference (Depends on: TypeScript source)

**Content:**
- Architecture overview (manual)
- Protocol details (manual)
- Type definitions (auto-generated)

**Reason:** Deep technical reference, requires code stability

### Phase 7: Integration (Depends on: API Reference)

**Content:**
- Custom client setup
- Extension guides
- Advanced integration patterns

**Reason:** Assumes understanding of API structure from Phase 6

### Phase 8: Best Practices (Depends on: Guides, Workflows)

**Content:**
- Performance optimization
- Production deployment
- Common pitfalls

**Reason:** Assumes user has used the system, now optimizing

### Dependency Graph

```
Foundation (Phase 1)
    ↓
Getting Started (Phase 2)
    ↓
    ├─→ Guides (Phase 3)
    │       ↓
    │       ├─→ Workflows (Phase 5)
    │       │       ↓
    │       │       └─→ Best Practices (Phase 8)
    │       │
    └───────┴─→ Tools Reference (Phase 4)
                    ↓
                API Reference (Phase 6)
                    ↓
                Integration (Phase 7)
```

**Critical path:** Foundation → Getting Started → Guides → Tools Reference

**Parallel work:** Workflows and API Reference can be developed simultaneously after Guides + Tools Reference complete

## Scalability Considerations

### At 50 pages (Initial Launch)

**Approach:**
- Single workspace
- Flat folder structure
- Manual navigation in meta.json
- Built-in Orama search

**Sufficient for:**
- Getting Started (5 pages)
- Guides (12 pages)
- Tools Reference (25 pages)
- Workflows (7 pages)

### At 200 pages (Mature Project)

**Approach:**
- Two workspaces (manual + generated)
- Grouped folder structure with separator sections
- Automated navigation generation for tools
- External search (Algolia) for better ranking
- Versioned documentation

**Required for:**
- Multiple MCP servers
- Historical documentation
- Comprehensive API reference
- Multi-language support

### At 1000+ pages (Large Ecosystem)

**Approach:**
- Multi-site architecture (separate domains per product)
- Search federation across sites
- Automated content validation
- Documentation as code (CI/CD)
- Analytics-driven content optimization

**Required for:**
- Multiple products/services
- Public API for external developers
- Enterprise documentation requirements

## Roadmap Implications

### Suggested Phase Structure

Based on architecture patterns and dependencies:

**Phase 1: Documentation Foundation**
- Set up Fumadocs two-workspace architecture
- Create root navigation structure (meta.json)
- Implement landing page and search

**Phase 2: Getting Started Content**
- Write introduction, installation, first query
- Establish progressive disclosure pattern
- Validate with target users

**Phase 3: Guides Content**
- Write task-oriented guides (Searching, Quality Metrics, Preview)
- Implement example-first pattern
- Cross-link to tools reference (placeholders OK)

**Phase 4: Auto-Generated Tools Reference**
- Add JSDoc comments to TypeScript source
- Configure fumadocs-typescript generation
- Generate all tool reference pages

**Phase 5: Workflows Content**
- Write end-to-end scenario guides
- Link to existing guides and tools
- Validate with real-world use cases

**Phase 6: API Reference**
- Write architecture overview
- Document protocol details
- Auto-generate type definitions

**Phase 7: Integration & Best Practices**
- Write custom client guides
- Document performance optimization
- Add production deployment guide

### Build Order Rationale

1. **Foundation first:** Without navigation structure, content has nowhere to live
2. **Getting Started second:** Highest value for new users, validates information architecture
3. **Guides third:** Most frequently used content type, informs what tools need documentation
4. **Tools Reference fourth:** Can be auto-generated once JSDoc is ready, needed for Workflows
5. **Workflows fifth:** Depends on Guides + Tools existing for cross-linking
6. **API Reference sixth:** Deep technical content, lower priority for initial launch
7. **Integration/Best Practices seventh:** Expert content, deferred until core docs proven

### Research Flags for Phases

**Phase 1 (Foundation):** Unlikely to need research
- Fumadocs setup is well-documented
- Two-workspace pattern validated in current codebase

**Phase 4 (Auto-Generated Tools):** Likely needs deeper research
- fumadocs-typescript configuration for MCP tool patterns
- JSDoc conventions for tool parameters/schemas
- Example generation from TypeScript

**Phase 6 (API Reference):** Likely needs deeper research
- MCP protocol documentation patterns
- Type definition generation from JSON Schema
- Version management for protocol docs

## Confidence Assessment

**Overall confidence:** MEDIUM

**Rationale:**
- Diataxis framework and Stripe/MCP patterns are WELL-ESTABLISHED (HIGH confidence)
- Fumadocs two-workspace pattern is VALIDATED in current codebase (HIGH confidence)
- Auto-generation tooling (fumadocs-typescript) is DOCUMENTED but not tested for MCP tools (MEDIUM confidence)
- Specific navigation structure is INFERRED from project requirements (MEDIUM confidence)
- Build order dependencies are LOGICAL but not empirically validated (MEDIUM confidence)

**Sources verification:**
- Diataxis framework: Official documentation (HIGH confidence)
- MCP official docs: Direct inspection (HIGH confidence)
- Stripe docs pattern: Direct inspection (MEDIUM confidence, UI patterns observed)
- Fumadocs architecture: Official docs + current codebase (HIGH confidence)
- Auto-generation patterns: Fumadocs docs (MEDIUM confidence, not tested in this context)

## Sources

**Primary sources (HIGH confidence):**
- [Diataxis Documentation Framework](https://diataxis.fr/) - Four quadrants pattern
- [MCP Official Documentation](https://modelcontextprotocol.io/docs) - Dual-audience navigation
- [Fumadocs Documentation](https://fumadocs.dev/docs) - Workspace architecture
- Stripe Developer Docs - Task-first navigation pattern (observed via WebFetch)

**Secondary sources (MEDIUM confidence):**
- Current project codebase (docs/source.config.ts, docs/meta.json)
- General documentation best practices (WebSearch aggregation)

**Gaps requiring validation:**
- fumadocs-typescript configuration for MCP-specific patterns
- Optimal page count per section for target audiences
- Search ranking tuning for dual-audience content
- Version management strategy for MCP protocol docs
