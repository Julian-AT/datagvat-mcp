# Architecture Integration Patterns

**Project:** datagvat-mcp v2.1
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

This document describes how v2.1 features (RAG chat, Remotion videos, navigation restructuring, CLI enhancements) integrate with the existing Next.js 16.1.3 + Fumadocs platform. The architecture leverages existing infrastructure (Vercel AI SDK, Fumadocs page tree, Bun tooling) while adding new API routes, components, and build-time processes.

**Key architectural decisions:**
1. **RAG Chat:** Server-side API route (`/api/chat/rag`) + client component (repurpose existing search button) + server-side vector DB
2. **Remotion Videos:** Build-time generation via Bun scripts + static hosting + MDX embed component
3. **Navigation:** Meta.json restructuring using Fumadocs `root: true` pattern for 3-tab layout
4. **CLI:** Enhanced with `add` command following shadcn patterns (registry + interactive selection)

## Current Architecture Baseline

### Existing Infrastructure

| Layer | Technology | Location | Purpose |
|-------|-----------|----------|---------|
| Framework | Next.js 16.1.3 App Router | `docs/` | SSR, routing, API routes |
| Docs Engine | Fumadocs 16.4.7 | Integrated | MDX rendering, page tree, search |
| Runtime | Bun | Root | Scripts, dev server, build |
| Linting | Biome 2.3.11 | Root | Code quality, formatting |
| CI/CD | GitHub Actions | `.github/` | Build, deploy, validation |
| AI Integration | Vercel AI SDK 6.0.41 | `/try` page | Chat streaming (existing) |

### Existing Components

```
docs/
├── app/
│   ├── [lang]/
│   │   ├── docs/[[...slug]]/page.tsx    # MDX page renderer
│   │   ├── docs/layout.tsx              # DocsLayout with sidebar/tabs
│   │   └── try/page.tsx                 # ChatInterface (existing)
│   ├── layout.tsx                       # Root layout
│   └── provider.tsx                     # Theme/context providers
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx           # useChat hook integration
│   │   ├── chat-input.tsx               # Input with streaming controls
│   │   └── message-list.tsx             # Message rendering
│   ├── search.tsx                       # Search dialog (Orama)
│   └── mdx/                             # MDX components
├── content/docs/                        # MDX files organized by section
└── lib/
    └── source/
        └── navigation.ts                # Section detection logic
```

### Existing Data Flow

1. **MDX Rendering:** Fumadocs server → `.source/server.ts` → page tree → DocsLayout → MDX component
2. **Chat Streaming:** Client (useChat) → `/api/chat` → Vercel AI SDK → streaming response
3. **Search:** Client (SearchDialog) → Orama index → fuzzy search results
4. **Navigation:** `meta.json` files → Fumadocs page tree → sidebar rendering

---

## Feature 1: RAG Chat Integration

### Architecture Overview

**Pattern:** API Route + Server-Side Vector DB + Client Component + Streaming

```
User Query → SearchButton (repurposed) → /api/chat/rag → Vector DB → embed() → similarity search → streamText() with context → Client
```

### Component Structure

#### New Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `/api/chat/rag/route.ts` | API Route (POST) | `docs/app/api/chat/rag/` | RAG orchestration, vector search, streaming |
| `<RAGChatDialog />` | Client Component | `docs/components/chat/rag-dialog.tsx` | Modal chat UI, useChat hook |
| `<RAGTrigger />` | Client Component | `docs/components/chat/rag-trigger.tsx` | Bottom-right search button replacement |
| `lib/rag/embeddings.ts` | Server Utility | `docs/lib/rag/` | Embedding generation (AI SDK embed) |
| `lib/rag/vector-store.ts` | Server Utility | `docs/lib/rag/` | Vector storage interface |
| `lib/rag/indexer.ts` | Build Script | `docs/lib/rag/` | Documentation indexing pipeline |

#### Modified Components

| Component | Change | Reason |
|-----------|--------|--------|
| `app/[lang]/docs/layout.tsx` | Remove `<AISearch>` components | Replace with RAGTrigger |
| `components/search.tsx` | Keep for legacy Orama search | Backward compatibility |

