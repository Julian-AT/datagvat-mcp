# Feature Landscape: MCP Server & Developer Tool Documentation

**Domain:** Technical documentation for MCP servers and developer tools
**Researched:** 2026-01-19
**Confidence:** HIGH (verified with Fumadocs, MCP official docs, Stripe patterns)

## Executive Summary

Documentation for MCP servers serves two distinct audiences with overlapping but different needs:

1. **Data Analysts** (task-oriented, practical): Need workflow walkthroughs, real-world examples, visual guidance, and clear step-by-step instructions
2. **Developers** (reference-oriented, technical): Need API precision, type information, integration patterns, and architectural context

The Austria MCP project must balance both. Table stakes features ensure basic usability; differentiators create exceptional documentation that sets this project apart from typical MCP server docs.

## Table Stakes

Features users expect. Missing any = documentation feels incomplete or unprofessional.

### Navigation & Discovery

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| **Clear hierarchy** (7 sections) | Users need predictable information architecture | Low | P0 |
| **Search functionality** | Standard in all technical docs; users won't browse 60-80 pages linearly | Low (Fumadocs built-in) | P0 |
| **Table of contents** (in-page TOC) | Essential for long reference pages (API docs, tool lists) | Low (Fumadocs built-in) | P0 |
| **Breadcrumbs** | Users need location awareness in deep hierarchies | Low (Fumadocs built-in) | P1 |
| **Previous/Next navigation** | Linear reading flow for tutorials and guides | Low (Fumadocs built-in) | P1 |

### Content Quality

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| **Accurate code examples** | Incorrect examples destroy trust; users copy-paste | Medium | P0 |
| **Syntax highlighting** | Readability for multi-language code (Python, TypeScript, JSON, bash) | Low (Fumadocs Shiki) | P0 |
| **Type information** | Developers expect parameter types, return types, constraints | Medium | P0 |
| **Error handling** | Real-world usage includes failures; show how to handle them | Medium | P1 |
| **Working examples** | Snippets must be runnable without modification | Medium | P0 |

### Reference Documentation

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| **Complete API reference** | All 25 tools documented with parameters, returns, examples | Medium | P0 |
| **Parameter tables** | Structured display of types, defaults, constraints | Low (TypeTable component) | P0 |
| **Return value schemas** | JSON structure examples for API responses | Low | P0 |
| **Links between related tools** | Cross-references (e.g., search_datasets → get_dataset) | Low | P1 |

### Getting Started

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| **Quickstart guide** (<5 min) | Users want immediate "does this work?" validation | Low | P0 |
| **Installation instructions** | Step-by-step setup (Claude Desktop, self-hosted) | Low | P0 |
| **First successful query** | "Hello world" equivalent for MCP servers | Low | P0 |
| **Troubleshooting** | Common setup issues with solutions | Medium | P0 |

### Visual Aids

| Feature | Why Expected | Complexity | Priority |
|---------|--------------|------------|----------|
| **Architecture diagrams** | System overview for developers | Low (Mermaid or ASCII) | P1 |
| **Workflow diagrams** | Visual representation of multi-step processes | Low (Mermaid or Steps component) | P1 |
| **Screenshots** (selective) | Prove the tool works; show UI states analysts will see | Medium | P1 |

## Differentiators

Features that set Austria MCP documentation apart. Not expected, but highly valued. These create "best in class" documentation.

### Dual-Audience Optimization

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| **Progressive disclosure (Basic/Advanced tabs)** | Analysts see simplified workflows; developers drill into edge cases | Low (Fumadocs Tabs) | P0 |
| **Role-based entry points** | Landing pages optimized for "I'm a data analyst" vs "I'm a developer" | Low | P1 |
| **Task-oriented workflows** | Document by use case ("Find health data for research") not by tool | Medium | P0 |
| **Contextual examples** | Same tool shown in analyst context (Claude Desktop) and developer context (Python SDK) | Medium | P1 |

