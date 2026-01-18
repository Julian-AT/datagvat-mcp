# Austria MCP

## What This Is

A comprehensive MCP server for Austrian Open Government Data via data.gv.at. The definitive way for data analysts and app developers to discover, analyze, download, preview, and understand Austrian open datasets through AI assistants.

## Core Value

Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## Current State

**Latest shipped:** v1.1 Documentation Excellence (2026-01-18)

**What's working:**
- MCP server with 17 tools for Austrian open data discovery and analysis
- Enterprise infrastructure (retry, rate limiting, logging, graceful degradation)
- Smart search with semantic matching, quality ranking, and autocomplete
- Data preview and schema introspection for CSV/JSON
- Bilingual documentation (EN/DE) with i18n routing and Fumadocs workspace architecture
- Comprehensive testing (268 tests, mypy --strict compliance)

**Recent improvements (v1.1):**
- i18n foundation with automatic locale detection
- Two-workspace documentation architecture (learning + API reference)
- 100% accurate code examples (verified and corrected)
- Conversational German documentation style
- ASCII architecture diagrams

**Next milestone:** v1.2 - scope TBD based on user needs

## Requirements

### Validated

<!-- Shipped and confirmed valuable across releases -->

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

**v1.1 Documentation Excellence (shipped 2026-01-18):**
- ✓ i18n routing foundation with Fumadocs middleware — v1.1
- ✓ Root HTML layout for Next.js App Router compliance — v1.1
- ✓ Icon plugin integration (lucide-react :icon[] syntax) — v1.1
- ✓ Austria brand colors in Tailwind theme — v1.1
- ✓ MCP server setup tested end-to-end (cloud + self-hosted) — v1.1
- ✓ Corrected documentation (directory structure, uv configuration) — v1.1
- ✓ Conversational German documentation (du-form) — v1.1
- ✓ ASCII architecture diagrams — v1.1
- ✓ 100% accurate code examples — v1.1
- ✓ Two-workspace Fumadocs architecture (learning + API) — v1.1
- ✓ Independent workspace configurations — v1.1
- ✓ Unified navigation across workspaces — v1.1

### Active

<!-- Next milestone requirements - TBD via /gsd:define-requirements -->

To be defined for v1.2 milestone. Run `/gsd:discuss-milestone` to explore options.

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
*Last updated: 2026-01-18 after v1.1 milestone completion*
