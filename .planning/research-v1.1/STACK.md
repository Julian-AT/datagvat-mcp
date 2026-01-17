# Stack Research: Fumadocs Enterprise Documentation

**Domain:** Documentation Framework / Next.js
**Researched:** 2026-01-17
**Confidence:** HIGH (verified from official Fumadocs documentation and npm registry)

## Recommended Stack

### Core Fumadocs Packages

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| fumadocs-core | 16.4.7 | Headless search, navigation, i18n, utilities | Core framework providing all server-side functions and headless components |
| fumadocs-ui | 16.4.7 | UI theme with components | Default beautiful theme with mobile responsiveness, interactive components |
| fumadocs-mdx | 14.2.5 | MDX/Markdown content source | Official content source with collection-based organization, schema validation |
| fumadocs-openapi | 10.2.4 | OpenAPI documentation | Built-in OpenAPI integration (unique vs Nextra) |
| @fumadocs/cli | 1.2.2 | Component installation and automation | Fetches latest components from GitHub, automates setup |

**Installation:**
```bash
npm install fumadocs-core@16.4.7 fumadocs-ui@16.4.7 fumadocs-mdx@14.2.5
npm install -D @fumadocs/cli@1.2.2
```

### Enterprise Feature Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icon library | Required - Fumadocs doesn't include icons, needs runtime icon handler |
| shiki | 3.21.0 | Syntax highlighting | Required for dynamic mode, recommended for all setups |
| @shikijs/transformers | 3.21.0 | Code block transformations | Syntax highlighting enhancements, line highlighting |
| @orama/tokenizers | 3.1.18 | Multi-language search tokenization | Only for Chinese/Japanese search support |
| next | 16.1.3 | React framework with built-in next/og | Required - provides OG image generation via next/og (no separate package) |

**Installation:**
```bash
# Required for all setups
npm install lucide-react@0.562.0 shiki@3.21.0 @shikijs/transformers@3.21.0

# Only for Chinese/Japanese documentation
npm install @orama/tokenizers@3.1.18
```

### i18n and Routing

| Feature | Package | Configuration Location |
|---------|---------|----------------------|
| i18n Definition | fumadocs-core/i18n | `lib/i18n.ts` |
| i18n Middleware | fumadocs-core/i18n/middleware | `middleware.ts` |
| Parser Mode | fumadocs-mdx/config | `source.config.ts` (parser: 'dot' or 'dir') |
| HideLocale Mode | fumadocs-core/i18n | defineI18n options ('always', 'default-locale', 'never') |

**Rationale:** Fumadocs provides two routing approaches:
- **Dot parser** (`parser: 'dot'`): Files like `page.cn.mdx`, `meta.cn.json` - better for viewing all languages side-by-side
- **Directory parser** (`parser: 'dir'`): Language folders `content/docs/en/`, `content/docs/cn/` - better for organization

**For Austria MCP (German/English):** Use dot parser with `hideLocale: 'default-locale'` to hide /de prefix but show /en.

### Search Implementation (Orama)

| Component | Package | Purpose |
|-----------|---------|---------|
| Search API Server | fumadocs-core/search/server | Creates search endpoint with index generation |
| Search Client Hook | fumadocs-core/search/client | Client-side search with useDocsSearch |
| Search UI (built-in) | fumadocs-ui | Automatic integration, no extra config |

**Setup:**
```typescript
// app/api/search/route.ts
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source, {
  language: 'english',  // or 'german' for German docs
  // For bilingual, use localeMap:
  localeMap: {
    de: { language: 'german' },
    en: { language: 'english' },
  },
});
```

**Why Orama (not Algolia):** Built-in, free, self-hosted, good for small-to-medium sites. Only switch to Algolia/Orama Cloud for very large sites with static mode.

### AI Search (Inkeep Integration)

| Component | Installation | Purpose |
|-----------|-------------|---------|
| AI Search Dialog | `npx @fumadocs/cli add ai/search` | AI-powered search interface using Vercel AI SDK |
| Environment Variable | `INKEEP_API_KEY` | Inkeep API authentication |
| Trigger Component | `<AISearchTrigger />` | UI trigger for AI search |