### API Route Architecture

**File:** `docs/app/api/chat/rag/route.ts`

```typescript
// Implements Vercel AI SDK streaming pattern
export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Extract last user message
  const query = messages[messages.length - 1].content;

  // 2. Generate query embedding (server-side)
  const embedding = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // 3. Vector similarity search
  const relevantDocs = await vectorStore.search(embedding.embedding, {
    topK: 5,
    threshold: 0.7,
  });

  // 4. Build context from retrieved docs
  const context = relevantDocs.map(doc => doc.content).join('\n\n');

  // 5. Stream response with context
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: `Answer based on: ${context}` },
      ...messages,
    ],
  });

  return result.toDataStreamResponse();
}
```

**Key architectural decisions:**
- **Server-side only:** Embedding generation and vector search never exposed to client
- **Streaming response:** Uses `streamText()` + `toDataStreamResponse()` for incremental UI updates
- **Context injection:** Retrieved docs injected into system message, not exposed to client

### Vector Database Integration

**Recommended stack:** In-memory vector store → PostgreSQL pgvector → Pinecone/Weaviate (scale path)

#### Phase 1: In-Memory (MVP)

```typescript
// lib/rag/vector-store.ts
class InMemoryVectorStore {
  private vectors: Array<{ id: string; embedding: number[]; content: string; metadata: any }> = [];

  async add(id: string, embedding: number[], content: string, metadata: any) {
    this.vectors.push({ id, embedding, content, metadata });
  }

  async search(queryEmbedding: number[], options: { topK: number; threshold: number }) {
    // Cosine similarity search
    const scores = this.vectors.map(v => ({
      ...v,
      score: cosineSimilarity(queryEmbedding, v.embedding),
    }));

    return scores
      .filter(s => s.score >= options.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK);
  }
}
```

**Pros:** Zero setup, fast for <10K docs, good for MVP
**Cons:** RAM usage (approx 1MB per 1000 docs), lost on restart, no persistence
**When to migrate:** When docs exceed 10K or multi-instance deployment needed

#### Phase 2: PostgreSQL pgvector (Production)

```typescript
// lib/rag/vector-store.ts
class PostgresVectorStore {
  async search(queryEmbedding: number[], options: { topK: number; threshold: number }) {
    const result = await sql`
      SELECT id, content, metadata,
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM document_embeddings
      WHERE 1 - (embedding <=> ${queryEmbedding}::vector) >= ${options.threshold}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${options.topK}
    `;
    return result.rows;
  }
}
```

**Migration trigger:** When docs >10K or need persistence
**Dependencies:** `pg`, `@neondatabase/serverless`, `pgvector` extension

### Documentation Indexing Pipeline

**When:** Build-time (prebuild script) + optional runtime reindex endpoint

**File:** `docs/lib/rag/indexer.ts`

```typescript
// Build-time indexer (run in prebuild script)
export async function indexDocumentation() {
  const vectorStore = getVectorStore();

  // 1. Load all MDX files from content/docs/
  const docs = await loadAllMDXFiles('content/docs');

  // 2. Chunk documents (split on headings, max 1000 tokens)
  const chunks = docs.flatMap(doc => chunkDocument(doc, {
    maxTokens: 1000,
    splitOn: ['##', '###'], // Split on H2, H3
  }));

  // 3. Batch embed chunks
  const embeddings = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map(c => c.content),
  });

  // 4. Store in vector DB
  for (let i = 0; i < chunks.length; i++) {
    await vectorStore.add(
      chunks[i].id,
      embeddings.embeddings[i],
      chunks[i].content,
      { title: chunks[i].title, url: chunks[i].url }
    );
  }
}
```

**Chunking strategy:**
- **Split on headings:** Preserves semantic boundaries (H2/H3 = logical sections)
- **Max 1000 tokens:** Fits embedding model context + leaves room for query
- **Overlap 200 tokens:** Prevents context loss at boundaries
- **Metadata preservation:** Store title, URL, section for display in chat

