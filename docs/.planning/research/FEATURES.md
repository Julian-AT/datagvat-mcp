# Feature Research: v2.3 Production Playground

**Domain:** AI Assistant Playground (Code Execution & Data Visualization)
**Researched:** 2026-02-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unsafe.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Tool Approval UI** | Security expectation - users must confirm before code executes | MEDIUM | Vercel AI SDK provides `addToolApprovalResponse` and approval states. Foundation exists in chat.tsx (lines 88-103). Requires UI components for approval/rejection buttons. |
| **Approval State Indicators** | Users need visual feedback when approval is pending | LOW | AI SDK provides 7 states: input-streaming, input-available, approval-requested, approval-responded, output-available, output-error, output-denied. Icons/badges already implemented in ai-elements/tool.tsx. |
| **Inline Visualization Rendering** | Data analysis tools display charts inline, not as downloads | MEDIUM | Visualization.tsx exists with PNG/SVG/HTML support. E2B client returns visualizations array (e2b-client.ts:63-70). Needs integration with message rendering. |
| **Loading State During Execution** | Users expect visual feedback during async operations | LOW | ThinkingMessage component exists. Status tracking via useChat hook ('submitted', 'streaming'). Missing: tool-specific execution indicators. |
| **Error Display with Context** | Execution errors must show traceback/details, not generic failures | MEDIUM | E2B returns structured errors (name, message, traceback, isTimeout). ToolOutput component renders errors (elements/tool.tsx:106-141). Need to verify end-to-end error propagation. |
| **Streaming Response Indicators** | Users expect to see AI response building character-by-character | LOW | Already implemented via useChat streaming. Message-level streaming works (message.tsx:102). Tool output streaming may need verification. |
| **Abort/Stop Execution** | Users must be able to cancel long-running operations | LOW | Stop function exists in useChat (chat.tsx:85). UI button in MultimodalInput. Sandbox kill exists (e2b-client.ts:73). Need to verify sandbox cleanup on abort. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-Format Visualization Support** | PNG/SVG/HTML support covers matplotlib, plotly, interactive charts | LOW | Already implemented in Visualization.tsx. Supports fullscreen, download. HTML sandboxed with iframe. Competitive vs ChatGPT (PNG only). |
| **Visualization Actions (Fullscreen, Download)** | Improves UX for data exploration workflows | LOW | Implemented in Visualization.tsx (lines 115-134). Hover-to-reveal buttons, fullscreen dialog. |
| **Persistent Sandbox Per Session** | Maintain execution context across multiple tool calls | MEDIUM | Foundation exists: createTrackedSandbox tracks messageId (sandbox/manager.ts). Cleanup functions stubbed but not implemented. Enables "build on previous results" workflows. |
| **Collapsible Tool Execution Details** | Keeps chat clean while preserving technical details | LOW | Implemented via Collapsible in ai-elements/tool.tsx. Shows parameters, results, errors on expand. |
| **Tool Execution Timeline/Status** | Clear visual progression through tool states | LOW | Status badges implemented (ai-elements/tool.tsx:31-57). 7 states with icons (CircleIcon, ClockIcon, CheckCircle, XCircle). Could enhance with timeline view. |
| **Artifact Version History** | Users can view/restore previous visualization versions | MEDIUM | Already implemented for artifacts (artifact.tsx:194-215). Version navigation (prev/next), diff mode. Not specific to v2.3 but supports visualization iteration. |
| **Automatic Matplotlib Setup** | Pre-configured output handling for matplotlib charts | LOW | Code artifact includes matplotlib setup (artifacts/code/client.tsx:9-24). Automatically calls setup_matplotlib_output() when code contains plt. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Auto-Approve Trusted Tools** | Reduce friction for "safe" operations | Creates security hole - what's "safe" changes. User becomes desensitized to approvals. | Clear, fast approval UI. Keyboard shortcuts (Enter to approve). Show tool details inline. |
| **Unlimited Execution Timeout** | "Let it run as long as needed" | Resource exhaustion, poor UX (user waits indefinitely), billing issues. | 30s default (implemented). Show progress indicators. Suggest optimization if timeout. |
| **Real-Time Streaming Output** | "Show stdout as it arrives" | Overwhelming for fast output. Poor mobile UX. Complicates state management. | Collect output, display on completion. Show spinner during execution. Provide logs in collapsible section. |
| **Automatic Sandbox Cleanup** | "Clean up after every message" | Breaks multi-step workflows. Users lose context between tool calls. | Session-scoped sandboxes (implemented). Cleanup on chat end or timeout (1 hour). Manual cleanup option. |
| **Inline Code Editing** | "Let me tweak the code before running" | Confusing ownership - is it AI's code or user's? Breaks reproducibility. | Suggest modifications via chat. Show code in tool params (users can copy/modify/paste). |
| **Parallel Tool Execution** | "Run multiple tools simultaneously" | Race conditions. Complex approval flow (approve 3 tools at once?). Hard to debug failures. | Sequential execution with clear progression. Fast execution makes parallelism unnecessary. |

