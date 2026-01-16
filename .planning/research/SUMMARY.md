# Research Summary

**Completed:** 2026-01-16
**Scope:** Austria MCP Server v1.1+ - Search, Enterprise Features, FastMCP Integration

## Executive Summary

Research confirms the Austria MCP server is well-positioned for enhancement. The existing layered architecture provides clear integration points for advanced search, sampling, file handling, and enterprise reliability features. The primary gaps are in search functionality (currently pagination-only) and resilience (no retry logic, no rate limiting).

**Key findings:**
1. **Search is the critical gap** - Current implementation is pagination-only; users expect full-text search, faceted filtering, autocomplete, and quality-aware ranking
2. **FastMCP 2.14+ has built-in enterprise features** - RetryMiddleware, RateLimitingMiddleware, ResponseCachingMiddleware, StructuredLoggingMiddleware eliminate need for external libraries
3. **FastMCP sampling enables AI differentiation** - LLM-powered semantic search and recommendations via `ctx.sample()` and `ctx.elicit()`
4. **20 specific pitfalls identified** - Most critical: sampling misuse, `isError: true` handling, JSON-LD edge cases, multilingual field extraction

## Research Documents

| Document | Lines | Focus | Confidence |
|----------|-------|-------|------------|
| FEATURES.md | 358 | Table stakes, differentiators, anti-features | HIGH for table stakes, MEDIUM for MCP-specific |
| ARCHITECTURE.md | 750 | Integration points, new components, build order | HIGH for existing code, MEDIUM for new patterns |
| PITFALLS.md | 634 | 20 documented pitfalls with prevention strategies | HIGH for MCP protocol, MEDIUM for FastMCP-specific |
| STACK.md | 434 | FastMCP features, middleware, library recommendations | HIGH (verified from source) |

## Key Recommendations

### Search Overhaul

**Table Stakes (must-have):**
- Full-text search with query parameter
- Faceted filtering (theme, format, publisher, date)
- Sort options (relevance, date, title)
- Pagination with total counts
- Fuzzy matching for typo tolerance

**Differentiators:**
- Quality-aware ranking using existing DQV metrics
- Schema introspection for CSV/JSON files
- Data preview (first N rows)
- Autocomplete suggestions from vocabularies
- Semantic search via LLM sampling

**Proposed New Tools:**
| Tool | Priority | Purpose |
|------|----------|---------|
| `search_datasets` (enhanced) | P1 | Full-text with filters |
| `get_search_facets` | P1 | Available filter values |
| `suggest_search_terms` | P2 | Autocomplete |
| `get_dataset_schema` | P2 | Column names/types |
| `preview_dataset` | P2 | First N rows |
| `find_related_datasets` | P3 | Similarity-based |

### Enterprise Reliability

**Critical Finding:** FastMCP 2.14+ includes built-in enterprise middleware. Upgrade from `>=2.3.0` to `>=2.14.0` to access:

| Built-in Middleware | Purpose |
|---------------------|---------|
| `RetryMiddleware` | Exponential backoff with configurable exceptions |
| `RateLimitingMiddleware` | Token bucket with per-client or global limiting |
| `ResponseCachingMiddleware` | TTL-based caching with tool inclusion/exclusion |
| `StructuredLoggingMiddleware` | JSON logging for observability |

**Required Actions:**
1. **Upgrade FastMCP** - Change `pyproject.toml` to `fastmcp>=2.14.0`
2. **Add built-in middleware** - RetryMiddleware, RateLimitingMiddleware, StructuredLoggingMiddleware
3. **Correlation IDs** - Propagate request_id to Piveau API calls
4. **Two-tier error handling** - Consistent `isError: true` for tool failures

**No external libraries needed** for retry, rate limiting, or structured logging.

### FastMCP Features

**Sampling Integration (`ctx.sample()`):**
- Check `ctx.client_capabilities.sampling` before use
- Use `modelPreferences` with priority hints, not hardcoded models
- Always handle rejection gracefully with fallback behavior
- Limit sampling depth (no nested chains)
- Use `ctx.sample_step()` for single LLM calls with fine-grained control

