# Project Research Summary

**Project:** v2.3 Production Playground
**Domain:** AI-powered code execution with tool approval, visualization, and testing
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

v2.3 transforms the existing playground into a production-ready system by adding security (tool approval flows), quality assurance (E2B lifecycle testing), visualization rendering, and UX polish. The research reveals a critical insight: all features integrate with the existing Vercel AI SDK 6 architecture through incremental additions, not architectural rewrites. The AI SDK's `parts` array already supports tool approval states, dynamic tool execution, and streaming — the foundation is validated and working from v2.2.

The recommended approach leverages built-in AI SDK capabilities (`experimental_needsApproval`, `addToolApprovalResponse`) rather than custom state management, uploads visualizations to blob storage immediately (never store base64 in database), and implements comprehensive E2B sandbox lifecycle tracking to prevent resource leaks. Build order follows dependency hierarchy: E2B testing first (validates infrastructure), tool approval second (security gates execution), visualization third (consumes approved execution), and UI polish last (enhances the complete flow).

Key risks center on approval state persistence (bypassing security through database replay), E2B sandbox orphaning (quota exhaustion from uncleaned resources), and visualization memory leaks (base64 storage instead of URLs). All risks have clear mitigation strategies validated by existing codebase patterns and AI SDK documentation. The architecture is proven, the stack is stable, and the implementation path is well-defined.

## Key Findings

### Recommended Stack

All required technologies are already integrated from v2.2 — no new dependencies needed. The stack is production-validated:

**Core technologies:**
- **Vercel AI SDK 6.0.64**: Built-in tool approval via `experimental_needsApproval`, streaming with `streamText`, parts array for message state
- **@ai-sdk/react 3.0.66**: `useChat` hook provides `addToolApprovalResponse` for approval flows, status states for loading indicators
- **@e2b/code-interpreter 2.3.3**: Python sandbox execution with `Sandbox.create() → runCode() → kill()` lifecycle already working
- **Next.js 16.0.10**: App Router architecture validated in v2.2, streaming works correctly
- **Drizzle ORM 0.34.0**: Parts array persistence as JSONB, message queries working in production

**Testing infrastructure:**
- **@playwright/test 1.50.1**: Already installed for E2E testing, needs configuration and test files
- **Bun test runner**: Built-in, TypeScript-native, used for unit tests of E2B lifecycle

**UI libraries (already present):**
- **framer-motion 11.3.19**: Loading animations, transitions for approval dialogs
- **lucide-react 0.446.0**: Icons (Loader2, AlertCircle, XCircle) for loading/error states
- **sonner 2.0.7**: Toast notifications for execution errors

**Critical insight:** No `npm install` needed. The gap is implementation (wiring up approval flags, creating UI components, writing tests), not missing libraries.

### Expected Features

**Must have (table stakes):**
- **Tool approval before execution** — Security requirement. Users must explicitly approve code execution. AI SDK's `experimental_needsApproval` flag handles this with approval state machine.
- **E2B sandbox lifecycle testing** — Quality requirement. Verify sandboxes are created, execute code, and are cleaned up properly. Prevent resource leaks before production load.
- **Inline visualization rendering** — Core UX. Charts/plots must appear in chat, not as downloads. E2B returns base64 PNG/SVG, upload to Vercel Blob, render URLs.
- **Loading states during execution** — UX expectation. Executions take 5-30 seconds. Show "Creating sandbox..." → "Running code..." → "Complete" indicators.
- **Clear error messages** — Production requirement. No technical stack traces. Translate errors: "What happened" + "Why" + "What to do".

**Should have (competitive):**
- **Multi-visualization grid layout** — Power users generate multiple plots. Display in 2-column grid with fullscreen/download per visualization.
- **Approval dialog with code preview** — Security + UX. Show syntax-highlighted code in inline dialog (not blocking modal), allow scrolling to review context.
- **Execution progress streaming** — Premium UX. Stream status updates during long executions, show what's happening in real-time.

