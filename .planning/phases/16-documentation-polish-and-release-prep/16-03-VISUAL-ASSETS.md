# Visual Assets Assessment
**Phase:** 16-documentation-polish-and-release-prep
**Plan:** 16-03
**Date:** 2026-01-18

## Assessment Criteria

Visual resources should ONLY be added if they:
1. **Reduce cognitive load** - Make complex concepts easier to understand
2. **Clarify confusion** - Address documented pain points from test report
3. **Guide critical steps** - Help users through error-prone configuration
4. **Add value over text** - Cannot be explained as clearly with words alone

**Principle:** No decorative images. Every visual must have a clear purpose.

## Identified Strategic Opportunities

### 1. Architecture Diagram

**Location:** `docs/content/docs/index.mdx` (home page) - After "What is Austria MCP?" section

**Purpose:** Help users understand system components and how they fit together

**What it should show:**
```
Claude Desktop (MCP Client)
    ↓ (MCP Protocol)
Austria MCP Server
    ├─ FastMCP Framework
    ├─ Middleware Stack
    │   ├─ Logging
    │   ├─ Error Handling
    │   ├─ Retry Logic
    │   ├─ Rate Limiting
    │   ├─ Audit
    │   └─ Auth
    ├─ Tool Categories
    │   ├─ Discovery (search_datasets, list_catalogues)
    │   ├─ Management (create_dataset_draft)
    │   ├─ Analysis (analyze_quality, find_related)
    │   ├─ Vocabularies (list_vocabularies)
    │   └─ Preview (preview_dataset_file)
    └─ Piveau API Client
        ↓ (HTTPS)
Piveau API (data.gv.at)
```

**Why needed:** Test report shows users need to understand:
- Where the server fits in the stack
- What FastMCP does vs custom code
- How middleware layers work
- Connection between tools and API

**Alt text:** "Austria MCP server architecture showing Claude Desktop connecting via MCP protocol to server with FastMCP framework, middleware stack, tool categories, and Piveau API client"

**Priority:** CRITICAL - Core understanding needed for troubleshooting

**Bilingual:** Single diagram works for both EN/DE (technical terms remain English per decision 16-02)

---

### 2. Data Flow Diagram

**Location:** `docs/content/docs/guides/setup.mdx` - After "What is Austria MCP?" callout

**Purpose:** Clarify how data moves through the system during a typical query

**What it should show:**
```
User asks Claude: "Find population datasets"
    ↓
Claude Desktop interprets → calls search_datasets tool
    ↓ (MCP Protocol - stdio)
Austria MCP Server receives request
    ↓ (Middleware processing)
Piveau Client constructs API call
    ↓ (HTTPS GET request)
Piveau API searches data.gv.at catalog
    ↓ (JSON response)
Server processes and enhances results
    ├─ Quality scoring
    ├─ Theme enrichment
    └─ Semantic ranking
    ↓ (MCP response)
Claude Desktop receives structured data
    ↓
Claude presents results to user in natural language
```

**Why needed:** Test report confusion about:
- How queries become API calls
- Where semantic enhancement happens
- Why server is needed (vs direct API access)

**Alt text:** "Data flow from user query through Claude Desktop, MCP protocol, Austria MCP server middleware and processing, to Piveau API and back with enhanced results"

**Priority:** HELPFUL - Clarifies integration, but architecture diagram covers most of this

**Bilingual:** Single diagram with English labels (technical flow)

---

### 3. Configuration Path Diagram

**Location:** `docs/content/docs/guides/setup.mdx` - In "Wrong working directory" troubleshooting section

**Purpose:** Visually show correct vs incorrect directory paths

**What it should show:**
```
Repository structure:
datagvat-mcp/               ❌ cwd="..." (too high)
  ├─ docs/
  ├─ .planning/
  └─ mcp/                   ✅ cwd=".../mcp" (CORRECT)
      ├─ app/               ❌ cwd=".../app" (too low)
      │   ├─ server.py
      │   ├─ client.py
      │   └─ tools/
      ├─ tests/
      ├─ pyproject.toml
      └─ .env
```

**Why needed:** Test report identifies "wrong directory" as MOST COMMON ERROR:
- Users point to repo root (too high)
- Users point to app/ directory (too low)
- Visual hierarchy prevents confusion

**Alt text:** "Directory structure showing correct working directory path must point to mcp/ folder containing app/ subdirectory"

**Priority:** CRITICAL - Prevents #1 setup failure mode

**Bilingual:** Needs German translation (file paths same, labels differ)

---

### 4. Tool Category Breakdown

**Location:** `docs/content/docs/index.mdx` - In "Key Features" section

**Purpose:** Visual overview of tool organization by use case

**What it should show:**
```
Discovery Tools (7)
├─ list_catalogues
├─ search_datasets
├─ get_dataset
└─ list_dataset_distributions

Management Tools (3)
├─ create_dataset_draft
├─ update_dataset
└─ delete_dataset

Analysis Tools (2)
├─ analyze_dataset_quality
└─ find_related_datasets

Vocabulary Tools (2)
├─ list_vocabularies
└─ search_vocabulary_terms

Preview Tools (1)
└─ preview_dataset_file
```

**Why needed:** Current docs list tools in text, but visual tree:
- Shows tool categories at a glance
- Helps users find right tool for task
- Demonstrates breadth of functionality

**Alt text:** "Tool organization showing five categories: Discovery with 7 tools, Management with 3 tools, Analysis with 2 tools, Vocabulary with 2 tools, and Preview with 1 tool"

**Priority:** NICE-TO-HAVE - Improves discoverability but text listing works

