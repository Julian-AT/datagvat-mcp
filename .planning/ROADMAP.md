# Roadmap: Austria MCP

## Overview

Transform Austria MCP from basic discovery server to comprehensive data portal with smart search, quality insights, data preview, and AI-powered semantic matching. Six phases progress from enterprise foundation through intelligent discovery.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Enterprise Foundation** - Production-ready infrastructure with retries, rate limiting, and structured logging
- [x] **Phase 2: Basic Search** - Full-text search with faceted filtering, sorting, and fuzzy matching
- [x] **Phase 3: Quality & Autocomplete** - Quality-aware ranking and search suggestions
- [x] **Phase 4: Data Preview** - Schema introspection and data preview for tabular datasets
- [x] **Phase 5: Related Datasets** - Content-based dataset similarity and recommendations
- [x] **Phase 6: Semantic Search** - Natural language query understanding via LLM
- [x] **Phase 7: API Endpoint Fix** - Correct API base URL and response handling
- [ ] **Phase 8: Workflow Optimization & Fumadocs Documentation** - Optimize workflow and create i18n documentation site

## Phase Details

### Phase 1: Enterprise Foundation
**Goal**: Robust, production-ready server infrastructure
**Depends on**: Nothing (first phase)
**Requirements**: ENTERPRISE-01, ENTERPRISE-02, ENTERPRISE-03, ENTERPRISE-04, ENTERPRISE-05, ENTERPRISE-06, ENTERPRISE-07, ENTERPRISE-08
**Success Criteria** (what must be TRUE):
  1. Server retries failed API calls with exponential backoff
  2. Server limits request rate to prevent API overload
  3. All tool errors return consistent format with correlation IDs
  4. Logs are structured JSON with request tracing
  5. Server gracefully handles Piveau API downtime
**Research**: Likely (FastMCP 2.14+ upgrade, new middleware patterns)
**Research topics**: FastMCP 2.14+ middleware API, RetryMiddleware configuration, RateLimitingMiddleware patterns, StructuredLoggingMiddleware integration
**Plans**: 3

Plans:
- [x] 01-01: FastMCP 2.14 Upgrade + Middleware Integration (5 min)
- [x] 01-02: Error Handling & Progress Reporting (9 min)
- [x] 01-03: Input Validation & Graceful Degradation (13 min)

### Phase 2: Basic Search
**Goal**: Users can search and filter datasets effectively
**Depends on**: Phase 1
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-06, SEARCH-07, SEARCH-08
**Success Criteria** (what must be TRUE):
  1. User can search datasets by text query and see relevant results
  2. User can filter results by theme, format, publisher, and date
  3. User can sort results by relevance, date, or title
  4. Search handles typos and returns fuzzy-matched results
  5. Pagination shows total count and navigates result pages
**Research**: Likely (Piveau API search capabilities verification)
**Research topics**: Piveau Hub search endpoint parameters, backend vs client-side filtering tradeoffs, fuzzy matching algorithms, relevance ranking strategies
**Plans**: 3

Plans:
- [x] 02-01: Client Layer Search Enhancement (6 min)
- [x] 02-02: Enhanced MCP Tool with Filters (8 min)
- [x] 02-03: Test Gap Closure (4 min)

### Phase 3: Quality & Autocomplete
**Goal**: Search results ranked by quality with smart suggestions
**Depends on**: Phase 2
**Requirements**: ADVSEARCH-01, ADVSEARCH-02
**Success Criteria** (what must be TRUE):
  1. High-quality datasets appear higher in search results
  2. User receives autocomplete suggestions while typing queries
**Research**: Unlikely (uses existing metrics tool and vocabulary endpoints)
**Plans**: 1

Plans:
- [x] 03-01: Quality & Autocomplete Enhancement (4 min)

### Phase 4: Data Preview
**Goal**: Users can inspect dataset schemas and sample data
**Depends on**: Phase 1
**Requirements**: PREVIEW-01, PREVIEW-02
**Success Criteria** (what must be TRUE):
  1. User can view column names and types for CSV/JSON datasets
  2. User can see first 10-20 rows of tabular data
  3. Preview respects size limits and handles errors gracefully
**Research**: Likely (file parsing, HTTP range headers, format handling)
**Research topics**: HTTP Range header support on data.gv.at distributions, CSV/JSON parsing libraries with size limits, encoding detection, preview size optimization
**Plans**: 2

Plans:
- [x] 04-01: Preview Service Core (6 min)
- [x] 04-02: MCP Tools Integration (8 min)

### Phase 5: Related Datasets
**Goal**: Users discover similar datasets through content similarity
**Depends on**: Phase 2
**Requirements**: PREVIEW-03
**Success Criteria** (what must be TRUE):
  1. User can discover similar datasets based on themes and keywords
  2. Related suggestions are relevant to the original dataset
**Research**: Unlikely (content-based similarity using existing metadata)
**Plans**: 1

Plans:
- [x] 05-01: Similarity Service & Related Datasets Tool

### Phase 6: Semantic Search
**Goal**: Natural language queries matched semantically
**Depends on**: Phase 2, Phase 3
**Requirements**: ADVSEARCH-03
**Success Criteria** (what must be TRUE):
  1. User can search using natural language and get semantically relevant results
  2. Semantic search handles multilingual queries (English/German)
  3. Search falls back gracefully if LLM sampling unavailable
**Research**: Likely (FastMCP sampling API, LLM integration patterns)
**Research topics**: FastMCP Context.sample() API, modelPreferences configuration, sampling rejection handling, query expansion strategies, multilingual semantic matching
**Plans**: TBD

Plans:
- [x] 06-01: Semantic Search Implementation

### Phase 7: API Endpoint Fix
**Goal**: Correct API endpoint configuration for data.gv.at search API
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. API base URL points to correct search endpoint (www.data.gv.at/api/hub/search)
  2. Search requests return valid results without 404 errors
  3. Response unwrapping handles {"result": {...}} structure correctly
  4. Catalogue and dataset retrieval work with new endpoint
  5. Facet parameter names match API expectations (categories not theme)
**Research**: Complete (API exploration done)
**Plans**: 1

Plans:
- [x] 07-01: API Endpoint Configuration Fix

### Phase 8: Workflow Optimization & Fumadocs Documentation
**Goal**: Optimize codebase workflow and create comprehensive bilingual documentation site
**Depends on**: Phase 7
**Success Criteria** (what must be TRUE):
  1. Code workflow optimized for best practices and maintainability
  2. Fumadocs site deployed with modern, searchable documentation
  3. Full internationalization support for German and English
  4. API reference, tutorials, and examples fully documented
  5. Documentation includes setup guides, tool usage, and best practices
**Research**: Likely (Fumadocs framework, i18n patterns, documentation structure)
**Research topics**: Fumadocs setup and configuration, Next.js app router integration, i18n routing strategies, MDX content organization, API documentation generation
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Enterprise Foundation | 3/3 | Complete | 2026-01-16 |
| 2. Basic Search | 3/3 | Complete | 2026-01-16 |
| 3. Quality & Autocomplete | 1/1 | Complete | 2026-01-16 |
| 4. Data Preview | 2/2 | Complete | 2026-01-17 |
| 5. Related Datasets | 1/1 | Complete | 2026-01-17 |
| 6. Semantic Search | 1/1 | Complete | 2026-01-17 |
| 7. API Endpoint Fix | 1/1 | Complete | 2026-01-17 |
| 8. Workflow Optimization & Fumadocs | 0/? | Not Started | - |

---
*Roadmap created: 2026-01-16*
*Last updated: 2026-01-17 after Phase 7 completion*
