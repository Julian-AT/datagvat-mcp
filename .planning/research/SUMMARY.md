# Project Research Summary

**Project:** Austria MCP Server Documentation v2.1
**Domain:** Documentation platform enhancement (RAG chat, video tutorials, CLI UX, navigation)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

v2.1 enhances an existing production Fumadocs documentation site with four major capabilities: RAG-powered documentation chat, programmatic video tutorials via Remotion, shadcn-inspired CLI improvements, and navigation simplification from 8 tabs to 3. This is a **subsequent milestone** building on v2.0's solid foundation of 112 MDX files, Fumadocs 16.4.7, Next.js 16.1.3, and Vercel AI SDK 6.0.41 already in production.

The recommended approach leverages existing infrastructure aggressively. RAG chat repurposes the existing search button and AI SDK integration, building on proven patterns already working in `/try` page. Video generation happens at build-time (not runtime) using GitHub Actions free tier to avoid compute costs. CLI enhancements follow shadcn's registry pattern for familiar UX. Navigation restructuring uses Fumadocs' native `root: true` pattern to create clear tabs without framework fighting.

**Key risks:** RAG hallucinations citing non-existent docs (trust killer), navigation URL breakage (production site with external links), video rendering blocking CI/CD (<5min constraint), and vector DB costs spiraling on small project budget. All are mitigatable through similarity thresholds >0.75, comprehensive redirects, separate video rendering, and multi-layer caching respectively. Most critical: this is a **live production site** — any breaking changes require careful migration paths and testing.

## Key Findings

### Recommended Stack

The existing stack is solid and requires minimal additions. The strategy is **extend, don't replace** — leverage Vercel AI SDK (already installed), use Fumadocs patterns (already working), and keep build time constraints (<5 minutes).

**Stack additions (11 new packages):**

- **@upstash/vector** (^1.0.0) — Serverless vector DB with 10K vectors free tier, REST API for edge compatibility
- **@upstash/redis** (^1.0.0) — Rate limiting and caching for RAG queries
- **Remotion stack** (^4.0.0) — 6 packages (@remotion/cli, bundler, renderer, player, lambda) for programmatic video generation
- **@clack/prompts** (^0.7.0) — Interactive CLI prompts with modern UX (used by Astro, SvelteKit)
- **picocolors** (^1.0.0) — Terminal colors, 14x smaller than chalk
- **diff** (^5.0.0) — Git-style diff preview for config changes
- **execa** (^8.0.0) — Better process execution than child_process

**Critical decision: Do NOT add LangChain** — Vercel AI SDK's `embed()`, `embedMany()`, and `cosineSimilarity()` functions are sufficient for documentation RAG. LangChain adds complexity without benefit for this use case.

**Critical decision: OpenAI text-embedding-3-small** — $0.02/1M tokens, 1536 dimensions. Lower cost than text-embedding-3-large ($0.13/1M), sufficient quality for docs Q&A. Estimated cost: ~$0.50/month for 112 docs.

**Navigation requires ZERO new packages** — Fumadocs meta.json already supports tab consolidation. This is pure configuration work.

### Expected Features

Research identified clear prioritization based on user journey and technical dependencies.

**Must have (table stakes):**

- **RAG Chat:** Natural language Q&A with source citations, context-aware responses, streaming, error handling
- **Videos:** Quickstart video (2-3 min), synchronized captions for accessibility, embedded in docs
- **CLI:** Interactive prompts, validation feedback, progress indicators, clear success/error messages
- **Navigation:** 3 main tabs (Docs/API/Try) matching industry patterns, consistent hierarchy, mobile-optimized

**Should have (differentiators):**

- **RAG:** Code generation from natural language (e.g., "Find Vienna health datasets" → Claude Desktop query syntax), troubleshooting assistant for errors, domain-aware (understands MCP terminology)
- **Videos:** Programmatic generation (update by changing code, not re-filming), dynamic real data.gv.at data, code highlighting sync
- **CLI:** Diff preview before applying changes, update command with version checking, health check command, config validation
- **Navigation:** Smart tab icons, deep linking to subsections, persistent state

