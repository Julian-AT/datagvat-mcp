# Fumadocs Enterprise Features

**Researched:** 2026-01-17
**Domain:** Documentation framework (Fumadocs)
**Confidence:** HIGH

## Summary

Fumadocs offers a comprehensive suite of enterprise documentation features that enable AI-friendly documentation, advanced search, social sharing optimization, and professional visual design. The framework distinguishes itself through flexibility and LLM-first design, prioritizing machine-readable content alongside human readability.

This research covers six key enterprise features requested for Austria MCP documentation v1.1:
1. **AI Search** - Integration with third-party AI search providers (Inkeep by default)
2. **llms.txt** - Automatic generation of LLM-optimized documentation exports
3. **Feedback System** - Page and block-level feedback collection with GitHub integration
4. **OG Image Generation** - Dynamic Open Graph images using next/og
5. **Icon Integration** - Flexible icon system supporting any icon library
6. **SEO Features** - Framework-agnostic metadata management

**Key insight:** Fumadocs takes a "less abstraction" philosophy, providing building blocks rather than opinionated solutions. Most enterprise features require configuration and integration rather than simple toggles.

## Feature Landscape

### Table Stakes (Must-Have)

These features are essential for enterprise-grade documentation:

| Feature | Status | Fumadocs Approach | Why Table Stakes |
|---------|--------|-------------------|------------------|
| **llms.txt Generation** | ✅ Built-in | Export endpoint + getText() API | AI tools expect standardized doc format |
| **Feedback Collection** | ✅ Built-in via CLI | Page & block-level components | User input drives doc quality |
| **Icon Integration** | ✅ Configurable | Bring-your-own icon library | Professional navigation requires icons |
| **OG Images** | ✅ Framework support | next/og integration + helper component | Social sharing requires previews |
| **SEO Basics** | ✅ Framework-level | Metadata delegation to Next.js | Discoverability requirement |
| **Search** | ✅ Built-in + integrations | Orama (free), Algolia, others | Core documentation UX |

### Enterprise Enhancements (Should-Have)

Features that distinguish enterprise docs from basic documentation:

| Feature | Status | Fumadocs Approach | Enterprise Value |
|---------|--------|-------------------|------------------|
| **AI Search Dialog** | ✅ Via CLI component | Inkeep integration (configurable) | Conversational documentation access |
| **Per-Page MDX Access** | ✅ Built-in | `.mdx` endpoint negotiation | AI agents fetch specific pages |
| **GitHub Discussions** | ✅ Integration pattern | Feedback → auto-create discussions | Community engagement at scale |
| **LLM Copy Actions** | ✅ Via CLI component | Copy-to-clipboard for AI tools | Developer convenience |
| **Multi-source Search** | ✅ Tag filtering | Orama tag-based filtering | Multi-product documentation |

### Optional Enhancements (Nice-to-Have)

Features that enhance specific use cases:

| Feature | Status | Use Case |
|---------|--------|----------|
| **Accept Header Negotiation** | ✅ Built-in middleware | Serve MDX to AI agents automatically |
| **Custom AI Models** | ✅ Configurable | Replace Inkeep with custom LLM |
| **OG Image Presets** | ✅ Via CLI | Styled templates (default, mono) |
| **Feedback Analytics** | Integration-dependent | PostHog, custom analytics |

### Anti-Features (Explicitly Excluded)

Features Fumadocs intentionally doesn't provide:

| Feature | Fumadocs Position | Alternative |
|---------|-------------------|-------------|
| **Bundled Icon Library** | Not included | Use lucide-react, heroicons, etc. |
| **Opinionated SEO** | Framework-delegated | Use Next.js metadata API |
| **Built-in Analytics** | Integration pattern only | Integrate PostHog, GA, etc. |
| **Hosted AI Search** | Bring-your-own | Use Inkeep, custom LLM, etc. |

## Feature Details

---

### 1. AI Search

**What it is:** Conversational AI-powered search dialog that allows users to ask natural language questions about documentation.

**Status:** Available via CLI component, requires external AI provider

**Table Stakes:** ❌ No (enhances search, but basic search is table stakes)

