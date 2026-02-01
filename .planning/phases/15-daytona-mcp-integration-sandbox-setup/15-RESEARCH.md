# Phase 15: Daytona MCP Integration & Sandbox Setup - Research

**Researched:** 2026-02-01
**Domain:** Multi-MCP orchestration, code execution sandboxing
**Confidence:** HIGH

## Summary

Research reveals a critical finding: **Daytona MCP server does not exist**. Daytona is a sandbox infrastructure for AI-generated code execution but does not provide an MCP server. This invalidates the original Phase 15 approach.

The recommended path forward is **E2B Code Interpreter** - a mature, production-ready sandbox API with excellent Node.js SDK support, free tier availability, and explicit AI agent use case design. The project already has `@ai-sdk/mcp` (v1.0.16) installed, which provides robust multi-MCP client capabilities.

Multi-MCP orchestration is well-supported: the AI SDK client automatically aggregates tools from multiple stdio/HTTP servers, with each server running as an independent process. Health checks require custom implementation as MCP specification doesn't define health check protocol.

**Primary recommendation:** Use E2B Code Interpreter with AI SDK MCP client to orchestrate data.gv.at (FastMCP/HTTP) and E2B tools (custom MCP wrapper or direct integration). Implement custom health check via periodic tool discovery calls.

## Critical Finding: Daytona MCP Does Not Exist

### Evidence

**Daytona GitHub Repository Analysis:**
- Repository: https://github.com/daytonaio/daytona
- Description: "Secure and Elastic Infrastructure for Running AI-Generated Code"
- Provides: Sandbox environments via SDKs (Python, TypeScript, Go)
- **Does NOT provide:** MCP server, MCP protocol support, `daytona mcp` command
- **Source:** GitHub repository README (verified 2026-02-01)

**What Daytona Actually Is:**
- Infrastructure layer for running AI-generated code in isolated environments
- Provides APIs for file operations, Git, LSP, and code execution
- **Not** an MCP implementation - it's a sandbox runtime

### Impact on Phase 15

| Original Assumption | Reality | Action Required |
|---------------------|---------|-----------------|
| Daytona MCP server exists | No MCP server provided | Replace with E2B or alternative |
| `daytona mcp` CLI command | No such command | Use E2B SDK instead |
| Stdio transport integration | N/A without MCP server | HTTP/SSE or custom wrapper |

**Confidence:** HIGH - Verified via official GitHub repository and documentation

## Standard Stack

### Core Sandbox Solution: E2B Code Interpreter

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @e2b/code-interpreter | Latest | Secure Python sandbox execution | Purpose-built for AI agents, 200ms startup, 24hr sessions |
| @ai-sdk/mcp | ^1.0.16 | Multi-MCP client orchestration | Already installed, AI SDK native, stdio/HTTP support |
| @modelcontextprotocol/sdk | ^1.25.3 | MCP protocol types and utilities | Already installed, official TypeScript SDK |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vercel/functions | ^3.4.0 | Serverless timeout extension | Already installed, cron job implementation |
| zod | ^4.3.6 | Schema validation for MCP tools | Already installed, type-safe tool definitions |

### E2B Alternatives Considered

| Instead of E2B | Could Use | Tradeoff |
|----------------|-----------|----------|
| E2B | Custom Docker + subprocess | E2B: 200ms startup, managed isolation. Docker: 2-5s startup, self-managed security |
| E2B | vm2/isolated-vm (deprecated) | E2B: Full OS isolation, network control. vm2: Deprecated since 2023, security issues |
| E2B | RestrictedPython + subprocess | E2B: Battle-tested isolation. RestrictedPython: Limited, requires custom sandboxing |

