# Phase 9: AI Assistant - Research

**Researched:** 2026-01-22
**Domain:** Vercel AI SDK, MCP Client Integration, Next.js Streaming APIs
**Confidence:** MEDIUM

## Summary

This phase implements a live testing interface for the MCP server using Vercel AI SDK 6.0. The interface allows users to interactively test MCP tools through a chat UI at `/try`, demonstrating the server's capabilities in real-time.

The standard approach combines:
1. **Vercel AI SDK** (already installed: `ai@6.0.41`, `@ai-sdk/react@3.0.43`) for streaming chat with tool calling
2. **MCP TypeScript SDK** (`@modelcontextprotocol/client`) for connecting to the Python MCP server
3. **Next.js App Router API routes** for handling streaming responses
4. **React chat UI** using `useChat` hook with real-time message streaming

Key architectural decision: The chat interface acts as an MCP client that connects to the Python FastMCP server, bridges tool calls through the AI model, and displays results in real-time. This requires careful coordination between three layers: UI (React), API (Next.js route), and MCP server (Python).

**Primary recommendation:** Use Vercel AI SDK's built-in tool calling system to wrap MCP tool invocations, creating a seamless bridge between the LLM and MCP server without building custom streaming infrastructure.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai | 6.0.41 | Vercel AI SDK core - streaming, tool calling | Industry standard for AI chat in Next.js, handles streaming complexity |
| @ai-sdk/react | 3.0.43 | React hooks (useChat) for chat UI | Official React integration, manages message state automatically |
| @modelcontextprotocol/client | latest | MCP client for TypeScript | Official MCP SDK for connecting to MCP servers |
| @modelcontextprotocol/server | latest | Type definitions for MCP protocol | Shared types between client/server |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | latest | Schema validation for MCP tools | Required by MCP SDK for tool input validation |
| @ai-sdk/openai-compatible | 2.0.13 | OpenAI-compatible provider adapter | Already installed, use for any OpenAI-compatible API |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | LangChain | LangChain more heavyweight, AI SDK simpler for streaming chat |
| MCP TypeScript SDK | Direct JSON-RPC | SDK handles lifecycle, reconnection, protocol negotiation automatically |
| useChat hook | Custom WebSocket | useChat handles reconnection, error recovery, optimistic UI |

**Installation:**
```bash
bun add @modelcontextprotocol/client @modelcontextprotocol/server zod
```

Note: `ai` and `@ai-sdk/react` already installed in docs/package.json

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── app/
│   ├── [lang]/
│   │   └── try/              # New chat interface page
│   │       ├── page.tsx      # Chat UI component
│   │       └── layout.tsx    # Optional custom layout
│   └── api/
│       └── chat/
│           └── route.ts      # Streaming API endpoint
├── lib/
│   └── mcp/
│       ├── client.ts         # MCP client singleton
│       └── tools.ts          # Tool mapping/bridge logic
└── components/
    └── chat/
        ├── chat-interface.tsx    # Main chat component
        ├── message-list.tsx      # Message rendering
        └── chat-input.tsx        # Input with send button
```

### Pattern 1: useChat Hook with DefaultChatTransport
**What:** Client-side React hook that manages chat state, sends messages via fetch to API route, streams responses
**When to use:** All streaming chat implementations with Vercel AI SDK
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
'use client';

import { useChat, DefaultChatTransport } from '@ai-sdk/react';

export function ChatInterface() {
  const { messages, sendMessage, status, error, stop } = useChat({
    transport: DefaultChatTransport({ api: '/api/chat' }),
  });

  const handleSubmit = (text: string) => {
    sendMessage({ text });
  };

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, i) => {
            if (part.type === 'text') return <p key={i}>{part.text}</p>;
            if (part.type === 'tool-call') return <ToolCall key={i} {...part} />;
            if (part.type === 'tool-result') return <ToolResult key={i} {...part} />;
          })}
        </div>
      ))}
      <ChatInput onSend={handleSubmit} disabled={status !== 'ready'} />
      {status === 'streaming' && <button onClick={stop}>Stop</button>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Pattern 2: API Route with streamText and Tool Calling
**What:** Server-side streaming endpoint that processes chat messages, calls tools, returns UI message stream
**When to use:** Backend for all Vercel AI SDK chat interfaces
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
import { streamText, tool } from 'ai';
import { openaiCompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages } from 'ai';

export const maxDuration = 30; // Vercel function timeout

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openaiCompatible('claude-3-5-sonnet-20241022'),
    messages: convertToModelMessages(messages),
    tools: {
      searchDatasets: tool({
        description: 'Search Austrian open data datasets',
        inputSchema: z.object({
          query: z.string().describe('Search query'),
        }),
        execute: async ({ query }) => {
          // Call MCP tool here
          const result = await mcpClient.callTool('search_datasets', { query });
          return result;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 3: MCP Client Singleton
**What:** Shared MCP client instance that maintains connection to Python server
**When to use:** Need to call MCP tools from API routes without reconnecting each time
**Example:**
```typescript
// Source: https://github.com/modelcontextprotocol/typescript-sdk
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

