# Feature Landscape: Documentation Platform Enhancements (v2.1)

**Domain:** AI chat, video tutorials, CLI design, navigation UX for technical documentation
**Researched:** 2026-01-22
**Confidence:** HIGH (verified with AI SDK, Remotion, shadcn CLI, Next.js/Stripe navigation patterns)

## Executive Summary

v2.1 adds four major capabilities to the existing Fumadocs-based documentation platform:

1. **RAG Documentation Chat** - Semantic search and context-aware Q&A over 112 MDX files
2. **Video Tutorials** - Programmatic video generation using Remotion for quickstart/workflow demos
3. **CLI Excellence** - Enhance @datagvat/mcp-installer with shadcn-inspired interactive patterns
4. **Navigation Simplification** - Reduce from 8 tabs to 3 (Docs/API/Try) for clearer information architecture

**Key insight:** These features serve different audiences at different stages. Chat serves exploratory users ("What can this do?"). Videos serve visual learners ("Show me how"). CLI serves installers ("Make it work"). Navigation serves everyone ("Where am I?").

**Existing platform strengths:**
- 112 MDX documentation files already written and working
- Auto-generated tool reference (25 MCP tools) with TypeTable components
- Progressive disclosure (Basic/Advanced tabs) throughout
- Interactive components (Tabs, Steps, Mermaid) battle-tested
- /try page with MCP tool testing infrastructure
- Search button placeholder (ready for enhancement)

## Table Stakes

Features users expect from modern documentation platforms. Missing these = feature feels incomplete or unprofessional.

### RAG Documentation Chat

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Natural language Q&A** | Users ask "How do I search datasets?" not browse docs | Medium | High | AI SDK, embedding model |
| **Context-aware responses** | Answer based on documentation content, not hallucinated | Medium | High | Vector DB, MDX indexing |
| **Source citations** | Link to specific doc pages where answer came from | Low | High | AI SDK sources pattern |
| **Multi-turn conversations** | Follow-up questions without repeating context | Low | Medium | useChat conversation state |
| **Streaming responses** | Show partial answers as they generate | Low | Medium | AI SDK streaming |
| **Error handling** | Graceful fallback when LLM fails or timeout | Low | High | AI SDK error states |

### Video Tutorials

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Quickstart video** (2-3 min) | Visual proof of "install to first query" flow | Medium | High | Remotion, screen recording |
| **Workflow demos** (3-5 min each) | Show common tasks end-to-end | Medium | High | Remotion, real data examples |
| **Synchronized captions** | Accessibility requirement, improves engagement | Medium | High | Remotion caption support |
| **Embedded in docs** | Videos appear inline with written content | Low | Medium | Fumadocs video embedding |
| **Thumbnail previews** | Clear visual cues what video covers | Low | Medium | Static image generation |

### CLI Excellence

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Interactive prompts** | Ask user for config options, don't require flags | Low | High | @clack/prompts |
| **Validation feedback** | Check file paths, MCP config before proceeding | Low | High | Node fs, JSON validation |
| **Clear progress indicators** | Show what's happening during installation | Low | Medium | @clack/prompts spinners |
| **Success confirmation** | Explicit "Installation complete" with next steps | Low | High | Console formatting |
| **Error messages** | User-friendly errors with actionable fixes | Medium | High | Error handling patterns |

### Navigation Simplification

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **3 main tabs** (Docs/API/Try) | Standard pattern (Next.js, Stripe, AI SDK) | Low | High | Fumadocs meta.json |
| **Consistent tab order** | Predictable: learn → reference → try | Low | Medium | Navigation structure |
| **No duplicate titles** | Don't show "Getting Started" in both nav and H1 | Low | Medium | MDX frontmatter cleanup |
| **Clear hierarchy** | Subsections visible in sidebar | Low | High | Fumadocs built-in |
| **Breadcrumbs** | Location awareness in deep hierarchies | Low | Medium | Fumadocs built-in |

## Differentiators

Features that set this documentation apart. Not expected, but create exceptional user experience.

