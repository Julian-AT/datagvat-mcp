# Phase 10: Navigation Simplification - Research

**Researched:** 2026-01-22
**Domain:** Fumadocs documentation architecture, Next.js navigation patterns, repository hygiene
**Confidence:** HIGH

## Summary

Phase 10 consolidates 11 root-level navigation tabs into 3 main tabs (Docs/API/Try), fixes duplicate title rendering in MDX pages, improves README.md, and cleans repository structure. The current navigation has too many tabs due to Phase 2's folder group implementation - while folder groups reduce visual clutter, each subfolder with `"root": true` still becomes a tab. The solution requires restructuring content folders to nest under 3 root folders, implementing redirects for URL changes, removing manual H1 headings from MDX files, adding .editorconfig, and creating a professional README with badges and quick start.

**Current state:** 11 tabs (Getting Started, How-To Guides, Workflows, Examples, Reference, Tools Reference, API Reference, Integration, Best Practices, Advanced Topics, Tutorials) + 1 external link (/try page)

**Target state:** 3 tabs (Docs, API, Try) with clear information architecture, no duplicate titles, professional repository presentation

**Primary recommendation:** Use Fumadocs root folders for the 3 main tabs, nest existing content as non-root subfolders, implement Next.js redirects for URL preservation, remove manual H1 headings from all MDX files (Fumadocs DocsPage renders title automatically), add comprehensive .editorconfig matching Biome settings, create README with shields.io badges and quick start.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Fumadocs | 16.4.7 | Documentation framework | Project's existing framework, provides sidebar tabs via root folders |
| Next.js | 16.1.3 | Web framework | Fumadocs is built on Next.js, provides redirects/rewrites API |
| Biome | 2.3.11 | Linting/formatting | Already configured, provides code consistency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| EditorConfig | n/a | Cross-editor settings | Standardizes indentation/line endings across editors (VSCode, Vim, etc.) |
| shields.io | n/a | README badges | Industry standard for status badges (npm version, build status, license) |
| depcheck | latest | Unused dependency detection | Audit dependencies during cleanup |
| next-validate-link | 1.6.4 | Internal link validation | Already in devDependencies, validates links after restructure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs root folders | Custom tab component | Root folders are native Fumadocs pattern, custom would lose framework integration |
| Next.js redirects | Client-side routing | Server redirects preserve SEO and work without JavaScript |
| EditorConfig | Only Biome config | EditorConfig works across all editors, Biome requires extension install |
| shields.io badges | Custom badge service | shields.io is universal standard, supports all major CI/CD services |

**Installation:**
```bash
# EditorConfig requires no installation (native IDE support)
# To audit dependencies:
bun add -d depcheck
bun depcheck

# Link validation already available:
bun run lint:links
```

## Architecture Patterns

### Recommended 3-Tab Structure
```
docs/content/docs/
├── docs/                     [Tab 1: Docs - root: true]
│   ├── getting-started/      [Nested, no root flag]
│   ├── guides/               [Nested, no root flag]
│   ├── workflows/            [Nested, no root flag]
│   ├── examples/             [Nested, no root flag]
│   ├── integration/          [Nested, no root flag]
│   ├── best-practices/       [Nested, no root flag]
│   └── advanced/             [Nested, no root flag]
├── api/                      [Tab 2: API - root: true]
│   ├── openapi/              [Auto-generated from OpenAPI]
│   └── tools/                [MCP tool reference]
└── try/                      [Tab 3: Try - external link to /try page]
```

**Key insight:** Root folders (`"root": true` in meta.json) become sidebar tabs in Fumadocs. Current structure has 11 root folders creating 11 tabs. Solution: only 2 root folders (docs, api), nest everything else inside them without root flags.

### Pattern 1: Root Folder Configuration
**What:** Root folders become tabs in Fumadocs sidebar
**When to use:** Top-level navigation sections only (Docs, API)

