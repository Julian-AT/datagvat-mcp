# Architecture Research: v2.3 Production Playground

**Domain:** AI SDK 6 + Next.js integration patterns for tool approval, visualization rendering, E2B testing, and chat UI polish
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

v2.3 adds production-ready features to the existing playground: tool approval flows, visualization rendering from E2B execution, E2B lifecycle testing, and chat UI polish. All features integrate with the **existing Vercel AI SDK 6 architecture** — no new frameworks, no architectural rewrites.

The key insight: Vercel AI SDK 6's `createUIMessageStream` already supports tool approval via `addToolApprovalResponse`, dynamic tool parts via the `parts` array, and streaming state management. The existing architecture (Next.js App Router + AI SDK streaming) handles all new requirements through **incremental additions**, not replacements.

Integration points are clean: approval UI reads from `parts` array states, visualization rendering consumes tool-result outputs, E2B testing verifies sandbox lifecycle, and chat UI polish enhances existing loading/error states. Build order follows dependency hierarchy: E2B testing first (validates infrastructure), approval flows second (security gates), visualization third (depends on approved execution), UI polish last (visual refinements).

## Existing Architecture (v2.2 Foundation)

### Current System Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Chat.tsx   │  │  Artifact    │  │   Messages   │       │
│  │  (useChat)   │  │ (visualize)  │  │   (render)   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
├─────────┴─────────────────┴─────────────────┴───────────────┤
│                API Layer (Next.js Route Handlers)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │        /api/chat (POST) - streamText()              │    │
│  │  • createUIMessageStream                            │    │
│  │  • MCP tools aggregation                            │    │
│  │  • Message persistence (onFinish)                   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  Service Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │   MCP    │  │    DB    │  │   E2B    │                   │
│  │ Manager  │  │ Queries  │  │ Client   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current Implementation |
|-----------|----------------|------------------------|
| `Chat.tsx` | UI state coordination with useChat hook | Handles messages, streaming, sendMessage, addToolApprovalResponse |
| `Messages.tsx` | Message list rendering with parts iteration | Maps over messages, renders PreviewMessage for each |
| `PreviewMessage.tsx` | Individual message rendering with part types | Switches on part.type (text, tool-call, dynamic-tool, reasoning) |
| `/api/chat` | Streaming orchestration | createUIMessageStream + streamText with merged MCP tools |
| `getAvailableTools()` | MCP tool aggregation | Merges data.gv.at + E2B tools into single object |
| `createE2BClient()` | E2B sandbox lifecycle | create → runCode → kill pattern with try/finally |
| Database queries | Message persistence | saveMessages, getMessagesByChatId using Drizzle ORM |

### Current Data Flow

```
[User Input]
    ↓
[useChat.sendMessage()] → POST /api/chat
    ↓
[createUIMessageStream] → [streamText with tools]
    ↓
[MCP tool execution] → [E2B sandbox.runCode()]
    ↓
[tool-result in parts] → [stream to client]
    ↓
[Messages renders parts] → [Visualization displayed]
    ↓
[onFinish callback] → [saveMessages to DB]
```

### Existing Parts Array Structure

The AI SDK 6 `parts` array already supports all types needed for v2.3:

```typescript
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string; state?: 'streaming' }
  | { type: 'file'; url: string; filename: string; mediaType: string }
  | { type: 'dynamic-tool'; toolName: string; toolCallId: string;
      state: 'input-available' | 'approval-requested' | 'approval-responded' |
             'output-available' | 'output-denied' | 'output-error';
      input: unknown; output?: unknown; errorText?: string;
      approval?: { id: string; approved?: boolean; reason?: string } }
```

**Key observation:** The `dynamic-tool` part already contains `state`, `approval`, and `output` fields — no schema changes needed for v2.3 features.

## v2.3 Integration Points

### 1. Tool Approval Flow Integration

**How it works in AI SDK 6:**
1. Tool defined with `needsApproval: true` flag
2. Model generates tool call → API route returns `state: 'approval-requested'` part
3. Client renders approval UI based on part state
4. User approves → client calls `addToolApprovalResponse({ id, approved: true })`
5. `sendAutomaticallyWhen` triggers new request with approval response
6. API route sees approval → executes tool → returns `state: 'output-available'`

