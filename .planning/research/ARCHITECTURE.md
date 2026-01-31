# Architecture Research: Interactive Data Playground

**Domain:** AI-powered dataset discovery and exploration
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

This document describes the architecture for adding an interactive data playground to the existing documentation site. The playground integrates TWO MCP servers (data.gv.at + Daytona) with ONE chat interface, enabling users to discover datasets and execute code to explore them immediately.

**Key architectural decisions:**
1. **Multiple MCP Integration:** Merge tools from HTTP (data.gv.at) and stdio (Daytona) MCP servers using AI SDK 6 tool spreading pattern
2. **Message Persistence:** Store chat history in Neon Postgres using AI SDK's UIMessage format with parts array (JSONB)
3. **Sandbox Execution:** Daytona workspaces for isolated Python/R code execution with user approval workflow
4. **Inline Visualizations:** Base64-encoded images embedded in tool result parts for immediate rendering

## Current Architecture Baseline

### Existing Infrastructure

| Layer | Technology | Location | Purpose |
|-------|-----------|----------|---------|
| Framework | Next.js 16.1.3 App Router | `docs/` | SSR, routing, API routes |
| AI Integration | Vercel AI SDK 6.0.64 | `docs/app/api/chat/` | Chat streaming (existing RAG chat) |
| AI Gateway | Vercel AI Gateway | `@ai-sdk/gateway` | LLM provider abstraction |
| MCP Server | FastMCP (data.gv.at) | `mcp/` | Dataset discovery tools (HTTP transport) |
| Runtime | Bun + Node 18+ | Root | Scripts, dev server |
| UI Components | Fumadocs + shadcn/ui | `docs/components/` | Chat interface, dialogs |

### Existing Components (To Extend)

```
docs/
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── route.ts                 # MODIFY: Add Daytona MCP, persistence
│   │       └── schema.ts                # Existing: Request validation
│   ├── [lang]/
│   │   └── chat/
│   │       └── page.tsx                 # MODIFY: Load messages from DB
├── components/
│   ├── chat.tsx                         # MODIFY: Visualization rendering
│   ├── messages.tsx                     # MODIFY: Tool approval UI
│   └── multimodal-input.tsx             # Existing: User input
├── lib/
│   └── ai/
│       ├── providers.ts                 # Existing: AI Gateway setup
│       └── models.ts                    # Existing: Model selection
mcp/
├── app/
│   └── server.py                        # Existing: FastMCP server (unchanged)
```

### Existing Data Flow

**Current RAG Chat Flow:**
```
User → Chat UI (useChat) → POST /api/chat → streamText() → data.gv.at MCP tools → Stream response
```

**NEW Interactive Playground Flow:**
```
User → Chat UI → POST /api/chat → getAllTools() (data.gv.at + Daytona)
                                 → streamText() with merged tools
                                 → Tool approval (code execution)
                                 → Daytona sandbox execution
                                 → Visualization rendering
                                 → Persist to Postgres → Stream response
```

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐     │
│  │  Chat UI     │  │  Visualization │  │  Code Approval UI   │     │
│  │  (useChat)   │  │  Renderer      │  │  (Tool Parts)       │     │
│  └──────┬───────┘  └────────┬───────┘  └──────────┬──────────┘     │
│         │                   │                      │                │
├─────────┴───────────────────┴──────────────────────┴────────────────┤
│                        APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              /api/chat Route Handler                         │    │
│  │  • Parses useChat requests                                   │    │
│  │  • Merges tools from multiple MCP servers                    │    │
│  │  • Streams AI responses via streamText()                     │    │
│  │  • Persists messages via onFinish callback                   │    │
│  └──────────┬───────────────────────────────┬────────────────────┘  │
│             │                               │                       │
│  ┌──────────▼──────────┐       ┌───────────▼────────────┐          │
│  │  MCP Client Manager │       │  Database Manager      │          │
│  │  • data.gv.at MCP   │       │  • Message persistence │          │
│  │  • Daytona MCP      │       │  • UIMessage format    │          │
│  │  • Tool merging     │       │  • JSONB storage       │          │
│  └──────────┬──────────┘       └────────────────────────┘          │
│             │                                                        │
├─────────────┴────────────────────────────────────────────────────────┤
│                        INTEGRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ data.gv.at MCP   │  │   Daytona MCP    │  │  Neon Postgres   │  │
│  │ (HTTP transport) │  │ (stdio/CLI)      │  │  (serverless)    │  │
│  │ • Dataset tools  │  │ • Code execution │  │  • Chat storage  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
                    ┌──────────┴───────────┐
                    │  Vercel AI Gateway   │
                    │  (LLM provider)      │
                    └──────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Integration Pattern |
