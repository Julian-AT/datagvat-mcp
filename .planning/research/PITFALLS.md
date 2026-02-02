# Pitfalls Research: v2.3 Production Playground

**Domain:** Tool approval flows, visualization rendering, E2B testing, and chat UI polish
**Researched:** 2026-02-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Tool Approval Bypass Through State Mismatch

**What goes wrong:**
AI SDK's `addToolApprovalResponse` is called, but the approval state doesn't properly flow through the streaming pipeline. Tool executes without waiting for approval, or approval UI disappears before user can respond. In worst case: user refreshes page, persisted messages contain tool-approval-response parts, and tools re-execute on page load without new approval dialog.

**Why it happens:**
AI SDK 6's tool approval uses a complex state machine with parts: `tool-call` → `tool-approval-request` → `tool-approval-response` → `tool-result`. The `needsApproval` flag is checked only at tool-call-time. When messages load from database with existing `tool-approval-response` parts, SDK treats approval as "already given" and may skip re-checking. The `experimental_needsApproval` naming suggests this feature is still stabilizing.

**How to avoid:**
- NEVER persist `tool-approval-request` or `tool-approval-response` parts in database
- Store approval state separately: `tool_approvals` table with columns `(tool_call_id, approved, denied_reason, approved_at)`
- Filter message parts before persistence: strip approval-related parts, keep only tool-calls and tool-results
- When loading messages from database, reconstruct approval state from separate table
- Add integration test: save message with approval → reload page → verify no auto-execution
- Use `lastAssistantMessageIsCompleteWithApprovalResponses` for auto-submit only after explicit user action
- Add server-side validation: check that approval timestamp is within 5 minutes of tool call (prevent replay attacks)

**Warning signs:**
- Tool executes immediately after page refresh without approval dialog
- Approval dialog appears but closing it still executes the tool
- Multiple approval dialogs for the same tool call appear in different browser tabs
- Console errors: `InvalidToolApprovalError` or `ToolCallNotFoundForApprovalError`
- Database query shows `tool-approval-response` parts in persisted messages

**Phase to address:**
Phase 1 (Tool Approval Flow) — Database schema must separate approval state from message content

---

### Pitfall 2: E2B Sandbox Orphaning During Streaming Errors

**What goes wrong:**
User triggers code execution. E2B sandbox is created successfully. During result streaming, connection drops (user closes tab, network failure, server timeout). Sandbox continues running in E2B cloud. After 100+ conversations, E2B resource quota exhausted. New executions fail with "quota exceeded" errors. No admin visibility into orphaned sandboxes.

**Why it happens:**
E2B `Sandbox.create()` returns immediately with sandbox ID. The `kill()` method is only called in explicit cleanup paths (happy path after execution completes). Error handlers focus on user-facing errors, not resource cleanup. Server-side streaming errors (network disconnect, client abort) don't trigger cleanup. E2B bills for sandbox-hours, so orphaned sandboxes cost money even if idle. The current codebase has `kill()` but no lifecycle tracking.

**How to avoid:**
- Track ALL sandboxes in database: `e2b_sandboxes` table with `(id, conversation_id, created_at, killed_at, status)`
- Set sandbox status: `creating` → `active` → `killed` → `error`
- Implement background cleanup job (runs every 5 minutes): kill sandboxes older than 1 hour, or with `killed_at = null` and `created_at < 30 minutes ago`
- Wrap E2B operations in try-finally: always call `kill()` in finally block
- Add signal handler for server shutdown: kill all active sandboxes before exit
- Store sandbox ID in message metadata for manual recovery
- Add admin endpoint: `GET /api/admin/sandboxes` to list and manually kill orphaned sandboxes
- Monitor E2B quota usage: alert when approaching limits
- Test with: start 10 executions, abort mid-stream, verify all sandboxes killed

**Warning signs:**
- E2B dashboard shows many "running" sandboxes with no activity
- Code execution fails with "quota exceeded" or "concurrent sandbox limit reached"
- Database shows sandboxes with `killed_at = null` older than 1 hour
- E2B bill higher than expected for usage level
- Execution errors: "Failed to create sandbox" with no clear reason

**Phase to address:**
Phase 3 (E2B Integration Testing) — Lifecycle tracking must exist before production load

---

### Pitfall 3: Visualization Memory Leak with Base64 Encoding

