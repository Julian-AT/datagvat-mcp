# Requirements: Austria MCP

**Defined:** 2026-01-20
**Core Value:** Smart, relevant dataset discovery — users ask natural questions and get the right datasets, with quality insights and immediate data access.

## v2.0 Requirements

Requirements for v2.0 Professional Documentation System. Detailed specifications provided during phase planning.

### Infrastructure

- [x] **INFRA-01**: Build system uses Bun for faster package management and execution
- [x] **INFRA-02**: Code quality enforced with Biome (linter + formatter)
- [x] **INFRA-03**: Professional build scripts for development and production workflows
- [x] **INFRA-04**: GitHub Actions CI/CD pipeline runs on all commits
- [x] **INFRA-05**: Pre-commit hooks prevent committing broken code

### Navigation

- [ ] **NAV-01**: Documentation organized into 3-4 top-level sections (reduced from 8)
- [ ] **NAV-02**: Advanced meta.json features enable better organization
- [ ] **NAV-03**: Users can find information in ≤3 clicks from homepage
- [ ] **NAV-04**: Navigation structure is consistent across all pages

### Content Quality

- [ ] **CONTENT-01**: All documentation follows Microsoft/Google style guide conventions
- [ ] **CONTENT-02**: All internal links are valid and point to correct locations
- [ ] **CONTENT-03**: All external links are valid and accessible
- [ ] **CONTENT-04**: Code examples are clean (no emojis in comments)
- [ ] **CONTENT-05**: Documentation comments follow professional standards
- [ ] **CONTENT-06**: All pages have consistent tone and structure

### API Documentation

- [ ] **API-01**: OpenAPI specification generated from data.gv.at endpoints
- [ ] **API-02**: API documentation updates automatically from OpenAPI spec
- [ ] **API-03**: API docs include request/response examples
- [ ] **API-04**: API docs integrated into main navigation

### Developer Tools

- [ ] **CLI-01**: shadcn-like CLI tool for installing MCP server
- [ ] **CLI-02**: CLI supports interactive prompts for configuration
- [ ] **CLI-03**: CLI generates proper config files for different AI tools
- [ ] **CLI-04**: CLI includes templates for common use cases

### Testing & Validation

- [ ] **TEST-01**: Live AI assistant testing interface using Vercel AI SDK
- [ ] **TEST-02**: Users can test MCP tools interactively
- [ ] **TEST-03**: Test results show tool outputs in real-time
- [ ] **TEST-04**: Test interface validates configuration is working

## v2.1+ Requirements

Deferred to future releases.

### Localization

- **I18N-01**: Complete German translation of all documentation
- **I18N-02**: Language switcher in navigation

### Visual Content

- **VISUAL-01**: Real Claude Desktop screenshots replacing placeholders
- **VISUAL-02**: Video tutorials for common workflows

## Out of Scope

Explicitly excluded from v2.0. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Interactive MCP playground | Complex, defer to v2.1+ after infrastructure solid |
| Backend API changes | v2.0 focuses on documentation, MCP tools unchanged |
| Mobile-specific layouts | Documentation is desktop-first, responsive sufficient |
| Multi-repo documentation | Single repo maintained, complexity not warranted |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Plans | Status |
|-------------|-------|-------|--------|
| INFRA-01 | Phase 1 | 01-01 to 01-05 | Complete |
| INFRA-02 | Phase 1 | 01-01 to 01-05 | Complete |
| INFRA-03 | Phase 1 | 01-01 to 01-05 | Complete |
| INFRA-04 | Phase 1, Phase 6 | 01-01 to 01-05 | Complete |
| INFRA-05 | Phase 1, Phase 6 | 01-01 to 01-05 | Complete |
| NAV-01 | Phase 2 | 02-01 to 02-03 | Planned |
| NAV-02 | Phase 2 | 02-01 to 02-03 | Planned |
| NAV-03 | Phase 2 | 02-01 to 02-03 | Planned |
| NAV-04 | Phase 2 | 02-01 to 02-03 | Planned |
| CONTENT-02 | Phase 3 | - | Pending |
| CONTENT-03 | Phase 3 | - | Pending |
| CONTENT-01 | Phase 4 | - | Pending |
| CONTENT-05 | Phase 4 | - | Pending |
| CONTENT-06 | Phase 4 | - | Pending |
| CONTENT-04 | Phase 5 | - | Pending |
| API-01 | Phase 7 | - | Pending |
| API-02 | Phase 7 | - | Pending |
| API-03 | Phase 7 | - | Pending |
| API-04 | Phase 7 | - | Pending |
| CLI-01 | Phase 8 | - | Pending |
| CLI-02 | Phase 8 | - | Pending |
| CLI-03 | Phase 8 | - | Pending |
| CLI-04 | Phase 8 | - | Pending |
| TEST-01 | Phase 9 | - | Pending |
| TEST-02 | Phase 9 | - | Pending |
| TEST-03 | Phase 9 | - | Pending |
| TEST-04 | Phase 9 | - | Pending |

**Coverage:**
- v2.0 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0
- Coverage: 100% ✓

**Phase Distribution:**
- Phase 1 (Infrastructure): 5 requirements — COMPLETE
- Phase 2 (Navigation): 4 requirements — PLANNED (3 plans, 2 waves)
- Phase 3 (Links): 2 requirements
- Phase 4 (Documentation): 3 requirements
- Phase 5 (Code Quality): 1 requirement
- Phase 6 (CI/CD Enhancement): 2 requirements (shared with Phase 1)
- Phase 7 (OpenAPI): 4 requirements
- Phase 8 (CLI): 4 requirements
- Phase 9 (AI Assistant): 4 requirements

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-21 after Phase 2 planning*
