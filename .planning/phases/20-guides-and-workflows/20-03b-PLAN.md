---
phase: 20-guides-and-workflows
plan: 03b
type: execute
wave: 2
depends_on: ["20-03a"]
files_modified:
  - docs/workflows/comparative-analysis.mdx
  - docs/workflows/publication-research.mdx
  - docs/workflows/semantic-exploration.mdx
  - docs/workflows/meta.json
autonomous: true

must_haves:
  truths:
    - "User compares multiple datasets using comparative analysis workflow"
    - "User finds citation-quality datasets using publication research workflow"
    - "User explores unfamiliar domains using semantic exploration workflow"
    - "User navigates workflows section with all 6 workflows visible"
    - "User sees expected outputs at each workflow step for verification"
  artifacts:
    - path: "docs/workflows/comparative-analysis.mdx"
      provides: "Comparative dataset analysis workflow"
      min_lines: 150
    - path: "docs/workflows/publication-research.mdx"
      provides: "Publication research workflow for citations"
      min_lines: 150
    - path: "docs/workflows/semantic-exploration.mdx"
      provides: "Semantic exploration workflow"
      min_lines: 150
    - path: "docs/workflows/meta.json"
      provides: "Workflows navigation with all 6 workflows"
      contains: "\"pages\".*discovery.*quality-assessment.*data-export.*comparative-analysis.*publication-research.*semantic-exploration"
  key_links:
    - from: "docs/workflows/*.mdx"
      to: "Steps component"
      via: "sequential workflow visualization"
      pattern: "<Steps>|<Step>"
    - from: "docs/workflows/*.mdx"
      to: "docs/guides/*.mdx"
      via: "cross-references to guides"
      pattern: "\\[.*\\]\\(\\/guides\\/"
    - from: "docs/workflows/meta.json"
      to: "all 6 workflow files"
      via: "pages array"
      pattern: "\"pages\".*\\[.*\\]"
---

<objective>
Create final 3 workflow walkthroughs (comparative-analysis, publication-research, semantic-exploration) and finalize workflows navigation.

Purpose: Complete the workflows section with specialized and advanced use case patterns, providing coverage for all major Austria MCP scenarios.

Output: 3 workflow MDX files with Steps components and complete content, plus updated workflows/meta.json navigation.
</objective>

<execution_context>
@C:\Users\travis\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\travis\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\GitHub\datagvat-mcp\.planning\PROJECT.md
@C:\GitHub\datagvat-mcp\.planning\ROADMAP.md
@C:\GitHub\datagvat-mcp\.planning\STATE.md
@C:\GitHub\datagvat-mcp\.planning\REQUIREMENTS.md
@C:\GitHub\datagvat-mcp\.planning\phases\20-guides-and-workflows\20-RESEARCH.md
@C:\GitHub\datagvat-mcp\.planning\phases\18-documentation-foundation\18-01-SUMMARY.md
@C:\GitHub\datagvat-mcp\.planning\phases\19-getting-started-content\19-01-SUMMARY.md
@C:\GitHub\datagvat-mcp\docs\workflows\meta.json
</context>

<tasks>

<task type="auto">
  <name>Create Comparative Analysis Workflow (WORK-04)</name>
  <files>docs/workflows/comparative-analysis.mdx</files>
  <action>
Create comparative dataset analysis workflow with complete content (not placeholders).

**Full structure** covering:
- Complete Example with multi-dataset comparison script
- Step by Step with 5 steps: Search for Multiple Candidates, Batch Quality Analysis, Schema Comparison, Create Comparison Matrix, Selection Decision
- Each step with expected outputs showing comparison data
- Verification checklists
- Decision matrix for selecting between datasets
- Troubleshooting section
- Cross-references to related guides and workflows

**Key differentiator:** Focuses on comparing multiple datasets side-by-side with matrix visualization for decision-making.

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" comparative-analysis.mdx && \
  grep -c "<Step>" comparative-analysis.mdx && \
  grep -c "Expected output:" comparative-analysis.mdx && \
  wc -l comparative-analysis.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
comparative-analysis.mdx exists with Complete Example/Step by Step tabs, 5-step comparison workflow, expected outputs showing multi-dataset comparison, decision matrix, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Create Publication Research Workflow (WORK-05)</name>
  <files>docs/workflows/publication-research.mdx</files>
  <action>
Create publication research workflow with complete content (not placeholders).

**Full structure** covering:
- Complete Example with academic research script
- Step by Step with 5 steps: Semantic Search with Quality Boost, Filter for Citation Quality (≥85), Verify Citation Information, Check Research License, Export Citation Metadata
- Each step with expected outputs showing citation-quality datasets
- Verification checklists for academic requirements
- Research license verification examples (CC-BY, CC0, ODbL)
- Troubleshooting section for citation data issues
- Cross-references to related guides and workflows