**Example:**
```json
// docs/content/docs/docs/meta.json
{
  "$schema": "../../.source/json-schema/docs.meta.json",
  "title": "Documentation",
  "description": "Complete guides, workflows, and examples",
  "icon": "BookOpen",
  "root": true,
  "pages": [
    "getting-started",
    "guides",
    "workflows",
    "examples",
    "---[Settings]Advanced---",
    "integration",
    "best-practices",
    "advanced"
  ]
}
```

**Source:** Current implementation at `docs/content/docs/getting-started/meta.json`, Fumadocs DocsLayout sidebar.tabs handling

### Pattern 2: Nested Folder (Non-Root)
**What:** Folders without `"root": true` become nested navigation items, not tabs
**When to use:** All content categories under main tabs

**Example:**
```json
// docs/content/docs/docs/getting-started/meta.json
{
  "$schema": "../../.source/json-schema/docs.meta.json",
  "title": "Getting Started",
  "description": "Set up and start using data.gv.at MCP Server",
  "icon": "Rocket",
  // NO "root": true - this is nested under "docs" tab
  "defaultOpen": true,
  "pages": [
    "index",
    "quickstart",
    "installation",
    "first-query",
    "quick-reference",
    "troubleshooting"
  ]
}
```

### Pattern 3: Next.js Redirects for URL Preservation
**What:** Server-side redirects preserve old URLs after restructure
**When to use:** Whenever content moves (NAV-03 requirement)

**Example:**
```javascript
// docs/next.config.mjs
const config = {
  async redirects() {
    return [
      // Old root-level URLs redirect to new nested paths
      {
        source: '/docs/getting-started/:path*',
        destination: '/docs/docs/getting-started/:path*',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/docs/guides/:path*',
        destination: '/docs/docs/guides/:path*',
        permanent: true,
      },
      {
        source: '/docs/workflows/:path*',
        destination: '/docs/docs/workflows/:path*',
        permanent: true,
      },
      // ... more redirects for all moved content
    ];
  },
};
```

**Source:** Next.js redirects API documentation, existing rewrites implementation in next.config.mjs

### Pattern 4: Remove Duplicate H1 from MDX
**What:** DocsPage component automatically renders `page.data.title` as H1
**When to use:** All MDX documentation files

**Current (duplicate):**
```mdx
---
title: Quickstart
description: Get your first data.gv.at MCP Server query results
---

# Quickstart  <!-- DUPLICATE - remove this -->

Search for Austrian open datasets...
```

**Fixed (no duplicate):**
```mdx
---
title: Quickstart
description: Get your first data.gv.at MCP Server query results
---

<!-- H1 rendered automatically by DocsPage, start content directly -->
Search for Austrian open datasets...
```

**Source:** Current implementation at `docs/app/[lang]/docs/[[...slug]]/page.tsx` line 72: `<h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>`

### Pattern 5: EditorConfig Setup
**What:** Cross-editor configuration file standardizes formatting
**When to use:** All projects with multiple contributors or editors

**Example:**
```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.py]
indent_size = 4
```

**Matches existing Biome config:**
- `indent_style = space` matches `"indentStyle": "space"`
- `indent_size = 2` matches `"indentWidth": 2`
- `end_of_line = lf` (Git handles CRLF → LF on commit)

### Pattern 6: Professional README Structure
**What:** Standard README sections with badges, quick start, links
**When to use:** All open-source projects, especially libraries/tools

**Structure:**
```markdown
# Project Name

<!-- Badges -->
![npm version](...)
![Build Status](...)
![License](...)

<!-- Value proposition -->
One-line description of what it does and why it matters.

<!-- Visual demo -->
[Screenshot or animated GIF]

<!-- Quick start -->
## Quick Start
3-5 commands to get first successful result in <5 minutes

## Features
- Key capability 1
- Key capability 2
- Key capability 3

## Installation
Complete installation instructions

## Documentation
Link to full documentation site

## Contributing
Link to CONTRIBUTING.md

## License
[MIT License](LICENSE)
```