**Alternative AI Providers:** Modify `/api/chat` route and `useChat` hook to integrate other models. Can use generated `llms-full.txt` as data source.

### llms.txt Generation

| Component | Package | Purpose |
|-----------|---------|---------|
| getLLMText Function | Custom utility | Converts pages to static MDX content |
| includeProcessedMarkdown | fumadocs-mdx/config | Enables processed markdown in page data |
| llms-full.txt Route | Framework-specific route | Generates complete documentation for AI consumption |

**Setup:**
```typescript
// lib/get-llm-text.ts
export function getLLMText(page) {
  return `# ${page.data.title} (${page.url})\n\n${page.data.processed}`;
}

// app/llms-full.txt/route.ts
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);
  return new Response(scanned.join('\n\n'));
}

// source.config.ts
export default defineDocs({
  // ...
  postprocess: {
    includeProcessedMarkdown: true,
  },
});
```

### Feedback System

| Component | Installation | Purpose |
|-----------|-------------|---------|
| Feedback Components | `npx @fumadocs/cli add feedback` | Page and block-level feedback UI |
| Block Feedback Plugin | fumadocs-core (remarkFeedbackBlock) | Auto-generates block IDs for paragraph feedback |
| Storage Backend | Custom (user-provided) | Handle feedback via onSendAction callback |

**Optional Integrations:**
- GitHub Discussions: Use `octokit` with App authentication
- PostHog Analytics: Track feedback events with `posthog-js`
- Custom Database: Any backend via server action

**Setup:**
```typescript
// Add to MDX components
import { Feedback, FeedbackBlock } from '@/components/feedback/client';

// In mdx-components.tsx
export default {
  FeedbackBlock,
};

// In source.config.ts
import { remarkFeedbackBlock } from 'fumadocs-core/mdx-plugins';

export default defineDocs({
  remarkPlugins: [remarkFeedbackBlock],
});
```

**No database required** - feedback handled via callbacks. Choose storage approach based on needs (GitHub for public discussion, PostHog for analytics, database for private feedback).

### OG Image Generation

| Component | Package | Purpose |
|-----------|---------|---------|
| ImageResponse | next/og (built into Next.js) | Generate dynamic OG images |
| Default Template | fumadocs-ui/og | Pre-built OG image template |
| Custom Templates | CLI installation | `npx @fumadocs/cli add og/mono` for alternative styles |

**Setup:**
```typescript
// lib/source.ts - Add helper
export function getPageImage(page) {
  return {
    segments: [...page.slugs, 'image.png'],
    url: `/og/${page.slugs.join('/')}/image.png`,
  };
}

// app/og/docs/[...slug]/route.tsx
import { generate } from 'fumadocs-ui/og';
import { source } from '@/lib/source';

export const revalidate = false;

export function GET(_: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));

  if (!page) return new Response('Not Found', { status: 404 });

  return generate({
    title: page.data.title,
    description: page.data.description,
    site: 'Austria MCP',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: [...page.slugs, 'image.png'],
  }));
}

// In page metadata
import { getPageImage } from '@/lib/source';

