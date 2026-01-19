# Phase 20: Guides & Workflows - Research

**Researched:** 2026-01-19
**Domain:** Task-Oriented Documentation / Workflow Guides
**Confidence:** HIGH

## Summary

Phase 20 creates task-oriented guides and workflow walkthroughs that help users accomplish complete end-to-end tasks. This phase transforms tool-centric reference documentation into goal-oriented guides structured around user intentions ("I want to search datasets") rather than tool capabilities ("semantic_search_datasets does X"). Progressive disclosure through Tabs components allows serving both analysts (Basic examples) and developers (Advanced examples) from the same content.

**Core insight:** Guides differ fundamentally from tutorials and reference documentation. Tutorials teach skills through learning exercises. Reference documents describe tools. Guides show how to accomplish specific real-world goals assuming competence. The Diataxis framework maps this as: Tutorial = learning-oriented, How-to Guide = task-oriented, Reference = information-oriented, Explanation = understanding-oriented. Phase 20 creates how-to guides.

**Primary recommendation:** Structure guides as goal-oriented workflows ("I want to find high-quality datasets for research") with Steps component for sequential tasks, Tabs for Basic/Advanced progressive disclosure, and TypeTable for parameter documentation. Use conditional imperatives ("If you need X, do Y"). Link to reference documentation for depth rather than embedding technical details in guides.

## Standard Stack

All libraries already installed from Phase 18. This phase writes content using existing components.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-ui | 16.4.7 | Steps, Tabs, Accordion, TypeTable components | Official UI library, proven in Phase 18/19 |
| fumadocs-core | 16.4.7 | remark-steps plugin for sequential workflows | Auto-converts markdown to Steps component |
| fumadocs-mdx | 14.2.6 | MDX compilation, component integration | Official MDX integration |
| shiki | 3.21.0 | Syntax highlighting for code examples | Industry standard, 200+ languages |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-icons | 1.3.2 | Icons for success/warning indicators | Workflow step validation icons |
| next-themes | 0.4.6 | Theme-aware code blocks | Light/dark syntax highlighting |
| mermaid | 11.12.2 | Workflow diagrams | Visual workflow overviews |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Steps component | Numbered lists | Steps provide visual progress indicators, mobile-responsive |
| Tabs for Basic/Advanced | Separate pages | Tabs keep context, reduce navigation overhead |
| TypeTable | Manual parameter tables | TypeTable provides consistent formatting, type highlighting |
| Accordion for tool reference | Flat list | Accordion enables scanning collapsed view, expand on demand |

**Installation:**
```bash
# No new packages needed - all installed in Phase 18
cd docs && npm list fumadocs-ui fumadocs-core
```

## Architecture Patterns

### Recommended Content Structure
```
docs/guides/
├── meta.json                       # Navigation order
├── searching.mdx                   # GUIDE-01: Basic, semantic, faceted search
├── data-preview.mdx                # GUIDE-02: Schema inspection, data preview
├── quality-metrics.mdx             # GUIDE-03: Quality scoring, related datasets
└── workflow-patterns.mdx           # GUIDE-04: Research/validation workflows

docs/examples/workflows.mdx         # WORK-01 through WORK-07: Workflow walkthroughs
```

### Pattern 1: Task-Oriented Guide Structure (Diataxis How-To)

**What:** Guides organized by user goals, not tool features

**When to use:** Users know what they want to accomplish but not which tools to use

**Structure:**
```markdown
# [Goal-Oriented Title]

[One-line description of what user will accomplish]

## When to Use This Guide

[Specific scenarios where this guide applies]

## Prerequisites

- [ ] [Required setup/knowledge]
- [ ] [Required tools/access]

## Approach

[Brief overview of strategy - no detailed steps yet]

## Step-by-Step Instructions

### Option 1: [Approach Name]

**Best for:** [use case]

[Numbered steps with conditional guidance]

### Option 2: [Alternative Approach]

**Best for:** [different use case]

[Different path for different goals]

## Troubleshooting

Common issues organized by observable symptom

## Next Steps

- [Link to related guide]
- [Link to reference documentation]
```

