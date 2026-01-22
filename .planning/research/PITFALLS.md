# Domain Pitfalls: v2.1 Feature Additions

**Domain:** Adding RAG chat, video tutorials, and CLI enhancements to existing documentation platform
**Researched:** 2026-01-22
**Context:** Subsequent milestone — enhancing live production documentation site (Fumadocs + Next.js)
**Confidence:** HIGH for integration patterns (existing codebase analysis), MEDIUM for RAG/video (training data + ecosystem knowledge), HIGH for CLI/navigation (established patterns)

## Executive Summary

This research identifies critical pitfalls when adding RAG documentation chat, programmatic video tutorials, CLI enhancements, and navigation restructuring to an existing production documentation platform. The analysis focuses on integration risks with the current Fumadocs/Next.js stack, cost and performance implications, and user-facing breaking changes.

**Highest-risk areas for v2.1:**
1. **RAG hallucinations citing non-existent docs** — can severely damage trust
2. **Navigation restructuring breaking existing links** — production site with external references
3. **Video rendering blocking CI/CD** — current build time constraint < 5 minutes
4. **CLI breaking changes for existing users** — @datagvat/mcp-installer already in production
5. **Vector DB costs spiraling** — small project budget constraints

---

## Critical Pitfalls

Mistakes that cause rewrites, production outages, or major user trust issues.

### Pitfall 1: RAG Hallucinations with Confident Citations

**What goes wrong:** LLM generates plausible but non-existent documentation pages and cites them confidently. User clicks citation link → 404 → trust destroyed.

**Why it happens:**
- Vector search returns low-similarity chunks but system proceeds anyway
- LLM fills gaps when context is insufficient
- No validation that cited pages actually exist
- Similarity threshold set too low (< 0.7 often problematic)

**Consequences:**
- Users lose trust in AI chat feature
- Support burden increases ("AI told me to do X but it doesn't exist")
- Reputation damage ("their AI just makes things up")

**Warning signs:**
- User reports "AI recommended a page that doesn't exist"
- Citation URLs in chat responses return 404s
- Low similarity scores (< 0.7) in vector search results
- Generic answers that don't reference specific docs sections

**Prevention:**
```typescript
// WRONG: Use results without similarity threshold
const results = await vectorDB.query(embedding, { limit: 5 });

// RIGHT: Filter by similarity threshold and validate URLs
const results = await vectorDB.query(embedding, { limit: 5 });
const filtered = results.filter(r => r.similarity > 0.75);

if (filtered.length === 0) {
  return {
    type: 'NO_RESULTS',
    message: "I couldn't find relevant information in the documentation."
  };
}

// Validate all cited URLs exist before returning
const validatedResults = await Promise.all(
  filtered.map(async r => {
    const pageExists = await validatePageExists(r.url);
    return pageExists ? r : null;
  })
).then(r => r.filter(Boolean));
```

**Phase implications:**
- Phase 01: Must implement similarity threshold + fallback messaging
- Phase 01: Add URL validation before citation
- Testing: Verify low-quality queries return "I don't know" not hallucinations

**Severity:** Critical

---

### Pitfall 2: Navigation Restructuring Breaks Production Links

**What goes wrong:** Consolidating 8 tabs → 3 tabs changes URLs. External sites, bookmarks, Google search results all break. Users encounter 404s, SEO rankings drop.

