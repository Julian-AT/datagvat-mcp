# Technology Stack — v2.2 Additions

**Project:** Austria MCP Server Documentation
**Milestone:** v2.2 Interactive Data Playground
**Researched:** 2026-01-31
**Confidence:** MEDIUM

## Existing Stack (DO NOT CHANGE)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.1.3 | App Router, server components | ✓ Established |
| Fumadocs | 16.4.7 | Documentation framework | ✓ Established |
| Bun | Latest | Runtime and package manager | ✓ Established |
| Biome | 2.3.11 | Linting and formatting | ✓ Established |
| TypeScript | 5.9.3 | Type safety with strict mode | ✓ Established |
| Tailwind CSS | 4.1.18 | Styling framework | ✓ Established |
| Vercel AI SDK | 6.0.64 (ai package) | Core AI SDK with streaming | ✓ Established v2.1 |
| @ai-sdk/react | 3.0.66 | React hooks (useChat) | ✓ Established v2.1 |
| @ai-sdk/openai-compatible | 2.0.24 | OpenAI-compatible provider | ✓ Established v2.1 |
| @ai-sdk/mcp | 1.0.16 | MCP integration for AI SDK | ✓ Established v2.1 |
| @modelcontextprotocol/sdk | 1.25.3 | MCP protocol SDK | ✓ Established v2.1 |
| FastMCP | 2.14+ | Python MCP server (data.gv.at) | ✓ Established mcp/ |
| zod | 4.3.6 | Schema validation | ✓ Established |
| nanoid | 5.1.6 | ID generation | ✓ Established |

## New Stack Requirements for v2.2

### 1. Multiple MCP Server Integration

**Context:** Need to connect both data.gv.at MCP (existing) and Daytona MCP (code execution) to a single AI agent.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| **NO NEW PACKAGES** | — | Use existing @ai-sdk/mcp + @modelcontextprotocol/sdk | — |

**Why no new packages:**
- `@ai-sdk/mcp@1.0.16` already supports multiple MCP servers via `getMCPTools()` for each client
- `@modelcontextprotocol/sdk@1.25.3` Client class can be instantiated multiple times
- Aggregation pattern: Create one Client per server, merge tools into single object for `streamText()`

#### Integration Pattern

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { getMCPTools } from '@ai-sdk/mcp';

// Client 1: data.gv.at MCP (existing Python server)
const dataGvClient = new Client({
  name: 'datagvat-mcp-client',
  version: '1.0.0'
});

await dataGvClient.connect(
  new StdioClientTransport({
    command: 'uvx',
    args: ['--from', '/path/to/mcp', 'datagvat-mcp']
  })
);

// Client 2: Daytona MCP (code execution sandbox)
const daytonaClient = new Client({
  name: 'daytona-mcp-client',
  version: '1.0.0'
});

await daytonaClient.connect(
  new StdioClientTransport({
    command: 'daytona',
    args: ['mcp']  // Daytona CLI MCP server mode
  })
);

// Aggregate tools for AI SDK
const allTools = {
  ...getMCPTools({ mcpClient: dataGvClient }),
  ...getMCPTools({ mcpClient: daytonaClient })
};

// Use in streamText with both tool sets
const result = streamText({
  model,
  tools: allTools,
  messages
});
```

**Critical verification needed (Phase 6 research):**
- [ ] Confirm Daytona CLI provides MCP server via `daytona mcp` command
- [ ] Verify Daytona MCP tools for workspace creation and code execution
- [ ] Test stdio transport in Vercel deployment (may need HTTP fallback)

---

### 2. Tool Approval for Code Execution

**Context:** Code execution in Daytona sandboxes is dangerous—users must approve before execution.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| **NO NEW PACKAGES** | — | Use existing ai@6.0.64 experimental_needsApproval | — |

**Why no new packages:**
- AI SDK 6.0+ supports `experimental_needsApproval: true` on tool definitions
- Approval flow handled by `tool-approval-request` and `tool-approval-response` message parts
- Frontend already has `@ai-sdk/react@3.0.66` for handling approval state

#### Approval Pattern

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const executePythonTool = tool({
  description: 'Execute Python code in Daytona sandbox',
  parameters: z.object({
    code: z.string().describe('Python code to execute'),
    workspaceId: z.string().describe('Daytona workspace ID')
  }),
  experimental_needsApproval: true,  // Requires user confirmation
  execute: async ({ code, workspaceId }) => {
    // Only executes after user approves
    const result = await daytonaClient.callTool({
      name: 'execute_code',
      arguments: { code, workspaceId }
    });
    return result.content;
  }
});
```