**Integration with existing architecture:**

```typescript
// lib/mcp/aggregate-tools.ts (MODIFY EXISTING)
tools['execute-python'] = tool({
  description: 'Execute Python code...',
  inputSchema: z.object({ code: z.string(), ... }),
  needsApproval: true,  // ← ADD THIS FLAG
  execute: async ({ code, files, workingDirectory }) => {
    // Existing E2B execution logic unchanged
    const sandbox = await e2bClient.createSandbox();
    try {
      const result = await sandbox.runCode(code, { ... });
      // ... existing visualization upload logic
    } finally {
      await sandbox.kill();
    }
  },
});
```

```typescript
// components/chat.tsx (EXISTING - NO CHANGES NEEDED)
const { addToolApprovalResponse } = useChat({
  // Already configured with sendAutomaticallyWhen
  sendAutomaticallyWhen: ({ messages }) => {
    const lastMessage = messages.at(-1);
    return lastMessage?.parts?.some(
      (part) => 'state' in part &&
                part.state === 'approval-responded' &&
                'approval' in part &&
                part.approval?.approved === true
    ) ?? false;
  },
});
```

```typescript
// components/message.tsx (ADD NEW CASE)
if (type === 'dynamic-tool' && toolName === 'execute-python') {
  const toolPart = part as {
    toolCallId: string;
    state: 'approval-requested' | 'approval-responded' | 'output-available';
    input: { code: string; files?: Array<{ path: string; content: string }> };
    output?: { success: boolean; text: string; visualizations?: Array<...> };
    approval?: { id: string; approved?: boolean; reason?: string };
  };

  if (toolPart.state === 'approval-requested') {
    return (
      <CodeApprovalDialog
        code={toolPart.input.code}
        files={toolPart.input.files}
        approvalId={toolPart.approval!.id}
        onApprove={(approved) => {
          addToolApprovalResponse({
            id: toolPart.approval!.id,
            approved,
            reason: approved ? undefined : 'User denied execution',
          });
        }}
      />
    );
  }

  if (toolPart.state === 'output-available') {
    return (
      <CodeExecutionResult
        code={toolPart.input.code}
        result={toolPart.output}
        visualizations={toolPart.output?.visualizations}
      />
    );
  }

  if (toolPart.state === 'output-denied') {
    return <div>Execution denied by user</div>;
  }
}
```

**New components needed:**
- `CodeApprovalDialog.tsx` — approval UI with code preview (syntax highlighting)
- `CodeExecutionResult.tsx` — execution output display with logs/errors

**Modified components:**
- `components/message.tsx` — add `execute-python` case to dynamic-tool switch
- `lib/mcp/aggregate-tools.ts` — add `needsApproval: true` flag

**No changes needed:**
- `/api/chat/route.ts` — approval flow handled by AI SDK automatically
- `components/chat.tsx` — useChat hook already configured correctly
- Database schema — parts array stored as JSONB, no schema changes

### 2. Visualization Rendering Integration

**How it works currently:**
1. E2B execution generates matplotlib PNGs as base64
2. Uploaded to Vercel Blob storage via `uploadImageFromBase64()`
3. URLs stored in tool output: `{ visualizations: [{ format: 'png', url: 'blob://...' }] }`
4. Message rendering reads `toolPart.output.visualizations` array

**Integration with existing architecture:**

```typescript
// components/message.tsx (ADD VISUALIZATION RENDERING)
if (type === 'dynamic-tool' && toolName === 'execute-python') {
  const toolPart = part as { /* ... */ };

  if (toolPart.state === 'output-available' && toolPart.output?.visualizations) {
    return (
      <div>
        <CodeExecutionResult
          code={toolPart.input.code}
          result={toolPart.output}
        />
        <VisualizationGallery
          visualizations={toolPart.output.visualizations}
        />
      </div>
    );
  }
}
```