**What goes wrong:**
E2B returns PNG visualizations as base64 strings (2-5MB each). Component stores these in React state. After 10 visualizations in one conversation, browser tab uses 2GB memory. Page becomes sluggish. Mobile browsers crash. Garbage collection can't reclaim memory because base64 strings are still referenced in message history.

**Why it happens:**
E2B's `execution.results` includes base64-encoded PNG/SVG. React components hold these in state for rendering. Even after component unmounts, message history in `useChat` keeps references. Base64 encoding increases size by ~33% vs binary. The visualization component creates data URLs (`data:image/png;base64,...`) which duplicate memory usage. Browser image cache can't help because data URLs aren't cached across re-renders.

**How to avoid:**
- NEVER store base64 visualization data in message parts
- Convert base64 to Blob immediately after receiving from E2B
- Upload Blob to storage (S3, Cloudflare R2, or Vercel Blob) within same request
- Store only URL in message parts: `{ type: 'visualization', url: 'https://...', format: 'png' }`
- Use `URL.createObjectURL()` for client-side temporary viewing, with cleanup on unmount
- Add size limit: if base64 > 5MB, show error "Visualization too large, try reducing data points"
- Implement lazy loading: don't render visualizations until scrolled into view
- Add compression: serve PNGs as WebP when browser supports it
- Test with 50 visualizations in one conversation: verify memory usage stays under 500MB

**How to avoid:**
- Convert E2B base64 results to Blob immediately in API route
- Upload to Vercel Blob storage (or R2/S3) before sending to client
- Store only URL in message parts, not base64 data
- Add size check: if visualization > 5MB, reject with user-friendly error
- Use `URL.createObjectURL()` for previews, revoke on component unmount
- Implement pagination: only render last 10 messages initially, lazy-load older ones
- Add memoization: don't re-render visualization if URL hasn't changed

**Warning signs:**
- Browser DevTools shows memory usage increasing with each visualization
- React DevTools Profiler shows expensive re-renders of message list
- Mobile browsers crash when scrolling through conversation history
- Network tab shows multi-MB WebSocket messages
- Console warnings: "Maximum state update depth exceeded"

**Phase to address:**
Phase 2 (Visualization Rendering) — Storage strategy must be in place before implementing visualization display

---

### Pitfall 4: Missing Loading States Create "Frozen UI" Perception

**What goes wrong:**
User clicks send. Button stays enabled. No visual feedback. 2 seconds pass. User clicks send again. Two messages sent. OR: Code execution starts. No progress indicator. User waits 20 seconds. Thinks app crashed. Refreshes page. Execution aborted. User frustrated.

**Why it happens:**
AI SDK `useChat` provides `status` prop (`awaiting-message`, `streaming`, etc) but components don't consume it. Tool execution happens server-side with no client-side progress updates. E2B sandbox creation takes 3-8 seconds but appears instant to code. Streaming updates focus on text, not tool execution status. Current artifact.tsx has `status: 'streaming' | 'idle'` but no intermediate states like "creating sandbox" or "executing code".

**How to avoid:**
- Use `useChat` status in ALL interactive components: disable send button when `status !== 'awaiting-message'`
- Add tool-specific loading states in message parts: check `part.state === 'input-streaming'` for tools
- Stream tool execution progress from server: `onChunk` in tool execute function with status updates
- Display status in UI: "Creating execution environment..." → "Running code..." → "Generating visualization..."
- Add skeleton loading states for visualizations before data arrives
- Show spinner on message actions while processing
- Add timeout indicator: if execution > 10s, show "Still working... this might take a while"
- Implement optimistic UI updates: show user message immediately, show loading indicator for assistant response
- Test with slow network (Chrome DevTools throttling): verify all states render correctly

**Warning signs:**
- Users report "clicking send multiple times because nothing happened"
- Support tickets: "App frozen" when actually streaming is in progress
- High bounce rate: users leave during first code execution
- Console shows multiple concurrent streamText calls for same message
- No visual difference between "waiting for response" and "streaming response"

**Phase to address:**
Phase 4 (Chat UI Polish) — Loading states must be comprehensive before public beta

---

### Pitfall 5: Tool Approval UI Blocks All Interaction

