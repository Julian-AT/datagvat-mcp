# Features Research: Enterprise Data Portal API Capabilities

**Researched:** 2026-01-16
**Domain:** Open Government Data Discovery / MCP Server
**Confidence:** MEDIUM (based on training data - CKAN, European Data Portal standards, data.gov patterns; WebSearch/WebFetch unavailable for verification)

## Executive Summary

Enterprise data portals (CKAN, Socrata, European Data Portal, data.gov) have established clear expectations for data discovery APIs. Table stakes include faceted search, metadata filtering, format filtering, and pagination. Differentiators for an MCP server context include AI-powered semantic search, natural language query understanding, automated data quality assessment, and contextual recommendations. The MCP context creates unique opportunities: LLMs can synthesize multiple datasets, explain data schemas, and suggest relevant datasets based on conversational context rather than keyword matching alone.

**Key insight:** Users of data portals are typically data analysts and developers who need efficient discovery, not browsing. They want to find the right dataset fast, understand if it's usable, and get programmatic access. An MCP server should optimize for task completion, not exploration.

## Current Implementation Analysis

The existing Austria MCP server provides:
- `list_catalogues`, `get_catalogue` - Basic catalogue enumeration
- `search_datasets` - Pagination only (no text search, no filters)
- `get_dataset`, `get_dataset_distributions` - Single dataset retrieval
- `get_dataset_metrics`, `analyze_dataset_quality` - Quality assessment
- `list_vocabularies`, `search_vocabulary_terms` - Controlled vocabulary access

**Gap analysis:** Current `search_datasets` is pagination-only, not true search. No filtering by format, theme, publisher, temporal range, or text query.

## Backend API Constraints (Piveau Hub)

Based on codebase analysis (`app/client.py`, `.planning/codebase/INTEGRATIONS.md`):

**Known Piveau Hub API endpoints:**
| Endpoint | Parameters | Notes |
|----------|-----------|-------|
| `/catalogues` | `limit`, `offset`, `valueType` | Pagination only |
| `/catalogues/{id}/datasets` | `limit`, `offset`, `valueType` | Pagination only |
| `/datasets` | `limit`, `offset`, `valueType` | Pagination only |
| `/datasets/{id}` | None | Single dataset fetch |
| `/datasets/{id}/distributions` | `limit`, `offset`, `valueType` | Pagination only |
| `/datasets/{id}/metrics` | `historic` | Quality metrics (DQV) |
| `/vocabularies` | `limit`, `offset`, `valueType` | Pagination only |
| `/vocabularies/{id}` | None | Single vocabulary fetch |

**Critical unknown:** The current client does NOT use any search/filter query parameters beyond pagination. This could mean:
1. Piveau Hub API does not support search (unlikely for a DCAT portal)
2. Search endpoints exist but are not implemented in the client
3. Search is available but uses different endpoint paths

**Verification required:** Check Piveau Hub API documentation for:
- `/search` or `/datasets?q=` query parameter support
- Facet endpoints for themes, formats, publishers
- Sort parameter support

**Implementation strategy:** If backend search is limited, client-side filtering can supplement:
- Fetch larger result sets, filter in memory (performance cost)
- Use vocabulary endpoints for facet values
- Leverage LLM for semantic matching on fetched results

## Table Stakes Features

These are expected by users of any data discovery API. Missing these will cause users to abandon the tool.

| Feature | Description | Complexity | Dependencies | Confidence |
|---------|-------------|------------|--------------|------------|
| **Full-text search** | Search dataset titles, descriptions, keywords | Medium | Backend API support (verify Piveau) | HIGH |
| **Faceted filtering** | Filter by theme/category, format, publisher, license | Medium | Vocabulary endpoints (available) | HIGH |
| **Temporal filtering** | Filter by date range (issued, modified) | Low | Client-side if backend lacks support | HIGH |
| **Format filtering** | Filter by distribution format (CSV, JSON, GeoJSON, etc.) | Low | Client-side filtering feasible | HIGH |
| **Pagination with counts** | Return total count, page info for result navigation | Low | Backend may support (verify) | HIGH |
| **Sort options** | Sort by relevance, date, title, popularity | Low | Backend support needed for relevance | HIGH |
| **Dataset metadata completeness** | Return all DCAT-AP fields in results | Low | Already implemented | HIGH |
| **Distribution preview URLs** | Direct links to download/access data | Low | Already implemented | HIGH |

### Search Parameter Details