### Interactive Components

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| **Live code examples** | Editable snippets (if feasible with MCP constraints) | High | P2 |
| **Accordions for tool reference** | Collapse 25 tools into scannable list; expand for details | Low (Fumadocs Accordion) | P0 |
| **Tabs for multi-format examples** | Show CSV vs JSON workflows side-by-side | Low (Fumadocs Tabs) | P0 |
| **Collapsible sections** | Long API responses hidden by default; expand on demand | Low | P1 |

### Content Excellence

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| **Real Claude Desktop screenshots** | Proves MCP integration works; shows actual UI behavior | Medium | P0 |
| **End-to-end workflow walkthroughs** | Complete scenarios from question → data → insight | Medium | P0 |
| **Quality interpretation guide** | Explain what DQV metrics mean; how to act on quality scores | Medium | P1 |
| **Comparison tables** | When to use semantic_search vs search_datasets; CSV vs JSON preview | Low | P1 |
| **Performance guidance** | Query optimization tips; when to use filters vs pagination | Medium | P1 |

### Developer Experience

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| **Auto-generated API docs** | Tool docstrings → MDX; ensures docs stay in sync with code | High | P0 |
| **Type definitions** (TypeScript/Python) | Downloadable types for IDE integration | Medium | P1 |
| **Integration examples** | Show FastMCP patterns; custom client examples | Medium | P1 |
| **Architecture deep-dive** | Explain middleware, client, models layers | Low | P1 |
| **Testing patterns** | How to test MCP tools; mock patterns | Medium | P2 |

### Bilingual Support (Deferred to v1.3)

| Feature | Value Proposition | Complexity | Priority |
|---------|-------------------|------------|----------|
| **German translation** | Austrian users expect German; data.gv.at is German-primary | High | v1.3 |
| **Language switcher** | Toggle EN/DE without losing page context | Medium | v1.3 |

## Anti-Features

Features to explicitly NOT build. Common mistakes that bloat documentation without adding value.

### Anti-Feature 1: Video Tutorials

**What:** Embedded video walkthroughs of MCP setup and usage
**Why avoid:**
- High production cost (filming, editing, hosting)
- Becomes outdated quickly (UI changes, version updates)
- Not searchable; poor for quick reference
- Accessibility issues (captions, transcripts)
- Screenshots + text are faster to scan and update

**What to do instead:**
- Use screenshots for key UI states
- Write step-by-step text instructions
- Use Fumadocs Steps component for sequential workflows

### Anti-Feature 2: Interactive Playground

**What:** In-browser MCP query executor
**Why avoid:**
- Complex infrastructure (backend proxy, auth, rate limiting)
- Security concerns (arbitrary queries to data.gv.at)
- MCP protocol not designed for web contexts (needs stdio/HTTP transport)
- Maintenance burden (keep playground in sync with server)
- Marginal value: users already have Claude Desktop

**What to do instead:**
- Focus on making Claude Desktop setup trivial
- Show expected outputs in documentation
- Use collapsible sections for large API responses

### Anti-Feature 3: OpenAPI Specification

**What:** Auto-generated OpenAPI 3.x spec for MCP tools
**Why avoid:**
- MCP uses JSON-RPC over stdio, not REST
- OpenAPI implies HTTP API; confuses users about protocol
- MCP protocol already has JSON Schema for tool definitions
- Fumadocs OpenAPI integration is for REST APIs

**What to do instead:**
- Document MCP protocol accurately (JSON-RPC)
- Show raw MCP tool schemas (JSON Schema)
- Focus on FastMCP patterns, not REST patterns

### Anti-Feature 4: Comprehensive Change Log

**What:** Detailed version-by-version changelog of every parameter change
**Why avoid:**
- This is v1.2; change log only matters post-v1.0 stabilization
- GitHub releases + git commits already track changes
- Docs should reflect current version, not history

