# Austria MCP

## What This Is

A comprehensive MCP server for Austrian Open Government Data via data.gv.at. The definitive way for data analysts and app developers to discover, analyze, download, preview, and understand Austrian open datasets through AI assistants.

## Core Value

Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ MCP server foundation with FastMCP framework — existing
- ✓ Piveau Hub API client with async HTTP operations — existing
- ✓ Discovery tools (list/get catalogues, datasets, distributions) — existing
- ✓ Analysis tools (metrics, DOI eligibility, quality analysis) — existing
- ✓ Management tools (drafts, publish, hide) — existing
- ✓ Vocabulary tools (list/get/search) — existing
- ✓ MCP Resources for direct data access — existing
- ✓ MCP Prompts for common workflows — existing
- ✓ Middleware pipeline (audit logging, auth enforcement) — existing
- ✓ Environment-based configuration with pydantic-settings — existing
- ✓ Docker deployment support — existing
- ✓ Test suite with pytest — existing

### Active

<!-- Current scope. Building toward these. -->

**Search Overhaul:**
- [ ] Advanced filtering (theme, format, publisher, date range, spatial, language)
- [ ] Improved search relevance and ranking
- [ ] Autocomplete and search suggestions
- [ ] Fuzzy matching for typo tolerance

**Enterprise Grade:**
- [ ] Robust error handling with retries and exponential backoff
- [ ] Comprehensive structured logging with correlation IDs
- [ ] Input validation and sanitization across all tools
- [ ] Rate limiting and request throttling
- [ ] Graceful degradation when API is unavailable

**FastMCP Full Utilization:**
- [ ] Sampling/completions for AI-powered dataset recommendations
- [ ] Image and file handling for data previews
- [ ] Progress reporting for long-running operations

**All-in-One Experience:**
- [ ] Dataset preview capabilities (show sample data)
- [ ] Smart dataset recommendations based on query context
- [ ] Austrian open data knowledge base (answer ecosystem questions)
- [ ] Download assistance with format guidance

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Publishing workflow optimizations — primary users are consumers (analysts, developers), not publishers
- Custom data transformations — out of scope for MCP server; users handle post-download
- Data storage/caching layer — stateless server design, no persistent storage
- Multi-language UI — MCP protocol handles this at client level

## Context

**Existing Codebase:**
- Python 3.11+ async codebase with FastMCP 2.3.0+
- Layered architecture: MCP interface → Middleware → Dependencies → Client → Models
- Piveau Hub API integration via httpx with RDF parsing (rdflib)
- Current search is basic pass-through to API with limited filtering

**Technical Environment:**
- Piveau Hub API (data.gv.at) — DCAT-AP compliant, returns JSON-LD/RDF
- MCP protocol for AI assistant integration
- Claude Desktop primary client target

**Known Issues (from CONCERNS.md):**
- Search functionality incomplete
- Error handling inconsistent across tools
- Limited use of FastMCP advanced features
- No retry logic for transient failures

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
| Consumers over publishers | Primary audience is analysts/developers | — Pending |

---
*Last updated: 2026-01-16 after initialization*
