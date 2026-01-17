# Requirements: Austria MCP v1.1

**Defined:** 2026-01-17
**Core Value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## v1.1 Requirements

Requirements for v1.1 Documentation Excellence milestone. Each maps to roadmap phases.

### Foundation Fixes

- [ ] **FOUND-01**: i18n routing works correctly with middleware (locale detection, redirects, navigation)
- [ ] **FOUND-02**: Root layout structure follows Next.js App Router requirements (HTML in app/layout.tsx)
- [ ] **FOUND-03**: Internal navigation and links function correctly across all pages
- [ ] **FOUND-04**: Styling is consistent across all pages (Tailwind CSS integration verified)
- [ ] **FOUND-05**: Language switcher works correctly (EN ↔ DE)
- [ ] **FOUND-06**: Responsive design works on mobile, tablet, desktop

### LLM Integration

- [ ] **LLM-01**: llms.txt generation endpoint provides full documentation export
- [ ] **LLM-02**: Per-page MDX access via .mdx endpoints for AI agents
- [ ] **LLM-03**: Accept header negotiation serves MDX to AI requests automatically
- [ ] **LLM-04**: LLM copy actions enable optimized code block copying for AI tools
- [ ] **LLM-05**: Processed markdown includes all documentation content (includeProcessedMarkdown: true)

### Search & Discovery

- [ ] **SEARCH-01**: Basic search functionality with Orama index generation
- [ ] **SEARCH-02**: Search dialog UI accessible via keyboard shortcut
- [ ] **SEARCH-03**: Language-aware search indexing (separate German/English indices)
- [ ] **SEARCH-04**: Search API endpoint serves search requests
- [ ] **SEARCH-05**: AI-powered search dialog for conversational queries
- [ ] **SEARCH-06**: Search results relevant and properly ranked
- [ ] **SEARCH-07**: Search performance acceptable (< 200ms response time)

### Icon Integration

- [ ] **ICON-01**: Icon handler configured in source loader
- [ ] **ICON-02**: Icons display throughout navigation menus
- [ ] **ICON-03**: Icons integrated in Cards and Callouts components
- [ ] **ICON-04**: Icon library (lucide-react) properly imported and functional

### Visual & Social

- [ ] **VISUAL-01**: OG image generation for all documentation pages
- [ ] **VISUAL-02**: OG images use proper styling and branding
- [ ] **VISUAL-03**: Enhanced SEO metadata (OpenGraph, Twitter cards, alternate language links)
- [ ] **VISUAL-04**: Sitemap generation for search engines
- [ ] **VISUAL-05**: Proper metadata inheritance across all pages
- [ ] **VISUAL-06**: Image optimization and responsive images

### User Engagement

- [ ] **ENGAGE-01**: Page-level feedback widgets installed and functional
- [ ] **ENGAGE-02**: Block-level feedback for specific content sections
- [ ] **ENGAGE-03**: GitHub Discussions integration for feedback persistence
- [ ] **ENGAGE-04**: Analytics integration for usage tracking (PostHog or similar)
- [ ] **ENGAGE-05**: Feedback submission creates GitHub discussion automatically

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **FUTURE-01**: Video tutorials and animated guides
- **FUTURE-02**: Interactive code playground for MCP tool testing
- **FUTURE-03**: Versioned documentation (v1.0, v1.1 separate docs)
- **FUTURE-04**: Changelog automation from git commits
- **FUTURE-05**: Multi-product documentation (if expanding beyond Austria MCP)
- **FUTURE-06**: Custom AI model training on documentation corpus
- **FUTURE-07**: A/B testing for documentation improvements

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Video hosting infrastructure | Use YouTube/Vimeo; focus on documentation not hosting |
| Custom icon library | Use lucide-react (already installed); avoid maintenance burden |
| Self-hosted AI search | External provider (Inkeep) or custom LLM sufficient; infrastructure complexity |
| Real-time collaboration | Documentation is read-only; feedback system handles user input |
| Custom CMS/admin panel | MDX files in git are simpler; avoid complexity |
| Multi-language beyond DE/EN | Austrian focus, two languages sufficient |
| PDF/print styling | Web-first approach; users can browser print if needed |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (To be populated by create-roadmap) | | |

**Coverage:**
- v1.1 requirements: 30 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-01-17*
*Last updated: 2026-01-17 after v1.1 milestone initialization*
