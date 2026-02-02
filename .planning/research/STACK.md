# Stack Research: v2.3 Production Playground

**Domain:** AI chat playground with tool approval, visualization testing, E2B lifecycle verification, and chat UI polish
**Researched:** 2026-02-02
**Confidence:** HIGH

## Recommended Stack

### Core Technologies (Unchanged - Already Validated in v2.2)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| ai (Vercel AI SDK) | 6.0.64 | Chat infrastructure, streaming, tool approval | Latest version includes experimental_needsApproval for tool approval flows. Already integrated in v2.2 foundation. |
| @ai-sdk/react | 3.0.66 | useChat hook, UI helpers | Provides addToolApprovalResponse function for approval flows. Core of chat UI. |
| @e2b/code-interpreter | 2.3.3 | Python sandbox execution | Already integrated. Sandbox.create() API provides lifecycle control (create/execute/kill). |
| Next.js | 16.0.10 | Framework | App router architecture validated in v2.2. Status streaming works correctly. |
| Drizzle ORM | 0.34.0 | Database persistence | Parts array pattern validated. UUID primary keys work correctly. |
| @neondatabase/serverless | 0.10.4 | Database client | Neon Postgres connection. Working in production. |

### Tool Approval Flow Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | Built into AI SDK | experimental_needsApproval property on tools, addToolApprovalResponse from useChat hook |

**Rationale:** Vercel AI SDK 6.0+ has built-in tool approval. No additional libraries needed. The pattern:
1. Mark tools with `experimental_needsApproval: true` in streamText config
2. Client receives tool call, displays approval UI
3. User approves/rejects → call `addToolApprovalResponse({ id, approved, reason? })`
4. Server continues with tool execution or skips based on approval

**Integration point:** `/docs/app/api/chat/route.ts` already has `tools` from `getAvailableTools()`. Add approval flag to E2B tools.

### Visualization Rendering Libraries (Already in package.json)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ansi-to-react | 6.2.6 | Terminal output rendering | Already used in Console component for E2B stdout/stderr |
| react-syntax-highlighter | 15.6.6 | Code syntax highlighting | Already used in CodeEditor component |

**Additional capability (already implemented):**
- E2B Code Interpreter SDK returns visualization data in `execution.results`
- Filter for `.png`, `.svg`, `.html` formats
- Render as base64 images or HTML iframes
- Pattern exists in `/docs/artifacts/code/client.tsx` (lines 63-70)

**No new libraries needed.** Visualization rendering infrastructure is complete:
- matplotlib plots → base64 PNG (lines 9-38 in code artifact)
- plotly charts → HTML (supported by E2B results)
- Console output → ansi-to-react (already integrated)

### Testing Infrastructure

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| @playwright/test | 1.50.1 | E2E testing, visualization verification | Already in devDependencies. Need to create config and tests. |
| Bun test runner | Built-in | Unit tests, E2B lifecycle testing | Fast, TypeScript-native. Already used (package.json line 23). |

**Testing strategy:**

1. **E2B Lifecycle Tests** (Unit tests with Bun)
   - Test sandbox creation (Sandbox.create succeeds)
   - Test code execution (runCode returns results)
   - Test visualization capture (execution.results contains png/svg/html)
   - Test sandbox cleanup (kill() terminates sandbox)
   - Test timeout behavior (30s execution timeout)
   - Test error handling (syntax errors, runtime errors)

2. **Visualization Rendering Tests** (Playwright E2E)
   - Test matplotlib plot appears in artifact
   - Test plotly HTML renders correctly
   - Test console output displays ANSI colors
   - Test image base64 decoding works
   - Test artifact modal animations complete

3. **Tool Approval Flow Tests** (Playwright E2E)
   - Test approval UI appears when tool call needs approval
   - Test approval allows execution
   - Test rejection blocks execution
   - Test approval state persists in message parts
   - Test multi-tool approval sequence

4. **Chat UI Polish Tests** (Playwright E2E)
   - Test loading states during streaming (status === 'streaming')
   - Test error messages display correctly (error state)
   - Test retry functionality (regenerate button)
   - Test stop button (stop() function)

### Chat UI Polish Libraries (Already in package.json)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | 11.3.19 | Loading animations, transitions | Already used for artifact animations. Add loading spinners, skeleton states. |
| lucide-react | 0.446.0 | Icons for loading/error states | Already used throughout UI. Has Loader2, AlertCircle, XCircle icons. |
| sonner | 2.0.7 | Toast notifications for errors | Already used for clipboard toasts. Use for execution errors, network errors. |

**Status states from useChat:**
- `'ready'` - Show send button enabled
- `'submitted'` - Show loading indicator (disable send)
- `'streaming'` - Show typing animation, stop button enabled
- `'error'` - Show error message, retry button

**Error handling pattern:**
```typescript
const { status, error, clearError, regenerate } = useChat();

if (status === 'error' && error) {
  // Display error with toast or inline message
  // Show retry button that calls regenerate()
}
```

**Already implemented:** Artifact component has loading states (line 446 in artifact.tsx: `isLoading={isDocumentsFetching && !artifact.content}`)

## Installation

**No new dependencies required.** All needed libraries already in package.json:

