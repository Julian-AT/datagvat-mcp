# Fumadocs Common Pitfalls

**Researched:** 2026-01-17
**Domain:** Documentation framework (Fumadocs)
**Confidence:** HIGH

## Summary

This document identifies critical mistakes that Fumadocs projects commonly make, based on official documentation warnings, gotchas, and configuration issues. The pitfalls are organized by phase and include detection methods, prevention strategies, and real examples from official docs.

**Critical insight:** Fumadocs has many "invisible" configuration requirements that aren't enforced at dev time but cause production failures. Most pitfalls stem from:
1. Missing required configurations (icon handlers, base URLs)
2. Build cache and static export issues
3. i18n routing and middleware problems
4. Import alias and TypeScript configuration
5. MDX constraints in dynamic mode

## Pitfall Categories

### P1 - i18n Routing and Middleware
### P2 - Build and Deployment
### P3 - Icon and Asset Configuration
### P4 - File Structure and Routing
### P5 - MDX Configuration
### P6 - Search Implementation
### P7 - Styling and Theming
### P8 - TypeScript and Import Aliases

---

## P1: i18n Routing and Middleware

### P1.1: Locale Hiding Cache Problems

**What goes wrong:**
Using `hideLocale: 'always'` mode stores locale as a cookie, causing cache problems for static sites.

**Why it happens:**
From official docs: "On `always` mode, locale is stored as a cookie (set by the middleware), which isn't optimal for static sites and may cause undesired cache problems."

**Warning signs:**
- Static site deployment shows wrong language
- Locale switching doesn't work on first load
- CDN caching serves incorrect language

**Prevention strategy:**
```ts
// source.config.ts - DON'T use 'always' for static sites
i18n: {
  languages: ['en', 'de'],
  defaultLanguage: 'en',
  hideLocale: 'default-locale', // ✅ Safe for static sites
  // hideLocale: 'always',      // ❌ Cookie-based, cache problems
}
```

**Phase mapping:** Phase 1 (i18n Setup)

**Confidence:** HIGH - Explicitly documented in official docs

---

### P1.2: Middleware Matcher Missing Static Assets

**What goes wrong:**
Middleware runs on static assets, breaking images, CSS, and API routes.

**Why it happens:**
Default middleware matcher doesn't exclude all necessary paths.

**Warning signs:**
- 404 errors on images after deployment
- API routes return 500 errors
- CSS files not loading

**Prevention strategy:**
```ts
// middleware.ts - Comprehensive exclusions
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)' // ✅
  ]
};
```

**Phase mapping:** Phase 1 (i18n Setup)

**Confidence:** MEDIUM - Common Next.js middleware pattern

---

### P1.3: Parser Mode Inconsistency

**What goes wrong:**
Mixing file naming conventions (`.de.mdx` vs `/de/file.mdx`) breaks routing.

**Why it happens:**
Two parser modes exist (`dot` vs `dir`), and using both causes conflicts.

**Warning signs:**
- Some translated pages work, others 404
- Inconsistent URL patterns
- Build warnings about duplicate routes

**Prevention strategy:**
```ts
// source.config.ts - Pick ONE parser mode
i18n: {
  parser: 'dot',  // ✅ Consistent: file.de.mdx
  // parser: 'dir', // OR: /de/file.mdx
}

// Then use ONLY that pattern:
// ✅ dot mode:  getting-started.de.mdx
// ❌ mixed:     getting-started.de.mdx AND /de/setup.mdx
```

**Phase mapping:** Phase 1 (i18n Setup)

**Confidence:** HIGH - Official docs show two modes

---

## P2: Build and Deployment

### P2.1: Build Cache Never Updates

**What goes wrong:**
Content changes don't appear in production builds because cache is never invalidated.

**Why it happens:**
From official docs: "The cache will never be updated, delete the cache folder to clean."

**Warning signs:**
- Production build shows stale content
- New MDX files don't appear
- Edited content unchanged after rebuild

**Prevention strategy:**
```ts
// source.config.ts - Use with caution
export default defineConfig({
  experimentalBuildCache: './cache-dir',
});

// CI/CD pipeline - MUST clean cache
"scripts": {
  "clean": "rm -rf cache-dir",
  "build:clean": "npm run clean && next build" // ✅ Clean before build
}
```

**Phase mapping:** Phase 5 (Deployment)

**Confidence:** HIGH - Explicitly documented warning

---

### P2.2: Node.js Version Incompatibility

**What goes wrong:**
Production builds fail or behave incorrectly with Node.js 23.1.

**Why it happens:**
From official docs: "Node.js 23.1 got some problems with production builds on Next.js, see #1021. Make sure to change your Node.js version."

**Warning signs:**
- Build succeeds locally but fails in CI
- Production runtime errors
- Unexpected behavior after deployment

