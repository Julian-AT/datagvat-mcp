# Phase 2: Basic Search - Research

**Researched:** 2026-01-16
**Domain:** Piveau Hub Search API / CKAN-based search
**Confidence:** HIGH

## Summary

Piveau Hub provides a comprehensive search API built on Elasticsearch with CKAN-compatible legacy endpoints. The API supports full-text search with native fuzzy matching, faceted filtering (theme, format, publisher, dates), multiple sort options, and pagination with total counts. The system uses EU DCAT-AP vocabularies for standardized theme classification.

**Key finding:** Piveau Hub's native search API (`/search` endpoint) provides ALL required functionality built-in. The CKAN legacy API (`/api/3/action/package_search`) offers backward compatibility but is deprecated.

**Primary recommendation:** Use Piveau Hub's native `/search` endpoint with facets parameter for filtering. Leverage API-native fuzzy search (tilde operator) and Elasticsearch-backed relevance scoring. Do NOT implement custom search logic or fuzzy matching - the API handles it.

## Standard Stack

The established libraries/tools for this implementation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| httpx | current | Async HTTP client | Already established in Phase 1; handles query params automatically |
| Pydantic | current | Input validation | Already established; use Annotated types for search params |
| FastMCP | 2.14+ | MCP framework | Already established; provides progress reporting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | All search functionality is API-native |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Piveau native `/search` | CKAN legacy `/api/3/action/package_search` | CKAN endpoint is deprecated; use native API |
| API-native fuzzy | rapidfuzz (client-side) | API already provides fuzzy via Solr's `~` operator - no need |
| API facets | Custom filtering logic | API returns faceted results with counts - don't hand-roll |

**Installation:**
No additional packages needed beyond existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── client.py           # Add search_datasets_advanced() method
├── tools/
│   └── discovery.py    # Enhance search_datasets tool with filter params
└── models.py           # Add SearchFilters, SortOption models
```

### Pattern 1: Enhanced Client Method
**What:** Add `search_datasets_advanced()` to PiveauClient with comprehensive search support.
**When to use:** For all Phase 2 search requirements.
**Example:**
```python
async def search_datasets_advanced(
    self,
    query: str | None = None,
    facets: dict[str, list[str]] | None = None,
    min_date: str | None = None,
    max_date: str | None = None,
    sort: str = "relevance+desc",
    limit: int = 20,
    page: int = 0,
) -> dict[str, Any]:
    """Search datasets with full filter support.

    Args:
        query: Full-text search query (supports fuzzy with ~)
        facets: Filter dict, e.g. {"format": ["CSV"], "theme": ["AGRI"]}
        min_date: ISO 8601 date for date range filter
        max_date: ISO 8601 date for date range filter
        sort: Sort string, e.g. "relevance+desc", "modified+desc", "title+asc"
        limit: Results per page (1-1000)
        page: Page number (0-indexed)

    Returns:
        Dict with "results", "count", "facets" keys
    """
    params = {
        "limit": limit,
        "page": page,
        "sort": sort,
    }

    if query:
        params["q"] = query

    if facets:
        # Piveau expects: facets={"format":["CSV","PDF"]}
        params["facets"] = json.dumps(facets)

    if min_date:
        params["minDate"] = min_date
    if max_date:
        params["maxDate"] = max_date

    result = await self._request("GET", "/search", params=params)
    return result
```

### Pattern 2: Structured Filter Models
**What:** Use Pydantic models for type-safe filter construction.
**When to use:** In MCP tool definitions for input validation.
**Example:**
```python
from typing import Literal
from pydantic import BaseModel, Field

class SearchFilters(BaseModel):
    """Optional filters for dataset search."""
    themes: list[str] | None = Field(None, description="EU data theme codes (AGRI, ECON, etc.)")
    formats: list[str] | None = Field(None, description="File formats (CSV, JSON, etc.)")
    publishers: list[str] | None = Field(None, description="Publisher/organization IDs")