### RAG Documentation Chat

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Code generation** | Generate working MCP queries from natural language | High | High | P1 |
| **Troubleshooting assistant** | Diagnose errors from error messages | Medium | High | P1 |
| **Semantic search fallback** | If chat fails, fall back to search results | Low | Medium | P2 |
| **Query history** | Show past conversations for reference | Low | Medium | P2 |
| **Suggested questions** | Pre-populate common queries as buttons | Low | High | P1 |
| **Domain-aware** | Understand MCP terminology (tools, resources, prompts) | Medium | High | P1 |
| **Multi-doc synthesis** | Combine info from multiple pages ("Compare search vs semantic_search") | High | High | P2 |

**Code Generation Detail:**
- User: "Find health datasets from Vienna"
- Chat: Generates Claude Desktop query with exact tool invocation
- Shows both natural language and MCP tool syntax
- Explains parameters used

**Troubleshooting Detail:**
- User pastes error: "Tool not found: search_dataset"
- Chat: Identifies typo (missing 's'), links to correct tool docs
- Suggests checking MCP server status

**Domain-Aware Detail:**
- Understands "tool" means MCP tool, not generic software tool
- Knows difference between resources (static content) and tools (dynamic queries)
- Can explain FastMCP-specific patterns

### Video Tutorials

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Programmatic generation** | Update videos by changing code, not re-filming | High | High | P0 |
| **Dynamic data** | Show real data.gv.at datasets, not mock data | Medium | High | P1 |
| **Code highlighting sync** | Highlight code lines as narration explains them | High | Medium | P2 |
| **Interactive timestamps** | Click timestamp to jump to section | Low | Medium | P2 |
| **Multiple formats** | MP4 for embedding, GIF for previews | Low | Low | P2 |

**Programmatic Generation Value:**
- When MCP protocol updates, regenerate videos automatically
- Consistent visual style across all videos
- Version-specific videos (v1.2 vs v2.0)

**Recommended Video Types:**

| Video | Length | Content | Priority |
|-------|--------|---------|----------|
| **Quickstart** | 2-3 min | Install CLI → configure → first query → success | P0 |
| **Search workflow** | 3-4 min | Text search → filters → quality ranking → preview | P1 |
| **Data preview** | 2-3 min | Find dataset → inspect schema → preview rows | P1 |
| **Quality assessment** | 3-4 min | Get metrics → interpret scores → compare datasets | P1 |
| **Semantic exploration** | 4-5 min | Natural language query → related datasets → theme drill-down | P1 |
| **Architecture overview** | 5-7 min | MCP protocol → FastMCP → Piveau API → data flow | P2 |

### CLI Excellence

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Diff preview** | Show file changes before applying | Medium | High | P1 |
| **Update command** | Check for new versions, update server | Medium | High | P1 |
| **Config validation** | Verify MCP config.json structure | Low | High | P0 |
| **Multiple install modes** | npx (global), local project, Docker | High | Medium | P2 |
| **Rollback** | Undo broken installation | Medium | Low | P3 |
| **Health check** | Test MCP server connectivity | Low | High | P1 |

**Diff Preview Pattern (shadcn-inspired):**
```
npx @datagvat/mcp-installer@latest

? Where is your Claude Desktop config? ~/Library/Application Support/Claude/config.json
? Install mode: Add to existing config

Preview changes:

 config.json
 + "datagvat": {
 +   "command": "python",
 +   "args": ["-m", "app"],
 +   "env": {}
 + }

? Apply changes? (Y/n)
```

**Update Command:**
```
npx @datagvat/mcp-installer@latest update

Checking for updates...
Found new version: 2.1.0 (current: 2.0.0)

What's new:
- RAG documentation chat
- Video tutorials
- Enhanced CLI

? Update now? (Y/n)
```

**Health Check:**
```
npx @datagvat/mcp-installer@latest health

Checking MCP server status...
✓ Config file found
✓ Python environment available
✓ Server responds to ping
✓ 25 tools registered

Status: Healthy
```