**Approval flow:**
1. AI generates tool call → returns `tool-approval-request` in stream
2. Frontend displays approval dialog with code preview
3. User approves/denies
4. Frontend sends `tool-approval-response` back to API
5. If approved, tool executes; if denied, model receives denial reason

**Frontend handling (React):**
```typescript
import { useChat } from '@ai-sdk/react';

const { messages, append, addToolApprovalResponse } = useChat({
  api: '/api/chat'
});

// When tool-approval-request arrives in message stream
const handleApproval = (approvalId: string, approved: boolean) => {
  addToolApprovalResponse({
    approvalId,
    approved,
    reason: approved ? 'User confirmed code execution' : 'User rejected execution'
  });
};
```

**Official documentation:** [AI SDK Tool Approval](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)

---

### 3. Vercel AI Gateway

**Context:** Need single endpoint for 100+ AI models without managing separate API keys per provider.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| **NO NEW PACKAGES** | — | Use existing @ai-sdk/openai-compatible@2.0.24 | HIGH |

**Why no new packages:**
- `@ai-sdk/openai-compatible` already supports custom `baseURL` for AI Gateway
- Single package works with all gateway-proxied providers (OpenAI, Anthropic, Google, etc.)
- Already installed and used for Claude integration

#### Configuration Pattern

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const model = createOpenAICompatible({
  name: 'gpt-4o',  // or 'claude-opus-4', 'gemini-2.0-flash', etc.
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,  // Gateway endpoint
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY,   // Single gateway key
});
```

**Environment variables needed:**
```bash
# .env.local additions for v2.2
VERCEL_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT/YOUR_GATEWAY
VERCEL_AI_GATEWAY_KEY=xxx  # Single key for all models
```

**Setup process (Phase 6 research needed):**
- [ ] Create Vercel AI Gateway instance
- [ ] Configure model routing rules
- [ ] Generate gateway API key
- [ ] Test model switching (gpt-4o → claude-opus-4)

**Confidence:** MEDIUM — Pattern verified with OpenAI-compatible providers, but Vercel AI Gateway specific configuration needs Phase 6 documentation research.

---

### 4. Message Persistence (Neon Postgres + Drizzle ORM)

**Context:** Chat conversations must persist across sessions. Users return to previous chats.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| drizzle-orm | ^0.45.1 | Type-safe database ORM | HIGH |
| postgres | ^3.4.8 | PostgreSQL driver (postgres.js) | HIGH |
| drizzle-kit | ^latest | Schema migrations | HIGH (dev) |

**Why these choices:**

**Drizzle ORM:**
- Zero runtime overhead (compiles to SQL)
- Best-in-class TypeScript DX with full inference
- Neon-optimized (postgres.js driver)
- Smaller than Prisma (no query engine binary)
- Edge-compatible (future-proof)

**postgres.js (over node-postgres):**
- 5x smaller bundle size than `pg` (~200KB vs 1MB)
- Native WebSocket support for Neon pooling
- Serverless-optimized (faster cold starts)
- No prepared statement issues in AWS environments

**Not Neon serverless driver (@neondatabase/serverless):**
- Not needed for Next.js App Router (runs in Node.js runtime, not Edge)
- postgres.js sufficient for serverless functions
- Keep @neondatabase/serverless for future Edge Runtime features

#### Database Schema

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),  // nanoid generated
  userId: text('user_id'),      // Future: user auth (v3.0)
  title: text('title'),         // First message preview
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),  // nanoid generated
  chatId: text('chat_id').notNull().references(() => chats.id),
  role: text('role').notNull(), // 'user' | 'assistant' | 'tool'
  content: jsonb('content').notNull(), // UIMessage content (string | array)
  createdAt: timestamp('created_at').defaultNow()
});
```

**Why JSONB for content:**
- UIMessage content can be string or array of parts (text, tool-call, tool-result, image)
- Preserves tool call metadata for replay
- Simpler than separate tables for each content type

#### Connection Setup

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;  // Neon pooled connection

const sql = postgres(connectionString, {
  max: 1,  // Serverless function uses one connection per instance
  idle_timeout: 20,
  max_lifetime: 60 * 30  // 30 minutes
});

