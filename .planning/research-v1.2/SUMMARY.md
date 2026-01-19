# Research Summary: Austria MCP Comprehensive Documentation (v1.2)

**Domain:** Technical Documentation for MCP Server and Developer Tools
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH (3 of 4 research files complete, PITFALLS.md missing)

## Executive Summary

The Austria MCP v1.2 documentation rebuild focuses on adding comprehensive content to an already solid Fumadocs foundation established in v1.1. This is not a greenfield project but a content expansion effort with targeted tooling additions.

**Key findings:**
- The existing Fumadocs stack (v16.4.7) is production-ready and requires no upgrades
- The primary challenge is extracting 25 Python tool docstrings into Fumadocs-compatible MDX
- Documentation must serve dual audiences: workflow-oriented data analysts and reference-seeking developers
- A custom Python AST parser is recommended over third-party tools for docstring extraction due to FastMCP-specific metadata requirements

**Recommended approach:**
Build a lightweight Python-to-MDX pipeline using stdlib `ast` module to extract tool metadata from `mcp/app/tools/*.py`, generate Fumadocs MDX with TypeTable/Accordion components, and integrate into the existing two-workspace architecture. Use progressive disclosure patterns (Basic/Advanced tabs) to serve both analyst and developer needs. Add targeted screenshots of Claude Desktop integration to prove MCP functionality.

**Key risks and mitigations:**
- **Risk:** Custom parser maintenance burden → **Mitigation:** Keep parser under 300 lines, focus on docstring extraction only
- **Risk:** Docs drift from code → **Mitigation:** Auto-generate tool reference from source, run on pre-commit hook
- **Risk:** Overwhelming 25-tool API reference → **Mitigation:** Use Accordions for scannable collapsed view, group by category

## Key Findings

### From STACK.md

**Core Technologies (Already Installed):**
- **fumadocs-core 16.4.7** - Search, navigation, i18n (no upgrade needed)
- **fumadocs-ui 16.4.7** - UI components including Tabs, Accordions, TypeTable (already configured)
- **fumadocs-mdx 14.2.6** - MDX processing (current)
- **next 16.1.3** - Framework with OG image generation (current)
- **mermaid 11.12.2** - Diagram generation (already installed)

**New Dependencies for v1.2:**
- **sharp 0.33.5+** - Image optimization for screenshots (WebP generation, compression)
- **@playwright/test 1.50.0+** - Optional screenshot automation for web content (Claude Desktop requires manual screenshots)
- **tsx 4.19.0+** - TypeScript script execution (verify if already installed)

**Python Docstring Extraction Approach:**
- **Option 1 (Recommended):** Custom AST parser using Python stdlib `ast` + `inspect` modules
  - Zero new Python dependencies
  - Full control over MDX output format
  - Extracts FastMCP decorator metadata and Pydantic Field constraints
  - Outputs Fumadocs-specific components (TypeTable, Accordion)
- **Option 2 (Fallback):** griffe + jinja2 templates
  - Mature Python API documentation extractor
  - Template-based MDX generation
  - May not extract FastMCP-specific annotations

**Build Pipeline:**
```json
{
  "scripts": {
    "generate:api": "tsx scripts/generate-api-docs.ts",
    "optimize:images": "tsx scripts/optimize-images.ts",
    "prebuild": "npm run generate:api && npm run optimize:images",
    "build": "next build",
    "dev": "npm run generate:api && next dev"
  }
}
```

**Screenshot Strategy:**
- **Automated (Playwright):** For web-based demo pages
- **Manual (Shottr/Windows Snagit):** For Claude Desktop (Electron app, not web-accessible)
- Store originals in `docs/public/screenshots/originals/` (gitignored), optimized WebP in `docs/public/screenshots/`

**Critical insight:** No Fumadocs upgrades needed. This is a content generation challenge, not an infrastructure upgrade.

### From FEATURES.md

**Table Stakes (Must Have):**
- Clear 7-section navigation hierarchy
- Full-text search (Fumadocs built-in)
- In-page table of contents for long reference pages
- Accurate code examples with syntax highlighting (Shiki)
- Complete API reference for all 25 tools with parameter tables
- Quickstart guide under 5 minutes
- Installation instructions with troubleshooting
- Working examples (copy-paste ready)

