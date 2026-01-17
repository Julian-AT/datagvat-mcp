# Fumadocs Architecture Research

**Researched:** 2026-01-17
**Domain:** Documentation site architecture (Next.js + Fumadocs)
**Confidence:** HIGH

## Summary

Fumadocs follows a Next.js App Router architecture with specific patterns for i18n, styling, and search. The current Austria MCP implementation has architectural issues that need correction:

**Current Issues:**
1. **Missing middleware** - i18n routing requires Next.js middleware to function correctly
2. **Incomplete i18n setup** - Route structure exists but middleware layer is absent
3. **No search infrastructure** - Search UI exists but no backend/index configured
4. **Tailwind v4 correctly configured** - Using proper CSS imports pattern

**Primary recommendation:** Implement missing middleware layer, configure search backend (Orama), and enhance metadata generation with proper page-level customization.

## Standard Architecture Layers

### Layer 1: Route Structure (App Router)

Fumadocs uses Next.js App Router with specific conventions:

```
app/
├── [lang]/                           # Language dynamic route
│   ├── layout.tsx                    # Language-aware root layout
│   └── docs/
│       ├── layout.tsx                # DocsLayout wrapper
│       └── [[...slug]]/
│           └── page.tsx              # Catch-all docs page
├── layout.tsx                        # Root HTML layout (missing in current)
├── api/                              # API routes (for search, etc.)
└── global.css                        # Tailwind + Fumadocs CSS
```

**Why this structure:**
- `[lang]` enables locale-aware routing
- `[[...slug]]` catch-all handles all doc paths
- Separate layouts at each level allow progressive enhancement
- API routes serve search indexes and dynamic content

**Current deviation:** Missing root `app/layout.tsx` - language layout is at wrong level

### Layer 2: Middleware (CRITICAL - Currently Missing)

**File:** `middleware.ts` (root level, next to app/)

```typescript
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';

export default createI18nMiddleware(i18n);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**What middleware does:**
- Redirects users to correct locale based on browser preferences
- Handles locale prefix visibility (controlled by `hideLocale` option)
- Uses `NextResponse.rewrite` when hiding locale prefixes
- Must exclude API routes, static assets, Next.js internals

**Why currently broken:** Without middleware, locale routing relies only on manual URL entry. No automatic redirects, no locale detection, no proper prefix handling.

**Impact:** HIGH - i18n essentially non-functional without this

### Layer 3: i18n Configuration

**File:** `lib/i18n.ts`

**Current implementation:** ✓ Correct
```typescript
import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'de'],
});
```

**Options available:**

| Option | Current | Recommended | Impact |
|--------|---------|-------------|--------|
| `hideLocale` | undefined (never) | `'default-locale'` | Hides `/en/` prefix, keeps `/de/` |
| `fallbackLanguage` | undefined (defaults to 'en') | `null` or explicit | Controls missing translation behavior |

**Locale prefix modes:**
- `'never'` (default): Always show prefix (`/en/docs`, `/de/docs`)
- `'default-locale'`: Hide default only (`/docs`, `/de/docs`)
- `'always'`: Hide all prefixes, use cookies (⚠️ SEO issues, not recommended for static sites)

**Recommendation:** Add `hideLocale: 'default-locale'` for cleaner English URLs

### Layer 4: Content Organization

**Current pattern:** ✓ Correct (Dot Parser)
```
content/docs/
  index.mdx
  index.de.mdx
  guides/
    setup.mdx
    setup.de.mdx
```

**Alternative pattern:** Directory Parser
```
content/docs/
  en/
    index.mdx
    guides/
      setup.mdx
  de/
    index.mdx
    guides/
      setup.mdx