### Navigation Simplification

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Smart tab icons** | Visual cues (Book/Code/Wrench for Docs/API/Try) | Low | Medium | P1 |
| **Persistent state** | Remember which tab/page user was on | Low | Medium | P2 |
| **Mobile optimization** | Collapsible navigation for small screens | Low | High | P0 |
| **Deep linking** | Direct URLs to subsections | Low | High | P0 |

**Current 8 Tabs (v2.0):**
1. Docs (home)
2. Getting Started
3. Guides
4. Examples
5. Workflows
6. Advanced
7. Reference
8. Try

**Proposed 3 Tabs (v2.1):**
1. **Docs** - All learning content (Getting Started → Guides → Examples → Workflows → Advanced)
2. **API** - Tool reference (25 tools, auto-generated)
3. **Try** - Interactive testing page

**Why 3 is better:**
- **Cognitive load:** Users scan 3 tabs vs 8
- **Clear purpose:** Learn / Reference / Try maps to user journey
- **Industry standard:** Next.js (3 tabs), Stripe (4 tabs), AI SDK (3 tabs)
- **Mobile friendly:** Fits in mobile nav without scrolling

## Anti-Features

Features to deliberately NOT build. Common mistakes that bloat scope without user value.

### Anti-Feature 1: Real-Time Collaboration (Chat)

**What:** Multiple users in same chat session
**Why NOT:**
- Documentation chat is single-user by nature
- Complexity: WebSocket infrastructure, state sync, auth
- Marginal value: Users read docs solo, not in groups
- Fumadocs is static site (SSG), not real-time platform

**What to do instead:**
- Focus on individual user experience
- Fast, accurate responses for single user
- Share chat links (future: permalink to conversation)

### Anti-Feature 2: Video Commenting/Annotations

**What:** Users add comments at specific video timestamps
**Why NOT:**
- Maintenance burden: Moderation, spam, outdated comments
- GitHub Discussions already exists for Q&A
- Videos update frequently, comments become stale
- Adds complexity to video player embed

**What to do instead:**
- Link to GitHub Discussions for questions
- Add "Was this helpful?" feedback button
- Use YouTube if community comments are truly needed (defer to v2.2+)

### Anti-Feature 3: CLI GUI Wrapper

**What:** Electron app with visual UI for MCP installation
**Why NOT:**
- Target audience (developers) prefer CLI
- Maintenance: Two UIs (CLI + GUI) to keep in sync
- Bundle size: Electron adds 100MB+ download
- CLI is faster for automation (scripts, CI/CD)

**What to do instead:**
- Make CLI so good GUI is unnecessary
- Clear prompts, colored output, progress bars
- If GUI needed later, separate project (mcp-installer-gui)

### Anti-Feature 4: Chat Memory Persistence (Cross-Session)

**What:** Store chat history in database, restore on return
**Why NOT:**
- Privacy concerns: User queries may contain sensitive info
- Complexity: Database, auth, data retention policies
- Marginal value: Doc questions are ephemeral, not ongoing projects
- Fumadocs is static site, adding backend is scope creep

**What to do instead:**
- Store in browser localStorage (client-only)
- Expire after 7 days
- Clear button prominently visible
- Never send history to server

### Anti-Feature 5: Multi-Language Video Narration

**What:** Record videos in German + English with voice-over
**Why NOT:**
- High production cost: 2x recording, translation, sync
- Text captions are faster to translate
- Programmatic voice synthesis is low quality (uncanny valley)
- German translation deferred to v2.3+ anyway

**What to do instead:**
- English narration with German/English captions
- Use clear, simple English (easy to auto-translate)
- Fumadocs language switcher applies to captions

### Anti-Feature 6: CLI Plugin System

**What:** Allow third-party plugins to extend mcp-installer
**Why NOT:**
- Scope creep: Turns simple installer into framework
- Security: User-installed code runs during setup
- Maintenance: Breaking changes impact ecosystem
- Current CLI is 20% of codebase, plugins double complexity

