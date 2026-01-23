# Requirements: Austria MCP v2.1

**Defined:** 2026-01-22
**Core Value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## v2.1 Requirements

Requirements for Documentation Excellence & AI Features milestone. Each maps to roadmap phases.

### Navigation

- [ ] **NAV-01**: Documentation consolidates from 8 tabs to 3 tabs (Docs/API/Try)
- [ ] **NAV-02**: Duplicate title rendering fixed (frontmatter title does not render as H1)
- [ ] **NAV-03**: Comprehensive redirect mapping preserves all existing URLs
- [ ] **NAV-04**: Navigation structure tested on mobile viewports
- [ ] **NAV-05**: All internal links validated after restructuring

### RAG Documentation Chat

- [ ] **RAG-01**: User can ask natural language questions about documentation
- [ ] **RAG-02**: Chat provides source citations with links to documentation pages
- [ ] **RAG-03**: Responses stream token-by-token for perceived performance
- [ ] **RAG-04**: Chat generates code examples relevant to user questions
- [ ] **RAG-05**: Chat assists with troubleshooting common issues
- [ ] **RAG-06**: Chat understands Austrian data domain and MCP terminology
- [ ] **RAG-07**: Chat refuses to answer off-topic questions with helpful redirect
- [ ] **RAG-08**: Similarity threshold >0.75 prevents hallucinated citations
- [ ] **RAG-09**: Multi-turn conversations maintain context across messages
- [ ] **RAG-10**: Chat UI integrates with existing search button (bottom-right)

### Video Tutorials

- [ ] **VIDEO-01**: Quickstart video (2-3 min) demonstrates installation
- [ ] **VIDEO-02**: Workflow demo videos (3-5 min each) cover 3-4 key workflows
- [ ] **VIDEO-03**: Architecture overview video (5-7 min) explains system design
- [ ] **VIDEO-04**: All videos include captions for accessibility
- [ ] **VIDEO-05**: Videos embed seamlessly in documentation pages
- [ ] **VIDEO-06**: Videos generated programmatically via Remotion (not manual filming)
- [ ] **VIDEO-07**: Video rendering separated from Next.js build (< 5 min constraint)
- [ ] **VIDEO-08**: Videos cached to avoid re-rendering on every build

### CLI Excellence

- [ ] **CLI-01**: Interactive prompts guide user through configuration
- [ ] **CLI-02**: Clear error messages include solutions and next steps
- [ ] **CLI-03**: Validation provides immediate feedback on invalid inputs
- [ ] **CLI-04**: Progress indicators show long-running operations
- [ ] **CLI-05**: Diff preview shows changes before applying (shadcn pattern)
- [ ] **CLI-06**: Health check command diagnoses common configuration issues
- [ ] **CLI-07**: Update command enables self-maintenance
- [ ] **CLI-08**: Config file validation catches errors early
- [ ] **CLI-09**: Non-interactive mode supports CI/CD automation
- [ ] **CLI-10**: Semantic versioning prevents breaking changes for existing users

### Repository Cleanup

- [ ] **CLEAN-01**: Unused files identified via static analysis and removed
- [ ] **CLEAN-02**: File structure follows consistent organization patterns
- [ ] **CLEAN-03**: Dependencies updated to latest compatible versions
- [ ] **CLEAN-04**: EditorConfig added for cross-editor consistency
- [ ] **CLEAN-05**: .gitignore audited and updated
- [ ] **CLEAN-06**: TypeScript/Biome configs consolidated where possible

### Project README

- [ ] **README-01**: README clearly describes project purpose
- [ ] **README-02**: Installation instructions are complete and tested
- [ ] **README-03**: Quick start guide gets users to first success < 5 minutes
- [ ] **README-04**: Links to full documentation site
- [ ] **README-05**: Badges show build status, test coverage, version
- [ ] **README-06**: Visual example or screenshot demonstrates value
- [ ] **README-07**: Contributing guidelines explain how to help

### Build Verification

- [ ] **BUILD-01**: Full build runs successfully after every phase
- [ ] **BUILD-02**: Build time remains under 5 minutes (excluding async video rendering)
- [ ] **BUILD-03**: No TypeScript errors after changes
- [ ] **BUILD-04**: Biome linting passes with zero errors
- [ ] **BUILD-05**: All tests pass after changes

## Future Requirements

Deferred to later milestones (v2.2+).

### Internationalization

- **I18N-01**: Complete German translation of all documentation
- **I18N-02**: German video content with native narration

### Visual Assets

- **VISUAL-01**: Real Claude Desktop screenshots replace placeholders
- **VISUAL-02**: Additional video content for advanced topics