export const db = drizzle(sql);
```

**Critical: Use Neon pooled connection string:**
```
postgresql://user:pass@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/dbname
                                                  ^^^^^^^ Note -pooler suffix
```

**Why pooling is mandatory:**
- Next.js serverless functions create new connections per invocation
- Without pooling: Exhaust max_connections (104 at 0.25 CU compute)
- With pooling: Support 10,000 concurrent connections via PgBouncer
- Transaction-mode pooling (pool_mode=transaction) — connections return after each transaction

**Pooling limitations:**
- Cannot use session variables (SET/RESET) — not needed for this use case
- Cannot use LISTEN/NOTIFY — not needed for this use case
- Cannot use temporary tables — not needed for this use case
- 2-minute query timeout (query_wait_timeout=120) — keep transactions short

**Official documentation:** [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling)

#### Message Persistence Pattern

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { db } from '@/lib/db/client';
import { messages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const { messages: clientMessages, chatId } = await req.json();

  // Load previous messages from database
  const previousMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);

  // Append new user message
  const fullMessages = [
    ...previousMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'tool',
      content: m.content
    })),
    clientMessages[clientMessages.length - 1]
  ];

  const result = streamText({
    model,
    tools: allTools,
    messages: fullMessages,
    onFinish: async ({ messages: finalMessages }) => {
      // Persist all messages (AI SDK 6.0 pattern)
      await db.insert(messages).values(
        finalMessages.slice(previousMessages.length).map(msg => ({
          id: nanoid(),
          chatId,
          role: msg.role,
          content: msg.content,  // JSONB handles string or array
          createdAt: new Date()
        }))
      ).onConflictDoNothing();
    }
  });

  return result.toDataStreamResponse();
}
```

**Why onFinish callback:**
- AI SDK 6.0 pattern for persisting complete conversations
- `onFinish` receives full conversation history including tool calls
- Ensures tool approval flow is captured
- Handles disconnects gracefully (use `result.consumeStream()` if needed)

**Official documentation:** [AI SDK Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/storing-messages)

#### Migration Workflow

```bash
# Generate migrations from schema
bunx drizzle-kit generate

# Apply migrations to Neon database
bunx drizzle-kit migrate

# Development: Push schema directly (skips migrations)
bunx drizzle-kit push
```

#### Environment Variables

```bash
# .env.local additions for v2.2
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname
```

**Neon free tier:**
- 512MB storage (sufficient for thousands of chats)
- 10,000 pooled connections
- 100 hours compute/month (Always Available projects)
- $0 cost for v2.2 development and launch

---

### 5. Daytona MCP Server

**Context:** Need secure code execution in isolated sandboxes for Python data analysis.

#### Required Additions

| Package | Version | Purpose | Priority |
|---------|---------|---------|----------|
| **NO NODE PACKAGES** | — | Daytona CLI installed on server via curl | HIGH |

**Why no npm packages:**
- Daytona MCP server is CLI-based, not npm package
- Connects via stdio transport (command: 'daytona', args: ['mcp'])
- Installation: `curl -sf https://download.daytona.io/install.sh | sudo bash`

**Integration approach:**
```typescript
// Server-side MCP client connection
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const daytonaClient = new Client({
  name: 'daytona-mcp-client',
  version: '1.0.0'
});

await daytonaClient.connect(
  new StdioClientTransport({
    command: 'daytona',  // Daytona CLI in PATH
    args: ['mcp']        // Starts MCP server on stdio
  })
);
```

**Expected Daytona MCP tools (to be verified in Phase 6):**
- `create_workspace` — Spin up isolated development environment
- `execute_code` — Run Python code in workspace
- `list_workspaces` — Show available sandboxes
- `delete_workspace` — Clean up after session

**Deployment considerations:**
- Daytona CLI must be installed in Vercel deployment (Dockerfile or build script)
- Alternative: Self-host Next.js on server with Daytona CLI pre-installed
- Fallback: If Daytona unavailable, use restricted Python sandbox (subprocess, RestrictedPython)

**Confidence:** LOW — Daytona MCP server existence and CLI integration pattern not verified with official documentation. **CRITICAL PHASE 6 RESEARCH NEEDED.**

**Research tasks for Phase 6:**
- [ ] Confirm Daytona provides MCP server via CLI
- [ ] Document Daytona installation process
- [ ] Verify MCP tool names and schemas
- [ ] Test stdio transport in production environment
- [ ] Define fallback strategy if Daytona unavailable

