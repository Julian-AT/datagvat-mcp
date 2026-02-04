# Phase 20: Visualization Rendering

**Phase ID:** 20-visualization-rendering  
**Goal:** Charts and plots render inline in chat messages with multi-format support, blob storage for memory efficiency, grid layout for multiple visualizations, and interactive HTML support.

**Dependencies:** Phase 19.1 (unified sandbox artifacts - COMPLETE)

**Completion Status:** 5/10 requirements already implemented (VIZ-01, VIZ-03, VIZ-04, VIZ-06, VIZ-07)

---

## Requirements Status

| Requirement | Description | Status | Plan |
|-------------|-------------|--------|------|
| VIZ-01 | Charts render inline in chat messages | ✓ Complete | Already working |
| VIZ-02 | Multi-format support (PNG, SVG, HTML) | Partial | Plan 01 |
| VIZ-03 | Base64 images upload to Vercel Blob immediately | ✓ Complete | Already working |
| VIZ-04 | Only visualization URLs persist in message parts | ✓ Complete | Already working |
| VIZ-05 | Multiple visualizations display in grid layout | Pending | Plan 02 |
| VIZ-06 | Each visualization supports fullscreen and download | ✓ Complete | Already working |
| VIZ-07 | Static images (PNG/SVG) render as img tags | ✓ Complete | Already working |
| VIZ-08 | Interactive HTML visualizations render in artifacts/canvas pattern | Pending | Plan 03 |
| VIZ-09 | Artifacts support multiple content types | Pending | Plan 03 |
| VIZ-10 | Memory usage <500MB for 50 visualizations | Pending | Plan 04 |

---

## Plans

| # | Name | File | Focus | Status |
|---|------|------|-------|--------|
| 01 | HTML Visualization Support | 20-01-PLAN.md | Extend executor and blob upload for HTML format | Planned |
| 02 | Grid Layout Component | 20-02-PLAN.md | Create responsive grid for 1-4 visualizations | Planned |
| 03 | Interactive HTML Artifacts | 20-03-PLAN.md | Sandboxed iframe for plotly/bokeh interactivity | Planned |
| 04 | Testing and Verification | 20-04-PLAN.md | Memory testing, E2E tests, optimization verification | Planned |

---

## Success Criteria

When Phase 20 completes, these observable truths must be TRUE:

1. **User generates matplotlib chart and sees it render inline immediately** (VIZ-01, VIZ-03, VIZ-04)
   - PNG visualizations from E2B render as `<img>` tags with proper URLs
   - Visualizations display within sandbox output tab

2. **User generates HTML visualization (plotly) and it renders interactively** (VIZ-02, VIZ-08)
   - Plotly HTML files upload to Vercel Blob
   - HTML renders in sandboxed iframe allowing hover/click interactions
   - Pan, zoom, and tooltip interactions work

3. **User sees multiple visualizations in responsive grid layout** (VIZ-05)
   - 1 visualization: full width
   - 2 visualizations: side-by-side
   - 3 visualizations: 2 top, 1 bottom centered or 3 equal
   - 4 visualizations: 2x2 grid
   - Grid adapts responsively on mobile (stacks vertically)

4. **User can click fullscreen and download on any visualization** (VIZ-06)
   - Fullscreen opens overlay/modal with larger view
   - Download button saves original file (PNG/SVG/HTML)
   - Works consistently across all formats

5. **User can create 50 visualizations without browser memory issues** (VIZ-10)
   - Visualizations lazy-load when scrolled into view
   - Memory usage stays below 500MB per conversation
   - Tested with memory profiling tools

6. **Developer can verify all formats work end-to-end** (VIZ-02, VIZ-07, VIZ-09)
   - PNG renders as `<img>`
   - SVG renders as `<img>` or `<object>` for interactivity
   - HTML renders in sandboxed iframe
   - Test suite validates each format

---

## Progress Tracking

| Requirement | Plan | Status | Notes |
|-------------|------|--------|-------|
| VIZ-01 | N/A | ✅ Done | Already implemented in sandbox-output-tab.tsx |
| VIZ-02 | 01, 03 | 🔲 Pending | Need HTML upload and rendering |
| VIZ-03 | N/A | ✅ Done | Base64 upload to Blob working |
| VIZ-04 | N/A | ✅ Done | URLs persist in outputs JSON |
| VIZ-05 | 02 | 🔲 Pending | Grid layout component needed |
| VIZ-06 | N/A | ✅ Done | Fullscreen and download working |
| VIZ-07 | N/A | ✅ Done | PNG/SVG render as img tags |
| VIZ-08 | 03 | 🔲 Pending | HTML artifact/canvas pattern |
| VIZ-09 | 03 | 🔲 Pending | Artifact type expansion |
| VIZ-10 | 04 | 🔲 Pending | Memory testing needed |

**Current Progress:** 5/10 requirements complete (50%)

---

## Technical Context

### Existing Implementation

**Vercel Blob Integration:**
- `@vercel/blob` package installed
- `docs/lib/blob.ts` provides `uploadImageFromBase64()` and `uploadVisualization()`
- Visualizations stored at `chats/{chatId}/{filename}` with public access

**Sandbox Executor:**
- `docs/lib/e2b/sandbox-executor.ts` handles code execution
- Currently uploads PNG and SVG to Blob (lines 117-164)
- HTML support partially present (viz.html check exists but no upload logic)

**Visualization Rendering:**
- `docs/components/sandbox-output-tab.tsx` renders outputs from sandbox state
- `docs/components/visualization.tsx` provides format-agnostic component (PNG/SVG/HTML)
- Fullscreen dialog and download implemented

### What's Missing

1. **HTML Upload:** Executor has `viz.html` check but no upload logic (gap at line 163-164)
2. **Grid Layout:** Currently renders visualizations sequentially (no grid)
3. **HTML Artifacts:** Need dedicated component for interactive content
4. **Memory Testing:** No performance validation for large conversation volumes

---

## Dependencies

- Phase 19.1 Unified Sandbox Artifacts (COMPLETE) - provides sandbox state, openSandbox tool, sandbox UI
- Phase 18 E2B Infrastructure (COMPLETE) - provides sandbox execution foundation
- Vercel Blob configured with proper access tokens

---

## Execution Order

```
Plan 01 (HTML Upload)
    ↓
Plan 02 (Grid Layout)
    ↓
Plan 03 (HTML Artifacts)
    ↓
Plan 04 (Testing)
```

**Why this order:**
- HTML upload must work before we can test HTML rendering
- Grid layout provides the UI foundation for multiple visualizations
- HTML artifacts build on grid layout for interactive content
- Testing validates everything at the end

---

## Next Steps

1. Review this phase plan
2. Execute Plan 01: `/gsd:execute-plan 20 01`
3. Execute Plans 02-04 sequentially
4. Mark Phase 20 complete when all success criteria pass

---

*Created: 2026-02-03*  
*Phase: 20-visualization-rendering*  
*Milestone: v2.3 Production Playground*
