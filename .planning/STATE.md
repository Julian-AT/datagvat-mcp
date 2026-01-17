# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.
**Current focus:** Phase 8 — Workflow Optimization & Fumadocs Documentation

## Current Position

Phase: 8 of 8 (Workflow Optimization & Fumadocs Documentation) - IN PROGRESS
Plan: 2 of ? complete (08-01, 08-02 complete)
Status: Active - workflow optimized, documentation site established
Last activity: 2026-01-17 — Completed 08-01-PLAN.md (Workflow Optimization)
Next: Continue with 08-03 (content creation) or other Phase 8 plans

Progress: ████████████ 95% (7 of 8 phases complete, Phase 8 in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 9.1 min
- Total execution time: 2.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-enterprise-foundation | 3 | 27 min | 9 min |
| 02-basic-search | 3 | 18 min | 6 min |
| 03-quality-autocomplete | 1 | 4 min | 4 min |
| 04-data-preview | 2 | 14 min | 7 min |
| 05-related-datasets | 1 | 8 min | 8 min |
| 06-semantic-search | 1 | 12 min | 12 min |
| 07-api-endpoint-fix | 1 | ~15 min | ~15 min |
| 08-workflow-docs | 2 | 48 min | 24 min |

**Recent Trend:**
- Last 5 plans: 06-01 (12 min), 07-01 (~15 min), 08-01 (28 min), 08-02 (20 min)
- Trend: Workflow optimization tasks (type hints, docs, CI) take longer than feature code

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FastMCP as framework → MCP protocol compliance (established)
- Consumers over publishers → Primary audience is analysts/developers (pending)
- Middleware order: Logging → Error → Retry → RateLimit → Audit → Auth (01-01, 2026-01-16)
- Rate limit: 10 req/s with burst 20 for API protection (01-01, 2026-01-16)
- Retry: 3 attempts, 1-60s exponential backoff for transient failures (01-01, 2026-01-16)
- ToolError for all tool-level errors for FastMCP middleware consistency (01-02, 2026-01-16)
- String ID validation: max 200 chars (flexible Piveau format) (01-03, 2026-01-16)
- Title/description validation: 500/5000 chars for draft operations (01-03, 2026-01-16)
- Connection errors raise ToolError with actionable guidance (01-03, 2026-01-16)
- Optional features degrade gracefully, core features fail fast (01-03, 2026-01-16)
- Use Literal type (not Enum) for SortOption - FastMCP handles Literal natively (02-01, 2026-01-16)
- Pass facets as JSON string - Piveau API requirement (02-01, 2026-01-16)
- Return full response including facets object - needed for UI filter counts (02-01, 2026-01-16)
- Use httpx params dict for encoding - automatic, no manual URL building (02-01, 2026-01-16)
- Theme codes uppercase per EU DCAT-AP vocabulary (13 codes) (02-02, 2026-01-16)
- Filter logic: OR within same facet, AND between different facets (02-02, 2026-01-16)
- Date inputs normalized to ISO 8601 with timezone (02-02, 2026-01-16)
- Page-based pagination for consistency with Piveau API (02-02, 2026-01-16)
- Test Phase 2 dict return format with results, count, facets keys (02-03, 2026-01-16)
- Test expectations align with Phase 1 ToolError wrapper pattern (02-03, 2026-01-16)
- Quality score based on metadata completeness (8 components, 0-100 scale) (03-01, 2026-01-16)
- Quality boost as optional parameter (default false) - only active with query (03-01, 2026-01-16)
- Re-rank results post-search rather than modifying API query (03-01, 2026-01-16)
- Autocomplete uses static vocabularies (EU themes, formats, common terms) for instant response (03-01, 2026-01-16)
- Prefix matches score 100, substring matches score 50 for autocomplete relevance (03-01, 2026-01-16)
- No external API calls for autocomplete - all data in-memory (03-01, 2026-01-16)
- 64KB default preview (enough for ~1000 CSV rows) (04-01, 2026-01-16)
- 512KB max preview to prevent memory issues (04-01, 2026-01-16)
- Infer types from 10 sample rows for efficiency (04-01, 2026-01-16)
- Support multiple CSV delimiters via csv.Sniffer (04-01, 2026-01-16)
- Recover truncated JSON by finding last complete object (04-01, 2026-01-16)
- Detect nested data arrays via common keys (data, results, items, records) (04-01, 2026-01-16)
- URL validation requires http:// or https:// prefix (04-02, 2026-01-16)
- Format auto-detection from URL extension when not specified (04-02, 2026-01-16)
- Estimated bytes calculation: CSV ~500 bytes/row, JSON ~200 bytes/object (04-02, 2026-01-16)
- Theme matches weighted 3x higher than keyword matches (30 vs 10 points) (05-01, 2026-01-17)
- Publisher bonus 15 points for same-org datasets (05-01, 2026-01-17)
- Score components capped (themes 60, keywords 30, total 100) (05-01, 2026-01-17)
- Minimum score threshold 20 points default to filter weak matches (05-01, 2026-01-17)
- FastMCP Context.sample() for LLM query expansion instead of external APIs (06-01, 2026-01-17)
- German/English auto-detection using linguistic heuristics (der/die/das, von, für) (06-01, 2026-01-17)
- Graceful fallback to original query when LLM expansion fails or low confidence (06-01, 2026-01-17)
- Merge semantic expansion with explicit user filters using set union (06-01, 2026-01-17)
- Default quality boost enabled for semantic search (users expect relevance) (06-01, 2026-01-17)
- API base URL changed to https://www.data.gv.at/api/hub/search (correct endpoint) (07-01, 2026-01-17)
- Response unwrapping for search API: extract {"result": {...}} wrapper (07-01, 2026-01-17)
- Facet parameter "categories" not "theme" for EU theme filtering (07-01, 2026-01-17)
- Catalogue list returns array of ID strings, converted to [{"id": "..."}] format (07-01, 2026-01-17)
- Next.js 16.1.3 with Fumadocs for documentation (fumadocs-ui peer dependency requirement) (08-02, 2026-01-17)
- Tailwind CSS v4 with CSS-based configuration for Fumadocs UI styling (08-02, 2026-01-17)
- Language-suffixed MDX files (index.de.mdx) for German content translations (08-02, 2026-01-17)
- Dynamic [lang] routing for bilingual documentation (/en, /de) (08-02, 2026-01-17)
- Mypy strict mode for maximum type safety across all Python modules (08-01, 2026-01-17)
- Google-style docstrings for consistency with Python ecosystem (08-01, 2026-01-17)
- GitHub Actions CI with Python 3.11 and 3.12 matrix testing (08-01, 2026-01-17)
- Auto-fix import ordering with ruff for code consistency (08-01, 2026-01-17)

### Roadmap Evolution

- Phase 7 added: API Endpoint Fix - Discovered during user testing that search API was using wrong base URL
- Phase 8 added: Workflow Optimization & Fumadocs Documentation - Create comprehensive bilingual documentation site

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 8 (current):**
- TypeScript build with --noEmit fails on fumadocs-mdx type definitions
  - Dev server works correctly, runtime behavior is fine
  - Type inference issue, not functional problem
  - Can be addressed in future optimization if production builds needed

## Session Continuity

Last session: 2026-01-17
Stopped at: Completed 08-01-PLAN.md (Workflow Optimization)
Resume file: None
Next: Continue Phase 8 with content creation or additional workflow/docs plans