**Defer (v2+):**
- **Approval timeout with countdown** — Nice to have. Auto-deny approvals after 5 minutes. Not critical for v2.3 if approval UI is intuitive.
- **Sandbox pooling for performance** — Optimization. Reuse sandboxes between requests. Only needed if sandbox creation latency becomes bottleneck (>5s).
- **Interactive visualization widgets** — Advanced feature. Plotly interactivity requires iframe sandboxing with CSP adjustments. Static visualizations sufficient for v2.3.

### Architecture Approach

v2.3 integrates with existing AI SDK 6 architecture through four integration points, all using the `parts` array as single source of truth:

**Major components:**

1. **Tool Approval Flow** — Modify `lib/mcp/aggregate-tools.ts` to add `needsApproval: true` flag to `execute-python` tool. Create `CodeApprovalDialog.tsx` component. Add approval rendering case to `components/message.tsx` checking `part.state === 'approval-requested'`. Approval state flows through existing `addToolApprovalResponse` from useChat hook. No API route changes needed — AI SDK handles approval validation automatically.

2. **Visualization Rendering** — E2B execution returns base64 PNG/SVG in `execution.results`. Existing `lib/mcp/aggregate-tools.ts` already uploads to Vercel Blob via `uploadImageFromBase64()`. Create `VisualizationGallery.tsx` component that maps over `toolPart.output.visualizations` array. Reuse existing `components/visualization.tsx` (already has fullscreen/download, error handling). Display visualizations when `part.state === 'output-available'`.