SortOption = Literal["relevance", "date_desc", "date_asc", "title_asc", "title_desc"]
```

### Pattern 3: Tool Enhancement (Not Replacement)
**What:** Enhance existing `search_datasets` tool with optional parameters, maintain backward compatibility.
**When to use:** Phase 2 implementation - don't break Phase 1 usage.
**Example:**
```python
@mcp.tool()
async def search_datasets(
    ctx: Context,
    # Existing params
    catalogue_id: str | None = None,
    limit: int = 20,
    offset: int = 0,
    # NEW Phase 2 params
    query: str | None = None,
    themes: list[str] | None = None,
    formats: list[str] | None = None,
    publishers: list[str] | None = None,
    min_date: str | None = None,
    max_date: str | None = None,
    sort_by: str = "relevance",
) -> dict[str, Any]:
    # If no query/filters, fall back to simple list (Phase 1 behavior)
    # Otherwise, use advanced search
```

### Anti-Patterns to Avoid
- **Don't create separate tools** - Enhance existing `search_datasets` tool
- **Don't parse/transform facets** - Pass them directly as JSON to API
- **Don't implement cursor pagination** - API uses offset/limit model
- **Don't fetch all results then filter** - Use API filters for efficiency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy search | Custom Levenshtein distance | API's `~` operator in query (e.g., `health~`) | Solr-backed fuzzy search built-in |
| Facet counts | Count filtered results manually | API's facets response | API returns facet counts with each search |
| Relevance scoring | Custom TF-IDF | API's default sort | Elasticsearch scoring optimized for DCAT-AP |
| Query parsing | String manipulation | API's Solr query syntax | Supports AND/OR/NOT, phrases, wildcards |
| Date filtering | Client-side date comparisons | API's minDate/maxDate params | Indexed date fields, efficient filtering |
| URL encoding | Manual quote/urlencode | httpx params dict | httpx handles encoding automatically |
| Pagination metadata | Calculate from offsets | API's count field | Total count returned with each response |

**Key insight:** Piveau Hub is Elasticsearch-backed. All search features are database-level operations with proper indexing. Client-side filtering would be slow, incorrect (misses total counts), and fragile.

## Code Examples

Verified patterns from official sources:

### Basic Search with Fuzzy Matching
```python
# Source: Piveau Hub API docs + CKAN fuzzy search docs
# https://docs.ckan.org/en/2.9/user-guide.html

# Fuzzy search for "health" (matches "heath", "healh", etc.)
params = {"q": "health~", "limit": 10}
result = await client._request("GET", "/search", params=params)

# Wildcard search for titles starting with "europ"
params = {"q": "title:europ*", "limit": 10}
result = await client._request("GET", "/search", params=params)
```

### Faceted Filtering
```python
# Source: Piveau Hub API documentation
# https://doc.piveau.io/guides/use-the-hub-apis/

# Filter by multiple formats AND single theme
filters = {
    "format": ["CSV", "JSON"],  # OR within same facet
    "theme": ["AGRI"]           # AND between different facets
}
params = {
    "q": "agriculture",
    "facets": json.dumps(filters),
    "limit": 20,
    "page": 0
}
result = await client._request("GET", "/search", params=params)

# Response structure:
# {
#   "results": [...],
#   "count": 42,
#   "facets": {
#     "format": {"CSV": 20, "JSON": 15, "PDF": 7},
#     "theme": {"AGRI": 42, "ENVI": 10}
#   }
# }
```

### Date Range Filtering
```python
# Source: Piveau Hub API documentation
# Filter datasets modified in 2025
params = {
    "minDate": "2025-01-01T00:00:00Z",
    "maxDate": "2025-12-31T23:59:59Z",
    "sort": "modified+desc",
    "limit": 50
}
result = await client._request("GET", "/search", params=params)
```

### Sorting Options
```python
# Source: Piveau Hub API + CKAN package_search docs
# https://docs.ckan.org/en/latest/api/

# Available sort patterns:
# - "relevance+desc" (default when query present)
# - "modified+desc" (most recently updated)
# - "modified+asc" (oldest first)
# - "title+asc" (alphabetical)
# - "title+desc" (reverse alphabetical)
# - "issued+desc" (most recently published)