**Installation:**
```bash
npm install @e2b/code-interpreter
# @ai-sdk/mcp and @modelcontextprotocol/sdk already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   ├── mcp/
│   │   ├── clients/         # MCP client initialization
│   │   │   ├── datagvat.ts  # Data.gv.at FastMCP client (HTTP)
│   │   │   └── e2b.ts       # E2B MCP wrapper or direct tools
│   │   ├── health.ts        # Health check endpoint
│   │   └── aggregate.ts     # Tool aggregation logic
│   ├── chat/
│   │   └── route.ts         # AI SDK useChat endpoint with tools
│   └── cron/
│       └── cleanup-sandboxes.ts  # Vercel Cron job
lib/
├── mcp/
│   ├── client-manager.ts    # Lifecycle management
│   ├── health-checker.ts    # Periodic health checks
│   └── types.ts             # MCP client types
└── sandbox/
    ├── e2b-manager.ts       # E2B sandbox lifecycle
    └── cleanup.ts           # Timeout + orphan cleanup
```

### Pattern 1: Multi-MCP Client Orchestration

**What:** Single AI SDK call aggregates tools from multiple MCP servers (data.gv.at + E2B)
**When to use:** Phase 15 - integrating dataset search and code execution

**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { createMCPClient } from '@ai-sdk/mcp';
import { generateText } from 'ai';

// Client 1: Data.gv.at FastMCP server (HTTP)
const dataGvatClient = await createMCPClient({
  transport: {
    type: 'http',
    url: process.env.DATAGVAT_MCP_URL, // Your FastMCP server
  },
});

// Client 2: E2B tools (custom implementation or MCP wrapper)
const e2bClient = await createMCPClient({
  // Could be HTTP server wrapping E2B SDK, or direct tool integration
  transport: {
    type: 'http',
    url: process.env.E2B_MCP_URL,
  },
});

// Aggregate tools from both servers
const dataGvatTools = await dataGvatClient.tools();
const e2bTools = await e2bClient.tools({
  schemas: {
    'execute-python': {
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
      }),
      outputSchema: z.object({
        text: z.string(),
        error: z.boolean().optional(),
      }),
    },
  },
});

// Single AI SDK call with all tools
const result = await generateText({
  model: yourModel,
  tools: {
    ...dataGvatTools,
    ...e2bTools,
  },
  prompt: 'Find population datasets and calculate average',
  onFinish: async () => {
    await dataGvatClient.close();
    await e2bClient.close();
  },
});
```

### Pattern 2: E2B Sandbox Lifecycle Management

**What:** Create, execute, timeout, cleanup pattern for E2B sandboxes
**When to use:** Every code execution request in Phase 15

**Example:**
```typescript
// Source: https://e2b.mintlify.app/docs/sandbox.md
import { Sandbox } from '@e2b/code-interpreter';