**What goes wrong:**
Tool approval dialog appears as modal blocking entire UI. User can't scroll to review previous messages. Can't copy code from earlier in conversation to understand what tool will do. Can't check documentation. Approval is binary: yes/no, but user needs context that's now hidden behind modal. User denies approval out of confusion.

**Why it happens:**
Default pattern is to show approval as modal dialog (like the AI SDK example). Designers prioritize "getting user attention" over "enabling informed decisions". The approval request part contains tool input, but not the conversation context that led to tool call. User needs to see: what data is being operated on, what previous results were, what the goal is. Modal dialogs optimize for quick decisions, not informed ones.

**How to avoid:**
- Use inline approval UI within message flow, NOT modal dialog
- Display approval request as expanded message part with full context
- Show: tool name, full input parameters with syntax highlighting, expected outcome description
- Allow scrolling to review conversation history while approval request is visible
- Add "Learn more" link that explains what this specific tool does
- Show preview of tool effect if possible ("This will create a new dataset named X")
- Make approval sticky: stays at bottom of screen while user scrolls
- Add "Ask a question" button: user can request clarification before approving
- Implement approval timeout: auto-deny after 5 minutes to prevent zombie approvals
- Test with real users: give them complex approval scenario, observe if they scroll before deciding

**Warning signs:**
- High approval denial rate (>30%) suggesting user uncertainty
- Users approve dangerous operations (delete all data) without hesitation
- Time-to-approval is very short (<5 seconds) suggesting users not reading details
- Support tickets: "I approved but didn't understand what would happen"
- A/B test shows modal has worse UX metrics than inline

**Phase to address:**
Phase 1 (Tool Approval Flow) — UX design must enable informed decisions

---

### Pitfall 6: Visualization Format Incompatibility Goes Undetected

**What goes wrong:**
E2B returns SVG visualization with embedded JavaScript (interactive Plotly chart). Visualization component renders it in `<object>` tag with strict CSP. JavaScript doesn't execute. Chart appears static. User reports "visualization broken" but it renders fine in developer's local environment (looser CSP). Production debugging is difficult because error is silent.

**Why it happens:**
E2B code interpreter supports multiple visualization libraries (matplotlib, plotly, seaborn, etc). Each has different output formats. Matplotlib generates static PNG/SVG. Plotly generates HTML with embedded JavaScript. Bokeh generates HTML with separate JS files. The visualization component assumes all formats are safe to render. CSP headers in production block unsafe-inline scripts. The current visualization.tsx uses `sandbox="allow-scripts"` for iframe, but not for `<object>` SVG rendering.

**How to avoid:**
- Detect visualization format server-side before sending to client
- Classify formats: `static` (PNG, static SVG) vs `interactive` (HTML with scripts)
- For interactive visualizations: render in sandboxed iframe with explicit permissions
- For static visualizations: render as `<img>` or `<object>`
- Add format validation: if SVG contains `<script>`, upgrade to iframe rendering
- Test each supported visualization library (matplotlib, plotly, seaborn, bokeh) in production CSP
- Add error boundary around visualization component with fallback: "Visualization format not supported"
- Show format badge: "Static image" vs "Interactive chart" so user knows what to expect
- Implement format conversion server-side: convert Plotly HTML to static PNG if interactivity not needed
- Add to documentation: "Supported visualization libraries and their capabilities"

**Warning signs:**
- SVG visualizations render as blank squares in production, fine locally
- Browser console errors: "Refused to execute inline script" on visualization pages
- Interactive charts work on localhost:3000, broken on vercel.app deployment
- User reports: "The chart doesn't respond to mouse hover" when it should
- Visualization appears but controls (zoom, pan) don't work

**Phase to address:**
Phase 2 (Visualization Rendering) — Format detection and handling must be tested in production-like CSP

---

### Pitfall 7: Error Messages Expose Internal Implementation Details

**What goes wrong:**
Code execution fails. User sees: "Error: stdio transport disconnected at line 47 in e2b-client.ts". User has no idea what stdio means, what transport is, or what to do. Files GitHub issue: "App broken, error with stdio". Developer can't reproduce. User churns. OR: Tool approval fails with "InvalidToolApprovalError: approvalId abc-123 not found in message history". User confused why approval didn't work.