**Badges (shields.io):**
- `https://img.shields.io/github/package-json/v/USER/REPO` - Version from package.json
- `https://img.shields.io/github/actions/workflow/status/USER/REPO/WORKFLOW.yml` - CI status
- `https://img.shields.io/github/license/USER/REPO` - License badge
- `https://img.shields.io/badge/MCP-compatible-blue` - Custom badge

**Source:** Industry standard pattern used by major OSS projects (Next.js, React, Vue, etc.)

### Anti-Patterns to Avoid
- **Folder groups for 3 tabs:** Folder groups `(name)` are for visual grouping of multiple tabs, not needed when you only have 3 tabs total
- **Client-side redirects only:** Use Next.js `redirects()` for 301/308 permanent redirects (SEO-friendly), not `useRouter()` client-side
- **Relative redirects in Next.js:** Use absolute paths starting with `/docs/` not relative `../`
- **Manual H1 in MDX when using DocsPage:** DocsPage automatically renders title, manual H1 creates duplicate
- **Overly complex .editorconfig:** Match your existing formatter (Biome), don't add conflicting rules
- **Generic README badges:** Use actual CI/CD status, not placeholder badges

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL redirects | Custom middleware | Next.js `redirects()` config | Built-in support, handles SEO headers (301), works at edge |
| Link validation | Manual checking | `next-validate-link` package | Already in dependencies, finds broken internal links |
| README badges | SVG generation | shields.io API | Industry standard, auto-updates from GitHub/npm APIs |
| Unused dependency detection | Manual review | `depcheck` CLI | Static analysis finds unused imports, handles complex cases |
| Editor consistency | Manual style guide | EditorConfig | Universal editor support (VSCode, Vim, IntelliJ, etc.) |
| Tab structure | Custom components | Fumadocs root folders | Native framework feature, automatic tab generation |

**Key insight:** Fumadocs sidebar tabs are not configured in layout code - they're automatically generated from folder structure. Any folder with `"root": true` in its meta.json becomes a tab. This is why the project has 11 tabs despite using folder groups.

## Common Pitfalls

### Pitfall 1: Root Flag Propagation
**What goes wrong:** Adding nested folders with `"root": true` creates more tabs instead of fewer
**Why it happens:** Misunderstanding that root folders become tabs regardless of nesting depth
**How to avoid:** Only set `"root": true` on the 2 top-level folders (docs, api), remove from all nested content
**Warning signs:** Tab count doesn't decrease after restructure, sidebar shows unexpected tabs

### Pitfall 2: Redirect Loops
**What goes wrong:** Redirects create infinite loops (A → B → A) causing browser errors
**Why it happens:** Forgetting that Next.js processes redirects in order, overlapping patterns
**How to avoid:**
- Use most specific patterns first
- Never redirect to a path that redirects back
- Test with `curl -I` to see redirect chain
**Warning signs:** Browser shows "Too many redirects", page loads indefinitely

### Pitfall 3: Schema Path Breakage
**What goes wrong:** Moving meta.json files breaks `$schema` references, losing autocomplete
**Why it happens:** Schema paths are relative (`../../.source/json-schema/docs.meta.json`)
**How to avoid:**
- Add/remove `../` for each folder level change
- Test: open meta.json in VSCode, verify autocomplete works
**Warning signs:** No autocomplete in meta.json, red squiggles under `$schema`

### Pitfall 4: Incomplete Redirects
**What goes wrong:** Some old URLs 404 after restructure, breaking external links
**Why it happens:** Missing edge cases (trailing slashes, index pages, hash links)
**How to avoid:**
- Map ALL existing URLs (use sitemap or crawl)
- Test each redirect with actual HTTP requests
- Handle trailing slash variants (`/path` and `/path/`)
**Warning signs:** Link validation fails, 404 errors in build logs

