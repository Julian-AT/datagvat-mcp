# Phase 8: Workflow Optimization & Fumadocs Documentation - Research

**Researched:** 2026-01-17
**Domain:** Documentation framework (Fumadocs) + Python async workflow optimization
**Confidence:** MEDIUM

## Summary

Phase 8 involves two distinct tracks: (1) optimizing the existing FastMCP Python codebase workflow, and (2) creating a comprehensive bilingual documentation site using Fumadocs, a modern React.js documentation framework.

**Fumadocs** is a Next.js-based documentation framework with native MDX support, built-in internationalization, and extensive UI components. The current stable versions are fumadocs-core 16.4.7, fumadocs-ui 16.4.7, and fumadocs-mdx 14.2.5. The framework requires Node.js 22+ and uses the Next.js App Router exclusively.

For bilingual German/English documentation, Fumadocs provides first-class i18n support through `defineI18n()` with locale-based routing, content organization patterns using language-suffixed files (e.g., `index.en.mdx`, `index.de.mdx`), and automatic language detection. The framework handles search, navigation, and UI element localization out-of-the-box.

The Python codebase already follows solid async patterns with FastMCP 2.14+, structured middleware, comprehensive testing with pytest-asyncio, and Ruff for linting. Workflow optimization should focus on documentation completeness, type hint coverage, error handling consistency, and build/deployment automation rather than architectural changes.

**Primary recommendation:** Use Fumadocs with Next.js 15+ App Router, deploy to Vercel, organize content with language-suffixed MDX files, and generate Python API documentation manually from docstrings into MDX format (no automatic generation tools needed).

## Standard Stack

The established libraries/tools for building a Fumadocs documentation site with i18n:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-core | 16.4.7 | Server-side functions, source API, i18n logic | Official core library, required for all setups |
| fumadocs-ui | 16.4.7 | Pre-built documentation UI components | Official theme with search, TOC, breadcrumbs |
| fumadocs-mdx | 14.2.5 | MDX content source adapter | Recommended content layer for Fumadocs |
| next | 15.x/16.x | React framework with App Router | Official primary framework for Fumadocs |
| react | 19.x | UI library | Required by Next.js and Fumadocs UI |
| typescript | 5.9+ | Type safety | All Fumadocs packages are ESM-only TypeScript |
| tailwindcss | 4.x | Styling | Used by fumadocs-ui theme |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fumadocs-openapi | 10.2.4 | OpenAPI schema documentation | If you have OpenAPI/Swagger specs to document |
| lucide-react | latest | Icons | Icon system used by fumadocs-ui |
| tailwind-merge | latest | ClassName utilities | Merging Tailwind classes in components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs | Docusaurus | Docusaurus is mature React-based but uses classic router, less modern than Fumadocs |
| Fumadocs | Nextra | Nextra is Next.js-based but less feature-complete, Fumadocs has better i18n |
| Fumadocs MDX | Contentlayer | Contentlayer is unmaintained as of 2024, Fumadocs MDX is actively developed |
| Next.js | Astro/Waku | Fumadocs officially supports these but Next.js has best integration and examples |

**Installation:**
```bash
# Create new Fumadocs site (automated setup)
npm create fumadocs-app

# Or manual installation in existing project
npm install fumadocs-core fumadocs-ui fumadocs-mdx next react react-dom
npm install -D typescript tailwindcss postcss
```

## Architecture Patterns

### Recommended Project Structure
```
docs/                           # Fumadocs documentation site (separate from Python app)
├── app/
│   ├── [lang]/                 # i18n dynamic route segment
│   │   ├── (home)/             # Home page route group
│   │   │   └── page.tsx
│   │   ├── docs/
│   │   │   ├── [[...slug]]/    # Catch-all docs route
│   │   │   │   └── page.tsx    # Dynamic page renderer
│   │   │   └── layout.tsx      # Docs layout with sidebar
│   │   └── layout.tsx          # Root layout with i18n provider
│   └── api/
│       └── search/             # Search API endpoint
│           └── route.ts
├── content/
│   └── docs/                   # MDX documentation files
│       ├── index.mdx           # English homepage
│       ├── index.de.mdx        # German homepage
│       ├── getting-started.mdx
│       ├── getting-started.de.mdx
│       ├── api/
│       │   ├── tools.mdx
│       │   ├── tools.de.mdx
│       │   ├── resources.mdx
│       │   └── resources.de.mdx
│       └── meta.json           # Navigation structure
├── lib/
│   ├── i18n.ts                 # i18n configuration
│   └── source.ts               # Content source loader
├── source.config.ts            # Fumadocs MDX config
├── next.config.mjs             # Next.js configuration
├── package.json
└── tsconfig.json
```

