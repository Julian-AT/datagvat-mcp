# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

**Current focus:** Phase 13 - Video Tutorials

## Current Position

Phase: 13 of 13 (Video Tutorials)
Plan: 1 of 3
Status: In progress
Last activity: 2026-01-23 — Completed 13-01-PLAN.md

Progress: [████████░░] 86% (12/14 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 12 (v2.1 Phase 13 in progress)
- Average duration: 9.3 min
- Total execution time: 1.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 10. Navigation Simplification | 6/6 | 59min | 9.8min |
| 11. CLI Excellence | 3/3 | 29min | 9.7min |
| 12. RAG Documentation Chat | 2/3 | 16min | 8.0min |
| 13. Video Tutorials | 1/3 | 6min | 6.0min |

**Recent Trend:**
- Last 5 plans: 11-02 (8min), 11-03 (12min), 12-01 (12min), 12-02 (4min), 13-01 (6min)
- Trend: Excellent velocity, Phase 13 infrastructure setup complete in 6 min

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v2.1 work:

- **v2.0**: Fumadocs for documentation — Modern framework, i18n support, interactive components (foundation for navigation restructuring and video embeds)
- **v2.0**: Bun runtime — Fast builds essential for meeting <5 min constraint with video rendering
- **v2.1**: Navigation first — Establishes stable URLs before RAG citations and video embeds need to reference docs
- **10-01**: Nested folder structure — Use physical nested folders (docs/docs/, docs/api/) instead of flat folders with URL path configuration
- **10-01**: 301 permanent redirects — Preserve SEO and external link compatibility through permanent redirects
- **10-01**: Automated redirect verification — Ensure no gaps in redirect coverage with verification script
- **10-03**: shields.io badges — Live status indicators for version, build, license, MCP compatibility, Python version
- **10-03**: Quick Start path correction — MCP server in mcp/ subdirectory, config points to app/server.py
- **10-03**: Two-part contribution guide — Separate sections for MCP server (Python) and documentation (Next.js)
- **10-02**: Root folders require index.mdx — Fumadocs requires index files for root folders with root: true to display as tabs
- **10-02**: Index pages as navigation hubs — Use Card components to provide clear navigation to subsections
- **10-04**: EditorConfig baseline with Biome enforcement — EditorConfig works across all editors without extension, Biome provides enforcement via CLI
- **10-04**: Explicit formatting rules in Biome — All rules explicit (lineEnding: lf, jsxQuoteStyle, trailingCommas) to match .editorconfig
- **10-05**: i18n files false positives — German translation files (.de.mdx) show as unused in static analysis but are auto-detected by Fumadocs
- **10-05**: Keep build tool dependencies — CSS @import and build tool usage not detected by depcheck, verify build after removal
- **10-05**: Fumadocs built-in search sufficient — Removed Orama and Algolia dependencies, built-in search meets requirements
- **10-06**: Comprehensive build verification required — TypeScript, Biome, link validation, full build, AND backend tests ensure no hidden breakage from Phase 10 changes
- **10-06**: 5-minute build time target — CI/CD pipeline efficiency, 130s actual time demonstrates excellent performance with growth headroom
- **10-06**: Zero tolerance for errors at phase boundaries — All verification checks must pass (exit 0) before proceeding to next phase
- **11-01**: Zod for CLI validation — Runtime validation with TypeScript inference, custom error messages for better UX
- **11-01**: ci-info for CI detection — Robust detection across CI providers, checks both ciInfo.isCI and process.stdout.isTTY
- **11-01**: Error format: problem + fix + example — Every error message includes what's wrong, how to fix it, and exact command to run
- **11-01**: Inline prompt validation — Validate option in prompt config provides immediate feedback during user interaction
- **11-02**: Custom type declaration for diff module — @types/diff deprecated stub, created minimal types in src/types/diff.d.ts
- **11-02**: 7 health checks with granular severity — Error (must-fix), warning (should-fix), info (optional) for proper CI/CD integration
- **11-02**: Check both python3 and python commands — Maximum compatibility across different system configurations
- **11-02**: Exit code reflects severity — Doctor exits 1 for critical errors only, 0 for warnings/info
- **11-03**: Minor version bump for new features — 0.1.0 → 0.2.0 following semver (new features without breaking changes)
- **11-03**: Keep a Changelog format — Standard format (keepachangelog.com) with Added/Changed/Fixed sections
- **11-03**: Biome formatting applied to CLI — Consistent code style across CLI package, intentional exceptions for ANSI codes
- **12-01**: Vectra for local vector database — Zero infrastructure for <10K chunks, optional Upstash upgrade path for production scaling
- **12-01**: Section-based chunking by H2/H3 headings — Preserves semantic context, better citation accuracy than fixed-size chunks
- **12-01**: 100-token overlap between chunks — ~400 chars prevents context loss at semantic boundaries
- **12-01**: Build-time indexing — Generate embeddings during build to avoid runtime latency, fits 5-minute build constraint
- **12-01**: fumadocs-mdx dependency ordering — Must run before index-docs.ts to generate .source files (added as step 0 in prebuild)
- **12-02**: 0.75 similarity threshold baseline — Starting point for quality filtering, configurable, may need tuning with real queries
- **12-02**: Top-5 chunk retrieval — Balance between context richness (~5K tokens) and token budget
- **12-02**: Numbered citation format [1], [2] — Simple, unambiguous format LLMs can reliably generate
- **12-02**: Source metadata via data stream — toDataStreamResponse data parameter enables client-side clickable citations
- **13-01**: Remotion 4.0 infrastructure — H.264 codec with CRF 21, file-based caching via timestamp comparison, 50% concurrency

### Pending Todos

**User Manual Verification (from v2.0 Phase 24):**
- 56 search queries for manual testing (non-blocking)

**User Screenshot Capture (from v2.0 Phase 23):**
- 5-7 Claude Desktop screenshots (non-blocking)
- Quick Start screenshot for README.md (added in 10-03, non-blocking)

### Blockers/Concerns

**Phase 12 (RAG Chat):**
- **RESOLVED (12-01)**: Embedding library — Using Vercel AI SDK native embedMany() with OpenAI text-embedding-3-small
- **RESOLVED (12-01)**: Chunking strategy — Section-based by H2/H3 headings with 100-token overlap
- **RESOLVED (12-02)**: RAG API endpoint — /api/rag complete with streaming, citations, and source metadata
- **PENDING**: OPENAI_API_KEY required — Must be set in environment for vector indexing and query embeddings to work
- **PENDING**: Similarity threshold validation — 0.75 baseline needs real query testing in Plan 12-03
- **PENDING**: Citation rendering in UI — Map [1], [2] → clickable links using sources metadata

**Phase 13 (Video Tutorials):**
- **RESOLVED (13-01)**: Remotion installation — Dependencies installed, H.264 codec configured
- **RESOLVED (13-01)**: Build-time rendering script — File-based caching implemented
- **PENDING**: Video composition patterns — Create QuickStart, Workflow, Architecture videos in Plan 13-02
- **PENDING**: Caption generation strategy — Whisper AI integration or manual VTT creation in Plan 13-02
- **PENDING**: Build integration — Add render-videos.ts to prebuild script in Plan 13-03 after compositions exist

## Session Continuity

Last session: 2026-01-23 (autonomous Phase 13-01 execution)
Stopped at: Completed 13-01-PLAN.md — Remotion infrastructure setup
Resume file: None
Next step: Plan 13-02 - Video composition components (QuickStart, Workflow, Architecture)

---

*Last updated: 2026-01-23 after Plan 13-01 completion*