## Feature Dependencies

```
Tool Approval Flow
    ├──requires──> Approval State Indicators
    └──requires──> Approval UI Components (Accept/Reject buttons)

Inline Visualization Rendering
    ├──requires──> Visualization Component (exists)
    ├──requires──> E2B Visualization Extraction (exists)
    └──requires──> Message Rendering Integration

Error Display
    ├──requires──> E2B Error Propagation (exists)
    └──requires──> ToolOutput Error Rendering (exists)

Sandbox Lifecycle Testing
    ├──requires──> Create (exists)
    ├──requires──> Execute (exists)
    ├──requires──> Cleanup (stubbed - needs implementation)
    └──enhances──> Persistent Sandbox Per Session

Streaming States
    ├──requires──> useChat Hook (exists)
    └──enhances──> Loading State Indicators

Stop Execution
    ├──requires──> useChat stop() (exists)
    ├──requires──> Sandbox kill() (exists)
    └──requires──> Cleanup on Abort (needs verification)
```

### Dependency Notes

- **Tool Approval Flow requires Approval UI Components:** AI SDK provides backend (`addToolApprovalResponse`), but UI components (Accept/Reject buttons, confirmation prompt) need implementation. Confirmation.tsx provides primitives (ConfirmationRequest, ConfirmationActions).
- **Inline Visualization Rendering requires Message Rendering Integration:** Visualization.tsx exists standalone. Need to wire E2B's `visualizations` array into message parts rendering (message.tsx line 96+).
- **Sandbox Lifecycle Testing requires Cleanup implementation:** createTrackedSandbox and cleanupSandbox are stubbed (sandbox/manager.ts:26-36). Need actual cleanup logic to prevent resource leaks.
- **Stop Execution requires Cleanup on Abort:** Stop button exists, sandbox.kill() exists, but need to verify cleanup happens when user aborts mid-execution.

## MVP Definition (v2.3 Scope)

### Launch With (v2.3)

Minimum viable production features - what's needed to ship safely and usefully.

- [x] **Tool Approval Flow** — Security requirement. Users must explicitly approve code execution. Backend exists, need UI.
- [x] **Approval State Indicators** — Users need to know when approval is pending. Implemented in tool.tsx, verify integration.
- [x] **Inline Visualization Rendering** — Core value prop for data analysis. Components exist, need message integration.
- [x] **Error Display with Context** — Required for debugging. Error rendering exists, verify E2B error propagation.
- [x] **Loading State During Execution** — UX requirement. ThinkingMessage exists, verify tool-specific indicators.
- [x] **Stop Execution** — Safety feature. Stop button exists, verify sandbox cleanup on abort.
- [x] **E2B Sandbox Testing** — Validate create → execute → cleanup lifecycle before production.

### Add After Validation (v2.4+)

Features to add once core is working and validated with users.

- [ ] **Persistent Sandbox Per Session** — Enhances multi-step workflows. Requires cleanup implementation first.
- [ ] **Visualization Actions (Fullscreen, Download)** — Exists but untested. Validate rendering first, then test actions.
- [ ] **Tool Execution Timeline** — Nice-to-have visualization of execution flow. Status badges exist, could enhance.
- [ ] **Keyboard Shortcuts for Approval** — Reduces friction. Add after approval flow is stable.