```

**Current choice is correct because:**
- Easier to see translation pairs side-by-side
- Less directory nesting
- Default Fumadocs pattern
- Matches existing implementation

**Configuration in source.config.ts:**
```typescript
export const docs = defineDocs({
  dir: 'content/docs',
  // parser: 'dot' is default
});
```

### Layer 5: Source Configuration

**File:** `source.config.ts`

**Current implementation:** ✓ Mostly correct

**Enhancement needed:**
```typescript
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,  // ✓ Already enabled for LLM text
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      inline: 'tailing-curly-colon',
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        ...(rehypeCodeDefaultOptions.transformers ?? []),
      ],
    },
  },
  // Consider adding for faster rebuilds:
  // experimentalBuildCache: './.cache/fumadocs',
});
```

**Performance optimization available:**
- `experimentalBuildCache`: Cache compiled MDX for faster rebuilds
- `docs.async`: Use async imports (reduces initial bundle)
- `docs.dynamic`: On-demand compilation (requires search service)

**Current choice is correct for project size** - standard mode appropriate

### Layer 6: Loader Configuration

**File:** `lib/source.ts`

**Current implementation:** ✓ Correct
```typescript
import { docs } from '../.source/server';
import { loader } from 'fumadocs-core/source';
import { i18n } from './i18n';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  i18n,  // ✓ i18n integrated
  plugins: [lucideIconsPlugin()],  // ✓ Icon support
});
```

**No changes needed** - properly integrates i18n and plugins

## Styling Architecture

### Tailwind v4 Integration

**Current implementation:** ✓ CORRECT

**File:** `app/global.css`
```css
@import "tailwindcss";
@import "fumadocs-ui/css/solar.css";      /* Color preset */
@import "fumadocs-ui/css/preset.css";     /* Component styles */

@theme {
  /* Custom variables in @theme block */
  --color-austria-red: #b91e23;
  --color-austria-red-hover: #a01a1f;
}
```

**Why this is correct:**
- Tailwind v4 uses CSS imports instead of config file
- Fumadocs UI **requires** Tailwind v4 (not v3)
- Theme variables defined in `@theme` block (v4 syntax)
- Solar preset provides built-in color scheme

**Available preset themes:**
- neutral (default)
- black
- vitepress
- dusk
- catppuccin
- ocean
- purple
- **solar** (current - good choice)
- emerald
- ruby
- aspen

**CSS Variable Customization:**

Fumadocs uses `fd-` prefixed variables:
```css
--color-fd-background
--color-fd-foreground
--color-fd-primary
--color-fd-border
--color-fd-accent
```

**Current brand integration strategy:**
- Solar preset provides base theme
- Custom Austria red defined as CSS variables
- Can be referenced in Tailwind classes or CSS

**No Tailwind config file needed** - v4 uses CSS-first approach

### Dark Mode

**Provider:** `next-themes` (built-in via `RootProvider`)

**Current setup:** ✓ Correct
```tsx
<RootProvider i18n={provider(lang)}>
  {children}
