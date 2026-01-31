# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**MCP Server Error Handling - Empty Return Values:**
- Issue: Several functions in `mcp/app/client.py` and `mcp/app/preview.py` return empty dicts/lists as fallback values without distinguishing between "no data" and "error" states
- Files: `mcp/app/client.py:131`, `mcp/app/client.py:174`, `mcp/app/preview.py:339`, `mcp/app/preview.py:356`
- Impact: AI assistants may receive empty responses and not know whether to retry, inform user of error, or treat as legitimate empty result
- Fix approach: Return structured error responses with reason codes, or raise exceptions that FastMCP can translate to proper MCP error protocol messages

**Semantic Search Language Detection - Limited Heuristics:**
- Issue: `mcp/app/semantic.py:15-52` uses basic keyword matching for German/English detection (counts occurrences of common words)
- Files: `mcp/app/semantic.py:15-52`
- Impact: Ambiguous or multilingual queries may be misclassified, leading to suboptimal search expansion. Falls back to "auto" but this reduces semantic search quality
- Fix approach: Consider using langdetect library or similar for more robust language identification, or rely entirely on LLM-based detection within expansion prompt

**JSON Truncation Recovery - Fragile Parsing:**
- Issue: `mcp/app/preview.py:359-421` attempts to recover valid JSON from truncated partial content using bracket counting and pattern matching
- Files: `mcp/app/preview.py:359-421`
- Impact: Complex nested JSON structures may fail to parse correctly, resulting in PreviewError when data could potentially be recovered with better logic
- Fix approach: Use streaming JSON parser (e.g., ijson) to extract complete objects from partial content, or implement more robust bracket-balancing algorithm

**Hardcoded API Token in Chat Route:**
- Issue: `docs/app/api/chat/route.ts:38` contains hardcoded MCP server authorization token in source code
- Files: `docs/app/api/chat/route.ts:38`
- Impact: Security risk if repository is public or token needs rotation. Token exposed in client-side bundle if not properly tree-shaken
- Fix approach: Move token to environment variable (e.g., `FASTMCP_AUTH_TOKEN`), add to `.env.example`, document in deployment guide

**Console.log Statements in Production Code:**
- Issue: `docs/app/api/chat/route.ts:50,52,57,74,79` contains multiple console.log statements used for debugging
- Files: `docs/app/api/chat/route.ts:50,52,57,74,79`
- Impact: Pollutes server logs with unnecessary output, potential performance overhead in high-traffic scenarios
- Fix approach: Remove console.log statements or replace with proper logging library (e.g., pino, winston) with configurable log levels

## Known Bugs

**No Known Critical Bugs:**
- Investigation of TODO/FIXME comments found only documentation placeholders and archived debug sessions (`.planning/debug/resolved/`)
- No active bug markers in production code paths

## Security Considerations

**Missing Environment Variable Validation:**
- Risk: Documentation chat feature (`docs/app/api/chat/route.ts`) requires `OPENAI_API_KEY` but no validation exists at build time or runtime startup
- Files: `docs/app/api/chat/route.ts`, missing from `docs/.env.example`
- Current mitigation: Vercel AI SDK throws error on first use, but this results in runtime failures instead of clear configuration error messages
- Recommendations: Add startup validation script to check required env vars, add `OPENAI_API_KEY` to `.env.example`, document in deployment guide

**API Key Exposure in Client Code:**
- Risk: Hardcoded FastMCP authorization token in `docs/app/api/chat/route.ts:38` could be exposed through source maps or bundle analysis
- Files: `docs/app/api/chat/route.ts:38`
- Current mitigation: Server-side API route prevents direct client access to token
- Recommendations: Move to environment variable, rotate token immediately after fix, add secret scanning to CI/CD

**No Rate Limiting on Chat Endpoint:**
- Risk: `/api/chat` endpoint has no rate limiting, allowing potential abuse of OpenAI API credits
- Files: `docs/app/api/chat/route.ts`
- Current mitigation: None detected
- Recommendations: Implement rate limiting via Vercel Edge Config or middleware (e.g., @upstash/ratelimit), add per-IP or per-session limits

## Performance Bottlenecks

**First Request Latency - MCP Server Spawn:**
- Problem: First request to documentation chat spawns Python MCP server subprocess, causing 2-3 second delay
- Files: Referenced in `.planning/milestones/v2.0-MILESTONE-AUDIT.md:22-25`
- Cause: Cold start of Python process with FastMCP initialization
- Improvement path: Pre-warm MCP connection on Next.js server start, add loading state in UI, consider persistent MCP server process instead of per-request spawn

**Large TypeScript Declaration Files:**
- Problem: Multiple 100K+ line declaration files in node_modules slow TypeScript compilation
- Files: `docs/node_modules/@octokit/openapi-types/types.d.ts` (122,599 lines), `docs/node_modules/@octokit/openapi-webhooks-types/types.d.ts` (70,664 lines)
- Cause: GitHub Octokit types include entire GitHub API surface area
- Improvement path: If Octokit is only used for docs generation, move to devDependencies or use more targeted @octokit/types imports

**No Caching for Semantic Query Expansion:**
- Problem: Every semantic search query calls LLM via `ctx.sample()` even for identical/similar queries
- Files: `mcp/app/semantic.py:140`
- Cause: No caching layer for query expansion results
- Improvement path: Add TTL cache for expanded query results keyed by query text, or use FastMCP caching if available

## Fragile Areas