### Advanced Features

- **ADVANCED-01**: RAG chat memory persistence across sessions
- **ADVANCED-02**: Video commenting and feedback system
- **ADVANCED-03**: CLI plugin system for extensions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration in chat | Single-user use case, unnecessary complexity |
| Video commenting system | GitHub Discussions already serves this purpose |
| CLI GUI wrapper | Target audience (developers) prefers CLI |
| Chat memory persistence | Privacy concerns + complexity, stateless is fine for docs Q&A |
| Multi-language video narration | Captions sufficient, narration is expensive |
| CLI plugin system | Scope creep, keep focused on core functionality |
| Browser-based video editing | Pre-render static MP4s, no need for runtime editing |
| Multi-modal RAG (images, videos) | Text-based docs sufficient for v2.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 10 | Complete |
| NAV-02 | Phase 10 | Complete |
| NAV-03 | Phase 10 | Complete |
| NAV-04 | Phase 10 | Complete |
| NAV-05 | Phase 10 | Complete |
| README-01 | Phase 10 | Complete |
| README-02 | Phase 10 | Complete |
| README-03 | Phase 10 | Complete |
| README-04 | Phase 10 | Complete |
| README-05 | Phase 10 | Complete |
| README-06 | Phase 10 | Complete |
| README-07 | Phase 10 | Complete |
| CLEAN-01 | Phase 10 | Complete |
| CLEAN-02 | Phase 10 | Complete |
| CLEAN-03 | Phase 10 | Complete |
| CLEAN-04 | Phase 10 | Complete |
| CLEAN-05 | Phase 10 | Complete |
| CLEAN-06 | Phase 10 | Complete |
| BUILD-01 | Phase 10 | Complete |
| BUILD-02 | Phase 10 | Complete |
| BUILD-03 | Phase 10 | Complete |
| BUILD-04 | Phase 10 | Complete |
| BUILD-05 | Phase 10 | Complete |
| CLI-01 | Phase 11 | Complete |
| CLI-02 | Phase 11 | Complete |
| CLI-03 | Phase 11 | Complete |
| CLI-04 | Phase 11 | Complete |
| CLI-05 | Phase 11 | Complete |
| CLI-06 | Phase 11 | Complete |
| CLI-07 | Phase 11 | Complete |
| CLI-08 | Phase 11 | Complete |
| CLI-09 | Phase 11 | Complete |
| CLI-10 | Phase 11 | Complete |
| BUILD-01 | Phase 11 | Complete |
| BUILD-02 | Phase 11 | Complete |
| BUILD-03 | Phase 11 | Complete |
| BUILD-04 | Phase 11 | Complete |
| BUILD-05 | Phase 11 | Complete |
| RAG-01 | Phase 12 | Complete |
| RAG-02 | Phase 12 | Complete |
| RAG-03 | Phase 12 | Complete |
| RAG-04 | Phase 12 | Complete |
| RAG-05 | Phase 12 | Complete |
| RAG-06 | Phase 12 | Complete |
| RAG-07 | Phase 12 | Complete |
| RAG-08 | Phase 12 | Complete |
| RAG-09 | Phase 12 | Complete |
| RAG-10 | Phase 12 | Complete |
| BUILD-01 | Phase 12 | Complete |
| BUILD-02 | Phase 12 | Complete |
| BUILD-03 | Phase 12 | Complete |
| BUILD-04 | Phase 12 | Complete |
| BUILD-05 | Phase 12 | Complete |
| VIDEO-01 | Phase 13 | Pending |
| VIDEO-02 | Phase 13 | Pending |
| VIDEO-03 | Phase 13 | Pending |
| VIDEO-04 | Phase 13 | Pending |
| VIDEO-05 | Phase 13 | Pending |
| VIDEO-06 | Phase 13 | Pending |
| VIDEO-07 | Phase 13 | Pending |
| VIDEO-08 | Phase 13 | Pending |
| BUILD-01 | Phase 13 | Pending |
| BUILD-02 | Phase 13 | Pending |
| BUILD-03 | Phase 13 | Pending |
| BUILD-04 | Phase 13 | Pending |
| BUILD-05 | Phase 13 | Pending |

**Coverage:**
- v2.1 requirements: 51 total (5 NAV + 10 RAG + 8 VIDEO + 10 CLI + 6 CLEAN + 7 README + 5 BUILD)
- Mapped to phases: 51/51 (100%)
- Unmapped: 0

**Note:** BUILD requirements (BUILD-01 to BUILD-05) are mapped to all 4 phases as verification steps after each phase completes.

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-23 after Phase 12 completion (51/51 requirements complete - 2 phases remain)*
