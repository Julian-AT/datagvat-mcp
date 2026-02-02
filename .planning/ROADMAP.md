# Roadmap: v2.3 Production Playground

**Created:** 2026-02-02
**Milestone:** v2.3 Production Playground
**Core Value:** Smart, relevant dataset discovery with secure, production-ready interactive code execution

## Overview

Transform the v2.2 playground foundation into a production-ready system with security (tool approval flows), quality assurance (E2B lifecycle testing), visualization rendering, and polished UX. All 32 requirements map to 4 phases following dependency hierarchy: validate infrastructure first, add security gates, render visualizations, then polish the complete experience.

**Phase structure:** 4 phases (18-21)
**Depth:** Standard
**Requirements coverage:** 32/32 (100%)

## Phases

### Phase 18: E2B Lifecycle Testing & Infrastructure

**Goal:** Validate E2B sandbox infrastructure is reliable, tracks resources properly, and prevents leaks before production load.

**Dependencies:** None (foundation phase)

**Requirements:**
- E2B-01: Sandbox creates successfully with required Python libraries
- E2B-02: Code executes in isolated sandbox (not production environment)
- E2B-03: Sandbox cleanup (kill) runs after execution completes
- E2B-04: Sandbox cleanup runs even when execution fails or times out
- E2B-05: Timeout enforcement prevents infinite loops (30-second limit)
- E2B-06: Lifecycle tests verify create → execute → kill → verify cleanup
- E2B-07: No orphaned sandboxes after 100 sequential test runs
- E2B-08: Error handling preserves sandbox cleanup in try/finally pattern

**Success Criteria:**

1. Developer can run test suite that creates 100 sandboxes sequentially and verifies all are cleaned up
2. Developer can trigger timeout scenario and verify sandbox still gets killed
3. Developer can trigger execution failure and verify sandbox cleanup runs in finally block
4. Developer can verify no orphaned sandboxes exist after test runs complete
5. Developer can execute multi-file Python projects with matplotlib/plotly and receive base64 visualizations

**Progress:** 0/8 requirements complete

---

### Phase 19: Tool Approval Flow

**Goal:** Users can review and approve generated code before execution, with security gates preventing bypass through state persistence or replay attacks.

**Dependencies:** Phase 18 (validated E2B infrastructure)

**Requirements:**
- APPROVAL-01: User can review generated code with syntax highlighting before execution
- APPROVAL-02: User must explicitly approve before any code executes
- APPROVAL-03: Approval denial prevents code execution without error
- APPROVAL-04: Approval state tracks separately from message parts (prevents replay attacks)
- APPROVAL-05: Approval UI displays inline (not blocking modal) to allow context review
- APPROVAL-06: Code preview shows full Python code with scrollable view

**Success Criteria:**

1. User sees syntax-highlighted Python code preview when AI generates executable code
2. User can approve code and execution proceeds, or deny code and execution is skipped cleanly
3. User can scroll conversation context while approval dialog is visible (inline, not modal)
4. User cannot replay approvals by refreshing page or manipulating stored messages
5. Developer can verify approval state persists in separate database table with timestamp validation

**Progress:** 0/6 requirements complete

---

### Phase 20: Visualization Rendering

**Goal:** Charts and plots render inline in chat messages with multi-format support, blob storage for memory efficiency, and grid layout for multiple visualizations.

**Dependencies:** Phase 19 (approved execution flow)

**Requirements:**
- VIZ-01: Charts render inline in chat messages (not as downloads)
- VIZ-02: Multi-format support for PNG, SVG, and HTML visualizations
- VIZ-03: Base64 images upload to Vercel Blob immediately (never stored in database)
- VIZ-04: Only visualization URLs persist in message parts (not base64)
- VIZ-05: Multiple visualizations display in grid layout
- VIZ-06: Each visualization supports fullscreen and download
- VIZ-07: Static images (PNG/SVG) render as img tags
- VIZ-08: Interactive HTML visualizations render in artifacts/canvas pattern
- VIZ-09: Artifacts support multiple content types (charts, React webapps, etc.)
- VIZ-10: Memory usage <500MB for 50 visualizations in one conversation

**Success Criteria:**

1. User generates matplotlib chart and sees it render inline immediately after approval
2. User generates multiple visualizations in one code execution and sees grid layout
3. User can click fullscreen on any visualization and download original file
4. User can create 50 visualizations in conversation without browser memory issues
5. Developer can verify base64 images upload to blob storage and only URLs persist in database

**Progress:** 0/10 requirements complete

---

### Phase 21: Chat UI Polish

**Goal:** Production-ready UX with clear loading states, friendly error messages, streaming indicators, and smooth approval integration that makes execution feel responsive and trustworthy.

**Dependencies:** Phase 19 (approval flow), Phase 20 (visualization rendering)

**Requirements:**
- UI-01: Loading state shows "Creating sandbox..." during sandbox creation
- UI-02: Loading state shows "Running code..." during code execution
- UI-03: Streaming indicator displays during AI response generation
- UI-04: Send button disabled while streaming or executing
- UI-05: Error messages translate technical details to user-friendly explanations
- UI-06: Error traceback available in collapsible details section
- UI-07: Clear visual distinction between loading, success, and error states
- UI-08: Approval dialog integrates smoothly with message flow

**Success Criteria:**

1. User sees "Creating sandbox..." indicator when code execution starts
2. User sees "Running code..." indicator during execution (5-30 second duration)
3. User cannot send message while streaming or executing (send button disabled)
4. User sees friendly error message when execution fails, with technical traceback in collapsible section
5. User experiences smooth flow from approval → loading → visualization without UI jank

**Progress:** 0/8 requirements complete

---

## Progress Tracking

| Phase | Name | Requirements | Completed | Status |
|-------|------|--------------|-----------|--------|
| 18 | E2B Lifecycle Testing | 8 | 0 | Pending |
| 19 | Tool Approval Flow | 6 | 0 | Pending |
| 20 | Visualization Rendering | 10 | 0 | Pending |
| 21 | Chat UI Polish | 8 | 0 | Pending |

**Total:** 32 requirements, 0 complete (0%)

## Dependency Chain

```
Phase 18 (E2B Testing)
    ↓
Phase 19 (Tool Approval) → Phase 20 (Visualization)
    ↓                           ↓
    └─────────→ Phase 21 (UI Polish) ←┘
```

**Critical path:** 18 → 19 → 20 → 21
**Parallel opportunities:** Phase 20 and Phase 21 can overlap after Phase 19 completes

## Next Steps

1. Review roadmap structure and phase goals
2. Run `/gsd:plan-phase 18` to start E2B lifecycle testing implementation
3. Execute plans sequentially through phases 18-21
4. Ship v2.3 milestone with production-ready playground

---
*Created: 2026-02-02*
*Last updated: 2026-02-02 (initial creation)*
