---
phase: 02-navigation-restructuring
plan: 03a
type: execute
wave: 2
depends_on: [02-01, 02-02]
files_modified:
  - docs/content/docs/(guides)/
  - docs/content/docs/(guides)/guides/meta.json
  - docs/content/docs/(guides)/workflows/meta.json
  - docs/content/docs/(guides)/examples/meta.json
  - docs/content/docs/(advanced)/
  - docs/content/docs/(advanced)/integration/meta.json
  - docs/content/docs/(advanced)/best-practices/meta.json
  - docs/content/docs/(advanced)/advanced/meta.json
autonomous: true

must_haves:
  truths:
    - "Documentation sections organized into folder groups"
    - "Folder groups verified working from Plan 02-01"
    - "URLs remain clean without parentheses"
  artifacts:
    - path: "docs/content/docs/(guides)/guides/meta.json"
      provides: "Guides root folder configuration"
      contains: "root.*true"
    - path: "docs/content/docs/(guides)/workflows/meta.json"
      provides: "Workflows root folder configuration"
      contains: "root.*true"
    - path: "docs/content/docs/(advanced)/integration/meta.json"
      provides: "Integration root folder configuration"
      contains: "root.*true"
  key_links:
    - from: ".planning/phases/02-navigation-restructuring/syntax-support.md"
      to: "folder group implementation"
      via: "verified syntax patterns"
      pattern: "Folder Group Behavior Details"
---

<objective>
Create folder groups and migrate documentation sections into logical organizational structure.

Purpose: Based on syntax support verification from Plan 02-01, create (guides) and (advanced) folder groups to organize related documentation sections without adding URL hierarchy depth. This plan focuses on folder creation and file migration with git history preservation.

Output:
- (guides) folder group containing guides, workflows, examples
- (advanced) folder group containing integration, best-practices, advanced
- All sections migrated with git history preserved
- $schema paths updated for new directory structure
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
@C:/GitHub/datagvat-mcp/.planning/phases/02-navigation-restructuring/migration-map.md

# Current state after Plan 02-02
@C:/GitHub/datagvat-mcp/docs/content/docs/meta.json
@C:/GitHub/datagvat-mcp/docs/content/docs/reference/meta.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Verify syntax support and create (guides) folder group</name>
  <files>
    docs/content/docs/(guides)/
    docs/content/docs/(guides)/guides/meta.json
    docs/content/docs/(guides)/workflows/meta.json
    docs/content/docs/(guides)/examples/meta.json
  </files>
  <action>
**Step 1: Verify syntax-support.md documents folder group support:**
```bash
cat .planning/phases/02-navigation-restructuring/syntax-support.md
```

Confirm folder groups are WORKS status. If syntax-support.md indicates folder groups are UNSUPPORTED, STOP and report blocker to user.

**Step 2: Create (guides) folder group and migrate sections:**
```bash
cd C:/GitHub/datagvat-mcp/docs/content/docs
mkdir "(guides)"
git mv guides "(guides)/guides"
git mv workflows "(guides)/workflows"
git mv examples "(guides)/examples"
```

**Step 3: Update $schema paths in moved folders:**
Each moved folder's meta.json needs $schema updated:
- FROM: `"$schema": "../.source/json-schema/docs.meta.json"`
- TO: `"$schema": "../../.source/json-schema/docs.meta.json"`

Files to update:
- (guides)/guides/meta.json
- (guides)/workflows/meta.json
- (guides)/examples/meta.json

**Step 4: Verify root: true in all three:**
- guides/meta.json should have "root": true
- workflows/meta.json should have "root": true
- examples/meta.json should have "root": true

**Why folder groups:**
- Parentheses syntax `(guides)` creates logical grouping in file system
- Folders inside appear as siblings in navigation (not nested)
- URLs remain clean: /docs/guides/, /docs/workflows/ (no /docs/(guides)/ in URL)
- File system organization without navigation depth penalty
  </action>
  <verify>
1. **Verify syntax support documented:** cat .planning/phases/02-navigation-restructuring/syntax-support.md shows folder groups as WORKS status
2. ls docs/content/docs/(guides) shows guides/, workflows/, examples/
3. git status shows renamed paths with folder group syntax
4. All moved meta.json files have updated $schema paths with ../../
5. grep "root.*true" docs/content/docs/(guides)/*/meta.json shows 3 matches
6. **Build verification:** cd docs && bun run build completes successfully
  </verify>
  <done>
syntax-support.md confirms folder groups work, (guides) folder group created, documentation sections moved with git history preserved, $schema paths updated, root: true verified, build succeeds.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create (advanced) folder group and migrate advanced sections</name>
  <files>
    docs/content/docs/(advanced)/
    docs/content/docs/(advanced)/integration/meta.json
    docs/content/docs/(advanced)/best-practices/meta.json
    docs/content/docs/(advanced)/advanced/meta.json
  </files>
  <action>
Create (advanced) folder group to organize advanced topics sections:

**Create (advanced) folder group:**
```bash
cd C:/GitHub/datagvat-mcp/docs/content/docs
mkdir "(advanced)"
git mv integration "(advanced)/integration"
git mv best-practices "(advanced)/best-practices"
git mv advanced "(advanced)/advanced"
```

**Update $schema paths in (advanced) folders:**
Each moved folder's meta.json needs $schema updated:
- FROM: `"$schema": "../.source/json-schema/docs.meta.json"`
- TO: `"$schema": "../../.source/json-schema/docs.meta.json"`

Files to update:
- (advanced)/integration/meta.json
- (advanced)/best-practices/meta.json
- (advanced)/advanced/meta.json

**Verify root: true in all three:**
- integration/meta.json should have "root": true
- best-practices/meta.json should have "root": true
- advanced/meta.json should have "root": true
  </action>
  <verify>
1. ls docs/content/docs/(advanced) shows integration/, best-practices/, advanced/
2. git status shows renamed paths with folder group syntax
3. All moved meta.json files have updated $schema paths with ../../
4. grep "root.*true" docs/content/docs/(advanced)/*/meta.json shows 3 matches
5. **Build verification:** cd docs && bun run build completes successfully
  </verify>
  <done>
(advanced) folder group created, advanced sections moved with git history preserved, $schema paths updated, root: true verified, build succeeds.
  </done>
</task>

</tasks>

<verification>
- [ ] syntax-support.md verified to document folder groups as working
- [ ] Folder group (guides) created with documentation sections
- [ ] Folder group (advanced) created with advanced sections
- [ ] Sections moved into appropriate folder groups with git mv
- [ ] $schema paths updated in all moved meta.json files
- [ ] root: true verified in all 6 sections
- [ ] Build succeeds with no errors
</verification>

<success_criteria>
Folder groups created and documentation sections migrated with preserved git history. All $schema paths updated correctly. Build succeeds. Ready for Plan 02-03b to update root meta.json and verify navigation rendering.
</success_criteria>

<output>
After completion, create `.planning/phases/02-navigation-restructuring/02-03a-SUMMARY.md` following the summary template with:
- Sections migrated count (6 sections)
- Git history preservation confirmation
- Build and validation results
- Folder group creation verified
- Any unexpected issues during migration
</output>
