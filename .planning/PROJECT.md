# Austria MCP

## What This Is

A comprehensive MCP server for Austrian Open Government Data via data.gv.at. The definitive way for data analysts and app developers to discover, analyze, download, preview, and understand Austrian open datasets through AI assistants.

## Core Value

Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## Current State

**Latest shipped:** v1.2 Documentation Rebuild (2026-01-20)

**What's working:**
- MCP server with 25 tools for Austrian open data discovery and analysis
- Enterprise infrastructure (retry, rate limiting, logging, graceful degradation)
- Smart search with semantic matching, quality ranking, and autocomplete
- Data preview and schema introspection for CSV/JSON
- Bilingual documentation framework (EN/DE) with Fumadocs
- Comprehensive English documentation (112 MDX files, 481 static routes)
- Auto-generated tool reference from Python docstrings
- Progressive disclosure patterns serving multiple expertise levels
- 6 end-to-end workflow guides with Steps component
- Visual architecture aids (4 Mermaid diagrams)
- Production-ready quality (60/60 requirements verified, 100% sampled examples work)

**Recent improvements (v1.2):**
- 7-section documentation hierarchy (Getting Started, Guides, Tools, Workflows, API Reference, Integration, Best Practices)
- Auto-generation tooling for tool reference (TypeScript script: Python docstrings → MDX)
- Task-oriented guide structure ("I want to..." not "Tool X does...")
- Comprehensive workflow documentation (discovery, quality assessment, data export, comparative analysis, publication research, semantic exploration)
- FastMCP internals documentation with middleware stack, error handling, testing patterns
- Best practices for optimization, quality interpretation, rate limiting, caching

## Current Milestone: v1.3 Planning

**Status:** Awaiting requirements definition. v1.2 shipped 2026-01-20.

**Potential directions:**
- German translation of English documentation
- Real Claude Desktop screenshots (infrastructure present, placeholder images in place)
- Advanced interactive features (live code examples, playground)
- Additional workflow guides based on user feedback

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

**v1.2 Documentation Rebuild (shipped 2026-01-20):**
- ✓ Complete documentation infrastructure with 7-section hierarchy — v1.2
- ✓ Auto-generated tool reference for all 25 MCP tools (71 parameters, 100% coverage) — v1.2
- ✓ Getting Started section (6 pages: overview, installation, quickstart, first query, quick reference, troubleshooting) — v1.2
- ✓ Guides section (6 pages: searching, data preview, quality metrics, workflow patterns + task-oriented structure) — v1.2
- ✓ Workflows section (6 end-to-end workflows: discovery, quality assessment, data export, comparative analysis, publication research, semantic exploration) — v1.2
- ✓ API Reference section (architecture, MCP protocol, resources, prompts, type system) — v1.2
- ✓ Integration section (Claude Desktop, custom clients, FastMCP internals, error handling, testing patterns) — v1.2
- ✓ Best Practices section (optimization, quality interpretation, rate limiting, caching, comparison tables) — v1.2
- ✓ Progressive disclosure with Basic/Advanced Tabs throughout (persistent state) — v1.2
- ✓ Interactive components (Tabs, Steps, TypeTable, Files, Accordion, Mermaid) — v1.2
- ✓ Visual architecture aids (4 Mermaid diagrams, screenshot infrastructure) — v1.2
- ✓ Production-ready quality (100% sampled examples work, 60/60 requirements verified) — v1.2

### Active

<!-- Future milestones -->

**Future enhancements (v1.3+):**
- [ ] German translation of all documentation
- [ ] Interactive MCP playground or live code examples
- [ ] Video tutorials
- [ ] Real Claude Desktop screenshots (placeholders present in v1.2)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

**v1.2 Explicit Exclusions:**
- German translation — focus on complete English docs first, defer to v1.3
- Interactive MCP playground — future enhancement, not v1.2 scope
- OpenAPI spec generation — can add later if needed
- Video tutorials — screenshots sufficient for v1.2

**General Exclusions:**
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

**v1.1 Shipped (2026-01-18):**
- i18n routing and two-workspace Fumadocs architecture
- 100% accurate code examples through grep-based verification
- Conversational German documentation (du-form)

**v1.2 Shipped (2026-01-20):**
- 112 MDX files, 481 static routes generated
- Auto-generation tooling (TypeScript script: Python docstrings → MDX)
- 7-section documentation hierarchy with progressive disclosure
- 6 end-to-end workflow guides with Steps component
- 4 Mermaid architecture diagrams
- 100% of sampled code examples work without modification
- 60/60 requirements verified complete

**Technical Stack:**
- FastMCP 2.14+ with enterprise middleware (retry, rate limiting, logging)
- Fumadocs for bilingual documentation (German/English)
- Python 3.11+ with async/await patterns
- httpx for HTTP, rdflib for RDF parsing, pydantic for validation
- Next.js 16.1.3 with Tailwind CSS v4

**Deployment Ready:**
- Production build succeeds (481 static pages, zero warnings)
- All 60 v1.2 requirements satisfied
- Comprehensive automated verification complete
- Manual verification deferred to user todo (non-blocking)

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
*Last updated: 2026-01-20 after v1.2 milestone completion*