**Key differentiator:** Focuses on high-quality threshold (≥85) and citation metadata for academic publications.

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" publication-research.mdx && \
  grep -c "<Step>" publication-research.mdx && \
  grep -c "Expected output:" publication-research.mdx && \
  wc -l publication-research.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
publication-research.mdx exists with Complete Example/Step by Step tabs, 5-step publication workflow, expected outputs showing citation-quality datasets, research license checks, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Create Semantic Exploration Workflow (WORK-06)</name>
  <files>docs/workflows/semantic-exploration.mdx</files>
  <action>
Create semantic exploration workflow with complete content (not placeholders).

**Full structure** covering:
- Complete Example with iterative exploration script
- Step by Step with 5 steps: Initial Broad Semantic Search, Analyze Theme Distribution, Find Related Datasets, Iterative Refinement, Build Dataset Collection
- Each step with expected outputs showing exploration progression
- Verification checklists for domain discovery
- Examples of facet analysis and related dataset discovery
- Troubleshooting section for exploration challenges
- Cross-references to related guides and workflows

**Key differentiator:** Focuses on iterative discovery through semantic search, facet analysis, and related dataset traversal for unfamiliar domains.

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" semantic-exploration.mdx && \
  grep -c "<Step>" semantic-exploration.mdx && \
  grep -c "Expected output:" semantic-exploration.mdx && \
  wc -l semantic-exploration.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
semantic-exploration.mdx exists with Complete Example/Step by Step tabs, 5-step exploration workflow, expected outputs showing iterative discovery, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Update workflows meta.json with complete navigation</name>
  <files>docs/workflows/meta.json</files>
  <action>
Update workflows section navigation to include all 6 workflows in logical order.

**Current state:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Workflows",
  "description": "End-to-end workflow examples and scenarios",
  "icon": "Workflow",
  "root": true,
  "pages": []
}
```

**Updated configuration:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Workflows",
  "description": "Complete end-to-end workflows for common data tasks",
  "icon": "Workflow",
  "root": true,
  "pages": [
    "discovery",
    "quality-assessment",
    "data-export",
    "comparative-analysis",
    "publication-research",
    "semantic-exploration"
  ]
}
```

**Navigation order rationale:**
1. **discovery:** Most common workflow (start here)
2. **quality-assessment:** Natural follow-up to discovery
3. **data-export:** Automation/integration (intermediate)
4. **comparative-analysis:** Advanced (comparing multiple)
5. **publication-research:** Specialized (academic)
6. **semantic-exploration:** Exploratory (domain discovery)

Order follows complexity: basic → intermediate → advanced → specialized.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  cat meta.json | jq '.pages | length' && \
  cat meta.json | jq '.pages[0]' && \
  cat meta.json | jq '.pages[-1]'
```

Expected:
- pages array length: 6
- First page: "discovery"
- Last page: "semantic-exploration"
  </verify>
  <done>
meta.json updated with all 6 workflows in complexity order (discovery, quality-assessment, data-export, comparative-analysis, publication-research, semantic-exploration), description updated to emphasize end-to-end workflows
  </done>
</task>

</tasks>

<verification>
After completion:

1. **All Workflow Files Created:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && ls -1 *.mdx | wc -l
```
Expected: 6 files total

2. **Steps Component Usage:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -r "<Steps>" *.mdx | wc -l && \
  grep -r "<Step>" *.mdx | wc -l
```
Expected: 6 <Steps> wrappers, 30+ <Step> elements

3. **Expected Outputs Present:**
```bash
grep -r "Expected output:" docs/workflows/*.mdx | wc -l
```
Expected: 30+ instances (5+ per workflow)

4. **Cross-References:**
```bash
grep -r "/guides/" docs/workflows/*.mdx | wc -l && \
  grep -r "/workflows/" docs/workflows/*.mdx | wc -l
```
Expected: 18+ guide references, 12+ workflow cross-references

5. **Navigation Complete:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  cat meta.json | jq '.pages'
```
Expected: Array with all 6 workflows

6. **Line Counts:**
```bash
wc -l docs/workflows/comparative-analysis.mdx docs/workflows/publication-research.mdx docs/workflows/semantic-exploration.mdx
```
Expected: ~150-180 lines each
</verification>

<success_criteria>
1. comparative-analysis.mdx complete with comparison workflow (WORK-04 satisfied)
2. publication-research.mdx complete with research workflow (WORK-05 satisfied)
3. semantic-exploration.mdx complete with exploration workflow (WORK-06 satisfied)
4. All workflows use Steps component for sequential steps (WORK-07 satisfied)
5. Expected outputs shown at each step (COMP-02 requirement satisfied)
6. Cross-references connect workflows to guides
7. meta.json includes all 6 workflows in logical order
8. No placeholder content ("[Similar structure...]" removed)
</success_criteria>

<output>
After completion, create `.planning/phases/20-guides-and-workflows/20-03b-SUMMARY.md` following summary template. This completes the workflows portion of Phase 20.
</output>