**Defer (v2+):**

- Real-time collaboration in chat (complexity vs value for single-user docs)
- Video commenting/annotations (moderation burden, GitHub Discussions exists)
- CLI GUI wrapper (target audience prefers terminal)
- Multi-language video narration (text captions sufficient, defer to v2.3)
- CLI plugin system (scope creep, security concerns)

**Anti-features explicitly rejected:** Cross-session chat memory persistence (privacy concerns, client-only localStorage instead), video editing in browser (Remotion Studio is dev tool, not user-facing), multi-language video voice-over (use captions instead).

### Architecture Approach

Integration patterns leverage existing infrastructure and follow serverless-first principles for Vercel deployment.

**RAG Chat architecture:**
- **Pattern:** API route (`/api/chat/rag`) + server-side vector DB + client component (repurpose existing search button)
- **Vector store:** In-memory for MVP (<10K docs), migrate to PostgreSQL pgvector when scale demands
- **Indexing:** Build-time chunking by semantic boundaries (H2/H3 headings), 1000 tokens max, 200 token overlap
- **Streaming:** Vercel AI SDK `streamText()` + `toDataStreamResponse()` for incremental UI updates
- **Critical:** Server-side only — embeddings and vector search never exposed to client

**Remotion video architecture:**
- **Pattern:** Build-time rendering + static hosting + MDX component
- **Workflow:** Bun script → `renderMedia()` → MP4 files → `public/videos/` → Next.js static serving
- **Critical decision:** Build-time (not runtime) to avoid serverless compute costs and meet <5min constraint
- **Rendering location:** GitHub Actions initially (2K free minutes/month), migrate to Remotion Lambda if scale demands
- **Asset strategy:** `public/videos/` for MVP (3-5 videos ~50MB), migrate to Vercel Blob when >10 videos or >100MB

**Navigation restructuring:**
- **Pattern:** Fumadocs `root: true` in meta.json to create true tabs (not separator-based sections)
- **URL structure:** `/docs/documentation/guides/setup` (tab is part of path)
- **Migration:** Create redirects FIRST, restructure SECOND — critical for production site with external links
- **H1 handling:** Strip duplicate H1s from MDX content (Fumadocs DocsPage already renders from frontmatter)

**CLI enhancement:**
- **Pattern:** Shadcn registry pattern — `add` command with interactive selection
- **Registry:** `tools.json` metadata + templates in `registry/templates/`
- **Config file:** `datagvat.config.json` for project-level configuration
- **Critical:** Maintain backward compatibility, detect CI environments, provide `--yes` flag for automation

**Major components:**
1. **RAG API route** (`/api/chat/rag/route.ts`) — Orchestrates vector search, embedding generation, streaming
2. **Vector indexer** (`lib/rag/indexer.ts`) — Build-time documentation chunking and embedding
3. **Video renderer** (`scripts/render-videos.ts`) — Build-time video generation via Remotion
4. **Remotion compositions** (`remotion/compositions/`) — React-based video components
5. **CLI add command** (`packages/cli/src/commands/add.ts`) — Interactive tool installation
6. **Navigation meta.json** — Fumadocs configuration for tab structure

### Critical Pitfalls

Top 5 highest-impact risks with concrete prevention strategies:

1. **RAG hallucinations with confident citations** — LLM generates plausible but non-existent doc pages, user clicks → 404 → trust destroyed. **Prevention:** Implement similarity threshold >0.75, validate all cited URLs exist before returning, provide "I don't know" fallback messaging for low-quality queries. Test with edge cases where docs don't have answers.

2. **Navigation restructuring breaks production links** — Moving from 8 tabs to 3 changes URLs. External sites, bookmarks, Google search results all break. **Prevention:** Create comprehensive redirect map in `next.config.mjs` BEFORE restructuring, audit all current URLs with fumadocs-cli, test redirects with `curl -I`, keep redirects 6-12 months minimum. Deploy redirects first, restructure second.

