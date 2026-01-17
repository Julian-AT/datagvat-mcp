# Austria MCP

## What This Is

A comprehensive MCP server for Austrian Open Government Data via data.gv.at. The definitive way for data analysts and app developers to discover, analyze, download, preview, and understand Austrian open datasets through AI assistants.

## Core Value

Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## Current Milestone: v1.1 Documentation Excellence

**Goal:** Perfect the documentation site with full Fumadocs enterprise features, fix styling and i18n issues, and integrate AI-powered enhancements.

**Target features:**
- Fix styling inconsistencies and layout issues
- Resolve internationalization (i18n) routing and language switching problems
- Integrate Fumadocs enterprise features (AI search, llms.txt, feedback, OG images)
- Add icon support throughout documentation
- Implement proper SEO and metadata
- Perfect responsive design across all devices
- Enhance search experience with AI-powered features

## Requirements

### Validated

<!-- Shipped and confirmed valuable in v1.0 -->

**v1.0 MVP (shipped 2026-01-17):**
- ✓ MCP server foundation with FastMCP framework
- ✓ Enterprise infrastructure (retry, rate limiting, structured logging, graceful degradation) — v1.0
- ✓ Advanced search filtering (theme, format, publisher, date range) — v1.0
- ✓ Fuzzy matching for typo tolerance — v1.0
- ✓ Quality-aware ranking and autocomplete suggestions — v1.0
- ✓ Semantic search with LLM query expansion (German/English) — v1.0
- ✓ Data preview capabilities (schema introspection, sample rows for CSV/JSON) — v1.0
- ✓ Related dataset discovery via content similarity — v1.0
- ✓ Comprehensive bilingual documentation (English/German) — v1.0
- ✓ Progress reporting for long-running operations — v1.0
- ✓ Input validation and sanitization across all tools — v1.0
- ✓ Discovery tools (list/get catalogues, datasets, distributions)
- ✓ Analysis tools (metrics, DOI eligibility, quality analysis)
- ✓ Management tools (drafts, publish, hide)
- ✓ Vocabulary tools (list/get/search)
- ✓ MCP Resources for direct data access
- ✓ MCP Prompts for common workflows
- ✓ Test suite with pytest (268 tests)
- ✓ CI/CD pipeline with GitHub Actions
- ✓ mypy --strict type safety compliance

### Active

<!-- v1.1 Documentation Excellence scope -->

**Documentation Fixes:**
- [ ] Fix styling inconsistencies (Tailwind CSS integration, theme issues)
- [ ] Resolve i18n routing and language switching issues
- [ ] Fix broken links and navigation
- [ ] Correct responsive design problems

**Enterprise Features Integration:**
- [ ] AI-powered search (Fumadocs search with embeddings)
- [ ] llms.txt support for AI assistants
- [ ] Feedback system for documentation improvement
- [ ] OG image generation for social sharing
- [ ] Icon integration throughout documentation
- [ ] Proper SEO metadata and sitemap

**Enhanced User Experience:**
- [ ] Improved documentation navigation and discoverability
- [ ] Code playground or interactive examples
- [ ] Video tutorials or animated guides
- [ ] Better error messages and troubleshooting guides
- [ ] Quick start templates and boilerplates

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Publishing workflow optimizations — primary users are consumers (analysts, developers), not publishers
- Custom data transformations — out of scope for MCP server; users handle post-download
- Data storage/caching layer — stateless server design, no persistent storage
- Multi-language UI — MCP protocol handles this at client level

## Context

**v1.0 Shipped (2026-01-17):**
- 3,534 lines Python (async, typed with mypy --strict)
- 11,526 lines MDX documentation (bilingual)
- 25 MCP tools, 268 tests
- Layered architecture: MCP interface → Middleware → Dependencies → Client → Models
- Piveau Hub API integration via httpx
- CI/CD pipeline with GitHub Actions

**Technical Stack:**
- FastMCP 2.14+ with enterprise middleware (retry, rate limiting, logging)
- Fumadocs for bilingual documentation (German/English)
- Python 3.11+ with async/await patterns
- httpx for HTTP, rdflib for RDF parsing, pydantic for validation

**Deployment Ready:**
- Production build succeeds (24 documentation pages)
- All 24 v1 requirements satisfied
- Cross-phase integration verified (100% connected)
- 6/6 E2E user flows functional

## Constraints

- **Framework**: FastMCP 2.3.0+ — established, do not change
- **API**: Piveau Hub API — external dependency, work within its capabilities
- **Python**: 3.11+ — established runtime requirement
- **Protocol**: MCP — tools, resources, prompts, sampling as interface
- **Async**: All I/O operations must be async — established pattern

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastMCP as framework | MCP protocol compliance, active development | ✓ Good |
| httpx for HTTP | Async support, modern API | ✓ Good |
| Pydantic for models | Validation, serialization, settings | ✓ Good |
| Consumers over publishers | Primary audience is analysts/developers | ✓ Good |
| Fumadocs for documentation | Modern framework, i18n support, interactive components | ✓ Good — v1.0 |
| German/English bilingual | Austrian data users speak both languages | ✓ Good — v1.0 |

---
*Last updated: 2026-01-17 after v1.1 milestone initialization*
