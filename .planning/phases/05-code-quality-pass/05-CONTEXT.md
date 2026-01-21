# Phase 5: Code Quality Pass - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix Biome linting warnings and clean up code examples. Remove emojis from code blocks, improve comments to explain WHY not WHAT, standardize code block titles, and enable clean builds without --no-verify.

This phase addresses technical debt from Phase 1 (Biome installed but warnings left in place) and Phase 4 (content rewritten, code quality untouched).

</domain>

<decisions>
## Implementation Decisions

### Biome fix strategy
- Run safe auto-fixes first: `bun run lint:fix`
- If warnings remain, use unsafe fixes with review: `bunx biome check --write --unsafe .`
- Target: 214 warnings → 0 warnings
- Review all changes carefully (some unsafe fixes change behavior)

### Emoji removal scope
- Remove emojis from:
  - Code block titles
  - Code comments inside code blocks
  - Code content (string literals with emojis)
- Search patterns: 🚀✨🔍📊⚡🎯💡🔥✅❌ and similar
- Verification: `grep -r "🚀\|✨\|🔍" content/docs` returns empty

### Code comment standards
- Comment WHY, not WHAT
- No emojis or decorative characters
- Reference RFCs/specs when relevant
- Keep under 80 characters per line
- Use proper grammar and punctuation

### Code block title format
- Use lowercase
- Use file extensions (.py, .ts, .sh)
- Use snake_case or kebab-case
- No emojis or decorative characters
- Examples: `search_example.py`, `fetch_data.ts`, `install.sh`

### Build validation criteria
- `bun run lint` passes with 0 errors/warnings
- `bun run validate` passes all checks
- `bun run build` succeeds without --no-verify
- No TypeScript errors, no link errors

### Claude's Discretion
- Specific wording of improved comments (as long as they explain WHY)
- Order of fixing files
- Whether to group commits by type or by file area

</decisions>

<specifics>
## Specific Ideas

**Comment transformation examples:**

Before:
```typescript
// get the data
const data = await fetch();
// loop through results 🔄
for (const item of data) { ... }
```

After:
```typescript
// Using streaming to handle large datasets efficiently
const data = await fetch();
// Filter results per ISO 8601 timestamp format
for (const item of data) { ... }
```

**Code block title transformation examples:**

Before: `🔍 Search Example`, `FETCH DATA`, `Run This!`
After: `search_example.py`, `fetch_data.ts`, `install.sh`

**Commit message patterns:**
- `fix: resolve all 214 Biome linting warnings`
- `refactor: remove emojis from code blocks and improve comments`
- `docs: standardize code block titles`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-code-quality-pass*
*Context gathered: 2026-01-21*