class MCPClientManager {
  private client: Client | null = null;
  private connecting: Promise<Client> | null = null;

  async getClient(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;

    this.connecting = this.connect();
    this.client = await this.connecting;
    this.connecting = null;
    return this.client;
  }

  private async connect(): Promise<Client> {
    const transport = new StdioClientTransport({
      command: 'python',
      args: ['-m', 'mcp.app'],
    });

    const client = new Client({ name: 'docs-test-client', version: '1.0.0' });
    await client.connect(transport);

    return client;
  }

  async callTool(name: string, args: Record<string, unknown>) {
    const client = await this.getClient();
    const result = await client.callTool({ name, arguments: args });
    return result;
  }
}

export const mcpClient = new MCPClientManager();
```

### Pattern 4: Message Parts Rendering
**What:** Render different message part types (text, tool-call, tool-result) with appropriate UI
**When to use:** All chat interfaces using Vercel AI SDK v6+ (parts-based messages)
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
function MessagePart({ part }: { part: UIMessagePart }) {
  switch (part.type) {
    case 'text':
      return <div className="prose">{part.text}</div>;

    case 'tool-call':
      return (
        <div className="tool-call">
          <strong>🔧 Calling tool:</strong> {part.toolName}
          <pre>{JSON.stringify(part.args, null, 2)}</pre>
        </div>
      );

    case 'tool-result':
      return (
        <div className="tool-result">
          <strong>✅ Result:</strong>
          <pre>{JSON.stringify(part.result, null, 2)}</pre>
        </div>
      );

    default:
      return null;
  }
}
```

### Anti-Patterns to Avoid
- **Using message.content instead of message.parts:** AI SDK v6 uses parts for rich content, content may be incomplete
- **Not handling tool-call and tool-result parts:** Users need to see MCP tool invocations in testing interface
- **Blocking API route while waiting for tools:** Use streamText's tool execution, it handles streaming updates
- **Creating new MCP client per request:** Connection overhead kills performance, use singleton pattern
- **Not setting maxDuration on streaming routes:** Vercel times out after 10s default, set to 30+ for complex tools
- **Ignoring status !== 'ready':** Prevents double-sending messages during streaming

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message streaming | Custom SSE/WebSocket | Vercel AI SDK streamText + useChat | Handles backpressure, reconnection, partial JSON, error recovery |
| Chat UI state | Custom useState/useReducer | useChat hook | Manages optimistic updates, message ordering, status tracking |
| Rate limiting | Custom in-memory counter | Simple Map-based limiter with timestamps | Production needs Redis (Upstash), but Map sufficient for testing interface |
| Tool input validation | Manual JSON parsing | Zod schemas + MCP SDK | MCP SDK validates against inputSchema automatically |
| MCP protocol handshake | Manual JSON-RPC | @modelcontextprotocol/client | Handles initialize, capability negotiation, reconnection |
| Markdown rendering | Custom parser | Already have MDX setup | Reuse existing Fumadocs markdown components |

**Key insight:** Vercel AI SDK abstracts the entire streaming pipeline. Don't try to optimize streaming yourself - the SDK handles chunking, buffering, error boundaries, and client-side reconstruction better than custom code.

## Common Pitfalls