### Pattern 1: i18n Configuration
**What:** Centralized language configuration with loader integration
**When to use:** Always for multi-language sites
**Example:**
```typescript
// lib/i18n.ts
import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'de'],
});

// lib/source.ts
import { loader } from 'fumadocs-core/source';
import { docs } from 'fumadocs-mdx:collections/server';
import { i18n } from '@/lib/i18n';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  i18n,
});
```

### Pattern 2: Language-Suffixed Content Files
**What:** Organize translations using file suffixes instead of directories
**When to use:** Fumadocs i18n standard pattern
**Example:**
```
content/docs/
├── index.mdx        # English (default language, no suffix)
├── index.de.mdx     # German version
├── features.mdx     # English
└── features.de.mdx  # German
```

### Pattern 3: UI Translation with defineI18nUI
**What:** Translate UI elements (search, TOC labels, etc.) per language
**When to use:** Always for i18n sites with fumadocs-ui
**Example:**
```typescript
// app/[lang]/layout.tsx
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    de: {
      displayName: 'Deutsch',
      toc: 'Inhaltsverzeichnis',
      search: 'Dokumentation durchsuchen',
      lastUpdate: 'Zuletzt aktualisiert am',
      searchNoResult: 'Keine Ergebnisse',
      previousPage: 'Vorherige Seite',
      nextPage: 'Nächste Seite',
      chooseLanguage: 'Sprache wählen',
    },
  },
});

export default async function Layout({ params, children }) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <body>
        <RootProvider i18n={provider(lang)}>{children}</RootProvider>
      </body>
    </html>
  );
}
```

### Pattern 4: Dynamic Page Rendering from MDX
**What:** Render MDX content with fumadocs-ui page components
**When to use:** Standard pattern for all documentation pages
**Example:**
```typescript
// app/[lang]/docs/[[...slug]]/page.tsx
import { source } from '@/lib/source';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';

export default async function Page({ params }) {
  const { slug, lang } = await params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}
```

### Pattern 5: Python Workflow Best Practices (FastMCP)
**What:** Async-first architecture with structured middleware and dependency injection
**When to use:** All FastMCP-based MCP servers
**Example:**
```python
# Current structure is GOOD - maintain this pattern
@asynccontextmanager
async def lifespan(mcp: FastMCP):
    settings = get_settings()
    client = PiveauClient(...)
    try:
        yield AppState(settings=settings, piveau_client=client)
    finally:
        await client.close()

mcp = FastMCP(
    name="austria-data",
    instructions="...",
    lifespan=lifespan,
    middleware=[
        StructuredLoggingMiddleware(...),
        ErrorHandlingMiddleware(),
        RetryMiddleware(...),
        RateLimitingMiddleware(...),
    ],
)
```

### Anti-Patterns to Avoid
- **Directory-based i18n in Fumadocs:** Don't create `/content/docs/en/` and `/content/docs/de/` directories. Use file suffixes instead (e.g., `page.de.mdx`). The loader expects flat structure with suffixes.
- **Mixing client/server components incorrectly:** Don't use `'use client'` in page.tsx files that render MDX. Keep pages as Server Components and MDX as RSC.
- **Manual routing for i18n:** Don't create custom middleware for language detection. Use Fumadocs' built-in `createI18nMiddleware()` or rely on `[lang]` dynamic segments.
- **Global state in Python async:** Don't use module-level mutable state. Use lifespan context and dependency injection pattern shown above.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Documentation search | Custom search index/UI | fumadocs-core built-in search (Orama/Algolia) | Handles fuzzy search, indexing, keyboard shortcuts, structured data extraction |
| Table of contents | Parse headings manually | fumadocs-ui `<DocsPage toc={page.data.toc}>` | Automatic heading extraction, active anchor tracking, scroll behavior |
| MDX compilation | Custom MDX pipeline | fumadocs-mdx with default preset | Includes plugins for code blocks, callouts, file trees, type tables |
| i18n routing | Next.js middleware + cookies | fumadocs-core `defineI18n()` + `[lang]` routes | Handles locale detection, fallbacks, URL generation, page tree per language |
| Syntax highlighting | Prism/highlight.js integration | Included in fumadocs-ui code blocks | Supports Shiki with line numbers, highlighting, copy button |
| API reference UI | Custom components for params/responses | fumadocs-openapi package | Generates interactive API docs from OpenAPI schemas |
| Navigation sidebar | Custom tree rendering | fumadocs-ui sidebar components | Handles collapsing, active states, icons, multi-level nesting |
| Python docstring parsing | Custom AST walker | Manual extraction to MDX | No mature tool integrates Python → Fumadocs cleanly; manual is clearer |