3. **Video rendering blocks CI/CD pipeline** — Remotion renders are CPU-intensive (30-120s per video). Multiple videos multiply linearly, exceeding <5 minute constraint. **Prevention:** Separate video rendering from Next.js build, implement `videos:render-if-changed` script that checks git diff, cache rendered videos, add `SKIP_VIDEO_RENDER` env var for quick iterations. Use GitHub Actions matrix for parallel rendering.

4. **CLI breaking changes for existing users** — @datagvat/mcp-installer already published and in use. Changing command signatures or behavior breaks user scripts and CI/CD. **Prevention:** Follow semantic versioning strictly (major bump for breaking changes), maintain deprecated commands for 1-2 major versions, add `--version` flag checking, test CLI in non-interactive mode (CI simulation), never change output format in minor versions.

5. **Vector DB costs spiral out of control** — Every query hits embedding API + vector DB. With growing traffic, costs escalate from $5/month → $500/month on small project budget. **Prevention:** Multi-layer caching (query cache + embedding cache) with LRUCache, rate limiting (5 queries/minute per IP), use lower-dimensional embeddings if accuracy permits (768 vs 1536), monitor costs with alerts (>$50/month warning), pre-compute embeddings for common queries.

**Additional high-severity pitfalls:**
- **Duplicate H1 rendering** (frontmatter + MDX) — unprofessional, SEO penalty. Strip H1s from MDX or use remark plugin.
- **RAG returns off-topic answers** (generic Next.js advice instead of project docs) — Filter vector DB by source metadata, domain-specific system prompt.
- **Video tutorials become outdated quickly** — Focus on concepts not UI, add "last verified" metadata, implement outdated video warnings.
- **RAG chunking loses context** (prerequisites separated from instructions) — Use semantic splitter with 200 token overlap, chunk by H2/H3 sections, include parent section in metadata.
- **RAG slow response times kill UX** (5-10s wait appears frozen) — Stream immediately (<1s TTFB), parallel vector search + LLM call, show "Searching docs..." progress.

## Implications for Roadmap

Based on research, recommended 4-phase structure prioritizing quick wins and risk mitigation:

### Phase 1: Navigation Simplification (Quick Win)

**Rationale:** Unblocks clear structure for chat and videos to integrate into. Configuration-only work with no new dependencies. Low risk, high value. Must come first to establish stable URL structure before adding features that link to docs.

**Delivers:**
- 3-tab layout (Docs/API/Try) replacing 8-section sidebar
- Clean information architecture matching Next.js/Stripe patterns
- Mobile-optimized navigation
- Stable URLs for subsequent phases to reference

**Addresses features:**
- Must-have: 3 main tabs, consistent hierarchy, mobile-optimized
- Should-have: Smart tab icons, deep linking

**Avoids pitfalls:**
- #2 (broken links) — comprehensive redirect map created early
- #6 (duplicate titles) — H1 cleanup during restructuring
- #20 (deep nesting) — flatten hierarchy while consolidating

**Research flag:** Standard Fumadocs patterns, no additional research needed.

### Phase 2: CLI Excellence (Independent, High Value)

**Rationale:** Independent of documentation site, delivers immediate user value. Can proceed in parallel with Phase 3. Low risk (isolated to CLI codebase). Addresses production CLI already in use — improvements have immediate impact.

**Delivers:**
- Interactive setup with @clack/prompts
- Diff preview for config changes
- Config validation and health check
- Update command with version checking

**Addresses features:**
- Must-have: Interactive prompts, validation, progress indicators, error messages
- Should-have: Diff preview, update command, health check
- Differentiators: Config validation, shadcn-quality UX