**What to do instead:**
- Single "What's New" section highlighting v1.2 features
- Link to GitHub releases for detailed version history
- Focus docs on current behavior, not deprecated features

### Anti-Feature 5: PDF Export

**What:** Generate PDF from documentation
**Why avoid:**
- Web-first navigation (search, links, tabs) doesn't translate to PDF
- PDFs become outdated immediately after generation
- Modern users prefer web docs (mobile-friendly, searchable)
- Fumadocs already optimized for web reading

**What to do instead:**
- Optimize for web reading (responsive, fast, searchable)
- Ensure docs are indexable by search engines
- Use print-friendly CSS if printing is truly needed

### Anti-Feature 6: Inline Comments / Forum

**What:** Per-page comment threads or discussion forum
**Why avoid:**
- Maintenance burden (moderation, spam, outdated questions)
- GitHub Discussions already exists for Q&A
- Comments become outdated as docs evolve
- Fragmented support (docs + comments + GitHub issues)

**What to do instead:**
- GitHub Discussions for community questions
- GitHub Issues for doc bugs/improvements
- Link to community resources at bottom of pages

## Feature Dependencies

```
Foundation Layer (must exist first):
├── Clear hierarchy (7 sections)
├── Search functionality
└── Syntax highlighting

Content Layer (depends on foundation):
├── Getting Started
│   ├── Quickstart guide
│   ├── Installation instructions
│   └── First successful query
├── API Reference
│   ├── Auto-generated tool docs
│   ├── Parameter tables (TypeTable)
│   └── Return value schemas
└── Guides
    ├── Task-oriented workflows
    ├── Real screenshots
    └── End-to-end examples

Enhancement Layer (depends on content):
├── Progressive disclosure (Basic/Advanced tabs)
├── Interactive components (Accordions, Tabs)
├── Performance guidance
└── Quality interpretation

Deferred (v1.3+):
└── German translation
```

## MVP Recommendation

For v1.2 Documentation Rebuild, prioritize:

### Must Have (P0)

**Table Stakes:**
1. Clear 7-section hierarchy with navigation
2. Search (Fumadocs built-in)
3. In-page TOC for long pages
4. Accurate code examples with syntax highlighting
5. Complete API reference (25 tools)
6. Parameter tables (TypeTable component)
7. Quickstart guide + installation + troubleshooting

**Differentiators:**
8. Progressive disclosure (Basic/Advanced tabs throughout)
9. Real Claude Desktop screenshots (5-7 key workflows)
10. End-to-end workflow walkthroughs (7 workflows section)
11. Auto-generated tool reference from docstrings
12. Accordions for tool reference (scannable + collapsible)

### Should Have (P1)

13. Breadcrumbs and Previous/Next navigation
14. Architecture diagrams (Mermaid)
15. Workflow diagrams (Steps component)
16. Error handling examples
17. Links between related tools
18. Comparison tables (when to use X vs Y)
19. Quality interpretation guide
20. Performance guidance
21. Integration examples (FastMCP patterns)
22. Architecture deep-dive

### Could Have (P2)

23. Live code examples (if feasible)
24. Testing patterns
25. Type definitions download

### Defer to v1.3+

26. German translation
27. Language switcher

## Audience-Specific Features

### Data Analysts Need

| Feature | Why |
|---------|-----|
| Screenshots | Visual proof the tool works; reduces setup anxiety |
| Workflow walkthroughs | Task-oriented ("How do I find X?") not tool-oriented |
| Basic tab content | Simplified examples without edge cases |
| Error messages explained | Non-technical language for common failures |
| Quality metrics interpretation | What does "completeness: 0.85" mean? What should I do? |

### Developers Need

| Feature | Why |
|---------|-----|
| Complete type information | IDE autocomplete, type safety |
| Advanced tab content | Edge cases, rate limits, error handling |
| Architecture diagrams | System design, component boundaries |
| Integration examples | How to embed in custom apps |
| Performance optimization | Query patterns, caching strategies |
| FastMCP internals | Middleware, dependency injection patterns |