|-----------|----------------|---------------------|
| **Chat UI** | Renders message stream, tool approvals, visualizations | `useChat()` hook from `@ai-sdk/react`, communicates with `/api/chat` via POST |
| **Visualization Renderer** | Displays inline charts/plots from code execution | Renders base64 images from tool result parts in message.parts array |
| **Code Approval UI** | Shows pending tool calls, captures user approval | Monitors `message.parts` for `state: 'approval-pending'`, calls `addToolApprovalResponse()` |
| **API Route Handler** | Orchestrates AI requests, tool calling, persistence | Next.js Route Handler using AI SDK's `streamText()` and `createUIMessageStream()` |
| **MCP Client Manager** | Initializes and manages multiple MCP clients | Uses `@ai-sdk/mcp` `createMCPClient()` for each server, merges `.tools()` outputs |
| **Database Manager** | Persists and loads chat history | Server actions using `@neondatabase/serverless` Pool, stores UIMessage[] as JSONB |
| **data.gv.at MCP** | Provides dataset discovery/analysis tools | HTTP transport to FastMCP server at existing endpoint |
| **Daytona MCP** | Executes Python/R code in isolated sandboxes | stdio transport spawning `daytona` CLI process |
| **Neon Postgres** | Stores chat messages, executions, metadata | Serverless driver in Server Actions/API routes |
| **Vercel AI Gateway** | Routes LLM requests, handles provider switching | Configured via `gateway.languageModel()` in providers.ts |

## Recommended Project Structure

```
docs/                           # Existing Next.js docs site
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts       # MODIFIED: Add Daytona MCP, persistence
│   │   │   └── schema.ts      # Existing: Request validation
│   ├── [lang]/
│   │   ├── chat/
│   │   │   ├── page.tsx       # MODIFIED: Load messages from DB
│   │   │   └── layout.tsx     # Existing: Chat layout
├── components/
│   ├── chat.tsx               # MODIFIED: Add visualization rendering
│   ├── messages.tsx           # MODIFIED: Render image parts, code approval
│   ├── multimodal-input.tsx   # Existing: User input
│   └── visualization.tsx      # NEW: Base64 image display component
├── lib/
│   ├── ai/
│   │   ├── providers.ts       # Existing: Vercel AI Gateway setup
│   │   ├── models.ts          # Existing: Model selection
│   │   └── mcp-clients.ts     # NEW: Initialize both MCP servers
│   ├── db/
│   │   ├── client.ts          # NEW: Neon Pool configuration
│   │   ├── schema.ts          # NEW: Database schema types
│   │   └── queries.ts         # NEW: createChat, loadChat, saveChat
│   └── sandbox/
│       └── daytona.ts         # NEW: Daytona workspace management helpers
mcp/                            # Existing FastMCP server (unchanged)
├── app/
│   ├── server.py              # Existing: data.gv.at MCP server
│   └── tools/                 # Existing: Dataset tools
```

### Structure Rationale