**Build integration:**
```json
// package.json
{
  "scripts": {
    "prebuild": "bun run scripts/prebuild.ts && bun run lib/rag/indexer.ts",
    "rag:reindex": "bun run lib/rag/indexer.ts"
  }
}
```

### Client Component Architecture

**File:** `docs/components/chat/rag-dialog.tsx`

```tsx
'use client';
import { useChat } from '@ai-sdk/react';

export function RAGChatDialog() {
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat/rag',
    onError: (err) => console.error('RAG error:', err),
  });

  return (
    <Dialog>
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={status !== 'ready'} />
    </Dialog>
  );
}
```

**Integration with existing search button:**

Replace bottom-right search button in `app/[lang]/docs/layout.tsx`:

```tsx
// OLD (Orama search)
<AISearch>
  <AISearchPanel />
  <AISearchTrigger />
</AISearch>

// NEW (RAG chat)
<RAGChat>
  <RAGChatDialog />
  <RAGTrigger /> {/* Bottom-right button */}
</RAGChat>
```

### Performance Considerations

| Concern | Impact | Mitigation |
|---------|--------|------------|
| Embedding latency | 200-500ms per query | Use fast model (text-embedding-3-small), cache common queries |
| Vector search time | O(n) for in-memory | Migrate to pgvector (uses HNSW index, O(log n)) |
| Streaming latency | TTFB <1s critical | Edge deployment, vector search first (parallel with model call) |
| Build-time indexing | +30s to build | Run in background, cache embeddings, incremental reindex |
| Token costs | $0.0001/1K tokens (embed) | Batch embed (embedMany), cache embeddings, reuse across builds |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time                                                  │
├─────────────────────────────────────────────────────────────┤
│ MDX Files → Chunker → embedMany() → Vector Store           │
│                         (batch)        (persistence)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Runtime (Query)                                             │
├─────────────────────────────────────────────────────────────┤
│ User → RAGTrigger → RAGDialog → useChat                    │
│                                     ↓                       │
│                            POST /api/chat/rag               │
│                                     ↓                       │
│                      embed(query) → Vector Search           │
│                                     ↓                       │
│                      streamText(context + query)            │
│                                     ↓                       │
│                      Stream → RAGDialog → User              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Remotion Video Generation

### Architecture Overview

**Pattern:** Build-Time Rendering + Static Hosting + MDX Component

```
Bun Script → Remotion renderMedia() → MP4 files → public/ → MDX <Video /> component → Next.js static serving
```

### Component Structure

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `scripts/render-videos.ts` | Build Script | `docs/scripts/` | Video generation orchestration |
| `remotion/` | Remotion Project | `docs/remotion/` | Video compositions (React) |
| `components/mdx/video.tsx` | MDX Component | `docs/components/mdx/` | Video embed with player |
| `public/videos/` | Static Assets | `docs/public/` | Rendered MP4 files |

### Video Generation Workflow

**Decision:** Build-time generation (not runtime) for performance and cost

**Rationale:**
- **Build-time:** Videos generated once, served as static files (fast, CDN-friendly)
- **Runtime (rejected):** API route triggers renderMedia() on-demand (slow, expensive, compute-heavy)

#### Build Script Architecture

**File:** `docs/scripts/render-videos.ts`

```typescript
import { renderMedia } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';

// List of videos to generate
const videos = [
  { id: 'quickstart', composition: 'Quickstart', duration: 30 },
  { id: 'tool-search', composition: 'ToolSearchDemo', duration: 45 },
  { id: 'workflow-discovery', composition: 'WorkflowDiscovery', duration: 60 },
];

export async function renderAllVideos() {
  // 1. Bundle Remotion project once
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./remotion/index.ts'),
    webpackOverride: (config) => config, // Next.js compat
  });

  // 2. Render each video composition
  for (const video of videos) {
    console.log(`Rendering ${video.id}...`);

    await renderMedia({
      composition: {
        id: video.composition,
        durationInFrames: video.duration * 30, // 30fps
        fps: 30,
        width: 1920,
        height: 1080,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: path.join('./public/videos', `${video.id}.mp4`),
      onProgress: ({ progress }) => {
        console.log(`  ${video.id}: ${(progress * 100).toFixed(0)}%`);
      },
    });

    console.log(`✓ ${video.id} complete`);
  }
}
```

