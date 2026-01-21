---
phase: 02-navigation-restructuring
plan: 03b
type: execute
wave: 3
depends_on: [02-03a]
files_modified:
  - docs/content/docs/meta.json
  - docs/content/docs/getting-started/meta.json
  - docs/content/docs/(guides)/guides/meta.json
  - docs/content/docs/(guides)/workflows/meta.json
  - docs/content/docs/(guides)/examples/meta.json
  - docs/content/docs/(advanced)/integration/meta.json
  - docs/content/docs/(advanced)/best-practices/meta.json
autonomous: false

must_haves:
  truths:
    - "Documentation has 3-4 clear top-level navigation groups (reduced from 8)"
    - "Users can reach any page in 3 clicks or fewer"
    - "Navigation structure identical across all pages"
    - "Visual hierarchy clear with separators and logical grouping"
  artifacts:
    - path: "docs/content/docs/meta.json"
      provides: "Root navigation with folder groups and separators"
      contains: "\\(guides\\)"
      min_lines: 15
  key_links:
    - from: "docs/content/docs/meta.json"
      to: "folder groups"
      via: "(guides) and (advanced) references"
      pattern: "\\(guides\\)"
    - from: "(guides)/guides/meta.json"
      to: "top-level navigation"
      via: "root: true"
      pattern: "root.*true"
---

<objective>
Implement final navigation structure with root meta.json updates, section enhancements, and human verification of navigation rendering.

Purpose: Complete the navigation restructure by updating root meta.json to reference folder groups, enhancing section meta.json files with icons and descriptions, and verifying the complete navigation structure renders correctly with 3-4 clear groups and ≤3 click depth.

Output:
- Root meta.json with folder group references and separators
- Enhanced section meta.json files with icons and descriptions
- Verified navigation rendering with folder groups appearing as siblings
- Confirmed 3-4 top-level groups and ≤3 click depth
</objective>

<execution_context>
@C:/GitHub/datagvat-mcp/.planning/get-shit-done/workflows/execute-plan.md
@C:/GitHub/datagvat-mcp/.planning/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/GitHub/datagvat-mcp/.planning/PROJECT.md
@C:/GitHub/datagvat-mcp/.planning/ROADMAP.md
@C:/GitHub/datagvat-mcp/.planning/STATE.md
@C:/GitHub/datagvat-mcp/.planning/phases/02-navigation-restructuring/02-CONTEXT.md
@C:/GitHub/datagvat-mcp/.planning/phases/02-navigation-restructuring/02-RESEARCH.md

# Dependency outputs
@C:/GitHub/datagvat-mcp/.planning/phases/02-navigation-restructuring/syntax-support.md
@C:/GitHub/datagvat-mcp/.planning/phases/02-navigation-restructuring/02-03a-SUMMARY.md

# Current state after Plan 02-03a
@C:/GitHub/datagvat-mcp/docs/content/docs/meta.json
@C:/GitHub/datagvat-mcp/docs/content/docs/reference/meta.json
@C:/GitHub/datagvat-mcp/docs/content/docs/(guides)/guides/meta.json
@C:/GitHub/datagvat-mcp/docs/content/docs/(advanced)/integration/meta.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement root meta.json with final navigation structure</name>
  <files>
    docs/content/docs/meta.json
  </files>
  <action>
Update root meta.json to implement target navigation structure based on verified syntax from Plan 02-01:

**Use ONLY verified syntax from syntax-support.md.** If Plan 02-01 found certain features unsupported (external links, icon separators, etc.), adapt this structure accordingly.

**Proposed structure (adapt based on 02-01 results):**

```json
{
  "$schema": "..\\..\\..\\docs\\.source\\json-schema\\docs.meta.json",
  "pages": [
    "getting-started",
    "---Documentation---",
    "(guides)",
    "---Reference---",
    "reference",
    "---Advanced Topics---",
    "(advanced)"
  ]
}
```

**Adaptations based on syntax verification:**

IF icon separators work (`---[Icon]Label---`):
- Use `"---[BookOpen]Documentation---"`, `"---[Code]Reference---"`, `"---[Wrench]Advanced Topics---"`

IF icon separators don't work:
- Use plain separators as shown above

IF external links work (`external:[Text](url)`):
- Add after (advanced):
  ```json
  "---Resources---",
  "external:[Official data.gv.at API](https://www.data.gv.at/katalog/api/3/)",
  "external:[GitHub Repository](https://github.com/bundesAPI/datagvat-mcp)"
  ```