**Implementation Complexity:** MEDIUM

**Dependencies:**
- Third-party AI provider (default: Inkeep)
- API key configuration
- Vercel AI SDK integration

**How it works:**

1. **Install AI search component:**
```bash
npx @fumadocs/cli add ai/search
```

2. **Add trigger to root layout:**
```tsx
import { AISearchTrigger } from '@/components/search';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AISearchTrigger />
        {children}
      </body>
    </html>
  );
}
```

3. **Configure environment:**
```bash
INKEEP_API_KEY="your-api-key"
```

**Customization:**
- Default uses Inkeep AI via Vercel AI SDK
- Can replace with custom AI models by updating `useChat` hook and `/api/chat` route
- AI model can use `llms-full.txt` file or other information sources

**Expected behavior:**
- Opens AI chat dialog (similar to standard search)
- Users ask questions in natural language
- AI responds with documentation-based answers
- Can cite specific documentation sections

**Known limitations:**
- Requires external service (not self-hosted by default)
- Inkeep is paid service for production use
- Custom models require significant configuration

**Confidence:** HIGH (official CLI component with documented setup)

---

### 2. llms.txt Generation

**What it is:** Automatic generation of LLM-optimized text files containing all documentation content in a format designed for AI consumption.

**Status:** Built-in, production-ready

**Table Stakes:** ✅ Yes (AI tools increasingly expect llms.txt)

**Implementation Complexity:** LOW

**Dependencies:**
- `includeProcessedMarkdown: true` in source config
- `getLLMText()` helper function
- Route handler for endpoint

**How it works:**

1. **Enable processed markdown in config:**
```ts
// source.config.ts
export const docs = defineDocs({
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});
```

2. **Create getLLMText helper:**
```ts
// lib/source.ts
import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
```

3. **Create llms-full.txt endpoint:**
```ts
// app/llms-full.txt/route.ts
export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);
  return new Response(scanned.join('\n\n'));
}
```

**Additional capabilities:**

**Per-page MDX access** - Allow AI agents to fetch individual pages:
```ts
// app/llms.mdx/[...slug]/route.ts
export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown' },
  });
}

// next.config.js - Middleware rewrite
async rewrites() {
  return [{
    source: '/docs/:path*.mdx',
    destination: '/llms.mdx/docs/:path*',
  }];
}
```

**Accept header negotiation** - Automatically serve MDX to AI agents:
```ts
// middleware.ts
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';

export default function proxy(request: NextRequest) {
  if (isMarkdownPreferred(request)) {
    const result = rewriteLLM(request.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }
  return NextResponse.next();
}
```

**Expected behavior:**
- `/llms-full.txt` serves complete documentation as single text file
- Each page includes title and URL for context
- AI agents can request `/docs/page.mdx` for specific pages
- Accept header `text/markdown` auto-serves MDX version

**Known limitations:**
- File can be large for extensive documentation
- Rebuilds when content changes (static generation recommended)
- Accept header negotiation requires middleware configuration

**Confidence:** HIGH (official feature with complete documentation)

---

### 3. Feedback System

**What it is:** Built-in feedback collection system with page-level and paragraph-level feedback widgets, supporting custom integrations and GitHub Discussions.

**Status:** Built-in via CLI

**Table Stakes:** ✅ Yes (user feedback drives doc quality)

**Implementation Complexity:** LOW (basic) to MEDIUM (GitHub integration)

**Dependencies:**
- `@fumadocs/cli` for installation
- Server actions for handling feedback
- Optional: GitHub App for Discussions integration

**How it works:**

**Basic page feedback:**

1. **Install via CLI:**
```bash
npx @fumadocs/cli@latest add feedback
```

2. **Add to page:**
```tsx
import { Feedback } from '@/components/feedback/client';

<Feedback
  onSendAction={async (feedback) => {
    'use server';
    // Handle feedback (e.g., send to PostHog, database, etc.)
    console.log(feedback);
  }}
/>
```

**Block-level feedback:**

1. **Add remark plugin to MDX config:**
```ts
import { remarkFeedbackBlock } from 'fumadocs-mdx/remark-plugins';

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkFeedbackBlock],
  },
});
```