3. **E2B Lifecycle Testing** — Create unit tests in `lib/mcp/__tests__/e2b-client.test.ts` verifying sandbox cleanup (create → execute → kill → verify sandbox doesn't exist). Test error handling (execution fails, sandbox still killed). Test visualization generation (matplotlib code produces base64 PNG). Use Bun test runner (already configured). Track sandbox IDs during tests to verify cleanup.

4. **Chat UI Polish** — Enhance existing `components/message.tsx` with loading state for `part.state === 'approval-responded' && !part.output` (execution in progress). Add error display for `part.state === 'output-error'` with traceback in collapsible details. Verify `components/messages.tsx` shows streaming indicator from `status === 'submitted'`. Use existing Lucide icons (Loader2, AlertCircle).

**Key architectural patterns:**
- **Parts array as single source of truth**: All state (text, tool calls, approvals, results) stored in message.parts JSONB
- **Upload-then-render for visualizations**: Base64 → Blob upload → store only URL → render <img src={url} />
- **Try/finally for E2B cleanup**: Always kill sandbox in finally block, even on errors
- **Approval state machine**: `approval-requested` → `approval-responded` → `output-available` (or `output-denied`)

### Critical Pitfalls

1. **Tool approval bypass through state persistence** — If approval state persists in database, page refresh could replay approvals and auto-execute code without new consent. **Mitigation:** Never persist `tool-approval-request` or `tool-approval-response` parts. Store approval state in separate `tool_approvals` table. Server validates approval timestamp is within 5 minutes of tool call. Test: save message with approval → reload page → verify no auto-execution.

2. **E2B sandbox orphaning during streaming errors** — If user closes tab or network drops during execution, sandbox continues running, consuming quota. After 100+ conversations, quota exhausted. **Mitigation:** Track all sandboxes in `e2b_sandboxes` table with status tracking. Implement background cleanup job (kill sandboxes older than 1 hour). Always use try/finally for `sandbox.kill()`. Test: start 10 executions, abort mid-stream, verify all sandboxes killed.

3. **Visualization memory leak with base64 encoding** — Storing 2-5MB base64 strings in React state causes memory accumulation. After 10 visualizations, browser uses 2GB+ memory. **Mitigation:** Convert base64 to Blob immediately, upload to Vercel Blob storage, store only URL in message parts. Never store base64 in database. Use `URL.createObjectURL()` for previews with cleanup on unmount. Test: 50 visualizations in one conversation, verify memory <500MB.

4. **Missing loading states create "frozen UI" perception** — Code execution takes 5-30 seconds. No progress indicator makes users think app crashed, leading to refresh/abandon. **Mitigation:** Use `useChat` status to disable send button when `status !== 'awaiting-message'`. Add loading state for `approval-responded` without output. Stream tool execution progress. Show "Creating sandbox..." → "Running code..." indicators. Test with slow network throttling.

5. **Tool approval modal blocks context** — If approval appears as blocking modal, user can't scroll to review previous messages or understand what code will do. Leads to confused denials. **Mitigation:** Use inline approval UI within message flow, not modal. Allow scrolling while approval visible. Show full code with syntax highlighting, plus "Learn more" link. Make approval sticky at bottom while user scrolls. Test with real users: give complex approval scenario, observe if they review context.

## Implications for Roadmap

Based on research, suggested phase structure follows dependency hierarchy and risk mitigation:

### Phase 1: E2B Lifecycle Testing & Infrastructure
**Rationale:** Must validate E2B sandbox cleanup and resource tracking before adding approval flows that create more sandboxes. Testing infrastructure catches orphaning issues before production load. Dependencies resolved first enable clean implementation of dependent features.

**Delivers:**
- E2B client unit tests (`lib/mcp/__tests__/e2b-client.test.ts`)
- Lifecycle verification tests (create → execute → kill → verify cleanup)
- Multi-file project execution tests
- Timeout handling tests (30s limit enforcement)
- Visualization generation tests (matplotlib/plotly produce base64)

**Addresses:**
- Pitfall #2 (E2B sandbox orphaning)
- Pitfall #3 (visualization generation validation)

**Validation criteria:**
- All sandboxes cleaned up after tests complete
- No orphaned sandboxes after 100 sequential runs
- Timeout errors properly handled without leaking resources
- Visualization generation works consistently

### Phase 2: Tool Approval Flow
**Rationale:** Security foundation must gate execution before adding visualization features. Approval must be in place before users can execute arbitrary code. This phase has the highest security risk, so it comes early for thorough testing.

**Delivers:**
- Add `needsApproval: true` to execute-python tool
- `CodeApprovalDialog.tsx` component with syntax highlighting
- Approval integration in `message.tsx` (new dynamic-tool case)
- Separate approval state tracking (not in persisted message parts)
- Unit tests for approval flow
- E2E tests for approval → execution → visualization path

**Addresses:**
- Pitfall #1 (approval bypass through state persistence)
- Pitfall #5 (approval modal blocks context)
- Must-have feature: Tool approval before execution

**Uses stack:**
- AI SDK `experimental_needsApproval` flag
- `addToolApprovalResponse` from useChat hook
- Existing parts array state machine

**Implements architecture:**
- Approval state machine component
- Inline approval UI (not blocking modal)

**Validation criteria:**
- Code preview shows syntax-highlighted Python
- Approval triggers execution, denial prevents it
- Approval state persists correctly in separate table
- No approval bypass through message replay or page refresh

### Phase 3: Visualization Rendering
**Rationale:** Depends on approved execution flow from Phase 2. Visualizations are the primary output of code execution, so rendering must be robust. Upload strategy prevents memory leaks from Phase 1's insights.

**Delivers:**
- `VisualizationGallery.tsx` component for multiple charts
- Integration with existing `Visualization.tsx` component
- Grid layout for PNG/SVG/HTML visualizations
- Blob storage upload (never base64 in database)
- Format detection (static vs interactive)
- Tests for visualization rendering and memory usage

**Addresses:**
- Pitfall #3 (visualization memory leak)
- Must-have feature: Inline visualization rendering
- Should-have feature: Multi-visualization grid layout

**Uses stack:**
- Vercel Blob storage (already imported in aggregate-tools.ts)
- E2B visualization results (PNG/SVG from execution.results)
- Existing Visualization.tsx component

**Implements architecture:**
- Upload-then-render pattern
- Parallel upload with Promise.all()
- URL-only storage in parts array

**Validation criteria:**
- Multiple visualizations display in grid layout
- Fullscreen/download work for all formats
- Large visualizations (>1MB) load without blocking UI
- 50 visualizations in conversation, memory usage <500MB
- Visualization URLs persist correctly across page reload

### Phase 4: Chat UI Polish
**Rationale:** Enhances UX after all core features working. Loading states and error messages make the system feel production-ready. This phase has lowest risk and can overlap with Phase 3 implementation.

**Delivers:**
- Loading state during code execution ("Creating sandbox..." → "Running code...")
- Enhanced error messages with traceback (collapsible details)
- Streaming indicators for approval flow
- Disabled states for send button during streaming
- Error translation layer (no technical error exposure)
- Polish for approval dialog UX

**Addresses:**
- Pitfall #4 (missing loading states create "frozen UI")
- Must-have feature: Loading states during execution
- Must-have feature: Clear error messages

**Uses stack:**
- useChat status prop (already available)
- Lucide icons: Loader2, AlertCircle, XCircle
- framer-motion for loading animations

**Implements architecture:**
- Loading state rendering for tool execution states
- Error boundary with user-friendly messages
- Status-driven UI updates

**Validation criteria:**
- Loading spinners show during all execution phases
- Error messages are clear and actionable (no file paths/stack traces)
- Approval dialog is intuitive, doesn't block context
- No UI jank during streaming
- Send button disabled while streaming, re-enabled after

### Phase Ordering Rationale

**Why this sequence:**
1. **Testing first** — Validates infrastructure before building on it. E2B lifecycle must be reliable before adding approval flows that create more sandboxes. Testing phase catches resource leaks early.

2. **Security second** — Approval gates execution. Must be in place before visualization features make execution more attractive to users. Security bugs are costly to fix in production.

3. **Visualization third** — Depends on approved execution. Upload strategy informed by testing phase's memory observations. Visualization rendering is the user-facing payoff for previous phases.

4. **Polish last** — Enhances complete flow. Loading states and error messages only make sense once execution + visualization + approval are working. UX improvements have lowest implementation risk.

**Dependency chain:**
- Phase 2 depends on Phase 1 (E2B infrastructure validated)
- Phase 3 depends on Phase 2 (approved execution available)
- Phase 4 depends on Phase 2 & 3 (complete flow exists to polish)

**Parallel work opportunities:**
- Phase 3 can start once Phase 2 has working execution (visualization rendering is independent)
- Phase 4 can overlap with Phase 3 (loading states and visualization rendering are independent concerns)

**Critical path:** Phase 1 → Phase 2 → (Phase 3 + Phase 4 in parallel)

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (E2B Testing):** Well-documented E2B SDK, Bun test patterns established, lifecycle testing is standard practice
- **Phase 2 (Tool Approval):** AI SDK documentation confirms `experimental_needsApproval` pattern, approval flow verified in cached docs
- **Phase 4 (Chat UI Polish):** Standard React patterns, loading states and error handling are well-understood

**Phases likely needing deeper research during planning:**
- **Phase 3 (Visualization Rendering):** May need CSP research for interactive visualizations (Plotly HTML with scripts). Format detection logic needs testing with all supported libraries (matplotlib, plotly, seaborn, bokeh). Blob storage performance with concurrent uploads needs validation.

**Research gaps to address during implementation:**
- Exact behavior of AI SDK approval state persistence when messages reload from database (need runtime testing)
- E2B sandbox quota limits and error messages for quota exceeded (need to trigger in test environment)
- Production CSP headers and their impact on different visualization formats (need production-like testing)
- Memory usage patterns with 50+ visualizations across browsers (need performance testing in Chrome/Safari/Firefox)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All dependencies already installed and validated in v2.2. AI SDK 6 patterns verified in cached documentation. E2B SDK usage confirmed in existing e2b-client.ts. No new libraries needed. |
| Features | HIGH | Requirements clear from v2.2 foundation: approval (security), testing (quality), visualization (core UX), polish (production-ready). Competitive analysis from FEATURES.md validated expectations. |
| Architecture | HIGH | Integration points verified in existing codebase. Parts array pattern confirmed in message.tsx. Tool approval flow documented in AI SDK cached docs. E2B lifecycle pattern exists in e2b-client.ts. |
| Pitfalls | HIGH | Critical pitfalls derived from source code analysis (e2b-client.ts has no cleanup tracking, message.tsx has no approval-requested handling). AI SDK approval state machine analyzed. React memory patterns well-understood. |

**Overall confidence:** HIGH

Research is based on existing codebase analysis (v2.2 foundation), official AI SDK documentation (cached in node_modules), and validated architectural patterns. All technologies are already integrated and working. The gap is implementation (writing components, tests, UI enhancements), not research or experimentation.

### Gaps to Address

**During Phase 1 (E2B Testing):**
- Need to verify actual E2B quota limits and error messages (trigger in test environment)
- Need to validate sandbox cleanup detection method (E2B API for listing sandboxes)
- Need to test timeout behavior with infinite loops (ensure 30s enforcement)

**During Phase 2 (Tool Approval):**
- Need runtime testing of AI SDK approval state persistence on page reload (unit test can't catch all edge cases)
- Need to validate approval timestamp check prevents replay attacks (security testing)
- Need to test approval flow with concurrent tool calls (multiple approvals pending)

**During Phase 3 (Visualization Rendering):**
- Need to test CSP compatibility with all visualization formats in production-like environment
- Need to validate Vercel Blob upload performance with concurrent requests (load testing)
- Need to test visualization rendering across browsers (Safari, Firefox, Chrome mobile)
- Need to measure actual memory usage with 50+ visualizations (performance monitoring)

**During Phase 4 (Chat UI Polish):**
- Need to validate error message translations cover all error types (comprehensive error testing)
- Need to test loading states with slow network conditions (network throttling)
- Need to user-test approval dialog UX (verify inline design doesn't confuse users)

**How to handle gaps:**
- Phase 1: Create E2B test environment to trigger quota limits and timeout scenarios
- Phase 2: Implement approval flow with comprehensive unit + E2E tests, security audit before production
- Phase 3: Set up production-like CSP headers in staging, performance test with real data
- Phase 4: Error testing matrix (trigger each error type, verify message), user testing with 5-10 participants

## Sources

### Primary (HIGH confidence)
- **AI SDK Core Tool Calling:** Verified `needsApproval` pattern in cached docs at `docs/~/.bun/install/cache/ai@6.0.64@@@1/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx`
- **AI SDK UI Chatbot Tool Usage:** Verified approval flow in cached docs at `docs/~/.bun/install/cache/ai@6.0.64@@@1/docs/04-ai-sdk-ui/03-chatbot-tool-usage.mdx`
- **Existing codebase analysis:**
  - `docs/app/api/chat/route.ts` — Current streamText implementation with createUIMessageStream
  - `docs/components/chat.tsx` — useChat hook with addToolApprovalResponse and sendAutomaticallyWhen
  - `docs/components/message.tsx` — Dynamic-tool part rendering with approval states
  - `docs/lib/mcp/aggregate-tools.ts` — E2B tool implementation with visualization upload
  - `docs/lib/mcp/e2b-client.ts` — Sandbox lifecycle with try/finally pattern
  - `docs/components/visualization.tsx` — Existing visualization component with fullscreen/download
- **Package versions:** `docs/package.json` — Verified installed versions of all dependencies

### Secondary (MEDIUM confidence)
- **E2B Code Interpreter SDK:** Package version 2.3.3 API patterns (Sandbox.create, runCode, kill)
- **Vercel Blob:** Upload patterns already implemented in aggregate-tools.ts (`uploadImageFromBase64`)
- **Drizzle ORM:** Database persistence patterns in `docs/lib/db/queries.ts`, JSONB parts array confirmed
- **Vercel AI SDK Chat:** https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot (useChat hook reference, status states)
- **Vercel AI SDK Parts:** https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#parts (message persistence patterns)

### Tertiary (LOW confidence - needs validation during implementation)
- **E2B quota limits:** Inferred from pricing documentation, need runtime testing to confirm error messages
- **CSP visualization compatibility:** Standard web patterns, but need production testing with actual headers
- **Memory usage patterns:** React best practices, but need performance testing with real data
- **Approval state persistence:** AI SDK behavior inferred from documentation, need runtime validation

---
*Research completed: 2026-02-02*
*Ready for roadmap: yes*