### Both Audiences Need

| Feature | Why |
|---------|-----|
| Quickstart | Immediate validation that setup works |
| Search | Fast answers without browsing |
| API reference | Authoritative parameter/return documentation |
| Troubleshooting | Common problems with solutions |

## Implementation Notes

### Auto-Generation Strategy

**Python docstrings → MDX:**
- Extract tool metadata from `@mcp.tool()` decorators
- Parse Google-style docstrings (Args, Returns, Raises)
- Generate MDX with:
  - TypeTable for parameters
  - JSON schemas for returns
  - Real usage examples (manually curated, inserted into template)
- Script: `scripts/generate-tool-docs.ts`
- Run on pre-commit hook to keep docs in sync

**Why auto-generation:**
- Single source of truth (code)
- Docs can't drift from implementation
- Reduces manual sync burden
- Enforces consistent structure across 25 tools

### Screenshot Guidelines

**When to screenshot:**
- Claude Desktop MCP tool invocation
- Tool result display (formatted output)
- Setup UI (MCP configuration screen)
- Error states (common failures)

**When NOT to screenshot:**
- Code examples (use text with syntax highlighting)
- API JSON responses (use collapsible code blocks)
- Repetitive UI states (one example suffices)

**Production:**
- Real data from data.gv.at (not mock data)
- Consistent window size (1280x800)
- Highlight relevant UI elements (arrows, boxes)
- Alt text for accessibility

### Progressive Disclosure Pattern

**Use Tabs for:**
- Basic vs Advanced examples
- Different formats (CSV vs JSON)
- Different environments (Claude Desktop vs custom client)
- Different languages (Python vs TypeScript, defer to v1.3)

**Example structure:**
```mdx
<Tabs items={['Basic', 'Advanced']}>
  <Tab value="Basic">
    # Simple query for analysts
    search_datasets(query="health")
  </Tab>
  <Tab value="Advanced">
    # Complex query with all filters
    search_datasets(
      query="health~",
      themes=["HEAL", "SOCI"],
      boost_quality=True,
      min_date="2024-01-01"
    )
  </Tab>
</Tabs>
```

### Accordion Usage

**Use Accordions for:**
- Tool reference (25 tools in single page, expandable)
- FAQ sections
- Long API response examples
- Supplementary information (advanced topics)

**Don't use Accordions for:**
- Primary content (should be visible by default)
- Navigation (use sidebar/TOC)
- Critical warnings (must be visible)

## Success Metrics

Documentation is excellent when:

1. **Analysts can complete first query in <5 minutes** (Quickstart test)
2. **Search finds relevant pages in top 3 results** (Search quality)
3. **API reference has 100% parameter coverage** (Completeness)
4. **Code examples are copy-paste ready** (Accuracy)
5. **Screenshots show real Claude Desktop integration** (Authenticity)
6. **Workflow walkthroughs cover 80% of use cases** (Coverage)
7. **No broken internal links** (Quality check)
8. **Mobile-readable** (Responsive design)

## Sources

**HIGH Confidence (Official Documentation):**
- Fumadocs components: https://www.fumadocs.dev/docs/ui/components
- Fumadocs MDX features: https://www.fumadocs.dev/docs/mdx
- MCP official documentation structure: https://modelcontextprotocol.io/docs

**MEDIUM Confidence (Industry Patterns):**
- Stripe API documentation UX patterns (predictable URLs, form-encoded requests, test mode, versioning)
- Developer documentation best practices (search, TOC, syntax highlighting, type information)

**Notes:**
- WebSearch queries returned limited specific results; relied on Fumadocs official docs and MCP docs for authoritative patterns
- Screenshot guidelines and progressive disclosure patterns based on established UX practices
- Anti-features identified from common documentation bloat patterns in open-source projects