### Pitfall 5: Manual H1 After Fumadocs Update
**What goes wrong:** Updating Fumadocs version that auto-renders titles creates duplicate H1s
**Why it happens:** MDX files have manual `# Title` from before DocsPage auto-render feature
**How to avoid:**
- Check DocsPage source to verify title rendering behavior
- Search for `^# ` in all MDX files and remove if duplicate
- Create verification script to detect duplicate titles
**Warning signs:** Two titles on page, poor SEO (multiple H1s), accessibility violations

### Pitfall 6: EditorConfig vs Formatter Conflicts
**What goes wrong:** EditorConfig settings conflict with Biome, causing format-on-save fights
**Why it happens:** Different indentation/line-ending rules between tools
**How to avoid:**
- Match EditorConfig to Biome settings exactly
- Test in multiple editors (VSCode, Vim) to verify consistency
- Ensure Git handles line endings (`.gitattributes` if needed)
**Warning signs:** File reformats repeatedly, indentation flips between save cycles

### Pitfall 7: GitHub Badge Cache Issues
**What goes wrong:** README badges show stale data (old version, wrong status)
**Why it happens:** shields.io caches responses, CDN caching
**How to avoid:**
- Use `?cacheSeconds=300` for faster updates during development
- Remove after testing (default cache is fine for production)
- Use `https://img.shields.io/badge/...` format correctly
**Warning signs:** Badge shows wrong version after release, status doesn't update

## Code Examples

Verified patterns from official sources:

### Comprehensive Redirect Mapping
```javascript
// docs/next.config.mjs
const config = {
  async redirects() {
    return [
      // === DOCS TAB REDIRECTS ===
      // Getting Started (root → nested under docs)
      {
        source: '/docs/getting-started/:path*',
        destination: '/docs/docs/getting-started/:path*',
        permanent: true,
      },
      // Guides (root → nested under docs)
      {
        source: '/docs/guides/:path*',
        destination: '/docs/docs/guides/:path*',
        permanent: true,
      },
      // Workflows (root → nested under docs)
      {
        source: '/docs/workflows/:path*',
        destination: '/docs/docs/workflows/:path*',
        permanent: true,
      },
      // Examples (root → nested under docs)
      {
        source: '/docs/examples/:path*',
        destination: '/docs/docs/examples/:path*',
        permanent: true,
      },
      // Integration (moved from advanced folder group)
      {
        source: '/docs/integration/:path*',
        destination: '/docs/docs/integration/:path*',
        permanent: true,
      },
      // Best Practices (moved from advanced folder group)
      {
        source: '/docs/best-practices/:path*',
        destination: '/docs/docs/best-practices/:path*',
        permanent: true,
      },
      // Advanced Topics (moved from advanced folder group)
      {
        source: '/docs/advanced/:path*',
        destination: '/docs/docs/advanced/:path*',
        permanent: true,
      },

      // === API TAB REDIRECTS ===
      // Reference → API (consolidate)
      {
        source: '/docs/reference/:path*',
        destination: '/docs/api/:path*',
        permanent: true,
      },
      // Tools Reference → API/Tools
      {
        source: '/docs/tools/:path*',
        destination: '/docs/api/tools/:path*',
        permanent: true,
      },
      // API Reference → API (already at /docs/api-reference)
      {
        source: '/docs/api-reference/:path*',
        destination: '/docs/api/:path*',
        permanent: true,
      },

      // === TUTORIALS (deprecated, redirect to getting started) ===
      {
        source: '/docs/tutorials/:path*',
        destination: '/docs/docs/getting-started/:path*',
        permanent: true,
      },
    ];
  },
  // Existing rewrites preserved
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
```

**Source:** Current next.config.mjs structure, Next.js redirects API