</RootProvider>
```

**Dark mode automatic** - no additional configuration needed

## Search Architecture

### Current State: NOT IMPLEMENTED

Search UI exists in `RootProvider` but no backend configured.

### Recommended Implementation: Orama (Built-in)

**Why Orama:**
- Built into Fumadocs Core
- Works with static generation
- No external service required
- Sufficient for project size (< 100 pages)

**Alternative:** Algolia (for very large sites, requires external service)

### Search Implementation Steps

**Step 1: Create Search API Route**

**File:** `app/api/search/route.ts`

```typescript
import { source } from '@/lib/source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const { GET } = createSearchAPI('advanced', {
  indexes: source.getPages().map((page) => ({
    title: page.data.title,
    description: page.data.description,
    content: page.data.exports.getText('processed'),
    url: page.url,
    locale: page.locale,
  })),
});
```

**Key details:**
- `'advanced'` mode for full-text search
- Uses `getText('processed')` for clean content (already enabled in config)
- Includes locale for i18n support
- Generates index at build time

**Step 2: Configure Search Dialog**

**File:** `app/[lang]/layout.tsx`

```tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import { SearchDialog } from 'fumadocs-ui/components/dialog/search-default';

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <RootProvider
          i18n={provider(lang)}
          search={{
            enabled: true,
            SearchDialog,  // Default Fumadocs search dialog
            options: {
              type: 'fetch',
              api: '/api/search',
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
```

**Step 3: Search Hotkeys**

**Default:** Cmd/Ctrl + K (already works with default config)

**Custom hotkeys:**
```tsx
search={{
  hotKey: [
    { display: 'K', key: 'k' },
    { display: '/', key: '/' },  // Add slash key
  ],
}}
```

### Search Architecture Diagram

```
┌─────────────────────────────────────┐
│ Build Time                          │
├─────────────────────────────────────┤
│ MDX Files → source.getPages()       │
│           → getText('processed')    │
│           → Search Index            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Runtime                             │
├─────────────────────────────────────┤
│ User presses Cmd+K                  │
│ → SearchDialog opens                │
│ → Types query                       │
│ → Fetches /api/search?q=...        │
│ → Orama searches index              │
│ → Returns ranked results            │
│ → Displays with highlights          │
└─────────────────────────────────────┘
```

### i18n Search Support

**Locale filtering automatic** when locale included in index:

```typescript
indexes: source.getPages().map((page) => ({
  // ...
  locale: page.locale,  // Enable per-locale search
})),
```

Search dialog will automatically filter to current language.

## SEO and Metadata

### Current Implementation

**File:** `app/[lang]/docs/[[...slug]]/page.tsx`

**Current metadata generation:** ✓ Basic pattern correct
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang, slug = [] } = await params;
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
```

### Recommended Enhancement

**Add OpenGraph and Twitter cards:**

```typescript
import { metadataImage } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang, slug = [] } = await params;
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      url: `https://docs.austria-mcp.dev/${lang}/docs/${slug.join('/')}`,
      locale: lang,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(page.data.title)}`,
          width: 1200,
          height: 630,
          alt: page.data.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
    },
    alternates: {
      languages: {
        en: `/en/docs/${slug.join('/')}`,
        de: `/de/docs/${slug.join('/')}`,
      },
    },
  };
}
```

### Layout-level Metadata

**File:** `app/[lang]/docs/layout.tsx`

**Current:** Missing metadata
```typescript
export function generateMetadata() {
  return {
    title: 'Austria MCP Documentation',
    description: 'Comprehensive guide to using the Austria MCP server',
  };
}
```

**Recommended enhancement:**
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const titles = {
    en: 'Austria MCP Documentation',
    de: 'Austria MCP Dokumentation',
  };

  const descriptions = {
    en: 'Comprehensive guide to using the Austria MCP server',
    de: 'Umfassender Leitfaden zur Verwendung des Austria MCP Servers',
  };

  return {
    title: {
      template: '%s | Austria MCP',
      default: titles[lang as keyof typeof titles],
    },
    description: descriptions[lang as keyof typeof descriptions],
    metadataBase: new URL('https://docs.austria-mcp.dev'),
  };
}
```

**Why this pattern:**
- `title.template` creates consistent page titles
- Locale-specific strings for better SEO
- `metadataBase` ensures absolute URLs in metadata

### Static Generation

**Current:** ✓ Correct
```typescript
export async function generateStaticParams() {
  return source.generateParams();
}
```

**What this does:**
- Pre-renders all docs pages at build time
- Enables static export (no server needed)
- Maximum performance and SEO benefit

## Root Layout Architecture (FIX NEEDED)

### Current Issue

**Missing:** `app/layout.tsx`
**Exists:** `app/[lang]/layout.tsx` (should be nested inside root)

### Correct Structure

**File:** `app/layout.tsx` (ROOT LAYOUT)
```tsx
import './global.css';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  metadataBase: new URL('https://docs.austria-mcp.dev'),
};
```

**File:** `app/[lang]/layout.tsx` (LANGUAGE LAYOUT)
```tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: { displayName: 'English' },
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