**Prevention strategy:**
```json
// package.json - Enforce compatible version
{
  "engines": {
    "node": ">=22.0.0 <23.1.0 || >=23.2.0" // ✅ Skip problematic version
  }
}

// .nvmrc
22.0.0
```

**Phase mapping:** Phase 5 (Deployment)

**Confidence:** HIGH - Specific version issue documented

---

### P2.3: Static Export with Dynamic Routes

**What goes wrong:**
Developers assume `[[...slug]]` routes are dynamic and don't work with static export.

**Why it happens:**
From official docs: "Next.js turns dynamic route into static routes when `generateStaticParams` is configured."

**Warning signs:**
- Confusion about static vs dynamic rendering
- Missing `generateStaticParams` implementation
- Static export fails

**Prevention strategy:**
```tsx
// app/[lang]/docs/[[...slug]]/page.tsx
export function generateStaticParams() {
  return docs.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

// next.config.js - Enable static export
module.exports = {
  output: 'export', // ✅ Works with generateStaticParams
};
```

**Phase mapping:** Phase 5 (Deployment)

**Confidence:** HIGH - Official docs explain behavior

---

## P3: Icon and Asset Configuration

### P3.1: Missing Icon Handler

**What goes wrong:**
Icons don't render because Fumadocs doesn't include an icon library.

**Why it happens:**
From official docs: "Since Fumadocs doesn't include an icon library, you have to convert the icon names to JSX elements in runtime."

**Warning signs:**
- Icon names appearing as text
- `undefined` or blank icon spaces
- Console warnings about missing components

**Prevention strategy:**
```ts
// source.config.ts - REQUIRED icon handler
import { icons } from 'lucide-react';

export const docs = defineDocs({
  icon: (name) => {
    // Map string names to JSX elements
    const iconMap = {
      'home': <icons.Home />,
      'search': <icons.Search />,
      // ... all icons used in meta.json
    };
    return iconMap[name];
  },
});

// meta.json - Use string names only
{
  "title": "Home",
  "icon": "home" // ✅ String, converted by handler
}
```

**Phase mapping:** Phase 3 (Icons and Assets)

**Confidence:** HIGH - Explicitly documented requirement

---

### P3.2: Image Imports in Dynamic Mode

**What goes wrong:**
Image imports (`./image.png`) fail in dynamic MDX mode.

**Why it happens:**
From official docs: "No import/export allowed in MDX files. Images must be referenced with URL (e.g. `/images/test.png`)."

**Warning signs:**
- Build errors about imports in MDX
- Images not appearing in dynamic mode
- Module resolution errors

**Prevention strategy:**
```mdx
<!-- DON'T: Import-style paths -->
![Alt](./image.png) ❌

<!-- DO: URL paths in public folder -->
![Alt](/images/image.png) ✅

<!-- public/images/image.png -->
```

**Phase mapping:** Phase 3 (Icons and Assets)

**Confidence:** HIGH - Dynamic mode constraint documented

---

## P4: File Structure and Routing

### P4.1: Meta.json Pages Whitelist

**What goes wrong:**
Pages don't appear in navigation even though MDX files exist.

**Why it happens:**
From official docs: "When specified, items are not included unless they are listed in `pages`."

**Warning signs:**
- MDX files exist but don't show in sidebar
- Navigation incomplete
- No build errors but missing pages

**Prevention strategy:**
```json
// meta.json - Explicit whitelist behavior
{
  "title": "API",
  "pages": [
    "tools",      // ✅ Listed → appears
    "resources",  // ✅ Listed → appears
    // "prompts"  // ❌ Not listed → HIDDEN even if prompts.mdx exists
  ]
}

// Use "..." to include all pages
{
  "pages": [
    "index",
    "...",  // ✅ Includes all other pages
  ]
}
```

**Phase mapping:** Phase 2 (Navigation Structure)

**Confidence:** HIGH - Explicit behavior documented

---

### P4.2: Route Group Parentheses

**What goes wrong:**
Folder names appear in URLs when they shouldn't.

**Why it happens:**
From official docs: "Wrap the folder name in parentheses to avoid impacting the slugs of child files."

**Warning signs:**
- URLs include internal folder names
- Unexpected `/guides/` or `/sections/` in paths
- Routing structure doesn't match expectations

**Prevention strategy:**
```
content/docs/
├── (getting-started)/   ✅ Parentheses → doesn't affect URLs
│   └── intro.mdx        → /docs/intro
├── guides/              ❌ No parentheses → affects URLs
│   └── setup.mdx        → /docs/guides/setup
```

**Phase mapping:** Phase 2 (Navigation Structure)

**Confidence:** HIGH - Official docs explain convention

---

### P4.3: Base URL Mismatch

**What goes wrong:**
Links and navigation break because base URL doesn't match actual route structure.