Standard search parameters across enterprise portals (implementation depends on Piveau support):

| Parameter | Type | Description | Example | Backend/Client |
|-----------|------|-------------|---------|----------------|
| `q` or `query` | string | Full-text search query | `"population vienna"` | Backend preferred |
| `theme` | string[] | Category/theme filter (EU vocabulary) | `["GOVE", "ECON"]` | Either |
| `format` | string[] | File format filter | `["CSV", "JSON"]` | Client feasible |
| `publisher` | string | Publisher organization filter | `"Stadt Wien"` | Either |
| `catalogue` | string | Catalogue ID filter | `"stadt-wien"` | Backend (exists) |
| `issued_from` | date | Minimum issue date | `"2023-01-01"` | Client feasible |
| `issued_to` | date | Maximum issue date | `"2024-12-31"` | Client feasible |
| `modified_from` | date | Modified after date | `"2024-01-01"` | Client feasible |
| `license` | string | License type filter | `"CC-BY-4.0"` | Client feasible |
| `language` | string | Content language | `"de"` | Either |
| `sort` | enum | Sort order | `"relevance"`, `"modified"`, `"title"` | Backend for relevance |
| `limit` | int | Results per page | `20` | Backend (exists) |
| `offset` | int | Pagination offset | `0` | Backend (exists) |

## Differentiators

Features that would set this MCP server apart from basic data portal APIs.

| Feature | Description | Complexity | Dependencies | Confidence |
|---------|-------------|------------|--------------|------------|
| **Semantic search** | Understand query intent beyond keywords ("datasets about aging population") | High | LLM (via FastMCP sampling) | MEDIUM |
| **Natural language filters** | Parse "datasets from Vienna updated this year" into structured query | Medium | LLM prompt parsing | MEDIUM |
| **Quality-aware ranking** | Boost datasets with higher quality scores in results | Medium | `get_dataset_metrics` (exists) | HIGH |
| **Schema introspection** | Fetch and describe CSV/JSON column names and types | High | Distribution download, parsing | MEDIUM |
| **Data preview** | Return first N rows of tabular data | High | Download, parse, format | MEDIUM |
| **Related datasets** | Suggest datasets with similar themes/keywords | Medium | Similarity computation | MEDIUM |
| **Autocomplete suggestions** | Real-time term completion for search | Medium | Vocabulary endpoints (exist) | MEDIUM |
| **Query explanation** | Explain why results match the query | Low | Return match context | HIGH |
| **Combined dataset analysis** | "Compare these 3 datasets" across schemas | High | Multi-fetch, schema align | MEDIUM |

### Differentiator Details

#### Semantic Search
- **What:** Understand "census data" should match "Volkszaehlung" even without exact keyword match
- **Why valuable:** Austrian data has German metadata; English-speaking users struggle
- **Implementation:** Use FastMCP sampling to have LLM expand queries or match against descriptions
- **Complexity:** HIGH - requires LLM token usage per search; could be expensive at scale
- **MCP advantage:** LLM is already in the loop; leverage it for understanding

#### Schema Introspection
- **What:** For CSV/JSON distributions, fetch file and extract column names, data types, sample values
- **Why valuable:** Users need to know if dataset has the fields they need before downloading
- **Implementation:** Download distribution (with size limit), parse headers, infer types
- **Complexity:** HIGH - needs format-specific parsers, size limits, encoding handling
- **Formats to support:** CSV (priority), JSON, GeoJSON

#### Data Preview
- **What:** Return first 10-20 rows of tabular data formatted for display
- **Why valuable:** Quick data quality check without full download
- **Implementation:** Download head of file, parse, return structured preview
- **Complexity:** HIGH - format handling, encoding issues, large file protection
- **Builds on:** Schema introspection infrastructure

#### Quality-Aware Ranking
- **What:** Use existing DQV metrics to boost high-quality datasets in search results
- **Why valuable:** Reduces time spent on incomplete/broken datasets
- **Implementation:** Fetch metrics for top N results, re-rank by quality score
- **Complexity:** MEDIUM - additional API calls per result, but logic is straightforward
- **Already have:** `get_dataset_metrics` tool provides DQV scores

#### Autocomplete Suggestions
- **What:** Suggest completions as user types search query
- **Why valuable:** Faster search, discover available terms
- **Implementation:** Use vocabulary terms + existing dataset titles/keywords
- **Complexity:** MEDIUM - vocabulary endpoints exist; need index for titles
- **MCP consideration:** May need new tool `suggest_search_terms(prefix: str)`