```bash
# Verify existing dependencies
bun install

# Setup Playwright (if not done)
bunx playwright install
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vercel AI SDK approval | Custom approval state | Never. Built-in solution is well-tested and handles edge cases. |
| Playwright | Cypress | If team has Cypress expertise. Playwright is faster and handles streaming better. |
| Bun test | Vitest | If compatibility issues with Bun. Bun is faster and needs no config. |
| E2B Code Interpreter | Pyodide (browser-based) | Already tried in code artifact (lines 124-127). Pyodide has package loading issues and no isolation. E2B is superior for security. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Custom WebSocket for streaming | Vercel AI SDK handles this correctly | Built-in streamText with SSE |
| Manual approval state management | Race conditions with streaming | experimental_needsApproval + addToolApprovalResponse |
| Jest for E2E tests | Slower, more config | Playwright (already installed) |
| React Testing Library for streaming tests | Can't test SSE streams | Playwright with real API calls |
| Separate visualization libraries | Adds bundle size | E2B returns visualizations, render with existing components |

## Stack Patterns by Feature

### Tool Approval Flow

**Pattern:**
1. Server-side: Add `experimental_needsApproval: true` to E2B tools in `/docs/lib/mcp/aggregate-tools.ts`
2. Client-side: Listen for tool calls with status check
3. Display approval UI (modal or inline)
4. Call `addToolApprovalResponse({ id: toolCall.id, approved: true/false })`
5. AI SDK automatically continues or skips execution

**Files to modify:**
- `/docs/lib/mcp/aggregate-tools.ts` - Add approval flag to E2B tools
- `/docs/components/artifact-messages.tsx` - Add approval UI (already receives addToolApprovalResponse prop)
- `/docs/app/api/chat/route.ts` - No changes needed (already supports approval in AI SDK 6.0)

### Visualization Testing

**Pattern:**
1. Create Playwright test that sends chat message requesting visualization
2. Wait for artifact to appear (`await page.locator('[data-testid="artifact"]').waitFor()`)
3. Verify image src contains base64 data or HTML content rendered
4. Verify console output displays ANSI-formatted text
5. Test interaction (zoom, pan if applicable)

**Test file structure:**
```
docs/
  tests/
    visualizations/
      matplotlib.spec.ts
      plotly.spec.ts
      console-output.spec.ts
```

### E2B Lifecycle Testing

**Pattern:**
1. Create Bun unit tests that call E2B directly (not through chat API)
2. Test sandbox creation: `const sandbox = await Sandbox.create({ apiKey })`
3. Test execution: `const result = await sandbox.runCode('print("test")')`
4. Test cleanup: `await sandbox.kill()`
5. Verify visualization extraction from `result.results`

**Test file structure:**
```
docs/
  lib/
    mcp/
      e2b-client.test.ts
```

### Chat UI Polish

**Pattern:**
1. Use `status` from useChat to drive UI states
2. Show loading spinner when status === 'submitted' or 'streaming'
3. Show error toast when status === 'error'
4. Provide retry button that calls `regenerate()`
5. Provide stop button that calls `stop()` (only enabled during streaming)

**Files to modify:**
- `/docs/components/multimodal-input.tsx` - Add loading state to send button
- `/docs/components/message.tsx` - Add error display, retry button
- `/docs/components/artifact.tsx` - Already has loading states, verify they work

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| ai@6.0.64 | @ai-sdk/react@3.0.66 | Versions in lockstep. Always use matching versions. |
| Next.js@16.0.10 | React@19.0.1 | Already validated. App router features work correctly. |
| @e2b/code-interpreter@2.3.3 | Node.js >= 18 | Requires modern Node. Vercel uses Node 20. |
| @playwright/test@1.50.1 | Bun@1.x | Works with Bun test runner. Use `bun test` for unit tests, `bunx playwright test` for E2E. |

**Critical compatibility note:** Vercel AI SDK 6.0 experimental features are stable enough for production (used by Vercel's own chatbot). The "experimental" prefix indicates API may change in future versions, not that it's unstable.

## Testing Tools Configuration

### Playwright Config (Create)

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // Longer timeout for streaming tests
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Bun Test Config (No config needed)

Bun test works out of the box:
- Discovers `*.test.ts` files
- Runs TypeScript directly
- Fast parallel execution
- Built-in mocking

## Implementation Priority

**Phase 1: Tool Approval (Highest ROI)**
- Add experimental_needsApproval to E2B tools
- Create approval UI component
- Wire up addToolApprovalResponse
- Test approval flow manually
- **Libraries needed:** None (built into AI SDK)

**Phase 2: Visualization Testing (Validation)**
- Create Playwright config
- Write visualization E2E tests
- Verify matplotlib/plotly rendering works
- **Libraries needed:** @playwright/test (already installed)

**Phase 3: E2B Lifecycle Testing (Quality)**
- Write Bun unit tests for E2B client
- Test create/execute/kill lifecycle
- Test timeout and error handling
- **Libraries needed:** None (use Bun test built-in)

**Phase 4: Chat UI Polish (UX)**
- Add loading states to send button
- Add error display with retry
- Add stop button during streaming
- Test with Playwright
- **Libraries needed:** None (use framer-motion, lucide-react already installed)

## Sources

- [Vercel AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - addToolApprovalResponse, status states, error handling (MEDIUM confidence - verified official docs, some details inferred)
- E2B Code Interpreter SDK v2.3.3 - Sandbox.create API, execution lifecycle (HIGH confidence - code inspection in `/docs/lib/mcp/e2b-client.ts`)
- package.json dependencies (HIGH confidence - verified installed versions)
- Vercel ai-chatbot architecture patterns (HIGH confidence - validated in v2.2 implementation)

**Confidence assessment:**
- Tool approval: MEDIUM (official docs confirmed addToolApprovalResponse exists, experimental_needsApproval implementation details partially inferred)
- Visualization rendering: HIGH (existing code shows E2B visualization extraction working)
- E2B testing: HIGH (SDK API documented in existing e2b-client.ts)
- Chat UI polish: HIGH (status states confirmed in official docs, existing components already use patterns)

---
*Stack research for: v2.3 Production Playground*
*Researched: 2026-02-02*