**Example:**
```mdx
---
title: Finding High-Quality Datasets
description: Locate reliable, well-documented datasets for research or production use
---

# Finding High-Quality Datasets

Discover datasets with complete metadata, recent updates, and reliable download links.

## When to Use This Guide

- You need datasets for academic research citations
- You're building production applications requiring reliable data
- You want to filter out low-quality or outdated datasets

## Prerequisites

- [ ] Austria MCP server connected in Claude Desktop
- [ ] Understanding of your data requirements (theme, format, timeframe)

## Approach

Austria MCP provides quality scores (0-100) based on metadata completeness, update frequency, and standards compliance. You can filter during search or analyze after retrieval.

## Step-by-Step Instructions

### Option 1: Quality-Aware Search

**Best for:** Starting from scratch, need quick filtering

<Steps>
  <Step>
    ### Enable Quality Boost

    Use `boost_quality=True` to prioritize high-scoring datasets:

    ```python
    search_datasets(
        query="population statistics",
        boost_quality=True,
        limit=20
    )
    ```

    Datasets with scores >80 get 2x relevance boost.
  </Step>

  <Step>
    ### Review Quality Indicators

    Check quality scores in results:

    ```json
    {
      "results": [
        {
          "id": "dataset-123",
          "title": "Population Data 2024",
          "quality_score": 87
        }
      ]
    }
    ```

    Scores 85-100: Excellent (all metadata complete)
    Scores 70-84: Good (minor gaps acceptable)
    Scores 50-69: Acceptable (check before using)
    Scores <50: Poor (verify carefully)
  </Step>
</Steps>

### Option 2: Post-Search Quality Analysis

**Best for:** Evaluating specific datasets from any search

<Steps>
  <Step>
    ### Run Quality Analysis

    ```python
    analyze_dataset_quality(dataset_id="dataset-123")
    ```

    Returns comprehensive breakdown of quality dimensions.
  </Step>

  <Step>
    ### Check Critical Fields

    Verify essential metadata is present:

    ```json
    {
      "metadata": {
        "has_title": true,
        "has_description": true,
        "has_license": true,
        "has_contact": false  // ⚠️ Missing
      },
      "metrics": {
        "overall_score": 82,
        "completeness": 75
      }
    }
    ```

    Missing contact point reduces usability but may be acceptable.
  </Step>
</Steps>

## Troubleshooting

### All Results Have Low Quality Scores

**Symptom:** Every dataset scores <60

**Cause:** Domain may have sparse metadata (specialized datasets)

**Solution:**
1. Check if required fields match your needs (license > contact point)
2. Use `analyze_dataset_quality()` to see what's missing
3. Contact publisher if critical fields absent

### Quality Boost Returns No Results

**Symptom:** Search with `boost_quality=True` returns empty

**Cause:** Query too specific + quality filter too strict

**Solution:**
1. Try search without `boost_quality` first
2. Review all results' quality scores
3. Adjust `min_score` parameter if using `find_related_datasets()`

## Next Steps

- **[Quality Metrics Guide](/guides/quality-metrics)** - Understanding DQV scores
- **[Data Preview Guide](/guides/data-preview)** - Verify data before downloading
- **[Quality Analysis API Reference](/api/tools/analysis)** - Complete tool documentation
```

**Why this works:**
- **Goal-oriented title:** User knows immediately if this guide applies
- **When to use section:** Helps user choose correct guide
- **Multiple options:** Acknowledges different paths to same goal
- **Conditional guidance:** "If X, do Y" adapts to user context
- **Troubleshooting by symptom:** User finds solutions based on what they observe
- **Links to depth:** Reference docs for technical details