## Anti-Features

Things to deliberately NOT build, and why.

| Anti-Feature | Why NOT to Build | What to Do Instead |
|--------------|------------------|-------------------|
| **Full dataset download via MCP** | MCP responses have size limits; datasets can be gigabytes | Return download URLs; let client handle download |
| **Real-time data transformation** | CPU-intensive, unpredictable execution time | Return raw data; user transforms locally |
| **Data caching layer** | Stale data problems, storage costs, cache invalidation complexity | Fetch fresh from source; let HTTP caching handle it |
| **User account management** | Out of scope for data discovery; portal handles this | Pass through API keys; don't manage auth |
| **Dataset upload/creation UI** | MCP is query-focused; portal has upload workflows | Keep existing draft/publish tools minimal |
| **Custom visualization** | MCP returns data, not rendered visuals | Return data; client renders |
| **Cross-portal federation** | Scope creep; each portal has different APIs | Build single-portal excellence first |
| **Notification/subscription system** | Requires persistent state, background jobs | Point users to portal notification features |
| **Complex aggregation queries** | Unpredictable performance, scope creep | Return datasets; user aggregates locally |
| **PDF/image OCR** | High complexity, low reliability | Return file URLs; user uses dedicated OCR tools |
| **Usage-based recommendations** | Requires tracking infrastructure not available | Use content-based similarity instead |

## User Expectations by Persona

### Data Analyst
**Primary goal:** Find datasets for analysis projects
**Expectations:**
- Search by topic and filter by format (strongly prefer CSV/Excel)
- See data quality indicators before downloading
- Preview column names to verify relevance
- Filter by date range for time-series analysis
- Get direct download links

**Pain points with current implementation:**
- No text search - must know exact dataset ID or browse
- No format filtering - must check each dataset's distributions manually
- No quality indicators in search results

### App Developer
**Primary goal:** Find datasets with API access for applications
**Expectations:**
- Filter by format (JSON, GeoJSON, API endpoints)
- See update frequency (static vs. real-time)
- Verify license compatibility
- Get stable, versioned endpoints
- Understand schema before integration

**Pain points with current implementation:**
- No format filtering for API-friendly formats
- No license filtering
- No schema introspection

### Both Personas
**Shared expectations:**
- Fast search (< 1 second response for simple queries)
- Relevant results in top 10
- Clear metadata (title, description, publisher, date)
- Working download links
- Consistent API behavior

## Feature Dependencies

```
Full-text Search (Foundation)
    |
    +-- Enables: Faceted filtering (combine with search)
    +-- Enables: Quality-aware ranking (results to rank)
    +-- Enables: Semantic search (extends base search)

Semantic Search
    |
    +-- Requires: Full-text search (base implementation)
    +-- Requires: LLM access (FastMCP sampling)

Schema Introspection
    |
    +-- Requires: Distribution URLs (already have)
    +-- Requires: Format-specific parsers (CSV, JSON, GeoJSON)
    +-- Requires: Size limit protection
    +-- Enables: Data Preview (builds on introspection)

Quality-Aware Ranking
    |
    +-- Requires: get_dataset_metrics (already have)
    +-- Requires: Full-text search (to have results to rank)

Autocomplete
    |
    +-- Requires: Vocabulary endpoints (already have)
    +-- Optional: Dataset title/keyword index
    +-- Enables: Better search UX

Related Datasets
    |
    +-- Requires: Theme/keyword extraction (from metadata)
    +-- Requires: Similarity computation (overlap or embedding)
```

## Recommended Feature Prioritization

Based on project context (from PROJECT.md "Active" requirements):

### Phase 1: Search Foundation (Table Stakes)
Aligns with PROJECT.md "Search Overhaul" requirements.

1. **Full-text search with filters** - Core value proposition
   - Investigate Piveau backend search capability first
   - Implement client-side fallback if needed
2. **Faceted filtering** (theme, format, publisher, date)
   - Theme: Use vocabulary endpoint for valid values
   - Format: Filter on distribution mediaType
   - Publisher: Extract from dataset metadata
   - Date: Filter on issued/modified fields
3. **Sort options** (relevance, date, title)
4. **Pagination with counts**
5. **Fuzzy matching** - Typo tolerance for search terms

### Phase 2: Quality and Preview
Aligns with PROJECT.md "All-in-One Experience" requirements.

