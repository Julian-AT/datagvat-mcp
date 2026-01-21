---
phase: 24-final-polish-a-quality
plan: 05b
type: execute
wave: 2
depends_on: [24-05a]
files_modified:
  - docs/content/docs/guides/configuration.mdx
  - docs/content/docs/guides/configuration.de.mdx
  - docs/content/docs/guides/searching.mdx
  - docs/content/docs/guides/setup.mdx
  - docs/content/docs/guides/setup.de.mdx
  - docs/content/docs/guides/workflow-patterns.mdx
  - docs/content/docs/integration/claude-desktop.mdx
  - docs/content/docs/integration/other-clients.mdx
  - docs/content/docs/workflows/comparative-analysis.mdx
  - docs/content/docs/workflows/data-export.mdx
  - docs/content/docs/workflows/publication-research.mdx
  - docs/content/docs/workflows/quality-assessment.mdx
  - docs/content/docs/workflows/semantic-exploration.mdx
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "All code blocks have valid language declarations"
    - "Syntax highlighting verification reports zero invalid blocks"
    - "Documentation renders with proper code highlighting"
  artifacts:
    - path: "docs/content/docs/guides/*.mdx"
      provides: "Guides docs with valid code blocks"
      min_lines: 50
    - path: "docs/content/docs/integration/*.mdx"
      provides: "Integration docs with valid code blocks"
      min_lines: 50
    - path: "docs/content/docs/workflows/*.mdx"
      provides: "Workflows docs with valid code blocks"
      min_lines: 50
  key_links:
    - from: "docs/content/docs/**/*.mdx"
      to: "syntax highlighting"
      via: "code fence language declarations in triple-backtick blocks"
---

<objective>
Fix remaining 34 empty code blocks in second batch (13 files across guides/, integration/, workflows/).

**Purpose:** Complete syntax highlighting gap closure by fixing remaining empty code blocks after 24-05a completed first batch (30 blocks).

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
  <name>Fix remaining empty language declarations (34 blocks, 13 files)</name>
  <files>
docs/content/docs/guides/configuration.mdx
docs/content/docs/guides/configuration.de.mdx
docs/content/docs/guides/searching.mdx
docs/content/docs/guides/setup.mdx
docs/content/docs/guides/setup.de.mdx
docs/content/docs/guides/workflow-patterns.mdx
docs/content/docs/integration/claude-desktop.mdx
docs/content/docs/integration/other-clients.mdx
docs/content/docs/workflows/comparative-analysis.mdx
docs/content/docs/workflows/data-export.mdx
docs/content/docs/workflows/publication-research.mdx
docs/content/docs/workflows/quality-assessment.mdx
docs/content/docs/workflows/semantic-exploration.mdx
  </files>
  <action>
Fix remaining 34 code blocks with empty language declarations by adding appropriate language identifiers.

**Language mapping by directory (actual script output):**

**guides/ (12 blocks):**
- configuration.mdx: 1 block
- configuration.de.mdx: 1 block
- searching.mdx: 4 blocks
- setup.mdx: 4 blocks
- setup.de.mdx: 4 blocks
- workflow-patterns.mdx: 1 block

**integration/ (7 blocks):**
- claude-desktop.mdx: 5 blocks
- other-clients.mdx: 2 blocks

**workflows/ (21 blocks):**
- comparative-analysis.mdx: 2 blocks
- data-export.mdx: 4 blocks (5 total minus 1 powershell already valid)
- publication-research.mdx: 4 blocks
- quality-assessment.mdx: 2 blocks
- semantic-exploration.mdx: 2 blocks

**Note:** data-export.mdx has 5 blocks reported by script: 4 empty + 1 powershell (now valid after 24-05a).

**Implementation approach:**
1. Run verify-syntax-highlighting.ts to get current empty block locations after 24-05a
2. For each empty block, read context to confirm language inference
3. Infer language from content:
   - Shell commands, npm/pip commands → bash
   - Code with types/interfaces/functions → typescript
   - JSON objects/arrays → json
   - YAML config with key:value → yaml
   - Windows commands (if any) → powershell (now supported)
4. Update ``` to ```<language> based on content
5. Verify language matches content

**Wiring:** These updates connect code fence markers to language identifiers, enabling syntax highlighters to properly parse and style code blocks throughout the guides, integration, and workflows documentation sections.
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
cd docs && grep -n '```$' content/docs/guides/*.mdx content/docs/integration/*.mdx content/docs/workflows/*.mdx
```

Expected: No matches (all code fences have languages).
  </verify>
  <done>
- All 34 remaining empty code blocks fixed with appropriate language declarations
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
- 64 invalid blocks reduced to 0 (30 in 24-05a + 34 in 24-05b)
</verification>

<success_criteria>
**This gap closure plan succeeds when:**

1. verify-syntax-highlighting.ts reports 766/766 valid blocks (100%)
2. Zero "(empty)" language declarations remain
3. All 34 remaining empty blocks updated with correct language declarations
4. Language assignments validated to match content
5. Production build completes without code block warnings

**Measurable outcomes:**
- `npx tsx scripts/verify-syntax-highlighting.ts` shows 0 invalid blocks
- Git diff shows ~34 lines changed (empty code fences)
- Build completes with exit code 0
- QUAL-02 gap fully closed
</success_criteria>

<output>
After completion, create `.planning/phases/24-final-polish-a-quality/24-05b-SUMMARY.md` with:
- Language mapping table with file:block-count:languages for second batch
- Final validation statistics (766/766 valid)
- Complete gap closure confirmation for QUAL-02
- Combined summary of 24-05a (30 blocks) + 24-05b (34 blocks) = 64 total fixed
</output>