2. **Define FeedbackBlock component:**
```tsx
// MDX component with onSendAction handler
<FeedbackBlock
  onSendAction={async (feedback) => {
    'use server';
    // Handle block-specific feedback
  }}
/>
```

**GitHub Discussions integration:**

```ts
// Automatic discussion creation from feedback
async function onPageFeedbackAction(feedback) {
  'use server';

  const octokit = createOctokitClient();
  await octokit.createDiscussion({
    repositoryId: process.env.GITHUB_REPO_ID,
    categoryId: process.env.GITHUB_CATEGORY_ID,
    title: `Feedback: ${page.title}`,
    body: feedback.message,
  });
}
```

**Expected behavior:**
- **Page feedback:** Feedback widget appears on page (typically footer)
- **Block feedback:** Each paragraph/section can have feedback button
- **Auto-generated IDs:** Block IDs generated from content and order
- **Server actions:** Feedback processed server-side (privacy, security)
- **Integration flexibility:** Send to analytics, database, GitHub, etc.

**Known limitations:**
- Requires custom backend for storage (no built-in database)
- GitHub integration requires GitHub App setup
- Block IDs change if content/order changes significantly

**Confidence:** HIGH (official CLI component with integration examples)

---

### 4. OG Image Generation

**What it is:** Dynamic Open Graph image generation for social media previews using Next.js `next/og` and Fumadocs helper components.

**Status:** Built-in integration with Next.js

**Table Stakes:** ✅ Yes (social sharing requires previews)

**Implementation Complexity:** LOW

**Dependencies:**
- Next.js `next/og` package
- Fumadocs UI `generate` function
- Route handler for image generation

**How it works:**

1. **Create image helper function:**
```ts
// lib/source.ts
export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];
  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}
```

2. **Add to page metadata:**
```tsx
// app/[lang]/docs/[[...slug]]/page.tsx
export async function generateMetadata({ params }) {
  const page = source.getPage(params.slug);

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
```

3. **Create OG image route handler:**
```tsx
// app/og/docs/[...slug]/route.tsx
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));

  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site="Austria MCP"
    />,
    { width: 1200, height: 630 }
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: [...page.slugs, 'image.png'],
  }));
}
```

**Customization options:**

**Alternative presets:**
```bash
# Install alternative OG image styles
npx @fumadocs/cli add og/mono
```

**Custom Satori options:**
```tsx
new ImageResponse(<YourComponent />, {
  width: 1200,
  height: 630,
  // Satori options
});
```

**Expected behavior:**
- OG images generated at build time (static generation)
- URLs follow pattern: `/og/docs/[...page-slug]/image.png`
- Social media platforms fetch and display preview
- Default template uses Fumadocs branding
- Customizable templates via CLI presets

**Known limitations:**
- Requires Next.js (not available for other frameworks)
- Static generation recommended (dynamic can be slow)
- Custom fonts require additional configuration
- Image size affects build time for large sites

**Confidence:** HIGH (official integration with code examples)

---

### 5. Icon Integration

**What it is:** Flexible icon system that allows use of any icon library (Lucide, Heroicons, etc.) through a configurable icon handler.

**Status:** Built-in configuration pattern

**Table Stakes:** ✅ Yes (professional navigation requires icons)

**Implementation Complexity:** LOW

**Dependencies:**
- Icon library of choice (e.g., `lucide-react`)
- Icon handler function in source config

**How it works:**

**Why Fumadocs doesn't bundle icons:**
From official docs: "Since Fumadocs doesn't include an icon library, you have to convert the icon names to JSX elements in runtime."

**Configuration:**

1. **Install icon library:**
```bash
npm install lucide-react
```

2. **Configure icon handler:**
```ts
// lib/source.ts
import { loader } from 'fumadocs-core/source';
import { Home, Search, Book, Settings } from 'lucide-react';

export const source = loader({
  baseUrl: '/docs',
  icon: (name) => {
    const icons = {
      home: Home,
      search: Search,
      book: Book,
      settings: Settings,
    };

    const Icon = icons[name as keyof typeof icons];
    return Icon ? <Icon /> : undefined;
  },
});
```

