---
phase: 24-final-polish-a-quality
plan: 05a
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/scripts/verify-syntax-highlighting.ts
  - docs/content/docs/advanced/architecture.mdx
  - docs/content/docs/advanced/error-handling.mdx
  - docs/content/docs/advanced/fastmcp-internals.mdx
  - docs/content/docs/advanced/testing.mdx
  - docs/content/docs/best-practices/comparison-tables.mdx
  - docs/content/docs/best-practices/quality-interpretation.mdx
  - docs/content/docs/best-practices/rate-limiting.mdx
  - docs/content/docs/getting-started/first-query.mdx
  - docs/content/docs/getting-started/installation.mdx
  - docs/content/docs/getting-started/installation.de.mdx
  - docs/content/docs/getting-started/quickstart.mdx
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "All code blocks in first batch have valid language declarations"
    - "Powershell language recognized as valid"
    - "Syntax highlighting verification shows reduced invalid count"
  artifacts:
    - path: "docs/scripts/verify-syntax-highlighting.ts"
      provides: "Syntax validation with powershell support"
      contains: "powershell"
    - path: "docs/content/docs/advanced/*.mdx"
      provides: "Advanced docs with valid code blocks"
      min_lines: 100
    - path: "docs/content/docs/best-practices/*.mdx"
      provides: "Best practices docs with valid code blocks"
      min_lines: 50
    - path: "docs/content/docs/getting-started/*.mdx"
      provides: "Getting started docs with valid code blocks"
      min_lines: 50
  key_links:
    - from: "docs/content/docs/**/*.mdx"
      to: "syntax highlighting"
      via: "code fence language declarations in triple-backtick blocks"
---

<objective>
Fix powershell validation and empty code blocks in first batch (30 blocks across 11 files).

**Purpose:** Phase 24 verification found 64 code blocks with invalid/empty language declarations. This plan addresses powershell support + first ~30 blocks across advanced/, best-practices/, and getting-started/ directories.

**Output:** First batch of files have valid language declarations, powershell recognized, ~47% of invalid blocks resolved.
</objective>

<execution_context>
@C:\GitHub\datagvat-mcp\.planning\get-shit-done\workflows\execute-plan.md
@C:\GitHub\datagvat-mcp\.planning\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\GitHub\datagvat-mcp\.planning\PROJECT.md
@C:\GitHub\datagvat-mcp\.planning\ROADMAP.md
@C:\GitHub\datagvat-mcp\.planning\STATE.md
@C:\GitHub\datagvat-mcp\.planning\phases\24-final-polish-a-quality\24-VERIFICATION.md
@C:\GitHub\datagvat-mcp\docs\scripts\verify-syntax-highlighting.ts
</context>

<tasks>

<task type="auto">
  <name>Add powershell to VALID_LANGUAGES array</name>
  <files>docs/scripts/verify-syntax-highlighting.ts</files>
  <action>
Update the VALID_LANGUAGES array to include 'powershell' as a recognized language.

1. Read verify-syntax-highlighting.ts
2. Find the VALID_LANGUAGES array (should be near top of file)
3. Add 'powershell' to the array in alphabetical order
4. Save file

Current array likely contains: bash, json, python, typescript, yaml
Add: powershell (between json and python alphabetically)

**Why:** One code block in workflows/data-export.mdx uses `powershell` language which is valid but not in validation whitelist.

**Wiring:** This update connects the validator to recognize powershell blocks in MDX files by adding 'powershell' to the whitelist array that's checked in the file scanning loop.
  </action>
  <verify>
```bash
cd docs && grep "powershell" scripts/verify-syntax-highlighting.ts
```

Expected: Line showing 'powershell' in VALID_LANGUAGES array.
  </verify>
  <done>
- VALID_LANGUAGES array includes 'powershell'
- verify-syntax-highlighting.ts no longer flags powershell as invalid
  </done>
</task>

<task type="auto">
  <name>Fix empty language declarations in first batch (30 blocks, 11 files)</name>
  <files>