### Mobile Viewport Testing Checklist
```typescript
// docs/scripts/test-mobile-navigation.ts
/**
 * Mobile navigation verification (NAV-04)
 * Run manually with various viewport sizes
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },   // iPhone SE
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1920, height: 1080 }, // Desktop
};

const NAVIGATION_TESTS = [
  'Sidebar tabs visible and clickable',
  'Tab content switches correctly',
  'No horizontal scroll',
  'Touch targets ≥44px',
  'Hamburger menu works (mobile)',
  'Search accessible',
];

// Manual testing steps:
// 1. bun dev
// 2. Open DevTools → Responsive Design Mode
// 3. Test each viewport size
// 4. Verify all NAVIGATION_TESTS pass
```

**Source:** Standard mobile testing pattern, WCAG 2.1 touch target guidelines

### Link Validation Script (already exists)
```bash
# Validate all internal links after restructure (NAV-05)
cd docs
bun run lint:links

# This runs scripts/validate-links.ts
# Uses next-validate-link package (already in devDependencies)
```

**Source:** Existing scripts/validate-links.ts in project

### EditorConfig Matching Biome
```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100

[*.md]
trim_trailing_whitespace = false
max_line_length = off

[*.{json,yml,yaml}]
indent_size = 2

[*.py]
indent_size = 4
```

**Matches Biome settings:**
- `indentStyle: "space"` → `indent_style = space`
- `indentWidth: 2` → `indent_size = 2`
- `lineWidth: 100` → `max_line_length = 100`

**Source:** EditorConfig specification, current biome.json settings

### Professional README Template
```markdown
# data.gv.at MCP Server

![Version](https://img.shields.io/github/package-json/v/julian-at/datagvat-mcp)
![Build Status](https://img.shields.io/github/actions/workflow/status/julian-at/datagvat-mcp/build.yml)
![License](https://img.shields.io/github/license/julian-at/datagvat-mcp)
![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)

Access Austrian Open Government Data through Claude and other MCP clients with semantic search, quality scoring, and data preview capabilities.

[Screenshot of Claude using the MCP server]

## Quick Start

Get your first dataset in under 5 minutes:

```bash
# Install via npm (once published)
npm install -g @datagvat/mcp-server

# Or run directly from source
git clone https://github.com/julian-at/datagvat-mcp.git
cd datagvat-mcp
uv venv && source .venv/bin/activate
uv pip install -e .

# Configure Claude Desktop (macOS)
open ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Add configuration (see Installation Guide)

# Restart Claude Desktop and try:
# "Find datasets about Vienna population"
```

## Features

- **🔍 Semantic Search** - Natural language queries with automatic term expansion
- **⚡ Quality Scoring** - Automatic dataset quality assessment (0-100 scale)
- **👁️ Data Preview** - Inspect CSV/JSON contents before download
- **🌐 10,000+ Datasets** - Complete data.gv.at catalog access
- **🇦🇹 🇩🇪 Bilingual** - German/English documentation and i18n support

## Installation

See [Installation Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/installation) for complete instructions including:
- Claude Desktop integration
- Cline/Windsurf setup
- API configuration

## Documentation

Full documentation at **[datagvat-mcp.vercel.app](https://datagvat-mcp.vercel.app)**

- [Quick Start Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/quickstart)
- [Workflow Examples](https://datagvat-mcp.vercel.app/docs/docs/workflows)
- [API Reference](https://datagvat-mcp.vercel.app/docs/api)

## Contributing

Contributions welcome! See [Contributing Guidelines](CONTRIBUTING.md).

## License

[MIT License](LICENSE)

---

Built with [Model Context Protocol](https://modelcontextprotocol.io) | [data.gv.at](https://www.data.gv.at)
```

**Source:** Industry standard README patterns from major OSS projects

### Unused Dependency Detection
```bash
# Audit dependencies (CLEAN-03)
cd docs
bunx depcheck

# Example output:
# Unused dependencies
# * package-a
# * package-b
#
# Unused devDependencies
# * package-c

# Review output and remove unused packages:
bun remove package-a package-b package-c
```