**Usage locations:**

**Page frontmatter:**
```yaml
---
title: Getting Started
icon: home
---
```

**meta.json navigation:**
```json
{
  "title": "API Reference",
  "icon": "book",
  "pages": ["..."]
}
```

**Separators:**
```
---[Settings]Configuration Options---
```

**Links:**
```markdown
[Home][Documentation](/docs)
```

**Expected behavior:**
- Icon names in files are strings
- Icon handler converts strings to JSX at runtime
- Same icon library used throughout site
- Missing icon names render as undefined (no error)

**Known limitations:**
- All icons must be registered in handler (no dynamic import by default)
- Icon names are case-sensitive
- No tree-shaking without careful configuration
- Icons must be imported/defined at build time

**Pitfall prevention:**
```ts
// GOOD: Explicit mapping
icon: (name) => {
  const iconMap = { home: <Home />, search: <Search /> };
  return iconMap[name];
}

// BAD: Missing handler entirely
// Icons will appear as text strings

// BAD: Dynamic require (doesn't work)
icon: (name) => require(`lucide-react/${name}`)
```

**Confidence:** HIGH (explicit requirement documented)

---

### 6. SEO Features

**What it is:** SEO optimization through framework-native metadata management, delegating to Next.js, React Router, or other framework capabilities.

**Status:** Framework-delegated (not Fumadocs-specific)

**Table Stakes:** ✅ Yes (discoverability requirement)

**Implementation Complexity:** LOW (Next.js) to MEDIUM (other frameworks)

**Dependencies:**
- Framework metadata system (e.g., Next.js Metadata API)
- Page data from source loader

**Fumadocs philosophy:**
From comparison table: "SEO: Via Metadata" - Fumadocs provides page data, framework provides SEO.

**How it works (Next.js example):**

**Basic metadata:**
```tsx
// app/[lang]/docs/[[...slug]]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const page = source.getPage(params.slug);

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      url: `https://yourdomain.com${page.url}`,
      images: getPageImage(page).url,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: getPageImage(page).url,
    },
    alternates: {
      canonical: `https://yourdomain.com${page.url}`,
      languages: {
        'en': `https://yourdomain.com/en${page.url}`,
        'de': `https://yourdomain.com/de${page.url}`,
      },
    },
  };
}
```

**Available page data for SEO:**
- `page.data.title` - Page title
- `page.data.description` - Meta description
- `page.url` - Canonical URL
- `page.slugs` - URL segments
- `page.data.structuredData` - For search index
- Custom frontmatter fields via schema

**SEO best practices for Fumadocs:**

1. **Structured data for search:**
```ts
// Automatically included in search indexes
structuredData: page.data.structuredData
```

2. **Last modified dates:**
```tsx
import { getGithubLastEdit } from 'fumadocs-core/server';

const lastModified = await getGithubLastEdit({
  owner: 'your-org',
  repo: 'your-repo',
  path: `docs/${page.file.path}`,
});

// Use in metadata
export async function generateMetadata() {
  return {
    other: {
      'article:modified_time': lastModified?.toString(),
    },
  };
}
```

3. **Breadcrumb structured data:**
```tsx
// Breadcrumb component already included in DocsPage
<DocsPage
  breadcrumb={{
    enabled: true,
    includeRoot: true,
  }}
/>
```

**Expected behavior:**
- Each page has unique title/description
- OG images auto-generated for social previews
- Canonical URLs prevent duplicate content
- Language alternates for i18n
- Breadcrumbs improve navigation
- Last modified dates signal freshness

**Known limitations:**
- No built-in sitemap generation (use framework solution)
- No robots.txt management (manual or framework)
- No schema.org structured data templates
- Framework-dependent implementation

**What's NOT included:**
- Automatic sitemap.xml generation (use Next.js or manual)
- robots.txt automation
- Keyword optimization tools
- Analytics integration
- Performance monitoring

**Confidence:** MEDIUM (framework delegation pattern, not Fumadocs-specific)

---

## Feature Dependencies

Graph of feature interdependencies:

```
llms.txt Generation
├─ REQUIRES: Processed markdown config
└─ ENABLES: AI Search (data source)