**Build integration:**

```json
// package.json
{
  "scripts": {
    "prebuild": "bun run scripts/prebuild.ts && bun run scripts/render-videos.ts",
    "videos:render": "bun run scripts/render-videos.ts",
    "videos:preview": "remotion studio remotion/index.ts"
  },
  "dependencies": {
    "remotion": "^4.0.x",
    "@remotion/bundler": "^4.0.x",
    "@remotion/renderer": "^4.0.x",
    "@remotion/player": "^4.0.x"
  }
}
```

### Remotion Project Structure

```
docs/remotion/
├── index.ts                     # Remotion root (registers compositions)
├── compositions/
│   ├── Quickstart.tsx           # Quickstart video composition
│   ├── ToolSearchDemo.tsx       # Tool search demo
│   └── WorkflowDiscovery.tsx    # Workflow discovery demo
├── components/
│   ├── CodeEditor.tsx           # Animated code editor component
│   ├── Terminal.tsx             # Animated terminal component
│   └── Browser.tsx              # Animated browser window
└── assets/
    ├── fonts/                   # Custom fonts for branding
    └── images/                  # Static images for compositions
```

**Example composition:**

```tsx
// remotion/compositions/Quickstart.tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const Quickstart: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* Animated terminal showing installation */}
      <Terminal
        lines={[
          { frame: 30, text: '$ npx datagvat-mcp init' },
          { frame: 60, text: '✓ Found Claude Desktop' },
          { frame: 90, text: '✓ Configuration written' },
        ]}
      />

      {/* Animated browser showing Claude chat */}
      <Browser url="claude.ai" startFrame={120}>
        <ChatAnimation />
      </Browser>
    </AbsoluteFill>
  );
};
```

### MDX Video Component

**File:** `docs/components/mdx/video.tsx`

```tsx
'use client';
import { Player } from '@remotion/player';
import { lazy, Suspense } from 'react';

interface VideoProps {
  id: string;           // e.g., 'quickstart'
  composition?: string; // Optional: if different from id
  width?: number;
  height?: number;
}

export function Video({ id, composition, width = 1920, height = 1080 }: VideoProps) {
  // Load video file statically
  const videoSrc = `/videos/${id}.mp4`;

  return (
    <div className="my-8 rounded-lg overflow-hidden border">
      <video
        src={videoSrc}
        controls
        width={width}
        height={height}
        className="w-full h-auto"
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

// Alternative: Use Remotion Player for interactive playback
export function VideoPlayer({ id, composition }: VideoProps) {
  const Composition = lazy(() => import(`@/remotion/compositions/${composition ?? id}`));

  return (
    <Suspense fallback={<div>Loading video...</div>}>
      <Player
        component={Composition}
        durationInFrames={900} // 30s at 30fps
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        controls
      />
    </Suspense>
  );
}
```

**Usage in MDX:**

```mdx
---
title: Quickstart
---

# Quickstart Guide

Watch the installation process:

<Video id="quickstart" />

See it in action:

<Video id="tool-search" />
```

### Asset Management

**Strategy:** Static hosting in public/ directory (not CDN for MVP)

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| `public/videos/` | Simple, works with SSG, no CDN config | Large repo size, slow clones | **Use for MVP** (3-5 videos ~50MB total) |
| Vercel Blob | CDN, no repo bloat, URL stability | Additional service, API calls | Migrate when >10 videos or >100MB |
| Git LFS | Keeps repo clean, CDN-compatible | Git LFS cost, complex setup | Not recommended (team friction) |

**Decision:** Start with `public/videos/`, migrate to Vercel Blob when hitting limits

### Build-Time vs Runtime Comparison

| Aspect | Build-Time (Recommended) | Runtime (Not Recommended) |
|--------|--------------------------|---------------------------|
| **Performance** | Instant (static file) | 10-60s wait per render |
| **Cost** | Free (CI minutes) | $0.50-$2 per render (serverless compute) |
| **Complexity** | Simple (bun script) | Complex (API route, queue, storage) |
| **Caching** | Built-in (static files) | Manual (S3/Blob + cache headers) |
| **When to use** | Videos rarely change, <10 compositions | Videos personalized per-user, >100 variations |