**Differentiators (Set Apart):**
- **Progressive disclosure:** Basic/Advanced tabs throughout guides
- **Dual-audience optimization:** Analyst-focused workflows + developer-focused reference
- **Task-oriented workflows:** Document by use case ("Find health data") not by tool
- **Auto-generated API docs:** Tool docstrings → MDX ensures docs stay in sync
- **Real Claude Desktop screenshots:** Prove MCP integration works (5-7 key workflows)
- **Accordions for tool reference:** Collapse 25 tools into scannable list
- **End-to-end workflow walkthroughs:** Complete scenarios from question → data → insight
- **Quality interpretation guide:** Explain DQV metrics, how to act on scores

**Anti-Features (Explicitly Avoid):**
- **Video tutorials** - High production cost, become outdated quickly, not searchable
- **Interactive playground** - Complex infrastructure, security concerns, MCP not designed for web contexts
- **OpenAPI specification** - MCP uses JSON-RPC over stdio, not REST (would confuse users)
- **Comprehensive changelog** - This is v1.2; GitHub releases sufficient for version history
- **PDF export** - Web-first navigation doesn't translate to PDF, outdated immediately
- **Inline comments/forum** - Maintenance burden, GitHub Discussions already exists

**Feature Dependencies:**
1. **Foundation Layer:** Navigation hierarchy, search, syntax highlighting
2. **Content Layer:** Getting Started, API Reference, Guides
3. **Enhancement Layer:** Progressive disclosure, interactive components, performance guidance
4. **Deferred (v1.3+):** German translation, language switcher

**Audience-Specific Needs:**
- **Data Analysts:** Screenshots, workflow walkthroughs, Basic tab content, error messages in plain language, quality metrics interpretation
- **Developers:** Complete type information, Advanced tab content, architecture diagrams, integration examples, performance optimization
- **Both:** Quickstart, search, API reference, troubleshooting

**Critical insight:** Documentation serves two distinct audiences with different entry points but shared reference content. Progressive disclosure via tabs is essential.

### From ARCHITECTURE.md

**Recommended Architecture:**
```
Documentation Hub (Single unified site)
├── Getting Started (Tutorials)
├── Guides (How-to, task-oriented)
├── Workflows (How-to, end-to-end scenarios)
├── Tools Reference (AUTO-GENERATED from Python)
├── API Reference (Reference, developer-focused)
├── Integration (How-to + Explanation)
└── Best Practices (Explanation)
```

**Key Architectural Patterns:**

1. **Two-Workspace Pattern:**
   - **Manual Workspace:** Hand-written guides, tutorials, explanations (`/docs/getting-started/`, `/docs/guides/`)
   - **Generated Workspace:** Auto-generated API reference from TypeScript/Python source
   - Merge at load time via `fumadocs-mdx/loader.multiple()`
   - **Benefits:** Generated content rebuilds independently, clear ownership, stable manual content

2. **Diataxis Quadrant Mapping:**
   - **Tutorials** → Getting Started (learning-oriented, guaranteed success)
   - **How-to Guides** → Guides + Workflows (problem-solving, goal-oriented)
   - **Reference** → Tools + API Reference (information-seeking, accurate, complete)
   - **Explanation** → Best Practices + Architecture (understanding-oriented, context)

3. **Progressive Disclosure (Onion Model):**
   - **Layer 1:** Quick Start (5 min)
   - **Layer 2:** Common Tasks (30 min)
   - **Layer 3:** Complete Scenarios (2 hours)
   - **Layer 4:** Deep Reference (as needed)
   - **Layer 5:** Expert Context (as needed)

4. **Task-First Navigation (Stripe Pattern):**
   - Organize by user task ("Search for quality metrics") not system structure ("searchResources tool")
   - Primary navigation task-oriented, secondary navigation reference-oriented

5. **Auto-Generation Boundaries:**
   - **Generate:** Tool definitions, parameter descriptions, type definitions, example calls
   - **Manual:** Conceptual overviews, task-oriented guides, workflow examples, architecture explanations

**Component Boundaries:**
- **Navigation Layer:** Global nav, breadcrumbs, sidebar (Fumadocs UI)
- **Content Layer:** Render MDX, manage frontmatter (Next.js App Router + fumadocs-mdx)
- **Search Layer:** Index content, search interface (Orama built-in)
- **Generation Layer:** Auto-generate API reference (fumadocs-typescript / custom Python parser)
- **Metadata Layer:** Page metadata, OG images (Fumadocs frontmatter + Next.js)