AI Search
├─ REQUIRES: llms.txt OR external data source
├─ REQUIRES: Third-party AI provider
└─ ENHANCES: Standard search

Feedback System
├─ REQUIRES: Server actions capability
├─ OPTIONAL: GitHub App (for Discussions)
└─ OPTIONAL: Analytics platform (PostHog, etc.)

OG Image Generation
├─ REQUIRES: Next.js framework
├─ REQUIRES: next/og package
└─ USES: Page metadata

Icon Integration
├─ REQUIRES: Icon library (user choice)
├─ REQUIRES: Icon handler in loader config
└─ USED BY: Navigation, pages, components

SEO Features
├─ REQUIRES: Framework metadata system
├─ USES: OG images
├─ USES: Page data from loader
└─ OPTIONAL: Last modified tracking
```

## Implementation Roadmap

Recommended implementation order based on dependencies:

### Phase 1: Foundation (No dependencies)
1. **Icon Integration** - Required for all navigation
2. **llms.txt Generation** - Foundational for AI features

### Phase 2: Core Features (Depends on Phase 1)
3. **OG Image Generation** - Uses page data
4. **SEO Features** - Uses OG images and page data

### Phase 3: Interactive Features (Depends on Phase 1-2)
5. **Feedback System** - Standalone, no dependencies
6. **AI Search** - Uses llms.txt (optional)

**Rationale:**
- Icons block navigation work
- llms.txt provides foundation for AI features
- OG images needed before full SEO implementation
- Feedback and AI Search can be added last (user-facing enhancements)

## Complexity Assessment

| Feature | Setup | Integration | Maintenance | Overall |
|---------|-------|-------------|-------------|---------|
| Icon Integration | LOW | LOW | LOW | LOW |
| llms.txt | LOW | LOW | LOW | LOW |
| OG Images | LOW | MEDIUM | LOW | LOW-MEDIUM |
| SEO | MEDIUM | MEDIUM | LOW | MEDIUM |
| Feedback | LOW | MEDIUM | MEDIUM | MEDIUM |
| AI Search | MEDIUM | HIGH | MEDIUM | MEDIUM-HIGH |

**Complexity factors:**
- **Setup:** Initial configuration effort
- **Integration:** Connecting to existing systems
- **Maintenance:** Ongoing updates and monitoring
- **Overall:** Total complexity score

## Feature Comparison: Austria MCP Current vs Target

| Feature | Current (v1.0) | Target (v1.1) | Gap |
|---------|----------------|---------------|-----|
| **llms.txt** | ❌ Not implemented | ✅ Full + per-page MDX | Medium effort |
| **AI Search** | ❌ Basic search only | ✅ Conversational AI | High effort (provider setup) |
| **Feedback** | ❌ No collection | ✅ Page + block level | Medium effort |
| **OG Images** | ❌ No generation | ✅ Dynamic per-page | Low effort |
| **Icons** | ⚠️ Basic (unverified) | ✅ Full integration | Low effort (already exists?) |
| **SEO** | ⚠️ Basic metadata | ✅ Complete optimization | Medium effort |

## Code Examples

### Complete Setup Example

**1. Enable all features in source config:**
```ts
// lib/source.ts
import { loader } from 'fumadocs-core/source';
import { docs } from 'collections/server';
import { Home, Book, Settings } from 'lucide-react';

export const source = loader({
  baseUrl: '/docs',
  source: docs,
  icon: (name) => {
    const icons = { home: Home, book: Book, settings: Settings };
    const Icon = icons[name as keyof typeof icons];
    return Icon ? <Icon /> : undefined;
  },
});

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];
  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}
```

**2. Configure source with all features:**
```ts
// source.config.ts
import { defineDocs } from 'fumadocs-mdx/config';
import { remarkFeedbackBlock } from 'fumadocs-mdx/remark-plugins';

