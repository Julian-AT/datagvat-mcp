# Phase 18: Documentation Foundation - Research

**Researched:** 2026-01-19
**Domain:** Documentation Framework Architecture / Fumadocs Interactive Components
**Confidence:** HIGH

## Summary

Phase 18 establishes the documentation infrastructure for 60-80 comprehensive pages covering Austria MCP server tools, workflows, and integrations. The foundation phase creates the information architecture (7-section hierarchy), interactive component infrastructure (Tabs, Accordion, Mermaid), and navigation features (breadcrumbs, TOC, prev/next).

**Core insight:** Fumadocs is already installed and configured from v1.1. This phase focuses on implementing the 7-section architecture pattern and ensuring all interactive components work correctly, not rebuilding the framework.

**Primary recommendation:** Use Diataxis-based content organization (Getting Started → Guides → Tools → Workflows → API → Integration → Best Practices) with Fumadocs' existing two-workspace pattern (manual content + auto-generated API reference). All required components are already installed; focus on configuration and content structure.

## Standard Stack

The documentation stack is already installed from v1.1. This phase uses existing packages.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-core | 16.4.7 | Page tree, search, navigation | Official Fumadocs core |
| fumadocs-ui | 16.4.7 | UI components (DocsLayout, DocsPage) | Official UI library |
| fumadocs-mdx | 14.2.6 | MDX compilation, plugins | Official MDX integration |
| next | 16.1.3 | App Router, SSG, OG images | Framework foundation |
| mermaid | 11.12.2 | Diagram rendering | Already integrated for COMP-06 |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-collapsible | 1.1.12 | Accordion primitive | Collapsible content (COMP-05) |
| fumadocs-typescript | 5.0.1 | Auto-generate API docs | Phase 21 (API reference) |
| @radix-ui/react-dialog | 1.1.15 | Search dialog | Search functionality (FOUND-02) |
| next-themes | 0.4.6 | Theme switching | Mobile responsive (FOUND-06) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs | Docusaurus | Migration cost high, Fumadocs already in place |
| Radix UI Accordion | Custom accordion | Radix provides accessibility, tested patterns |
| Mermaid | PlantUML | Mermaid is JavaScript-native, no Java dependency |

**Installation:**
```bash
# No new packages needed - all already installed in v1.1
cd docs && npm list fumadocs-core fumadocs-ui fumadocs-mdx
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── content/
│   └── docs/
│       ├── meta.json                          # Root navigation (FOUND-01)
│       ├── index.mdx                          # Landing page
│       ├── getting-started/                   # Section 1
│       │   ├── meta.json
│       │   ├── index.mdx
│       │   ├── installation.mdx
│       │   └── quickstart.mdx
│       ├── guides/                            # Section 2
│       │   ├── meta.json
│       │   ├── searching.mdx
│       │   ├── quality-metrics.mdx
│       │   └── data-preview.mdx
│       ├── tools/                             # Section 3 (auto-generated Phase 21)
│       │   ├── meta.json
│       │   └── [tool-name].mdx
│       ├── workflows/                         # Section 4
│       │   ├── meta.json
│       │   └── discovery-workflow.mdx
│       ├── api/                               # Section 5
│       │   ├── meta.json
│       │   ├── architecture.mdx
│       │   └── protocol.mdx
│       ├── integration/                       # Section 6
│       │   ├── meta.json
│       │   └── claude-desktop.mdx
│       └── best-practices/                    # Section 7
│           ├── meta.json
│           └── optimization.mdx
├── app/
│   └── [lang]/
│       └── docs/
│           ├── layout.tsx                     # DocsLayout with sidebar
│           └── [[...slug]]/
│               └── page.tsx                   # Dynamic page rendering
├── components/
│   ├── mdx/
│   │   └── mermaid.tsx                        # COMP-06 (already exists)
│   └── ui/
│       └── collapsible.tsx                    # COMP-05 base (already exists)
└── lib/
    └── source.tsx                             # Page tree loader
```

