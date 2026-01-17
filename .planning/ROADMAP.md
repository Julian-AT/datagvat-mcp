# Roadmap: Austria MCP

## Overview

Documentation excellence journey from fixing foundation issues through AI integration, search enhancement, visual polish, and user engagement features. Builds on the solid v1.0 MCP server to create world-class documentation for Austrian open data.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 10: Foundation Fixes** - Fix i18n, routing, styling, and navigation issues
- [ ] **Phase 11: LLM Integration** - Enable AI-optimized documentation consumption
- [ ] **Phase 12: Search Enhancement** - Implement powerful search with AI features
- [ ] **Phase 13: Icon Integration** - Add visual navigation aids throughout
- [ ] **Phase 14: Visual & Social** - Perfect appearance and social sharing
- [ ] **Phase 15: User Engagement** - Feedback system and analytics

## Phase Details

### Phase 10: Foundation Fixes
**Goal**: All core documentation infrastructure works correctly
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. User can switch between EN/DE and navigation works in both languages
  2. User can browse all documentation pages without broken links or styling issues
  3. Documentation displays correctly on mobile, tablet, and desktop devices
  4. i18n routing redirects to correct locale automatically
**Research**: Likely (Next.js App Router + Fumadocs i18n patterns)
**Research topics**: Next.js i18n middleware configuration, Fumadocs language switcher integration, App Router layout requirements
**Plans**: TBD

Plans:
- [ ] 10-01: [To be planned]

### Phase 11: LLM Integration
**Goal**: AI assistants can consume documentation optimally
**Depends on**: Phase 10 (needs stable foundation)
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05
**Success Criteria** (what must be TRUE):
  1. AI agents can fetch /llms.txt and get full documentation export
  2. AI agents can request individual pages as .mdx via accept headers
  3. Code blocks have optimized copy actions for AI tools
  4. All processed markdown content is accessible to AI requests
**Research**: Likely (Fumadocs LLM features and llms.txt spec)
**Research topics**: Fumadocs MDX processing API, llms.txt format specification, accept header negotiation patterns
**Plans**: TBD

Plans:
- [ ] 11-01: [To be planned]

### Phase 12: Search Enhancement
**Goal**: Users can find documentation content quickly
**Depends on**: Phase 10 (needs stable content structure)
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-06, SEARCH-07
**Success Criteria** (what must be TRUE):
  1. User can open search dialog via keyboard shortcut
  2. Search returns relevant results in < 200ms
  3. Search works correctly in both German and English
  4. AI-powered search enables conversational queries
  5. Search results are properly ranked by relevance
**Research**: Likely (Orama search + AI integration)
**Research topics**: Orama index generation for i18n content, Fumadocs AI search dialog, search API endpoints, multilingual indexing strategies
**Plans**: TBD

Plans:
- [ ] 12-01: [To be planned]

### Phase 13: Icon Integration
**Goal**: Visual navigation aids throughout documentation
**Depends on**: Phase 10 (needs stable component structure)
**Requirements**: ICON-01, ICON-02, ICON-03, ICON-04
**Success Criteria** (what must be TRUE):
  1. Icons display in navigation menus
  2. Icons work in Cards and Callouts components
  3. Icon library loads without errors
**Research**: Unlikely (lucide-react already installed, standard integration)
**Plans**: TBD

Plans:
- [ ] 13-01: [To be planned]

### Phase 14: Visual & Social
**Goal**: Professional appearance and social sharing
**Depends on**: Phase 10 (needs stable pages)
**Requirements**: VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04, VISUAL-05, VISUAL-06
**Success Criteria** (what must be TRUE):
  1. Every documentation page has proper OG image for social sharing
  2. SEO metadata complete (OpenGraph, Twitter cards, language alternates)
  3. Sitemap generated and accessible to search engines
  4. Images are optimized and responsive
**Research**: Likely (Fumadocs OG image generation, Next.js metadata API)
**Research topics**: Fumadocs OG image generation, Next.js 15 metadata API, sitemap generation for i18n sites
**Plans**: TBD

Plans:
- [ ] 14-01: [To be planned]

### Phase 15: User Engagement
**Goal**: Users can provide feedback and usage is tracked
**Depends on**: Phase 10 (needs stable pages for feedback widgets)
**Requirements**: ENGAGE-01, ENGAGE-02, ENGAGE-03, ENGAGE-04, ENGAGE-05
**Success Criteria** (what must be TRUE):
  1. User can submit feedback on any page
  2. User can give feedback on specific content blocks
  3. Feedback creates GitHub discussion automatically
  4. Usage analytics track page views and interactions
**Research**: Likely (Fumadocs feedback system + GitHub integration)
**Research topics**: Fumadocs feedback widgets, GitHub Discussions API, analytics providers (PostHog vs alternatives)
**Plans**: TBD

Plans:
- [ ] 15-01: [To be planned]

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Foundation Fixes | 0/TBD | Not started | - |
| 11. LLM Integration | 0/TBD | Not started | - |
| 12. Search Enhancement | 0/TBD | Not started | - |
| 13. Icon Integration | 0/TBD | Not started | - |
| 14. Visual & Social | 0/TBD | Not started | - |
| 15. User Engagement | 0/TBD | Not started | - |
