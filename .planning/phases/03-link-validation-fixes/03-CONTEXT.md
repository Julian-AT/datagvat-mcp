# Phase 3: Link Validation & Fixes - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate and fix all internal and external links in documentation after Phase 2 navigation restructuring. Ensure all internal links work correctly, providing reliable navigation throughout the site. External link validation is secondary focus.

</domain>

<decisions>
## Implementation Decisions

### Validation Scope and Timing
- Use existing `bun run lint:links` command for validation
- Run validation before and after fixes to measure progress
- Document initial state in `.planning/broken-links-initial.txt`
- Zero link errors as success criteria

### Link Fixing Strategy
- **Bulk automated fixes** for known path changes from Phase 2 navigation restructuring
- Primary target: `/tools/*` → `/reference/tools/*` (Phase 2 migration)
- Use sed for bulk find-replace across all MDX files
- Fix both markdown links `](/tools/)` and component hrefs `href="/tools/"`

### Internal Link Categories
1. **Tool path updates** — Bulk sed replacement (automated)
2. **Component hrefs** — Search and update Card, Callout, Tabs components with broken hrefs
3. **Invalid anchors** — For each invalid anchor, either add missing heading or update link (manual review)

### Verification Approach
- Run `bun run lint:links` after all fixes
- Should return zero errors
- Checklist-based verification:
  - All `/tools/*` links updated to `/reference/tools/*`
  - Component hrefs updated
  - Invalid anchors fixed
  - Zero link errors reported

### Claude's Discretion
- Exact order of fix tasks (bulk first, then components, then anchors makes sense)
- How to handle edge cases in anchor fixing
- Whether to commit fixes atomically or in logical groups

</decisions>

<specifics>
## Specific Ideas

**Task breakdown provided:**
1. Run initial validation and capture baseline
2. Bulk fix tool paths with sed
3. Fix component hrefs (Card, Callout, Tabs)
4. Fix invalid anchors (add headings or update links)
5. Verify zero errors

**Command patterns:**
```bash
# Initial validation
cd docs
bun run lint:links 2>&1 | tee .planning/broken-links-initial.txt

# Bulk path updates
find docs/content/docs -name "*.mdx" -type f -exec sed -i 's|](/tools/|](/reference/tools/|g' {} \;
find docs/content/docs -name "*.mdx" -type f -exec sed -i 's|href="/tools/|href="/reference/tools/|g' {} \;

# Final verification
bun run lint:links  # Should return zero errors
```

**Deliverables expected:**
1. `.planning/broken-links-initial.txt` — baseline report
2. All links fixed and verified

</specifics>

<deferred>
## Deferred Ideas

None — user provided focused execution plan within phase scope.

</deferred>

---

*Phase: 03-link-validation-fixes*
*Context gathered: 2026-01-21*