**Key insight:** Fumadocs provides a complete documentation DX out-of-the-box. The only custom work should be writing content and configuring i18n. Avoid reinventing search, navigation, or MDX processing.

## Common Pitfalls

### Pitfall 1: Node.js Version Mismatch
**What goes wrong:** Fumadocs requires Node.js 22+ but project uses older version, causing cryptic build errors
**Why it happens:** Official docs mention this requirement but it's easy to miss
**How to avoid:** Add `.nvmrc` file with `22` and use `nvm use` before running `npm install`
**Warning signs:** Errors during `npm create fumadocs-app` or strange TypeScript compilation failures

### Pitfall 2: Missing Language Files Cause 404s
**What goes wrong:** Creating `page.mdx` but not `page.de.mdx` results in 404 for German users
**Why it happens:** Fumadocs i18n expects complete language coverage or fallback configuration
**How to avoid:** Either (a) provide all translations upfront, or (b) configure `fallbackLanguage` in `defineI18n()` to serve default language when translation missing
**Warning signs:** Works in English but 404s when switching languages

### Pitfall 3: Incorrect `source.config.ts` Schema
**What goes wrong:** Frontmatter validation fails silently or TypeScript types are wrong
**Why it happens:** Not importing/using `frontmatterSchema` from fumadocs-mdx
**How to avoid:** Use the provided schemas:
```typescript
import { frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { schema: frontmatterSchema },
  meta: { schema: metaSchema },
});
```
**Warning signs:** TypeScript errors in page.tsx when accessing `page.data`, frontmatter fields not validated

### Pitfall 4: Forgetting to Export `generateStaticParams`
**What goes wrong:** Next.js build succeeds but pages don't pre-render, causing slow dynamic rendering
**Why it happens:** Static export optimization requires explicit `generateStaticParams()`
**How to avoid:** Always add to page.tsx:
```typescript
export async function generateStaticParams() {
  return source.generateParams();
}
```
**Warning signs:** Fast build time (no pre-rendering), slow page loads in production

### Pitfall 5: Python Type Hints Incomplete
**What goes wrong:** IDE autocomplete breaks, runtime type errors not caught, documentation unclear
**Why it happens:** Adding features quickly without maintaining type coverage
**How to avoid:** Run `mypy app/` regularly, enforce type hints in code review
**Warning signs:** PyCharm/VSCode shows `Any` types, function signatures lack return types

### Pitfall 6: Overcomplicating API Documentation Generation
**What goes wrong:** Attempting to auto-generate MDX from Python docstrings results in poorly formatted docs
**Why it happens:** No tool seamlessly converts Python to Fumadocs MDX with i18n
**How to avoid:** Manually write API reference MDX files. Extract docstrings/type hints as reference but format for documentation clarity.
**Warning signs:** Spending days configuring Sphinx/mkdocstrings/pydoc when manual MDX takes hours

### Pitfall 7: Mixing Deployment Models
**What goes wrong:** Trying to deploy Fumadocs site as static export when it requires server features
**Why it happens:** Confusion about Next.js output modes
**How to avoid:** Use Vercel (zero-config) or Next.js server deployment (not `output: 'export'`). Search and dynamic routes need server runtime.
**Warning signs:** Build succeeds with `next build` but search doesn't work, dynamic routes 404

## Code Examples

Verified patterns from official sources:

### Complete i18n Source Configuration
```typescript
// source.config.ts
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    // Custom MDX plugins if needed
  },
});

// lib/i18n.ts
import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'de'],
});

// lib/source.ts
import { loader } from 'fumadocs-core/source';
import { i18n } from '@/lib/i18n';
import { docs } from 'fumadocs-mdx:collections/server';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  i18n,
});
```

### Python Docstring to MDX Conversion Pattern
```python
# app/tools/discovery.py
def search_datasets(
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> list[Dataset]:
    """Search for datasets across all catalogues.

    Args:
        query: Search keywords
        limit: Maximum results to return (1-100)
        offset: Pagination offset

    Returns:
        List of matching datasets

    Raises:
        ToolError: If API request fails
    """
```

Becomes MDX:

