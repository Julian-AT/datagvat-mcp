# Technology Stack — v2.1 Additions

**Project:** Austria MCP Server Documentation
**Milestone:** v2.1 Documentation Excellence & AI Features
**Researched:** 2026-01-22

## Existing Stack (DO NOT CHANGE)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.1.3 | App Router, server components | ✓ Established |
| Fumadocs | 16.4.7 | Documentation framework | ✓ Established |
| Bun | Latest | Runtime and package manager | ✓ Established |
| Biome | 2.3.11 | Linting and formatting | ✓ Established |
| TypeScript | 5.9.3 | Type safety with strict mode | ✓ Established |
| Tailwind CSS | 4.1.18 | Styling framework | ✓ Established |
| Vercel AI SDK | 6.0.41 (ai package) | Already installed | ✓ Established |
| @ai-sdk/react | 3.0.43 | React hooks for streaming | ✓ Established |
| @ai-sdk/openai-compatible | 2.0.13 | Anthropic Claude integration | ✓ Established |

## New Stack Requirements for v2.1

### 1. RAG Pipeline with Vercel AI SDK

**Current state:** Basic AI chat exists (`/api/chat/route.ts`) with streaming and MCP tool calling, but no RAG/embeddings.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| None — use existing `ai` 6.0.41 | Current | Embeddings via `embed()` and `embedMany()` | HIGH |
| @upstash/vector | ^1.0.0 | Vector database for doc embeddings | HIGH |
| @upstash/redis | ^1.0.0 | Rate limiting and caching | MEDIUM |

**Why these choices:**

**Vercel AI SDK (existing):** The `ai` package (6.0.41) already provides:
- `embed()` and `embedMany()` functions for generating embeddings
- `cosineSimilarity()` for vector search
- Provider-agnostic embedding support (OpenAI, Google, Mistral, Cohere, Bedrock)
- No additional packages needed for embeddings generation

**@upstash/vector (recommended):**
- Free tier: 10K vectors, 10K queries/day (sufficient for docs corpus)
- Serverless-native, edge-compatible (Next.js App Router optimization)
- REST API (no persistent connections needed in serverless)
- Simple SDK with TypeScript support
- Cost scales: $0.40/100K queries after free tier
- Better than Pinecone (no free tier after trial) or Qdrant (requires self-hosting)

**Alternative not recommended:**
- Pinecone: No permanent free tier (7-day trial only)
- Qdrant: Self-hosting complexity or $95/month cloud minimum
- Weaviate: Self-hosting or $25/month minimum
- ChromaDB: Local-only, not edge-compatible

#### Embedding Model Recommendation

| Model | Provider | Dimensions | Cost | Rationale |
|-------|----------|------------|------|-----------|
| text-embedding-3-small | OpenAI | 1536 | $0.02/1M tokens | Best balance: quality, cost, dimension size |

**Why:**
- Lower cost than `text-embedding-3-large` ($0.02 vs $0.13 per 1M tokens)
- Sufficient quality for documentation Q&A (not semantic research)
- Smaller dimensions = faster vector search
- Already have OpenAI SDK pattern via Anthropic integration

**Not recommended:**
- text-embedding-3-large: Overkill for docs, 6.5x more expensive
- Google/Mistral/Cohere: Additional provider complexity, no clear benefit

#### RAG Architecture

```typescript
// New files needed:
// - lib/embeddings/generate.ts — Generate embeddings for docs corpus
// - lib/embeddings/search.ts — Vector search implementation
// - lib/embeddings/store.ts — Upstash Vector client wrapper
// - scripts/build-embeddings.ts — Build-time embedding generation

// Integration point: app/api/chat/route.ts
// Add RAG context retrieval before streamText() call
```

**Build workflow:**
1. Prebuild script: Generate embeddings for all MDX files
2. Store in Upstash Vector with metadata (title, path, section)
3. Runtime: Query vector DB with user question, retrieve top 5 matches
4. Inject context into system prompt for Claude

**Configuration needed:**
```bash
# .env.local additions
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=xxx
OPENAI_API_KEY=xxx  # For embeddings only
```

---

### 2. Remotion for Video Generation