**What to do instead:**
- Make core installer excellent at one thing
- Document how to fork for custom needs
- Provide clear extension points (config hooks)

### Anti-Feature 7: Video Editing in Browser

**What:** Remotion editor embedded in docs for user video generation
**Why NOT:**
- Remotion Studio is development tool, not user-facing
- Requires Node.js environment (can't run in browser)
- Users want to watch videos, not create them
- Creates expectation we support custom video generation

**What to do instead:**
- Pre-render videos, host as static MP4
- Document how we make videos (for contributors)
- Keep Remotion tooling in separate /video directory

## Feature Dependencies

```
Foundation (Existing v2.0):
├── 112 MDX documentation files
├── Auto-generated tool reference
├── Progressive disclosure (Tabs)
├── Interactive components (Steps, Mermaid)
├── /try page infrastructure
└── Search button placeholder

RAG Documentation Chat:
├── Depends on: MDX content (exists)
├── Depends on: Vercel AI SDK (new dependency)
├── Depends on: Embedding model (OpenAI, Cohere, or local)
├── Depends on: Vector store (Pinecone, Supabase, or file-based)
├── Enables: Code generation feature
├── Enables: Troubleshooting assistant
└── Enables: Semantic search fallback

Video Tutorials:
├── Depends on: Remotion (new dependency)
├── Depends on: Screen recording tools (OBS, QuickTime)
├── Depends on: Hosting (Vercel blob, YouTube, or S3)
├── Independent of: Other v2.1 features
└── Enhances: Getting Started documentation

CLI Excellence:
├── Depends on: @clack/prompts (new dependency)
├── Depends on: Existing @datagvat/mcp-installer (exists)
├── Depends on: Node fs, path, JSON validation
├── Independent of: Documentation site
└── Enhances: Installation experience

Navigation Simplification:
├── Depends on: MDX frontmatter cleanup
├── Depends on: Fumadocs meta.json restructure
├── Blocks: Nothing (can proceed immediately)
└── Enables: Clearer information architecture for chat/videos
```

## Recommended Feature Prioritization

### Phase 1: Navigation Simplification (Quick Win)
**Why first:** Unblocks clear structure for chat and videos to integrate into.

1. Restructure from 8 tabs to 3 (Docs/API/Try)
2. Clean up duplicate titles in MDX frontmatter
3. Update meta.json files for new hierarchy
4. Add tab icons (Book/Code/Wrench)
5. Test mobile navigation

**Estimated effort:** 1-2 days
**Risk:** Low (mostly config changes)

### Phase 2: CLI Excellence (High Value, Low Risk)
**Why second:** Independent of documentation site, immediate user value.

1. Add @clack/prompts for interactive setup
2. Implement diff preview for config changes
3. Add config validation before installation
4. Add health check command
5. Add update command

**Estimated effort:** 3-4 days
**Risk:** Low (isolated to CLI codebase)

### Phase 3: RAG Documentation Chat (Core Value)
**Why third:** Requires navigation structure (Phase 1) to be clear.

1. Set up AI SDK + embedding model
2. Index MDX content to vector store
3. Implement basic Q&A with citations
4. Add suggested questions
5. Add code generation feature
6. Add troubleshooting assistant

**Estimated effort:** 5-7 days
**Risk:** Medium (new dependencies, LLM behavior unpredictable)

### Phase 4: Video Tutorials (Polish)
**Why last:** Enhances documentation but not blocking other features.

1. Set up Remotion project structure
2. Create quickstart video (2-3 min)
3. Create search workflow video (3-4 min)
4. Create data preview video (2-3 min)
5. Add captions and embed in docs

**Estimated effort:** 7-10 days
**Risk:** High (production quality, recording/editing time)

## Implementation Patterns

### RAG Chat Architecture

**Tech stack:**
- **Frontend:** Vercel AI SDK `useChat` hook (already React/Next.js)
- **Backend:** Next.js API route `/api/chat` with streaming
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensions)
- **Vector store:** Simple file-based JSON (100KB for 112 docs) or Supabase pgvector
- **LLM:** OpenAI GPT-4 or Claude 3.5 Sonnet via AI SDK