**Elicitation (`ctx.elicit()`):**
- Request structured user input during tool execution
- Use for guided search workflows with filter refinement
- Supports Pydantic models for response validation

**Progress Reporting:**
- Ensure completion on all code paths (try/finally pattern)
- Report progress at meaningful checkpoints
- Include descriptive messages

**Rich Content Types:**
- `Image`, `Audio`, `File` helpers for returning rich content
- Use for data visualizations and downloadable previews

**File Handling:**
- Implement ContentService with size limits (10MB default)
- Support CSV, JSON, XML parsing with preview
- Validate download URLs for security

## Critical Pitfalls to Avoid

### Severity: Critical
1. **Sampling without human-in-the-loop** - Always design for user approval
2. **Missing `isError: true`** - Use FastMCP's ToolError for business failures

### Severity: High
3. **JSON-LD `@graph` edge cases** - Handle single objects, not just arrays
4. **No retry logic** - Transient failures become permanent
5. **Multilingual fields** - Create standardized extraction helper
6. **Hardcoded model names** - Use flexible modelPreferences
7. **Sampling rejection not handled** - Provide fallback behavior
8. **Fuzzy search too broad/narrow** - Implement proper ranking

### Severity: Medium
9. **RDF parsing silent fallback** - Make failures explicit
10. **URI vs ID confusion** - Normalize IDs from full URIs
11. **Progress without completion guarantee** - Use try/finally
12. **O(n) vocabulary search** - Add pagination or caching

## Implications for Roadmap

### Recommended Phase Structure

**Phase 1: Enterprise Foundation** (prerequisite for all)
- Upgrade FastMCP to >=2.14.0
- Add built-in middleware (RetryMiddleware, RateLimitingMiddleware, StructuredLoggingMiddleware)
- Error handling standardization (`isError: true`)
- Correlation ID propagation

**Phase 2: Search Enhancement**
- SearchService abstraction
- Full-text search with filters
- Faceted filtering
- Sort and pagination improvements
- Fuzzy matching

**Phase 3: Data Preview**
- ContentService for file parsing
- Schema introspection tool
- Data preview tool
- Download with size limits

**Phase 4: Intelligence Layer**
- SamplingHandler implementation
- Semantic search via LLM
- Quality-aware ranking
- Related dataset suggestions

### Dependency Chain

```
[Enterprise Foundation]
        |
        v
[Search Enhancement] -----> [Data Preview]
        |                          |
        +----------+---------------+
                   |
                   v
         [Intelligence Layer]
```

### Risk Areas

| Risk | Mitigation |
|------|------------|
| Piveau search API unknown | Investigate API docs; prepare client-side fallback |
| FastMCP sampling API unverified | Test with FastMCP 2.3+; check Context.sample() signature |
| File size limits arbitrary | Make configurable; monitor actual dataset sizes |
| Rate limit thresholds unknown | Start conservative; adjust based on production metrics |

## Open Questions for Planning

1. **Piveau API Search Support** - Does `/datasets?q=` or similar exist? Need to verify before implementing
2. **FastMCP Sampling API** - Exact `Context.sample()` interface needs validation
3. **Vocabulary Sizes** - Are current O(n) searches acceptable or need optimization?
4. **Distribution File Sizes** - What's the realistic size range for data.gv.at files?

## Sources

### MCP Protocol (HIGH confidence)
- https://modelcontextprotocol.io/docs/concepts/tools
- https://modelcontextprotocol.io/docs/concepts/sampling
- https://modelcontextprotocol.io/docs/concepts/resources

### Codebase (HIGH confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/INTEGRATIONS.md`
- `app/client.py`, `app/middleware.py`, `app/tools/`

### Domain Knowledge (MEDIUM confidence)
- CKAN, European Data Portal, Socrata API patterns
- DCAT-AP metadata specification
- Python async patterns (httpx, tenacity)

---

*Research completed: 2026-01-16*
*Valid until: 2026-02-16 (30 days)*