params = {
    "q": "traffic",
    "sort": "modified+desc",  # Most recent first
    "showScore": "true"        # Include relevance scores
}
```

### httpx Query Parameters (Automatic Encoding)
```python
# Source: httpx documentation
# https://www.python-httpx.org/quickstart/

# httpx handles URL encoding automatically
params = {
    "q": "search with spaces",
    "facets": json.dumps({"theme": ["AGRI", "ENVI"]}),
    "sort": "relevance+desc"
}

# httpx encodes to:
# ?q=search+with+spaces&facets=%7B%22theme%22%3A%5B%22AGRI%22%2C%22ENVI%22%5D%7D&sort=relevance%2Bdesc
response = await client._client.get("/search", params=params)
```

### Complete Enhanced Tool Example
```python
# Combining all patterns
@mcp.tool(
    name="search_datasets",
    description="Search datasets with text query and filters (theme, format, publisher, dates)."
)
async def search_datasets(
    ctx: Context,
    query: Annotated[str | None, Field(description="Search query. Use ~ for fuzzy (e.g., 'health~')")] = None,
    themes: Annotated[list[str] | None, Field(description="EU theme codes: AGRI, ECON, EDUC, ENER, ENVI, GOVE, HEAL, INTR, JUST, REGI, SOCI, TECH, TRAN")] = None,
    formats: Annotated[list[str] | None, Field(description="File formats: CSV, JSON, XML, PDF, etc.")] = None,
    publishers: Annotated[list[str] | None, Field(description="Publisher IDs")] = None,
    min_date: Annotated[str | None, Field(description="Start date (ISO 8601)")] = None,
    max_date: Annotated[str | None, Field(description="End date (ISO 8601)")] = None,
    sort_by: Annotated[str, Field(description="Sort: relevance, modified_desc, modified_asc, title_asc, title_desc")] = "relevance",
    limit: Annotated[int, Field(ge=1, le=100)] = 20,
    page: Annotated[int, Field(ge=0)] = 0,
) -> dict[str, Any]:
    client = get_piveau_client(ctx)

    # Build facets dict
    facets = {}
    if themes:
        facets["theme"] = themes
    if formats:
        facets["format"] = formats
    if publishers:
        facets["catalog"] = publishers  # Piveau uses "catalog" for publisher

    # Map sort_by to API format
    sort_map = {
        "relevance": "relevance+desc",
        "modified_desc": "modified+desc",
        "modified_asc": "modified+asc",
        "title_asc": "title+asc",
        "title_desc": "title+desc",
    }
    sort = sort_map.get(sort_by, "relevance+desc")

    # Progress reporting
    if ctx:
        filter_desc = []
        if query:
            filter_desc.append(f"query='{query}'")
        if themes:
            filter_desc.append(f"themes={themes}")
        if formats:
            filter_desc.append(f"formats={formats}")
        desc = f"Searching with {', '.join(filter_desc) if filter_desc else 'no filters'}"
        await ctx.report_progress(0, 1, desc)

    result = await client.search_datasets_advanced(
        query=query,
        facets=facets if facets else None,
        min_date=min_date,
        max_date=max_date,
        sort=sort,
        limit=limit,
        page=page,
    )

    if ctx:
        count = result.get("count", 0)
        await ctx.report_progress(1, 1, f"Found {count} datasets, showing {len(result.get('results', []))}")

    return result