**Data flow:**
```
User types question
  → useChat sends to /api/chat
  → Embed question with OpenAI
  → Query vector store (top 5 chunks)
  → Construct prompt: system + context + question
  → Stream response from LLM
  → Parse source citations
  → Display with links back to docs
```

**Indexing strategy:**
```typescript
// Pre-build script: index-docs.ts
for each MDX file:
  1. Parse frontmatter + content
  2. Split into chunks (500 tokens overlap 50)
  3. Generate embedding for each chunk
  4. Store: { embedding, text, source_url, title }
  5. Write to .embeddings/index.json
```

**Citation pattern (AI SDK):**
```typescript
// Server: /api/chat/route.ts
import { streamText } from 'ai'

const result = await streamText({
  model: openai('gpt-4-turbo'),
  messages: [
    { role: 'system', content: systemPrompt },
    ...messages
  ],
  experimental_providerMetadata: {
    sources: relevantChunks.map(c => ({
      type: 'source-url',
      url: c.source_url,
      title: c.title
    }))
  }
})

return result.toUIMessageStreamResponse({
  sendSources: true
})

// Client: components/chat.tsx
{message.parts?.filter(p => p.type === 'source-url').map(source => (
  <a href={source.url}>{source.title}</a>
))}
```

### Video Production Workflow

**Remotion project structure:**
```
/video
├── package.json (remotion deps)
├── remotion.config.ts
├── src/
│   ├── Root.tsx (composition registry)
│   ├── Quickstart.tsx (2-3 min)
│   ├── SearchWorkflow.tsx (3-4 min)
│   ├── DataPreview.tsx (2-3 min)
│   └── components/
│       ├── CodeBlock.tsx (syntax highlighting)
│       ├── Terminal.tsx (CLI simulation)
│       └── BrowserFrame.tsx (website recording)
└── public/
    ├── recordings/ (OBS screen captures)
    └── assets/ (logos, icons)
```

**Composition example:**
```typescript
// src/Quickstart.tsx
export const Quickstart: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f1419' }}>
      {/* 0-5s: Title card */}
      {frame < 5 * fps && <TitleCard text="Quickstart: 0 to First Query" />}

      {/* 5-30s: CLI installation */}
      {frame >= 5 * fps && frame < 30 * fps && (
        <Terminal
          command="npx @datagvat/mcp-installer@latest"
          output={installOutput}
          delay={frame - 5 * fps}
        />
      )}

      {/* 30-90s: Claude Desktop configuration */}
      {frame >= 30 * fps && frame < 90 * fps && (
        <VideoRecording
          src="recordings/claude-desktop-config.mp4"
          startFrom={frame - 30 * fps}
        />
      )}

      {/* 90-120s: First query success */}
      {frame >= 90 * fps && (
        <VideoRecording
          src="recordings/first-query.mp4"
          startFrom={frame - 90 * fps}
        />
      )}
    </AbsoluteFill>
  )
}

registerRoot(() => <Quickstart />, 'Quickstart', {
  durationInFrames: 120 * 30, // 120 seconds at 30fps
  fps: 30,
  width: 1920,
  height: 1080
})
```

**Render pipeline:**
```bash
# Development: Preview in browser
npm run remotion

# Production: Render to MP4
npx remotion render Quickstart out/quickstart.mp4 --codec h264

# Captions: Generate SRT from script
npx remotion render Quickstart out/quickstart.srt --codec captions

# Optimize: Compress for web
ffmpeg -i out/quickstart.mp4 -vcodec h264 -crf 28 out/quickstart-web.mp4
```

### CLI Interactive Patterns