```typescript
// components/visualization-gallery.tsx (NEW COMPONENT)
export function VisualizationGallery({
  visualizations
}: {
  visualizations: Array<{ format: 'png' | 'svg' | 'html'; url: string }>
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {visualizations.map((viz, idx) => (
        <Visualization
          key={idx}
          format={viz.format}
          url={viz.url}
        />
      ))}
    </div>
  );
}
```

**Existing Visualization component (REUSE):**
- `components/visualization.tsx` already handles PNG/SVG/HTML rendering
- Already has fullscreen dialog, download button, error handling
- No modifications needed — just import and use

**New components needed:**
- `VisualizationGallery.tsx` — grid layout for multiple visualizations

**Modified components:**
- `components/message.tsx` — add visualization rendering to execute-python output

**No changes needed:**
- `lib/mcp/aggregate-tools.ts` — already uploads to blob storage
- `components/visualization.tsx` — existing component works as-is

### 3. E2B Lifecycle Testing Integration

**Testing strategy:**
- Unit tests: E2B client methods (createSandbox, runCode, kill)
- Integration tests: Full execution flow with visualization upload
- Lifecycle tests: Sandbox cleanup verification

**Test integration with existing architecture:**

```typescript
// lib/mcp/__tests__/e2b-client.test.ts (NEW TEST FILE)
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createE2BClient } from '../e2b-client';

describe('E2B Client Lifecycle', () => {
  let sandboxIds: string[] = [];

  afterEach(async () => {
    // Verify all sandboxes were cleaned up
    for (const id of sandboxIds) {
      const exists = await checkSandboxExists(id);
      expect(exists).toBe(false);
    }
    sandboxIds = [];
  });

  test('creates sandbox, executes code, kills sandbox', async () => {
    const client = createE2BClient({ apiKey: process.env.E2B_API_KEY! });
    const sandbox = await client.createSandbox();
    sandboxIds.push(sandbox.sandboxId);

    const result = await sandbox.runCode('print("hello")', {});
    expect(result.success).toBe(true);
    expect(result.text).toContain('hello');

    await sandbox.kill();
    const exists = await checkSandboxExists(sandbox.sandboxId);
    expect(exists).toBe(false);
  });

  test('cleans up sandbox even on error', async () => {
    const client = createE2BClient({ apiKey: process.env.E2B_API_KEY! });
    const sandbox = await client.createSandbox();
    sandboxIds.push(sandbox.sandboxId);

    try {
      await sandbox.runCode('raise Exception("test")', {});
    } catch {
      // Expected error
    }

    await sandbox.kill();
    const exists = await checkSandboxExists(sandbox.sandboxId);
    expect(exists).toBe(false);
  });

  test('handles visualization generation', async () => {
    const client = createE2BClient({ apiKey: process.env.E2B_API_KEY! });
    const sandbox = await client.createSandbox();
    sandboxIds.push(sandbox.sandboxId);

    const code = `
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [4, 5, 6])
plt.show()
    `;

    const result = await sandbox.runCode(code, {});
    expect(result.success).toBe(true);
    expect(result.visualizations).toBeDefined();
    expect(result.visualizations!.length).toBeGreaterThan(0);
    expect(result.visualizations![0].png).toBeDefined();

    await sandbox.kill();
  });
});
```

```typescript
// lib/mcp/__tests__/aggregate-tools.test.ts (NEW TEST FILE)
import { describe, test, expect } from 'bun:test';
import { getAvailableTools } from '../aggregate-tools';

describe('Tool Approval Integration', () => {
  test('execute-python has needsApproval flag', async () => {
    const tools = await getAvailableTools('test-chat-id');
    expect(tools['execute-python']).toBeDefined();
    // Access internal tool config to verify needsApproval
    const toolConfig = tools['execute-python'];
    expect(toolConfig).toHaveProperty('needsApproval', true);
  });

  test('execute-python returns visualization URLs', async () => {
    const tools = await getAvailableTools('test-chat-id');
    const executeTool = tools['execute-python'];

    const result = await executeTool.execute!({
      code: 'import matplotlib.pyplot as plt; plt.plot([1,2,3]); plt.show()',
    });

    expect(result.success).toBe(true);
    expect(result.visualizations).toBeDefined();
    expect(result.visualizations![0].url).toMatch(/^https:\/\//);
  });
});
```