**For this project:** Build-time is correct choice (videos are static documentation assets, not user-generated)

### CI Integration

```yaml
# .github/workflows/build.yml
- name: Install Remotion dependencies
  run: |
    # Remotion requires Chrome/Chromium for rendering
    sudo apt-get update
    sudo apt-get install -y chromium-browser

- name: Render videos
  run: bun run scripts/render-videos.ts
  env:
    REMOTION_DISABLE_HARDWARE_ACCELERATION: 1 # CI compatibility

- name: Upload videos as artifacts
  uses: actions/upload-artifact@v3
  with:
    name: videos
    path: docs/public/videos/*.mp4
```

---

## Feature 3: Navigation Restructuring

### Architecture Overview

**Pattern:** Meta.json Root Tabs + Fumadocs Page Tree Transform

**Objective:** 3-tab layout (Documentation, Reference, Tutorials) with sidebar within each tab

### Current Navigation Structure

**Problem:** Flat sidebar with separator-based sections (not true tabs)

```json
// docs/content/docs/meta.json (current)
{
  "pages": [
    "getting-started",
    "---[BookOpen]Documentation---",
    "(guides)",
    "---[Library]Reference---",
    "reference",
    "---[Settings]Advanced Topics---",
    "(advanced)"
  ]
}
```

**Issues:**
1. All content in single sidebar (long scrolling)
2. Separators (`---`) are not interactive tabs
3. No clear top-level navigation

### Target Navigation Structure

**Solution:** Root-level meta.json entries with `root: true`

```json
// docs/content/docs/meta.json (new)
{
  "pages": [
    "getting-started",
    "documentation",   // → Root tab 1
    "reference",       // → Root tab 2
    "tutorials"        // → Root tab 3
  ]
}

// docs/content/docs/documentation/meta.json
{
  "title": "Documentation",
  "icon": "BookOpen",
  "root": true,
  "pages": [
    "guides",
    "workflows",
    "examples"
  ]
}

// docs/content/docs/reference/meta.json
{
  "title": "Reference",
  "icon": "Library",
  "root": true,
  "pages": [
    "tools",
    "api",
    "cli"
  ]
}

// docs/content/docs/tutorials/meta.json
{
  "title": "Tutorials",
  "icon": "GraduationCap",
  "root": true,
  "pages": [
    "quickstart",
    "integration",
    "advanced"
  ]
}
```

### Implementation Strategy

**Step 1: Restructure content/docs/ directory**

```
docs/content/docs/
├── meta.json                         # Root nav (links to tabs)
├── index.mdx                         # Home page
├── getting-started/
│   ├── meta.json
│   ├── index.mdx
│   └── ...
├── documentation/                    # NEW: Tab 1
│   ├── meta.json                     # { "root": true }
│   ├── guides/
│   │   ├── meta.json
│   │   └── ...
│   ├── workflows/
│   └── examples/
├── reference/                        # NEW: Tab 2 (exists, add root: true)
│   ├── meta.json                     # { "root": true }
│   ├── tools/
│   ├── api/
│   └── cli/
└── tutorials/                        # NEW: Tab 3
    ├── meta.json                     # { "root": true }
    ├── quickstart/
    └── ...
```

**Step 2: Update layout to use tabs**

**File:** `docs/app/[lang]/docs/layout.tsx`

```tsx
// Already supports tabs via Fumadocs
<DocsLayout
  tree={source.getPageTree(lang)}
  sidebar={{
    tabs: {
      transform(option, node) {
        const meta = source.getNodeMeta(node);
        if (!meta || !node.icon) return option;

        // Apply custom tab styling
        const color = `var(--${getSection(meta.path)}-color, var(--color-fd-foreground))`;
        return {
          ...option,
          icon: (
            <div className="rounded-lg" style={{ color }}>
              {node.icon}
            </div>
          ),
        };
      },
    },
  }}
>
  {children}
</DocsLayout>
```