export default async function LanguageLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <RootProvider
      i18n={provider(lang)}
      search={{
        enabled: true,
        options: {
          type: 'fetch',
          api: '/api/search',
        },
      }}
    >
      {children}
    </RootProvider>
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
```

**Why this matters:**
- Root layout sets `<html>` (required by Next.js)
- Language layout handles provider and i18n
- Proper nesting enables route-specific layouts
- `suppressHydrationWarning` only in root (prevents dark mode flash)

## Component Architecture

### Page Structure

**File:** `app/[lang]/docs/[[...slug]]/page.tsx`

**Current:** ✓ Correct pattern
```tsx
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';

export default async function Page({ params }) {
  const { lang, slug = [] } = await params;
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  const MDX = page.data.body;
  const components = useMDXComponents({
    a: createRelativeLink(source, page),
  });

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}
```

**Component breakdown:**
- `DocsPage`: Container with TOC sidebar
- `DocsTitle`: H1 with proper styling
- `DocsDescription`: Lead paragraph
- `DocsBody`: Prose container for MDX content
- `createRelativeLink`: Converts relative MD links to Next.js links

**No changes needed** - follows best practices

### Layout Structure

**File:** `app/[lang]/docs/layout.tsx`

**Current:** ✓ Good foundation
```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Logo } from '@/components/logo';
import { LanguageToggle } from '@/components/language-toggle';