**@clack/prompts usage:**
```typescript
import * as p from '@clack/prompts'
import { readFile, writeFile } from 'fs/promises'

async function install() {
  p.intro('Austria MCP Installer')

  // Detect config path
  const configPath = await p.text({
    message: 'Where is your Claude Desktop config?',
    initialValue: getDefaultConfigPath(),
    validate: (value) => {
      if (!existsSync(value)) return 'File not found'
    }
  })

  // Choose install mode
  const mode = await p.select({
    message: 'How should we install?',
    options: [
      { value: 'add', label: 'Add to existing config', hint: 'Recommended' },
      { value: 'replace', label: 'Replace entire config', hint: 'Dangerous' },
      { value: 'preview', label: 'Preview changes only' }
    ]
  })

  // Show diff
  const existingConfig = JSON.parse(await readFile(configPath, 'utf-8'))
  const newConfig = { ...existingConfig, mcpServers: { ...existingConfig.mcpServers, datagvat: {...} }}

  p.note(formatDiff(existingConfig, newConfig), 'Preview changes')

  // Confirm
  const shouldApply = await p.confirm({
    message: 'Apply these changes?'
  })

  if (shouldApply) {
    const spinner = p.spinner()
    spinner.start('Installing...')

    await writeFile(configPath, JSON.stringify(newConfig, null, 2))

    spinner.stop('Installation complete!')
  }

  p.outro('Restart Claude Desktop to activate the MCP server.')
}
```

**Diff formatting:**
```typescript
function formatDiff(before: any, after: any): string {
  const beforeStr = JSON.stringify(before, null, 2)
  const afterStr = JSON.stringify(after, null, 2)

  // Use diff library or simple line-by-line comparison
  const diff = diffLines(beforeStr, afterStr)

  return diff.map(part => {
    if (part.added) return chalk.green('+ ' + part.value)
    if (part.removed) return chalk.red('- ' + part.value)
    return chalk.gray('  ' + part.value)
  }).join('\n')
}
```

### Navigation Restructuring

**Before (8 tabs in meta.json files):**
```
docs/content/docs/
├── index.mdx (Docs)
├── getting-started/meta.json (Getting Started tab)
├── guides/meta.json (Guides tab)
├── examples/meta.json (Examples tab)
├── workflows/meta.json (Workflows tab)
├── advanced/meta.json (Advanced tab)
├── reference/meta.json (Reference tab)
└── try/meta.json (Try tab)
```

**After (3 tabs):**
```
docs/content/docs/
├── index.mdx (Docs tab root)
├── getting-started/ (subsection)
├── guides/ (subsection)
├── examples/ (subsection)
├── workflows/ (subsection)
├── advanced/ (subsection)
├── api/
│   └── meta.json (API tab root: true)
└── try/
    └── meta.json (Try tab root: true)
```

**meta.json changes:**
```json
// Before: docs/content/docs/getting-started/meta.json
{
  "title": "Getting Started",
  "icon": "Rocket",
  "root": true  // Creates separate tab
}

// After: Same file
{
  "title": "Getting Started",
  "icon": "Rocket"
  // No "root": true - becomes subsection of Docs tab
}

// New: docs/content/docs/api/meta.json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "API",
  "description": "Complete tool reference",
  "icon": "Code",
  "root": true,  // Creates API tab
  "pages": ["---[Wrench]Tools---", "...tools"]
}
```

**Frontmatter cleanup:**
```mdx
<!-- Before: Duplicate title -->
---
title: Getting Started
---

# Getting Started

Content...

<!-- After: Title only in frontmatter -->
---
title: Getting Started
---

Content starts immediately...
```

## Success Metrics

### RAG Chat
- [ ] Answers 80% of questions accurately (validated by manual review of 50 test questions)
- [ ] Provides source citations for 100% of factual responses
- [ ] Responds within 3 seconds for simple queries
- [ ] Handles 95% of error cases gracefully (no crashes)
- [ ] Zero hallucinations about tools that don't exist

### Video Tutorials
- [ ] 5 videos produced: Quickstart + 4 workflows
- [ ] All videos 2-5 minutes (no 10+ minute marathons)
- [ ] 100% captioned (English + German SRT files)
- [ ] Embedded in relevant doc pages with thumbnails
- [ ] Updated when MCP protocol changes (programmatic regeneration works)

