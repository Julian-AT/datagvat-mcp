# Phase 4: Documentation Style Guide Compliance - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply Microsoft/Google style guide conventions to all documentation. Ensure professional tone, consistent terminology, standardized formatting (headings, lists, structure), and industry-standard documentation comments. Focus on rewriting existing content to meet professional standards, not adding new capabilities.

</domain>

<decisions>
## Implementation Decisions

### Execution Strategy
- **Manual review and rewriting** following Microsoft/Google style guides (not automated transformation)
- **Batch-based execution** — 7 batches organized by documentation section
- **Verification per batch** — checklist-based review before committing
- **Atomic commits per batch** — each batch gets its own commit

### Style Principles (Microsoft/Google Standards)
1. **Active voice, second person** — "You can search datasets" not "Datasets can be searched"
2. **Present tense** — "The tool returns results" not "The tool will return results"
3. **Contractions allowed** — "don't" not "do not" for natural tone
4. **Sentence case headings** — "Getting started" not "Getting Started"
5. **Serial comma** — "red, white, and blue"
6. **Short sentences** — <25 words preferred
7. **Code before explanation** — Show example first, then explain
8. **Specific over generic** — Use real dataset names (e.g., "Bevölkerung Wien 2020-2024")
9. **No marketing language** — Professional technical writing, not promotional

### Anti-Patterns to Eliminate
**AI buzzwords to remove:**
- delve, leverage, utilize, harness, robust, comprehensive, seamless

**Generic openers to remove:**
- "In today's...", "In the realm of..."

**Other issues:**
- Excessive em-dashes
- Generic examples (replace with real dataset names)
- Uniform sentence structure (vary for readability)

### Batch Execution Plan

**Batch 1 - Getting Started (3-4 pages):**
- Review and rewrite each page using templates
- Focus on action-first structure

**Batch 2 - Workflows (6 pages):**
- Use Step 1, Step 2 structure
- Add Prerequisites sections
- Add What You Accomplished sections

**Batch 3 - Guides (8-10 pages):**
- Add "When to Use This" sections
- Task-oriented titles maintained

**Batch 4 - Tool Reference (15-20 pages):**
- Standardize structure: Purpose → Parameters → Examples → Common Issues
- Consistent parameter documentation

**Batch 5 - Examples (5-8 pages):**
- Replace all generic examples with actual dataset names
- Use real Austrian government data examples

**Batch 6 - Advanced (6-8 pages):**
- Technical accuracy focus
- Maintain depth while improving clarity

**Batch 7 - Integration & Best Practices (6-8 pages):**
- Be prescriptive (not just descriptive)
- Clear guidance on what to do

### Verification Checklist (Per Batch)
- [ ] No AI buzzwords present
- [ ] Real dataset examples used (not generic placeholders)
- [ ] Natural contractions present
- [ ] Professional code comments (no casual language)
- [ ] Build succeeds (`bun run build`)

### Commit Format (Per Batch)
```bash
git commit -m "docs({section}): rewrite following MS/Google style

- Remove AI buzzwords
- Add concrete examples
- Conversational tone"
```

Example: `docs(getting-started): rewrite following MS/Google style`

### Claude's Discretion
- Exact wording choices within style guide constraints
- Specific examples to use from Austrian open data catalog
- Order of rewrites within each batch
- Degree of structural changes needed per page

</decisions>

<specifics>
## Specific Ideas

**Real dataset examples to use:**
- "Bevölkerung Wien 2020-2024" (Vienna population data)
- Other actual datasets from data.gv.at catalog (to be selected during implementation)

**Tone reference:**
- Professional technical writing
- Conversational (contractions OK)
- Second person ("you can")
- Not promotional or marketing-oriented

**Structural patterns:**
- Code examples come BEFORE explanations (show, then tell)
- Prerequisites sections in workflows
- "When to Use This" sections in guides
- Standardized reference page structure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Focus is on rewriting existing documentation to professional standards, not adding new content or capabilities.

</deferred>

---

*Phase: 04-documentation-style-guide-compliance*
*Context gathered: 2026-01-21*