**Why it happens:**
From official docs: "Update in source.ts" when renaming routes.

**Warning signs:**
- Navigation links 404
- Breadcrumbs show wrong paths
- Search results link to wrong URLs

**Prevention strategy:**
```ts
// lib/source.ts - MUST match route structure
export const source = loader({
  baseUrl: '/docs', // ✅ Matches app/[lang]/docs
});

// If route is app/[lang]/info/[[...slug]]
export const source = loader({
  baseUrl: '/info', // ✅ Update when route changes
});
```

**Phase mapping:** Phase 2 (Navigation Structure)

**Confidence:** HIGH - Documented requirement

---

## P5: MDX Configuration

### P5.1: Webpack Import Alias Conflicts

**What goes wrong:**
Import aliases from `tsconfig.json` don't work with Fumadocs MDX.

**Why it happens:**
From official docs: "Webpack resolves import namespace **before** your import aliases in `tsconfig.json`."

**Warning signs:**
- Module not found errors
- Import aliases work elsewhere but not with Fumadocs
- Build errors about fumadocs-mdx collections

**Prevention strategy:**
```json
// tsconfig.json - Use collections/* alias
{
  "compilerOptions": {
    "paths": {
      "collections/*": [".source/*"], // ✅ Required alias
      "@/*": ["./src/*"]              // ✅ Other aliases OK
    }
  }
}
```

```ts
// lib/source.ts - Use collections alias
import { docs } from 'collections/server'; // ✅ Works
// import { docs } from 'fumadocs-mdx:collections/server'; // ❌ Breaks
```

**Phase mapping:** Phase 1 (Setup)

**Confidence:** HIGH - Explicit workaround documented

---

### P5.2: Collection-Level mdxOptions Removes Defaults

**What goes wrong:**
Custom MDX options break default syntax highlighting and plugins.

**Why it happens:**
From official docs: "This will remove all default settings" when using collection-level `mdxOptions`.

**Warning signs:**
- Code blocks lose syntax highlighting
- Default Fumadocs features stop working
- Regression after adding custom MDX config

**Prevention strategy:**
```ts
// source.config.ts - Preserve defaults
import { applyMdxPreset } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  mdxOptions: applyMdxPreset({
    // ✅ Retains default settings
    rehypePlugins: [myPlugin],
  }),
});
```

**Phase mapping:** Phase 1 (Setup)

**Confidence:** HIGH - Documented in MDX config section

---

### P5.3: Non-Serializable Frontmatter

**What goes wrong:**
Build fails with frontmatter validation errors.

**Why it happens:**
From official docs: "The validation is done at build time, hence the output must be serializable."

**Warning signs:**
- Build-time validation errors
- Frontmatter with functions or dates fails
- Type errors in frontmatter schema

**Prevention strategy:**
```yaml
# DON'T: Functions, class instances, etc.
---
handler: () => {} ❌
date: new Date() ❌
---

# DO: JSON-serializable values only
---
dateString: "2026-01-17" ✅
value: 42 ✅
tags: ["tag1", "tag2"] ✅
---
```

**Phase mapping:** Phase 1 (Setup)

**Confidence:** HIGH - Build-time validation documented

---

## P6: Search Implementation

### P6.1: Async/Dynamic Mode Search Limitations

**What goes wrong:**
Built-in search performs poorly with async/dynamic content loading.

**Why it happens:**
From official docs: "We highly recommend to use third-party services to implement search, which usually have better capability."

**Warning signs:**
- Slow search on large docs
- Search index not including all content
- Poor search relevance

**Prevention strategy:**
```ts
// For async/dynamic mode - Use third-party search
import { AlgoliaSearch } from 'fumadocs-core/search/algolia';

// DON'T rely on built-in Flexsearch for large sites
// DO use Algolia, Orama, or other dedicated search services
```

**Phase mapping:** Phase 4 (AI Search)

**Confidence:** MEDIUM - Recommendation from official docs

---

## P7: Styling and Theming

### P7.1: Vite Pre-bundling Problems

**What goes wrong:**
Fumadocs UI components don't render correctly in Vite projects.

**Why it happens:**
From official docs: "There's some weird pre-bundling problems with Vite."

**Warning signs:**
- Components missing styles
- Vite build errors
- Runtime errors about missing modules

**Prevention strategy:**
```ts
// vite.config.ts - Required configuration
export default defineConfig({
  resolve: {
    noExternal: [
      'fumadocs-core',
      'fumadocs-ui',
      'fumadocs-openapi',
    ], // ✅ Exclude from pre-bundling
  },
});
```

**Phase mapping:** Phase 1 (Setup) - if using Vite

**Confidence:** HIGH - Explicit workaround documented

---

### P7.2: Component Customization Without CLI

**What goes wrong:**
Modifying Fumadocs components directly in node_modules causes loss of changes.