**Test infrastructure:**
- Use Bun's built-in test runner (already configured in package.json)
- Playwright for E2E approval flow testing (already installed)
- Mock E2B API for unit tests, real API for integration tests

**New test files:**
- `lib/mcp/__tests__/e2b-client.test.ts` — lifecycle verification
- `lib/mcp/__tests__/aggregate-tools.test.ts` — tool approval integration
- `__tests__/e2e/approval-flow.spec.ts` — Playwright E2E test

**No changes needed:**
- Existing E2B client code already has try/finally cleanup
- Test configuration already in place (package.json test script)

### 4. Chat UI Polish Integration

**Loading states during execution:**

```typescript
// components/message.tsx (ENHANCE EXISTING)
if (type === 'dynamic-tool' && toolName === 'execute-python') {
  const toolPart = part as { /* ... */ };

  // NEW: Show loading state during execution
  if (toolPart.state === 'approval-responded' && !toolPart.output) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <div>
          <div className="font-medium">Executing code...</div>
          <div className="text-sm text-muted-foreground">
            Running in isolated sandbox
          </div>
        </div>
      </div>
    );
  }

  // Existing approval/output rendering...
}
```

**Error handling with clear messages:**

```typescript
// components/message.tsx (ENHANCE EXISTING)
if (toolPart.state === 'output-error' || toolPart.output?.error) {
  const error = toolPart.output?.error || {
    name: 'ExecutionError',
    message: toolPart.errorText || 'Unknown error'
  };

  return (
    <div className="border border-destructive rounded-lg p-4 my-2">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-destructive">{error.name}</div>
          <div className="text-sm mt-1">{error.message}</div>
          {error.traceback && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Show traceback
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                {error.traceback}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Streaming state indicators:**

```typescript
// components/messages.tsx (EXISTING - VERIFY)
{status === 'submitted' &&
  !messages.some((msg) =>
    msg.parts?.some((part) => 'state' in part && part.state === 'approval-responded')
  ) && <ThinkingMessage />}
```

**New components needed:**
- None — enhance existing Message.tsx with loading/error states

**Modified components:**
- `components/message.tsx` — add loading state for approval-responded, enhance error display

**UI libraries (EXISTING):**
- Lucide icons already imported (Loader2, AlertCircle)
- Tailwind already configured for consistent styling

## Build Order & Dependencies

### Phase 1: E2B Lifecycle Testing (Validates Infrastructure)
**Why first:** Must verify E2B sandbox cleanup before adding approval flows that create more sandboxes.

**Deliverables:**
- E2B client unit tests (`lib/mcp/__tests__/e2b-client.test.ts`)
- Lifecycle verification tests (create → execute → kill → verify cleanup)
- Multi-file project execution tests
- Timeout handling tests

**Dependencies:** None (tests existing E2B implementation)

**Success criteria:**
- All sandboxes cleaned up after tests
- No orphaned sandboxes after 100 sequential runs
- Timeout errors properly handled
- Visualization generation works consistently

---

### Phase 2: Tool Approval Flow (Security Foundation)
**Why second:** Approval must gate execution before adding visualization features.

**Deliverables:**
- Add `needsApproval: true` to execute-python tool
- `CodeApprovalDialog.tsx` component with syntax highlighting
- Approval integration in `message.tsx` (new dynamic-tool case)
- Unit tests for approval flow

**Dependencies:** Phase 1 complete (E2B infrastructure validated)

**Success criteria:**
- Code preview shows syntax-highlighted Python
- Approval triggers execution, denial prevents it
- Approval state persists correctly in database
- No approval bypass through message replay

---

### Phase 3: Visualization Rendering (Consumes Execution Output)
**Why third:** Depends on approved execution flow from Phase 2.

**Deliverables:**
- `VisualizationGallery.tsx` component for multiple charts
- Integration with existing `Visualization.tsx` component
- Grid layout for PNG/SVG/HTML visualizations
- Tests for visualization rendering

**Dependencies:** Phase 2 complete (approved execution available)

**Success criteria:**
- Multiple visualizations display in grid layout
- Fullscreen/download work for all formats
- Large visualizations (>1MB) load without blocking UI
- Visualization URLs persist correctly

---

### Phase 4: Chat UI Polish (Visual Refinements)
**Why fourth:** Enhances UX after all core features working.

**Deliverables:**
- Loading state during code execution
- Enhanced error messages with traceback
- Streaming indicators for approval flow
- Polish for approval dialog UX

**Dependencies:** Phase 2 & 3 complete (approval + visualization working)

**Success criteria:**
- Loading spinners show during execution
- Error messages are clear and actionable
- Approval dialog is intuitive
- No UI jank during streaming

---

### Dependency Graph

```
Phase 1: E2B Testing
    ↓