```

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CKAN legacy API `/api/3/action/package_search` | Piveau native `/search` | Piveau 2.x+ | Native API has more features (bounding box, scoring, scroll) |
| Client-side fuzzy matching | Solr `~` operator in query | Always available | No library needed, API-native |
| Offset pagination only | Offset OR search-after OR scroll | Elasticsearch 7+ | Can handle >10K results with scroll/search-after |
| Manual facet counting | Aggregation API | Always available | Facet counts with every search, no extra queries |
| String-based theme filtering | EU DCAT-AP MDR vocabulary | DCAT-AP 2.0+ (2019) | Standardized 13 themes across EU portals |

**New features to leverage:**
- **Scroll API**: For iterating through large result sets (>10K) - use `scroll=true` and `scrollId`
- **Point-in-time search**: For consistent pagination - use `searchAfter` and `pitId`
- **Score visibility**: For debugging relevance - use `showScore=true`
- **Field boosting**: For weighted search - use `boost.title=10&boost.keyword=3`
- **Geographic filtering**: For spatial queries - use `bboxMinLon/Lat/MaxLon/Lat`

**Deprecated/outdated:**
- CKAN legacy endpoint - marked deprecated in Piveau docs
- Simple `/datasets` list endpoint for search use cases - doesn't support filters

## Common Pitfalls

### Pitfall 1: URL Encoding Special Characters
**What goes wrong:** Query strings with special characters (spaces, quotes, JSON) fail or return wrong results.
**Why it happens:** Manual string concatenation for URLs.
**How to avoid:** Always use httpx `params` dict - it handles encoding automatically.
**Warning signs:** HTTP 400 errors, empty results with complex queries.
**Example:**
```python
# WRONG - manual encoding prone to errors
url = f"/search?q={query}&facets={json.dumps(filters)}"

# RIGHT - httpx handles it
params = {"q": query, "facets": json.dumps(filters)}
result = await client._request("GET", "/search", params=params)
```

### Pitfall 2: Facet Combination Logic Misunderstanding
**What goes wrong:** Assuming all facets use AND, or all use OR.
**Why it happens:** CKAN/Piveau default: OR within same facet, AND between different facets.
**How to avoid:** Document behavior clearly: `{"format": ["CSV", "JSON"]}` = CSV OR JSON, but `{"format": ["CSV"], "theme": ["AGRI"]}` = CSV AND AGRI theme.
**Warning signs:** Results don't match user expectations for "all of these" vs "any of these."
**Solution:** Use `facetOperator` param if different behavior needed (see API docs).

### Pitfall 3: Pagination Total Count Approximation
**What goes wrong:** Total count may be approximate for very large result sets (>10K).
**Why it happens:** Elasticsearch performance optimization.
**How to avoid:** Document that counts are approximate for large sets. For exact counts, consider using aggregations.
**Warning signs:** Count varies slightly between pages.

### Pitfall 4: Fuzzy Search Syntax Confusion
**What goes wrong:** Adding `~` to every word, or using wrong syntax like `~health`.
**Why it happens:** Misunderstanding Solr fuzzy syntax.
**How to avoid:** `~` goes AFTER the word: `health~` not `~health`. Use for single terms, not phrases.
**Warning signs:** Query returns zero results when it should return some.
**Example:**
```python
# WRONG
params = {"q": "~health care"}

# RIGHT - fuzzy on single term
params = {"q": "health~ care"}