**Why it happens:**
Fumadocs uses Shadcn-style "fork" model via CLI, not direct modification.

**Warning signs:**
- Changes lost after npm install
- Component updates breaking customizations
- Difficulty tracking modifications

**Prevention strategy:**
```bash
# DON'T: Edit node_modules/fumadocs-ui directly ❌

# DO: Use CLI to fork components ✅
npx @fumadocs/cli add banner files
npx @fumadocs/cli customise

# Components copied to your project, safe to modify
```

**Phase mapping:** Phase 3 (Styling)

**Confidence:** HIGH - Official CLI-based workflow

---

## P8: TypeScript and Import Aliases

### P8.1: Framework Provider Not Wrapped

**What goes wrong:**
Fumadocs features fail silently without framework provider.

**Why it happens:**
Fumadocs requires framework-specific provider at root layout.

**Warning signs:**
- Features not working without clear errors
- Hydration mismatches
- Client-side functionality broken

**Prevention strategy:**
```tsx
// app/layout.tsx - REQUIRED provider
import { NextProvider } from 'fumadocs-core/framework/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextProvider>{children}</NextProvider> {/* ✅ Required */}
      </body>
    </html>
  );
}
```

**Phase mapping:** Phase 1 (Setup)

**Confidence:** MEDIUM - Framework requirement implied

---

## Phase Mapping Summary

| Phase | Pitfalls to Address | Priority |
|-------|---------------------|----------|
| **Phase 1: i18n Setup** | P1.1, P1.2, P1.3, P5.1, P5.2, P5.3, P8.1 | CRITICAL |
| **Phase 2: Navigation** | P4.1, P4.2, P4.3 | HIGH |
| **Phase 3: Icons/Assets** | P3.1, P3.2, P7.2 | HIGH |
| **Phase 4: AI Search** | P6.1 | MEDIUM |
| **Phase 5: Deployment** | P2.1, P2.2, P2.3 | CRITICAL |

## Don't Hand-Roll

These problems have existing solutions in Fumadocs:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon runtime conversion | Custom icon mapper | `icon` handler in loader config | Fumadocs expects string→JSX conversion |
| Search indexing | Custom search implementation | Algolia/Orama integration | Third-party services handle scale better |
| i18n routing | Custom middleware logic | Built-in i18n parser modes | Edge cases handled (fallbacks, cookies) |
| Component theming | Direct CSS overrides | CLI fork + customization | Maintains upgrade path |

## Checklist for Each Phase

Before marking phase complete, verify:

**Phase 1 (i18n Setup):**
- [ ] `hideLocale` is NOT 'always' for static sites (P1.1)
- [ ] Middleware matcher excludes static assets (P1.2)
- [ ] Single parser mode chosen and enforced (P1.3)
- [ ] Collections alias configured in tsconfig.json (P5.1)
- [ ] mdxOptions uses applyMdxPreset if customized (P5.2)
- [ ] Framework provider wraps app (P8.1)

**Phase 2 (Navigation):**
- [ ] meta.json pages arrays include all needed pages (P4.1)
- [ ] Route groups use parentheses where appropriate (P4.2)
- [ ] baseUrl matches actual route structure (P4.3)

**Phase 3 (Icons/Assets):**
- [ ] Icon handler configured in loader (P3.1)
- [ ] Images use URL paths, not imports (P3.2)
- [ ] Components forked via CLI, not edited in node_modules (P7.2)

**Phase 4 (AI Search):**
- [ ] Third-party search configured if using async/dynamic mode (P6.1)

**Phase 5 (Deployment):**
- [ ] Build cache clean script added (P2.1)
- [ ] Node.js version pinned correctly (P2.2)
- [ ] generateStaticParams implemented (P2.3)

## Sources

### Primary (HIGH confidence)
- https://www.fumadocs.dev/llms-full.txt - Complete Fumadocs documentation (fetched 2026-01-17)
  - i18n configuration warnings
  - Build cache behavior
  - Icon handler requirements
  - MDX constraints
  - Middleware configuration
  - File structure conventions

### Secondary (MEDIUM confidence)
- Official Fumadocs documentation website (via llms-full.txt)
- Fumadocs GitHub issues referenced in docs (#1021, #3910)

## Metadata

**Confidence breakdown:**
- i18n pitfalls: HIGH - Explicit warnings in official docs
- Build/deployment: HIGH - Documented cache and Node.js issues
- Icon configuration: HIGH - Required handler explicitly documented
- File structure: HIGH - Convention behavior documented
- Search recommendations: MEDIUM - Guidance, not strict requirements
- Vite configuration: HIGH - Specific workaround provided

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable framework)

**Note:** This research uses official Fumadocs documentation as primary source. All quoted text is from official docs. Phase assignments assume standard roadmap structure for adding enterprise features to existing Fumadocs site.