**Current state:** No video generation capability. Need infrastructure for tutorial videos (quickstart, workflows, architecture).

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| remotion | ^4.0.0 | Core video framework | HIGH |
| @remotion/cli | ^4.0.0 | CLI for rendering videos | HIGH |
| @remotion/lambda | ^4.0.0 | AWS Lambda rendering (production) | MEDIUM |
| @remotion/player | ^4.0.0 | Preview player component | MEDIUM |
| @remotion/bundler | ^4.0.0 | Webpack bundler for compositions | HIGH |

**Version confidence:** MEDIUM — Remotion is actively developed, 4.x is current major version based on ecosystem patterns, but official documentation did not provide specific version numbers. Verify with `npm view remotion version` before installing.

**Why Remotion:**
- React-based (matches existing Next.js stack)
- Programmatic video generation (no manual editing needed)
- Code-as-video (version control, reusable components)
- Supports Tailwind CSS (existing styling system)
- TypeScript support (strict mode compatible)

**Integration approach:**

```
docs/
  remotion/
    compositions/
      QuickstartVideo.tsx       # Getting started tutorial
      WorkflowVideo.tsx         # End-to-end workflow demos
      ArchitectureVideo.tsx     # System architecture explainer
    Root.tsx                    # Remotion entry point
    remotion.config.ts          # Configuration
  scripts/
    render-videos.ts            # Build-time video generation
```

**Build workflow:**
1. Development: `npm run remotion` to preview compositions locally
2. Production: Generate videos during build via `scripts/render-videos.ts`
3. Output videos to `public/videos/` for static serving
4. Embed in MDX with standard `<video>` tags

**Rendering options:**

| Option | Cost | Use Case | Recommendation |
|--------|------|----------|----------------|
| Local (bun) | Free | Development | ✓ Development |
| GitHub Actions | Free (2K mins/month) | CI/CD builds | ✓ Initial production |
| @remotion/lambda | ~$1-5/hour | Fast cloud rendering | Future scaling |

**Start with GitHub Actions rendering:**
- Sufficient for small video corpus (3-5 videos initially)
- No AWS Lambda setup complexity
- Cost: $0 (within GitHub free tier)
- Videos rendered during build, committed to repo

**Alternative not recommended:**
- Loom/Vimeo: Manual recording, not code-driven, hard to update
- FFmpeg + scripts: Too low-level, no React integration
- Manim: Python-based, separate stack

---

### 3. CLI Enhancements (shadcn-quality patterns)

**Current state:** Package `shadcn` 3.7.0 already in devDependencies (likely for component installation). Need to understand existing CLI structure.

#### Analysis of Existing Packages

From `docs/package.json`:
- `shadcn` (3.7.0) — Already installed as devDependency
- Likely used for component management patterns

**Research finding:** shadcn CLI uses:
- TypeScript with `tsup` bundler
- Vitest for testing
- Interactive prompts (package not explicitly stated in README)
- No explicit diff preview library mentioned

#### Required Additions for CLI Improvements

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| @clack/prompts | ^0.7.0 | Interactive CLI prompts (modern, beautiful) | HIGH |
| picocolors | ^1.0.0 | Terminal colors (lightweight) | MEDIUM |
| diff | ^5.0.0 | Diff generation for preview | MEDIUM |
| execa | ^8.0.0 | Process execution (better than child_process) | MEDIUM |
| ora | ^8.0.0 | Loading spinners | LOW |

**Why these choices:**

**@clack/prompts (over inquirer/prompts):**
- Modern, beautiful CLI UX (used by Astro, SvelteKit)
- TypeScript-first
- Smaller bundle than inquirer
- Better keyboard navigation
- Async/await native

**picocolors (over chalk):**
- 14x smaller than chalk
- Zero dependencies
- Same API surface
- Used by Vite, PostCSS

**diff (over diff-match-patch):**
- Standard diff algorithm
- Git-style unified diff format
- Smaller, focused library

**execa (over child_process):**
- Promise-based
- Better error handling
- Cross-platform compatibility
- Used by many modern CLIs

**Alternative considered:**
- commander.js: Not needed (existing CLI likely uses simple arg parsing)
- inquirer: Larger, older, callback-based
- chalk: 14x larger than picocolors
- ora: Nice-to-have, not critical (defer to later)

#### CLI Improvement Areas