**CSV Dialect Detection:**
- Files: `mcp/app/preview.py:179-185`
- Why fragile: Relies on `csv.Sniffer()` which can fail on edge cases (mixed delimiters, quoted fields with delimiters)
- Safe modification: When changing CSV parsing logic, test with edge cases (TSV files, semicolon CSVs common in German datasets, files with BOM)
- Test coverage: Good (`mcp/tests/test_preview.py` exists with 3,001 test files total)

**RDF to JSON-LD Parsing:**
- Files: `mcp/app/client.py:146-163`
- Why fragile: Depends on rdflib's graph parsing with multiple format detection paths (turtle, rdf+xml, n-triples)
- Safe modification: Changes to content negotiation or format detection require testing against live data.gv.at API responses
- Test coverage: Client tests exist (`mcp/tests/test_client.py`), but RDF parsing may need integration tests with real API

**Similarity Score Calculation:**
- Files: `mcp/app/similarity.py:81-120`
- Why fragile: Hardcoded score weights (30 points per theme, 10 per keyword, 15 for publisher) based on heuristics
- Safe modification: Changing weights requires validation against real dataset relationships, minimum score threshold (20.0) may need tuning
- Test coverage: Tests exist (`mcp/tests/test_similarity.py`)

**Remotion Video Rendering:**
- Files: `docs/remotion/compositions/` (QuickStart.tsx, Workflow.tsx, Architecture.tsx)
- Why fragile: Frame-based animations with hardcoded frame ranges, spring configurations, and timing dependencies
- Safe modification: Changing FPS or durations requires recalculating all frame offsets in animations
- Test coverage: Manual verification only, no automated visual regression tests

## Scaling Limits

**Vector Search - Local Vectra Database:**
- Current capacity: <10K chunks documented in `.planning/STATE.md:79`
- Limit: In-memory vector storage scales poorly beyond 10K documents, no persistence between deploys
- Scaling path: Migrate to Upstash Vector (mentioned as upgrade path in `.planning/STATE.md:79`) or Pinecone for production

**MCP Server Concurrency:**
- Current capacity: Single Python process per request
- Limit: No connection pooling or persistent MCP server, each chat request spawns new process
- Scaling path: Deploy MCP server as standalone service with multiple workers, use FastMCP's HTTP transport for persistent connections

**Similarity Search Candidate Set:**
- Current capacity: Fetches 50 candidates by theme + 30 by keywords (max 80)
- Limit: Scores all candidates synchronously, O(n) complexity
- Scaling path: Implement pagination for large candidate sets, add early termination when top N scores are confident

## Dependencies at Risk

**Bun Runtime for Production:**
- Risk: Bun 1.x is pre-1.0 stability, documented type-check issue requires workaround
- Impact: Referenced in `.planning/milestones/v2.0-ROADMAP.md:247` - "TypeScript type-check issue with Bun 1.x (temporary workaround: skip type-check)"
- Migration plan: Monitor Bun 2.0 release for type-checking fixes, or consider Node.js 20+ as fallback runtime

**Fumadocs OpenAPI Generation:**
- Risk: Custom schema filtering required for RDF content types (added placeholders in Phase 7)
- Impact: Updates to fumadocs-openapi may break custom filtering logic in `docs/lib/filter-openapi.ts`
- Migration plan: Monitor fumadocs releases, test OpenAPI generation after updates, consider contributing RDF support upstream

## Missing Critical Features

**No Health Check Endpoint:**
- Problem: MCP server lacks health check endpoint for monitoring
- Blocks: Production deployment monitoring, graceful degradation strategies
- Referenced in: `.planning/milestones/v2.0-MILESTONE-AUDIT.md:23`

**No RAG Similarity Threshold Validation:**
- Problem: 0.75 similarity threshold for RAG chat is untested baseline
- Blocks: Production quality assurance for documentation chat feature
- Referenced in: `.planning/STATE.md:114` - "PENDING: Similarity threshold validation"

**No Citation Rendering in Chat UI:**
- Problem: Backend returns numbered citations [1], [2] but UI doesn't render clickable links
- Blocks: Full user experience for documentation chat feature
- Referenced in: `.planning/STATE.md:115` - "PENDING: Citation rendering in UI"

## Test Coverage Gaps

**Documentation Chat Integration:**
- What's not tested: End-to-end chat flow with RAG retrieval, citation rendering, MCP tool calls
- Files: `docs/app/api/chat/route.ts`, `docs/components/chat.tsx`
- Risk: Breaking changes to streaming protocol, tool execution, or citation format could go unnoticed
- Priority: High - User-facing feature with complex integrations

**Semantic Search LLM Expansion:**
- What's not tested: Query expansion quality, German/English detection accuracy, theme code validation
- Files: `mcp/app/semantic.py:55-176`
- Risk: Poor expansion results could degrade search quality without detection
- Priority: Medium - Fallback to direct search exists, but semantic search is key feature

**CSV/JSON Preview Edge Cases:**
- What's not tested: Files with mixed line endings, BOM variations, malformed JSON recovery edge cases
- Files: `mcp/app/preview.py`
- Risk: Preview failures on real-world datasets could break user workflows
- Priority: Medium - Error handling exists, but user experience degrades on failures

**Video Rendering Regressions:**
- What's not tested: Remotion composition rendering, frame timing accuracy, caption synchronization
- Files: `docs/remotion/compositions/`
- Risk: Changes to compositions or Remotion version upgrades could break videos without detection until manual review
- Priority: Low - Videos are static assets, breakage only occurs during build

---

*Concerns audit: 2026-01-31*