**How it works:**
1. Fumadocs detects `root: true` in meta.json
2. Automatically creates tab navigation at top of sidebar
3. Each tab shows its own page tree when selected
4. URL structure: `/docs/documentation/guides/setup` (tab is part of path)

### Migration Path

**Phase 1:** Create new directory structure without breaking existing URLs

```
1. Create documentation/ directory
2. Move (guides)/, (workflows)/, examples/ into documentation/
3. Update meta.json with root: true
4. Add redirects for old URLs → new URLs
```

**Phase 2:** Update all internal links

```
OLD: [Setup Guide](/docs/guides/setup)
NEW: [Setup Guide](/docs/documentation/guides/setup)
```

**Phase 3:** Remove old directory structure

### Handling Duplicate Titles

**Problem:** Page title in frontmatter vs H1 in content

**Current behavior:** Fumadocs uses frontmatter `title`, then page renders H1 (duplication)

**Solution:** Use frontmatter title only (remove H1 from MDX content)

```mdx
---
title: Installation Guide
description: How to install the MCP server
---

<!-- OLD: # Installation Guide (duplicate) -->
<!-- NEW: Start directly with content -->

The data.gv.at MCP Server can be installed...
```

**Why:** Fumadocs DocsPage component already renders `<h1>{page.data.title}</h1>` (see `page.tsx:72`)

### Tab-Specific Styling

**File:** `docs/lib/source/navigation.ts` (already exists, extend for new tabs)

```typescript
export function getSection(path: string | undefined) {
  if (!path) return 'framework';

  const [dir] = path.split('/', 1);

  return {
    'documentation': 'documentation',  // NEW
    'reference': 'reference',          // NEW
    'tutorials': 'tutorials',          // NEW
    'getting-started': 'framework',
  }[dir] ?? 'framework';
}
```

**CSS Variables:** Define tab-specific colors in `globals.css`

```css
:root {
  --documentation-color: hsl(220, 90%, 56%);
  --reference-color: hsl(142, 76%, 36%);
  --tutorials-color: hsl(262, 83%, 58%);
}
```

---

## Feature 4: CLI Package Enhancement

### Architecture Overview

**Pattern:** Shadcn-Style Registry + Interactive Selection + Config Management

**Goal:** Add `datagvat-mcp add <component>` command for adding MCP tools/configs

### Current CLI Architecture

```
packages/cli/
├── src/
│   ├── index.ts                    # Commander entry point
│   ├── commands/
│   │   └── init.ts                 # Init command (exists)
│   ├── detect.ts                   # Tool detection
│   ├── configure.ts                # Config file management
│   ├── paths.ts                    # Platform-specific paths
│   ├── templates.ts                # MCP config templates
│   ├── ui.ts                       # Terminal UI (chalk, ora)
│   └── types.ts                    # Type definitions
└── package.json
```

### Enhanced CLI Architecture

**New command:** `datagvat-mcp add <tool>` (shadcn-style component addition)

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts                 # Existing
│   │   └── add.ts                  # NEW: Add components/tools
│   ├── registry/
│   │   ├── index.ts                # Registry loader
│   │   ├── tools.json              # Tool registry (metadata)
│   │   └── templates/              # Component templates
│   │       ├── search-tool.json
│   │       ├── preview-tool.json
│   │       └── quality-tool.json
│   ├── prompts.ts                  # NEW: Interactive prompts (@inquirer/prompts)
│   ├── config.ts                   # NEW: Config file management (datagvat.config.json)
│   └── installer.ts                # NEW: Template installation logic
```

### Shadcn Pattern Comparison

| shadcn/ui | datagvat-mcp | Purpose |
|-----------|--------------|---------|
| `npx shadcn@latest init` | `npx datagvat-mcp init` | Initialize project config |
| `npx shadcn@latest add button` | `npx datagvat-mcp add search` | Add single component |
| `npx shadcn@latest add` | `npx datagvat-mcp add` | Interactive component selection |
| `components.json` | `datagvat.config.json` | Project configuration file |
| Registry (GitHub) | Registry (NPM package) | Component source |

### Add Command Architecture

**File:** `packages/cli/src/commands/add.ts`

```typescript
import { select, checkbox } from '@inquirer/prompts';
import { getRegistry, installTool } from '../registry/index.js';