**Current gaps (based on milestone requirements):**
1. No diff preview for configuration changes
2. No interactive prompts for setup
3. Basic error messages (need user-friendly formatting)
4. No self-maintenance features (update checks, health checks)

**New structure needed:**
```
packages/
  @datagvat/mcp-installer/
    src/
      commands/
        init.ts        # Interactive setup
        update.ts      # Self-update command
        doctor.ts      # Health check
      utils/
        diff.ts        # Diff preview generation
        prompts.ts     # Reusable prompt patterns
        logger.ts      # Formatted output
    tests/
      commands/        # Command tests with vitest
```

---

### 4. Navigation Simplification (meta.json patterns)

**Current state:** 8 navigation tabs via Fumadocs meta.json configuration.

#### No New Packages Required

Navigation is configuration-only. Fumadocs (16.4.7) already supports:
- `meta.json` for page ordering and grouping
- Separators with `---[Icon]Label---` syntax
- External links with `external:[Label](URL)` syntax
- Folder groups with `(advanced)` syntax

**Current structure from `docs/content/docs/meta.json`:**
```json
{
  "pages": [
    "getting-started",
    "---[BookOpen]Documentation---",
    "(guides)",
    "---[Library]Reference---",
    "reference",
    "api-reference",
    "---[Settings]Advanced Topics---",
    "(advanced)",
    "---[Zap]Interactive---",
    "external:[Try MCP Server](/try)",
    "---[ExternalLink]Resources---",
    "external:[Official data.gv.at API](https://www.data.gv.at/katalog/api/3/)",
    "external:[GitHub Repository](https://github.com/datagvat/datagvat-mcp)"
  ]
}
```

**Target structure (8 tabs → 3):**
- Docs (consolidate getting-started + guides)
- API (consolidate reference + api-reference + advanced)
- Try (existing external link)

**Implementation:** Configuration restructuring only, no new dependencies.

---

## Installation Commands

### Core RAG Stack
```bash
bun add @upstash/vector @upstash/redis
```

### Remotion Stack
```bash
bun add remotion @remotion/cli @remotion/bundler @remotion/player @remotion/lambda
```

### CLI Enhancement Stack
```bash
bun add @clack/prompts picocolors diff execa
bun add -d ora  # Optional, defer to Phase 2
```

---

## Integration Points with Existing Stack

### 1. Next.js 16.1.3 App Router
- **RAG:** Route handler at `app/api/chat/route.ts` (already exists, add RAG retrieval)
- **Remotion:** Static video generation via build scripts, serve from `public/videos/`
- **CLI:** No integration (separate package)

### 2. Fumadocs 16.4.7
- **RAG:** Search button already exists (`components/ai/search.tsx`), repurpose for RAG-powered chat
- **Videos:** Embed in MDX with standard video tags
- **Navigation:** meta.json restructuring

### 3. Bun Runtime
- **RAG:** Embedding generation scripts run with `bun run scripts/build-embeddings.ts`
- **Remotion:** Video rendering with `bun run scripts/render-videos.ts`
- **CLI:** CLI package uses Bun for build (tsup + vitest)

### 4. Biome 2.3.11
- **All:** No special integration, lint rules apply to all new TypeScript files

### 5. TypeScript 5.9.3 Strict Mode
- **All packages:** Full TypeScript support, strict mode compatible

---

## What NOT to Add

| Technology | Why Avoid |
|------------|-----------|
| LangChain | Over-engineering — Vercel AI SDK + raw vector search is simpler |
| Vector database client libraries (Pinecone/Qdrant) | Upstash Vector is sufficient and free |
| FFmpeg bindings | Remotion handles video rendering internally |
| Commander.js | Existing CLI likely uses simple arg parsing, no need for full framework |
| Inquirer | @clack/prompts is modern replacement |
| Chalk | picocolors is 14x smaller |
| Jest | Vitest already pattern in Fumadocs ecosystem (faster, Vite-native) |
| Additional embedding providers | OpenAI text-embedding-3-small is sufficient |

---

## Cost Analysis

### RAG Pipeline

