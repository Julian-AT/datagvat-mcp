# Requirements: v2.3 Production Playground

**Defined:** 2026-02-02
**Core Value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## v2.3 Requirements

Requirements for production-ready playground with security, testing, and polish. Each maps to roadmap phases.

### Tool Approval Flow

- [ ] **APPROVAL-01**: User can review generated code with syntax highlighting before execution
- [ ] **APPROVAL-02**: User must explicitly approve before any code executes
- [ ] **APPROVAL-03**: Approval denial prevents code execution without error
- [ ] **APPROVAL-04**: Approval state tracks separately from message parts (prevents replay attacks)
- [ ] **APPROVAL-05**: Approval UI displays inline (not blocking modal) to allow context review
- [ ] **APPROVAL-06**: Code preview shows full Python code with scrollable view

### E2B Lifecycle Testing

- [ ] **E2B-01**: Sandbox creates successfully with required Python libraries
- [ ] **E2B-02**: Code executes in isolated sandbox (not production environment)
- [ ] **E2B-03**: Sandbox cleanup (kill) runs after execution completes
- [ ] **E2B-04**: Sandbox cleanup runs even when execution fails or times out
- [ ] **E2B-05**: Timeout enforcement prevents infinite loops (30-second limit)
- [ ] **E2B-06**: Lifecycle tests verify create → execute → kill → verify cleanup
- [ ] **E2B-07**: No orphaned sandboxes after 100 sequential test runs
- [ ] **E2B-08**: Error handling preserves sandbox cleanup in try/finally pattern

### Visualization Rendering

- [ ] **VIZ-01**: Charts render inline in chat messages (not as downloads)
- [ ] **VIZ-02**: Multi-format support for PNG, SVG, and HTML visualizations
- [ ] **VIZ-03**: Base64 images upload to Vercel Blob immediately (never stored in database)
- [ ] **VIZ-04**: Only visualization URLs persist in message parts (not base64)
- [ ] **VIZ-05**: Multiple visualizations display in grid layout
- [ ] **VIZ-06**: Each visualization supports fullscreen and download
- [ ] **VIZ-07**: Static images (PNG/SVG) render as img tags
- [ ] **VIZ-08**: Interactive HTML visualizations render in artifacts/canvas pattern
- [ ] **VIZ-09**: Artifacts support multiple content types (charts, React webapps, etc.)
- [ ] **VIZ-10**: Memory usage <500MB for 50 visualizations in one conversation

### Chat UI Polish

- [ ] **UI-01**: Loading state shows "Creating sandbox..." during sandbox creation
- [ ] **UI-02**: Loading state shows "Running code..." during code execution
- [ ] **UI-03**: Streaming indicator displays during AI response generation
- [ ] **UI-04**: Send button disabled while streaming or executing
- [ ] **UI-05**: Error messages translate technical details to user-friendly explanations
- [ ] **UI-06**: Error traceback available in collapsible details section
- [ ] **UI-07**: Clear visual distinction between loading, success, and error states
- [ ] **UI-08**: Approval dialog integrates smoothly with message flow

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Approval timeout with countdown | Nice to have, but not critical if approval UI is intuitive — defer to v2.4 |
| Sandbox pooling for performance | Optimization only needed if creation latency becomes bottleneck — defer to v2.4 |
| Interactive visualization widgets (Plotly interactivity) | Requires iframe sandboxing with CSP adjustments — defer to v2.4 |
| Execution progress streaming | Premium UX, but added complexity — defer to v2.4 |
| Sandbox tracking database table | Background cleanup can work with E2B API queries — defer if not needed |
| Background cleanup job | Try/finally pattern sufficient for v2.3 — defer to v2.4 if orphaning detected |
| Multi-language support (R, Julia) | Python covers 95% of use cases — defer to v3.0 |
| User authentication | Still guest mode only — defer to v3.0 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| APPROVAL-01 | TBD | Pending |
| APPROVAL-02 | TBD | Pending |
| APPROVAL-03 | TBD | Pending |
| APPROVAL-04 | TBD | Pending |
| APPROVAL-05 | TBD | Pending |
| APPROVAL-06 | TBD | Pending |
| E2B-01 | TBD | Pending |
| E2B-02 | TBD | Pending |
| E2B-03 | TBD | Pending |
| E2B-04 | TBD | Pending |
| E2B-05 | TBD | Pending |
| E2B-06 | TBD | Pending |
| E2B-07 | TBD | Pending |
| E2B-08 | TBD | Pending |
| VIZ-01 | TBD | Pending |
| VIZ-02 | TBD | Pending |
| VIZ-03 | TBD | Pending |
| VIZ-04 | TBD | Pending |
| VIZ-05 | TBD | Pending |
| VIZ-06 | TBD | Pending |
| VIZ-07 | TBD | Pending |
| VIZ-08 | TBD | Pending |
| VIZ-09 | TBD | Pending |
| VIZ-10 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| UI-05 | TBD | Pending |
| UI-06 | TBD | Pending |
| UI-07 | TBD | Pending |
| UI-08 | TBD | Pending |

**Coverage:**
- v2.3 requirements: 32 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 32 ⚠️

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after initial definition*