**Avoids pitfalls:**
- #4 (CLI breaking changes) — semantic versioning, backward compatibility
- #12 (interactive prompts break automation) — detect CI, `--yes` flag
- #19 (poor error messages) — contextual, actionable errors

**Research flag:** Standard CLI patterns, no additional research needed. Test in CI environment.

### Phase 3: RAG Documentation Chat (Core Value)

**Rationale:** Requires navigation structure (Phase 1) to be stable for citation links. Complex feature with multiple risk vectors — needs careful implementation. Uses existing Vercel AI SDK (already proven in `/try` page). This is the key differentiator for v2.1.

**Delivers:**
- Natural language Q&A over 112 MDX files
- Source citations with clickable links
- Code generation from natural language
- Troubleshooting assistant for errors
- Streaming responses with progress indicators

**Addresses features:**
- Must-have: Natural language Q&A, context-aware responses, source citations, streaming, error handling
- Differentiators: Code generation, troubleshooting assistant, domain-aware MCP terminology

**Avoids pitfalls:**
- #1 (RAG hallucinations) — similarity threshold >0.75, URL validation, fallback messaging
- #5 (vector DB costs) — multi-layer caching, rate limiting, cost monitoring
- #7 (off-topic answers) — source filtering, domain-specific system prompt
- #9 (chunking loses context) — semantic splitter with 200 token overlap
- #11 (slow responses) — streaming, parallel processing, <1s TTFB
- #13 (poor source attribution) — enforce citations in system prompt
- #17 (context window exceeded) — token budget management

**Research flag:** **NEEDS RESEARCH** — Embedding model selection, chunking strategy, similarity threshold tuning all require experimentation with actual docs corpus. Plan for 20-test-query benchmark before finalizing approach.

### Phase 4: Video Tutorials (Polish)

**Rationale:** Enhances onboarding experience but not blocking other features. Can proceed in parallel with Phase 2/3 if resources allow. High production effort (7-10 days) — defer until core features proven. Videos are marketing/onboarding polish, not core functionality.

**Delivers:**
- Quickstart video (2-3 min) showing install → first query
- Search workflow video (3-4 min) demonstrating filters and ranking
- Data preview video (2-3 min) showing schema inspection
- All videos with captions and transcripts
- MDX video component for embedding

**Addresses features:**
- Must-have: Quickstart video, synchronized captions, embedded in docs
- Differentiators: Programmatic generation, dynamic data, code highlighting

**Avoids pitfalls:**
- #3 (video rendering blocks CI/CD) — separate rendering, caching, incremental builds
- #8 (videos outdated) — version metadata, "last verified" dates, focus on stable concepts
- #10 (file sizes too large) — 720p not 1080p, optimize bitrate, lazy loading
- #14 (videos lack accessibility) — captions, transcripts, keyboard controls
- #18 (rendering differences local vs CI) — match environments, Docker consistency

**Research flag:** **NEEDS RESEARCH** — Remotion composition patterns, optimal video length/structure, caption generation workflow. Plan for single video prototype before scaling to full corpus.

### Phase Ordering Rationale

**Why this order:**

1. **Navigation first** — Establishes stable URL structure. All subsequent features (RAG citations, video embeds) need stable links. Breaking changes early = less rework later.

2. **CLI second (parallel eligible)** — Independent of documentation site. Can proceed while navigation testing. Immediate value for existing users. Low risk isolated work.

3. **RAG third** — Depends on navigation stability (for citation links). Complex feature requiring careful risk mitigation. Proven patterns from existing AI SDK integration reduce risk. Core differentiator deserves focus after foundation solid.

4. **Videos fourth** — Highest production effort, lowest blocking impact. Can proceed in parallel with Phase 2/3 if resources allow. Marketing/polish work deferred until core functionality proven. Allows time to validate Remotion approach with prototype before full commitment.

**Dependency chains identified:**
- Navigation → RAG (citations need stable URLs)
- Navigation → Videos (embeds need stable URLs)
- RAG ← Existing AI SDK (proven patterns to build on)
- Videos ← Remotion research (needs prototype validation)

