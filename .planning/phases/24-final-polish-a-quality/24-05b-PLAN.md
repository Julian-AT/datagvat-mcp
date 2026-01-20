---
phase: 24-final-polish-a-quality
plan: 05b
type: execute
wave: 2
depends_on: [24-05a]
files_modified:
  - docs/content/docs/best-practices/comparison-tables.mdx
  - docs/content/docs/best-practices/quality-interpretation.mdx
  - docs/content/docs/best-practices/rate-limiting.mdx
  - docs/content/docs/getting-started/first-query.mdx
  - docs/content/docs/getting-started/installation.mdx
  - docs/content/docs/getting-started/installation.de.mdx
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "All code blocks have valid language declarations"
    - "Syntax highlighting verification reports zero invalid blocks"
    - "Documentation renders with proper code highlighting"
  artifacts:
    - path: "docs/content/docs/getting-started/*.mdx"
      provides: "Getting started docs with valid code blocks"
      min_lines: 50
    - path: "docs/content/docs/best-practices/*.mdx"
      provides: "Best practices docs with valid code blocks"
      min_lines: 50
  key_links:
    - from: "docs/content/docs/**/*.mdx"
      to: "syntax highlighting"
      via: "code fence language declarations in triple-backtick blocks"
---

<objective>
Fix remaining 8 empty code blocks in second batch (6 files).

**Purpose:** Complete syntax highlighting gap closure by fixing remaining empty code blocks after 24-05a completed first batch.

**Output:** All 766 code blocks have valid language declarations and render with correct syntax highlighting.
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
@C:\GitHub\datagvat-mcp\.planning\phases\24-final-polish-a-quality\24-05a-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Fix remaining empty language declarations (8 blocks, 6 files)</name>
  <files>
docs/content/docs/best-practices/comparison-tables.mdx
docs/content/docs/best-practices/quality-interpretation.mdx
docs/content/docs/best-practices/rate-limiting.mdx
docs/content/docs/getting-started/first-query.mdx
docs/content/docs/getting-started/installation.mdx
docs/content/docs/getting-started/installation.de.mdx
  </files>
  <action>
Fix remaining 8 code blocks with empty language declarations by adding appropriate language identifiers.

**Language mapping (file:line:language):**

```
best-practices/comparison-tables.mdx:
  - Line 142: → typescript
  - Line 293: → json

best-practices/quality-interpretation.mdx:
  - Line 415: → bash

best-practices/rate-limiting.mdx:
  - Line 26: → typescript
  - Line 89: → json

getting-started/first-query.mdx:
  - Line 28: → bash
  - Line 81: → typescript
  - Line 140: → json
  - Line 179: → bash

getting-started/installation.mdx:
  - Line 47: → bash
  - Line 375: → typescript
  - Line 475: → yaml
  - Line 502: → bash

getting-started/installation.de.mdx:
  - Line 22: → bash
  - Line 375: → typescript
  - Line 396: → yaml
  - Line 426: → bash
```

**Note:** Mapping shows 16 blocks, but some may already be fixed or detection needs verification. Focus on blocks that verify-syntax-highlighting.ts reports as empty.

**Implementation approach:**
1. Run verify-syntax-highlighting.ts to get current empty block locations
2. For each empty block, read context to confirm language inference
3. Update ``` to ```<language> based on content
4. Verify language matches content (bash for shell commands, typescript for code, json for data, yaml for config)

**Wiring:** These updates connect code fence markers to language identifiers, enabling syntax highlighters to properly parse and style code blocks throughout the getting-started and best-practices documentation sections.
  </action>
  <verify>
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts
```

Expected output:
- Total blocks: 766
- Valid blocks: 766 (100%)
- Invalid blocks: 0
- No "(empty)" language warnings

Also verify no empty fences in modified files:
```bash
cd docs && grep -n '```$' content/docs/best-practices/*.mdx content/docs/getting-started/*.mdx
```

Expected: No matches (all code fences have languages).
  </verify>
  <done>
- All 8+ remaining empty code blocks fixed with appropriate language declarations
- verify-syntax-highlighting.ts reports 766/766 valid blocks (100%)
- No "(empty)" language warnings in validation output
- All language assignments match content type
  </done>
</task>

<task type="auto">
  <name>Verify production build with fixed syntax highlighting</name>
  <files>N/A</files>
  <action>
Verify that all syntax highlighting fixes allow production documentation to render correctly.

Run production build:
```bash
cd docs && npm run build
```

Expected outcomes:
- Build completes successfully
- No warnings about code block parsing
- Syntax highlighting renders correctly in built pages

**Spot-check rendered pages:**
After build, sample check 2-3 fixed files in `.next/` output to confirm code blocks have syntax highlighting classes applied.
  </action>
  <verify>
```bash
cd docs && npm run build 2>&1 | grep -i "code block\|syntax"
```

Expected: No warnings about code block issues.

Also verify build success:
```bash
echo $?
```

Expected: Exit code 0.
  </verify>
  <done>
- Production build completes successfully
- No code block parsing warnings
- Documentation renders with proper syntax highlighting
- All 766 code blocks validated
  </done>
</task>

</tasks>

<verification>
**Overall phase checks:**

1. Syntax validation passes 100%:
```bash
cd docs && npx tsx scripts/verify-syntax-highlighting.ts
```
Expected: 766 valid blocks, 0 invalid

2. No empty code fences remain:
```bash
cd docs && find content/docs -name "*.mdx" -exec grep -l '```$' {} \;
```
Expected: No matches

3. Build verification:
```bash
cd docs && npm run build
```
Expected: Success with no code block warnings

**Gap closure verification:**
- Gap truth "All code blocks have valid syntax highlighting" now achieved
- QUAL-02 requirement (syntax highlighting for all languages) fully satisfied
- 19 invalid blocks reduced to 0
</verification>

<success_criteria>
**This gap closure plan succeeds when:**

1. verify-syntax-highlighting.ts reports 766/766 valid blocks (100%)
2. Zero "(empty)" language declarations remain
3. All 8+ remaining empty blocks updated with correct language declarations
4. Language assignments validated to match content
5. Production build completes without code block warnings

**Measurable outcomes:**
- `npx tsx scripts/verify-syntax-highlighting.ts` shows 0 invalid blocks
- Git diff shows ~8+ lines changed (empty code fences)
- Build completes with exit code 0
- QUAL-02 gap fully closed
</success_criteria>

<output>
After completion, create `.planning/phases/24-final-polish-a-quality/24-05b-SUMMARY.md` with:
- Language mapping table with file:line:language for second batch
- Final validation statistics (766/766 valid)
- Complete gap closure confirmation for QUAL-02
- Combined summary of 24-05a + 24-05b efforts
</output>