1. **Quality-aware ranking** - Leverage existing metrics tool
2. **Schema introspection** (CSV/JSON headers) - New tool
3. **Data preview** (first N rows) - New tool
4. **Autocomplete suggestions** - New tool

### Phase 3: Intelligence Layer
Aligns with PROJECT.md "FastMCP Full Utilization" requirements.

1. **Semantic search** / query expansion via LLM sampling
2. **Related dataset suggestions** - Content-based similarity
3. **Natural language query parsing** - "datasets about X from Y"
4. **Smart recommendations** - Based on query context

## MCP-Specific Considerations

### Tool Design Patterns
- **Prefer multiple focused tools over one mega-tool:** `search_datasets`, `get_schema`, `preview_data` vs. one tool with 20 parameters
- **Return structured data, not formatted text:** Let the LLM format for the user
- **Include pagination metadata:** `{ results: [...], total: 1234, offset: 0, limit: 20 }`
- **Support batch operations:** `get_datasets(ids: string[])` for efficiency

### Proposed New Tools

| Tool | Purpose | Priority |
|------|---------|----------|
| `search_datasets` (enhanced) | Full-text search with filters | P1 |
| `get_search_facets` | Return available filter values | P1 |
| `suggest_search_terms` | Autocomplete suggestions | P2 |
| `get_dataset_schema` | Column names and types | P2 |
| `preview_dataset` | First N rows of data | P2 |
| `find_related_datasets` | Similar datasets by content | P3 |
| `explain_search_results` | Why results match query | P3 |

### Response Size Management
- **Search results:** Return metadata only, not full datasets
- **Previews:** Hard limit on rows (20) and columns (50)
- **Schema:** Return column names and types, not full data dictionaries

### Error Handling
- **No results:** Return empty array with helpful message, not error
- **Invalid filters:** Return validation errors with valid options
- **Timeout:** Return partial results with indication
- **Large files:** Skip preview with size warning

## Open Questions

1. **Backend search capabilities:** Does Piveau Hub API support full-text search? Current client only uses pagination params.
   - **Action:** Investigate Piveau API documentation
   - **Fallback:** Client-side filtering with larger fetch batches

2. **LLM sampling availability:** Can FastMCP sampling be used for semantic search expansion?
   - **Action:** Test FastMCP 2.3.0+ sampling feature
   - **Consideration:** Token costs for per-search LLM calls

3. **Distribution access:** Can distributions be partially downloaded (HTTP Range headers) for preview?
   - **Action:** Test with common distribution URLs on data.gv.at
   - **Fallback:** Download full file with strict size limit

4. **Rate limiting:** How many API calls can be made per search (for quality metrics per result)?
   - **Action:** Profile typical search workflows
   - **Mitigation:** Batch requests, lazy-load quality scores

5. **Vocabulary completeness:** Do vocabulary endpoints contain all theme/format/license values used in datasets?
   - **Action:** Compare vocabulary terms with dataset metadata values
   - **Fallback:** Build supplementary index from dataset metadata

## Sources

**Confidence Note:** This research is based on training data knowledge. WebSearch and WebFetch were unavailable for current verification.

### Knowledge Sources (MEDIUM confidence - training data)
- CKAN API documentation patterns (https://docs.ckan.org/)
- European Data Portal API patterns
- Socrata Open Data API patterns
- data.gov API patterns
- DCAT-AP metadata standard

### Project Context (HIGH confidence - from codebase)
- `.planning/PROJECT.md` - Active requirements
- `.planning/codebase/INTEGRATIONS.md` - Piveau API endpoints
- `app/client.py` - Current API usage
- `app/tools/discovery.py` - Current tool implementations

### Verification Needed
- [ ] Piveau Hub API documentation for search endpoints and parameters
- [ ] data.gv.at portal search feature comparison (observe via browser)
- [ ] FastMCP 2.3.0+ sampling feature documentation
- [ ] Distribution file partial download support (HTTP Range)

## Metadata

**Confidence breakdown:**
- Table stakes features: HIGH - Well-established patterns across all major portals
- Differentiators: MEDIUM - Patterns exist but MCP-specific adaptation unverified
- Anti-features: HIGH - Clear scope boundaries based on MCP constraints and PROJECT.md
- User expectations: MEDIUM - Based on general data portal UX research
- Backend API constraints: LOW - Need to verify Piveau capabilities

**Research date:** 2026-01-16
**Valid until:** Verify with live sources; patterns are stable but specific API capabilities need confirmation