**Source:** depcheck npm package, standard dependency audit approach

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual tab configuration | Root folder auto-generation | Fumadocs 10+ | Tabs generated from folder structure, not layout code |
| Client-side redirects | Server-side redirects | Next.js 12+ | Better SEO, works without JavaScript |
| README with text only | Badges + visual demos | ~2020 | Immediate credibility, status visibility |
| .eslintrc + Prettier | Biome | 2024 | Single tool for lint+format, faster |
| Manual H1 in MDX | Auto-rendered from frontmatter | Fumadocs 13+ | Prevents duplicate titles, consistent styling |

**Deprecated/outdated:**
- Folder groups for tab reduction: Folder groups `(name)` provide visual organization but don't reduce tab count. Only removing `"root": true` flags reduces tabs.
- Next.js `basePath` for redirects: Use `redirects()` config instead, more explicit and SEO-friendly
- Custom link validation scripts: `next-validate-link` package is standard, maintained solution

## Open Questions

Things that couldn't be fully resolved:

1. **Try page integration**
   - What we know: `/try` page exists as external link in navigation
   - What's unclear: Should "Try" be a third root tab or remain external link?
   - Recommendation: Keep as external link in root meta.json (`external:[Try MCP Server](/try)`), since it's a Next.js page outside docs content structure

2. **Tutorials folder handling**
   - What we know: `tutorials/` folder has `"root": true` but may be orphaned content
   - What's unclear: Is this content still relevant or should it be archived?
   - Recommendation: Review content, either merge into getting-started or delete. Don't create redirects for unused content.

3. **API-Reference vs Reference consolidation**
   - What we know: Two separate folders exist (api-reference, reference)
   - What's unclear: Why are they separate? Different content types?
   - Recommendation: Consolidate both under single `api/` root folder with subfolders for openapi and tools

4. **Build verification timing**
   - What we know: BUILD-01 through BUILD-05 requirements must pass
   - What's unclear: Should build run after each sub-task or only at phase end?
   - Recommendation: Run quick checks (`bun lint`, `bun type-check`) after each change, full build only at phase end

## Sources

### Primary (HIGH confidence)
- Current project structure: `docs/content/docs/meta.json` and all subfolder meta.json files
- DocsPage implementation: `docs/app/[lang]/docs/[[...slug]]/page.tsx` (line 72 shows title rendering)
- Fumadocs DocsLayout API: https://www.fumadocs.dev/docs/ui/layouts/docs (sidebar.tabs configuration)
- Next.js redirects API: Current `docs/next.config.mjs` implementation
- Biome configuration: `docs/biome.json`
- Navigation migration map: `.planning/navigation-migration-map.md` (Phase 2 v2.0 work)

### Secondary (MEDIUM confidence)
- EditorConfig specification: Standard cross-editor configuration format (universal support)
- shields.io badges: Industry standard badge service (GitHub, npm, CI/CD integrations)
- depcheck tool: Standard unused dependency detection for npm/bun projects

### Tertiary (LOW confidence)
- Mobile viewport sizes: Common device dimensions (iPhone SE, iPad, desktop), verify against project's target browsers
- README structure best practices: Industry patterns observed across major OSS projects, not formally specified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies (Fumadocs, Next.js, Biome)
- Architecture: HIGH - Verified from current codebase and Fumadocs official docs
- Pitfalls: HIGH - Based on current implementation analysis and framework behavior

**Research date:** 2026-01-22
**Valid until:** 30 days (Fumadocs stable, Next.js stable, EditorConfig unchanged for years)

**Key findings verified:**
- ✅ 11 root folders currently exist (counted from `grep "root": true` in meta.json files)
- ✅ DocsPage auto-renders title at line 72 of page.tsx (duplicate H1 confirmed)
- ✅ Fumadocs root folders become sidebar tabs (confirmed from DocsLayout behavior)
- ✅ Next.js redirects API exists in next.config.mjs (rewrites already implemented)
- ✅ Biome already configured with specific indentation/formatting rules
- ✅ No .editorconfig currently exists (confirmed with `ls -la`)
- ✅ No root README.md exists (confirmed with file read failure)