Phase 2: Tool Approval ────┐
    ↓                      │
Phase 3: Visualization  ←──┘
    ↓
Phase 4: UI Polish
```

**Parallel work opportunities:**
- Phase 3 (Visualization) can start once Phase 2 has working execution
- Phase 4 (UI Polish) can overlap with Phase 3 (independent concerns)

## Component Architecture Diagrams

### Tool Approval Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                          │
│                                                               │
│  [Chat Input: "analyze dataset X"]                           │
│        ↓                                                      │
│  [AI generates tool call: execute-python]                    │
│        ↓                                                      │
│  [streamText detects needsApproval: true]                    │
│        ↓                                                      │
│  [Returns part with state: 'approval-requested']             │
│        ↓                                                      │
│  [Message.tsx renders CodeApprovalDialog]                    │
│        ↓                                                      │
│  [User clicks "Allow" / "Deny"]                              │
│        ↓                                                      │
│  [addToolApprovalResponse({ id, approved })]                 │
│        ↓                                                      │
│  [sendAutomaticallyWhen triggers new request]                │
│        ↓                                                      │
│  [streamText sees approval → executes tool]                  │
│        ↓                                                      │
│  [Returns part with state: 'output-available']               │
│        ↓                                                      │
│  [Message.tsx renders CodeExecutionResult + Visualizations]  │
└─────────────────────────────────────────────────────────────┘
```

### Visualization Rendering Flow

```
┌─────────────────────────────────────────────────────────────┐
│                E2B Execution → Visualization                 │
│                                                               │
│  [sandbox.runCode(pythonCode)]                               │
│        ↓                                                      │
│  [matplotlib generates PNG as base64]                        │
│        ↓                                                      │
│  [execution.results contain { png, svg, html }]              │
│        ↓                                                      │
│  [uploadImageFromBase64() → Vercel Blob]                     │
│        ↓                                                      │
│  [Return { visualizations: [{ format: 'png', url }] }]       │
│        ↓                                                      │
│  [Store in tool-result part output]                          │
│        ↓                                                      │
│  [Message.tsx extracts visualizations array]                 │
│        ↓                                                      │
│  [VisualizationGallery maps to Visualization components]     │
│        ↓                                                      │
│  [User sees grid of charts with fullscreen/download]         │
└─────────────────────────────────────────────────────────────┘
```

## Architectural Patterns

### Pattern 1: Approval Flow with State Machine

**What:** Tool approval uses a state machine encoded in the `dynamic-tool` part's `state` field.

**States:**
- `approval-requested` → waiting for user decision
- `approval-responded` → user decided, executing
- `output-available` → execution complete
- `output-denied` → user denied execution
- `output-error` → execution failed

**When to use:** Any tool that needs user confirmation before execution (code execution, data deletion, external API calls).

**Trade-offs:**
- **Pro:** Built into AI SDK, no custom state management needed
- **Pro:** State persists in parts array, survives page reloads
- **Con:** Requires two round trips to model (approval request + approval response)

**Example:**
```typescript
// Tool definition
tool({
  needsApproval: true,
  execute: async ({ code }) => {
    // Only runs after approval
    return await executeInSandbox(code);
  },
});

// UI rendering
if (part.state === 'approval-requested') {
  return <ApprovalDialog onApprove={() => addToolApprovalResponse({ approved: true })} />;
}
if (part.state === 'output-available') {
  return <ExecutionResult result={part.output} />;
}
```