---

## Installation Commands

### Core v2.2 Stack
```bash
# Database persistence
bun add drizzle-orm postgres

# Dev dependencies
bun add -D drizzle-kit

# NO additions needed for:
# - Multiple MCP servers (@ai-sdk/mcp + @modelcontextprotocol/sdk already installed)
# - Tool approval (ai@6.0.64 already supports experimental_needsApproval)
# - Vercel AI Gateway (@ai-sdk/openai-compatible@2.0.24 already installed)
```

### Server Setup (Non-NPM)
```bash
# Daytona CLI installation (production server)
curl -sf https://download.daytona.io/install.sh | sudo bash

# Verify Daytona MCP server
daytona mcp  # Should start MCP server on stdio
```

---

## Integration Points with Existing Stack

### 1. Next.js 16.1.3 App Router
- **Chat API:** Route handler at `app/api/chat/route.ts` (connect MCP clients, stream with persistence)
- **Database:** Drizzle client in `lib/db/` for message persistence
- **Approval UI:** Dialog component for tool approval (React Server Components + client hooks)

### 2. Vercel AI SDK 6.0.64
- **Multiple MCP servers:** Aggregate tools from both data.gv.at and Daytona via `getMCPTools()`
- **Tool approval:** Use `experimental_needsApproval` for code execution tools
- **Message persistence:** Use `onFinish` callback to save to Neon Postgres

### 3. Fumadocs 16.4.7
- **Playground page:** New route at `docs/app/(playground)/chat/page.tsx`
- **Navigation:** Add "Chat" tab to existing meta.json structure

### 4. Bun Runtime
- **Database migrations:** `bunx drizzle-kit` for schema management
- **MCP connections:** Bun runtime supports Node.js stdio transport

### 5. TypeScript 5.9.3 Strict Mode
- **Drizzle ORM:** Full type inference for queries
- **Tool schemas:** Zod schemas for tool parameters and approval responses

---

## What NOT to Add

| Technology | Why Avoid | Use Instead |
|------------|-----------|-------------|
| Prisma ORM | Larger bundle, query engine binary, slower cold starts | Drizzle ORM |
| node-postgres (pg) | 5x larger than postgres.js, prepared statement issues | postgres.js |
| @neondatabase/serverless | Not needed for Node.js runtime (App Router default) | postgres.js |
| Direct database connections | Exhaust max_connections in serverless | Neon pooled connection (-pooler) |
| Supabase | Over-engineering (includes auth, storage, realtime—not needed v2.2) | Neon Postgres (just database) |
| LangChain | Over-abstraction, AI SDK native patterns simpler | ai + @ai-sdk/mcp directly |
| Custom MCP aggregation library | Reinventing wheel, @ai-sdk/mcp handles it | @ai-sdk/mcp getMCPTools() |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| ai@6.0.64 | @ai-sdk/mcp@1.0.16 | AI SDK 6.0+ required for experimental_needsApproval |
| @ai-sdk/mcp@1.0.16 | @modelcontextprotocol/sdk@1.25.3 | Matching MCP protocol versions |
| drizzle-orm@0.45.1 | postgres@3.4.8 | Drizzle's postgres-js driver |
| postgres@3.4.8 | Neon pooled connections | Requires `-pooler` suffix in DATABASE_URL |
| Next.js 16.1.3 | All above | App Router runs in Node.js runtime (stdio transport works) |

---

## Stack Patterns by Variant

### Pattern 1: Multiple MCP Server Connection

**When:** Chat API needs tools from 2+ MCP servers

```typescript
// lib/mcp/clients.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export async function createMCPClients() {
  const dataGvClient = new Client({ name: 'datagvat-mcp', version: '1.0.0' });
  const daytonaClient = new Client({ name: 'daytona-mcp', version: '1.0.0' });

  await Promise.all([
    dataGvClient.connect(new StdioClientTransport({
      command: 'uvx',
      args: ['--from', process.cwd() + '/mcp', 'datagvat-mcp']
    })),
    daytonaClient.connect(new StdioClientTransport({
      command: 'daytona',
      args: ['mcp']
    }))
  ]);

  return { dataGvClient, daytonaClient };
}
```

### Pattern 2: Tool Approval with Custom Validation

**When:** Need conditional approval based on code analysis