**Build Order Dependencies:**
1. **Phase 1:** Foundation (navigation structure, landing page)
2. **Phase 2:** Getting Started (intro, installation, first query)
3. **Phase 3:** Guides (task-oriented pages)
4. **Phase 4:** Tools Reference (AUTO-GENERATED, needs JSDoc/docstrings ready)
5. **Phase 5:** Workflows (depends on Guides + Tools for cross-linking)
6. **Phase 6:** API Reference (architecture, protocol, types)
7. **Phase 7:** Integration + Best Practices (expert content)

**Anti-Patterns to Avoid:**
- **Mixing content types** in same section (tutorials + reference in one folder)
- **Deep nesting** (>3 levels in URL paths)
- **Auto-generated content without curation** (no overview pages)
- **No search or poor search** (Fumadocs provides built-in, must configure properly)
- **Orphaned pages** (MDX files not in meta.json)

**Critical insight:** Dual-audience navigation requires separating workflow-focused primary sidebar from reference-focused secondary navigation. MCP official docs pattern (Documentation vs Specification trees) is instructive here.

### From PITFALLS.md

**STATUS: MISSING**

The PITFALLS.md research file was not generated by the parallel researcher agent. This represents a gap in the research synthesis.

**Expected content:**
- Critical/moderate/minor pitfalls for documentation development
- Phase-specific warnings
- Common mistakes in MCP documentation
- Prevention strategies

**Impact on synthesis:**
Without pitfalls research, the roadmap will lack:
- Risk mitigation strategies
- Phase-specific warnings
- Common failure modes

**Recommendation:** Flag Phase 4 (Auto-Generated Tools Reference) for additional research focused on pitfalls of Python docstring extraction and MDX generation.

## Implications for Roadmap

### Suggested Phase Structure

Based on architectural dependencies and feature priorities, v1.2 should be structured as follows:

#### Phase 1: Documentation Foundation
**Rationale:** Establish navigation skeleton and two-workspace architecture before content creation.

**Delivers:**
- Root `meta.json` with 7-section hierarchy
- Two-workspace loader configuration (`multiple()`)
- Landing page (index.mdx)
- Search configuration
- Build pipeline setup

**Features from FEATURES.md:**
- Clear hierarchy
- Search functionality

**Avoid:** None specific

**Research flag:** Low priority, Fumadocs setup well-documented

---

#### Phase 2: Getting Started Content
**Rationale:** Highest ROI content for new users; validates information architecture early.

**Delivers:**
- Introduction ("What is Austria MCP?")
- Installation guide (Claude Desktop + self-hosted)
- First successful query tutorial
- Troubleshooting section

**Features from FEATURES.md:**
- Quickstart guide (<5 min)
- Installation instructions
- First successful query
- Troubleshooting

**Avoid:** Video tutorials (anti-feature)

**Research flag:** None needed, standard tutorial patterns

---

#### Phase 3: Guides Content
**Rationale:** Most frequently used content type; informs what tools need documentation.

**Delivers:**
- Task-oriented guides:
  - Searching datasets
  - Using quality metrics
  - Previewing data samples
  - Filtering and pagination
  - Analyzing field distributions
- Feature-specific guides:
  - Vocabulary expansion
  - Related dataset discovery
  - Quality interpretation
- Configuration guides

**Features from FEATURES.md:**
- Task-oriented workflows
- Progressive disclosure (Basic/Advanced tabs)
- Code examples with syntax highlighting
- Error handling examples

**Avoid:** Mixing content types (keep guides separate from reference)

**Research flag:** None needed, standard how-to patterns

---

#### Phase 4: Auto-Generated Tools Reference
**Rationale:** Core differentiator; ensures docs stay in sync with code; needed for Phase 5 cross-linking.

**Delivers:**
- Python AST parser script (`scripts/extract_docstrings.py`)
- Node.js orchestration script (`scripts/generate-api-docs.ts`)
- 25 tool reference pages (AUTO-GENERATED):
  - Discovery tools (8 tools)
  - Analysis tools (3 tools)
  - Preview tools (2 tools)
  - Vocabulary tools (5 tools)
  - Management tools (7 tools)
- Accordion-based collapsible layout
- TypeTable parameter documentation

**Features from FEATURES.md:**
- Complete API reference (25 tools)
- Parameter tables
- Auto-generated tool docs
- Accordions for tool reference

**Avoid:** Auto-generated content without curation (add manual overview pages per category)