### Future Consideration (v3+)

Features to defer until product-market fit is established.

- [ ] **Artifact Version History for Visualizations** — Interesting for iteration, but complex. Artifact versioning exists for code/text.
- [ ] **Execution Progress Indicators** — For long-running operations. Needs server-sent events or polling.
- [ ] **Sandbox Resource Monitoring** — Memory/CPU usage display. E2B may not expose metrics.
- [ ] **Multi-Language Support** — E2B supports more than Python. Focus on Python first.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| Tool Approval Flow | HIGH | MEDIUM | P1 | Security blocker. Backend exists, need UI components. |
| Inline Visualization Rendering | HIGH | LOW | P1 | Core feature. Components exist, need integration. |
| Error Display with Context | HIGH | LOW | P1 | UX blocker. Verify propagation, minimal new code. |
| E2B Sandbox Testing | HIGH | MEDIUM | P1 | Risk reduction. Write tests for create → execute → cleanup. |
| Stop Execution | HIGH | LOW | P1 | Safety feature. Verify cleanup on abort. |
| Approval State Indicators | MEDIUM | LOW | P1 | UX improvement. Mostly implemented, verify. |
| Loading State During Execution | MEDIUM | LOW | P1 | UX polish. ThinkingMessage exists, add tool-specific. |
| Persistent Sandbox Per Session | MEDIUM | MEDIUM | P2 | Workflow enhancement. Needs cleanup implementation. |
| Visualization Actions | MEDIUM | LOW | P2 | UX polish. Exists but untested. |
| Tool Execution Timeline | LOW | MEDIUM | P3 | Nice-to-have. Status badges sufficient for MVP. |
| Keyboard Shortcuts | LOW | LOW | P3 | Convenience. Add after approval flow stable. |

**Priority key:**
- P1: Must have for v2.3 launch (security, core features, testing)
- P2: Should have for v2.4 (workflow enhancements, polish)
- P3: Nice to have for v3+ (convenience, advanced features)

## Competitor Feature Analysis

| Feature | ChatGPT Code Interpreter | Claude Artifacts | Jupyter Notebooks | Our Approach |
|---------|--------------------------|------------------|-------------------|--------------|
| **Tool Approval** | None (auto-executes) | Preview before execution | Manual cell execution | Explicit approval with Accept/Reject buttons (security-first) |
| **Visualization Format** | PNG only | PNG only | PNG/SVG/HTML | PNG/SVG/HTML (multi-format) |
| **Inline Display** | Yes, in chat | Yes, in canvas | Yes, below cell | Yes, in message stream |
| **Error Display** | Generic message | Generic message | Full traceback | Full traceback with timeout detection |
| **Execution States** | Thinking indicator | Streaming indicator | Running/Completed/Error | 7-state progression with icons |
| **Stop Execution** | Yes (stop button) | Yes (stop button) | Yes (interrupt kernel) | Yes (stop + sandbox cleanup) |
| **Session Persistence** | Persistent per chat | No persistence | Persistent kernel | Persistent per chat (1hr timeout) |
| **Download Charts** | Yes | No | Yes (right-click) | Yes (download button on hover) |
| **Fullscreen View** | No | Yes (in canvas) | No | Yes (dialog modal) |
| **Collapsible Details** | No | No | Yes (cell collapse) | Yes (tool collapse) |

## Implementation Notes (v2.3 Specific)

### Tool Approval Flow

**What exists:**
- Backend: `addToolApprovalResponse` in useChat (chat.tsx:88)
- States: approval-requested, approval-responded, output-denied (ai-elements/tool.tsx:32-39)
- Primitives: Confirmation components (ai-elements/confirmation.tsx)

**What needs building:**
- Wire Confirmation components into tool rendering (message.tsx)
- Add Accept/Reject buttons that call `addToolApprovalResponse`
- Handle approval-responded → auto-continue (exists: chat.tsx:93-104)
- Test flow: tool call → approval UI → user accepts → execution → result display