**Why it happens:**
Error messages bubble up from internal libraries (AI SDK, E2B SDK) directly to UI. Developers don't intercept and translate errors. Error handling focuses on logging for debugging, not user communication. AI SDK errors are technical: `ToolCallNotFoundForApprovalError`, `InvalidToolApprovalError`. E2B errors reference internal concepts: "sandbox initialization failed", "quota exceeded". Current visualization.tsx shows "Failed to load visualization" which is better, but doesn't explain WHY or what user can do.

**How to avoid:**
- Create error translation layer: map technical errors to user-friendly messages
- Never show stack traces, error codes, or file names to end users
- Follow pattern: "What happened" + "Why it might have happened" + "What you can do"
- Examples:
  - E2B quota exceeded → "We're experiencing high demand. Please try again in a few minutes."
  - Tool approval invalid → "Approval expired. The request will be shown again."
  - Visualization too large → "Visualization is too large to display. Try reducing data points or using sampling."
  - Sandbox creation failed → "Couldn't start code execution environment. Please refresh and try again."
- Add error codes for support: show code in small text, but main message is user-friendly
- Implement `onError` handler in `toUIMessageStreamResponse` to transform all errors
- Create error boundary component with recovery actions (retry, reset, contact support)
- Test error UX: trigger each error type, verify message is actionable

**Warning signs:**
- User bug reports copy-paste error messages with file paths and line numbers
- Support team can't help users because error messages are too vague
- Error messages contain words like "undefined", "null", "transport", "protocol", "schema"
- Users report errors but can't reproduce because message was too technical to understand
- High error-to-churn correlation: users leave immediately after seeing error