export function generateMetadata({ params }) {
  const page = source.getPage(params.slug);
  return {
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
```

**Why next/og (not Takumi):** Built into Next.js 16.1.3, no extra dependency. Takumi is framework-agnostic but adds dependency. For Next.js projects, use next/og.

### Icon Integration

| Library | Version | Purpose | Integration Pattern |
|---------|---------|---------|-------------------|
| lucide-react | 0.562.0 | React icon components | Runtime icon name-to-component mapping |
| @radix-ui/react-icons | 1.3.2 | Alternative icon set | Optional, use if preferred over Lucide |

**Required Setup:**
Fumadocs stores icons as strings in frontmatter/meta files. Must provide icon handler:

```typescript
// lib/source.ts
import * as Icons from 'lucide-react';

export const source = loader({
  icon(icon) {
    if (icon && icon in Icons) {
      return Icons[icon as keyof typeof Icons];
    }
    return null;
  },
});
```

**Why lucide-react:** Extensively used in Fumadocs examples, large icon set (500+), tree-shakeable, consistent design.

### Supporting Utilities

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| clsx | 2.1.1 | Conditional className composition | Standard for React className management |
| tailwind-merge | 3.4.0 | Tailwind class deduplication | Prevents class conflicts in component composition |
| zod | Latest | Schema validation | Optional - for collection schema validation |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Orama (built-in) | Algolia | Very large sites (10,000+ pages), need hosted search |
| Orama (built-in) | Orama Cloud | Need cloud-hosted Orama with analytics, vector search |
| next/og | Takumi | Non-Next.js frameworks (Waku, React Router, Tanstack) |
| Inkeep AI | Custom AI integration | Want different AI provider (OpenAI, Anthropic direct) |
| GitHub Discussions (feedback) | Custom database | Need private feedback, user analytics, custom workflows |
| lucide-react | @radix-ui/react-icons | Prefer Radix design system consistency |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Standalone next-og package | Doesn't exist - 404 on npm | next/og built into Next.js |
| Algolia for small sites | Overkill, costs money for larger usage | Orama built-in (free, self-hosted) |
| Static search mode (type: 'static') | Downloads entire index - expensive on large sites | Dynamic search (type: 'fetch') or cloud solutions |
| Manual icon imports in MDX | Fumadocs uses string-based icon references | Icon handler via loader() API |
| Relative image paths in dynamic mode | MDX Remote doesn't support relative imports | Absolute paths (/images/...) or normal mode |

## Stack Patterns by Configuration

### Pattern 1: Standard Bilingual (German/English)

**Use when:** Two languages, want default language without prefix

```typescript
// lib/i18n.ts
import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'de',
  languages: ['de', 'en'],
  hideLocale: 'default-locale', // Hide /de, show /en
});

// source.config.ts
export default defineDocs({
  dir: 'content/docs',
  parser: 'dot', // Use page.de.mdx, page.en.mdx
});

// Search API with locale support
createFromSource(source, {
  localeMap: {
    de: { language: 'german' },
    en: { language: 'english' },
  },
});
```

### Pattern 2: Enterprise Full Stack

**Use when:** Need all enterprise features (AI search, feedback, OG, llms.txt)

```bash
# Install core
npm install fumadocs-core fumadocs-ui fumadocs-mdx

# Install dependencies
npm install lucide-react shiki @shikijs/transformers

# Add enterprise features via CLI
npx @fumadocs/cli add feedback
npx @fumadocs/cli add ai/search
npx @fumadocs/cli add og/mono  # or use default from fumadocs-ui/og
```

**Required files:**
- `app/api/search/route.ts` - Orama search endpoint
- `app/api/chat/route.ts` - AI search endpoint
- `app/llms-full.txt/route.ts` - llms.txt generation
- `app/og/docs/[...slug]/route.tsx` - OG image generation
- `lib/get-llm-text.ts` - LLM text extraction
- `components/feedback/client.tsx` - Feedback components
- `mdx-components.tsx` - MDX component overrides

### Pattern 3: CJK (Chinese/Japanese/Korean) Documentation

**Use when:** Need Chinese, Japanese, or Korean language search

```bash
# Additional dependency
npm install @orama/tokenizers
```

```typescript
// Search API with CJK tokenizer
import { createTokenizer } from '@orama/tokenizers/mandarin';

createFromSource(source, {
  localeMap: {
    zh: {
      components: { tokenizer: createTokenizer() },
      search: { threshold: 0, tolerance: 0 },
    },
  },
});
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| fumadocs-core@16.4.7 | fumadocs-ui@16.4.7 | Must match major.minor version |
| fumadocs-mdx@14.2.5 | fumadocs-core@16.x | Different major versions OK |
| next@16.1.3 | fumadocs-ui@16.x | Next.js 16+ required for latest features |
| shiki@3.21.0 | @shikijs/transformers@3.21.0 | Must match exact version |
| tailwindcss@4.0.21 | fumadocs-ui@16.4.7 | Tailwind v4 supported (current project uses this) |
| lucide-react@0.562.0 | Any React version | No specific constraints |
| Node.js 22+ | All Fumadocs packages | Minimum Node.js 22 required, avoid Node.js 23.1 (known issues) |