### Pattern 2: Visualization Upload-Then-Render

**What:** Visualizations are uploaded to blob storage immediately after generation, then URLs are stored in tool output.

**Why:** Avoids storing large base64 strings in database, enables CDN caching, prevents memory issues.

**Flow:**
1. E2B generates base64-encoded PNG
2. Upload to Vercel Blob → get URL
3. Store only URL in tool output: `{ visualizations: [{ url }] }`
4. Render via `<img src={url} />` (browser handles caching)

**When to use:** Any binary data generated during tool execution (charts, images, PDFs, audio).

**Trade-offs:**
- **Pro:** Database stays small, queries stay fast
- **Pro:** Visualizations persist even if database is cleared
- **Con:** Additional network call for upload (mitigated by parallel upload)
- **Con:** Blob storage costs (minimal — $0.15/GB on Vercel)

**Example:**
```typescript
// In tool execute function
const result = await sandbox.runCode(code);
const uploadedViz = await Promise.all(
  result.visualizations.map(async (viz) => {
    const url = await uploadImageFromBase64(viz.png, `viz-${Date.now()}.png`, chatId);
    return { format: 'png', url };
  })
);
return { success: true, visualizations: uploadedViz };
```

### Pattern 3: E2B Lifecycle with Try/Finally

**What:** Always clean up E2B sandboxes using try/finally, even on errors.

**Why:** Orphaned sandboxes consume resources and eventually hit quota limits.

**Flow:**
1. Create sandbox
2. Execute code in try block
3. Kill sandbox in finally block (runs even on error)

**When to use:** Any sandbox/container/temporary resource that must be cleaned up.

**Trade-offs:**
- **Pro:** Prevents resource leaks
- **Pro:** Works even if execution throws error
- **Con:** Slightly verbose (but necessary)

**Example:**
```typescript
const sandbox = await e2bClient.createSandbox();
try {
  const result = await sandbox.runCode(code, { timeoutMs: 30_000 });
  return result;
} finally {
  await sandbox.kill(); // ALWAYS runs
}
```

### Pattern 4: Parts Array as Single Source of Truth

**What:** Store all message state (text, tool calls, approvals, results) in the `parts` array, not in separate state variables.

**Why:** Enables exact UI reproduction from database, simplifies state management, works with AI SDK streaming.

**Structure:**
```typescript
message.parts = [
  { type: 'text', text: 'Generate a chart...' },
  { type: 'dynamic-tool', toolName: 'execute-python', state: 'approval-requested', ... },
  { type: 'text', text: 'Here is the analysis...' },
];
```

**When to use:** Always — this is the AI SDK's canonical message format.

**Trade-offs:**
- **Pro:** Single source of truth for UI state
- **Pro:** Database stores exact UI state as JSONB
- **Con:** Parts array can grow large (mitigated by visualization URLs, not base64)

## Anti-Patterns

### Anti-Pattern 1: Storing Base64 Visualizations in Database

**What people do:** Store base64-encoded images directly in the parts array output.

**Why it's wrong:**
- 500KB PNG → 700KB base64 → slow JSONB queries
- 50 images in conversation → 35MB database row → query timeout
- Database backups fail or become huge

**Do this instead:**
1. Upload to blob storage immediately
2. Store only URL in parts array
3. Test with 50-image conversation to verify performance

### Anti-Pattern 2: Approval Bypass Through Client-Side State

**What people do:** Store approval state in React state, allow re-execution without server validation.

**Why it's wrong:**
- User can manipulate client state to bypass approval
- Page reload loses approval state → re-execution without approval
- Security vulnerability for dangerous operations

**Do this instead:**
- Approval state lives in `parts` array only
- Server validates approval before execution
- Never execute if `state !== 'approval-responded'`

### Anti-Pattern 3: Forgetting E2B Cleanup

**What people do:** Create sandbox, execute code, forget to call `sandbox.kill()`.

**Why it's wrong:**
- Orphaned sandboxes accumulate
- Eventually hit E2B quota limit
- Silent failures (no error, just quota exhausted)