docs/content/docs/advanced/architecture.mdx
docs/content/docs/advanced/error-handling.mdx
docs/content/docs/advanced/fastmcp-internals.mdx
docs/content/docs/advanced/testing.mdx
docs/content/docs/best-practices/comparison-tables.mdx
docs/content/docs/best-practices/quality-interpretation.mdx
docs/content/docs/best-practices/rate-limiting.mdx
docs/content/docs/getting-started/first-query.mdx
docs/content/docs/getting-started/installation.mdx
docs/content/docs/getting-started/installation.de.mdx
docs/content/docs/getting-started/quickstart.mdx
  </files>
  <action>
Fix 30 code blocks with empty language declarations by adding appropriate language identifiers.

**Language mapping by directory (actual script output):**

**advanced/ (8 blocks):**
- architecture.mdx: 3 blocks
- error-handling.mdx: 3 blocks
- fastmcp-internals.mdx: 1 block
- testing.mdx: 1 block

**best-practices/ (5 blocks):**
- comparison-tables.mdx: 2 blocks
- quality-interpretation.mdx: 1 block
- rate-limiting.mdx: 2 blocks

**getting-started/ (11 blocks):**
- first-query.mdx: 4 blocks
- installation.mdx: 5 blocks
- installation.de.mdx: 4 blocks
- quickstart.mdx: 2 blocks

**Implementation approach:**
1. Run verify-syntax-highlighting.ts to confirm exact line numbers for all 30 blocks
2. For each file, read the empty code block locations
3. Infer language from surrounding context:
   - Shell commands → bash
   - Code with types/interfaces → typescript
   - JSON objects/arrays → json
   - YAML config with key:value → yaml
4. Use Read + Write tools to update each ``` to ```<language>
5. Verify language matches content

**Wiring:** These updates connect code fence opening markers (```) to language identifiers that enable Shiki/Prism syntax highlighters to parse and render the code blocks correctly in the documentation site.
  </action>
  <verify>
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts | grep -E "(Invalid|empty)" | grep -E "(advanced/|best-practices/|getting-started/)"
```

Expected: Significantly reduced matches for these directories.

Also verify total invalid count reduced:
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts | grep "Invalid blocks:"
```

Expected: Invalid blocks reduced from 64 to ~34 (approximately 30 fixed).
  </verify>
  <done>
- 30 empty code blocks fixed with appropriate language declarations
- All language assignments match content type (bash/typescript/json/yaml)
- No "(empty)" warnings for first batch files
- verify-syntax-highlighting.ts shows ~50% reduction in invalid count (64 → ~34)
  </done>
</task>

</tasks>

<verification>
**Overall phase checks:**

1. Powershell language recognized:
```bash
cd docs && grep "powershell" scripts/verify-syntax-highlighting.ts
```
Expected: Found in VALID_LANGUAGES array

2. First batch invalid count reduced:
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts
```
Expected: Invalid blocks reduced from 64 to ~34

3. No empty blocks in first batch files:
```bash
cd docs && grep -n '```$' content/docs/advanced/*.mdx content/docs/best-practices/*.mdx content/docs/getting-started/*.mdx
```
Expected: Significantly reduced or zero matches

**Gap closure verification:**
- Partial closure of QUAL-02 (syntax highlighting for all languages)
- 30 of 64 invalid blocks resolved (~47%)
</verification>

<success_criteria>
**This gap closure plan succeeds when:**

1. VALID_LANGUAGES array includes 'powershell'
2. 30 empty code blocks updated with language declarations
3. Invalid block count reduced from 64 to ~34
4. All language assignments validated against content
5. No new invalid blocks introduced

**Measurable outcomes:**
- `grep "powershell" scripts/verify-syntax-highlighting.ts` shows match
- `npx tsx scripts/verify-syntax-highlighting.ts` shows ~34 invalid blocks remaining
- Git diff shows ~31 lines changed (1 VALID_LANGUAGES + 30 code fences)
</success_criteria>

<output>
After completion, create `.planning/phases/24-final-polish-a-quality/24-05a-SUMMARY.md` with:
- Language mapping table with file:block-count:languages
- Before/after invalid counts (64 → ~34)
- Partial gap closure progress for QUAL-02 (~47% complete)
</output>
