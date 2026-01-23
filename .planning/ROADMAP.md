# Roadmap: Austria MCP v2.1

## Overview

Milestone v2.1 enhances the production documentation platform with four major capabilities: simplified navigation from 8 tabs to 3, RAG-powered documentation chat for natural language Q&A, comprehensive video tutorials via Remotion, and shadcn-quality CLI improvements. This builds on v2.0's solid foundation of 112 MDX files and modern tooling to deliver a best-in-class documentation experience.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-9 (shipped 2026-01-17)
- ✅ **v1.1 Documentation Excellence** - Phases 10, 16, 17 (shipped 2026-01-18)
- ✅ **v1.2 Documentation Rebuild** - Phases 18-24 (shipped 2026-01-20)
- ✅ **v2.0 Professional Documentation System** - Phases 2-9 (shipped 2026-01-22)
- 🚧 **v2.1 Documentation Excellence & AI Features** - Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-9) - SHIPPED 2026-01-17</summary>

Comprehensive MCP server for Austrian Open Government Data with smart search, quality insights, data preview, and AI-powered semantic matching.

</details>

<details>
<summary>✅ v1.1 Documentation Excellence (Phases 10, 16, 17) - SHIPPED 2026-01-18</summary>

Improved documentation infrastructure with i18n foundation, comprehensive polish, and two-workspace architecture.

</details>

<details>
<summary>✅ v1.2 Documentation Rebuild (Phases 18-24) - SHIPPED 2026-01-20</summary>

Comprehensive, production-ready documentation from foundation to polish, with auto-generated tool reference, progressive disclosure patterns, and visual architecture aids.

</details>

<details>
<summary>✅ v2.0 Professional Documentation System (Phases 2-9) - SHIPPED 2026-01-22</summary>

Enterprise-grade documentation infrastructure with modern tooling (Bun, Biome), shadcn-like CLI installer, live AI testing interface, and auto-generated API documentation from OpenAPI schema.

</details>

### 🚧 v2.1 Documentation Excellence & AI Features (In Progress)

**Milestone Goal:** Perfect the documentation experience with simplified navigation, comprehensive video content, AI-powered chat for docs Q&A, and professional repository polish.

- [x] **Phase 10: Navigation Simplification** - Streamline from 8 tabs to 3, fix duplicate titles, polish README and repository structure
- [x] **Phase 11: CLI Excellence** - shadcn-quality interactive prompts, validation, self-maintenance
- [x] **Phase 12: RAG Documentation Chat** - AI-powered Q&A with source citations and streaming responses
- [ ] **Phase 13: Video Tutorials** - Programmatic video generation via Remotion with accessibility

## Phase Details

### Phase 10: Navigation Simplification
**Goal**: Users navigate documentation through clear 3-tab structure (Docs/API/Try) with consistent information architecture, no duplicate titles, and professional repository presentation

**Depends on**: Nothing (first phase of v2.1)

**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, README-01, README-02, README-03, README-04, README-05, README-06, README-07, CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User sees 3 main navigation tabs (Docs/API/Try) instead of 8-section sidebar
2. User clicks existing external links and arrives at correct page via redirects
3. User views any documentation page without seeing duplicate H1 titles
4. User navigates on mobile viewport with clear, accessible tab structure
5. User reads README and understands project purpose, installation, and quick start within 5 minutes
6. User browses repository and finds consistent file organization with no unused files
7. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 6 plans

Plans:
- [x] 10-01: Consolidate navigation meta.json from 8 tabs to 3 (Docs/API/Try) with comprehensive redirect mapping
- [x] 10-02: Fix duplicate title rendering and validate all internal links
- [x] 10-03: Create state-of-the-art README with quick start guide and visual examples
- [x] 10-04: EditorConfig, gitignore, and config consolidation
- [x] 10-05: Unused file detection and dependency audit
- [x] 10-06: Comprehensive build verification

### Phase 11: CLI Excellence
**Goal**: Users interact with CLI through intuitive prompts, clear error messages, and self-maintenance commands matching shadcn-level polish

**Depends on**: Phase 10

**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CLI-08, CLI-09, CLI-10, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User runs interactive setup and receives guidance through configuration options
2. User provides invalid input and immediately sees clear error message with solution steps
3. User runs update command and sees diff preview before applying changes
4. User runs health check command and receives diagnostic information for configuration issues
5. User runs CLI in CI environment and commands succeed without interactive prompts
6. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Interactive prompts with validation feedback and CI detection
- [x] 11-02-PLAN.md — Diff preview, health check, and update commands
- [x] 11-03-PLAN.md — Semantic versioning, documentation, and build verification

### Phase 12: RAG Documentation Chat
**Goal**: Users ask natural language questions about documentation and receive accurate answers with source citations, streaming responses, and code examples

**Depends on**: Phase 10 (stable navigation URLs for citations)

**Requirements**: RAG-01, RAG-02, RAG-03, RAG-04, RAG-05, RAG-06, RAG-07, RAG-08, RAG-09, RAG-10, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User asks "How do I search for Vienna datasets?" and receives relevant answer with clickable documentation links
2. User asks off-topic question and receives polite redirect to documentation scope
3. User sees responses stream token-by-token within 1 second of asking
4. User asks troubleshooting question and receives code examples matching their scenario
5. User follows multiple-turn conversation and chat maintains context across messages
6. User clicks chat citation links and arrives at correct documentation section
7. Developer runs full build and sees zero TypeScript errors, zero Biome lint errors, all tests passing

**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md — Vector indexing with build-time embedding and section-based chunking
- [x] 12-02-PLAN.md — RAG API route with streaming, citations, and similarity threshold validation
- [x] 12-03-PLAN.md — Chat UI integration with clickable citations and comprehensive build verification

### Phase 13: Video Tutorials
**Goal**: Users watch programmatically-generated video tutorials with captions demonstrating installation, workflows, and architecture

**Depends on**: Phase 10 (stable documentation structure for embedding videos)

**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03, VIDEO-04, VIDEO-05, VIDEO-06, VIDEO-07, VIDEO-08, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05

**Success Criteria** (what must be TRUE):
1. User watches quickstart video (2-3 min) demonstrating installation to first query
2. User watches workflow videos (3-5 min each) covering 3-4 key workflows with real data
3. User watches architecture video (5-7 min) understanding system design visually
4. User enables captions on any video and reads synchronized text for accessibility
5. User views video embedded in documentation page with native controls
6. Developer changes video code and runs render script to generate updated MP4 without manual filming
7. Developer runs full build and completes within 5 minutes (videos cached, not re-rendered)

**Plans**: 3 plans

Plans:
- [ ] 13-01-PLAN.md — Remotion infrastructure with build-time rendering and file-based caching
- [ ] 13-02-PLAN.md — Video compositions (QuickStart 2.5min, Workflow 4min, Architecture 6min) with frame-based animations
- [ ] 13-03-PLAN.md — WebVTT captions, responsive VideoPlayer component, documentation embedding, and build verification

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Navigation Simplification | 6/6 | ✓ Complete | 2026-01-23 |
| 11. CLI Excellence | 3/3 | ✓ Complete | 2026-01-23 |
| 12. RAG Documentation Chat | 3/3 | ✓ Complete | 2026-01-23 |
| 13. Video Tutorials | 0/3 | Not started | - |

---

*Last updated: 2026-01-23 after Phase 13 planning*