interface AddCommandOptions {
  yes?: boolean;    // Skip prompts
  all?: boolean;    // Add all tools
}

export async function addCommand(toolName?: string, options: AddCommandOptions = {}) {
  // 1. Load project config (datagvat.config.json)
  const config = await loadConfig();
  if (!config) {
    ui.error('No datagvat.config.json found. Run `datagvat-mcp init` first.');
    process.exit(1);
  }

  // 2. Load registry
  const registry = await getRegistry();

  // 3. Determine which tools to add
  let toolsToAdd: string[];

  if (toolName) {
    // Specific tool: datagvat-mcp add search
    if (!registry.tools[toolName]) {
      ui.error(`Tool '${toolName}' not found in registry.`);
      ui.info(`Available tools: ${Object.keys(registry.tools).join(', ')}`);
      process.exit(1);
    }
    toolsToAdd = [toolName];
  } else if (options.all) {
    // All tools: datagvat-mcp add --all
    toolsToAdd = Object.keys(registry.tools);
  } else {
    // Interactive selection: datagvat-mcp add
    toolsToAdd = await checkbox({
      message: 'Which tools would you like to add?',
      choices: Object.entries(registry.tools).map(([id, tool]) => ({
        name: `${tool.name} - ${tool.description}`,
        value: id,
        checked: false,
      })),
    });
  }

  // 4. Install selected tools
  for (const toolId of toolsToAdd) {
    ui.step(`Installing ${toolId}...`);
    await installTool(toolId, registry.tools[toolId], config);
    ui.success(`✓ ${toolId} installed`);
  }

  // 5. Update config file
  await saveConfig(config);
}
```

### Registry Architecture

**File:** `packages/cli/src/registry/tools.json`

```json
{
  "tools": {
    "search": {
      "name": "Search Tool",
      "description": "Enhanced search with filters and semantic search",
      "version": "1.0.0",
      "dependencies": {
        "mcp": ["ckan_package_search"]
      },
      "config": {
        "template": "search-tool.json",
        "envVars": []
      }
    },
    "preview": {
      "name": "Data Preview Tool",
      "description": "Interactive data previews with CSV/JSON support",
      "version": "1.0.0",
      "dependencies": {
        "mcp": ["get_resource_preview"]
      },
      "config": {
        "template": "preview-tool.json",
        "envVars": []
      }
    },
    "quality": {
      "name": "Quality Assessment Tool",
      "description": "Data quality metrics and validation",
      "version": "1.0.0",
      "dependencies": {
        "mcp": ["get_resource_quality"]
      },
      "config": {
        "template": "quality-tool.json",
        "envVars": []
      }
    }
  }
}
```

**File:** `packages/cli/src/registry/templates/search-tool.json`

```json
{
  "name": "search",
  "enabled": true,
  "features": {
    "semantic_search": true,
    "filters": ["format", "license", "organization"],
    "facets": true
  },
  "limits": {
    "max_results": 100,
    "default_page_size": 20
  }
}
```

### Config File Management

**File:** `datagvat.config.json` (generated by `init` command)

```json
{
  "$schema": "https://datagvat-mcp.dev/schema.json",
  "version": "1.0.0",
  "tools": {
    "search": {
      "enabled": true,
      "features": { "semantic_search": true }
    },
    "preview": {
      "enabled": true,
      "formats": ["csv", "json", "xml"]
    }
  },
  "ai_clients": ["claude-desktop", "continue"],
  "preferences": {
    "auto_update": true
  }
}
```

**Purpose:**
- **Project-level configuration:** Which tools/features are enabled
- **Installation state:** Tracks what's been added via CLI
- **Customization:** User-specific preferences (rate limits, API keys)

**Location:** `~/.config/datagvat-mcp/datagvat.config.json` (user-level) or `./datagvat.config.json` (project-level)

---

## Integration Dependencies & Build Order

### Dependency Graph

```
1. Foundation (Parallel)
   ├── Navigation restructuring (meta.json changes)
   └── CLI registry structure (tools.json, templates)

