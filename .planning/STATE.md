# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-17)

**Core value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.
**Current focus:** Planning next milestone (v1.2)

## Current Position

Milestone: v1.1 Documentation Excellence — COMPLETE (2026-01-18)
Phase: Ready for next milestone
Plan: N/A
Status: v1.1 shipped - planning v1.2
Last activity: 2026-01-18 — v1.1 milestone complete

Progress: Archive complete (9/9 plans shipped in v1.1)

## Performance Metrics

**v1.0 Milestone:**
- Total plans completed: 20
- Average duration: 10.9 min
- Total execution time: 3.6 hours
- Timeline: 144 days (Aug 2025 → Jan 2026)

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
| 08-workflow-docs | 4 | 82 min | 21 min |
| 09-fumadocs-component-integration | 4 | 46 min | 11.5 min |
| 10-foundation-fixes | 2 | 16 min | 8 min |
| 16-documentation-polish-and-release-prep | 6 | 23 min | 3.8 min |
| 17-fumadocs-workspace-restructuring | 1 | 14 min | 14 min |

**Recent Trend:**
- Last 5 plans: 16-03 (4 min), 16-05 (1 min), 16-06 (4 min), 17-01 (14 min)
- Trend: Workspace restructuring took longer due to configuration debugging, but completed successfully

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
- Manual MDX creation over auto-generation for documentation clarity (08-03, 2026-01-17)
- Comprehensive examples in all documentation for better learning (08-03, 2026-01-17)
- Prompts documented as workflow templates showing tool combinations (08-03, 2026-01-17)
- Tutorial structure: 6-step progressive workflow for gradual learning (08-04, 2026-01-17)
- Examples organized by use case for easy discovery (08-04, 2026-01-17)
- Fumadocs Tabs for basic/advanced examples to serve all skill levels (08-04, 2026-01-17)
- Best practices focused on performance optimization and API efficiency (08-04, 2026-01-17)
- ImageZoom wraps img elements via component override for automatic enhancement (09-01, 2026-01-17)
- createRelativeLink integrated for relative MDX file navigation support (09-01, 2026-01-17)
- Components passed to MDX via useMDXComponents function for component availability (09-01, 2026-01-17)
- Accordion component wraps each resource type for expandable sections (09-02, 2026-01-17)
- TypeTable used for parameter documentation in prompts for consistent formatting (09-02, 2026-01-17)
- Bilingual structure maintained across English and German API documentation (09-02, 2026-01-17)
- Tabs with persist and groupId for state preservation across page refreshes (09-03, 2026-01-17)
- Complexity-based tab organization: Basic/Advanced, Simple/Detailed, Quick/Comprehensive (09-03, 2026-01-17)
- Consistent groupId naming: preview-complexity, search-complexity, workflow-style (09-03, 2026-01-17)
- Combined Tabs + Steps pattern for workflow examples (Complete vs Step-by-Step) (09-03, 2026-01-17)
- Use Fumadocs createI18nMiddleware helper instead of custom implementation for edge case handling (10-01, 2026-01-18)
- Root layout provides base HTML structure, [lang] layout provides locale-specific wrapping (10-01, 2026-01-18)
- Matcher excludes static assets and Next.js internals from middleware processing (10-01, 2026-01-18)
- Tailwind CSS v4 CSS-based config is correct approach (not v3 preset) - verified 08-02 decision (10-02, 2026-01-18)
- lucideIconsPlugin enables :icon[name] syntax in MDX for icon rendering (10-02, 2026-01-18)
- Austria brand colors (--color-austria-red: #b91e23) defined in @theme for consistent branding (10-02, 2026-01-18)
- uv configuration must use python -m app.server (no script entrypoint in pyproject.toml) (16-01, 2026-01-18)
- Directory structure is app/ not src/austria_mcp/ - document reality not fictional structure (16-01, 2026-01-18)
- fastmcp dev workflow for local testing before Claude Desktop integration (16-01, 2026-01-18)
- Claude Desktop log locations documented for all platforms (Windows/macOS/Linux) (16-01, 2026-01-18)
- Test-driven documentation validation pattern: test workflows then fix documentation (16-01, 2026-01-18)
- Use conversational du-Form (informal you) throughout German documentation instead of formal Sie-Form (16-02, 2026-01-18)
- Keep technical terms in English where German would be awkward: Logging, Retry Backoff, Rate Limiting, MCP-specific terms (16-02, 2026-01-18)
- Simplify German instructions: "Verwende" instead of "Verwenden Sie", direct imperatives over formal constructions (16-02, 2026-01-18)
- Remove AI-translation artifacts: natural practical language over word-for-word translation (16-02, 2026-01-18)
- Use ASCII diagrams in code blocks for architecture visualization (16-03, 2026-01-18)
- Navigation order follows learning progression: tutorials -> guides -> examples -> api -> best-practices (16-03, 2026-01-18)
- Section descriptions in meta.json files provide navigation context (16-03, 2026-01-18)
- Cards component for actionable next steps instead of plain link lists (16-03, 2026-01-18)
- Fumadocs native Mermaid support available for future enhancement (rehype-mermaid plugin) (16-03, 2026-01-18)
- Targeted line-level fix for last remaining parameter error (16-05, 2026-01-18)
- 100% documentation accuracy achieved through two-pass approach: bulk fixes + verification (16-05, 2026-01-18)
- Grep-based discovery ensures all instances of error pattern found (16-06, 2026-01-18)
- Replace_all strategy for efficient bulk corrections (16-06, 2026-01-18)
- Comprehensive verification across all documentation prevents future gaps (16-06, 2026-01-18)
- Import generated API workspace from .source/api/server instead of virtual module path (17-01, 2026-01-18)
- API workspace includes lastModified plugin for consistency with root workspace (17-01, 2026-01-18)
- API content structured at api/api/ to preserve /api/ URL paths while maintaining workspace isolation (17-01, 2026-01-18)
- Both workspaces use shared mdxOptions (rehype plugins, transformers) from root config (17-01, 2026-01-18)

### Roadmap Evolution

- Phase 7 added: API Endpoint Fix - Discovered during user testing that search API was using wrong base URL
- Phase 8 added: Workflow Optimization & Fumadocs Documentation - Create comprehensive bilingual documentation site
- Phase 9 added: Fumadocs Component Integration - Enhance documentation with interactive Fumadocs UI components (Tabs, Accordions, Files, Steps, TypeTable, ImageZoom, etc.)
- Phase 16 added: Documentation Polish & Release Prep - Test MCP server end-to-end, polish documentation quality, add visual resources, prepare for production release
- Phase 17 added: Fumadocs Workspace Restructuring - Separate API reference into its own workspace for cleaner content organization

### Pending Todos

None yet.

### Blockers/Concerns

None - all issues resolved.

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 17-01-PLAN.md (Fumadocs workspace restructuring - Phase 17 complete)
Resume file: None
Next: Additional phases as planned