### Pitfall 1: MCP Client Connection Lifecycle
**What goes wrong:** Client connection fails or hangs because Python server isn't running, wrong transport used, or stdio path incorrect
**Why it happens:** MCP server is Python subprocess (stdio transport), but docs site runs on Node/Bun. Connection requires spawning Python process correctly.
**How to avoid:**
- Use StdioClientTransport with explicit python command and module path
- Add connection retry logic with exponential backoff
- Validate Python environment exists before spawning
- Log connection attempts and errors clearly
- Consider HTTP transport alternative for production (Python server runs independently)
**Warning signs:**
- Client.connect() promise never resolves
- "ENOENT" errors when spawning python
- Connection succeeds but tool calls timeout

### Pitfall 2: Streaming Response Body Already Consumed
**What goes wrong:** Error "Response body already consumed" when calling result.toUIMessageStreamResponse()
**Why it happens:** Trying to read streaming response multiple times, or not returning it directly from API route
**How to avoid:**
- Return result.toUIMessageStreamResponse() directly from POST handler
- Never call .text() or .json() on result before returning
- Don't try to log stream contents server-side
- Use onData/onFinish callbacks for logging, not stream interception
**Warning signs:**
- Works in development, fails in production
- Intermittent "body consumed" errors
- Response starts but never completes

### Pitfall 3: Tool Execution Blocking Streaming
**What goes wrong:** Model starts responding, then pauses for seconds while tool executes, user sees frozen UI
**Why it happens:** Not returning streaming chunks while tool runs, or awaiting tool synchronously
**How to avoid:**
- Let streamText handle tool execution (it streams "thinking" tokens)
- Use async execute functions in tool definitions
- Don't await all tools before streaming starts
- Set reasonable timeouts on MCP tool calls
**Warning signs:**
- Smooth streaming, then long pause, then sudden burst
- Status stays "streaming" but no updates
- Tools work but feel unresponsive

### Pitfall 4: Missing Environment Variables in Edge Runtime
**What goes wrong:** API route works locally but fails in deployment with "model not found" or auth errors
**Why it happens:** Edge runtime strips environment variables, or .env.local not deployed
**How to avoid:**
- Configure environment variables in Vercel dashboard
- Use runtime: 'nodejs' instead of edge for routes that need full Node.js
- Validate required env vars at route startup, fail fast with clear error
- Consider using @vercel/kv or other edge-compatible services
**Warning signs:**
- Works with `bun dev`, fails on Vercel
- No API errors in local logs, cryptic production errors
- Model provider auth fails only in production

### Pitfall 5: Not Handling Tool Call Errors Gracefully
**What goes wrong:** MCP tool throws error, entire chat stream fails, user sees "Something went wrong" with no context
**Why it happens:** Unhandled promise rejections in tool execute functions bubble up and kill stream
**How to avoid:**
- Wrap tool execute in try/catch, return error as tool result
- Use onError in streamText config to log but continue stream
- Return structured error objects: `{ error: true, message: "..." }`
- Show tool errors inline in chat, don't fail entire response
**Warning signs:**
- Random chat failures correlate with specific tool names
- Network logs show 500 errors mid-stream
- Chat works without tools, fails with tools

### Pitfall 6: Rate Limiting Shared Across All Users
**What goes wrong:** Rate limiter uses single counter, legitimate users blocked by other users' requests
**Why it happens:** Simple in-memory counter without per-user/per-IP tracking
**How to avoid:**
- Use Map<string, RateLimitInfo> keyed by IP or session ID
- Implement sliding window or token bucket algorithm
- For production, use Upstash Rate Limit (@upstash/ratelimit)
- Document rate limits clearly in UI ("5 messages per minute")
**Warning signs:**
- Users report random "rate limited" errors
- Rate limit triggers early in session
- Multiple tabs/windows share one limit

### Pitfall 7: Large Tool Results Breaking UI
**What goes wrong:** MCP tool returns 10MB JSON dataset, browser freezes rendering massive chat message
**Why it happens:** No result size limits, trying to render entire dataset in chat UI
**How to avoid:**
- Truncate large tool results before rendering (show first 100 lines + "... X more")
- Add result size limits in tool execute (return error if >1MB)
- Use collapsible/expandable sections for tool results
- Consider pagination or download link for large datasets
**Warning signs:**
- Chat works for small queries, freezes on "search all"
- Browser memory usage spikes during tool calls
- Tool completes but UI never updates