export const docs = defineDocs({
  docs: {
    postprocess: {
      includeProcessedMarkdown: true, // Enable llms.txt
    },
  },
  mdxOptions: {
    remarkPlugins: [remarkFeedbackBlock], // Enable block feedback
  },
});
```

**3. Page with all features:**
```tsx
// app/[lang]/docs/[[...slug]]/page.tsx
import { source, getPageImage } from '@/lib/source';
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { Feedback } from '@/components/feedback/client';
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const page = source.getPage(params.slug);

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      images: getPageImage(page).url,
    },
  };
}

export default async function Page({ params }) {
  const page = source.getPage(params.slug);

  return (
    <DocsPage toc={page.data.toc}>
      <h1>{page.data.title}</h1>
      <MDXContent components={defaultMdxComponents} />
      <Feedback
        onSendAction={async (feedback) => {
          'use server';
          // Handle feedback
        }}
      />
    </DocsPage>
  );
}
```

**4. Root layout with AI search:**
```tsx
// app/layout.tsx
import { NextProvider } from 'fumadocs-core/framework/next';
import { AISearchTrigger } from '@/components/search';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextProvider>
          <AISearchTrigger />
          {children}
        </NextProvider>
      </body>
    </html>
  );
}
```

**5. llms.txt endpoint:**
```ts
// app/llms-full.txt/route.ts
import { source, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();
  const texts = await Promise.all(pages.map(getLLMText));
  return new Response(texts.join('\n\n'));
}
```

**6. OG image route:**
```tsx
// app/og/docs/[...slug]/route.tsx
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import { source } from '@/lib/source';

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site="Austria MCP"
    />,
    { width: 1200, height: 630 }
  );
}
```

## Open Questions

1. **AI Search Provider Selection**
   - What we know: Default is Inkeep, customizable to other providers
   - What's unclear: Cost implications for Inkeep vs alternatives
   - Recommendation: Research Inkeep pricing, consider self-hosted alternatives

2. **Feedback Storage Backend**
   - What we know: Framework provides collection, not storage
   - What's unclear: Best practice for storing feedback (database, external service)
   - Recommendation: Evaluate GitHub Discussions vs dedicated database

3. **OG Image Build Performance**
   - What we know: Static generation recommended
   - What's unclear: Build time impact for 100+ pages
   - Recommendation: Test with current doc count, consider dynamic for development

4. **Icon Library Choice**
   - What we know: Any library works with handler pattern
   - What's unclear: Which library Austria MCP currently uses (if any)
   - Recommendation: Verify existing implementation, standardize on Lucide if new

## Sources

### Primary (HIGH confidence)
- [Fumadocs Complete Documentation](https://www.fumadocs.dev/llms-full.txt) - Fetched 2026-01-17
  - AI & LLM integration page
  - Search configuration (Orama)
  - Feedback integration guide
  - Icon integration pattern
  - UI components overview
- [Fumadocs OG Image Integration](https://fumadocs.dev/docs/integrations/next-og) - Fetched 2026-01-17
- [Fumadocs Feedback Integration](https://fumadocs.dev/docs/integrations/feedback) - Fetched 2026-01-17
- [Fumadocs Search Documentation](https://fumadocs.dev/docs/headless/search/orama) - Fetched 2026-01-17
- [Fumadocs Page Layout](https://fumadocs.dev/docs/ui/layouts/page) - Fetched 2026-01-17

### Secondary (MEDIUM confidence)
- Fumadocs sitemap analysis - Complete documentation structure verified

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- llms.txt generation: HIGH - Complete implementation guide with code
- AI Search: HIGH - CLI component with configuration examples
- Feedback system: HIGH - CLI component with integration patterns
- OG images: HIGH - Official integration with Next.js
- Icon integration: HIGH - Explicit pattern documented
- SEO features: MEDIUM - Framework-delegated, not Fumadocs-specific

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable framework)

**Research quality checks:**
- ✅ All enumerated features investigated
- ✅ Multiple official sources cross-referenced
- ✅ URLs provided for verification
- ✅ Code examples from official documentation
- ✅ Dependencies and complexity documented
- ✅ Implementation order recommended
- ✅ Open questions honestly reported
- ✅ Confidence levels assigned per feature