**Bilingual:** Separate EN/DE versions (tool names stay English, category labels translate)

---

## Screenshots Assessment

### Considered: Claude Desktop MCP Server List

**Would show:** Austria MCP server appearing in Claude Desktop's MCP servers list

**Why not needed:**
- Test report says we can't test (Claude Desktop not installed on test system)
- Configuration is pure text (JSON) - no UI to show
- Users would need to take their own screenshot anyway
- Verification steps in docs already clear

**Decision:** SKIP - Text instructions sufficient

---

### Considered: FastMCP Dev UI

**Would show:** Web interface at `http://localhost:8000` with tool list

**Why not needed:**
- FastMCP dev UI is standard across all FastMCP projects
- Layout may change in future FastMCP versions
- Instructions clearly describe what to expect
- Users can explore UI easily without screenshot

**Decision:** SKIP - Descriptive text better than outdated screenshots

---

### Considered: Tool Execution Example

**Would show:** Claude Desktop with example query and response

**Why not needed:**
- Responses are already shown as code blocks in docs
- Would require ongoing maintenance as UI changes
- Example text already comprehensive
- Users will see their own results immediately

**Decision:** SKIP - Code examples more maintainable

---

## Priority Matrix

| Visual Asset | Priority | Complexity | Value | Include? |
|--------------|----------|------------|-------|----------|
| Architecture Diagram | CRITICAL | Medium | High | YES |
| Configuration Path | CRITICAL | Low | High | YES |
| Data Flow Diagram | HELPFUL | Medium | Medium | MAYBE |
| Tool Category Tree | NICE | Low | Low | NO |
| Screenshots | SKIP | N/A | Low | NO |

## Recommended Implementation Plan

### Phase 1: Critical (Must Have)

1. **Architecture Diagram** → `docs/content/docs/index.mdx`
   - Mermaid flowchart showing component layers
   - Single version for EN/DE
   - Place after "What is MCP?" section

2. **Configuration Path Diagram** → `docs/content/docs/guides/setup.mdx`
   - Simple directory tree with ✅❌ markers
   - Minimal Mermaid or code block with visual markers
   - Place in "Wrong working directory" troubleshooting

### Phase 2: Helpful (Should Have)

3. **Data Flow Diagram** → `docs/content/docs/guides/setup.mdx`
   - Mermaid sequence diagram
   - Shows request/response flow
   - Place after "What is Austria MCP?" callout
   - **Only add if checkpoint decision approves**

### Phase 3: Nice-to-Have (Skip for v1.1)

4. Tool Category Tree - Skip (text listing sufficient)
5. Screenshots - Skip (maintenance burden)

## Placement Recommendations

### docs/content/docs/index.mdx

**After line 48 (after "Extensibility" bullet):**

```markdown
## Architecture Overview

The Austria MCP server connects Claude Desktop to Austrian government datasets through a robust middleware stack:

[ARCHITECTURE DIAGRAM HERE]

This architecture provides:
- **Clean separation** between MCP protocol handling (FastMCP) and business logic (tools)
- **Layered middleware** for logging, error handling, retries, rate limiting, and auth
- **Organized tools** by functional category for easy discovery
- **Efficient API client** with connection pooling and request optimization
```

### docs/content/docs/guides/setup.mdx

**After line 365 (in "Wrong working directory" section):**

```markdown
The correct directory structure looks like this:

[CONFIGURATION PATH DIAGRAM HERE]

Your `cwd` must point to the `mcp/` directory, which contains the `app/` folder.
```

**Optional - After line 16 (after Prerequisites section):**

```markdown
## How Austria MCP Works

When you ask Claude to search for datasets, here's what happens:

[DATA FLOW DIAGRAM HERE]

The server acts as an intelligent bridge, adding quality scoring, semantic understanding, and data previews that the raw API doesn't provide.
```

## Accessibility Requirements

All diagrams MUST include:

1. **Alt text** - Comprehensive description for screen readers
2. **High contrast** - Works in both light and dark mode
3. **Clear labels** - Text readable at default size
4. **Logical flow** - Top-to-bottom or left-to-right reading order
5. **Legend if needed** - Explain symbols/colors used

## Maintenance Considerations

**Mermaid advantages:**
- Text-based, version controlled
- Automatic dark mode support (Fumadocs handles it)
- Easy to update when architecture changes
- No external image files to manage
- Renders consistently across browsers

**Mermaid limitations:**
- Limited styling control
- May look different in different Mermaid renderers
- Complex diagrams can be hard to maintain as text

**Recommendation:** Use Mermaid for all diagrams. The maintenance benefits outweigh styling limitations, and Fumadocs supports Mermaid well.

## Next Steps

1. **Decision checkpoint** - Choose Mermaid vs SVG vs Hybrid approach
2. **Create critical diagrams** - Architecture and configuration path
3. **Verify rendering** - Test in both light/dark mode
4. **Human verification** - User reviews diagrams for clarity
5. **Consider data flow** - Add if checkpoint approves

## Summary

**Total visuals recommended:** 2 critical + 1 optional = 2-3 diagrams

**What we're adding:**
- Architecture diagram (system understanding)
- Configuration path diagram (prevent #1 error)
- Data flow diagram (if approved in checkpoint)

**What we're NOT adding:**
- Decorative images
- Screenshots of UIs that change
- Redundant visuals
- Tool trees that text handles well

**Estimated impact:**
- Reduced setup errors (configuration path)
- Better troubleshooting (architecture understanding)
- Faster onboarding (visual system overview)

**Maintenance burden:** Low (text-based Mermaid, few diagrams)
