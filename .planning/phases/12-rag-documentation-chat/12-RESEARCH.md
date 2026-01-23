# Phase 12: RAG Documentation Chat - Research

**Researched:** 2026-01-23
**Domain:** RAG (Retrieval Augmented Generation) for documentation Q&A
**Confidence:** MEDIUM

## Summary

RAG documentation chat enables natural language Q&A over 44 MDX documentation files with streaming responses and source citations. The standard approach uses Vercel AI SDK (already installed at v6.0.48) for embeddings and streaming, OpenAI text-embedding-3-small for cost-effective embeddings ($0.02/1M tokens), and a local vector database (Vectra) for zero-infrastructure development with optional upgrade path to Upstash Vector for production.

**Architecture:** Build-time indexing (MDX → chunks → embeddings → vector DB) + runtime retrieval (query → embed → search → generate with citations). Chunking strategy: section-based splitting (by H2/H3 headings) with 800-1200 token chunks, 100-token overlap. Similarity threshold: 0.75 baseline (cosine similarity) for reliable citations without hallucinations.

**Primary recommendation:** Use Vercel AI SDK's native `embed()` function with OpenAI text-embedding-3-small (1536 dimensions), Vectra for local vector storage with build-time indexing script, and separate `/api/rag` endpoint to keep RAG chat distinct from existing MCP tool chat.

## Standard Stack

The established libraries/tools for RAG documentation chat in Next.js:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai | 6.0.48 | Vercel AI SDK - embeddings, streaming, chat | Industry standard for Next.js AI features, already installed |
| @ai-sdk/openai-compatible | 2.0.18 | OpenAI provider for Vercel AI SDK | Already installed, supports Anthropic via OpenAI-compatible API |
| vectra | ~2.1.x | Local file-based vector database | Zero infrastructure, portable, good for <10K chunks |
| remark / rehype | installed | MDX parsing (Fumadocs pipeline) | Already configured in source.config.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @upstash/vector | ~1.x | Managed vector database | Production scaling (if >10K chunks or multi-region) |
| gray-matter | ~4.0.x | Frontmatter extraction | If need manual MDX parsing (Fumadocs may handle) |
| @ai-sdk/openai | ~1.x | Official OpenAI SDK provider | If switching from openai-compatible to native |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI embeddings | Cohere embed-v3 (1024 dims) | 10x cheaper but requires Cohere API key, less ecosystem support |
| Vectra | Chroma (chromadb npm) | Requires Python backend or cloud service, heavier dependency |
| Vectra | Pinecone | Production-grade but requires API key, not free tier friendly |
| Section chunking | Fixed 1000-token chunks | Simpler but breaks semantic boundaries, worse retrieval quality |

**Installation:**
```bash
bun add vectra
# Optional for production:
# bun add @upstash/vector
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── scripts/
│   ├── index-docs.ts           # Build-time indexing script
│   └── validate-embeddings.ts  # Verify index health
├── lib/
│   ├── rag/
│   │   ├── embedder.ts         # Embedding utilities (wrap AI SDK)
│   │   ├── chunker.ts          # MDX section chunking
│   │   ├── retriever.ts        # Vector search + ranking
│   │   └── vector-store.ts     # Vectra wrapper
│   └── mdx/
│       └── parser.ts           # MDX to plain text extraction
├── app/
│   └── api/
│       └── rag/
│           └── route.ts        # RAG chat endpoint (separate from /api/chat)
└── .vector-index/              # Vectra file-based index (gitignored)
    ├── index.json
    └── *.json                  # Per-chunk metadata files
```

### Pattern 1: Build-Time Indexing Pipeline
**What:** Index documentation at build time, not runtime, to avoid cold start latency
**When to use:** All documentation sites with static content
**Example:**
```typescript
// scripts/index-docs.ts
import { createOpenAI } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { LocalIndex } from 'vectra';
import { docs } from '@/.source/server';
import { chunkDocumentation } from '@/lib/rag/chunker';

async function indexDocumentation() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingModel = openai.embedding('text-embedding-3-small');

  // Initialize Vectra index
  const index = new LocalIndex('.vector-index');
  if (!(await index.isIndexCreated())) {
    await index.createIndex({
      version: 1,
      metadata_config: {
        indexed: ['url', 'title'] // Enable filtering by URL/title
      }
    });
  }

  // Load all docs via Fumadocs
  const allDocs = await docs.getPages();

  for (const page of allDocs) {
    const content = await page.data.load();
    const chunks = chunkDocumentation(content, page.url, page.data.title);

    // Batch embed chunks (embedMany for efficiency)
    const texts = chunks.map(c => c.text);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: texts,
    });

    // Store in vector index
    for (let i = 0; i < chunks.length; i++) {
      await index.insertItem({
        vector: embeddings[i],
        metadata: {
          url: chunks[i].url,
          title: chunks[i].title,
          section: chunks[i].section,
          text: chunks[i].text,
        }
      });
    }
  }

  console.log(`Indexed ${allDocs.length} documents`);
}
```