```typescript
import { tool } from 'ai';

const executePythonTool = tool({
  description: 'Execute Python code in sandbox',
  parameters: z.object({
    code: z.string(),
    workspaceId: z.string()
  }),
  experimental_needsApproval: async ({ code }) => {
    // Dynamic approval: auto-approve safe operations
    const isSafe = !code.includes('os.') && !code.includes('subprocess.');
    return !isSafe;  // Require approval for potentially dangerous code
  },
  execute: async ({ code, workspaceId }) => {
    // Execute after approval
  }
});
```

### Pattern 3: Message Persistence with Tool Calls

**When:** Persisting conversations with tool approval history

```typescript
// Database schema captures full UIMessage format
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  role: text('role').notNull(),
  content: jsonb('content').notNull(),  // Handles tool-approval-request/response
  createdAt: timestamp('created_at').defaultNow()
});

// Query with tool call history
const result = await streamText({
  model,
  tools: allTools,
  messages: previousMessages.map(m => ({
    role: m.role,
    content: m.content  // JSONB preserves tool call structure
  })),
  onFinish: async ({ messages: finalMessages }) => {
    await db.insert(messages).values(
      finalMessages.map(msg => ({
        id: nanoid(),
        chatId,
        role: msg.role,
        content: msg.content  // Tool calls, approvals, results all captured
      }))
    );
  }
});
```

### Pattern 4: Neon Connection in Serverless

**When:** Database access from Next.js API routes

```typescript
// Use connection pooling for serverless
const connectionString = process.env.DATABASE_URL!;  // Must include -pooler suffix

const sql = postgres(connectionString, {
  max: 1,  // One connection per serverless function instance
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

export const db = drizzle(sql);

// Keep transactions short (2-minute timeout)
await db.transaction(async (tx) => {
  await tx.insert(messages).values(/* ... */);
  await tx.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
  // Complete within 2 minutes
});
```

---

## Cost Analysis

### Database (Neon Postgres)

| Resource | Free Tier | After Free Tier | Estimate (v2.2) |
|----------|-----------|-----------------|-----------------|
| Storage | 512MB | $0.10/GB/month | $0/month (chat history ~100MB initially) |
| Compute | 100 hours/month | $0.16/hour | $0/month (Always Available within free tier) |
| Data Transfer | 5GB/month | $0.09/GB | $0/month (API queries minimal) |

**Total database cost:** $0/month for v2.2 development and initial production

### Vercel AI Gateway

| Resource | Cost | Estimate |
|----------|------|----------|
| Gateway management | $0 (Vercel feature) | $0/month |
| Model API calls | Pay-per-use (normal rates) | Depends on usage (same as direct) |

**Total gateway cost:** $0 infrastructure, model usage same as direct API calls

### Daytona Sandboxes

| Resource | Cost | Estimate |
|----------|------|----------|
| Daytona CLI (self-hosted) | $0 (open-source) | $0/month |
| Compute for sandboxes | Server costs (Vercel or self-host) | Variable (needs research) |

**Confidence:** LOW — Daytona pricing model unclear, needs Phase 6 investigation

**Total cost estimate for v2.2:** $0/month infrastructure (within free tiers)

---

## Build/Development Workflow Implications

### Development Phase
```bash
# Terminal 1: Next.js dev server
bun run dev

# Terminal 2: Database migrations (when schema changes)
bunx drizzle-kit push

# Terminal 3: Drizzle Studio (database GUI)
bunx drizzle-kit studio

# Terminal 4: MCP server testing (data.gv.at)
cd mcp && uvx datagvat-mcp
```

### Build Phase
```bash
# Standard Next.js build
bun run build

# Apply database migrations (production)
bunx drizzle-kit migrate
```

**Estimated build time impact:**
- No additional build time (database migrations run separately)
- MCP connections established at runtime, not build time

---

## Research Gaps (Phase-Specific Investigation Needed)

### CRITICAL Priority (Blocking Development)

1. **Daytona MCP Server Availability**
   - **Question:** Does Daytona provide MCP server via `daytona mcp` command?
   - **Why critical:** Entire code execution feature depends on this
   - **Fallback:** Define restricted Python sandbox strategy if unavailable
   - **Phase:** 6 (Research phase for code execution milestone)

2. **Vercel AI Gateway Configuration**
   - **Question:** How to create gateway instance and configure model routing?
   - **Why critical:** Single endpoint for 100+ models is v2.2 requirement
   - **Fallback:** Use direct provider packages (@ai-sdk/openai, @ai-sdk/anthropic)
   - **Phase:** 6 (Research phase for AI integration milestone)