```mdx
---
title: search_datasets
description: Search for datasets across all catalogues
---

## search_datasets

Search for datasets across all catalogues using keywords.

### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | required | Search keywords |
| `limit` | `number` | `20` | Maximum results to return (1-100) |
| `offset` | `number` | `0` | Pagination offset |

### Returns

Returns a list of matching datasets with metadata.

### Errors

Throws `ToolError` if the API request fails.

### Example

```python
# Example usage
results = search_datasets("climate", limit=10)
```
```

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Contentlayer | fumadocs-mdx | 2024 | Contentlayer unmaintained, fumadocs-mdx is actively developed |
| Next.js Pages Router | Next.js App Router | 2023+ | Fumadocs requires App Router, no Pages Router support |
| Docusaurus | Fumadocs/Nextra | 2024+ | React-based docs moving to App Router frameworks |
| Sphinx for Python APIs | Manual MDX | Ongoing | No good Sphinx → Fumadocs MDX bridge, manual clearer |
| Directory-based i18n | File suffix i18n | Fumadocs pattern | Simpler structure, easier to maintain translations side-by-side |
| Algolia DocSearch | Fumadocs + Orama | 2025+ | Orama provides local-first search, Algolia still supported |

**New tools/patterns to consider:**
- **fumadocs-openapi**: Generate API docs from OpenAPI schemas (v10.2.4 current)
- **Tailwind CSS 4.x**: New CSS-first architecture, faster builds
- **Next.js 15/16**: Improved caching, faster HMR, better server components

**Deprecated/outdated:**
- **Contentlayer**: Project archived, don't use for new projects
- **Next.js Pages Router**: Not supported by Fumadocs
- **remark-mdx-frontmatter**: Built into fumadocs-mdx, no external plugin needed

## Open Questions

Things that couldn't be fully resolved:

1. **MCP Protocol Schema Documentation Format**
   - What we know: MCP defines tools/resources/prompts with JSON Schema
   - What's unclear: Best way to represent JSON Schema in MDX for readability
   - Recommendation: Use fumadocs-ui type table components or convert to parameter tables manually

2. **Python API Auto-Documentation Tooling**
   - What we know: Sphinx/mkdocstrings generate HTML docs, not Fumadocs-compatible MDX
   - What's unclear: Whether any tool can bridge Python → Fumadocs cleanly in 2026
   - Recommendation: Manually write API reference MDX, extracting from docstrings as source of truth but optimizing for documentation clarity

3. **Deployment Without Vercel**
   - What we know: Fumadocs works best on Vercel (zero-config)
   - What's unclear: Whether GitHub Pages (static) or Netlify work with full features
   - Recommendation: Use Vercel for simplicity or Next.js-compatible hosting with server runtime (search requires server)

4. **Workflow Optimization Scope**
   - What we know: Current codebase has solid structure (async, middleware, testing)
   - What's unclear: Specific areas needing optimization beyond documentation
   - Recommendation: Focus on (a) type coverage with mypy, (b) docstring completeness, (c) CI/CD automation for tests/linting

## Sources

### Primary (HIGH confidence)
- https://www.fumadocs.dev/ - Official Fumadocs documentation
- https://www.fumadocs.dev/docs/headless - Fumadocs Core API documentation
- https://www.fumadocs.dev/docs/headless/internationalization - i18n configuration guide
- https://www.fumadocs.dev/docs/headless/source-api - Source loader API reference
- https://www.fumadocs.dev/docs/mdx - Fumadocs MDX configuration
- https://github.com/fuma-nama/fumadocs/tree/main/examples/i18n - Official i18n example (verified code)
- https://github.com/fuma-nama/fumadocs/tree/main/examples/openapi - Official OpenAPI example

### Secondary (MEDIUM confidence)
- npm registry versions for fumadocs-core (16.4.7), fumadocs-ui (16.4.7), fumadocs-mdx (14.2.5), fumadocs-openapi (10.2.4)
- Next.js App Router documentation (referenced by Fumadocs as required)
- FastMCP documentation (verified middleware patterns in pyproject.toml)

### Tertiary (LOW confidence)
- WebSearch results for Python documentation tools (Sphinx, mkdocstrings) - no direct Fumadocs integration found, marked for validation
- General Python async best practices - not specific to FastMCP, need domain validation

## Metadata

**Confidence breakdown:**
- Fumadocs setup and i18n: HIGH - Official docs and verified example code
- API documentation generation: MEDIUM - Verified Fumadocs patterns but no Python auto-generation tool found
- Workflow optimization: MEDIUM - Current codebase structure is sound but specific optimization targets require codebase audit
- Deployment: MEDIUM - Vercel verified, other platforms need testing

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days for stable ecosystem, Fumadocs actively maintained)