**Source:** Diataxis how-to guide pattern (https://diataxis.fr/how-to-guides/)

### Pattern 2: Progressive Disclosure with Basic/Advanced Tabs

**What:** Same content serves different expertise levels through Tabs

**When to use:** Content has simple and complex approaches to same goal

**Example:**
```mdx
## Searching for Datasets

<Tabs items={['Basic', 'Advanced']} groupId="search-complexity" persist>
  <Tab value="Basic">
    ### Simple Text Search

    Ask Claude in natural language:

    ```
    Find datasets about Vienna population
    ```

    Claude uses `semantic_search_datasets` automatically and shows results.

    **Good for:**
    - Quick exploration
    - Natural language queries
    - Non-technical users
  </Tab>

  <Tab value="Advanced">
    ### Programmatic Search with Filters

    Direct tool usage with faceted filtering:

    ```python
    search_datasets(
        query="population",
        themes=["SOCI"],
        formats=["CSV", "JSON"],
        publishers=["stadt-wien"],
        min_date="2024-01-01",
        boost_quality=True,
        sort_by="modified_desc",
        limit=50
    )
    ```

    **Returns structured data with facets:**

    ```json
    {
      "results": [...],
      "count": 42,
      "facets": {
        "themes": {"SOCI": 30, "HEAL": 12},
        "formats": {"CSV": 25, "JSON": 17}
      }
    }
    ```

    **Good for:**
    - Precise control over filters
    - Automation/scripting
    - Integration with applications
  </Tab>
</Tabs>
```

**Key features:**
- `groupId="search-complexity"`: Tab selection persists across pages with same groupId
- `persist`: Stores selection in localStorage for session persistence
- **Basic tab:** Natural language, Claude Desktop interaction, minimal syntax
- **Advanced tab:** Direct API usage, parameter tables, return schemas

**Usage guidelines:**
- **Basic tab content:**
  - Show Claude Desktop interaction pattern
  - Natural language examples
  - Expected Claude responses
  - Minimal technical jargon
- **Advanced tab content:**
  - Show direct tool calls with parameters
  - Full parameter tables (use TypeTable component)
  - Return value schemas
  - Type information (QUAL-03 requirement)
  - Error handling examples (QUAL-04 requirement)

**Source:** Phase 18 Tabs research + Phase 19 progressive disclosure pattern

### Pattern 3: Sequential Workflow with Steps Component

**What:** Visual step-by-step workflow with progress indicators

**When to use:** Multi-step processes where order matters (WORK-07 requirement)

**Implementation:** Use markdown syntax with remark-steps plugin (configured in source.config.ts line 84)

**Example:**
```mdx
## Dataset Discovery Workflow

<Steps>
  <Step>
    ### Search for Datasets

    Find candidates using semantic search:

    ```python
    results = semantic_search_datasets(
        natural_query="climate data for Vienna"
    )
    ```

    **Expected output:** 10-20 datasets ranked by relevance
  </Step>

  <Step>
    ### Evaluate Quality

    Check quality score for top result:

    ```python
    dataset_id = results['results'][0]['id']
    quality = analyze_dataset_quality(dataset_id)
    ```

    **Quality threshold:** Score >70 recommended for research
  </Step>

  <Step>
    ### Preview Data Structure

    Inspect schema before downloading:

    ```python
    distributions = get_dataset_distributions(dataset_id)
    csv_url = distributions[0]['downloadURL']
    schema = preview_schema(url=csv_url)
    ```

    **Verify:** Required columns present in schema
  </Step>

  <Step>
    ### Download Dataset

    If quality and schema acceptable:

    ```python
    # Use CSV URL from previous step
    # Download with your preferred method
    ```

    **Success criteria:** Data matches schema, quality score met
  </Step>
</Steps>
```

**Why this works:**
- **Visual progress:** Numbered indicators show workflow position
- **Expected outputs:** User validates success at each step
- **Dependencies clear:** Each step builds on previous step's output
- **Mobile responsive:** Steps stack vertically on narrow screens

**Alternative syntax (automatic detection):**

Fumadocs can auto-detect step structure without explicit `<Steps>` wrapper:

```mdx
### 1. Search for Datasets

Content...

### 2. Evaluate Quality

Content...

### 3. Preview Data

Content...
```

When heading starts with number, remark-steps plugin converts to Steps component automatically.

**Source:** Fumadocs remark-steps documentation + existing workflows.mdx implementation

### Pattern 4: Accordion-Based Tool Reference

**What:** Scannable collapsed view expands to detailed documentation

**When to use:** Long reference lists (25 tools), user needs to scan then expand

**Example (from existing api/tools/index.mdx):**
```mdx
## Discovery Tools

<Accordions type="single" collapsible>
  <Accordion title="search_datasets" id="search-datasets">
    Search for datasets with text queries and faceted filtering.

    **Parameters:**

    <TypeTable type={{
      query: {
        type: "string",
        description: "Search query for titles, descriptions, keywords",
        default: "None"
      },
      themes: {
        type: "string[]",
        description: "Filter by EU data theme codes",
        default: "None"
      },
      boost_quality: {
        type: "boolean",
        description: "Boost high-quality datasets in results",
        default: false
      }
    }} />

    **Returns:**

    ```json
    {
      "results": [...],
      "count": 42,
      "facets": {...}
    }
    ```

    **Example:**

    ```python
    search_datasets(
        query="health",
        themes=["HEAL"],
        boost_quality=True
    )
    ```
  </Accordion>

  <Accordion title="semantic_search_datasets" id="semantic-search">
    Natural language search with AI query expansion.

    [Same structure: Parameters, Returns, Example]
  </Accordion>
</Accordions>
```

**Key features:**
- `type="single"`: Only one accordion open at a time (prevents overwhelming user)
- `collapsible`: Can close all (starts collapsed)
- `id` attribute: Enables URL hash navigation (`#search-datasets` auto-expands)
- **TypeTable component:** Consistent parameter documentation with types (QUAL-03)

**Content structure within accordion:**
1. One-line summary
2. Parameters (TypeTable component)
3. Returns (JSON schema example)
4. Working code example (QUAL-01, QUAL-05)
5. Error handling notes (QUAL-04)

**Source:** Existing api/tools/index.mdx + Phase 18 Accordion research

### Pattern 5: Error Handling Examples (QUAL-04)

**What:** Show common errors and solutions in context

**When to use:** Every guide Advanced tab, all workflow steps that can fail

**Example:**
```mdx
### Preview Dataset Schema

```python
schema = preview_schema(url=download_url, format="csv")
```

**Common Errors:**

**Network Error:**
```json
{
  "error": "NetworkError",
  "message": "Failed to fetch URL after 3 retries"
}
```
**Solution:** Check URL accessibility, verify network connection

**Format Detection Error:**
```json
{
  "error": "FormatError",
  "message": "Could not detect CSV delimiter"
}
```
**Solution:** Specify format explicitly: `format="csv"`

**Parse Error:**
```json
{
  "error": "ParseError",
  "message": "Invalid JSON at position 42"
}
```
**Solution:** File may be corrupted, try downloading full file to inspect
```

**Pattern variations:**

**Inline error notes:**
```python
try:
    quality = analyze_dataset_quality(dataset_id)
except ToolError as e:
    # Handle gracefully - quality service may be degraded
    print(f"Quality check failed: {e}")
    # Continue with partial data
```

**Graceful degradation callouts:**
```mdx
<Callout type="warn">
**Graceful Degradation:** If quality metrics API is unavailable, `analyze_dataset_quality()` returns partial results with `"degraded": true`. Check this field before relying on quality scores.
</Callout>
```

**Source:** Existing guides (data-preview.mdx, quality-metrics.mdx) + technical documentation best practices

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sequential workflow UI | Custom numbered divs | Steps component (remark-steps) | Auto-numbering, mobile-responsive, visual progress |
| Parameter documentation tables | Manual HTML tables | TypeTable component | Type highlighting, consistent formatting, required/optional indicators |
| Progressive disclosure | JavaScript toggle buttons | Tabs component with persist | State persistence, groupId sharing, accessible |
| Workflow diagrams | ASCII art or images | Mermaid component | Theme-aware, editable, version-controlled |
| Code syntax highlighting | Manual <pre><code> | Fumadocs code blocks (Shiki) | 200+ languages, copy button, line numbers |
| Collapsible reference sections | Custom JavaScript accordions | Accordion component | URL hash navigation, keyboard accessible, single-open mode |

**Key insight:** Fumadocs provides all UI patterns needed for guides and workflows. Focus on content quality (goal-oriented structure, clear examples, error handling) rather than component building. All required components verified working in Phase 18.

## Common Pitfalls

### Pitfall 1: Tool-Centric Instead of Task-Oriented Structure

**What goes wrong:** Guides organized by tool names ("search_datasets Guide") instead of user goals ("Finding Datasets Guide")

**Why it happens:** Documentation mirrors code architecture, not user mental model

**How to avoid:**

```mdx
❌ **Bad - tool-centric:**

# search_datasets Tool

The search_datasets tool allows searching for datasets. It has parameters:
- query: search query
- themes: filter by themes
- limit: results per page

✅ **Good - task-oriented:**

# Finding Datasets by Topic

You need to locate datasets about a specific topic.

## Quick Search

Ask Claude: "Find datasets about [your topic]"

Claude uses semantic search automatically.

## Filtered Search

If you need specific themes or formats:

<Tabs items={['Basic', 'Advanced']} persist groupId="search-complexity">
  <Tab value="Basic">
    Tell Claude your requirements:
    "Find CSV datasets about health from Vienna"
  </Tab>

  <Tab value="Advanced">
    ```python
    search_datasets(
        query="health",
        themes=["HEAL"],
        formats=["CSV"],
        publishers=["stadt-wien"]
    )
    ```
  </Tab>
</Tabs>

## Next Steps

- **[Quality Filtering](/guides/quality-metrics)** - Find high-quality datasets
- **[Data Preview](/guides/data-preview)** - Inspect before downloading
```

**Warning signs:**
- Guide titles match tool names exactly
- Content explains what tool does, not how to accomplish goal
- No "When to Use This Guide" section
- Multiple tools covered in single guide without clear workflow

**Prevention:**
- Title format: "[Verb] [Object]" not "[Tool Name]"
- Start with user goal, introduce tools as means to end
- Group by task completion, not by API surface area

**Source:** Diataxis how-to guide principles

### Pitfall 2: No Progressive Disclosure (Overwhelming Advanced Users or Under-Serving Beginners)

**What goes wrong:** Single example tries to serve all users, ends up too complex for beginners or too simple for developers

**Why it happens:** Desire to avoid duplication leads to compromise solution satisfying nobody

**How to avoid:**

```mdx
❌ **Bad - single middle-ground example:**

## Searching Datasets

Use the search tool with optional filters:

```python
search_datasets(
    query="population",  # Required
    themes=["SOCI"],     # Optional filter
    limit=20             # Optional, default 20
)
```

This searches for population datasets, filtering by Social theme, returning 20 results.

✅ **Good - progressive disclosure:**

## Searching Datasets

<Tabs items={['Basic', 'Advanced']} groupId="search-complexity" persist>
  <Tab value="Basic">
    ### Ask Claude in Natural Language

    ```
    Find population datasets
    ```

    Claude uses semantic search automatically. Results appear in conversation.

    **Try it:**
    - "Show me health data from Vienna"
    - "Find CSV datasets about environment"
    - "Search for recent population statistics"
  </Tab>

  <Tab value="Advanced">
    ### Direct Tool Call with Filters

    ```python
    search_datasets(
        query="population",
        themes=["SOCI"],
        formats=["CSV", "JSON"],
        min_date="2024-01-01",
        boost_quality=True,
        sort_by="modified_desc",
        limit=50
    )
    ```

    **Parameters:**

    <TypeTable type={{
      query: {
        type: "string",
        description: "Search terms (supports fuzzy matching with ~)"
      },
      themes: {
        type: "string[]",
        description: "EU DCAT-AP theme codes: SOCI, HEAL, ENVI, etc."
      },
      boost_quality: {
        type: "boolean",
        description: "Prioritize datasets with quality score >80",
        default: false
      }
    }} />

    **Error Handling:**

    ```python
    try:
        results = search_datasets(query="population")
    except ToolError as e:
        print(f"Search failed: {e}")
    ```
  </Tab>
</Tabs>
```

**Warning signs:**
- Single code example with comments explaining optional parts
- "Advanced users can also..." inline notes
- No separation between Claude interaction and direct API usage
- Type information mixed with beginner content

**Prevention:**
- Use Tabs for every multi-level concept
- Basic tab: Natural language, Claude Desktop workflow, no types
- Advanced tab: Direct calls, TypeTable, error handling, return schemas
- Keep groupId consistent across pages for persistent preference

**Source:** Phase 18 Tabs pattern + GUIDE-05 requirement

### Pitfall 3: Missing Success Verification in Workflows

**What goes wrong:** User completes steps but doesn't know if they succeeded

**Why it happens:** Documentation assumes user can infer success from absence of errors

**How to avoid:**

```mdx
❌ **Bad - no verification:**

<Steps>
  <Step>
    ### Search for Datasets

    ```python
    results = search_datasets(query="health")
    ```
  </Step>

  <Step>
    ### Get Dataset Details

    ```python
    dataset = get_dataset(dataset_id=results['results'][0]['id'])
    ```
  </Step>
</Steps>

✅ **Good - verification at each step:**

<Steps>
  <Step>
    ### Search for Datasets

    ```python
    results = search_datasets(query="health", limit=20)
    ```

    **Expected output:**
    ```json
    {
      "count": 42,
      "results": [...]
    }
    ```

    **Verify success:**
    - [ ] `count` field shows number found
    - [ ] `results` array contains datasets
    - [ ] Each result has `id`, `title`, `description`

    **If count is 0:** Try broader query or remove filters
  </Step>

  <Step>
    ### Get Dataset Details

    ```python
    dataset_id = results['results'][0]['id']
    dataset = get_dataset(dataset_id=dataset_id)
    ```

    **Expected output:**
    ```json
    {
      "id": "dataset-123",
      "title": {"de": "Gesundheitsdaten..."},
      "publisher": {"name": "Stadt Wien"}
    }
    ```

    **Verify success:**
    - [ ] Dataset has title and description
    - [ ] Publisher information present
    - [ ] Distributions array exists (download URLs)

    **If error "Dataset not found":** ID may be stale, search again
  </Step>
</Steps>
```

**Warning signs:**
- No "Expected output" sections
- No verification checkboxes
- No "If X goes wrong" guidance
- User asks "How do I know it worked?"

**Prevention:**
- Show expected output for every step
- Provide verification checklist
- Map common errors to troubleshooting
- Include "success criteria" summary at workflow end

**Source:** Phase 19 expected output pattern + Diataxis tutorial best practices

### Pitfall 4: Mixing Guide Types (Tutorial, How-To, Reference)

**What goes wrong:** Guide tries to teach concepts (tutorial), accomplish tasks (how-to), and document parameters (reference) simultaneously

**Why it happens:** Unclear distinction between Diataxis documentation types

**How to avoid:**

```mdx
❌ **Bad - mixed types:**

# Understanding and Using Search Features

[5 paragraphs explaining how search works internally]

## What is Full-Text Search?

Full-text search is a technique for searching text fields...

## search_datasets Parameters

<TypeTable type={{...}} />

## Tutorial: Your First Search

Let's learn how search works by trying examples...

✅ **Good - separate documents:**

**guides/searching.mdx (HOW-TO GUIDE):**

---
title: Finding Datasets
description: Locate datasets matching specific criteria
---

# Finding Datasets

Accomplish specific search goals.

## When to Use This Guide

- You know what data you need
- You want to filter by theme/format/publisher
- You need quality-filtered results

## Quick Search

[Task-oriented steps]

## Next Steps

- **[Search API Reference](/api/tools/discovery#search-datasets)** - Complete parameter documentation
- **[How Search Works](/advanced/search-architecture)** - Technical deep-dive

---

**api/tools/discovery.mdx (REFERENCE):**

<Accordion title="search_datasets">
  Search datasets with text queries and faceted filtering.

  **Parameters:**

  <TypeTable type={{...}} />

  **Returns:** [JSON schema]

  **Example:** [Minimal working code]
</Accordion>

---

**advanced/search-architecture.mdx (EXPLANATION):**

# How Search Works

Austria MCP uses Solr full-text search with...

[Technical explanation of internals]
```

**Warning signs:**
- Guide has "Understanding..." in title (explanation, not how-to)
- Guide includes "What is..." sections (explanation)
- Guide includes complete parameter tables (reference)
- Guide has extended examples for learning (tutorial)

**Prevention:**
- **Guides (how-to):** Goal-oriented, assumes competence, shows how to accomplish task
- **Reference:** Information-oriented, complete parameters, minimal explanation
- **Explanation:** Understanding-oriented, why it works this way, architecture
- **Tutorials:** Learning-oriented, teaches through exercises, builds competence

Link between types, don't merge them.

**Source:** Diataxis framework (https://diataxis.fr/)

### Pitfall 5: Steps Without Context (Blind Recipe Following)

**What goes wrong:** Workflow has steps but no explanation of strategy or when to deviate

**Why it happens:** Over-application of "action-oriented" principle removes all explanation

**How to avoid:**

```mdx
❌ **Bad - steps without context:**

## Finding High-Quality Datasets

<Steps>
  <Step>
    Run this:
    ```python
    search_datasets(query="", boost_quality=True)
    ```
  </Step>

  <Step>
    Run this:
    ```python
    analyze_dataset_quality(dataset_id="...")
    ```
  </Step>

  <Step>
    Download if score > 70
  </Step>
</Steps>

✅ **Good - strategy before steps:**

## Finding High-Quality Datasets

**Strategy:** Search with quality boost enabled, then verify top results meet your quality threshold.

**When to deviate:**
- If you need comprehensive results (not just high-quality), disable `boost_quality`
- If domain has sparse metadata, lower quality threshold to 60

<Steps>
  <Step>
    ### Search with Quality Boost

    Prioritize datasets with complete metadata:

    ```python
    results = search_datasets(
        query="population",
        boost_quality=True
    )
    ```

    **What this does:** Datasets scoring >80 get 2x relevance boost

    **Alternative:** For comprehensive results, set `boost_quality=False`
  </Step>

  <Step>
    ### Verify Quality Threshold

    Check if top result meets your needs:

    ```python
    dataset_id = results['results'][0]['id']
    quality = analyze_dataset_quality(dataset_id)

    if quality['score'] >= 70:
        print("✓ Quality acceptable")
    ```

    **Quality thresholds:**
    - Research/citations: 85+ recommended
    - Production applications: 70+ acceptable
    - Exploratory analysis: 50+ sufficient

    **If score too low:** Review quality breakdown, decide if missing fields matter
  </Step>
</Steps>
```

**Warning signs:**
- No explanation of overall strategy
- No "Why this approach" notes
- No conditional guidance ("If X, then Y")
- No alternatives mentioned
- Steps are pure commands without context

**Prevention:**
- Start with strategy overview
- Explain what each step accomplishes
- Provide decision points ("If score < 70, consider...")
- Show when to deviate from happy path
- Balance action with minimal necessary explanation

**Source:** Diataxis how-to guide principle: "provide guidance" not just instructions

## Code Examples

Verified patterns from official sources and existing content:

### Complete Workflow with Basic/Advanced Tabs and Steps

```mdx
---
title: Dataset Discovery Workflow
description: Complete process from search to download
---

# Dataset Discovery Workflow

Find, evaluate, and download datasets matching your requirements.

## When to Use This Workflow

- You're starting from scratch (no specific dataset in mind)
- You need to verify data quality before downloading
- You want to preview data structure before committing

## Workflow Overview

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-style">
  <Tab value="Complete Example">
    ### All-in-One Script

    Complete workflow in one code block:

    ```python
    # 1. Search for datasets
    results = semantic_search_datasets(
        natural_query="health data from Vienna",
        formats=["CSV"],
        boost_quality=True
    )

    # 2. Get top result details
    dataset_id = results['results'][0]['id']
    dataset = get_dataset(dataset_id=dataset_id)

    # 3. Analyze quality
    quality = analyze_dataset_quality(dataset_id=dataset_id)

    if quality['score'] < 70:
        print("⚠️ Quality below threshold")
        # Fall back to second result or adjust criteria

    # 4. Get download URL
    distributions = get_dataset_distributions(dataset_id=dataset_id)
    csv_url = next(d['downloadURL'] for d in distributions
                   if d.get('format') == 'CSV')

    # 5. Preview schema
    schema = preview_schema(url=csv_url, format="csv")

    # 6. Verify required columns
    required_columns = ["year", "region", "cases"]
    actual_columns = [c['name'] for c in schema['columns']]

    if all(col in actual_columns for col in required_columns):
        print("✓ Schema validated - ready to download")
        # Proceed with download
    else:
        print("✗ Missing required columns")
    ```

    **Good for:** Copy-paste automation, understanding full flow
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Search for Relevant Datasets

        Use semantic search with quality boost:

        ```python
        results = semantic_search_datasets(
            natural_query="health data from Vienna",
            formats=["CSV"],
            boost_quality=True
        )
        ```

        **Expected output:**
        ```json
        {
          "count": 15,
          "results": [
            {
              "id": "dataset-123",
              "title": {"de": "Gesundheitsdaten Wien 2024"},
              "quality_score": 87
            }
          ],
          "expansion_info": {
            "detected_language": "en",
            "semantic_themes": ["HEAL"]
          }
        }
        ```

        **Verify:**
        - [ ] Count > 0 (datasets found)
        - [ ] Top result relevant to query
        - [ ] Quality scores visible

        **If count is 0:**
        - Remove format filter (`formats=["CSV"]`)
        - Try broader query ("health data" instead of specific terms)
        - Check if semantic expansion detected wrong language
      </Step>

      <Step>
        ### Get Dataset Metadata

        Retrieve complete information for top result:

        ```python
        dataset_id = results['results'][0]['id']
        dataset = get_dataset(dataset_id=dataset_id)
        ```

        **Expected output:**
        ```json
        {
          "id": "dataset-123",
          "title": {"de": "Gesundheitsdaten..."},
          "description": {"de": "Umfassende..."},
          "publisher": {
            "name": "Stadt Wien",
            "email": "open@data.wien.gv.at"
          },
          "modified": "2024-01-15",
          "license": "CC-BY-4.0"
        }
        ```

        **Verify:**
        - [ ] Title and description present
        - [ ] Publisher identified
        - [ ] License specified
        - [ ] Recent modification date

        **Error handling:**
        ```python
        try:
            dataset = get_dataset(dataset_id=dataset_id)
        except ToolError as e:
            print(f"Dataset fetch failed: {e}")
            # Try next result in list
        ```
      </Step>

      <Step>
        ### Analyze Dataset Quality

        Get comprehensive quality metrics:

        ```python
        quality = analyze_dataset_quality(dataset_id=dataset_id)
        ```

        **Expected output:**
        ```json
        {
          "dataset_id": "dataset-123",
          "metadata": {
            "has_title": true,
            "has_description": true,
            "has_license": true,
            "completeness_score": 85
          },
          "metrics": {
            "overall_score": 87,
            "completeness": 85,
            "timeliness": 15,
            "compliance": 10
          },
          "degraded": false
        }
        ```

        **Quality decision matrix:**

        | Score | Use For | Action |
        |-------|---------|--------|
        | 85-100 | Research, citations | Proceed with confidence |
        | 70-84 | Production apps | Verify critical fields |
        | 50-69 | Exploration | Check schema carefully |
        | <50 | Caution | Consider alternatives |

        **If degraded is true:**
        ```python
        if quality.get('degraded'):
            print("⚠️ Quality service degraded - using cached metrics")
            # Verify critical fields manually
        ```
      </Step>

      <Step>
        ### Get Distribution URLs

        Retrieve download links:

        ```python
        distributions = get_dataset_distributions(dataset_id=dataset_id)

        # Find CSV format
        csv_dist = next(
            (d for d in distributions if d.get('format') == 'CSV'),
            None
        )

        if csv_dist:
            csv_url = csv_dist['downloadURL']
            file_size = csv_dist.get('byteSize', 'Unknown')
            print(f"CSV: {csv_url} ({file_size} bytes)")
        ```

        **Expected output:**
        ```json
        [
          {
            "id": "dist-1",
            "format": "CSV",
            "downloadURL": "https://data.wien.gv.at/.../data.csv",
            "byteSize": 1048576,
            "title": "Gesundheitsdaten CSV"
          }
        ]
        ```

        **Verify:**
        - [ ] At least one distribution available
        - [ ] Preferred format (CSV) exists
        - [ ] Download URL is valid HTTPS

        **If no CSV available:**
        - Check for JSON format as alternative
        - Use `preview_data()` on available formats
        - Contact publisher if all links broken
      </Step>

      <Step>
        ### Preview Data Schema

        Inspect structure before full download:

        ```python
        schema = preview_schema(url=csv_url, format="csv")
        ```

        **Expected output:**
        ```json
        {
          "url": "https://data.wien.gv.at/.../data.csv",
          "format": "csv",
          "partial_fetch": true,
          "bytes_fetched": 65536,
          "columns": [
            {
              "name": "year",
              "type": "integer",
              "sample_values": [2022, 2023, 2024]
            },
            {
              "name": "region",
              "type": "string",
              "sample_values": ["Innere Stadt", "Leopoldstadt"]
            },
            {
              "name": "cases",
              "type": "integer",
              "sample_values": [150, 200, 175]
            }
          ]
        }
        ```

        **Verify schema matches requirements:**

        ```python
        required_columns = ["year", "region", "cases"]
        actual_columns = [c['name'] for c in schema['columns']]

        missing = set(required_columns) - set(actual_columns)
        if missing:
            print(f"✗ Missing columns: {missing}")
        else:
            print("✓ All required columns present")

        # Check types
        year_col = next(c for c in schema['columns'] if c['name'] == 'year')
        if year_col['type'] != 'integer':
            print("⚠️ Year column not integer type")
        ```

        **Common errors:**

        **NetworkError:**
        ```json
        {"error": "NetworkError", "message": "Failed to fetch URL"}
        ```
        Solution: URL may be stale, get fresh distributions

        **FormatError:**
        ```json
        {"error": "FormatError", "message": "Could not detect delimiter"}
        ```
        Solution: Specify format explicitly: `format="csv"`
      </Step>

      <Step>
        ### Download Dataset

        If all checks pass, proceed with download:

        ```python
        # Validation summary
        validation_passed = all([
            quality['score'] >= 70,
            csv_url is not None,
            all(col in actual_columns for col in required_columns)
        ])

        if validation_passed:
            print("✓ All validations passed")
            print(f"Download URL: {csv_url}")
            # Use your preferred download method
            # (requests, urllib, wget, etc.)
        else:
            print("✗ Validation failed - review dataset")
        ```

        **Success criteria:**
        - [ ] Quality score meets threshold
        - [ ] Schema contains required columns
        - [ ] Download URL accessible
        - [ ] File size reasonable for environment
      </Step>
    </Steps>

    **Good for:** Learning workflow, understanding each step, debugging issues
  </Tab>
</Tabs>

## Troubleshooting

### Semantic Search Returns Irrelevant Results

**Symptom:** Results don't match query intent

**Cause:** Language detection incorrect or semantic expansion too broad

**Solution:**
1. Check `expansion_info.detected_language` in response
2. If wrong language, use direct `search_datasets()` instead
3. Add explicit theme filters to constrain semantic expansion

### All Datasets Have Low Quality Scores

**Symptom:** No results with score >70

**Cause:** Domain-specific datasets have sparse metadata

**Solution:**
1. Lower threshold to 60 for acceptable quality
2. Use `analyze_dataset_quality()` to see what's missing
3. Verify critical fields (license, description) present even if score low

### Preview Schema Fails on Valid URL

**Symptom:** URL works in browser but preview_schema() errors

**Cause:** Server doesn't support HTTP Range requests

**Solution:**
1. Preview falls back to full download (may be slow for large files)
2. Use `preview_data(max_rows=10)` for smaller fetch
3. Check if different format (JSON instead of CSV) available

## Next Steps

- **[Quality Metrics Guide](/guides/quality-metrics)** - Understanding DQV scores
- **[Data Preview Guide](/guides/data-preview)** - Schema and data inspection
- **[API Reference](/api/tools)** - Complete tool documentation
```

**Source:** Existing workflows.mdx + WORK-01 requirement + Diataxis how-to pattern

### TypeTable for Parameters (QUAL-03)

```mdx
## Search Parameters

<TypeTable type={{
  query: {
    type: "string",
    description: "Search query for titles, descriptions, keywords. Supports fuzzy matching (~), wildcards (*), phrases (quotes), and boolean operators (AND/OR/NOT)",
    default: "None",
    required: false
  },
  themes: {
    type: "string[]",
    description: "Filter by EU DCAT-AP theme codes: AGRI, ECON, EDUC, ENER, ENVI, GOVE, HEAL, INTR, JUST, REGI, SOCI, TECH, TRAN",
    default: "None",
    required: false
  },
  boost_quality: {
    type: "boolean",
    description: "Boost datasets with quality score >80 (2x relevance), 60-80 (1.5x relevance). Uses DQV completeness, timeliness, compliance metrics",
    default: false,
    required: false
  },
  limit: {
    type: "integer",
    description: "Maximum results per page (1-100)",
    default: 20,
    required: false
  }
}} />
```

**TypeTable features:**
- **type field:** Shows parameter type with syntax highlighting
- **description field:** Explains purpose, provides examples, notes constraints
- **default field:** Shows default value (rendered as code)
- **required field:** Visual indicator (not shown = optional)

**Source:** Existing api/tools/index.mdx + Fumadocs TypeTable component

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tool-centric docs | Task-oriented guides | Diataxis 2021+ | Users find solutions faster, less "which tool do I use" confusion |
| Single complexity level | Progressive disclosure (Tabs) | Modern docs 2024+ | Serves beginners and experts from same content |
| Text-only workflows | Steps component with visual progress | Fumadocs v15+ | Users track position in multi-step processes |
| Separate tool pages | Accordion-based scannable reference | Modern UX 2024+ | Users scan collapsed view, expand on demand |
| Generic examples | Domain-specific workflows | Modern tech docs | Real use cases instead of toy examples |
| Reference-style parameters | TypeTable with descriptions | Fumadocs v16+ | Type information integrated with parameter docs |

**Deprecated/outdated:**
- Alphabetical tool listing: Group by functionality (Discovery, Analysis, Preview)
- Separate Basic/Advanced pages: Use Tabs for progressive disclosure
- Long prose guides: Use Steps for sequential workflows
- Manual parameter tables: Use TypeTable component
- Tool documentation without examples: Every tool needs working code example

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Tab Label Naming**
   - What we know: "Basic" vs "Advanced" tested in Phase 19, works well
   - What's unclear: Whether domain-specific labels ("Analyst" vs "Developer") would be clearer
   - Recommendation: Start with "Basic"/"Advanced" (proven), test alternatives in Phase 24 user feedback. Phase 20 requirements don't specify labels, only progressive disclosure mechanism.

2. **Steps vs. Numbered Lists for Simple Workflows**
   - What we know: Steps component provides visual progress, mobile-responsive
   - What's unclear: Whether 2-3 step workflows need full Steps component or simple numbered list suffices
   - Recommendation: Use Steps for 4+ steps or workflows with validation checkboxes. Use numbered lists for simple 2-3 step processes. Verify in Phase 24 which threshold feels right.

3. **Error Handling Coverage Level**
   - What we know: QUAL-04 requires error handling examples
   - What's unclear: How many error scenarios to document (all possible errors vs. common errors)
   - Recommendation: Document 3 most common errors per workflow step based on existing guides (NetworkError, FormatError, ParseError pattern). Add rare errors on-demand after Phase 24 user testing reveals gaps.

4. **Workflow Granularity**
   - What we know: WORK-01 through WORK-06 specify 6 distinct workflows
   - What's unclear: Whether to combine related workflows (discovery + quality assessment) or keep separate
   - Recommendation: Start with 6 separate workflows as specified. Each workflow should be completable in 5-10 minutes. If user testing shows too much navigation overhead, combine related workflows in Phase 24.

## Sources

### Primary (HIGH confidence)
- Diataxis Framework - https://diataxis.fr/ (how-to guides, task-oriented structure)
- Diataxis How-To Guides - https://diataxis.fr/how-to-guides/ (guide structure, conditional imperatives)
- Fumadocs Steps Component - https://www.fumadocs.dev/docs/ui/components/steps (sequential workflows)
- Fumadocs Tabs Component - https://www.fumadocs.dev/docs/ui/components/tabs (progressive disclosure, state persistence)
- Fumadocs TypeTable Component - https://www.fumadocs.dev/docs/ui/components/type-table (parameter documentation)
- Existing Codebase - docs/guides/*.mdx, docs/examples/workflows.mdx (proven patterns)
- Phase 18 Research - Components verified (Tabs, Accordion, Mermaid, TypeTable)
- Phase 19 Research - Progressive disclosure pattern, expected output verification
- source.config.ts - remark-steps plugin configured (line 84)
- package.json - All required packages installed (fumadocs-ui 16.4.7, fumadocs-core 16.4.7)

### Secondary (MEDIUM confidence)
- Technical Writing Best Practices - Generic industry standards (error handling, troubleshooting patterns)
- Existing API Documentation - api/tools/index.mdx (Accordion + TypeTable pattern)

### Tertiary (LOW confidence)
- None - All findings verified with official documentation or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in package.json from Phase 18, no new dependencies
- Task-oriented structure: HIGH - Diataxis framework proven, existing guides validate pattern
- Progressive disclosure: HIGH - Tabs component verified in Phase 18, persist mechanism tested
- Steps component: HIGH - Configured in source.config.ts (line 84), working example in workflows.mdx
- TypeTable usage: HIGH - Existing api/tools/index.mdx demonstrates complete implementation
- Workflow patterns: HIGH - Existing workflows.mdx provides 5 complete workflow examples
- Error handling patterns: MEDIUM - Based on existing guides (data-preview.mdx) + generic best practices, not comprehensively user-tested yet

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable Fumadocs API, Diataxis principles evergreen)