### Pattern 1: Diataxis-Based 7-Section Hierarchy (FOUND-01)

**What:** Organize content by user need (learning, solving, referencing, understanding) into 7 sections

**When to use:** Documentation serving multiple audiences (beginners, practitioners, developers)

**Implementation:**
```json
// docs/content/docs/meta.json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "pages": [
    "getting-started",    // Section 1: Learning-oriented
    "guides",             // Section 2: Problem-solving
    "tools",              // Section 3: Reference (auto-generated)
    "workflows",          // Section 4: End-to-end scenarios
    "api",                // Section 5: Technical reference
    "integration",        // Section 6: Extension guides
    "best-practices"      // Section 7: Understanding/context
  ]
}
```

**Section configuration example:**
```json
// docs/content/docs/getting-started/meta.json
{
  "$schema": "../../.source/json-schema/docs.meta.json",
  "title": "Getting Started",
  "description": "Quick start guide and installation",
  "icon": "Rocket",
  "root": true,
  "pages": [
    "index",
    "installation",
    "quickstart"
  ]
}
```

**Why this works:**
- Aligns with Diataxis framework (tutorials, how-to, reference, explanation)
- Matches user mental models ("I want to learn" vs "I need to solve X")
- Enables progressive disclosure (surface → depth)

**Source:** Diataxis framework (https://diataxis.fr/) + MCP official docs pattern

### Pattern 2: Built-in Navigation Components (FOUND-03, FOUND-04, FOUND-05)

**What:** Fumadocs provides breadcrumbs, TOC, and prev/next navigation out-of-the-box

**Implementation:**
```tsx
// docs/app/[lang]/docs/[[...slug]]/page.tsx
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';

export default async function Page({ params }) {
  const page = source.getPage(slug, lang);
  const { body: Mdx, toc } = await page.data.load();

  return (
    <DocsPage
      toc={toc}                           // FOUND-03: In-page TOC
      tableOfContent={{ style: 'clerk' }} // Style variant
    >
      <h1>{page.data.title}</h1>
      <Mdx />
      {/* Breadcrumbs and prev/next rendered automatically by DocsLayout */}
    </DocsPage>
  );
}
```

**Layout configuration:**
```tsx
// docs/app/[lang]/docs/layout.tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

export default function Layout({ children }) {
  return (
    <DocsLayout
      tree={source.getPageTree(lang)}  // Page tree for navigation
      nav={{ title: <Logo /> }}        // FOUND-04: Breadcrumbs enabled by default
      sidebar={{
        defaultOpenLevel: 1,           // Collapse depth
        collapsible: true,             // FOUND-05: Prev/next enabled by default
      }}
    >
      {children}
    </DocsLayout>
  );
}
```

**Features:**
- **FOUND-03 (TOC):** Extracted from headings automatically, scrollspy active state
- **FOUND-04 (Breadcrumbs):** Rendered from page tree hierarchy
- **FOUND-05 (Prev/Next):** Computed from page tree order
- **FOUND-02 (Search):** Built-in Orama search (configured in RootProvider)

**Source:** Fumadocs official docs (https://fumadocs.dev/docs/ui/layouts/docs)

### Pattern 3: Tabs for Progressive Disclosure (COMP-01)

**What:** Use Tabs component for Basic/Advanced examples, multiple language variants

**When to use:** Content has complexity levels or alternative implementations

**Example:**
```mdx
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';

## Usage

<Tabs items={['Basic', 'Advanced']} groupId="complexity" persist>
  <Tab value="Basic">
    ```typescript
    // Simple usage
    const results = await mcp.callTool('search_datasets', {
      query: 'health'
    });
    ```
  </Tab>

  <Tab value="Advanced">
    ```typescript
    // Advanced usage with filters
    const results = await mcp.callTool('search_datasets', {
      query: 'health',
      filters: {
        organization: 'Gesundheit Österreich',
        tags: ['COVID-19']
      },
      limit: 50
    });
    ```
  </Tab>
</Tabs>
```

**Key features:**
- `groupId` + `persist`: Selection persists across page navigation (localStorage)
- `updateAnchor`: URL hash updates when tab changes (linkable)
- `defaultIndex`: Set default active tab

**Source:** Fumadocs Tabs component docs (https://fumadocs.dev/docs/ui/components/tabs)

### Pattern 4: Accordion for Scannable API Reference (COMP-05)

**What:** Use Accordion for collapsible tool reference (25 tools = long page)

**When to use:** Long reference pages where users scan, then expand details

**Example:**
```mdx
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { TypeTable } from 'fumadocs-ui/components/type-table';

# Discovery Tools

<Accordions type="single" collapsible>
  <Accordion title="search_datasets" id="search-datasets">
    Search for datasets using text queries and faceted filtering.

    ## Parameters

    <TypeTable type={{
      query: {
        type: "string",
        description: "Search query for titles, descriptions, keywords"
      },
      limit: {
        type: "number",
        default: 20,
        description: "Maximum number of results"
      }
    }} />

    ## Example

    ```typescript
    const results = await mcp.callTool('search_datasets', {
      query: 'gesundheit',
      limit: 10
    });
    ```
  </Accordion>

  <Accordion title="get_dataset" id="get-dataset">
    Retrieve detailed metadata for a specific dataset.

    {/* Similar structure */}
  </Accordion>
</Accordions>
```

**Key features:**
- `type="single"`: Only one accordion open at a time
- `id` attribute: Enables URL hash linking (`#search-datasets`)
- Based on Radix UI Accordion (accessibility built-in)

**Source:** Fumadocs Accordion component docs (https://fumadocs.dev/docs/ui/components/accordion)

### Pattern 5: Mermaid for Workflow Diagrams (COMP-06)

**What:** Render workflow diagrams as code using Mermaid

**When to use:** Visualizing multi-step workflows, decision trees, architecture

**Example:**
```mdx
import { Mermaid } from '@/components/mdx/mermaid';

# Discovery Workflow

<Mermaid chart={`
graph TD
    A[User Query] --> B{Search Type?}
    B -->|Keyword| C[search_datasets]
    B -->|Semantic| D[semantic_search_datasets]
    C --> E[Results]
    D --> E
    E --> F{Need Details?}
    F -->|Yes| G[get_dataset]
    F -->|No| H[End]
    G --> I[Full Metadata]
    I --> J[find_related_datasets]
`} />
```

**Already implemented:**
- `docs/components/mdx/mermaid.tsx` exists from v1.1
- Theme-aware (switches between light/dark Mermaid themes)
- Client-side rendering with caching

**Supported diagram types:**
- Flowchart (workflows, decision trees)
- Sequence (API call flows)
- State (server lifecycle)
- Class (data models)

**Source:** Existing codebase (docs/components/mdx/mermaid.tsx)

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Deep Navigation Nesting (>3 levels)

**What goes wrong:** `/docs/guides/data-analysis/quality-metrics/field-completeness.mdx`

**Why it happens:** Mirroring code structure in docs

**Prevention:** Flatten to 2-3 levels max
```
✗ /docs/guides/data-analysis/quality-metrics/field-completeness.mdx (4 levels)
✓ /docs/guides/quality-metrics.mdx (2 levels)
✓ /docs/workflows/quality-assessment.mdx (2 levels, different audience)
```

#### Anti-Pattern 2: Missing meta.json Entries (Orphaned Pages)

**What goes wrong:** Creating MDX files not listed in any meta.json

**Why it happens:** Forgetting to add page to navigation

**Prevention:** CI check for orphaned files
```bash
# Validation script
find docs/content -name "*.mdx" | while read f; do
  basename=$(basename "$f" .mdx)
  if ! grep -q "\"$basename\"" docs/content/**/meta.json; then
    echo "ERROR: Orphaned page: $f"
    exit 1
  fi
done
```

#### Anti-Pattern 3: Mixing Content Types in Same Folder

**What goes wrong:** Putting tutorials and reference in same folder

**Why it happens:** "It's all documentation"

**Prevention:** Use Diataxis quadrants for folder structure
```
✗ /docs/tools/ (mixed: guide + reference)
✓ /docs/guides/searching.mdx (how-to guide)
✓ /docs/tools/search-datasets.mdx (reference)
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion component | Custom collapsible divs | Radix UI Accordion (via fumadocs-ui) | Accessibility (keyboard nav, ARIA), animation, tested |
| Search functionality | grep + JSON index | Fumadocs Orama integration | Full-text search, ranking, highlighting built-in |
| Table of contents | Custom heading parser | Fumadocs TOC extraction | Handles edge cases (duplicate IDs, nested lists) |
| Breadcrumb navigation | URL parsing + rendering | Fumadocs useBreadcrumb hook | Handles index pages, folder hierarchies |
| Theme switching | localStorage + CSS classes | next-themes | SSR-safe, no flash of unstyled content |
| Prev/Next navigation | Manual page tree walking | Fumadocs findSiblings utility | Handles separators, folder.index logic |
| Mobile responsive layout | Custom breakpoints | Fumadocs DocsLayout | Tested on all screen sizes, hamburger menu |

**Key insight:** Fumadocs provides primitives for all FOUND-* requirements. Don't rebuild navigation, search, or TOC.

## Common Pitfalls

### Pitfall 1: Forgetting to Configure Root Pages in meta.json

**What goes wrong:** Top-level sections don't appear as tabs/sections in sidebar

**Why it happens:** Missing `"root": true` in meta.json

**How to avoid:**
```json
// docs/content/docs/getting-started/meta.json
{
  "title": "Getting Started",
  "root": true,        // ← REQUIRED for top-level section
  "icon": "Rocket",
  "pages": ["index", "installation"]
}
```

**Warning signs:**
- Section appears nested under parent instead of root-level
- Sidebar tabs don't show section
- Navigation hierarchy is flat when it should be grouped

**Source:** Fumadocs page conventions (existing codebase analysis)

### Pitfall 2: TOC Not Rendering (Missing Heading Extraction)

**What goes wrong:** Table of contents is empty or incomplete

**Why it happens:** Headings not extracted during MDX compilation or toc prop not passed

**How to avoid:**
```typescript
// Verify MDX config includes structure plugin
import { applyMdxPreset } from 'fumadocs-mdx/config';

mdxOptions: {
  remarkPlugins: [
    // remarkStructure plugin MUST be included
    [remarkStructure, { types: ['heading', 'code'] }]
  ]
}

// Pass toc to DocsPage
const { toc } = await page.data.load();
<DocsPage toc={toc}>...</DocsPage>
```

**Warning signs:**
- Right sidebar TOC is empty
- `toc` is undefined or empty array
- Console warnings about missing structure data

**Source:** Fumadocs MDX configuration docs

### Pitfall 3: Accordion IDs Conflicting (Hash Navigation Broken)

**What goes wrong:** Clicking TOC link to accordion doesn't expand it

**Why it happens:** Accordion `id` doesn't match URL hash

**How to avoid:**
```mdx
{/* Ensure id matches URL hash exactly (kebab-case) */}
<Accordion title="search_datasets" id="search-datasets">
  {/* NOT id="search_datasets" - use kebab-case for URLs */}
</Accordion>

{/* In TOC or links: */}
[Search Datasets](#search-datasets)
```

**Warning signs:**
- URL hash updates but accordion doesn't expand
- Browser scrolls but content remains collapsed
- Console error about missing element

**Source:** Fumadocs Accordion docs

### Pitfall 4: Mobile Navigation Breaking (Viewport Meta Missing)

**What goes wrong:** Mobile layout doesn't scale correctly, sidebar overlaps content

**Why it happens:** Missing viewport meta tag or incorrect layout structure

**How to avoid:**
```tsx
// docs/app/layout.tsx - ROOT layout must include viewport
export const metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

// Use DocsLayout (not custom layout) for mobile support
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
```

**Warning signs:**
- Mobile viewport zoomed out (tiny text)
- Sidebar doesn't collapse to hamburger menu
- Content width exceeds screen width

**Source:** Next.js metadata API + Fumadocs layout docs

### Pitfall 5: Slow Page Loads (No Static Generation)

**What goes wrong:** Pages load slowly (>2s) because they're rendered on-demand

**Why it happens:** Missing `generateStaticParams` or incorrect build config

**How to avoid:**
```typescript
// docs/app/[lang]/docs/[[...slug]]/page.tsx
export function generateStaticParams() {
  return source.generateParams('slug', 'lang');
  // Pre-renders all pages at build time
}

export const revalidate = false; // Static generation (no ISR)
```

**Warning signs:**
- First page load takes >2s (FOUND-07 requirement)
- Next.js logs show "Dynamic route" instead of "Static"
- Build output shows 0 static pages generated

**Source:** Next.js App Router docs + existing codebase

## Code Examples

Verified patterns from official sources:

### Complete DocsLayout Setup (FOUND-01 through FOUND-07)

```tsx
// docs/app/[lang]/docs/layout.tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { Logo } from '@/components/logo';

export default async function Layout({ params, children }) {
  const { lang } = await params;

  return (
    <DocsLayout
      tree={source.getPageTree(lang)}           // FOUND-01: 7-section hierarchy
      nav={{ title: <Logo /> }}                 // FOUND-04: Breadcrumbs auto-rendered
      sidebar={{
        defaultOpenLevel: 1,                     // Collapse depth
        collapsible: true,                       // FOUND-05: Prev/Next navigation
        banner: <div>Documentation v1.2</div>,
      }}
      i18n={{                                    // Future: bilingual (v1.3)
        locale: lang,
        locales: ['en', 'de'],
      }}
    >
      {children}
      {/* FOUND-02: Search enabled by default in RootProvider */}
    </DocsLayout>
  );
}
```

**Source:** Existing codebase (docs/app/[lang]/docs/layout.tsx)

### Page with All Navigation Features

```tsx
// docs/app/[lang]/docs/[[...slug]]/page.tsx
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';

export default async function Page({ params }) {
  const { slug = [], lang } = await params;
  const page = source.getPage(slug, lang);

  if (!page) return notFound();

  const { body: Mdx, toc, lastModified } = await page.data.load();

  return (
    <DocsPage
      toc={toc}                                  // FOUND-03: In-page TOC
      tableOfContent={{
        style: 'clerk',                          // Style: clerk | default
        single: false,                           // Show nested headings
      }}
      lastUpdate={lastModified}                  // Show last modified date
    >
      <h1>{page.data.title}</h1>
      <p>{page.data.description}</p>

      <Mdx />

      {/* FOUND-04, FOUND-05: Breadcrumbs/Prev/Next rendered by layout */}
    </DocsPage>
  );
}

// FOUND-07: Pre-render all pages (<2s initial load)
export function generateStaticParams() {
  return source.generateParams('slug', 'lang');
}

export const revalidate = false; // Static site generation
```

**Source:** Existing codebase (docs/app/[lang]/docs/[[...slug]]/page.tsx)

### Root meta.json (7-Section Hierarchy)

```json
// docs/content/docs/meta.json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "pages": [
    "getting-started",    // Section 1: Tutorials
    "guides",             // Section 2: How-to guides
    "tools",              // Section 3: Reference (auto-generated)
    "workflows",          // Section 4: End-to-end scenarios
    "api",                // Section 5: API reference
    "integration",        // Section 6: Integration guides
    "best-practices"      // Section 7: Explanation/optimization
  ]
}
```

**Source:** Requirement FOUND-01 + Diataxis framework

### Tabs with Persistent Selection (COMP-01)

```mdx
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';

## Query Examples

<Tabs items={['Basic', 'Advanced']} groupId="query-complexity" persist>
  <Tab value="Basic">
    ```typescript
    const results = await mcp.callTool('search_datasets', {
      query: 'health'
    });
    ```
  </Tab>

  <Tab value="Advanced">
    ```typescript
    const results = await mcp.callTool('search_datasets', {
      query: 'health',
      filters: { tags: ['COVID-19'] },
      semantic: true,
      expand_query: true
    });
    ```
  </Tab>
</Tabs>
```

**Key features:**
- `groupId="query-complexity"`: Selection persists across pages
- `persist`: Store in localStorage (survives reload)
- `items` array: Tab labels shown in UI

**Source:** Fumadocs Tabs docs (https://fumadocs.dev/docs/ui/components/tabs)

### Accordion for API Reference (COMP-05)

```mdx
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { TypeTable } from 'fumadocs-ui/components/type-table';

# Discovery Tools

<Accordions type="single" collapsible>
  <Accordion title="search_datasets" id="search-datasets">
    Full-text search across the Data.gv.at catalog with faceted filtering.

    ## Parameters

    <TypeTable type={{
      query: {
        type: "string",
        description: "Search query (titles, descriptions, keywords)",
        default: undefined
      },
      limit: {
        type: "number",
        description: "Maximum results to return",
        default: 20
      },
      filters: {
        type: "object",
        description: "Faceted filters (organization, tags, license)",
        default: {}
      }
    }} />

    ## Returns

    Array of dataset results with title, description, tags, and metadata.

    ## Example

    ```typescript
    const results = await mcp.callTool('search_datasets', {
      query: 'gesundheit wien',
      limit: 10,
      filters: { tags: ['Gesundheit'] }
    });
    ```
  </Accordion>

  <Accordion title="get_dataset" id="get-dataset">
    {/* Next tool */}
  </Accordion>
</Accordions>
```

**Key features:**
- `type="single"`: Only one accordion open at a time
- `collapsible`: Can close all accordions
- `id`: Enables URL hash linking (#search-datasets)

**Source:** Fumadocs Accordion docs (https://fumadocs.dev/docs/ui/components/accordion)

### Mermaid Workflow Diagram (COMP-06)

```mdx
import { Mermaid } from '@/components/mdx/mermaid';

# Dataset Discovery Workflow

<Mermaid chart={`
graph TD
    A[User Query: 'health datasets in Vienna'] --> B{Query Type}
    B -->|Keyword Search| C[search_datasets]
    B -->|Semantic Search| D[semantic_search_datasets]

    C --> E[Results: 15 datasets]
    D --> E

    E --> F{User Action}
    F -->|Select Dataset| G[get_dataset]
    F -->|Refine Search| A

    G --> H[Full Metadata Loaded]
    H --> I[find_related_datasets]
    I --> J[Discover Similar Datasets]

    H --> K[preview_dataset]
    K --> L[Sample Data Loaded]
`} />
```

**Implementation note:** Component already exists in `docs/components/mdx/mermaid.tsx` with:
- Theme-aware rendering (light/dark mode switching)
- Client-side only (avoids SSR hydration issues)
- Caching (same diagram reused across renders)

**Source:** Existing codebase (docs/components/mdx/mermaid.tsx) + Mermaid docs

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static site generators (Jekyll, Hugo) | Next.js App Router with RSC | 2023-2024 | Server components reduce client JS, faster loads |
| Manual TOC generation | Automatic heading extraction | Fumadocs v13+ | TOC always in sync with content |
| Custom accordion components | Radix UI primitives | 2023+ | Accessibility built-in, less maintenance |
| PlantUML diagrams (Java) | Mermaid (JavaScript) | 2020+ | No server-side rendering, theme-aware |
| Separate mobile/desktop layouts | Responsive DocsLayout | Fumadocs v14+ | Single layout adapts, less code |
| Client-side search (Algolia only) | Built-in Orama search | Fumadocs v15+ | Zero-config search, no external API |

**Deprecated/outdated:**
- Custom sidebar navigation: Fumadocs DocsLayout handles this (sidebar, breadcrumbs, mobile menu)
- Manual search indexing: Fumadocs auto-indexes MDX content
- Client-side TOC generation: Use server-side extraction from MDX compilation

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Accordion Item Count**
   - What we know: 25 tools in API reference section
   - What's unclear: Best UX for 25 accordions on one page vs. split into categories
   - Recommendation: Group tools by module (discovery, analysis, preview, vocabularies, management) into 5 pages with 3-7 accordions each

2. **Search Ranking Tuning**
   - What we know: Fumadocs Orama provides full-text search
   - What's unclear: Default ranking may not prioritize Getting Started over deep reference
   - Recommendation: Test search with common queries ("how to search", "installation"), adjust ranking if needed (Phase 24 validation)

3. **Mobile Table Overflow**
   - What we know: TypeTable component renders parameter tables
   - What's unclear: How TypeTable handles wide parameter names on mobile (320px screens)
   - Recommendation: Test on mobile devices, add horizontal scroll if needed

4. **Bilingual Content Strategy**
   - What we know: i18n deferred to v1.3
   - What's unclear: Whether to prepare content structure now (lang folders) or add later
   - Recommendation: Use single language (English) for v1.2, lang structure can be added non-disruptively in v1.3

## Sources

### Primary (HIGH confidence)
- Fumadocs Official Documentation - https://fumadocs.dev/docs (framework capabilities)
- Existing Codebase - docs/package.json, docs/source.config.ts, docs/app/[lang]/docs/layout.tsx (verified installed packages)
- Fumadocs Tabs Component - https://fumadocs.dev/docs/ui/components/tabs (COMP-01 implementation)
- Fumadocs Accordion Component - https://fumadocs.dev/docs/ui/components/accordion (COMP-05 implementation)
- Fumadocs DocsLayout - https://fumadocs.dev/docs/ui/layouts/docs (FOUND-03, FOUND-04, FOUND-05)
- Fumadocs Breadcrumb - https://fumadocs.dev/docs/headless/components/breadcrumb (FOUND-04)
- Fumadocs TOC - https://fumadocs.dev/docs/headless/components/toc (FOUND-03)
- Fumadocs Search - https://fumadocs.dev/docs/ui/search (FOUND-02)
- Fumadocs Page Tree - https://fumadocs.dev/docs/headless/page-tree (navigation structure)
- Existing Mermaid Component - docs/components/mdx/mermaid.tsx (COMP-06 implementation)

### Secondary (MEDIUM confidence)
- Diataxis Framework - https://diataxis.fr/ (content organization theory)
- Next.js App Router Docs - https://nextjs.org/docs/app (performance optimization)
- v1.2 Research - .planning/research-v1.2/STACK.md, ARCHITECTURE.md (project context)

### Tertiary (LOW confidence)
- WebSearch: Next.js documentation site performance optimization (generic best practices, not Fumadocs-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in package.json with exact versions
- Architecture: HIGH - Patterns verified from Fumadocs docs and existing codebase
- Components: HIGH - Tabs, Accordion, Mermaid documented and code exists
- Navigation: HIGH - DocsLayout provides breadcrumbs, TOC, prev/next built-in
- Pitfalls: MEDIUM - Based on Fumadocs docs and general patterns, not project-specific experience

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable Fumadocs API, minor version updates expected)