2. RAG Chat (Sequential)
   ├── Vector store implementation
   ├── Documentation indexer
   ├── API route (/api/chat/rag)
   └── Client components (RAGDialog, RAGTrigger)

3. Remotion Videos (Parallel with RAG)
   ├── Remotion project setup
   ├── Video compositions
   ├── Build script (render-videos.ts)
   └── MDX component (<Video />)

4. CLI Enhancement (Depends on registry)
   ├── Add command implementation
   ├── Config file management
   └── Interactive prompts
```

### Recommended Build Order

**Phase 1: Foundation (Week 1)**
- Navigation restructuring (can break URLs, do early)
- CLI registry structure (needed for add command)

**Phase 2: RAG Chat (Week 2-3)**
- Vector store (in-memory MVP)
- Documentation indexer
- API route + client components
- Integration with existing search button

**Phase 3: Videos (Week 2-3, parallel with Phase 2)**
- Remotion project setup
- First video composition (quickstart)
- Build script integration
- MDX component

**Phase 4: CLI Enhancement (Week 4)**
- Add command
- Config file management
- Update command

### Critical Path

**Blocking dependencies:**
1. **Navigation restructuring blocks:** All documentation updates (new page URLs)
2. **Vector store blocks:** RAG API route (can't search without storage)
3. **Remotion setup blocks:** Video rendering (can't generate videos without Remotion)

**Non-blocking (can be parallel):**
- RAG chat + Remotion videos (independent features)
- CLI enhancement + documentation updates (independent workflows)

---

## Summary & Recommendations

### Integration Strategy

1. **RAG Chat:** Server-side API route pattern with Vercel AI SDK streaming (proven, existing)
2. **Remotion Videos:** Build-time generation pattern (simple, cost-effective)
3. **Navigation:** Meta.json root tabs pattern (Fumadocs-native)
4. **CLI:** Shadcn registry pattern (familiar, extensible)

### Technology Decisions

| Feature | Technology | Why |
|---------|-----------|-----|
| RAG Embeddings | OpenAI text-embedding-3-small | Fast, cheap, good quality |
| Vector Store (MVP) | In-memory | Zero setup, sufficient for <10K docs |
| Video Rendering | Remotion @4.0.x | React-based, great DX, active development |
| CLI Framework | Commander + @inquirer/prompts | Standard, good UX, type-safe |

### Phased Rollout

**Phase 1 (MVP):** RAG chat + first video + navigation restructure
**Phase 2 (Polish):** More videos + CLI add command + vector DB migration
**Phase 3 (Scale):** CDN for videos + advanced CLI features + RAG improvements

### Key Success Metrics

- **RAG:** <1s TTFB, >80% relevant results
- **Videos:** <500ms load time, <10min build time per video
- **Navigation:** <100ms tab switch, zero URL breakage
- **CLI:** <5s install time, >90% auto-detection rate

---

## Sources

This architecture research is based on:

- **Vercel AI SDK Documentation:** [API Route Patterns](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) - Chat streaming architecture
- **Vercel AI SDK Documentation:** [Embeddings API](https://ai-sdk.dev/docs/ai-sdk-core/embeddings) - Vector embedding patterns
- **Remotion Documentation:** [Renderer API](https://remotion.dev/docs/renderer) - Server-side video rendering
- **Fumadocs Documentation:** [Layout Configuration](https://fumadocs.dev/docs/ui/layouts) - Navigation and tab patterns
- **Existing Codebase:** Current implementation patterns verified from:
  - `docs/app/[lang]/try/page.tsx` - Existing Vercel AI SDK integration
  - `docs/components/chat/chat-interface.tsx` - useChat hook usage
  - `packages/cli/src/commands/init.ts` - CLI command patterns
  - `docs/app/[lang]/docs/layout.tsx` - Fumadocs DocsLayout with tabs

**Confidence Level:** HIGH for all patterns (based on official documentation and existing working code)
