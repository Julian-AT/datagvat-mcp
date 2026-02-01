# Phase 17: Code Execution Pipeline - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute AI-generated Python code in E2B sandboxes with timeout enforcement, multi-file support, and automatic error recovery. This phase delivers the execution infrastructure that takes code from Phase 16 (AI generation) and runs it safely with proper error handling and output capture.

</domain>

<decisions>
## Implementation Decisions

### Execution flow & timing
- AI-driven execution: AI decides when to execute code as part of its normal tool calling flow (after approval in Phase 18)
- Pre-install common packages (pandas, matplotlib, seaborn, plotly), allow AI to install others on-demand (hybrid approach)

### Error recovery behavior
- All error recovery strategies left to Claude's discretion based on what produces the best UX
- Error information format: Claude decides (complete context vs sanitized vs categorized)
- Retry exhaustion handling: Claude decides (graceful failure vs user intervention vs fallback)
- Timeout error handling: Claude decides (extend timeout, optimize code, or hard stop)

### Multi-file project structure
- Directory organization: Claude decides (flat, package structure, or progressive complexity)
- Entry point selection: Claude decides (designated entry point vs AI-specified vs execute all)
- Import strategy: Claude decides (relative, absolute, or flat imports based on Python best practices)
- Generated files: **Preserve all generated files** (CSVs, visualizations, intermediate results) - user might want to download them

### Output & feedback presentation
- stdout/stderr streaming: Claude decides (real-time, buffered, or smart streaming based on feasibility)
- stdout/stderr separation: Claude decides (separated, interleaved, or error-aware display)
- Execution feedback: Claude decides (spinner, detailed progress, or silent execution)
- Error detail visibility: Claude decides (complete transparency, simplified, or progressive disclosure)

### Claude's Discretion
- E2B tool structure (atomic execution vs separate write + execute tools)
- Sandbox reuse strategy (fresh per execution vs persistent per conversation)
- Error recovery aggressiveness (auto-retry count, when to surface errors)
- All output presentation patterns (streaming, buffering, error formatting)
- Multi-file project architecture (when to use packages vs flat structure)
- Import resolution strategy (Python best practices apply)

</decisions>

<specifics>
## Specific Ideas

- **30-second timeout is a hard requirement** from success criteria - must be enforced clearly
- **Multi-file support is essential** - not just single scripts, but proper project structures
- **Automatic error recovery** must be balanced - don't hide errors from users, but don't spam them with retry attempts
- **User visibility into execution** is important - stdout/stderr should be accessible for debugging
- Generated files (visualizations, CSVs) should persist so users can download them after execution

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-code-execution-pipeline*
*Context gathered: 2026-02-01*