3. **MCP stdio in Vercel Deployment**
   - **Question:** Does stdio transport work in Vercel serverless functions?
   - **Why critical:** MCP connections may fail in serverless if stdio unsupported
   - **Fallback:** Use Streamable HTTP transport for MCP servers
   - **Phase:** 6 (Research phase for deployment milestone)

### HIGH Priority (Impacts UX)

4. **Database Schema Design**
   - **Question:** How to handle tool call content in JSONB? What indexes needed?
   - **Why important:** Query performance and storage efficiency
   - **Phase:** 7 (Implementation phase for persistence milestone)

5. **Tool Approval UX**
   - **Question:** What approval dialog design? How to display code preview safely?
   - **Why important:** User trust and security perception
   - **Phase:** 7 (Implementation phase for code execution milestone)

### MEDIUM Priority (Performance Optimization)

6. **Connection Pooling Tuning**
   - **Question:** Monitor pool usage, adjust default_pool_size if needed
   - **Why useful:** Prevent query timeouts under load
   - **Phase:** 8 (Testing phase)

7. **MCP Client Lifecycle**
   - **Question:** Should MCP clients be singletons or per-request?
   - **Why useful:** Performance vs. resource usage tradeoff
   - **Phase:** 7 (Implementation phase)

---

## Sources

### HIGH Confidence (Official Documentation Verified)

- **AI SDK Tool Approval:** [ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) — `experimental_needsApproval` pattern, approval flow documented
- **AI SDK Message Persistence:** [ai-sdk.dev/docs/ai-sdk-ui/storing-messages](https://ai-sdk.dev/docs/ai-sdk-ui/storing-messages) — `onFinish` callback pattern, UIMessage format documented
- **Neon Connection Pooling:** [neon.com/docs/connect/connection-pooling](https://neon.com/docs/connect/connection-pooling) — Pooling configuration, limitations, transaction-mode behavior documented
- **Drizzle ORM PostgreSQL:** [orm.drizzle.team/docs/get-started-postgresql](https://orm.drizzle.team/docs/get-started-postgresql) — postgres.js driver setup documented
- **MCP Transports Specification:** [modelcontextprotocol.io/docs/concepts/transports](https://modelcontextprotocol.io/docs/concepts/transports) — stdio transport protocol documented

### MEDIUM Confidence (Ecosystem Patterns Verified)

- **MCP SDK Multiple Servers:** TypeScript SDK GitHub repository analysis — Multi-client pattern inferred from Client class architecture
- **Vercel AI Gateway Configuration:** OpenAI-compatible provider pattern verified, but gateway-specific setup needs documentation

### LOW Confidence (Requires Phase 6 Validation)

- **Daytona MCP Server:** Mentioned in project context, no official MCP server documentation found — **CRITICAL GAP**
- **Daytona CLI Installation:** General Daytona installation pattern assumed, needs verification
- **Daytona Tool Schemas:** Expected tool names inferred from use case, needs verification

---

## Recommendation Summary

**Proceed with these additions for v2.2:**

1. **Database Persistence:** Add `drizzle-orm` + `postgres` for Neon Postgres integration
2. **Multiple MCP Servers:** Use existing `@ai-sdk/mcp` + `@modelcontextprotocol/sdk` (no new packages)
3. **Tool Approval:** Use existing `ai@6.0.64` experimental_needsApproval (no new packages)
4. **Vercel AI Gateway:** Use existing `@ai-sdk/openai-compatible` with baseURL config (no new packages)
5. **Daytona MCP:** Server installation via CLI (non-npm), **requires Phase 6 verification**

**Total new npm dependencies:** 2 packages (drizzle-orm, postgres)

**Cost:** $0/month (within Neon free tier, Vercel gateway has no infrastructure cost)

**Build time:** No impact (migrations run separately, MCP runtime connections)

**Risk assessment:**
- **LOW risk:** Database persistence (Drizzle + Neon well-established)
- **MEDIUM risk:** Vercel AI Gateway (configuration needs research, but fallback is direct providers)
- **HIGH risk:** Daytona MCP (availability unverified, needs fallback strategy)

**Next step:** Phase 6 research must verify Daytona MCP server availability or define fallback to restricted Python sandbox approach.

---

*Last updated: 2026-01-31 for v2.2 Interactive Data Playground milestone*