# RIGHT - fuzzy on both terms
params = {"q": "health~ care~"}
```

### Pitfall 5: Mixing CKAN and Piveau Native APIs
**What goes wrong:** Using CKAN parameter names (`fq`, `rows`, `start`) with native `/search` endpoint.
**Why it happens:** Confusion between legacy CKAN endpoint and native Piveau endpoint.
**How to avoid:** Stick to native `/search` endpoint exclusively. Use `facets`, `limit`, `page` (not `fq`, `rows`, `start`).
**Warning signs:** API ignores parameters, returns unexpected results.

### Pitfall 6: Date Format Inconsistency
**What goes wrong:** Using wrong date format for `minDate`/`maxDate` filters.
**Why it happens:** API expects ISO 8601 with timezone.
**How to avoid:** Always use full ISO 8601: `2025-01-01T00:00:00Z` not `2025-01-01`.
**Warning signs:** Date filters ignored, getting results outside date range.

### Pitfall 7: Theme Code Case Sensitivity
**What goes wrong:** Using lowercase theme codes like `agri` instead of `AGRI`.
**Why it happens:** EU MDR vocabulary uses uppercase codes.
**How to avoid:** Always uppercase theme codes: AGRI, ECON, EDUC, ENER, ENVI, GOVE, HEAL, INTR, JUST, REGI, SOCI, TECH, TRAN.
**Warning signs:** Theme filters return zero results.

### Pitfall 8: Over-fetching with Pagination
**What goes wrong:** Requesting very high `limit` values or deep pagination (`page=500`).
**Why it happens:** Trying to get all results at once.
**How to avoid:** Max result window is 10,000. For larger sets, use scroll API. Keep `limit` reasonable (≤100).
**Warning signs:** API errors at high page numbers.

### Pitfall 9: Ignoring Facet Responses
**What goes wrong:** Not using returned facet counts to show available filters.
**Why it happens:** Focusing only on results array.
**How to avoid:** Parse and return `facets` object - it provides counts for filtering UI.
**Warning signs:** User doesn't know what filter values are available.

### Pitfall 10: Sort + Relevance Conflict
**What goes wrong:** Sorting by date when user expects relevance ranking.
**Why it happens:** Not understanding that relevance only applies when query is present.
**How to avoid:** Default to `relevance+desc` when query present, `modified+desc` when listing without query.
**Warning signs:** Results seem random or don't match query well.

## EU DCAT-AP Theme Vocabulary

The 13 standardized data theme codes used across EU open data portals:

| Code | Label | Description |
|------|-------|-------------|
| AGRI | Agriculture, fisheries, forestry and food | Datasets about farming, fishing, forestry, and food production |
| ECON | Economy and finance | Economic indicators, business, finance, trade data |
| EDUC | Education, culture and sport | Educational resources, cultural heritage, sports data |
| ENER | Energy | Energy production, consumption, infrastructure |
| ENVI | Environment | Climate, pollution, biodiversity, natural resources |
| GOVE | Government and public sector | Public administration, budgets, legislation |
| HEAL | Health | Healthcare, disease, medical data |
| INTR | International issues | Foreign policy, international cooperation |
| JUST | Justice, legal system and public safety | Courts, crime, law enforcement |
| REGI | Regions and cities | Regional statistics, urban planning |
| SOCI | Population and society | Demographics, social services |
| TECH | Science and technology | Research, innovation, ICT |
| TRAN | Transport | Roads, public transport, traffic |

**Source:** [EU Vocabularies - Data Theme](https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/data-theme)

**Usage in filters:**
```python
facets = {"theme": ["AGRI", "ENVI"]}  # Agriculture OR Environment datasets
```

## Open Questions

None - all Phase 2 requirements can be satisfied with documented Piveau Hub API features.

## Sources

### Primary (HIGH confidence)
- [Piveau Hub API Documentation](https://doc.piveau.io/guides/use-the-hub-apis/) - Search endpoint, query parameters, facets
- [CKAN API Guide (2.12.0)](https://docs.ckan.org/en/latest/api/) - package_search parameters, response structure
- [CKAN User Guide - Search Syntax](https://docs.ckan.org/en/2.9/user-guide.html) - Fuzzy search with `~`, wildcard operators
- [EU Vocabularies - DCAT-AP](https://op.europa.eu/en/web/eu-vocabularies/dcat-ap) - Theme vocabulary structure

### Secondary (MEDIUM confidence)
- [Piveau Hub Search GitHub](https://github.com/public-data-space/piveau-hub-search) - Elasticsearch backend architecture
- [DCAT-AP Implementation Guidelines](https://interoperable-europe.ec.europa.eu/collection/semic-support-centre/solution/dcat-application-profile-implementation-guidelines/release-5) - MDR Data Themes usage
- [httpx Quickstart](https://www.python-httpx.org/quickstart/) - Query parameter handling
- [data.europa.eu - Popular Open Data Categories](https://data.europa.eu/en/publications/datastories/some-insights-most-popular-open-data-categories) - Theme usage patterns

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, API-native features
- Architecture: HIGH - Verified with official Piveau and CKAN documentation
- Pitfalls: MEDIUM - Derived from CKAN community issues and Piveau API docs
- Theme vocabulary: HIGH - Official EU Publications Office vocabulary

**Research date:** 2026-01-16
**Valid until:** ~2026-04-16 (90 days - search APIs are relatively stable)