**Critical:** fumadocs-core and fumadocs-ui versions must match major.minor (e.g., both 16.4.x). Patch versions can differ.

## Configuration Checklist

For Austria MCP v1.1, ensure:

- [ ] fumadocs-core, fumadocs-ui upgraded to 16.4.7 (currently installed)
- [ ] fumadocs-mdx upgraded to 14.2.5 (currently installed)
- [ ] lucide-react installed for icon handling
- [ ] i18n configured with de/en locales, hideLocale: 'default-locale'
- [ ] middleware.ts with createI18nMiddleware
- [ ] Search API at /api/search with German/English localeMap
- [ ] llms-full.txt route with includeProcessedMarkdown: true
- [ ] OG image route at /og/docs/[...slug] with generateStaticParams
- [ ] Feedback components installed via CLI
- [ ] Icon handler in loader() config
- [ ] MDX remarkPlugins with remarkFeedbackBlock for block feedback

## Common Configuration Issues

### Issue 1: i18n Routing Not Working
**Symptom:** Language switching broken, URLs missing locale prefix
**Cause:** Missing middleware or incorrect hideLocale setting
**Fix:**
```typescript
// middleware.ts
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';

export default createI18nMiddleware(i18n);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Issue 2: Search Not Finding Content
**Symptom:** Search returns no results
**Cause:** Missing structuredData or incorrect language configuration
**Fix:** Ensure source provides structuredData via Remark Structure plugin, and language matches documentation language

### Issue 3: Icons Not Displaying
**Symptom:** Icon names showing as text
**Cause:** No icon handler configured
**Fix:**
```typescript
import * as Icons from 'lucide-react';

export const source = loader({
  icon(icon) {
    if (icon && icon in Icons) return Icons[icon as keyof typeof Icons];
  },
});
```

### Issue 4: OG Images 404
**Symptom:** /og/docs/.../image.png returns 404
**Cause:** Missing generateStaticParams or incorrect route structure
**Fix:** Ensure route at `app/og/docs/[...slug]/route.tsx` implements both GET and generateStaticParams

## Sources

### Primary (HIGH confidence)
- Fumadocs llms-full.txt - https://www.fumadocs.dev/llms-full.txt (complete documentation)
- Fumadocs Search Orama - https://fumadocs.dev/docs/headless/search/orama (verified setup)
- Fumadocs Feedback - https://fumadocs.dev/docs/integrations/feedback (verified implementation)
- Fumadocs next/og - https://fumadocs.dev/docs/integrations/next-og (verified OG setup)
- Fumadocs LLMs - https://fumadocs.dev/docs/integrations/llms (verified llms.txt generation)
- npm registry - fumadocs-core@16.4.7, fumadocs-ui@16.4.7, fumadocs-mdx@14.2.5 (verified versions)

### Package Versions (Verified via npm, 2026-01-17)
- fumadocs-core: 16.4.7
- fumadocs-ui: 16.4.7
- fumadocs-mdx: 14.2.5
- fumadocs-openapi: 10.2.4
- @fumadocs/cli: 1.2.2
- lucide-react: 0.562.0
- shiki: 3.21.0
- @orama/tokenizers: 3.1.18

### Project Context
- Current package.json versions match recommended (fumadocs packages current)
- Next.js 16.1.3 (latest) with built-in next/og
- Tailwind CSS 4.0.21 (latest, compatible)
- Node.js 22+ environment

---
*Stack research for: Fumadocs Enterprise Documentation Framework*
*Researched: 2026-01-17*
*Valid until: 2026-02-17 (30 days - Fumadocs is stable framework)*