### Pattern 2: Section-Based Chunking (Semantic Boundaries)
**What:** Split MDX by headings (H2/H3) to preserve semantic context
**When to use:** Documentation with clear heading structure
**Example:**
```typescript
// lib/rag/chunker.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

interface Chunk {
  text: string;
  url: string;
  title: string;
  section: string;
}

export function chunkDocumentation(
  mdxContent: string,
  docUrl: string,
  docTitle: string
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentSection = '';
  let currentContent: string[] = [];

  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .parse(mdxContent);

  visit(tree, (node) => {
    // New section on H2/H3
    if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
      if (currentContent.length > 0) {
        chunks.push({
          text: currentContent.join('\n'),
          url: `${docUrl}#${slugify(currentSection)}`,
          title: docTitle,
          section: currentSection,
        });
      }
      currentSection = extractText(node);
      currentContent = [currentSection];
    } else if (node.type === 'paragraph' || node.type === 'code') {
      currentContent.push(extractText(node));
    }
  });

  // Push final section
  if (currentContent.length > 0) {
    chunks.push({
      text: currentContent.join('\n'),
      url: `${docUrl}#${slugify(currentSection)}`,
      title: docTitle,
      section: currentSection,
    });
  }

  return chunks.filter(c => c.text.length > 50); // Filter tiny chunks
}
```

### Pattern 3: RAG Chat Endpoint with Citation Extraction
**What:** Separate API route that retrieves context, generates answer, and extracts citations
**When to use:** All RAG implementations
**Example:**
```typescript
// app/api/rag/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { embed, streamText } from 'ai';
import { LocalIndex } from 'vectra';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;

  // 1. Embed user query
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: userMessage,
  });

  // 2. Retrieve top-k relevant chunks
  const index = new LocalIndex('.vector-index');
  const results = await index.queryItems(embedding, 5); // top-5

  // 3. Filter by similarity threshold
  const THRESHOLD = 0.75;
  const relevantChunks = results
    .filter(r => r.score >= THRESHOLD)
    .map(r => r.item.metadata);

  // 4. Build context prompt
  const context = relevantChunks
    .map((c, i) => `[${i + 1}] ${c.title} - ${c.section}\n${c.text}\n(Source: ${c.url})`)
    .join('\n\n');

  // 5. Stream response with citations
  const result = streamText({
    model: openai('claude-3-5-sonnet-20241022'), // Via openai-compatible
    system: `You are a documentation assistant. Answer questions using ONLY the provided context.

Context:
${context}

Rules:
- Cite sources using [1], [2] etc. matching the context numbering
- If context doesn't contain the answer, say "I don't have information about that in the documentation."
- Do NOT make up information
- Provide code examples from context when relevant`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Pattern 4: Streaming with Citation Links
**What:** Stream response text while accumulating citation metadata for UI rendering
**When to use:** User-facing RAG chat interfaces
**Example:**
```typescript
// Client component (components/ai/rag-chat.tsx)
'use client';
import { useChat } from '@ai-sdk/react';

export function RAGChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/rag',
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <Markdown>{msg.content}</Markdown>
          {msg.role === 'assistant' && (
            <Citations
              sources={extractCitations(msg.content)}
            />
          )}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Ask</button>
      </form>
    </div>
  );
}

function extractCitations(content: string): string[] {
  // Extract [1], [2] etc. and map to URLs from metadata
  const citations = content.match(/\[(\d+)\]/g) || [];
  return citations.map(c => {
    const index = Number.parseInt(c.replace(/[\[\]]/g, ''));
    return relevantChunks[index - 1]?.url;
  });
}
```

### Anti-Patterns to Avoid
- **Runtime indexing:** Never index docs on user request - use build-time or background jobs
- **No similarity threshold:** Always filter by cosine similarity >0.7-0.75 to prevent hallucinated citations
- **Single-chunk retrieval:** Retrieve 3-5 chunks minimum for context richness
- **Ignoring chunk overlap:** Use 10-15% overlap between chunks to avoid context loss at boundaries
- **Hardcoded prompts:** Make system prompt configurable for tuning citation format and tone

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vector similarity search | Custom cosine similarity index | Vectra or Upstash Vector | HNSW algorithm is complex, file locking edge cases, production-ready scaling |
| Markdown to plain text | Regex-based stripping | unified + remark-parse + visit | Handles MDX components, preserves structure, extensible |
| Chunking with overlap | Manual string slicing | Section-based with unified AST traversal | Respects semantic boundaries (headings), avoids mid-sentence splits |
| Embedding batching | Loop with individual API calls | Vercel AI SDK `embedMany()` | Built-in batching, rate limiting, retry logic, token usage tracking |
| Streaming chat UI | Custom SSE handler | Vercel AI SDK `useChat()` hook | Handles connection errors, aborts, message state, optimistic updates |

**Key insight:** RAG pipelines have many edge cases (rate limits, chunking boundaries, citation extraction, streaming failures). Use battle-tested libraries that handle these transparently.

## Common Pitfalls

### Pitfall 1: Chunking Too Large or Too Small
**What goes wrong:** Chunks >2000 tokens exceed context windows for retrieval; chunks <200 tokens lack context for meaningful matching
**Why it happens:** Temptation to use fixed-size chunking without considering semantic boundaries
**How to avoid:** Use section-based chunking (by H2/H3 headings) targeting 800-1200 tokens per chunk with 100-token overlap
**Warning signs:**
- Low retrieval relevance scores (<0.6 average)
- Citations pointing to wrong sections
- Answers missing code examples that exist in docs

### Pitfall 2: No Off-Topic Filtering
**What goes wrong:** Chat answers questions outside documentation scope, users expect docs-only answers
**Why it happens:** LLM has broad knowledge, will answer from training data if no guardrails
**How to avoid:**
- System prompt: "Answer ONLY using provided context. If not in context, say 'Not in documentation.'"
- Add similarity threshold check (>0.75) before including chunks in context
- Optional: Classify query intent before retrieval (docs vs general knowledge)
**Warning signs:**
- Users report answers that aren't in docs
- Citations missing on some answers
- Answers mentioning external tools/libraries not in your stack

### Pitfall 3: Build-Time Indexing Not in Build Pipeline
**What goes wrong:** Vector index missing in production, outdated index after doc updates
**Why it happens:** Indexing script exists but not integrated into `bun run build` or CI/CD
**How to avoid:**
- Add indexing to `prebuild` script in package.json
- Ensure `.vector-index/` directory structure committed (index.json) or regenerated
- Verify index freshness in build logs
**Warning signs:**
- 404s on citation links (docs updated but index stale)
- Missing recent documentation sections in answers
- Build succeeds but RAG endpoint returns "no results"

### Pitfall 4: Embedding Model Mismatch
**What goes wrong:** Query embedded with different model than indexed chunks → garbage similarity scores
**Why it happens:** Switching models during development, inconsistent environment variables
**How to avoid:**
- Store model name in index metadata (Vectra metadata_config)
- Validate query model matches index model on retrieval
- Version your index schema (recreate on model change)
**Warning signs:**
- All similarity scores near 0.3-0.5 (random chance)
- Previously working queries return irrelevant results
- Switching API keys breaks retrieval

### Pitfall 5: No Rate Limiting on RAG Endpoint
**What goes wrong:** OpenAI API costs spike from abuse or tight loops
**Why it happens:** Embedding + generation costs add up (embedding: $0.02/1M tokens, generation: $3/1M tokens for Sonnet)
**How to avoid:**
- Implement IP-based rate limiting (5 requests/minute baseline, same as existing /api/chat)
- Cache embeddings for common queries (optional optimization)
- Monitor usage via OpenAI dashboard
**Warning signs:**
- Unexpected API bills
- Spike in 429 errors from OpenAI
- Slow response times under load

### Pitfall 6: Citation Links Break on URL Changes
**What goes wrong:** Phase 10 navigation restructure changed URLs, but vector index has old URLs
**Why it happens:** Index not regenerated after URL schema changes
**How to avoid:**
- Regenerate index after navigation changes (automated in prebuild script)
- Store relative URLs (e.g., `/docs/getting-started/quickstart#installation`) not absolute
- Validate citation links in post-build verification
**Warning signs:**
- All citations link to 404s
- Links work locally but fail in production
- Redirect chains (3xx) on citation clicks

## Code Examples

Verified patterns from official sources:

### Vercel AI SDK: embedMany for Batch Indexing
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
import { createOpenAI } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddingModel = openai.embedding('text-embedding-3-small');

const texts = [
  'Documentation chunk 1',
  'Documentation chunk 2',
  'Documentation chunk 3',
];

const { embeddings, usage } = await embedMany({
  model: embeddingModel,
  values: texts,
  maxParallelCalls: 3, // Tune for rate limits
  maxRetries: 2,
});

console.log(`Embedded ${embeddings.length} chunks, used ${usage.tokens} tokens`);
// embeddings is number[][] (1536-dim vectors for text-embedding-3-small)
```

### Vectra: Local Vector Index Workflow
```typescript
// Source: https://github.com/Stevenic/vectra
import { LocalIndex } from 'vectra';

// Create index
const index = new LocalIndex('.vector-index');
if (!(await index.isIndexCreated())) {
  await index.createIndex({
    version: 1,
    metadata_config: {
      indexed: ['url', 'title'], // Enable filtering on these fields
    },
  });
}

// Insert items
await index.insertItem({
  vector: [0.1, 0.2, ...], // 1536-dim embedding
  metadata: {
    url: '/docs/quickstart',
    title: 'Quickstart',
    text: 'Content chunk...',
  },
});

// Query (cosine similarity)
const queryVector = [0.15, 0.18, ...]; // Embedded user query
const results = await index.queryItems(queryVector, 5); // Top-5

results.forEach(result => {
  console.log(`Score: ${result.score}, URL: ${result.item.metadata.url}`);
});
// Results sorted by similarity score (0-1, higher = more similar)
```

### Streaming RAG Response with Vercel AI SDK
```typescript
// Source: Vercel AI SDK patterns from docs
import { streamText } from 'ai';

const result = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  system: `Context:\n${retrievedChunks}\n\nRules: Cite sources as [1], [2]...`,
  messages: [{ role: 'user', content: 'How do I install?' }],
  onFinish: ({ usage }) => {
    console.log(`Tokens: ${usage.totalTokens}`);
  },
});