**Phase to address:**
Phase 4 (Chat UI Polish) — Error translation must be comprehensive before public release

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing base64 visualizations in database | Simple implementation, no file storage setup | Memory leaks, slow queries, database bloat | Never — convert to blob storage from day one |
| Modal dialog for tool approval | Quick to implement, clear user attention | Poor UX, users can't review context, high denial rate | Only for MVP demo, not production |
| No E2B sandbox tracking | Simpler code, faster initial development | Resource leaks, quota exhaustion, debugging nightmares | Only if planning to add tracking before 10 users |
| Generic error messages | Less code, fewer string translations | User confusion, support burden, churn | Never — error UX is critical for AI tools |
| Synchronous visualization rendering | Simpler React component logic | UI freezes with large images, poor mobile experience | Only if limiting to small visualizations (<500KB) |
| No tool execution progress updates | Simpler streaming implementation | "Frozen UI" perception, users abandon mid-execution | Only for executions that complete in <3 seconds |
| Persisting approval state in message parts | Follows AI SDK example pattern | Approval bypass vulnerabilities, replay attacks | Never — security risk too high |
| Client-side-only loading states | No backend changes needed | Inaccurate (network delay), doesn't reflect server status | Only if server execution is <1 second |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| AI SDK tool approval | Treating `addToolApprovalResponse` as fire-and-forget | Store approval state separately, verify it's processed before showing "approved" UI |
| E2B sandbox lifecycle | Only calling `kill()` in happy path | Always use try-finally, track in database, implement background cleanup |
| Vercel Blob storage | Uploading synchronously in API route, blocking response | Upload in parallel with streaming, send URL when available |
| AI SDK streaming | Not handling client disconnect | Add signal handler, cleanup resources on abort |
| CSP with visualizations | Assuming all formats are safe | Detect format, use appropriate rendering (iframe vs img vs object) |
| Tool execution status | Relying on client-side polling | Stream status updates through existing message stream |
| React state with large data | Storing base64 images in useState | Use refs for temporary data, URLs for persistent data |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire message list on each chunk | First message smooth, 50th message laggy | Memoize message components, virtualize list | After 30+ messages in conversation |
| Loading all visualizations on mount | Fast with 1 viz, freezes with 20+ | Lazy load visualizations, render on intersection observer | After 10+ visualizations |
| No debouncing on streaming updates | Smooth on desktop, janky on mobile | Debounce non-critical UI updates to 100ms | On mobile devices or slow CPUs |
| Storing tool execution results in memory | Works for minutes, memory leak over hours | Persist results to database, clear memory after render | After 1-2 hours of continuous use |
| Synchronous image format conversion | Fine for small images, blocks for large | Convert in background, show placeholder | Images >2MB |
| No request deduplication | Works with single user, overloads with many | Dedupe concurrent requests for same resource | 10+ concurrent users |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Persisting approval responses in database | Approval bypass via page refresh or message replay | Store approval state separately, never auto-execute from persisted state |
| No timeout on tool approval | Zombie approvals executed hours after request | Auto-deny approvals after 5 minutes, require fresh approval |
| Allowing arbitrary SVG content | XSS via malicious SVG with embedded scripts | Sanitize SVG, remove `<script>` tags, render in sandboxed context |
| No sandbox resource limits | Infinite loop consumes E2B quota indefinitely | Enforce timeouts (30s per execution), track total usage per user |
| Storing E2B API keys in client-side code | API key exposure, unauthorized usage | Keep API keys server-side only, never send to client |
| No rate limiting on code execution | Abuse of free tier, quota exhaustion | Rate limit: 10 executions per IP per hour for unauthenticated users |
| Allowing external network access from sandbox | Data exfiltration, privacy violation | Configure E2B network policy to block outbound except approved domains |
| No validation of visualization URLs | SSRF via malicious URL | Validate URLs are from trusted storage domain before rendering |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Modal approval dialog blocks context | Can't review code before approving, high denial rate | Inline approval UI, allow scrolling, show full context |
| No progress indicator during execution | "App frozen" perception, users refresh/abandon | Stream status updates: "Creating sandbox..." → "Running code..." → "Complete" |
| Generic error messages | Confusion, support burden, churn | Translate errors: "What happened" + "Why" + "What to do" |
| Visualization appears then disappears | Memory leak causes browser to unload images | Use proper blob storage, don't rely on base64 data URLs |
| No indication approval is processing | User clicks approve multiple times | Show "Processing..." immediately, disable button |
| Tool execution silent failure | User thinks code ran, but it failed silently | Always show result: success with output, or error with clear message |
| Approval expires without warning | User navigates away, comes back, approval invalid | Show countdown timer: "Approve within 4:32" |
| No way to cancel running execution | User stuck waiting for 30s timeout | Add cancel button, kill sandbox on cancel |
| Loading state only on button | User looks at message area, doesn't see button loading | Show loading indicator in message area where response will appear |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Tool approval flow:** Often missing approval state persistence — verify page refresh doesn't bypass approval
- [ ] **Tool approval flow:** Often missing timeout logic — verify old approvals auto-deny
- [ ] **E2B integration:** Often missing cleanup logic — verify all sandboxes killed after 1 hour
- [ ] **E2B integration:** Often missing error handling — verify network errors don't orphan sandboxes
- [ ] **Visualization rendering:** Often missing blob storage — verify base64 not stored in database
- [ ] **Visualization rendering:** Often missing format detection — verify SVG with scripts renders safely
- [ ] **Visualization rendering:** Often missing size limits — verify 10MB image doesn't crash browser
- [ ] **Loading states:** Often missing tool execution progress — verify "Creating sandbox..." message appears
- [ ] **Loading states:** Often missing disabled states — verify send button disabled while streaming
- [ ] **Error handling:** Often missing user-friendly messages — verify no error exposes file paths
- [ ] **Error handling:** Often missing recovery actions — verify errors show "what to do next"
- [ ] **Memory leaks:** Often missing cleanup on unmount — verify visualizations don't accumulate in memory
- [ ] **CSP compatibility:** Often missing production testing — verify visualizations work with strict CSP
- [ ] **Approval UX:** Often missing context preservation — verify user can scroll while approval UI visible

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Approval bypass via persisted state | HIGH | 1. Add `tool_approvals` table with migration 2. Strip approval parts from persisted messages 3. Deploy approval validation 4. Clear all cached message data 5. Test extensively |
| E2B sandbox orphaning | MEDIUM | 1. List all sandboxes via E2B API 2. Kill sandboxes older than 2 hours 3. Deploy lifecycle tracking 4. Add background cleanup job 5. Monitor for 48 hours |
| Visualization memory leak | MEDIUM | 1. Implement blob storage upload 2. Create migration to move existing base64 to storage 3. Update message parts to reference URLs 4. Clear browser caches 5. Monitor memory usage |
| Missing loading states | LOW | 1. Add status checks to components 2. Implement progress streaming 3. Test all execution paths 4. Deploy and verify |
| Frozen approval modal | LOW | 1. Convert modal to inline UI 2. Test scroll behavior 3. Deploy updated component 4. Collect user feedback |
| Format incompatibility in production | MEDIUM | 1. Add format detection to API route 2. Implement iframe fallback 3. Test each visualization library 4. Update CSP if needed 5. Deploy with gradual rollout |
| Technical error messages exposed | LOW | 1. Add error translation map 2. Implement onError handler 3. Create error boundary 4. Test all error paths 5. Deploy |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tool approval bypass | Phase 1 (Tool Approval Flow) | Page refresh doesn't re-execute tools, approval expires after 5 minutes |
| E2B sandbox orphaning | Phase 3 (E2B Integration Testing) | 20 executions with aborts, all sandboxes killed within 10 minutes |
| Visualization memory leak | Phase 2 (Visualization Rendering) | 50 visualizations in conversation, memory usage <500MB |
| Missing loading states | Phase 4 (Chat UI Polish) | All interactive elements show loading state, no "frozen UI" perception |
| Approval UI blocks interaction | Phase 1 (Tool Approval Flow) | User can scroll conversation while approval visible |
| Visualization format incompatibility | Phase 2 (Visualization Rendering) | Test matplotlib, plotly, seaborn, bokeh in production CSP |
| Technical error messages | Phase 4 (Chat UI Polish) | Trigger all errors, verify none expose internal details |
| No execution progress updates | Phase 3 (E2B Integration Testing) | Long execution shows "Running code..." during execution |
| No timeout on approval | Phase 1 (Tool Approval Flow) | Wait 6 minutes without approving, verify auto-deny |
| No sandbox resource limits | Phase 3 (E2B Integration Testing) | Infinite loop terminates after 30s |