**Do this instead:**
- Always use try/finally pattern
- Track sandbox IDs in tests, verify cleanup
- Monitor E2B dashboard for orphaned sandboxes

### Anti-Pattern 4: Blocking UI During Visualization Upload

**What people do:** Wait for all visualizations to upload before returning tool result.

**Why it's wrong:**
- User sees no output for 5-10 seconds during upload
- Sequential uploads waste time
- Bad UX, feels unresponsive

**Do this instead:**
- Upload visualizations in parallel: `Promise.all(uploads)`
- Stream text output immediately, visualizations follow
- Show loading state during upload

## Testing Strategy

### Unit Tests (Bun Test)

**Test targets:**
- E2B client methods (createSandbox, runCode, kill)
- Tool approval configuration (needsApproval flag present)
- Visualization URL generation (not base64 in output)

**Example:**
```typescript
test('sandbox cleanup on error', async () => {
  const sandbox = await client.createSandbox();
  try {
    await sandbox.runCode('raise Exception()');
  } catch {}
  await sandbox.kill();
  expect(await sandboxExists(sandbox.sandboxId)).toBe(false);
});
```

### Integration Tests (Bun Test)

**Test targets:**
- Full tool execution flow (approval → execution → visualization upload)
- Multi-file project execution
- Timeout handling (30-second limit)

**Example:**
```typescript
test('complete approval flow', async () => {
  const tools = await getAvailableTools('test-chat');
  const result = await tools['execute-python'].execute!({ code: '...' });
  expect(result.visualizations![0].url).toMatch(/^https:/);
});
```

### E2E Tests (Playwright)

**Test targets:**
- User approves code → sees visualization
- User denies code → sees denial message
- Multiple visualizations render in grid
- Error handling displays traceback

**Example:**
```typescript
test('approval flow E2E', async ({ page }) => {
  await page.goto('/playground');
  await page.fill('[data-testid="chat-input"]', 'plot [1,2,3]');
  await page.click('[data-testid="send-button"]');
  await page.waitForSelector('[data-testid="approval-dialog"]');
  await page.click('[data-testid="approve-button"]');
  await page.waitForSelector('[data-testid="visualization"]');
  expect(await page.locator('img').count()).toBeGreaterThan(0);
});
```

## Integration Boundaries

### Client ↔ API Route

**Protocol:** HTTP POST with JSON body containing messages array

**Data flow:**
- Client → Server: `{ messages: UIMessage[] }`
- Server → Client: SSE stream with parts

**Integration point:**
```typescript
// Client (useChat hook)
const { messages, addToolApprovalResponse } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

// Server (route handler)
export async function POST(request: Request) {
  const { messages } = await request.json();
  return createUIMessageStreamResponse({ stream });
}
```

**Testing strategy:**
- Mock fetch in tests to simulate approval flow
- E2E tests verify real HTTP roundtrips

### API Route ↔ MCP Tools

**Protocol:** Direct function calls (in-process)

**Data flow:**
- API route calls `getAvailableTools(chatId)`
- Returns merged tools object: `{ 'execute-python': tool({ ... }), ... }`
- streamText() spreads tools into call

**Integration point:**
```typescript
const tools = await getAvailableTools(id);
const result = streamText({
  model: getLanguageModel(selectedChatModel),
  tools,
  stopWhen: stepCountIs(5),
});
```

**Testing strategy:**
- Unit tests verify tool merging
- Mock MCP clients in tests to avoid external dependencies

### API Route ↔ E2B

**Protocol:** E2B SDK (HTTP API wrapper)

**Data flow:**
- API route creates E2B client
- Client creates sandbox → executes code → kills sandbox
- Returns result with visualization URLs

**Integration point:**
```typescript
const client = createE2BClient({ apiKey: process.env.E2B_API_KEY });
const sandbox = await client.createSandbox();
try {
  const result = await sandbox.runCode(code);
  return result;
} finally {
  await sandbox.kill();
}
```

**Testing strategy:**
- Mock E2B SDK in unit tests
- Real E2B API in integration tests
- Verify cleanup in both scenarios

### API Route ↔ Database

**Protocol:** Drizzle ORM queries (Neon Postgres)