**Research flag:** HIGH PRIORITY
- Custom AST parser implementation for FastMCP decorators
- Pydantic Field constraint extraction
- MDX generation with Fumadocs components
- Build pipeline integration

---

#### Phase 5: Workflows Content
**Rationale:** Demonstrates complete use cases; depends on Guides + Tools for cross-linking.

**Delivers:**
- End-to-end workflow walkthroughs:
  1. Discover health datasets → analyze quality → preview samples
  2. Search with filters → expand vocabulary → find related datasets
  3. Quality assessment workflow
  4. Data preview workflow (CSV vs JSON)
  5. Semantic search workflow
  6. Dataset comparison workflow
  7. Error recovery workflow
- Real Claude Desktop screenshots (5-7 key workflows)

**Features from FEATURES.md:**
- End-to-end workflow walkthroughs
- Real Claude Desktop screenshots
- Comparison tables (when to use X vs Y)

**Avoid:** Interactive playground (anti-feature)

**Research flag:** None needed, standard scenario documentation

---

#### Phase 6: API Reference
**Rationale:** Deep technical content for developers/integrators; lower priority than user-facing guides.

**Delivers:**
- Architecture overview (middleware, client, models layers)
- Protocol details (MCP JSON-RPC over stdio)
- Type definitions (auto-generated from TypeScript)
- Extension points (FastMCP patterns)
- Architecture diagrams (Mermaid)

**Features from FEATURES.md:**
- Architecture diagrams
- Type information
- Integration examples (FastMCP patterns)
- Architecture deep-dive

**Avoid:** OpenAPI specification (anti-feature, MCP uses JSON-RPC not REST)

**Research flag:** Medium priority
- MCP protocol documentation patterns
- Type definition generation from JSON Schema
- Version management for protocol docs

---

#### Phase 7: Integration & Best Practices
**Rationale:** Expert content for advanced users; deferred until core docs proven.

**Delivers:**
- Integration guides:
  - Custom client setup
  - Extension patterns
  - Self-hosted deployment
- Best Practices:
  - Performance optimization (query patterns, caching)
  - Production deployment (environment config, monitoring)
  - Quality metric interpretation guide
  - Common pitfalls (NEEDS PITFALLS.md RESEARCH)

**Features from FEATURES.md:**
- Performance guidance
- Quality interpretation guide
- Testing patterns

**Avoid:** None specific

**Research flag:** Medium priority
- Common pitfalls documentation (MISSING PITFALLS.md)
- Performance optimization patterns for MCP servers

---

#### Phase 8: Visual Assets (Parallel to Phases 2-7)
**Rationale:** Screenshots and diagrams created alongside content, optimized before build.

**Delivers:**
- Manual Claude Desktop screenshots (5-7 workflows)
- Mermaid workflow diagrams (embedded in MDX)
- Architecture diagrams
- Image optimization pipeline (Sharp)

**Features from FEATURES.md:**
- Real Claude Desktop screenshots
- Workflow diagrams
- Architecture diagrams

**Avoid:** Video tutorials (anti-feature)

**Research flag:** None needed, tools already specified

---

### Deferred to v1.3+

- German translation
- Language switcher
- Bilingual support (high complexity)

### Phase Grouping

**Critical Path (Must Complete for MVP):**
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

**Can Develop in Parallel (After Phase 3):**
- Phase 4 (Tools Reference)
- Phase 6 (API Reference)
- Phase 8 (Visual Assets)

**Defer to Post-Launch:**
- Phase 7 (Integration & Best Practices) - can release without this
- v1.3 (German translation)

### Research Flags Summary

| Phase | Needs Research | Reason |
|-------|----------------|--------|
| Phase 1 | No | Fumadocs setup well-documented |
| Phase 2 | No | Standard tutorial patterns |
| Phase 3 | No | Standard how-to patterns |
| Phase 4 | **YES - HIGH PRIORITY** | Custom Python AST parser for FastMCP tools |
| Phase 5 | No | Standard scenario documentation |
| Phase 6 | **YES - MEDIUM PRIORITY** | MCP protocol documentation patterns |
| Phase 7 | **YES - MEDIUM PRIORITY** | Missing PITFALLS.md research |
| Phase 8 | No | Tools already specified |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | All packages verified in current codebase, versions confirmed, no upgrades needed |
| **Features** | HIGH | Based on Fumadocs official docs, MCP patterns, Stripe UX patterns |
| **Architecture** | HIGH | Diataxis framework established, two-workspace pattern validated in codebase, MCP official docs inspected |
| **Pitfalls** | **LOW** | PITFALLS.md research file missing, no systematic pitfall analysis |
| **Overall** | **MEDIUM-HIGH** | Strong foundation in stack/features/architecture, weak on risk mitigation |

