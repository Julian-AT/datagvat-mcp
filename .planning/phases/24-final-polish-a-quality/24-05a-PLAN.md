---
phase: 24-final-polish-a-quality
plan: 05a
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/scripts/verify-syntax-highlighting.ts
  - docs/content/docs/workflows/data-export.mdx
  - docs/content/docs/advanced/architecture.mdx
  - docs/content/docs/advanced/error-handling.mdx
  - docs/content/docs/advanced/fastmcp-internals.mdx
  - docs/content/docs/advanced/testing.mdx
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
  key_links:
    - from: "docs/content/docs/**/*.mdx"
      to: "syntax highlighting"
      via: "code fence language declarations in triple-backtick blocks"
---

<objective>
Fix powershell validation and empty code blocks in first batch (6 files, 10 blocks).

**Purpose:** Phase 24 verification found 19 code blocks with invalid/empty language declarations. This plan addresses powershell + first 10 empty blocks across 6 files.

**Output:** First batch of files have valid language declarations, powershell recognized.
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
  <name>Fix empty language declarations in first batch (10 blocks, 6 files)</name>
  <files>
docs/content/docs/workflows/data-export.mdx
docs/content/docs/advanced/architecture.mdx
docs/content/docs/advanced/error-handling.mdx
docs/content/docs/advanced/fastmcp-internals.mdx
docs/content/docs/advanced/testing.mdx
  </files>
  <action>
Fix 10 code blocks with empty language declarations by adding appropriate language identifiers.

**Language mapping (file:line:language):**

```
workflows/data-export.mdx:
  - Line [inspect]: → powershell (already has language, verify only)

advanced/architecture.mdx:
  - Line 12: → bash
  - Line 232: → typescript
  - Line 385: → yaml

advanced/error-handling.mdx:
  - Line 15: → typescript
  - Line 214: → json
  - Line 455: → bash

advanced/fastmcp-internals.mdx:
  - Line 482: → typescript

advanced/testing.mdx:
  - Line 29: → typescript
```

**Implementation approach:**
1. Run verify-syntax-highlighting.ts to confirm exact line numbers
2. For each file, read around the target lines to verify language inference
3. Use Read + Write tools to update each ``` to ```<language>
4. Verify language matches content (bash for commands, typescript for code, json for objects, yaml for config)

**Wiring:** These updates connect code fence opening markers (```) to language identifiers that enable Shiki/Prism syntax highlighters to parse and render the code blocks correctly in the documentation site.
  </action>
  <verify>
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts | grep -E "(Invalid|empty)" | grep -E "(data-export|architecture|error-handling|fastmcp-internals|testing)"
```

Expected: Zero matches for these 6 files (no empty/invalid warnings).

Also verify total invalid count reduced:
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts | grep "Invalid blocks:"
```

Expected: Invalid blocks reduced by 10 (from 19 to 9 remaining).
  </verify>
  <done>
- 10 empty code blocks fixed with appropriate language declarations
- All language assignments match content type
- No "(empty)" warnings for first batch files
- verify-syntax-highlighting.ts shows reduced invalid count
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
Expected: Invalid blocks reduced from 19 to ~9

3. No empty blocks in first batch files:
```bash
cd docs && grep -n '```$' content/docs/advanced/architecture.mdx content/docs/advanced/error-handling.mdx content/docs/advanced/fastmcp-internals.mdx content/docs/advanced/testing.mdx
```
Expected: No matches (all code fences have languages)

**Gap closure verification:**
- Partial closure of QUAL-02 (syntax highlighting for all languages)
- 10 of 19 invalid blocks resolved
</verification>

<success_criteria>
**This gap closure plan succeeds when:**

1. VALID_LANGUAGES array includes 'powershell'
2. 10 empty code blocks updated with language declarations
3. Invalid block count reduced by 10 (from 19 to 9)
4. All language assignments validated against content
5. No new invalid blocks introduced

**Measurable outcomes:**
- `grep "powershell" scripts/verify-syntax-highlighting.ts` shows match
- `npx tsx scripts/verify-syntax-highlighting.ts` shows 9 invalid blocks remaining
- Git diff shows ~11 lines changed (1 VALID_LANGUAGES + 10 code fences)
</success_criteria>

<output>
After completion, create `.planning/phases/24-final-polish-a-quality/24-05a-SUMMARY.md` with:
- Language mapping table with file:line:language
- Before/after invalid counts (19 → 9)
- Partial gap closure progress for QUAL-02
</output>