**Risk mitigation order:**
- Phase 1 addresses #2 (broken links) before adding features
- Phase 2 addresses #4 (CLI breaking changes) early while user base small
- Phase 3 tackles #1, #5 (RAG hallucinations, costs) with comprehensive prevention
- Phase 4 handles #3, #8 (video CI/CD, outdated content) when infrastructure mature

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**

- **Phase 3 (RAG Chat):** Embedding model selection (OpenAI vs Cohere vs Mistral), optimal chunking strategy (1000 vs 1500 vs 2000 tokens), similarity threshold tuning (0.75 vs 0.80), vector store selection (in-memory vs pgvector vs Pinecone). Research should include 20-test-query benchmark against actual docs corpus. Estimated research time: 2-3 hours.

- **Phase 4 (Videos):** Remotion composition patterns for documentation tutorials, optimal video length/structure for engagement, caption generation workflow (manual vs auto), hosting strategy (public/ vs Vercel Blob vs YouTube). Research should include single video prototype end-to-end before committing to full approach. Estimated research time: 3-4 hours.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Navigation):** Fumadocs meta.json patterns well-documented, redirect strategy standard Next.js. Existing codebase analysis sufficient.

- **Phase 2 (CLI):** Shadcn registry pattern well-established, @clack/prompts widely used, semantic versioning standard. No novel patterns required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing packages verified in package.json, new packages well-documented with clear versions. Remotion version needs verification (`npm view remotion version`) but 4.x pattern confirmed. |
| Features | HIGH | Feature prioritization based on official AI SDK, Remotion, shadcn CLI documentation. User journey analysis validated against Next.js, Stripe, AI SDK navigation patterns. Anti-features based on complexity vs value analysis. |
| Architecture | HIGH | Integration patterns verified against existing codebase (app/[lang]/try/page.tsx for AI SDK, components/chat/ for streaming). Fumadocs patterns verified in meta.json and layout.tsx. Build pipeline understood from scripts/ analysis. |
| Pitfalls | HIGH | Pitfalls #1-#5 (critical) and #6-#20 (high/medium) based on existing codebase analysis (production site constraints), RAG best practices, Remotion performance patterns, CLI design principles, and Next.js deployment constraints. Phase mapping validated against actual file structure. |

**Overall confidence:** HIGH

Research quality is strong due to:
- Existing codebase analysis (package.json, app structure, scripts, meta.json verified)
- Official documentation consulted (Vercel AI SDK, Remotion, Fumadocs, shadcn CLI)
- Production constraints understood (live site, <5min build time, external links)
- Patterns validated against working code (AI SDK already used in /try page)

### Gaps to Address

**Technical validation needed during implementation:**

1. **Embedding model performance** — OpenAI text-embedding-3-small recommended, but quality vs Cohere embed-v3 vs Mistral embed needs benchmark with actual docs. Test with 20 representative queries against docs corpus. Measure precision/recall and cost. Decision point before Phase 3 start.

2. **Optimal chunking strategy** — Research suggests 1000 tokens with 200 overlap, but actual docs structure may require adjustment. Test 1000 vs 1500 vs 2000 token chunks with quality metrics. Decision point during Phase 3 indexing.

3. **Similarity threshold tuning** — 0.75 recommended, but may need adjustment based on embedding model and docs density. Start at 0.75, monitor false positives (low-quality results) and false negatives (no results). Tune during Phase 3 testing.

4. **Video production workflow** — Remotion approach requires prototype validation. Build single video end-to-end (Quickstart) to validate tooling, rendering time, file size, quality before committing to full corpus. Decision point before Phase 4 start.

5. **Build time impact measurement** — Current build time unknown. Phase 3 adds ~30s (embeddings), Phase 4 adds potentially 15+ minutes (videos). Measure baseline, implement caching strategies, validate <5min constraint met. Monitor throughout Phases 3-4.

