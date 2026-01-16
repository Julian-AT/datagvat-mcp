# Requirements: Austria MCP

**Defined:** 2026-01-16
**Core Value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Search & Discovery

- [ ] **SEARCH-01**: User can search datasets by text query (titles, descriptions, keywords)
- [ ] **SEARCH-02**: User can filter search results by theme/category (using EU vocabularies)
- [ ] **SEARCH-03**: User can filter search results by format (CSV, JSON, GeoJSON, etc.)
- [ ] **SEARCH-04**: User can filter search results by publisher/organization
- [ ] **SEARCH-05**: User can filter search results by date range (issued/modified)
- [ ] **SEARCH-06**: User can sort results by relevance, date, or title
- [ ] **SEARCH-07**: User can navigate paginated results with total count displayed
- [ ] **SEARCH-08**: User can search with typos and get relevant results (fuzzy matching)

### Advanced Search

- [ ] **ADVSEARCH-01**: User sees high-quality datasets ranked higher in search results
- [ ] **ADVSEARCH-02**: User receives autocomplete suggestions while typing search queries
- [ ] **ADVSEARCH-03**: User can search using natural language and get semantically relevant results

### Data Preview & Understanding

- [ ] **PREVIEW-01**: User can view schema (column names and types) for CSV/JSON datasets
- [ ] **PREVIEW-02**: User can preview first 10-20 rows of tabular datasets
- [ ] **PREVIEW-03**: User can discover related datasets based on themes and keywords

### Enterprise Reliability

- [x] **ENTERPRISE-01**: Server uses FastMCP 2.14+ with built-in retry middleware
- [x] **ENTERPRISE-02**: Server uses FastMCP 2.14+ with built-in rate limiting middleware
- [x] **ENTERPRISE-03**: Server uses FastMCP 2.14+ with built-in structured logging middleware
- [x] **ENTERPRISE-04**: All tool errors return consistent error format with isError: true
- [x] **ENTERPRISE-05**: All requests have correlation IDs for request tracing
- [x] **ENTERPRISE-06**: Long-running operations report progress to user
- [x] **ENTERPRISE-07**: All user inputs are validated and sanitized before use
- [x] **ENTERPRISE-08**: Server gracefully degrades when Piveau API is unavailable

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search & Discovery

- **SEARCH-09**: User can filter by license type
- **SEARCH-10**: User can filter by spatial coverage (geographic area)
- **SEARCH-11**: User can filter by language
- **SEARCH-12**: User receives explanation of why results matched their query

### Intelligence Layer

- **INTEL-01**: User receives smart dataset recommendations based on query context
- **INTEL-02**: User can ask questions about Austrian open data ecosystem
- **INTEL-03**: User receives download assistance with format-specific guidance
- **INTEL-04**: User can request combined analysis across multiple datasets

### Data Management

- **MGMT-01**: User can batch-fetch multiple datasets efficiently
- **MGMT-02**: User can monitor dataset update frequencies
- **MGMT-03**: User can track dataset version history

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full dataset download via MCP | MCP has response size limits; datasets can be gigabytes. Return URLs instead. |
| Real-time data transformation | CPU-intensive, unpredictable execution time. Users transform locally. |
| Data caching layer | Stale data problems, storage costs, cache invalidation complexity. Use HTTP caching. |
| User account management | Out of scope for discovery; portal handles authentication. |
| Dataset upload/creation workflows | MCP is query-focused; portal has upload UI. Keep draft/publish minimal. |
| Custom data visualization | MCP returns data, not rendered visuals. Client renders. |
| Cross-portal federation | Scope creep; each portal has different APIs. Single-portal excellence first. |
| Notification/subscription system | Requires persistent state, background jobs. Point users to portal features. |
| Complex aggregation queries | Unpredictable performance. Users aggregate locally. |
| PDF/image OCR for datasets | High complexity, low reliability. Users use dedicated OCR tools. |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEARCH-01 | Phase 2 | Complete |
| SEARCH-02 | Phase 2 | Complete |
| SEARCH-03 | Phase 2 | Complete |
| SEARCH-04 | Phase 2 | Complete |
| SEARCH-05 | Phase 2 | Complete |
| SEARCH-06 | Phase 2 | Complete |
| SEARCH-07 | Phase 2 | Complete |
| SEARCH-08 | Phase 2 | Complete |
| ADVSEARCH-01 | Phase 3 | Complete |
| ADVSEARCH-02 | Phase 3 | Complete |
| ADVSEARCH-03 | Phase 6 | Pending |
| PREVIEW-01 | Phase 4 | Pending |
| PREVIEW-02 | Phase 4 | Pending |
| PREVIEW-03 | Phase 5 | Pending |
| ENTERPRISE-01 | Phase 1 | Complete |
| ENTERPRISE-02 | Phase 1 | Complete |
| ENTERPRISE-03 | Phase 1 | Complete |
| ENTERPRISE-04 | Phase 1 | Complete |
| ENTERPRISE-05 | Phase 1 | Complete |
| ENTERPRISE-06 | Phase 1 | Complete |
| ENTERPRISE-07 | Phase 1 | Complete |
| ENTERPRISE-08 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-16 after initial definition*