## Code Examples

Verified patterns from official sources:

### Basic Chat Interface Component
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
'use client';

import { useChat, DefaultChatTransport } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/react';

export function ChatInterface() {
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    clearError
  } = useChat({
    transport: DefaultChatTransport({ api: '/api/chat' }),
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    if (!input.value.trim()) return;

    sendMessage({ text: input.value });
    input.value = '';
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <MessageRenderer key={message.id} message={message} />
        ))}
        {status === 'streaming' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error.message}</p>
          <button onClick={clearError} className="text-sm underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="message"
          placeholder="Ask about Austrian datasets..."
          className="flex-1 border rounded px-4 py-2"
          disabled={status !== 'ready'}
        />
        <button
          type="submit"
          disabled={status !== 'ready'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          {status === 'streaming' ? 'Sending...' : 'Send'}
        </button>
        {status === 'streaming' && (
          <button
            type="button"
            onClick={stop}
            className="px-4 py-2 border rounded"
          >
            Stop
          </button>
        )}
      </form>
    </div>
  );
}

function MessageRenderer({ message }: { message: UIMessage }) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        message.role === 'user'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted'
      }`}>
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return <div key={i} className="prose prose-sm">{part.text}</div>;
          }
          if (part.type === 'tool-call') {
            return (
              <div key={i} className="mt-2 p-2 bg-blue-500/10 rounded text-xs">
                <div className="font-medium">🔧 {part.toolName}</div>
                <pre className="mt-1 overflow-x-auto">
                  {JSON.stringify(part.args, null, 2)}
                </pre>
              </div>
            );
          }
          if (part.type === 'tool-result') {
            return (
              <div key={i} className="mt-2 p-2 bg-green-500/10 rounded text-xs">
                <div className="font-medium">✅ Result</div>
                <pre className="mt-1 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(part.result, null, 2)}
                </pre>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
```