## Sources

**Research basis:**
- AI SDK 6 official documentation: Tool approval flow, parts array pattern, streaming behavior (node_modules/ai/docs/)
- AI SDK source code analysis: `collect-tool-approvals.ts`, `is-approval-needed.ts` — approval state machine logic
- E2B client implementation review: `e2b-client.ts` — sandbox lifecycle, no cleanup tracking
- Artifact component review: `artifact.tsx` — loading states exist but incomplete
- Visualization component review: `visualization.tsx` — has basic loading/error states, no format detection
- Message component review: `message.tsx` — tool part rendering, missing progress states
- Existing PITFALLS.md: General pitfalls for v2.2, used as foundation

**Domain expertise:**
- Tool approval security patterns: Approval state persistence vulnerabilities, replay attack vectors
- E2B sandbox lifecycle: Resource leaks from orphaned sandboxes, cleanup best practices
- React performance patterns: Memory leaks from base64 data, virtualization needs, memoization
- Streaming UX patterns: Loading states, progress indicators, error recovery
- CSP and visualization formats: SVG with scripts, iframe sandboxing, format compatibility

**Confidence assessment:**
HIGH — Pitfalls derived from:
1. Source code analysis of actual implementation (e2b-client.ts, visualization.tsx, message.tsx)
2. AI SDK official documentation and source code review
3. Known security patterns for approval flows (replay attacks, state persistence)
4. React performance best practices (memory management, rendering optimization)
5. Production CSP constraints (script sandboxing, iframe permissions)

**Current state context:**
- v2.2 shipped with: Artifact/canvas components (untested), E2B integration (no lifecycle tracking), message persistence (parts array), experimental_needsApproval (not implemented)
- v2.3 must add: Tool approval UI, visualization rendering, E2B testing, chat UI polish
- Known gaps: No approval state management, no sandbox cleanup, base64 storage strategy undefined, loading states incomplete

**Areas validated with code inspection:**
- E2B client has `kill()` method but no try-finally or tracking (confirmed in e2b-client.ts)
- Visualization component has loading/error states but stores base64 in state (confirmed in visualization.tsx)
- Message component renders tool parts but no `approval-requested` state handling (confirmed in message.tsx)
- Artifact component has `addToolApprovalResponse` prop but not wired up (confirmed in artifact.tsx)

**Areas needing runtime validation during implementation:**
- Exact behavior of AI SDK approval state persistence when messages reload from database
- E2B sandbox quota limits and error messages for quota exceeded
- Production CSP headers and their impact on different visualization formats
- Memory usage patterns with 50+ visualizations in Chrome vs Safari vs Firefox

---
*Pitfalls research for: v2.3 Production Playground (Tool Approval, Visualization, E2B Testing, Chat UI Polish)*
*Researched: 2026-02-02*