**Security considerations:**
- Always show tool name, parameters before approval
- No default approval (user must click)
- Audit log for approved/rejected tools (future)

### Visualization Rendering

**What exists:**
- E2B returns visualizations: `execution.results` filtered for png/svg/html (e2b-client.ts:63-70)
- Visualization component with loading/error states (visualization.tsx)
- Canvas component for artifact rendering (canvas.tsx)

**What needs building:**
- Add visualization parts to message rendering (message.tsx around line 150+)
- Map E2B visualization formats to Visualization component props
- Test: matplotlib chart → E2B PNG → inline display
- Test: plotly chart → E2B HTML → iframe display
- Test: SVG chart → E2B SVG → object/img display

**Edge cases:**
- Multiple visualizations in one execution (render all)
- Visualization loading failure (show error, not broken image)
- HTML sandboxing (already using `sandbox="allow-scripts"` in visualization.tsx:58)

### E2B Testing

**What exists:**
- Create: `createTrackedSandbox` (sandbox/manager.ts:15-24)
- Execute: `sandbox.runCode` with timeout (e2b-client.ts:27-71)
- Kill: `sandbox.kill()` (e2b-client.ts:73-75)
- Cleanup: stubbed functions (sandbox/manager.ts:26-36)

**What needs testing:**
- Create sandbox → verify sandboxId returned
- Execute code → verify stdout, stderr, result
- Execute code with files → verify file writing (e2b-client.ts:28-35)
- Execute code with timeout → verify TimeoutError (e2b-client.ts:56)
- Execute code with error → verify traceback (e2b-client.ts:55)
- Execute code with visualization → verify visualizations array
- Kill sandbox → verify cleanup
- Session lifecycle → create → multi-execute → cleanup (1hr timeout)

**Test categories:**
- Unit: E2B client functions in isolation
- Integration: MCP tool → E2B → result propagation
- E2E: Chat message → tool approval → execution → visualization display

### Chat UI Polish

**What exists:**
- Streaming: useChat hook with status tracking (chat.tsx:80-150)
- Loading: ThinkingMessage component (messages.tsx:67-70)
- Error: ChatSDKError handling with toast (chat.tsx:138-148)
- Stop: stop button in MultimodalInput (chat.tsx:85)

**What needs verification:**
- Streaming status during tool execution (is 'submitted' correct state?)
- Tool-specific loading indicators (show which tool is running)
- Error recovery (can user retry after error?)
- Stop execution → sandbox cleanup (verify kill() called)

**UX polish checklist:**
- [ ] Loading indicator shows during approval-requested
- [ ] Loading indicator shows during code execution
- [ ] Error messages are actionable (not just "failed")
- [ ] Stop button disables after clicked (prevent double-click)
- [ ] Scroll position maintains during streaming
- [ ] Keyboard focus returns to input after execution

## Sources

**Authoritative sources (HIGH confidence):**
- Vercel AI SDK Documentation: Tool approval, streaming states, error handling patterns verified via ai-sdk.dev
- E2B Code Interpreter: Sandbox lifecycle, visualization extraction verified via e2b.dev/docs
- Existing codebase: chat.tsx, artifact.tsx, visualization.tsx, e2b-client.tsx, message.tsx

**Implementation references (MEDIUM confidence):**
- Vercel ai-chatbot: Reference implementation patterns for streaming, tool execution
- AI SDK UI components: Confirmation, Tool, ToolOutput patterns

**Domain knowledge (training data, LOW confidence - flagged for validation):**
- ChatGPT Code Interpreter behavior (no official docs, observed patterns)
- Claude Artifacts preview flow (observed patterns)
- Jupyter notebook execution states (well-documented, but not directly applicable)

**Note:** All LOW confidence items are flagged and not used for critical decisions. Where uncertain, codebase patterns take precedence over assumed behavior.

---
*Feature research for: v2.3 Production Playground*
*Researched: 2026-02-02*
*Based on: Vercel AI SDK v4, E2B Code Interpreter v2.3, existing v2.2 foundation*