### Gaps to Address

1. **MISSING: PITFALLS.md research**
   - Impact: Roadmap lacks risk mitigation strategies
   - Recommendation: Flag Phase 4 and Phase 7 for additional pitfall research
   - Workaround: Rely on general best practices for documentation generation

2. **Untested: Python AST parser for FastMCP decorators**
   - Impact: Phase 4 implementation complexity unknown
   - Recommendation: Prototype parser in Phase 4 planning before committing to full implementation
   - Mitigation: Fallback to griffe + templates if custom parser proves complex

3. **Unvalidated: Screenshot automation for Claude Desktop**
   - Impact: Manual screenshot workflow confirmed, but effort unknown
   - Recommendation: Budget time for manual screenshot capture in Phase 8
   - Mitigation: Start with 3-5 key screenshots, expand later

4. **Unclear: Optimal page count per section**
   - Impact: Navigation may become cluttered if sections too large
   - Recommendation: Use Accordions and folding sections to manage density
   - Mitigation: Start with flat structure, refactor if navigation overwhelming

## Sources

### HIGH Confidence (Verified)

**Stack Research:**
- Python `ast` module: https://docs.python.org/3/library/ast.html
- Python `inspect` module: https://docs.python.org/3/library/inspect.html
- Playwright Screenshots: https://playwright.dev/docs/screenshots
- Sharp GitHub: https://github.com/lovell/sharp
- Mermaid: https://mermaid.js.org/intro/
- Current `docs/package.json`: Analyzed existing versions
- Current `docs/mdx-components.tsx`: Verified installed components

**Features Research:**
- Fumadocs components: https://www.fumadocs.dev/docs/ui/components
- Fumadocs MDX features: https://www.fumadocs.dev/docs/mdx
- MCP official documentation: https://modelcontextprotocol.io/docs

**Architecture Research:**
- Diataxis framework: https://diataxis.fr/
- MCP official docs navigation: https://modelcontextprotocol.io/docs (dual-audience pattern inspected)
- Fumadocs documentation: https://fumadocs.dev/docs
- Current project codebase: `docs/source.config.ts`, `docs/meta.json` (two-workspace pattern validated)

### MEDIUM Confidence

**Features Research:**
- Stripe API documentation patterns (observed via web inspection, not official guidance)
- Developer documentation best practices (WebSearch aggregation)

**Architecture Research:**
- fumadocs-typescript configuration for MCP tools (documented but not tested in this context)
- Optimal navigation structure (inferred from project requirements, not empirically validated)

### Gaps Requiring Validation

**Stack:**
- FastMCP decorator metadata extraction (may need to inspect FastMCP source)
- Pydantic Field constraint serialization in AST (`Annotated[int, Field(ge=1)]` patterns)

**Features:**
- Screenshot production effort estimation (manual workflow confirmed but time unknown)
- Search ranking tuning for dual-audience content

**Architecture:**
- Build order dependencies (logical but not empirically validated)
- Scalability thresholds (50 pages vs 200 pages behavior)

## Ready for Requirements

This research summary synthesizes findings from STACK.md, FEATURES.md, and ARCHITECTURE.md into a cohesive roadmap foundation. The primary gap is the missing PITFALLS.md research, which should be addressed during Phase 4 and Phase 7 planning.

**Next steps for orchestrator:**
1. Proceed to requirements definition using this summary
2. Flag Phase 4 for additional research on Python AST parser implementation
3. Flag Phase 7 for pitfall research (create PITFALLS.md retroactively if needed)
4. Use suggested phase structure as roadmap skeleton
5. Validate auto-generation approach with technical lead before committing to Phase 4

**Confidence statement:**
With 3 of 4 research files complete, we have HIGH confidence in technology choices, feature priorities, and architectural patterns. We have MEDIUM confidence in implementation details for auto-generation tooling. We have LOW confidence in risk mitigation due to missing PITFALLS.md. Overall assessment: **Proceed with roadmap planning, but treat Phase 4 (Auto-Generated Tools) as higher-risk requiring validation.**