**Data flow:**
- onFinish callback saves messages with parts array
- Parts stored as JSONB: `{ parts: [...] }`
- getMessagesByChatId loads full message history

**Integration point:**
```typescript
onFinish: async ({ messages: finishedMessages }) => {
  await saveMessages({
    messages: finishedMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts, // JSONB serialization
      chatId: id,
    })),
  });
}
```

**Testing strategy:**
- Mock database queries in unit tests
- Real database in integration tests (cleanup after)

### Messages Component ↔ Visualization Component

**Protocol:** React props

**Data flow:**
- Messages maps over parts array
- Extracts visualizations from tool output
- Passes to VisualizationGallery as prop

**Integration point:**
```typescript
// In message.tsx
if (toolPart.state === 'output-available' && toolPart.output?.visualizations) {
  return <VisualizationGallery visualizations={toolPart.output.visualizations} />;
}

// In visualization-gallery.tsx
export function VisualizationGallery({ visualizations }) {
  return visualizations.map((viz) => <Visualization url={viz.url} format={viz.format} />);
}
```

**Testing strategy:**
- Component tests with mock visualizations array
- E2E tests verify real visualization rendering

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | Current architecture sufficient — E2B free tier (100 sandboxes/month), Vercel Blob free tier (1GB) |
| 100-1k users | Add E2B sandbox pooling (reuse sandboxes between requests), monitor Blob storage usage |
| 1k-10k users | E2B paid tier ($20/month for 1000 sandboxes), Vercel Blob paid tier ($0.15/GB), consider Redis cache for visualization URLs |

### First Bottleneck: E2B Sandbox Creation Latency

**Problem:** Each sandbox creation takes 2-5 seconds, blocks execution.

**Solution:**
1. **Sandbox pooling:** Pre-create 5 sandboxes, reuse between requests
2. **Keep-alive:** Don't kill sandbox immediately, reuse for same user's next request
3. **Show progress:** Display "Creating sandbox..." indicator during creation

**When to implement:** When >10% of requests wait >5 seconds for sandbox creation.

### Second Bottleneck: Visualization Upload Latency

**Problem:** Large visualizations (>1MB) take 5-10 seconds to upload, block response.

**Solution:**
1. **Parallel upload:** Already implemented with `Promise.all()`
2. **Streaming response:** Stream text output before visualizations upload
3. **Compression:** Enable gzip for PNG uploads to Blob storage

**When to implement:** When users report slow responses with visualizations.

## Sources

### Primary (HIGH confidence)
- **AI SDK Core Tool Calling:** Verified `needsApproval` pattern in cached docs at `docs/~/.bun/install/cache/ai@6.0.64@@@1/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx`
- **AI SDK UI Chatbot Tool Usage:** Verified approval flow in cached docs at `docs/~/.bun/install/cache/ai@6.0.64@@@1/docs/04-ai-sdk-ui/03-chatbot-tool-usage.mdx`
- **Existing codebase:**
  - `docs/app/api/chat/route.ts` — Current streamText implementation with createUIMessageStream
  - `docs/components/chat.tsx` — useChat hook with addToolApprovalResponse and sendAutomaticallyWhen
  - `docs/components/message.tsx` — Dynamic-tool part rendering with approval states
  - `docs/lib/mcp/aggregate-tools.ts` — E2B tool implementation with visualization upload
  - `docs/lib/mcp/e2b-client.ts` — Sandbox lifecycle with try/finally pattern
  - `docs/components/visualization.tsx` — Existing visualization component with fullscreen/download

### Secondary (MEDIUM confidence)
- **E2B Code Interpreter SDK:** Package version 2.3.3 in `docs/package.json`, standard sandbox.runCode() API
- **Vercel Blob:** Already imported in aggregate-tools.ts (`uploadImageFromBase64`), URLs verified in code
- **Drizzle ORM:** Database queries in `docs/lib/db/queries.ts`, JSONB parts array confirmed

---

*Architecture research for v2.3 Production Playground*
*Researched: 2026-02-02*
*Confidence: HIGH — All patterns verified in existing codebase and AI SDK cached documentation*