async function executeCode(code: string, conversationId: string) {
  // Create with 1-hour timeout (requirement EXEC-06)
  const sandbox = await Sandbox.create({
    timeoutMs: 60 * 60 * 1000 // 1 hour
  });

  try {
    // Store sandbox_id in database (Phase 14 schema)
    await db.update(conversations)
      .set({
        sandbox_id: sandbox.sandboxId,
        sandbox_created_at: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Execute code
    const execution = await sandbox.runCode(code);

    return {
      text: execution.text,
      error: execution.error,
    };
  } finally {
    // Always cleanup (requirement EXEC-06)
    await sandbox.kill();

    // Clear database tracking
    await db.update(conversations)
      .set({ sandbox_id: null })
      .where(eq(conversations.id, conversationId));
  }
}
```

### Pattern 3: Health Check via Tool Discovery

**What:** MCP has no health check protocol - use listTools() as health probe
**When to use:** Startup and periodic monitoring (MCP-04 requirement)

**Example:**
```typescript
// Source: Custom pattern - MCP spec has no health check protocol
async function checkMCPHealth(client: MCPClient, serverName: string) {
  try {
    const startTime = Date.now();
    const tools = await client.listTools();
    const latency = Date.now() - startTime;

    return {
      server: serverName,
      status: 'healthy',
      toolCount: tools.tools.length,
      latencyMs: latency,
    };
  } catch (error) {
    return {
      server: serverName,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// On startup (MCP-04)
const dataGvatHealth = await checkMCPHealth(dataGvatClient, 'data.gv.at');
const e2bHealth = await checkMCPHealth(e2bClient, 'E2B');

console.log('MCP Health:', { dataGvatHealth, e2bHealth });
```

### Pattern 4: Graceful Degradation

**What:** Continue with limited functionality when MCP server unavailable
**When to use:** MCP-05, EXEC-10 requirements

**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
async function getAvailableTools() {
  const tools: Record<string, any> = {};

  try {
    const dataGvatClient = await createMCPClient({ /* ... */ });
    Object.assign(tools, await dataGvatClient.tools());
  } catch (error) {
    console.warn('Data.gv.at MCP unavailable - dataset search disabled');
    // Continue without dataset search tools
  }

  try {
    const e2bClient = await createMCPClient({ /* ... */ });
    Object.assign(tools, await e2bClient.tools());
  } catch (error) {
    console.warn('E2B MCP unavailable - code execution disabled');
    // Return error message tool instead
    tools['execute-python-unavailable'] = tool({
      description: 'Code execution unavailable',
      inputSchema: z.object({}),
      execute: async () => ({
        error: 'Code execution sandbox is temporarily unavailable. Only dataset search is available.',
      }),
    });
  }

  return tools;
}
```

### Anti-Patterns to Avoid

- **Global MCP clients:** Create/close per request in serverless (edge function timeout issues)
- **No timeout on sandbox.create():** Always specify `timeoutMs` (default 5 min may be too short)
- **Forgetting onFinish cleanup:** MCP clients must close to prevent process leaks
- **Assuming MCP health check exists:** No spec-defined health check - must implement custom

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Python code sandboxing | subprocess + RestrictedPython | E2B Code Interpreter | E2B: Firecracker VM isolation, 200ms startup, network controls, battle-tested. Custom: No OS isolation, slow startup, security gaps |
| Multi-MCP aggregation | Custom tool merger logic | AI SDK `createMCPClient` | AI SDK: Auto-handles namespacing, tool discovery, stdio/HTTP transports. Custom: Protocol complexity, edge cases |
| MCP stdio transport | Child process + JSON-RPC parser | `@modelcontextprotocol/sdk` StdioClientTransport | SDK: Protocol versioning, error handling, backpressure. Custom: JSON-RPC complexity, framing issues |
| Sandbox cleanup | Manual database queries | E2B `sandbox.kill()` + Vercel Cron | E2B: Immediate termination, resource cleanup. Manual: Race conditions, orphaned processes |

**Key insight:** Code execution sandboxing is deceptively complex - OS isolation, network controls, resource limits, and cleanup require specialized infrastructure. E2B solves this; custom solutions inevitably have security or reliability gaps.

## Common Pitfalls

### Pitfall 1: Assuming Daytona MCP Exists

**What goes wrong:** Planning based on non-existent `daytona mcp` command
**Why it happens:** Naming confusion - "Daytona" suggests MCP integration but only provides sandbox runtime
**How to avoid:** Verify library capabilities with official documentation before planning
**Warning signs:** No npm package `@daytona/mcp`, no documentation mentioning MCP protocol

### Pitfall 2: Not Closing MCP Clients

**What goes wrong:** Memory leaks, hanging processes, serverless function timeouts
**Why it happens:** Forgetting `await client.close()` in onFinish or finally blocks
**How to avoid:** Always use try/finally or onFinish callback for client lifecycle
**Warning signs:** Functions timing out after 10+ requests, "too many open files" errors

### Pitfall 3: Global MCP Clients in Serverless

**What goes wrong:** Edge functions timeout, clients disconnect mid-request
**Why it happens:** Serverless environments freeze/thaw processes unpredictably
**How to avoid:** Create MCP client per request, close after response
**Warning signs:** "Connection closed" errors, inconsistent tool availability

### Pitfall 4: No Sandbox Timeout

**What goes wrong:** Runaway code execution drains E2B credits (charged per second)
**Why it happens:** Forgetting `timeoutMs` parameter in `Sandbox.create()`
**How to avoid:** Always specify timeout (1 hour for Phase 15 requirement)
**Warning signs:** Unexpectedly high E2B bills, sandboxes running for days

### Pitfall 5: Missing Graceful Degradation

**What goes wrong:** Entire app crashes when one MCP server is down
**Why it happens:** No try/catch around `createMCPClient` or tool aggregation
**How to avoid:** Wrap each MCP client creation in try/catch, provide fallback tools
**Warning signs:** "Connection refused" errors crash the app, users see 500 errors

### Pitfall 6: Synchronous Sandbox Creation

**What goes wrong:** Chat response waits 200ms for sandbox before AI can respond
**Why it happens:** Creating sandbox before knowing if code execution is needed
**How to avoid:** Only create sandbox when AI calls execute-python tool
**Warning signs:** Slow response times even for simple dataset search queries

## Code Examples

Verified patterns from official sources:

### AI SDK MCP Client with Stdio Transport

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Local FastMCP server via stdio (development only)
const mcpClient = await createMCPClient({
  transport: new StdioClientTransport({
    command: 'python',
    args: ['-m', 'fastmcp', 'run', 'server.py'],
    env: { ...process.env },
  }),
});

const tools = await mcpClient.tools();
// Use tools in generateText() or streamText()
```

### AI SDK MCP Client with HTTP Transport (Production)

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { createMCPClient } from '@ai-sdk/mcp';

const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: 'https://your-fastmcp-server.com/mcp',
    headers: {
      Authorization: `Bearer ${process.env.MCP_API_KEY}`,
    },
  },
});

const tools = await mcpClient.tools({
  schemas: {
    'search-datasets': {
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
    },
  },
});
```

### E2B Sandbox with Timeout and Cleanup

```typescript
// Source: https://e2b.mintlify.app/docs/sandbox.md
import { Sandbox } from '@e2b/code-interpreter';

async function executeInSandbox(code: string) {
  const sandbox = await Sandbox.create({
    timeoutMs: 60 * 60 * 1000, // 1 hour
  });

  try {
    const execution = await sandbox.runCode(code);

    if (execution.error) {
      return { error: execution.error.message };
    }

    return {
      text: execution.text,
      logs: execution.logs,
    };
  } finally {
    await sandbox.kill();
  }
}
```

### Vercel Cron for Sandbox Cleanup

```typescript
// Source: Vercel Cron documentation pattern
// app/api/cron/cleanup-sandboxes/route.ts

import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel Cron: runs every 15 minutes
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find sandboxes older than 1 hour
  const orphanedSandboxes = await db
    .select()
    .from(conversations)
    .where(
      sql`sandbox_id IS NOT NULL
          AND sandbox_created_at < NOW() - INTERVAL '1 hour'`
    );

  // Cleanup (E2B sandboxes auto-terminate on timeout, just clear DB)
  const cleaned = await db
    .update(conversations)
    .set({ sandbox_id: null })
    .where(
      sql`sandbox_id IS NOT NULL
          AND sandbox_created_at < NOW() - INTERVAL '1 hour'`
    )
    .returning();

  return Response.json({
    cleaned: cleaned.length,
    timestamp: new Date().toISOString(),
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| vm2, isolated-vm | E2B, containerized sandboxes | 2023 (vm2 deprecated) | vm2 had security vulnerabilities; E2B provides OS-level isolation |
| Manual JSON-RPC for MCP | @ai-sdk/mcp with type-safe tools | 2025 (AI SDK 6.0) | AI SDK abstracts protocol, provides schema validation, streaming |
| Separate MCP client per framework | Unified `createMCPClient` | 2025 (MCP spec 1.0) | Standard transport interface works across frameworks |
| Custom tool aggregation | AI SDK auto-aggregation | 2025 | Multiple MCP servers "just work" with tool spreading |
| stdio-only MCP servers | HTTP/SSE production-ready | 2025 | stdio can't deploy to serverless; HTTP/SSE enables cloud deployment |

**Deprecated/outdated:**
- **vm2:** Deprecated 2023, use E2B or Firecracker-based solutions
- **isolated-vm:** Not truly isolated (same OS), use E2B
- **Custom MCP JSON-RPC parsers:** Use `@modelcontextprotocol/sdk`
- **Daytona MCP:** Never existed - naming confusion

## Open Questions

Things that couldn't be fully resolved:

1. **E2B MCP Server vs. Direct Integration**
   - What we know: E2B provides Node.js SDK, no official MCP server
   - What's unclear: Should Phase 15 build a thin MCP wrapper around E2B SDK, or integrate E2B tools directly?
   - Recommendation: **Direct integration** - Create AI SDK tools that call E2B SDK internally. Simpler, fewer moving parts, same end result.

2. **FastMCP Server Deployment Strategy**
   - What we know: FastMCP is Python, current project is Next.js/TypeScript
   - What's unclear: Deploy FastMCP separately (Vercel Functions Python runtime?) or use existing FastMCP server?
   - Recommendation: **Separate deployment** - FastMCP server as standalone service, Next.js calls via HTTP transport. Matches production pattern.

3. **MCP Health Check Frequency**
   - What we know: No spec-defined health check, must use tool discovery
   - What's unclear: How often to check? On every request (slow) or periodic background job?
   - Recommendation: **Hybrid** - Check on startup, then periodic (every 5 min), cache status for requests.

4. **Sandbox Reuse vs. Fresh Per Request**
   - What we know: E2B supports reconnecting to running sandboxes
   - What's unclear: Should Phase 15 reuse sandboxes per conversation or create fresh per execution?
   - Recommendation: **Fresh per execution** - Simpler, guaranteed clean state, timeout handling clearer. Optimize later if 200ms startup becomes bottleneck.

5. **E2B Free Tier Limits for Development**
   - What we know: $100 one-time credits, 1-hour sessions, 20 concurrent sandboxes
   - What's unclear: Is this enough for Phase 15 development and testing?
   - Recommendation: **Likely sufficient** - Each execution is seconds, manual testing won't hit 20 concurrent. Monitor usage, upgrade to Pro if needed.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- E2B Sandbox Lifecycle: https://e2b.mintlify.app/docs/sandbox.md (verified 2026-02-01)
- AI SDK MCP Integration: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling (verified 2026-02-01)
- MCP Specification: https://modelcontextprotocol.io/docs (verified 2026-02-01)
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk (verified 2026-02-01)

**GitHub Repositories:**
- Daytona: https://github.com/daytonaio/daytona (confirmed NO MCP server)
- E2B: https://github.com/e2b-dev/e2b (sandbox infrastructure)
- FastMCP: https://github.com/jlowin/fastmcp (Python MCP server framework)

**Package Versions (from project package.json):**
- @ai-sdk/mcp: ^1.0.16 (installed)
- @modelcontextprotocol/sdk: ^1.25.3 (installed)
- ai: ^6.0.64 (installed)
- @vercel/functions: ^3.4.0 (installed)

### Secondary (MEDIUM confidence)

- E2B Pricing: https://e2b.dev/pricing (Hobby tier details verified)
- E2B Company Site: https://e2b.dev (use case descriptions)
- MCP Documentation Index: https://modelcontextprotocol.io/llms.txt (architecture overview)

### Tertiary (LOW confidence - requires validation)

- Vercel Cron implementation patterns (documentation searches returned no results, pattern inferred from Vercel Functions docs)
- Sandbox cleanup best practices (based on E2B SDK docs, not explicit recommendations)

## Metadata

**Confidence breakdown:**
- Daytona MCP non-existence: HIGH - Verified via official GitHub repository README
- E2B as alternative: HIGH - Official documentation, pricing page, SDK examples
- AI SDK MCP patterns: HIGH - Official AI SDK documentation with code examples
- Multi-MCP orchestration: HIGH - Documented in AI SDK reference docs
- Health check patterns: MEDIUM - Custom implementation (no spec-defined protocol)
- Sandbox cleanup: MEDIUM - Based on SDK lifecycle docs, no explicit best practices guide
- Vercel Cron for cleanup: LOW - Pattern inferred, not verified with working example

**Research date:** 2026-02-01
**Valid until:** 2026-02-15 (14 days - E2B and AI SDK are actively developed, check for updates before Phase 15 execution)

**Critical dependencies:**
- E2B API key required (E2B_API_KEY environment variable)
- FastMCP server deployment URL (for data.gv.at MCP server)
- Phase 14 database schema must include `sandbox_id` column (already implemented)

**Recommended pre-Phase-15 validation:**
- Sign up for E2B free tier, test sandbox creation/execution
- Deploy FastMCP server to test environment, verify HTTP transport
- Test multi-MCP client aggregation with AI SDK in local development