IF external links don't work:
- Create a resources.mdx page with external links instead

**Folder reference syntax:**
- `"(guides)"` references the folder group - all contained root folders appear in navigation
- `"reference"` references the reference/ root folder

**DO NOT include:** tools (now under reference/), tutorials (decide based on content)

**Order rationale:**
1. getting-started - always first (onboarding)
2. Documentation separator + (guides) group - core learning content
3. Reference separator + reference - lookup documentation
4. Advanced Topics separator + (advanced) group - power user content
  </action>
  <verify>
1. cat docs/content/docs/meta.json shows updated structure
2. Verify pages array includes: getting-started, (guides), reference, (advanced)
3. Verify separators present (syntax based on 02-01 results)
4. No invalid syntax from unsupported features
5. **Build verification:** cd docs && bun run build completes successfully without meta.json errors
  </verify>
  <done>
Root meta.json updated with final navigation structure using verified syntax, build succeeds without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Enhance section meta.json with icons and descriptions</name>
  <files>
    docs/content/docs/getting-started/meta.json
    docs/content/docs/(guides)/guides/meta.json
    docs/content/docs/(guides)/workflows/meta.json
    docs/content/docs/(guides)/examples/meta.json
    docs/content/docs/(advanced)/integration/meta.json
    docs/content/docs/(advanced)/best-practices/meta.json
    docs/content/docs/(advanced)/advanced/meta.json
  </files>
  <action>
Enhance each section's meta.json with appropriate icons and clear descriptions:

**getting-started/meta.json:**
- Icon: "Rocket" (already set - verify present)
- Description: "Quick start guide and installation instructions" (already set - verify)
- Ensure "root": true and "defaultOpen": true

**guides/meta.json:**
- Icon: "BookOpen" (change from "Book" to match documentation separator theme)
- Description: "Task-oriented guides for common data.gv.at MCP Server workflows"
- Ensure "root": true

**workflows/meta.json:**
- Icon: "Workflow" (already set - verify)
- Description: "Complete end-to-end workflows for common data tasks"
- Ensure "root": true

**examples/meta.json:**
- Icon: "Code" (already set - verify)
- Description: "Real-world examples showing search patterns, data previews, and complete workflows"
- Ensure "root": true

**integration/meta.json:**
- Icon: "Plug"
- Description: "Integration guides for Claude Desktop, custom clients, and FastMCP internals"
- Ensure "root": true

**best-practices/meta.json:**
- Icon: "CheckCircle"
- Description: "Best practices for optimization, quality assessment, and efficient API usage"
- Ensure "root": true

**advanced/meta.json:**
- Icon: "Settings"
- Description: "Advanced topics and configuration"
- Ensure "root": true

**Icon choices rationale:**
- All icons verified in lucide-react library (BookOpen, Workflow, Code, Plug, CheckCircle, Settings, Rocket)
- Semantic meaning matches section content
- Visual distinctiveness in navigation

**Update $schema if needed:**
After folder moves in Plan 02-03a, verify all $schema paths are correct relative paths.
  </action>
  <verify>
1. grep "icon" docs/content/docs/*/meta.json docs/content/docs/(*)/*/*/meta.json shows all sections have icons
2. grep "description" shows all sections have descriptions
3. grep "root.*true" shows all 7 sections have root: true
4. All icons are valid lucide-react names (verify against lucide.dev if uncertain)
5. **Build verification:** cd docs && bun run build completes successfully
  </verify>
  <done>
All section meta.json files enhanced with icons and descriptions, all have root: true, build succeeds without errors.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete navigation restructure from 8 flat root sections to 3-4 organized groups using folder groups, verified meta.json syntax, and visual hierarchy with separators.

**Architecture implemented:**
- Getting Started (standalone root folder)
- Documentation group: Guides, Workflows, Examples (folder group)
- Reference (root folder with Tools subfolder)
- Advanced Topics group: Integration, Best Practices, Advanced (folder group)

**Features used:**
- Folder groups with parentheses syntax for logical organization
- Separators for visual hierarchy (plain or with icons depending on 02-01 results)
- Root folders with icons and descriptions
- 3-click maximum depth to any page
  </what-built>
  <how-to-verify>
**Visual and functional verification of navigation restructure:**

1. **Start development server:**
   ```bash
   cd docs
   bun run dev
   ```
   Navigate to http://localhost:3000