### CLI Excellence
- [ ] Interactive prompts replace 80% of CLI flags
- [ ] Diff preview shows file changes before applying
- [ ] Health check validates full MCP stack
- [ ] Update command works for major version bumps
- [ ] Installation success rate >95% (measured by telemetry opt-in)

### Navigation
- [ ] 3 tabs visible without scrolling on mobile
- [ ] Deep links work to all pages
- [ ] No duplicate titles in nav vs page content
- [ ] Users find Getting Started in <10 seconds (task timing study)

## Open Questions

### RAG Chat
1. **Embedding model:** OpenAI text-embedding-3-small ($0.02/1M tokens) vs Cohere embed-v3 vs local model?
   - **Action:** Benchmark quality on 20 test queries; check cost for 112 docs (est. 100K tokens = $0.002)

2. **Vector store:** File-based JSON (simple, 100KB) vs Supabase pgvector (scalable) vs Pinecone (managed)?
   - **Action:** Start with file-based; migrate if index exceeds 1MB or search >500ms

3. **Chat scope:** Only documentation or also MCP server logs (troubleshooting)?
   - **Decision:** Documentation only for v2.1; logs in v2.2 if needed

4. **Rate limiting:** Prevent abuse of LLM API?
   - **Action:** 10 queries/minute per IP; use Vercel KV for tracking

### Video Tutorials
1. **Hosting:** Vercel blob storage (paid) vs YouTube unlisted vs self-hosted CDN?
   - **Action:** Start with Vercel blob (simple, fast); YouTube for public reach in v2.2

2. **Recording method:** Screen recording (real) vs Remotion-rendered terminal (fake but controllable)?
   - **Decision:** Hybrid - Remotion for CLI, screen recordings for Claude Desktop

3. **Narration:** Human voice (expensive) vs text-to-speech (synthetic) vs silent with music?
   - **Decision:** Silent with captions + background music for v2.1; human narration if budget allows v2.2

4. **Update frequency:** Re-render on every release or only major versions?
   - **Decision:** Major versions only (v2.x → v3.0); minor versions update docs not videos

### CLI Excellence
1. **Config backup:** Auto-backup before modifying config.json?
   - **Decision:** YES - Create config.json.backup with timestamp before any writes

2. **Multiple MCP servers:** Handle configs with existing MCP servers gracefully?
   - **Decision:** YES - Only add/update datagvat entry, preserve others

3. **Telemetry:** Track installation success/failure for debugging?
   - **Decision:** Opt-in only with explicit consent; use PostHog or simple analytics

4. **Auto-update:** Check for updates on every run?
   - **Decision:** NO for v2.1 (annoying); explicit `update` command only

## Sources

**HIGH Confidence (Official Documentation):**
- Vercel AI SDK Chat: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- Vercel AI SDK Sources: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot (citation patterns)
- Remotion Documentation: https://www.remotion.dev/docs
- shadcn CLI: https://ui.shadcn.com (CLI features and patterns)
- Next.js Docs Navigation: https://nextjs.org/docs (3-section pattern)
- @clack/prompts: https://github.com/natemoo-re/clack (interactive CLI patterns)

**MEDIUM Confidence (Verified Patterns):**
- Documentation navigation patterns (3-4 tabs standard across Next.js, Stripe, AI SDK)
- Video tutorial length (2-5 minutes optimal for engagement based on training data)
- RAG architecture (vector search + LLM generation well-established pattern)

**Existing Project Context (HIGH Confidence):**
- v2.0 Documentation: 112 MDX files, 8 tabs, progressive disclosure
- Existing CLI: @datagvat/mcp-installer basic implementation
- Search button: Placeholder in header ready for enhancement
- /try page: Infrastructure for MCP tool testing

**Notes:**
- AI SDK sources feature is current (2026 documentation fetched)
- Remotion patterns verified with official docs
- CLI patterns inspired by shadcn (industry-leading CLI UX)
- Navigation simplification based on Next.js, Stripe, AI SDK analysis (all use 3-4 main sections)