6. **Vector DB migration trigger** — Starting in-memory, but migration to pgvector may be needed. Monitor RAM usage, query performance. Migrate if docs exceed 10K or search >500ms. Likely not needed for 112 docs, but watch for future growth.

**Cost validation needed:**

- **RAG monthly costs** — Estimated $0.50/month (embeddings) + $0 (Upstash free tier). Monitor actual usage, set alert at >$50/month. Caching implementation critical to stay within estimates.

- **Video hosting** — Starting with public/ (3-5 videos ~50MB). Monitor repo size, consider Vercel Blob migration at >10 videos or >100MB. CDN bandwidth costs unknown, need baseline.

**Process validation needed:**

- **Redirect completeness** — Phase 1 requires auditing all current URLs and external references. Use fumadocs-cli, check analytics for top pages, Google Search Console for indexed URLs. Test all redirects before restructuring.

- **CLI backward compatibility** — Phase 2 requires testing existing user scripts still work. Create test suite with common automation patterns, run in CI environment, verify non-interactive mode works.

## Sources

### Primary (HIGH confidence)

**Existing codebase analysis:**
- `docs/package.json` — Verified versions: Next.js 16.1.3, Fumadocs 16.4.7, Vercel AI SDK 6.0.41, Bun, Biome 2.3.11
- `docs/app/[lang]/docs/[[...slug]]/page.tsx` — Fumadocs DocsPage rendering pattern, H1 duplication issue
- `docs/app/[lang]/try/page.tsx` — Existing Vercel AI SDK integration with useChat hook
- `docs/components/chat/` — Current chat components (chat-interface.tsx, chat-input.tsx, message-list.tsx)
- `docs/content/docs/meta.json` — Current 8-section navigation structure
- `docs/scripts/prebuild.ts` — Existing build pipeline
- `packages/cli/src/` — Current CLI implementation patterns

**Official documentation (verified via Context7 and WebFetch):**
- Vercel AI SDK documentation — `embed()`, `embedMany()`, `cosineSimilarity()` functions, streaming patterns
- Fumadocs documentation — Layout configuration, meta.json patterns, tab structure
- Remotion documentation — Renderer API, server-side video generation patterns
- shadcn CLI patterns — Registry approach, interactive prompts, diff preview

### Secondary (MEDIUM confidence)

**Ecosystem patterns:**
- Navigation consolidation (3-4 tabs standard across Next.js, Stripe, AI SDK documentation sites)
- RAG architecture patterns (vector search + LLM generation, chunking strategies, citation formats)
- CLI design patterns (@clack/prompts vs inquirer, semantic versioning, CI detection)
- Video tutorial best practices (2-5 minute optimal length, accessibility requirements)

**Technology recommendations:**
- @upstash/vector for serverless vector DB (serverless-first approach, REST API, 10K free tier)
- OpenAI text-embedding-3-small for embeddings (cost/quality balance for documentation use case)
- Remotion for video generation (React-based, programmatic, version control friendly)
- GitHub Actions for video rendering (2K free minutes/month, sufficient for 3-5 videos initially)

### Tertiary (LOW confidence — needs validation)

**Cost estimates:**
- Upstash pricing details for 2026 (verify current pricing, free tier limits may change)
- Remotion Lambda pricing (~$1-5/hour estimate, actual may vary)
- GitHub Actions rendering time (~5 min/video estimate, depends on video complexity)
- OpenAI embedding costs for 112 docs (~$0.50/month estimate, needs actual token count)

**Performance estimates:**
- Build time impact: +30s embeddings, +15min videos (needs measurement with actual content)
- Vector search performance: <500ms for in-memory (needs benchmark with actual query patterns)
- Time to first token: <1s target (needs testing with actual vector search + LLM latency)

---

**Research completed:** 2026-01-22
**Ready for roadmap:** Yes
**Next step:** Roadmapper agent can use this summary to structure detailed phase plans with tasks.