2. **Verify top-level navigation structure:**
   - Count top-level navigation items in sidebar
   - Expected: 3-4 main groups (Getting Started, ~3 in Documentation group, Reference, ~3 in Advanced group)
   - NOT expected: 8 flat root-level items
   - Verify visual separators appear between groups (if implemented)

3. **Test navigation depth:**
   For each of these pages, count clicks from homepage:
   - Tools reference: /docs/reference/tools (should be 2 clicks: Reference → Tools)
   - Workflow page: /docs/workflows/discovery (should be 2 clicks: Workflows → Discovery)
   - Best practices: /docs/best-practices/... (should be 2 clicks: Best Practices → topic)
   - Expected: ALL pages reachable in ≤3 clicks

4. **Verify folder group behavior:**
   - Guides, Workflows, Examples should appear as siblings (same indentation level)
   - Integration, Best Practices, Advanced should appear as siblings
   - **(guides) and (advanced) folder names should NOT appear in navigation or URLs**
   - **URLs should be /docs/guides/, /docs/workflows/ (no parentheses in URL)**

5. **Test navigation consistency:**
   - Navigate to 3-4 different pages
   - Verify navigation sidebar is identical on all pages
   - Verify current page is highlighted in navigation
   - Verify collapsible sections work correctly

6. **Verify icons render:**
   - Check each root section has an icon (Rocket, BookOpen, Workflow, Code, Library, Plug, CheckCircle, Settings)
   - Icons should be visible and correctly represent section content

7. **Test link functionality:**
   - Click through to tools documentation (/docs/reference/tools)
   - Verify internal links to tools from guides/workflows still work
   - No 404 errors, no broken links

8. **Visual hierarchy check:**
   - Clear visual distinction between groups
   - Separators (if implemented) clearly delineate sections
   - Navigation feels organized, not cluttered
   - Easy to scan and find desired section

9. **Build verification:**
   ```bash
   cd docs
   bun run build
   ```
   - Build completes successfully
   - No warnings about missing pages or broken links
   - Check build output for page count (should be similar to pre-restructure)

10. **Production build verification:**
    ```bash
    cd docs
    bun run start  # Serves production build
    ```
    - Navigate production site
    - Verify navigation works identically to development

**Expected results:**
- ✅ 3-4 top-level groups (not 8 flat sections)
- ✅ All pages reachable in ≤3 clicks
- ✅ Navigation identical across all pages
- ✅ Folder groups work correctly (no (guides) in navigation/URLs)
- ✅ Visual hierarchy clear and scannable
- ✅ All internal links functional
- ✅ Build succeeds with no warnings
- ✅ Icons render for all sections

**Common issues to check for:**
- ❌ Folder group names appearing in navigation/URLs
- ❌ Sections nested under folder groups instead of appearing as siblings
- ❌ Broken internal links to migrated tools
- ❌ Navigation different on different pages
- ❌ Build warnings about meta.json syntax errors
  </how-to-verify>
  <resume-signal>
Type "approved" if navigation structure meets all requirements (3-4 groups, ≤3 clicks, consistent navigation, clear hierarchy).

If issues found, describe specific problems:
- Which sections don't appear correctly?
- What navigation depth issues exist?
- Which links are broken?
- Any build errors or warnings?

Type "rollback" if critical issues require reverting to original structure.
  </resume-signal>
</task>

</tasks>

<verification>
- [ ] Root meta.json updated with final structure
- [ ] Separators implemented (syntax based on 02-01 verification)
- [ ] All sections have icons and descriptions
- [ ] root: true verified in all 7 sections
- [ ] Build succeeds with no warnings
- [ ] Human verification confirms navigation works as expected
- [ ] Folder group behavior verified (sections appear as siblings, not nested)
- [ ] Navigation depth ≤3 clicks verified
- [ ] Visual hierarchy clear and organized
</verification>

<success_criteria>
Documentation navigation consolidated from 8 flat root sections to 3-4 organized groups. Users can reach any page in ≤3 clicks. Visual hierarchy clear with separators and logical grouping. Navigation consistent across all pages. Folder groups work correctly without appearing in URLs. All NAV-01 through NAV-04 requirements satisfied.
</success_criteria>

<output>
After completion, create `.planning/phases/02-navigation-restructuring/02-03b-SUMMARY.md` following the summary template with:
- Navigation structure before/after comparison
- Syntax features used (based on 02-01 verification results)
- Human verification results
- Any issues encountered and resolutions
- Metrics: sections consolidated, max navigation depth achieved
- Confirmation of folder group behavior (siblings, clean URLs)
</output>