**Why it happens:**
- Moving content changes Fumadocs-generated URLs
- No redirect mapping created
- Restructuring happens in one phase without staged rollout
- External references unknown (can't test all inbound links)

**Current codebase risk:**
- `content/docs/meta.json` defines 8 section separators (7 navigable groups)
- Groups like `(guides)` and `(advanced)` use Next.js route groups
- URLs like `/docs/getting-started/installation` are public and indexed
- `/try` page is externally referenced

**Consequences:**
- Broken links from external sites (Medium posts, Stack Overflow, GitHub repos)
- SEO penalty from 404s
- User frustration and bounces
- Support burden from "link doesn't work"

**Warning signs:**
- 404 errors in Next.js logs after deployment
- Google Search Console shows crawl errors
- Social media shares stop working
- Users report broken bookmarks

**Prevention:**
```typescript
// Create comprehensive redirect map BEFORE restructuring
// File: docs/next.config.mjs
export default {
  async redirects() {
    return [
      // Old navigation structure → New
      { source: '/docs/tutorials/:slug*', destination: '/docs/getting-started/:slug*', permanent: true },
      { source: '/docs/guides/:slug*', destination: '/docs/:slug*', permanent: true },
      { source: '/docs/advanced/:slug*', destination: '/docs/:slug*', permanent: true },
      // Keep comprehensive list of ALL moved URLs
    ];
  }
};
```

**Additional prevention:**
- Audit all existing URLs before restructuring (fumadocs-cli can help)
- Test redirects with `curl -I` for all old URLs
- Keep redirects for minimum 6-12 months (SEO best practice)
- Add "this page moved" banner during transition

**Phase implications:**
- Phase 02: Must create full redirect map before any restructuring
- Phase 02: Audit all current URLs and external references
- Phase 02: Add redirect testing to CI/CD
- Phase 02: Deploy redirects first, restructure second

**Severity:** Critical

---

### Pitfall 3: Video Rendering Blocks CI/CD Pipeline

**What goes wrong:** Remotion renders videos during `next build`. With multiple videos, build time exceeds 5-minute constraint, CI/CD fails, deployments blocked.

**Why it happens:**
- Remotion renders are CPU-intensive (30-120 seconds per video)
- Default configuration renders all videos on every build
- Multiple videos multiply build time linearly
- No caching of unchanged videos

**Example calculation:**
- 5 video tutorials × 60 seconds each = 5 minutes rendering alone
- Plus Next.js build time (2-3 minutes) = 7-8 minutes total
- Exceeds constraint, breaks deployment

**Consequences:**
- CI/CD pipeline fails on every commit
- Deploys blocked until rendering completes
- Development velocity drops (can't iterate quickly)
- Vercel build timeouts (free tier: 15 min, can still be problematic)

**Warning signs:**
- Build time suddenly jumps after adding videos
- Vercel/CI logs show long "Compiling" phases
- Timeouts in GitHub Actions
- Local `npm run build` takes >5 minutes

**Prevention:**
```typescript
// WRONG: Render videos during Next.js build
// pages/videos/[slug].tsx - generates videos at build time

// RIGHT: Pre-render videos separately, treat as static assets
// Package.json
{
  "scripts": {
    "videos:render": "remotion render --config remotion.config.ts",
    "videos:render-if-changed": "tsx scripts/render-changed-videos.ts",
    "prebuild": "bun run videos:render-if-changed"
  }
}

// scripts/render-changed-videos.ts
import { checkVideoSourcesChanged } from './check-changes';
if (await checkVideoSourcesChanged()) {
  // Only render if video source files changed
  await renderVideos();
} else {
  console.log('Videos unchanged, skipping render');
}
```

**Additional prevention:**
- Render videos separately from documentation build
- Cache rendered video files (e.g., upload to R2/S3)
- Use Remotion Lambda for heavy rendering (not local CI)
- Implement incremental rendering (only changed videos)
- Add `SKIP_VIDEO_RENDER` environment variable for quick iterations

**Phase implications:**
- Phase 04: Must design video build architecture before implementing
- Phase 04: Set up caching/storage for rendered videos
- Phase 04: Add separate video render step outside Next.js build
- Phase 04: Test build time stays under constraint

**Severity:** Critical

---

### Pitfall 4: CLI Breaking Changes for Existing Users

**What goes wrong:** Improving CLI changes command signatures or behavior. Existing users' scripts and workflows break without warning.

**Why it happens:**
- No semantic versioning strategy
- CLI flags renamed or removed
- Output format changes (breaking parsers)
- Interactive prompts added where automation expected

**Current codebase risk:**
- `@datagvat/mcp-installer` already published and in use
- Users have scripts depending on current CLI behavior
- No version checking or migration path implemented

**Consequences:**
- User automation breaks (CI/CD scripts fail)
- Support burden from "it stopped working"
- Negative reputation ("breaking changes without notice")
- Users hesitant to update

**Warning signs:**
- Issue reports "CLI doesn't work after update"
- Users pin to old versions in package.json
- Scripts fail with new CLI version
- Different behavior in CI vs local (version mismatch)

**Prevention:**
```typescript
// WRONG: Change command signature without versioning
// Before: cli install <package>
// After:  cli add <package>  // Breaking change!

// RIGHT: Maintain backward compatibility with deprecation warnings
if (command === 'install') {
  console.warn('⚠️  `install` is deprecated, use `add` instead');
  command = 'add';  // Redirect to new command
}

// Semantic versioning: Major bump for breaking changes
// 1.2.3 → 2.0.0 when changing signatures

// Add --version flag and check in users' scripts
if (cliVersion < requiredVersion) {
  throw new Error(`CLI v${requiredVersion}+ required, found v${cliVersion}`);
}
```

**Additional prevention:**
- Follow semantic versioning strictly (major.minor.patch)
- Maintain deprecated commands for 1-2 major versions
- Add changelog with migration guides
- Test CLI in non-interactive mode (CI simulation)
- Never change output format in minor versions
- Add `--json` flag for stable machine-readable output

**Phase implications:**
- Phase 05: Audit all proposed CLI changes for backward compatibility
- Phase 05: Add deprecation warnings before removing features
- Phase 05: Implement version checking and migration prompts
- Phase 05: Test existing user scripts still work

**Severity:** Critical

---

### Pitfall 5: Vector DB Costs Spiral Out of Control

**What goes wrong:** Every page load queries vector DB. With growing traffic, costs escalate from $5/month → $500/month. Small project budget exhausted.

**Why it happens:**
- No query caching implemented
- Embedding generation for every user query (expensive)
- High-dimensional embeddings (1536+ dims) increase storage costs
- No rate limiting on chat feature

**Example calculation:**
```
Traffic: 1000 users/day × 3 queries each = 3000 queries/day
Embedding cost: $0.0001/1K tokens × 50 tokens avg = $0.005/query
Vector DB: $0.0004/1K queries (Pinecone pricing)
Monthly: 3000 × 30 = 90K queries
Cost: 90K × ($0.005 + $0.0004) = $486/month

With caching (80% hit rate):
Actual queries: 90K × 0.2 = 18K
Cost: $97/month (5x cheaper)
```

**Consequences:**
- Unexpected bills kill project budget
- Must disable feature to control costs
- Poor performance without optimizations
- Small project can't sustain feature

**Warning signs:**
- Vector DB usage metrics climbing rapidly
- Monthly bills increasing unexpectedly
- Every query hits embedding API (check logs)
- No cache hit metrics

**Prevention:**
```typescript
// WRONG: Query vector DB on every request
async function searchDocs(query: string) {
  const embedding = await generateEmbedding(query);
  return vectorDB.query(embedding);
}

// RIGHT: Multi-layer caching strategy
import { LRUCache } from 'lru-cache';

const queryCache = new LRUCache({
  max: 1000,  // Cache 1000 recent queries
  ttl: 1000 * 60 * 60,  // 1 hour TTL
});

const embeddingCache = new LRUCache({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24,  // 24 hour TTL
});

async function searchDocs(query: string) {
  const normalizedQuery = query.toLowerCase().trim();

  // Check query cache first (full result)
  const cached = queryCache.get(normalizedQuery);
  if (cached) return cached;

  // Check embedding cache
  let embedding = embeddingCache.get(normalizedQuery);
  if (!embedding) {
    embedding = await generateEmbedding(query);
    embeddingCache.set(normalizedQuery, embedding);
  }

  const result = await vectorDB.query(embedding);
  queryCache.set(normalizedQuery, result);
  return result;
}
```

**Additional prevention:**
- Use lower-dimensional embeddings if accuracy permits (768 vs 1536 dims)
- Implement query deduplication (many users ask same questions)
- Add rate limiting per user (5 queries/minute)
- Consider free-tier vector DBs (Weaviate Cloud, Qdrant Cloud)
- Pre-compute embeddings for common queries
- Monitor costs with alerts (e.g., >$50/month warning)

**Phase implications:**
- Phase 01: Must implement caching before RAG launch
- Phase 01: Set up cost monitoring and alerts
- Phase 01: Add rate limiting to chat endpoint
- Phase 01: Budget review and cost projections

**Severity:** Critical

---

## High-Severity Pitfalls

Mistakes that cause significant issues but are recoverable.

### Pitfall 6: Duplicate Title Rendering (Frontmatter + H1)

**What goes wrong:** Page shows title twice: once from Fumadocs layout (frontmatter), once from MDX H1. Looks unprofessional, hurts SEO (duplicate H1).

**Why it happens:**
- Fumadocs DocsPage component renders `page.data.title` from frontmatter (line 72 in page.tsx)
- MDX content includes `# Title` heading
- Both render without deduplication

**Current codebase issue:**
```tsx
// docs/app/[lang]/docs/[[...slug]]/page.tsx:72
<h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
{/* Then MDX body also contains # Title */}
<Mdx components={...} />
```

**Consequences:**
- Unprofessional appearance
- SEO penalty (multiple H1 tags)
- Inconsistent spacing
- User confusion

**Warning signs:**
- Visual inspection shows double titles
- Lighthouse SEO audit flags multiple H1s
- Users report "title appears twice"

**Prevention:**
```tsx
// Option 1: Remove H1 from Fumadocs layout, rely on MDX
// (May break pages without H1 in content)

// Option 2: Strip H1 from MDX content during rendering
import { visit } from 'unist-util-visit';

function stripFirstH1() {
  return (tree) => {
    let found = false;
    visit(tree, 'heading', (node, index, parent) => {
      if (!found && node.depth === 1) {
        parent.children.splice(index, 1);
        found = true;
        return [visit.SKIP, index];
      }
    });
  };
}

// Add to MDX compilation pipeline
// fumadocs.config.ts or rehype plugins

// Option 3: Convention to not include H1 in MDX
// (Requires linting all content files)
```

**Phase implications:**
- Phase 02: Choose deduplication strategy
- Phase 02: Implement remark/rehype plugin or layout change
- Phase 02: Audit all MDX files for H1 presence
- Phase 02: Add linting rule to prevent future duplicates

**Severity:** High (visible quality issue, SEO impact)

---

### Pitfall 7: RAG Returns Off-Topic Answers

**What goes wrong:** User asks about Austria MCP features, RAG answers with generic Next.js or Fumadocs advice pulled from dependencies' documentation.

**Why it happens:**
- Vector DB indexed node_modules documentation
- Similarity search doesn't filter by source
- Generic documentation has high similarity to query
- No domain scoping in retrieval

**Consequences:**
- Unhelpful answers frustrate users
- Users distrust AI chat feature
- Support burden increases

**Warning signs:**
- Answers mention framework internals not project features
- Citations point to dependency docs not project docs
- Users say "answer is generic, doesn't address my question"

**Prevention:**
```typescript
// WRONG: Index everything, no filtering
await vectorDB.index(allMarkdownFiles);

// RIGHT: Index only project documentation, filter retrieval
const PROJECT_DOCS_PREFIX = '/docs/';

// During indexing
for (const file of markdownFiles) {
  if (file.path.startsWith('content/docs/')) {
    await vectorDB.index({
      content: file.content,
      metadata: {
        source: 'project',
        url: file.url,
      }
    });
  }
}

// During retrieval
const results = await vectorDB.query(embedding, {
  filter: { source: 'project' },
  limit: 5
});

// In system prompt
const systemPrompt = `You are a documentation assistant for Austria MCP Server.
ONLY answer questions using the provided documentation context.
If the context doesn't contain relevant information, say so.
DO NOT provide generic advice about Next.js, Fumadocs, or other frameworks.`;
```

**Phase implications:**
- Phase 01: Implement source filtering in vector DB schema
- Phase 01: Add domain-specific system prompt
- Phase 01: Test with off-topic queries to verify rejection

**Severity:** High (quality and trust issue)

---

### Pitfall 8: Video Tutorials Become Outdated Quickly

**What goes wrong:** Videos show old UI, deprecated commands, or incorrect workflows. Documentation text is updated but videos lag behind.

**Why it happens:**
- Videos are expensive to re-render (time/effort)
- No automated detection of outdated content
- Text documentation updates don't trigger video updates
- No versioning strategy for videos

**Consequences:**
- User confusion (video contradicts text)
- Support burden ("I followed video, didn't work")
- Poor onboarding experience
- Wasted effort maintaining stale content

**Warning signs:**
- Users report "video shows different interface"
- Video demonstrates deprecated commands
- Comments like "this doesn't work anymore"
- Video view count drops (users prefer text)

**Prevention:**
```typescript
// Strategy 1: Videos show concepts, not exact UI
// Focus on concepts/architecture (slower to change)
// Avoid screen recordings of UI (fast-changing)

// Strategy 2: Programmatic videos with version checking
// remotion/QuickstartVideo.tsx
import { VIDEO_VERSION } from './version';
import { CLI_VERSION } from '../../../packages/mcp-installer/package.json';

export const QuickstartVideo = () => {
  // If CLI version changed, video needs re-render
  // This forces awareness of version mismatches
};

// Strategy 3: Banner for outdated videos
// components/video-player.tsx
const videoDate = metadata.recordedDate;
const daysSinceRecorded = daysSince(videoDate);

if (daysSinceRecorded > 90) {
  return (
    <Banner type="warning">
      This video was recorded {daysSinceRecorded} days ago.
      Some details may have changed. Check the text documentation for latest information.
    </Banner>
  );
}

// Strategy 4: Version videos explicitly
// - "Quickstart (v2.0)" clearly dated
// - Maintain multiple versions or redirect to latest
```

**Additional prevention:**
- Limit video scope (focus on stable features)
- Add video versioning to frontmatter
- Implement "last verified" date in video metadata
- Periodically audit videos vs current state (quarterly)
- Consider linking to video timestamps with notes

**Phase implications:**
- Phase 04: Define video versioning strategy
- Phase 04: Add "last verified" metadata to videos
- Phase 04: Implement outdated video warnings
- Phase 04: Document video maintenance process

**Severity:** High (impacts onboarding and trust)

---

### Pitfall 9: RAG Chunking Loses Context

**What goes wrong:** Documentation split into chunks loses critical context. Vector search returns chunk about "installation" but missing prerequisite "requires Node.js 18+". User follows incomplete instructions, fails.

**Why it happens:**
- Chunking by fixed character count (e.g., 1000 chars) splits mid-section
- No semantic boundary detection
- No overlap between chunks
- Cross-references lost

**Example:**
```markdown
# Installation

Prerequisites:
- Node.js 18+
- Python 3.11+

... 800 characters ...

## Install with npx

Run the following command:
[CHUNK BOUNDARY]
```

User gets "Install with npx" chunk without prerequisites → failure.

**Consequences:**
- Incomplete/incorrect answers
- Users miss critical requirements
- Support burden from "followed docs, didn't work"

**Warning signs:**
- Answers missing prerequisites or context
- Users report instructions incomplete
- High similarity but low user satisfaction
- Many follow-up questions for clarification

**Prevention:**
```typescript
// WRONG: Fixed character chunking
function chunk(text: string): string[] {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// RIGHT: Semantic chunking with overlap
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,  // 20% overlap captures context
  separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],  // Semantic boundaries
});

// Even better: Section-aware chunking
function chunkBySection(mdxContent: string) {
  const sections = parseSections(mdxContent);  // Parse by H2/H3
  return sections.map(section => ({
    content: section.content,
    metadata: {
      title: section.title,
      parent: section.parent,  // H2 context for H3 sections
      url: section.url,
    }
  }));
}
```

**Additional prevention:**
- Include section titles in chunk metadata
- Add parent section context to chunks
- Test retrieval with partial queries (do they get full context?)
- Prefer larger chunks if quality improves (test 1000 vs 1500 vs 2000)

**Phase implications:**
- Phase 01: Research optimal chunking strategy before indexing
- Phase 01: Implement semantic splitter with overlap
- Phase 01: Test retrieval quality with various chunk sizes
- Phase 01: Add metadata for context preservation

**Severity:** High (quality of answers suffers)

---

### Pitfall 10: Video File Sizes Too Large

**What goes wrong:** 10MB+ video files slow page loads, hurt mobile users, increase hosting costs.

**Why it happens:**
- High resolution rendering (1080p default)
- Uncompressed or poorly compressed output
- Long videos (>5 minutes) without splitting
- No adaptive bitrate streaming

**Consequences:**
- Slow page loads (especially mobile)
- High bandwidth costs
- Poor UX for slow connections
- Hosting storage costs

**Warning signs:**
- Video files >5MB each
- Page load times spike with videos
- Mobile users report slow loading
- High CDN bandwidth bills

**Prevention:**
```typescript
// Remotion config: remotion.config.ts
export default {
  codec: 'h264',
  videoBitrate: '2M',  // Not default 5M+
  audioBitrate: '128k',
  pixelFormat: 'yuv420p',
  // Optimize for web
  outputOptions: [
    '-movflags', '+faststart',  // Enable progressive streaming
  ],
};

// Or use WebM (better compression)
export default {
  codec: 'vp9',
  videoBitrate: '1M',  // Better compression than h264
};

// Resolution: 720p sufficient for docs, not 1080p
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

// Split long videos into chapters
// "Quickstart Part 1: Installation" (2 min)
// "Quickstart Part 2: Configuration" (2 min)
// Better than single 5-minute video
```

**Additional prevention:**
- Serve videos from CDN with compression (Cloudflare R2 + Transform)
- Add lazy loading for videos (only load when scrolled into view)
- Provide fallback: thumbnail links to external hosting (YouTube) if file size an issue
- Monitor video file sizes in CI (fail if >3MB)

**Phase implications:**
- Phase 04: Define video resolution/bitrate standards
- Phase 04: Set file size limits and monitoring
- Phase 04: Optimize encoding settings for web delivery
- Phase 04: Consider external hosting for large videos

**Severity:** High (UX and costs)

---

### Pitfall 11: RAG Slow Response Times Kill UX

**What goes wrong:** User sends query, waits 5-10 seconds for response. Streaming chat appears frozen. User closes window thinking it's broken.

**Why it happens:**
- No streaming implementation (waits for full response)
- Vector search + LLM call done serially (no parallelization)
- Cold starts in serverless functions
- No loading indicators

**Consequences:**
- Poor user experience
- Users abandon feature
- Appears broken/unresponsive
- Low adoption

**Warning signs:**
- Time to first token >3 seconds
- Users report "chat is slow/broken"
- No visual feedback during processing
- High abandonment rate (analytics)

**Prevention:**
```typescript
// WRONG: Serial processing, no streaming
async function handleChat(query: string) {
  const embedding = await generateEmbedding(query);  // 500ms
  const context = await vectorDB.query(embedding);    // 1000ms
  const response = await llm.complete(prompt);        // 3000ms
  return response;  // Total: 4.5s before user sees anything
}

// RIGHT: Parallel + streaming + immediate feedback
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const query = messages[messages.length - 1].content;

  // Immediately return stream
  const result = streamText({
    model: openai('gpt-4'),
    system: 'You are a documentation assistant...',
    messages,
    async onStart() {
      // Parallel processing while streaming starts
      const [embedding] = await Promise.all([
        generateEmbedding(query),
        // Could pre-warm other resources
      ]);

      const context = await vectorDB.query(embedding);
      // Inject context into prompt
    },
  });

  return result.toDataStreamResponse();
}

// Frontend: Show immediate feedback
function ChatInterface() {
  const { messages, input, handleSubmit, isLoading } = useChat();

  return (
    <>
      {isLoading && <LoadingIndicator>Searching documentation...</LoadingIndicator>}
      {/* Streaming responses appear immediately */}
    </>
  );
}
```

**Additional prevention:**
- Target <1s time to first token
- Use SSE/streaming for all responses
- Show progress: "Searching docs..." → "Generating answer..."
- Pre-warm serverless functions (periodic pings)
- Consider edge functions for lower latency

**Phase implications:**
- Phase 01: Implement streaming from day 1
- Phase 01: Add loading states and progress indicators
- Phase 01: Measure and optimize time to first token
- Phase 01: Test on slow connections (throttled network)

**Severity:** High (critical UX issue)

---

### Pitfall 12: CLI Interactive Prompts Break Automation

**What goes wrong:** Added interactive prompts for better UX. User CI/CD scripts now hang waiting for input that never comes.

**Why it happens:**
- No detection of non-interactive environments (CI/CD)
- Interactive prompts added without `--yes` flag
- Assuming terminal is always available

**Consequences:**
- CI/CD pipelines hang or timeout
- Automated scripts break
- Users forced to pin old versions

**Warning signs:**
- CI logs show "waiting for input" indefinitely
- GitHub Actions timeout
- Users request `--non-interactive` flag
- Scripts work locally, fail in CI

**Prevention:**
```typescript
// WRONG: Always prompt interactively
const confirm = await prompts({
  type: 'confirm',
  name: 'value',
  message: 'Install dependencies?',
});

// RIGHT: Detect environment and respect flags
import { isCI } from 'ci-info';
import { program } from 'commander';

program
  .option('-y, --yes', 'Skip interactive prompts')
  .option('--non-interactive', 'Run in non-interactive mode');

const isInteractive = !isCI && !program.opts().yes && !program.opts().nonInteractive;

if (isInteractive) {
  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Install dependencies?',
  });
} else {
  // Use sensible defaults
  console.log('Running in non-interactive mode, using defaults');
}

// Provide environment variable option too
if (process.env.CI || process.env.NON_INTERACTIVE) {
  // Skip prompts
}
```

**Phase implications:**
- Phase 05: Audit all new prompts for CI compatibility
- Phase 05: Add `--yes` / `--non-interactive` flags
- Phase 05: Test in actual CI environment (GitHub Actions)
- Phase 05: Document non-interactive usage

**Severity:** High (breaks automation)

---

## Medium-Severity Pitfalls

Issues that cause friction but are manageable.

### Pitfall 13: Poor RAG Source Attribution

**What goes wrong:** RAG provides answer but doesn't cite sources. User can't verify information or dive deeper. Trust issues emerge.

**Why it happens:**
- LLM system prompt doesn't enforce citations
- Metadata not passed to LLM context
- No UI for displaying sources
- Citations in wrong format (not clickable links)

**Consequences:**
- Users can't verify answers
- Can't explore topics further
- Trust issues ("where did this come from?")
- Missed opportunity to drive docs engagement

**Prevention:**
```typescript
// System prompt must enforce citations
const systemPrompt = `You are a documentation assistant for Austria MCP Server.

CRITICAL: You MUST cite your sources using the [Source: <URL>] format at the end of each claim.

Example:
"The MCP server requires Node.js 18 or later [Source: /docs/getting-started/installation].
You can install it using npm or npx [Source: /docs/getting-started/installation#installation-methods]."

If you cannot find relevant information in the provided context, say "I don't have information about this in the documentation."
`;

// Pass source URLs in context
const contextWithSources = results.map(r =>
  `Content: ${r.content}\nSource: ${r.metadata.url}`
).join('\n\n');

// Parse citations from response
function parseCitations(text: string): { text: string; citations: string[] } {
  const citationRegex = /\[Source: ([^\]]+)\]/g;
  const citations = [...text.matchAll(citationRegex)].map(m => m[1]);
  return { text, citations };
}

// Display in UI
function ChatMessage({ content }: { content: string }) {
  const { text, citations } = parseCitations(content);

  return (
    <div>
      <Markdown>{text}</Markdown>
      {citations.length > 0 && (
        <div className="mt-4 border-t pt-2">
          <p className="text-sm text-muted-foreground">Sources:</p>
          <ul>
            {citations.map(url => (
              <li key={url}>
                <Link href={url}>{url}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Phase implications:**
- Phase 01: Enforce citation format in system prompt
- Phase 01: Build citation parsing and display UI
- Phase 01: Test that all answers include sources

**Severity:** Medium (quality/trust issue, not critical failure)

---

### Pitfall 14: Videos Lack Accessibility

**What goes wrong:** Videos don't have captions, transcripts, or keyboard navigation. Excludes deaf/hard-of-hearing users, hurts SEO, violates accessibility standards.

**Why it happens:**
- Captions not generated during render
- No transcript provided alongside video
- Keyboard controls not implemented
- Accessibility often afterthought

**Consequences:**
- Excludes significant user population
- SEO penalty (no searchable text)
- Potential legal issues (WCAG compliance)
- Poor discoverability (can't search video content)

**Prevention:**
```typescript
// Generate captions during video creation
// remotion/QuickstartVideo.tsx with captions
import { Captions } from './components/Captions';

export const QuickstartVideo = () => {
  return (
    <>
      <VideoContent />
      <Captions>
        <Caption start={0} end={5}>Welcome to Austria MCP Server</Caption>
        <Caption start={5} end={10}>In this tutorial, we'll install...</Caption>
      </Captions>
    </>
  );
};

// Generate WebVTT captions file
// scripts/generate-captions.ts
export function generateVTT(captions: Caption[]) {
  return `WEBVTT

  ${captions.map(c => `
  ${formatTimestamp(c.start)} --> ${formatTimestamp(c.end)}
  ${c.text}
  `).join('\n')}`;
}

// Include transcript in page
<article>
  <VideoPlayer src="/videos/quickstart.mp4" captions="/videos/quickstart.vtt" />

  <details className="mt-4">
    <summary>Video Transcript</summary>
    <Transcript>{transcript}</Transcript>
  </details>
</article>
```

**Additional prevention:**
- Auto-generate captions from script/narration
- Provide keyboard controls (spacebar = play/pause)
- Add audio descriptions for visual-only elements
- Test with screen readers
- Include searchable transcript text

**Phase implications:**
- Phase 04: Generate captions for all videos
- Phase 04: Provide downloadable transcripts
- Phase 04: Test accessibility with screen readers
- Phase 04: Add WCAG compliance checklist

**Severity:** Medium (accessibility and SEO, legal risk)

---

### Pitfall 15: Repository Cleanup Breaks Dependencies

**What goes wrong:** Deleting "unused" files that are actually imported somewhere. Build breaks after cleanup.

**Why it happens:**
- Dynamic imports hard to detect statically
- Files used in CI/CD scripts not obvious
- MDX components imported via registry
- Type definitions referenced indirectly

**Current codebase risk:**
- `docs/components/registry.ts` dynamically loads components
- Scripts in `docs/scripts/*.ts` may reference files
- `.source` directory has generated files

**Consequences:**
- Build breaks after cleanup
- Production deployment fails
- Features silently broken
- Time wasted debugging

**Warning signs:**
- Build errors after "cleanup" commit
- Missing imports
- Dynamic imports fail at runtime
- Type errors in CI

**Prevention:**
```bash
# WRONG: Delete files based on assumption
rm -rf docs/unused/

# RIGHT: Analyze before deleting
# 1. Check for imports
bun run scripts/find-unused-files.ts

# scripts/find-unused-files.ts
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const sourceFiles = project.getSourceFiles();

// Find all imports
const importedPaths = new Set();
sourceFiles.forEach(file => {
  file.getImportDeclarations().forEach(imp => {
    importedPaths.add(imp.getModuleSpecifierValue());
  });
});

// Find files not imported
const allFiles = glob.sync('**/*.{ts,tsx,js,jsx}');
const unused = allFiles.filter(f => !importedPaths.has(f));

console.log('Potentially unused files:', unused);
// Manual review before deletion!

# 2. Test build after cleanup
bun run build && bun run validate
```

**Additional prevention:**
- Commit cleanup incrementally (file by file or small batches)
- Run full build + validation after each cleanup
- Use `git grep` to find references before deleting
- Keep deleted files in git history (revert if needed)
- Test deployed site after cleanup

**Phase implications:**
- Phase 07: Use static analysis before deletions
- Phase 07: Delete incrementally with testing between
- Phase 07: Build must pass before cleanup commits
- Phase 07: Deploy to preview environment first

**Severity:** Medium (breaks build, but recoverable via git)

---

### Pitfall 16: Fumadocs Tab State Leaks Between Pages

**What goes wrong:** User selects "Advanced" tab on page A, navigates to page B, "Advanced" tab is pre-selected but page B has different tabs. Content mismatch or error.

**Why it happens:**
- Fumadocs uses persistent tab state (localStorage)
- Tab IDs not namespaced by page
- Tabs component shares global state

**Current codebase risk:**
- Uses `<Tabs>` throughout docs
- Progressive disclosure pattern depends on tab state
- State shared across navigation

**Consequences:**
- Wrong tab selected on page load
- User confusion
- Content mismatch (showing wrong variant)

**Warning signs:**
- Users report "page shows wrong content"
- Tab selection doesn't match page default
- Tabs component errors in console

**Prevention:**
```tsx
// Namespace tab IDs by page
<Tabs defaultValue="basic" id={`${page.url}-example`}>
  <Tab value="basic">Basic</Tab>
  <Tab value="advanced">Advanced</Tab>
</Tabs>

// Or use page-scoped state
const [selectedTab, setSelectedTab] = useState('basic');
// Resets on page navigation (not persisted)

// Or clear tab state on navigation
useEffect(() => {
  // Clear any persistent tab state for new page
  return () => {
    localStorage.removeItem('fumadocs-tabs');
  };
}, [pathname]);
```

**Phase implications:**
- Phase 02: Audit tab ID namespacing
- Phase 02: Test tab state across navigation
- Phase 02: Fix any global state leaks

**Severity:** Medium (UX issue, not critical)

---

### Pitfall 17: RAG Context Window Exceeded

**What goes wrong:** Too many/large chunks retrieved, exceed LLM context window (e.g., 128K tokens). API call fails, user sees error.

**Why it happens:**
- Retrieving top 10-20 chunks without size checking
- Large documentation chunks
- System prompt + context + conversation exceeds limit

**Example calculation:**
```
System prompt: 500 tokens
Conversation history (10 messages): 2000 tokens
Retrieved context (10 chunks × 1000 tokens): 10,000 tokens
Total: 12,500 tokens (fits in GPT-4)

But:
Long conversation: 5000 tokens
Retrieved context (20 chunks × 1500 tokens): 30,000 tokens
Total: 35,500 tokens (exceeds some models)
```

**Consequences:**
- API errors ("context too long")
- Truncated responses
- Poor UX (chat stops working)

**Prevention:**
```typescript
const MAX_CONTEXT_TOKENS = 100000;  // Safety margin below model limit
const SYSTEM_PROMPT_TOKENS = 500;
const MAX_MESSAGE_HISTORY_TOKENS = 10000;

// Calculate token budget
const availableTokens = MAX_CONTEXT_TOKENS
  - SYSTEM_PROMPT_TOKENS
  - estimateTokens(messages);

// Retrieve and truncate context to fit
let context = await vectorDB.query(embedding, { limit: 20 });
let contextText = context.map(c => c.content).join('\n\n');
let contextTokens = estimateTokens(contextText);

while (contextTokens > availableTokens && context.length > 1) {
  context.pop();  // Remove lowest-similarity chunk
  contextText = context.map(c => c.content).join('\n\n');
  contextTokens = estimateTokens(contextText);
}

// Or intelligent summarization
if (contextTokens > availableTokens) {
  contextText = await summarizeContext(contextText, availableTokens);
}
```

**Phase implications:**
- Phase 01: Implement context window management
- Phase 01: Add token counting and truncation
- Phase 01: Test with long conversations
- Phase 01: Handle truncation gracefully (no errors)

**Severity:** Medium (causes errors but rare)

---

### Pitfall 18: Video Rendering Differences Local vs CI

**What goes wrong:** Videos render correctly locally but fail or look different in CI. Fonts missing, timing off, rendering artifacts.

**Why it happens:**
- Font dependencies not installed in CI
- Different Chrome/Puppeteer versions
- Timing-dependent animations
- Missing system libraries

**Consequences:**
- CI builds fail unpredictably
- Videos look different than expected
- Debugging difficult (can't reproduce locally)

**Prevention:**
```yaml
# .github/workflows/render-videos.yml
- name: Install system dependencies
  run: |
    # Fonts for consistent rendering
    apt-get install -y fonts-liberation fonts-noto-color-emoji
    # Chrome/Puppeteer dependencies
    apt-get install -y chromium-browser

- name: Use exact Node/Bun version
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'  # Match local version exactly

- name: Render videos
  env:
    # Ensure consistent rendering
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'false'
    CI: 'true'
  run: bun run videos:render
```

**Additional prevention:**
- Lock dependency versions (package-lock.json)
- Use Docker for consistent environment
- Avoid timing-dependent animations (use frame-based)
- Test videos in CI before merging
- Document all system dependencies

**Phase implications:**
- Phase 04: Set up video rendering in CI early
- Phase 04: Match local and CI environments exactly
- Phase 04: Test rendering consistency
- Phase 04: Document all dependencies

**Severity:** Medium (affects CI reliability)

---

### Pitfall 19: CLI Error Messages Don't Help Users Fix Issues

**What goes wrong:** CLI fails with cryptic error like "Error: ENOENT" without context. User doesn't know what to do.

**Why it happens:**
- Catching errors without contextualizing
- Technical error messages shown to users
- No actionable suggestions
- Missing error recovery guidance

**Consequences:**
- User frustration
- Support burden
- Users give up
- Poor CLI reputation

**Prevention:**
```typescript
// WRONG: Technical error bubbled up
try {
  await installPackage(name);
} catch (error) {
  console.error(error);  // "Error: ENOENT: no such file or directory"
  process.exit(1);
}

// RIGHT: Contextual, actionable errors
try {
  await installPackage(name);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`
❌ Could not find package.json in current directory.

Make sure you're running this command in your project root.

Current directory: ${process.cwd()}

Run this instead:
  cd /path/to/your/project
  npx @datagvat/mcp-installer add ${name}
    `);
  } else if (error.code === 'EACCES') {
    console.error(`
❌ Permission denied writing to node_modules.

Try running with sudo (not recommended) or fix permissions:
  sudo chown -R $(whoami) node_modules
    `);
  } else {
    console.error(`
❌ Failed to install ${name}

Error: ${error.message}

Need help? Open an issue:
  https://github.com/datagvat/datagvat-mcp/issues
    `);
  }
  process.exit(1);
}
```

**Phase implications:**
- Phase 05: Audit all error messages
- Phase 05: Add context and suggestions
- Phase 05: Test error paths (simulate failures)
- Phase 05: User test CLI error UX

**Severity:** Medium (UX issue)

---

### Pitfall 20: Deep Navigation Nesting Makes Content Hard to Find

**What goes wrong:** Consolidating 8 tabs → 3 tabs moves content deeper. `/docs/guides/examples/workflows` becomes 4 levels deep. Users can't find pages.

**Why it happens:**
- Flattening tabs without flattening structure
- Nested groups preserved
- More clicks to reach content
- Hidden under collapsed sections

**Current structure risk:**
```
OLD (8 tabs):
- Getting Started
- Documentation (3 subsections)
- Reference
- API Reference
- Advanced Topics
- Try
- Resources

Consolidating to 3 tabs might create:
- Docs (collapsed: getting-started, guides, examples, workflows, best-practices, etc.)
- API (reference, api-reference)
- Try

Now "workflows" is: Docs > Guides > Examples > Workflows (4 clicks)
```

**Consequences:**
- Users can't find content
- Search becomes only discovery method
- Popular pages lose visibility
- Frustration and bounces

**Prevention:**
```json
// WRONG: Deep nesting after consolidation
{
  "pages": [
    "docs",  // Contains everything
  ]
}

// RIGHT: Flatten hierarchy, use separators
{
  "pages": [
    "getting-started",
    "---Core Guides---",
    "searching",
    "data-preview",
    "quality-metrics",
    "---Workflows---",
    "discovery-workflow",
    "quality-workflow",
    "---Reference---",
    "tools",
    "api"
  ]
}

// Or promote important pages to top level
{
  "pages": [
    "quickstart",  // Most important - top level
    "workflows",   // Frequently accessed - top level
    "---Guides---",
    "guides",
    "---Reference---",
    "reference"
  ]
}
```

**Additional prevention:**
- Audit user analytics (most visited pages)
- Promote high-traffic pages to top level
- Use "popular pages" section
- Add breadcrumbs for deep pages
- Improve search discoverability

**Phase implications:**
- Phase 02: Analyze current page traffic before restructuring
- Phase 02: Promote important content to top level
- Phase 02: Test navigation with fresh users
- Phase 02: Measure "time to find page" before/after

**Severity:** Medium (discoverability issue)

---

## Phase Mapping Summary

| Phase | Critical Pitfalls | High-Severity Pitfalls | Medium-Severity Pitfalls |
|-------|-------------------|------------------------|--------------------------|
| **Phase 01: RAG Chat** | #1 Hallucinations, #5 Vector DB costs | #7 Off-topic answers, #9 Chunking context loss, #11 Slow responses | #13 Source attribution, #17 Context window |
| **Phase 02: Navigation** | #2 Broken links | #6 Duplicate titles | #16 Tab state leaks, #20 Deep nesting |
| **Phase 04: Videos** | #3 Rendering blocks CI/CD | #8 Videos outdated, #10 File sizes | #14 Accessibility, #18 CI rendering differences |
| **Phase 05: CLI** | #4 Breaking changes | #12 Interactive prompts break automation | #19 Poor error messages |
| **Phase 07: Cleanup** | None | None | #15 Breaking dependencies |

## Confidence Assessment

| Area | Confidence | Justification |
|------|------------|---------------|
| RAG Integration | MEDIUM | Based on training data (embeddings, LLM patterns) + existing Vercel AI SDK in codebase. Specific pitfalls from general RAG knowledge, not Austria MCP specific testing. |
| Video Generation | MEDIUM | Based on training data (Remotion, video optimization) + build performance patterns. Haven't tested Remotion with this specific stack. |
| CLI Patterns | HIGH | Strong existing patterns (shadcn CLI style), semantic versioning best practices, automation concerns well-documented. Current @datagvat/mcp-installer in codebase analyzed. |
| Navigation/Fumadocs | HIGH | Existing codebase analysis (meta.json structure, Fumadocs version in use). Specific to this project's setup. |
| Next.js Integration | HIGH | Current build pipeline analyzed, package.json dependencies verified, existing constraints understood. |
| Repository Cleanup | HIGH | Standard patterns, existing codebase structure analyzed, dependency analysis tools known. |

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis (`docs/package.json`, `docs/app/[lang]/docs/[[...slug]]/page.tsx`, `docs/content/docs/meta.json`)
- Current navigation structure and build configuration
- Fumadocs patterns from installed version (v16.4.7)
- Vercel AI SDK v6.0.41 patterns from package.json

### Secondary (MEDIUM confidence - training data)
- RAG best practices (chunking, embeddings, retrieval)
- Remotion rendering patterns and optimization
- CLI design patterns (semantic versioning, non-interactive mode)
- Vector database cost optimization strategies

### Tertiary (LOW confidence - needs validation)
- Specific vector DB pricing (varies by provider)
- Exact token limits for latest models (check docs)
- Fumadocs tab state persistence behavior (version-dependent)

## Metadata

**Research date:** 2026-01-22
**Target milestone:** v2.1 Documentation Excellence & AI Features
**Valid until:** 2026-02-22 (30 days - technologies evolving)
**Recommended updates:** After Vercel AI SDK major version, Fumadocs updates, or Remotion breaking changes

---

## Quick Reference: Top 5 Must-Address Pitfalls

1. **RAG Hallucinations (#1)** - Implement similarity threshold >0.75, validate citations, fallback messaging
2. **Broken Links (#2)** - Create comprehensive redirect map before navigation restructuring
3. **Video CI/CD (#3)** - Separate video rendering from Next.js build, implement caching
4. **CLI Breaking Changes (#4)** - Semantic versioning, backward compatibility, deprecation warnings
5. **Vector DB Costs (#5)** - Multi-layer caching, rate limiting, cost monitoring