- **lib/ai/mcp-clients.ts**: Centralizes MCP client initialization, preventing duplicate connections and enabling tool merging strategy
- **lib/db/**: Separates database concerns from API routes, enabling reuse across Server Actions and Route Handlers
- **lib/sandbox/**: Isolates Daytona-specific logic (workspace lifecycle, CLI wrapping) for testability
- **components/visualization.tsx**: Dedicated component for rendering code execution outputs, handles base64 decoding and error states
- **No changes to mcp/**: Existing FastMCP server continues running unchanged, accessed via HTTP transport

---

## Architectural Patterns

### Pattern 1: Multiple MCP Server Integration

**What:** Merge tools from multiple MCP servers (data.gv.at + Daytona) into a single `streamText()` call.

**When to use:** When a chat interface needs access to tools from different domains (dataset discovery + code execution).

**Trade-offs:**
- **Pro**: Single unified AI context, model can coordinate across tool types
- **Pro**: Simple client-side implementation (one useChat hook)
- **Con**: Both MCP servers must be running before any chat request
- **Con**: Tool name conflicts require namespacing

**Example:**
```typescript
// lib/ai/mcp-clients.ts
import { createMCPClient } from '@ai-sdk/mcp';

// HTTP transport for existing FastMCP server
const datagvatClient = createMCPClient({
  transport: {
    type: 'http',
    url: 'https://data-gv-at.fastmcp.app/mcp',
    headers: { Authorization: `Bearer ${process.env.DATAGVAT_MCP_TOKEN}` },
  },
});

// stdio transport for Daytona CLI
const daytonaClient = createMCPClient({
  transport: {
    type: 'stdio',
    command: 'daytona',
    args: ['serve'], // Assumes Daytona provides MCP server mode
    env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
  },
});

// Merge tools from both servers
export async function getAllTools() {
  const [datagvatTools, daytonaTools] = await Promise.all([
    datagvatClient.tools(),
    daytonaClient.tools(),
  ]);

  return {
    ...datagvatTools,
    ...daytonaTools,
  };
}

// app/api/chat/route.ts
import { streamText } from 'ai';
import { getAllTools } from '@/lib/ai/mcp-clients';

const result = streamText({
  model: getLanguageModel(selectedChatModel),
  messages: modelMessages,
  tools: await getAllTools(), // Merged tools from both MCP servers
});
```

### Pattern 2: Message Persistence with Parts Array

**What:** Store chat history in Postgres using AI SDK's `UIMessage` format with `parts` array, capturing text, tool calls, and results.

**When to use:** When chat sessions need to persist across page refreshes or for analytics/debugging.

**Trade-offs:**
- **Pro**: Exact reproduction of UI state (including partial messages, tool states)
- **Pro**: JSONB storage enables querying specific message types or tool invocations
- **Con**: Larger storage footprint than plain text (mitigated by Postgres compression)
- **Con**: Must validate tools on load to prevent stale tool call schemas

**Example:**
```typescript
// lib/db/schema.ts
export interface Chat {
  id: string;
  created_at: Date;
  updated_at: Date;
  messages: UIMessage[]; // Stored as JSONB
}

// lib/db/queries.ts
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }) {
  await pool.query(
    `INSERT INTO chats (id, messages, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET messages = $2, updated_at = NOW()`,
    [chatId, JSON.stringify(messages)]
  );
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const result = await pool.query('SELECT messages FROM chats WHERE id = $1', [id]);
  return result.rows[0]?.messages || [];
}

// app/api/chat/route.ts
import { createUIMessageStreamResponse } from 'ai';
import { saveChat, loadChat } from '@/lib/db/queries';

export async function POST(request: Request) {
  const { id, message, messages } = requestBody;

  // Load previous messages for continuation
  const previousMessages = messages || await loadChat(id);
  const allMessages = [...previousMessages, message];

  return createUIMessageStreamResponse({
    stream,
    onFinish: ({ messages: finalMessages }) => {
      saveChat({ chatId: id, messages: finalMessages }); // Persist on completion
    },
  });
}
```

### Pattern 3: Sandbox Execution with User Approval

**What:** Pause AI execution when code tools are invoked, render approval UI, resume after user confirms.

**When to use:** When executing untrusted code (AI-generated Python/R) in sandboxes requires explicit user consent.

**Trade-offs:**
- **Pro**: Security-first pattern prevents arbitrary code execution
- **Pro**: AI SDK `tool-use-parts` built-in support for approval workflow
- **Con**: Adds latency to conversation flow (user must approve each execution)
- **Con**: Requires careful UX to avoid approval fatigue

**Example:**
```typescript
// app/api/chat/route.ts
const result = streamText({
  model: getLanguageModel(selectedChatModel),
  messages: modelMessages,
  tools: {
    ...datagvatTools,
    execute_python: tool({
      description: 'Execute Python code in Daytona sandbox',
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
      }),
      // No execute function - requires approval
    }),
  },
});

// components/messages.tsx
export function Messages({ messages, addToolApprovalResponse }) {
  return messages.map(message =>
    message.parts.map(part => {
      if (part.type === 'tool-use' && part.state === 'approval-pending') {
        return (
          <CodeApprovalCard
            code={part.args.code}
            onApprove={() => addToolApprovalResponse({
              messageId: message.id,
              partId: part.id,
              approval: { approved: true },
            })}
            onDeny={() => addToolApprovalResponse({
              messageId: message.id,
              partId: part.id,
              approval: { approved: false },
            })}
          />
        );
      }
      // Render approved executions
      if (part.type === 'tool-result' && part.toolName === 'execute_python') {
        return <VisualizationRenderer result={part.result} />;
      }
    })
  );
}

// lib/sandbox/daytona.ts - Called after approval
export async function executePythonInDaytona(code: string) {
  const sandbox = await daytona.create({ language: 'python' });
  try {
    const result = await sandbox.process.code_run(code);
    // Extract base64 images from matplotlib output
    const images = extractBase64Images(result.stdout);
    return { output: result.stdout, images, exitCode: result.exit_code };
  } finally {
    await sandbox.delete();
  }
}
```

### Pattern 4: Inline Visualization Rendering

**What:** Render base64-encoded chart images directly in chat messages from code execution results.

**When to use:** When code execution produces visualizations (matplotlib, ggplot2) that should display inline.

**Trade-offs:**
- **Pro**: No external storage needed (images embedded in message parts)
- **Pro**: Works offline once message loads
- **Con**: Increases message payload size (mitigated by compression)
- **Con**: Base64 encoding overhead (~33% size increase vs binary)

**Example:**
```typescript
// components/visualization.tsx
export function VisualizationRenderer({ result }: { result: ToolResult }) {
  const { images, output } = result;

  return (
    <div className="rounded border p-4">
      {images.map((base64, i) => (
        <img
          key={i}
          src={`data:image/png;base64,${base64}`}
          alt={`Visualization ${i+1}`}
          className="max-w-full h-auto"
        />
      ))}
      <pre className="text-xs mt-2 text-muted-foreground">{output}</pre>
    </div>
  );
}

// lib/sandbox/daytona.ts
function extractBase64Images(stdout: string): string[] {
  // Matplotlib configured with: plt.savefig(sys.stdout.buffer, format='png')
  // Output contains base64-encoded PNG after magic marker
  const marker = '--- PLOT_START ---';
  const segments = stdout.split(marker);
  return segments.slice(1).map(seg => seg.trim().split('\n')[0]);
}
```

---

## Data Flow

### Request Flow: User Message → AI Response

```
[User types message in Chat UI]
    ↓
[useChat sends POST to /api/chat with { message, id, selectedChatModel }]
    ↓
[API route validates request, loads previous messages from Postgres]
    ↓
[getAllTools() fetches tools from data.gv.at + Daytona MCP servers]
    ↓
[streamText() merges tools, sends to Vercel AI Gateway]
    ↓ ← [AI model decides to call tools]
    ↓
[Tool call appears in stream with state: 'approval-pending']
    ↓
[UI renders CodeApprovalCard, awaits user action]
    ↓
[User approves → addToolApprovalResponse() updates part state]
    ↓
[sendAutomaticallyWhen detects approval, sends continuation POST]
    ↓
[API route executes approved tool via Daytona sandbox]
    ↓
[Tool result (output + base64 images) added to message parts]
    ↓
[Stream completes → onFinish callback saves messages to Postgres]
    ↓
[UI renders final message with VisualizationRenderer for images]
```

### State Management: Message Lifecycle

```
[Empty Chat (messages: [])]
    ↓
[User sends message → useChat adds optimistic user message]
    ↓
[Server streams assistant message with reasoning, text, tool-use parts]
    ↓
[Tool-use part state: 'approval-pending' → UI shows approval card]
    ↓
[User approves → part state changes to 'approval-responded']
    ↓
[sendAutomaticallyWhen triggers → sends all messages with updated state]
    ↓
[Server executes tool → adds tool-result part to message]
    ↓
[Server streams final text after tool result]
    ↓
[onFinish → saveChat persists entire message history to Postgres]
```

### Key Data Flows

1. **Tool Merging Flow**: Both MCP clients initialize on first request → tools cached → spread into streamText() → AI sees unified tool set
2. **Approval Flow**: Tool call streamed without execute → part.state='approval-pending' → UI renders approval → user action updates state → continuation request executes tool
3. **Persistence Flow**: useChat maintains messages in memory → onFinish callback triggered on stream completion → saveChat writes JSONB to Postgres → loadChat hydrates on page load
4. **Visualization Flow**: Daytona executes code with matplotlib → captures stdout → extracts base64 PNG → returns in tool-result part → UI decodes and renders

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Vercel AI Gateway** | SDK provider via `gateway.languageModel()` | Configure via environment: `AI_GATEWAY_URL`, handles failover across providers |
| **data.gv.at MCP** | HTTP transport with Bearer token | Existing FastMCP server at `/mcp` endpoint, use `process.env.DATAGVAT_MCP_TOKEN` |
| **Daytona** | stdio transport spawning CLI process | Requires `daytona` CLI installed, API key via `process.env.DAYTONA_API_KEY` |
| **Neon Postgres** | Serverless driver with connection pooling | Use `@neondatabase/serverless` Pool, requires SSL: `sslmode=require` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Chat UI ↔ API Route** | HTTP POST with JSON (DefaultChatTransport) | Custom `prepareSendMessagesRequest` sends only last message or full history based on approval state |
| **API Route ↔ MCP Clients** | In-process async function calls | Clients initialized once, tools fetched per request (consider caching) |
| **API Route ↔ Database** | Direct Pool queries via Server Actions | Avoid in Route Handler body, use `after()` for background persistence |
| **Messages Component ↔ Visualization** | React props passing tool-result parts | Parent filters parts by type, passes only relevant data to child |

---

## New vs. Modified Components

### New Components (Build from Scratch)

| Component | Purpose | Estimated Complexity |
|-----------|---------|---------------------|
| **lib/ai/mcp-clients.ts** | Initialize Daytona MCP client, merge tools | Low (50 LOC) |
| **lib/db/client.ts** | Neon Pool singleton | Low (20 LOC) |
| **lib/db/schema.ts** | TypeScript types for database | Low (30 LOC) |
| **lib/db/queries.ts** | createChat, loadChat, saveChat functions | Medium (100 LOC) |
| **lib/sandbox/daytona.ts** | Workspace lifecycle, base64 extraction | Medium (150 LOC) |
| **components/visualization.tsx** | Render base64 images from tool results | Low (50 LOC) |
| **components/code-approval-card.tsx** | UI for approving/denying code execution | Medium (80 LOC) |

### Modified Components (Extend Existing)

| Component | Changes Required | Integration Points |
|-----------|------------------|-------------------|
| **app/api/chat/route.ts** | Add Daytona MCP client, message persistence, tool approval handling | Import `getAllTools()`, `loadChat()`, `saveChat()` |
| **components/chat.tsx** | Pass addToolApprovalResponse to Messages | Already uses useChat hook, expose approval handler |
| **components/messages.tsx** | Render approval cards, visualization parts | Map over message.parts, conditionally render by part.type and state |
| **app/[lang]/chat/page.tsx** | Load initial messages from database | Replace `initialMessages={[]}` with `loadChat(id)` |

---

## Critical Architecture Decisions

### Decision 1: stdio vs HTTP for Daytona MCP

**Context:** Daytona may support both stdio (CLI wrapper) and HTTP (server mode) transports.

**Recommendation:** Start with **stdio transport**, migrate to HTTP if performance bottleneck.

**Rationale:**
- **stdio**: Simpler initial setup, no separate server process, works immediately with CLI
- **HTTP**: Better for production (connection pooling, lower latency), but requires Daytona MCP server configuration
- **Decision**: Use stdio for MVP, measure latency, migrate to HTTP if >2s per tool call

**Implementation:**
```typescript
// Phase 1: stdio (MVP)
const daytonaClient = createMCPClient({
  transport: {
    type: 'stdio',
    command: 'daytona',
    args: ['serve'], // or whatever CLI command Daytona provides
    env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
  },
});

// Phase 2: HTTP (if needed)
const daytonaClient = createMCPClient({
  transport: {
    type: 'http',
    url: 'http://localhost:3001/mcp',
    headers: { Authorization: `Bearer ${process.env.DAYTONA_API_KEY}` },
  },
});
```

### Decision 2: Message Storage Format

**Context:** UIMessage format includes display metadata (createdAt, id) vs ModelMessage (minimal).

**Recommendation:** Store **UIMessage format** as-is in Postgres.

**Rationale:**
- AI SDK persistence docs recommend UIMessage format
- Includes client-side state (part states, approval responses)
- Enables exact UI reproduction on reload
- JSONB compression mitigates size overhead

**Schema:**
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX idx_chats_messages_gin ON chats USING GIN (messages jsonb_path_ops);
```

### Decision 3: Guest Mode (No Authentication)

**Context:** Requirement states "no authentication (guest mode)".

**Recommendation:** Implement **session-based guest IDs** with TTL.

**Rationale:**
- Prevents abuse: Rate limit by session ID (leverage existing rate limiting middleware)
- Enables persistence: Guest chats expire after 7 days
- Privacy: No PII collected, sessions identified by cookie only

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has('guest-session-id')) {
    response.cookies.set('guest-session-id', generateUUID(), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}

// Cleanup job (Vercel Cron):
// DELETE FROM chats WHERE updated_at < NOW() - INTERVAL '7 days';
```

---

## Build Order Recommendations

### Phase 1: Database Foundation (Week 1)

**Why first:** Persistence layer is foundational for testing subsequent features. Enables iterative development with state preservation.

**Tasks:**
1. Create Neon Postgres database
2. Implement `lib/db/client.ts` (Pool singleton)
3. Implement `lib/db/schema.ts` (TypeScript types)
4. Implement `lib/db/queries.ts` (createChat, loadChat, saveChat)
5. Add persistence to existing `/api/chat` route (onFinish callback)
6. Test: Create chat, reload page, verify messages persist

**Deliverables:**
- Working Postgres connection
- Chat persistence (without new features)
- Database schema and queries

### Phase 2: Daytona MCP Integration (Week 1-2)

**Why second:** Non-breaking addition to existing tools. Can test tool discovery before implementing execution.

**Tasks:**
1. Set up Daytona account, obtain API key
2. Implement `lib/ai/mcp-clients.ts` (initialize both MCP clients)
3. Create `getAllTools()` function to merge tools
4. Modify `/api/chat` route to use merged tools
5. Test: Verify data.gv.at tools still work, confirm Daytona tools appear (even if not yet executable)

**Deliverables:**
- Both MCP clients initialized
- Tools merged successfully
- No breaking changes to existing chat

### Phase 3: Sandbox Execution (No Approval) (Week 2)

**Why third:** Establishes core execution pipeline. Approval can be added as refinement.

**Tasks:**
1. Implement `lib/sandbox/daytona.ts` (workspace lifecycle)
2. Add execute functions to Daytona tools in `mcp-clients.ts`
3. Implement base64 image extraction from matplotlib
4. Create `components/visualization.tsx` (render tool results)
5. Modify `components/messages.tsx` to render visualization parts
6. Test: Execute simple code (print statement, then matplotlib plot)

**Deliverables:**
- Working sandbox execution
- Visualization rendering
- Base64 image extraction

### Phase 4: Tool Approval Flow (Week 3)

**Why fourth:** Most complex feature, depends on working execution pipeline from Phase 3. Approval UX requires existing tool results to demonstrate value.

**Tasks:**
1. Remove execute functions from code tools (require approval)
2. Create `components/code-approval-card.tsx` (approval UI)
3. Modify `components/messages.tsx` to detect approval-pending state
4. Wire up `addToolApprovalResponse` to approval card buttons
5. Test: Verify execution pauses, approve/deny works, continuation resumes

**Deliverables:**
- Approval UI working
- Execution blocked without approval
- Continuation flow working

### Dependencies Between Phases

```
Phase 1 (Database) ─┬─→ Phase 2 (MCP Integration)
                    │       ↓
                    │   Phase 3 (Execution)
                    │       ↓
                    └─→ Phase 4 (Approval)
                            ↓
                    [Complete System]
```

**Critical Path:**
- Phase 1 blocks all (need persistence for testing)
- Phase 2 and Phase 3 can start after Phase 1
- Phase 4 strictly requires Phase 3

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 concurrent chats** | Current architecture sufficient. Single Neon Postgres instance handles load. MCP clients per-request initialization acceptable. |
| **100-1k concurrent chats** | **Optimize**: Cache MCP client tools (reduce per-request `.tools()` calls). Use `after()` for async message persistence (don't block response). Implement Daytona workspace pooling. |
| **1k-10k concurrent chats** | **Parallelize**: Run Daytona MCP server as dedicated process (not stdio per request). Implement connection pooling for Postgres with `pgBouncer`. Consider worker queue for sandbox execution (Daytona API latency). |
| **10k+ concurrent chats** | **Distribute**: Multiple Daytona regions for geographic latency. Separate read replicas for loadChat (Neon read replicas). Consider message archival strategy (move old chats to object storage). |

### Scaling Priorities

1. **First bottleneck**: Daytona sandbox creation latency (2-5s per workspace)
   - **Fix**: Pre-warm sandbox pools, reuse workspaces across executions
   - **Avoid premature optimization**: Start with create-per-execution, measure actual latency before pooling

2. **Second bottleneck**: MCP tool discovery per request
   - **Fix**: Cache tools at module level with TTL, invalidate on server restart
   - **Trade-off**: Stale tools if MCP server updates (acceptable for most use cases)

3. **Third bottleneck**: Postgres write contention on saveChat
   - **Fix**: Use `after()` to make persistence async, accept eventual consistency
   - **Fallback**: If `after()` fails, message still in client state (can retry)

---

## Anti-Patterns

### Anti-Pattern 1: Storing Tool Implementations in Database

**What people do:** Store Daytona sandbox code or tool definitions in Postgres for "dynamic" tool registration.

**Why it's wrong:**
- Security risk (eval of user-provided code)
- Type safety lost (no static analysis)
- Debugging nightmare (stack traces point to eval'd code)

**Do this instead:**
- Keep tools in code (lib/sandbox/tools/)
- Version tools with application code
- Use MCP server's built-in tool discovery for dynamic behavior

### Anti-Pattern 2: Sending Full Message History on Every Request

**What people do:** Include all previous messages in every POST to `/api/chat` for "full context".

**Why it's wrong:**
- Payload size grows linearly with conversation length
- Tool result parts with base64 images cause exponential growth
- Network latency dominates on long conversations

**Do this instead:**
- Use `prepareSendMessagesRequest` to send only last message
- Load previous messages server-side via `loadChat(id)`
- Trust server to maintain conversation state

### Anti-Pattern 3: Synchronous Sandbox Execution

**What people do:** `await sandbox.execute()` in tool execute function, blocking AI stream.

**Why it's wrong:**
- User sees frozen UI during 5-30s sandbox execution
- Request timeout risk on complex computations
- Poor UX compared to "working on it" streaming

**Do this instead:**
- Use tool approval pattern (execution happens in continuation request)
- Stream progress updates via data parts: `dataStream.writeData({ type: 'sandbox-status', message: 'Installing packages...' })`
- Implement timeout handling with partial results

### Anti-Pattern 4: Inline Base64 for Large Images

**What people do:** Embed 5MB+ base64 PNGs directly in message parts.

**Why it's wrong:**
- Postgres performance degrades with large JSONB documents
- Client memory issues rendering massive data URIs
- No progressive loading (image appears all-at-once)

**Do this instead:**
- For small charts (<500KB): Inline base64 is fine (this is the target use case)
- For large images: Upload to Vercel Blob, store URL in message part
- Implement size threshold: `if (base64.length > 500_000) uploadToBlob()`

---

## Sources

- [AI SDK Tool Calling Documentation](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Tool merging patterns, multiple sources integration (verified 2026-01-31)
- [AI SDK Chatbot Architecture](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) - Message parts structure, UIMessage format (verified 2026-01-31)
- [AI SDK Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/storing-messages) - Database storage patterns, onFinish callbacks (verified 2026-01-31)
- [Neon Postgres Next.js Guide](https://neon.com/docs/guides/nextjs) - Connection patterns, serverless driver usage (verified 2026-01-31)
- [Daytona Documentation](https://www.daytona.io/docs) - Sandbox execution, workspace management (verified 2026-01-31)
- **Existing Codebase**: Current implementation patterns verified from:
  - `docs/app/api/chat/route.ts` - Existing AI SDK 6 integration with MCP
  - `docs/components/chat.tsx` - useChat hook usage with approval flow
  - `docs/lib/ai/providers.ts` - Vercel AI Gateway configuration
  - `mcp/app/server.py` - FastMCP server stdio transport pattern

---
*Architecture research for: Interactive Data Playground*
*Researched: 2026-01-31*
*Confidence: HIGH (verified with official AI SDK 6 docs, Neon docs, Daytona docs, existing codebase patterns)*