return result.toDataStreamResponse(); // Next.js API route response
```

### Cosine Similarity Threshold Filtering
```typescript
// Source: RAG best practices (LOW confidence - common pattern but not official doc)
const SIMILARITY_THRESHOLD = 0.75;

const relevantChunks = queryResults
  .filter(result => result.score >= SIMILARITY_THRESHOLD)
  .slice(0, 5) // Top-5 after filtering
  .map(result => result.item.metadata);

if (relevantChunks.length === 0) {
  return "I don't have information about that in the documentation.";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain for everything | Vercel AI SDK native functions | 2024 Q2 | Simpler API, better Next.js integration, less dependency bloat |
| text-embedding-ada-002 | text-embedding-3-small | 2024 Q1 | 5x cheaper ($0.02 vs $0.10 per 1M tokens), same quality |
| Runtime embedding | Build-time indexing | Ongoing | Eliminates cold start latency, predictable costs |
| Pinecone required | Local-first (Vectra) | 2024 | Zero-cost development, easier testing, optional production upgrade |
| Fixed-size chunking | Semantic (section-based) | 2023-2024 | Better citation accuracy, preserves context |

**Deprecated/outdated:**
- **LangChain.js for embeddings:** Verbose API, heavy dependencies. Use Vercel AI SDK's `embed()`/`embedMany()` directly.
- **text-embedding-ada-002:** Replaced by text-embedding-3-small (5x cheaper, same performance).
- **Chroma Python server for Node.js:** Requires separate Python process. Use Vectra (pure Node.js) or Upstash (serverless).
- **Manual SSE streaming:** Use Vercel AI SDK's `streamText()` and `useChat()` hook for built-in streaming.

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal chunk size for Austrian documentation (mixed German/English)**
   - What we know: Section-based chunking works for English docs, 800-1200 token target is standard
   - What's unclear: Does bilingual content (German/English MDX files) require different chunking strategy? German compound words may affect tokenization.
   - Recommendation: Start with section-based, monitor retrieval quality for German vs English queries. If German underperforms, consider language-aware chunking or multilingual embeddings (Cohere embed-multilingual-v3).

2. **Similarity threshold tuning for this specific corpus**
   - What we know: 0.75 is recommended baseline for cosine similarity
   - What's unclear: Optimal threshold depends on embedding model, chunk size, and query patterns. May need adjustment based on user feedback.
   - Recommendation: Start at 0.75, log threshold vs. user satisfaction (feedback thumbs up/down), iterate. Too high = "no results", too low = irrelevant citations.

3. **Build time impact of indexing 44 MDX files**
   - What we know: Embedding 44 docs × ~3 chunks/doc = ~132 chunks. At 400 tokens/chunk = 52,800 tokens. text-embedding-3-small throughput ~3000 tokens/sec.
   - What's unclear: Total build time including MDX parsing and Vectra writes.
   - Recommendation: Benchmark in Plan 12-01. If >30 seconds, implement caching (only re-embed changed docs). Must stay under 5-minute build constraint (currently 130s, ~3m headroom).

4. **Upstash Vector vs Vectra for production**
   - What we know: Vectra works for <10K chunks (more than sufficient for 44 docs). Upstash Vector scales better but adds external dependency.
   - What's unclear: Future doc growth trajectory. Will dataset exceed 10K chunks in v3.x?
   - Recommendation: Ship with Vectra. Monitor index size and query latency. Plan upgrade to Upstash if docs grow >5K chunks or need multi-region deployment.

5. **RAG vs existing Fumadocs search integration**
   - What we know: Phase 10 uses Fumadocs built-in search (keyword-based). RAG provides semantic search with natural language answers.
   - What's unclear: Should RAG replace search or complement it? User preference for keyword vs semantic?
   - Recommendation: Keep both. Search button = keyword search (fast, precise). AI chat button = RAG (natural language, conversational). Users choose based on task.

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK Embeddings: https://ai-sdk.dev/docs/ai-sdk-core/embeddings (WebFetch verified 2026-01-23)
- Vectra GitHub: https://github.com/Stevenic/vectra (WebFetch verified 2026-01-23)
- Upstash Vector Docs: https://upstash.com/docs/vector/overall/getstarted (WebFetch verified 2026-01-23)
- Vercel AI SDK Examples: https://github.com/vercel/ai/tree/main/examples (WebFetch verified 2026-01-23)

### Secondary (MEDIUM confidence)
- MDX.js GitHub: https://github.com/mdx-js/mdx (WebFetch verified - general MDX info, not RAG-specific)
- Project package.json: ai@6.0.48, @ai-sdk/openai-compatible@2.0.18 confirmed installed
- Project source.config.ts: Fumadocs MDX pipeline with remark/rehype confirmed

### Tertiary (LOW confidence - needs validation)
- **Similarity threshold 0.75:** Common pattern in RAG implementations (training data), not officially documented by any provider. Requires empirical tuning.
- **Chunk size 800-1200 tokens:** Industry pattern (training data), not from official OpenAI or Vercel docs. Based on token limit considerations and retrieval quality heuristics.
- **Section-based chunking superiority:** Best practice from training data, not experimentally validated for this corpus. May need adjustment based on actual doc structure.
- **OpenAI pricing ($0.02/1M tokens):** Training data (potentially stale). Could not verify via WebFetch (403 error on pricing page). Needs manual verification at https://openai.com/api/pricing.
- **Build-time indexing as standard:** Inferred from Vercel examples and training data, not explicitly stated in AI SDK docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vercel AI SDK and Vectra verified via official sources
- Architecture: MEDIUM - Patterns verified in examples, not all officially documented
- Pitfalls: MEDIUM - Based on training data and common RAG failure modes, not project-specific validation
- Chunk sizes/thresholds: LOW - Industry heuristics, require empirical tuning for this corpus
- Cost estimates: LOW - Could not verify current OpenAI pricing, based on stale training data

**Research date:** 2026-01-23
**Valid until:** ~30 days (2026-02-22) - Vercel AI SDK and OpenAI embeddings are stable APIs, but pricing and best practices may evolve

**Critical validations needed in planning:**
1. Verify OpenAI API pricing (embeddings and generation) via manual check or environment variable documentation
2. Benchmark build-time indexing duration to ensure <5 min build constraint
3. Test similarity threshold (0.75) with sample queries, adjust based on relevance
4. Validate section-based chunking produces reasonable chunk sizes (check via logging in indexing script)
5. Confirm Vectra performance is acceptable for 44 docs × ~3 chunks = ~132 total vectors