### API Route with MCP Tool Integration
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { streamText, tool } from 'ai';
import { openaiCompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages } from 'ai';
import { z } from 'zod';
import { mcpClient } from '@/lib/mcp/client';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get MCP tools dynamically from server
    const mcpTools = await mcpClient.listTools();

    // Convert MCP tools to AI SDK tool format
    const tools = Object.fromEntries(
      mcpTools.map((mcpTool) => [
        mcpTool.name,
        tool({
          description: mcpTool.description || `Call ${mcpTool.name}`,
          inputSchema: mcpTool.inputSchema as z.ZodType,
          execute: async (args) => {
            try {
              const result = await mcpClient.callTool(mcpTool.name, args);
              return result;
            } catch (error) {
              return {
                error: true,
                message: error instanceof Error ? error.message : 'Tool execution failed',
              };
            }
          },
        }),
      ])
    );

    const result = streamText({
      model: openaiCompatible('claude-3-5-sonnet-20241022', {
        baseURL: process.env.ANTHROPIC_BASE_URL,
        apiKey: process.env.ANTHROPIC_API_KEY,
      }),
      system: 'You are a helpful assistant for exploring Austrian open data from data.gv.at. Use the available tools to search and retrieve dataset information.',
      messages: convertToModelMessages(messages),
      tools,
      maxSteps: 5, // Allow multi-step tool calling
      onFinish: ({ finishReason, usage }) => {
        console.log('[Chat] Finished:', finishReason, 'tokens:', usage);
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true, // Include reasoning tokens if model provides them
      onError: (error) => {
        console.error('[Chat] Stream error:', error);
        return 'An error occurred while processing your request. Please try again.';
      },
    });
  } catch (error) {
    console.error('[Chat] API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Simple Rate Limiting Middleware
```typescript
// Source: Common Next.js pattern (not Vercel AI SDK specific)
// Note: For production, use @upstash/ratelimit with Redis

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request, limit = 10, windowMs = 60000): boolean {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Usage in API route:
export async function POST(req: Request) {
  if (!rateLimit(req, 5, 60000)) { // 5 requests per minute
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // ... rest of handler
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK 3.x message.content | AI SDK 6.x message.parts | v4.0 (2024) | Must render parts array, not single content string |
| Custom SSE parsing | Built-in streaming with toUIMessageStreamResponse | v3.0 (2023) | Eliminated 90% of custom streaming code |
| Manual tool calling with function_call | Native tools with tool() helper | v3.0 (2023) | Simpler tool definitions, automatic validation |
| Separate tool call and result messages | Tool parts within assistant message | v6.0 (2025) | Better UX, grouped tool interactions |
| Custom rate limiting in route | Vercel Edge Config + KV | Ongoing | Edge-compatible, distributed rate limiting |

**Deprecated/outdated:**
- **StreamingTextResponse**: Replaced by toUIMessageStreamResponse for richer message types
- **experimental_onToolCall**: Now built-in tool execution in streamText
- **message.content**: Use message.parts for v6+ compatibility
- **useCompletion hook**: For text completion, but useChat preferred for interactive interfaces

## Open Questions

Things that couldn't be fully resolved:

1. **MCP Server Connection Strategy**
   - What we know: Can use stdio (spawn Python subprocess) or HTTP (separate Python server)
   - What's unclear: Which is more reliable for production? Stdio has lower latency but process management complexity.
   - Recommendation: Start with stdio for simplicity (testing interface, low traffic). Document HTTP migration path for production scale.

2. **Model Provider Configuration**
   - What we know: Project has @ai-sdk/openai-compatible installed, which can call Anthropic
   - What's unclear: What API keys/endpoints are configured? Where should they come from (env vars vs Vercel)?
   - Recommendation: Use ANTHROPIC_API_KEY env var, fail fast if missing. Document in setup instructions.

3. **Rate Limiting Storage**
   - What we know: Simple Map works for testing, production needs Redis (Upstash)
   - What's unclear: What rate limits are appropriate for testing interface? Should it be per-IP or per-session?
   - Recommendation: Use conservative limits (5 messages/minute) with Map storage. Add Upstash in Phase 10+ if needed.

4. **Tool Result Size Limits**
   - What we know: MCP tools can return large datasets, need truncation
   - What's unclear: What's reasonable size limit? 100KB? 1MB? Should it vary by tool?
   - Recommendation: Start with 10KB rendered, show "expand" for larger. Add per-tool limits if specific tools problematic.

5. **Navigation Integration**
   - What we know: Need to add /try page to Fumadocs navigation
   - What's unclear: Exact structure of meta.json for adding pages outside docs folder
   - Recommendation: Add as external link in root meta.json, or create /[lang]/try route for localization.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK - Chatbot Documentation](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) - Chat implementation patterns
- [Vercel AI SDK - useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Hook API and configuration
- [Vercel AI SDK - Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Tool integration patterns
- [Model Context Protocol - Architecture](https://modelcontextprotocol.io/docs/concepts/architecture) - MCP protocol design
- [Model Context Protocol - TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK repository

### Secondary (MEDIUM confidence)
- [Model Context Protocol - Clients Documentation](https://modelcontextprotocol.io/docs/tools/clients) - Client building guidance (site structure reference, not detailed implementation)
- [Model Context Protocol - SDK Overview](https://modelcontextprotocol.io/docs/sdk) - SDK list and capabilities

### Tertiary (LOW confidence)
- WebSearch findings on Next.js rate limiting patterns - General patterns, not specific to this stack
- WebSearch findings on chat interface design - UI/UX guidance, not technical implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation and installed packages verified
- Architecture: HIGH - Patterns from official Vercel AI SDK docs, MCP SDK repo
- Pitfalls: MEDIUM - Based on common issues in docs/GitHub, not exhaustive testing
- MCP integration: MEDIUM - TypeScript SDK documented but specific stdio connection to Python FastMCP needs validation
- Rate limiting: LOW - Simple pattern documented, production Redis approach not researched in depth

**Research date:** 2026-01-22
**Valid until:** 2026-02-15 (30 days - Vercel AI SDK stable, MCP SDK active development)

**Key uncertainties for planner:**
- MCP client connection configuration (Python subprocess path, args) - may need iteration
- Model provider setup (API keys, base URLs) - depends on project environment
- Navigation integration exact pattern - Fumadocs meta.json structure not fully verified