export default async function Layout({ params, children }) {
  const { lang } = await params;

  return (
    <DocsLayout
      tree={source.pageTree[lang]}
      nav={{
        title: <Logo />,
        children: <LanguageToggle lang={lang} />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
```

**Enhancement opportunity (optional):**
```tsx
<DocsLayout
  tree={source.pageTree[lang]}
  nav={{
    title: <Logo />,
    children: <LanguageToggle lang={lang} />,
  }}
  links={[
    { text: 'Documentation', url: `/${lang}/docs`, active: true },
    { text: 'API Reference', url: `/${lang}/api` },
    { text: 'GitHub', url: 'https://github.com/...', external: true },
  ]}
>
  {children}
</DocsLayout>
```

## Build Order and Dependencies

### Phase Structure Implications

Based on architectural requirements, suggested build order:

**Phase 1: Fix Foundation (HIGH PRIORITY)**
1. Create root `app/layout.tsx`
2. Move language logic to `app/[lang]/layout.tsx`
3. Add middleware.ts for i18n routing
4. Test locale switching and routing

**Why first:** Foundation must be correct before building on it

**Phase 2: Search Infrastructure (MEDIUM PRIORITY)**
1. Create `/api/search/route.ts`
2. Configure search dialog in RootProvider
3. Test search across languages
4. Optimize search index (if needed)

**Why second:** Requires foundation but independent of content

**Phase 3: Enhanced Metadata (LOW PRIORITY)**
1. Add OpenGraph metadata
2. Create locale-specific descriptions
3. Add alternate language links
4. Optional: OG image generation API

**Why third:** Improves SEO but doesn't affect functionality

**Phase 4: Styling Refinement (ONGOING)**
1. Refine custom theme variables
2. Component style overrides (if needed)
3. Brand consistency pass
4. Accessibility audit

**Why last:** Can iterate independently

### Dependency Graph

```
Root Layout (app/layout.tsx)
    ↓
Middleware (middleware.ts) + i18n Config (lib/i18n.ts)
    ↓
Language Layout (app/[lang]/layout.tsx) → Search API (api/search/route.ts)
    ↓                                              ↓
Docs Layout (docs/layout.tsx)              Search Dialog Config
    ↓
Page (docs/[[...slug]]/page.tsx)
```

**Critical path:** Root → Middleware → Language Layout
**Parallel work:** Search API can be built while fixing layouts

## Architecture Anti-Patterns to Avoid

### 1. Cookie-based i18n (`hideLocale: 'always'`)

**Why avoid:**
- Breaks static generation
- SEO nightmare (URLs don't indicate language)
- Caching issues
- Not recommended by Fumadocs

**Use instead:** `hideLocale: 'default-locale'`

### 2. Dynamic mode without search service

**Why avoid:**
- Loses static generation benefits
- Requires API route for every page
- Search becomes complex
- Slower performance

**Use instead:** Standard mode with static generation

### 3. Tailwind v3 config file

**Why avoid:**
- Fumadocs UI requires Tailwind v4
- CSS imports won't work with v3 config
- Version mismatch causes styling issues

**Use instead:** CSS imports in global.css (current approach ✓)

### 4. Custom MDX components without `createRelativeLink`

**Why avoid:**
- Relative links break navigation
- No locale awareness
- Misses prefetching benefits

**Use instead:** `createRelativeLink(source, page)` (current approach ✓)

### 5. Missing generateStaticParams

**Why avoid:**
- Dynamic rendering on every request
- No pre-rendering benefits
- Slower loading
- Higher server costs

**Use instead:** `generateStaticParams()` everywhere (current approach ✓)

## Quality Checklist

**Foundation (CRITICAL):**
- [ ] Root layout exists at `app/layout.tsx`
- [ ] Middleware exists at `middleware.ts`
- [ ] i18n config defines languages
- [ ] Static params generation on all routes

**i18n (CRITICAL):**
- [ ] Middleware redirects to correct locale
- [ ] Locale prefix behavior configured
- [ ] Translation files use dot parser
- [ ] Language toggle works

**Styling (CURRENT):**
- [x] Tailwind v4 CSS imports
- [x] Fumadocs preset imported
- [x] Theme variables defined
- [ ] Dark mode tested

**Search (NOT IMPLEMENTED):**
- [ ] API route at `/api/search/route.ts`
- [ ] Search dialog configured
- [ ] Search hotkeys work
- [ ] Locale filtering works

**SEO (BASIC):**
- [x] Page-level metadata
- [ ] OpenGraph metadata
- [ ] Alternate language links
- [ ] Metadata base URL

**Performance (GOOD):**
- [x] Static generation enabled
- [x] generateStaticParams defined
- [ ] Build cache enabled (optional)

## Sources

### Primary (HIGH confidence)
- [Fumadocs Full Documentation](https://www.fumadocs.dev/llms-full.txt) - Complete framework reference
- [Fumadocs i18n Documentation](https://fumadocs.dev/docs/headless/internationalization) - Middleware setup, locale configuration
- [Fumadocs Search UI](https://fumadocs.dev/docs/ui/search) - Search dialog configuration
- [Fumadocs Theme](https://fumadocs.dev/docs/ui/theme) - Tailwind v4 setup, CSS imports

### Project Files (HIGH confidence)
- Current implementation at `C:\GitHub\datagvat-mcp\docs\`
- Existing configuration verified against official patterns

## Metadata

**Confidence breakdown:**
- i18n routing: HIGH - Official documentation clear, patterns verified
- Styling integration: HIGH - Current implementation correct, Tailwind v4 confirmed
- Search architecture: MEDIUM - Built-in options documented, API patterns inferred from docs
- SEO metadata: HIGH - Next.js patterns well-established
- Root layout fix: HIGH - Next.js requirement, pattern clear

**Research date:** 2026-01-17
**Valid until:** ~30 days (Fumadocs stable, Next.js app router mature)

**Critical findings:**
1. **Middleware is missing** - This is why i18n routing doesn't work
2. **Root layout architecture wrong** - HTML should be in root, not [lang]
3. **Search not implemented** - UI exists but no backend
4. **Styling is correct** - Tailwind v4 properly configured

**Build order impact:**
- Fix foundation FIRST (middleware + layouts)
- Add search SECOND (requires foundation)
- Enhance metadata THIRD (independent)
- Refine styling ONGOING (parallel track)