| Resource | Free Tier | After Free Tier | Estimate (v2.1) |
|----------|-----------|-----------------|-----------------|
| Upstash Vector | 10K vectors, 10K queries/day | $0.40/100K queries | $0/month (well under limits) |
| OpenAI Embeddings | None | $0.02/1M tokens | ~$0.50/month (112 docs = ~100K tokens) |
| Upstash Redis | 10K requests/day | $0.20/100K requests | $0/month (rate limiting only) |

**Total RAG cost:** ~$0.50/month initially, scales to ~$5/month at 100K queries

### Video Rendering

| Option | Cost | Duration |
|--------|------|----------|
| GitHub Actions | Free (2K mins/month) | ~5 mins/video = 15 mins for 3 videos |
| Remotion Lambda | ~$1-5/hour | ~30 seconds/video = $0.01-0.05/video |

**Total video cost:** $0/month (GitHub Actions sufficient for 3-5 videos)

### CLI Packages

| Resource | Cost |
|----------|------|
| npm packages | $0 (all open-source) |
| Distribution | $0 (npm registry free) |

**Total cost estimate for v2.1:** ~$0.50/month (embeddings only)

---

## Build/Development Workflow Implications

### Development Phase
```bash
# Terminal 1: Next.js dev server
bun run dev

# Terminal 2: Remotion studio (video preview)
bun run remotion

# Terminal 3: Embedding generation (when docs change)
bun run scripts/build-embeddings.ts
```

### Build Phase
```bash
# Standard Next.js build with additions
bun run prebuild    # Existing (now also generates embeddings)
next build          # Static site generation
bun run postbuild   # Existing (now also renders videos)
```

**Estimated build time impact:**
- Embeddings generation: +30 seconds (112 docs, API calls)
- Video rendering: +15 minutes (3 videos @ 5 mins each) — run async in CI
- Total: +30 seconds for local builds, +15 mins for full CI builds

**Optimization:**
- Cache embeddings (only regenerate on content changes)
- Render videos only on video source changes (check git diff)
- Parallel video rendering in CI (GitHub Actions matrix)

---

## Version Verification Needed

| Package | Confidence | Action |
|---------|------------|--------|
| remotion | MEDIUM | Run `npm view remotion version` to verify 4.x is current |
| @remotion/* packages | MEDIUM | Verify all @remotion packages use same version |
| @clack/prompts | HIGH | 0.7.0 confirmed in ecosystem usage |
| @upstash/vector | HIGH | 1.0.0+ confirmed in Upstash documentation |

---

## Sources

**HIGH confidence (Context7, official docs):**
- Vercel AI SDK embeddings: ai-sdk.dev documentation (WebFetch confirmed `embed()`, `embedMany()`, `cosineSimilarity()`)
- Fumadocs meta.json: Existing codebase analysis (direct file read)
- Existing package.json: Direct file read

**MEDIUM confidence (ecosystem patterns, verified):**
- Remotion versions: Ecosystem observation (official docs lacked version specifics, skill document confirmed 4.x patterns)
- shadcn CLI patterns: GitHub repository analysis (WebFetch confirmed TypeScript, tsup, vitest)
- @clack/prompts usage: Ecosystem adoption (Astro, SvelteKit)
- Upstash Vector: WebSearch indicated serverless-first approach, REST API

**LOW confidence (requires validation):**
- Remotion Lambda pricing: Estimated from typical AWS Lambda costs
- GitHub Actions rendering time: Estimated from video complexity
- Upstash pricing details: Need to verify current 2026 pricing

---

## Recommendation Summary

**Proceed with these additions for v2.1:**

1. **RAG Pipeline:** Add `@upstash/vector` + `@upstash/redis`, use existing `ai` package for embeddings
2. **Remotion:** Add full Remotion stack (verify versions with npm), render with GitHub Actions
3. **CLI:** Add `@clack/prompts`, `picocolors`, `diff`, `execa` for shadcn-quality UX
4. **Navigation:** Configuration-only, no new packages

**Total new dependencies:** 11 packages (6 Remotion, 4 CLI, 1 vector DB)

**Cost:** ~$0.50/month for RAG, $0 for video rendering (GitHub Actions free tier)

**Build time:** +30 seconds (embeddings), +15 mins (videos, async in CI)

**Risk assessment:** LOW — All packages are well-established, TypeScript-native, and align with existing Bun/Next.js/Fumadocs stack.
