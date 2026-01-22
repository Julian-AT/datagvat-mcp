# Phase 7: OpenAPI Integration - Research

**Researched:** 2026-01-22
**Domain:** OpenAPI documentation generation with Fumadocs
**Confidence:** HIGH

## Summary

OpenAPI integration with Fumadocs allows automatic generation of interactive API documentation from OpenAPI 3.0/3.1 schemas. The project already has the foundation in place with `fumadocs-openapi` v10.2.5 installed and basic configuration established.

The standard approach involves: (1) downloading the OpenAPI schema from data.gv.at, (2) configuring the OpenAPI server instance to point to the schema, (3) integrating virtual pages via the loader API, (4) setting up automatic weekly updates via GitHub Actions.

The existing setup uses the **virtual pages approach** (openapiSource in loader), which dynamically generates pages at build time without creating physical MDX files. This is the recommended pattern for schemas that may change frequently.

**Primary recommendation:** Update the existing OpenAPI configuration to point to data.gv.at schema, create a download script for schema fetching with validation, and implement a weekly GitHub Actions workflow for automatic updates.

## Standard Stack

The established libraries/tools for OpenAPI documentation with Fumadocs:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-openapi | 10.2.5 | OpenAPI doc generation | Official Fumadocs integration, handles schema parsing and UI rendering |
| shiki | ^3.21.0 | Syntax highlighting | Required peer dependency for code samples in API docs |
| fumadocs-core | ^16.4.7 | Loader infrastructure | Provides source loader API for page tree integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| openapi-types | latest | TypeScript types | Advanced customization of media adapters and code samples |
| json-schema-typed | latest | JSON Schema types | Advanced type safety for schema manipulation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Virtual pages (openapiSource) | Static MDX generation (generateFiles) | Static files better for version control tracking, virtual pages better for frequent schema changes |
| fumadocs-openapi | Scalar, Redocly, Swagger UI | Fumadocs provides tighter integration with existing doc site, consistent theme/UX |

**Installation:**
```bash
# Already installed in project
bun add fumadocs-openapi shiki
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── lib/
│   ├── openapi.ts           # OpenAPI server instance configuration
│   └── source.tsx            # Loader configuration with openapiSource
├── components/
│   └── api-page.tsx          # APIPage UI component factory
├── scripts/
│   └── download-openapi.ts   # Schema download and validation script
├── data.gv.at-openapi.yaml   # Downloaded OpenAPI schema (gitignored or committed)
└── app/
    └── [lang]/docs/[[...slug]]/page.tsx  # Detects type='openapi' and renders APIPage
```

### Pattern 1: Virtual Pages via Loader (Recommended for Frequent Updates)
**What:** Use openapiSource to generate pages dynamically at build time without creating physical files.
**When to use:** Schema changes frequently, prefer clean git history, automated updates expected.
**Example:**
```typescript
// lib/source.tsx
import { loader, multiple } from 'fumadocs-core/source';
import { openapiPlugin, openapiSource } from 'fumadocs-openapi/server';
import { openapi } from '@/lib/openapi';
import { docs } from '../.source/server';

export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
    openapi: await openapiSource(openapi, {
      baseDir: 'openapi/(generated)', // Virtual path in page tree
    }),
  }),
  {
    baseUrl: '/docs',
    plugins: [openapiPlugin()],
  },
);
```

### Pattern 2: OpenAPI Server Configuration
**What:** Create a server-side OpenAPI instance that references the schema file.
**When to use:** Always required - central configuration for schema location.
**Example:**
```typescript
// lib/openapi.ts
import path from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';

export const openapi = createOpenAPI({
  input: [path.resolve('./data.gv.at-openapi.yaml')],
  proxyUrl: '/api/proxy', // Optional: for API playground requests
});
```

### Pattern 3: Schema Download Script
**What:** Automated script to fetch, validate, and store OpenAPI schema.
**When to use:** Always for external schemas - ensures schema is available at build time.
**Example:**
```typescript
// scripts/download-openapi.ts
const SCHEMA_URL = 'https://qs.data.gv.at/api/hub/repo/openapi.yaml';
const OUTPUT_PATH = './data.gv.at-openapi.yaml';

async function downloadSchema() {
  console.log('✓ Downloading OpenAPI schema...');
  const response = await fetch(SCHEMA_URL);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const yaml = await response.text();

  // Basic validation - check for openapi version
  if (!yaml.includes('openapi:')) {
    throw new Error('Invalid OpenAPI schema: missing openapi field');
  }

  await Bun.write(OUTPUT_PATH, yaml);
  console.log(`✓ Schema saved to ${OUTPUT_PATH}`);
}

downloadSchema().catch(console.error);
```

### Pattern 4: Page Detection and Rendering
**What:** Detect OpenAPI pages by type and render with APIPage component.
**When to use:** Already implemented in existing page.tsx.
**Example:**
```typescript
// app/[lang]/docs/[[...slug]]/page.tsx
if (page.data.type === 'openapi') {
  const { APIPage } = await import('@/components/api-page');
  return (
    <DocsPage>
      <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
      <DocsBody>
        <APIPage {...page.data.getAPIPageProps()} />
      </DocsBody>
    </DocsPage>
  );
}
```

### Anti-Patterns to Avoid
- **Committing node_modules schemas:** Never reference schema files from node_modules - they disappear in production builds
- **Missing validation:** Always validate downloaded schemas before using them - corrupted YAML breaks builds
- **Hardcoded URLs in multiple places:** Use environment variables or constants for schema URLs
- **No error handling in download scripts:** Network failures should fail gracefully with clear messages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI schema parsing | Custom YAML parser + schema walker | fumadocs-openapi createOpenAPI | Handles OpenAPI 3.0/3.1 spec nuances, refs, inheritance |
| API playground | Custom request builder | OpenAPI proxy + built-in playground | CORS handling, authentication, request examples |
| Code sample generation | Template strings per language | generateCodeSamples option + mediaAdapters | Handles multiple languages, media types, escaping |
| Schema validation | String checks | OpenAPI spec validator library | Validates refs, schemas, required fields |
| Page tree integration | Manual page creation | openapiSource + openapiPlugin | Automatic navigation, metadata, type inference |

**Key insight:** OpenAPI schemas are complex with $refs, allOf, oneOf, discriminators. fumadocs-openapi handles these correctly. Custom parsing will miss edge cases.

## Common Pitfalls

### Pitfall 1: Schema Not Available at Build Time
**What goes wrong:** Build fails with "ENOENT: no such file or directory" when referencing OpenAPI schema.
**Why it happens:** Schema file not downloaded before build, or path is incorrect.
**How to avoid:**
- Run download script in prebuild or as separate CI step before build
- Use absolute paths with path.resolve() in openapi.ts
- Verify file exists in prebuild script
**Warning signs:** Build works locally but fails in CI, or fails after clean install

### Pitfall 2: Schema URL Changes Break Automation
**What goes wrong:** Weekly update downloads empty/404 response, builds fail silently or with wrong content.
**Why it happens:** No validation of downloaded content, no error detection.
**How to avoid:**
- Validate schema format (check for 'openapi:' field and version)
- Check response.ok before writing
- Use response.status to distinguish 404 vs 500 vs 200
- Commit downloaded schema so builds don't depend on external URL availability
**Warning signs:** Builds suddenly fail after automated update runs

### Pitfall 3: Breaking Schema Changes
**What goes wrong:** Upstream schema changes structure, existing docs break or show wrong information.
**Why it happens:** No review of schema changes before deploying.
**How to avoid:**
- Commit schema file to git for review in PRs
- Use GitHub Actions that create PR instead of direct commit
- Add diff step in workflow to show what changed
- Consider schema versioning or changelog monitoring
**Warning signs:** API docs suddenly missing endpoints or showing errors

### Pitfall 4: Virtual Pages Not Updating
**What goes wrong:** Schema updated but docs still show old content.
**Why it happens:** Build cache not invalidated, or loader cache stale.
**How to avoid:**
- Clear .next directory in prebuild when schema changes
- Use revalidate: false in page.tsx (already set)
- Ensure openapiSource is called with await
**Warning signs:** Schema file updated but rendered docs unchanged

### Pitfall 5: Missing OpenAPI CSS/Styles
**What goes wrong:** API docs render but look broken - missing colors, layout issues.
**Why it happens:** OpenAPI preset not imported in global CSS.
**How to avoid:**
- Import fumadocs-openapi/ui preset in globals.css after other Fumadocs presets
- Verify preset order: base Tailwind → fumadocs-ui → fumadocs-openapi
**Warning signs:** API pages render but styling is incomplete or default

### Pitfall 6: GitHub Actions Cron Never Runs
**What goes wrong:** Weekly schedule configured but workflow never executes.
**Why it happens:** Scheduled workflows disabled after 60 days of no repo activity (GitHub policy).
**How to avoid:**
- Add workflow_dispatch trigger for manual runs
- Test with manual trigger first before relying on schedule
- Document that schedules may pause in low-activity repos
**Warning signs:** Workflow file exists but no runs in Actions tab

## Code Examples

Verified patterns from official sources:

### Complete Download Script with Validation
```typescript
// scripts/download-openapi.ts
// Source: https://www.fumadocs.dev/docs/integrations/openapi
const SCHEMA_URL = 'https://qs.data.gv.at/api/hub/repo/openapi.yaml';
const OUTPUT_PATH = './docs/data.gv.at-openapi.yaml';

async function main() {
  console.log('Downloading OpenAPI schema...');
  console.log(`  Source: ${SCHEMA_URL}`);
  console.log(`  Target: ${OUTPUT_PATH}`);

  try {
    const response = await fetch(SCHEMA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const yaml = await response.text();

    // Validate it's an OpenAPI schema
    if (!yaml.includes('openapi:')) {
      throw new Error('Invalid schema: missing "openapi:" field');
    }

    // Check version (3.0 or 3.1 required)
    const versionMatch = yaml.match(/openapi:\s*['"]?(\d+\.\d+)/);
    if (!versionMatch || !['3.0', '3.1'].includes(versionMatch[1])) {
      throw new Error(`Unsupported OpenAPI version: ${versionMatch?.[1] || 'unknown'}`);
    }

    await Bun.write(OUTPUT_PATH, yaml);

    console.log('✓ Schema downloaded successfully');
    console.log(`  Version: OpenAPI ${versionMatch[1]}`);
    console.log(`  Size: ${(yaml.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('✗ Failed to download schema');
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
```

### GitHub Actions Weekly Update Workflow
```yaml
# .github/workflows/update-openapi.yml
# Source: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
name: Update OpenAPI Schema

on:
  schedule:
    # Run every Monday at 09:00 UTC (weekly)
    - cron: '0 9 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Download latest OpenAPI schema
        run: |
          cd docs
          bun run scripts/download-openapi.ts

      - name: Check for changes
        id: check
        run: |
          cd docs
          if git diff --quiet data.gv.at-openapi.yaml; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.check.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: |
            docs: update data.gv.at OpenAPI schema

            Automated weekly update from https://qs.data.gv.at/api/hub/repo/openapi.yaml
          branch: update-openapi-schema
          delete-branch: true
          title: 'docs: Update data.gv.at OpenAPI schema'
          body: |
            ## Automated OpenAPI Schema Update

            This PR updates the OpenAPI schema from data.gv.at.

            **Source:** https://qs.data.gv.at/api/hub/repo/openapi.yaml
            **Triggered:** Weekly schedule (Monday 09:00 UTC)

            ### Review Checklist
            - [ ] Verify no breaking changes in schema structure
            - [ ] Check that new endpoints are documented correctly
            - [ ] Ensure removed endpoints don't break existing links

            ### Changes
            View the diff to see what changed in the OpenAPI schema.
```

### OpenAPI Server with Error Handling
```typescript
// lib/openapi.ts
// Source: https://www.fumadocs.dev/docs/integrations/openapi/server
import path from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';

const SCHEMA_PATH = path.resolve('./data.gv.at-openapi.yaml');

// Validate schema file exists before creating instance
// This fails fast with clear error rather than cryptic build errors
if (!await Bun.file(SCHEMA_PATH).exists()) {
  throw new Error(
    `OpenAPI schema not found: ${SCHEMA_PATH}\n` +
    'Run: bun run scripts/download-openapi.ts'
  );
}

export const openapi = createOpenAPI({
  input: [SCHEMA_PATH],
  // Optional: Add proxy for API playground
  // proxyUrl: '/api/openapi-proxy',
});
```

### Loader Configuration with Multiple Sources
```typescript
// lib/source.tsx
// Source: https://www.fumadocs.dev/docs/integrations/openapi/generate-files
import { loader, multiple } from 'fumadocs-core/source';
import { openapiPlugin, openapiSource } from 'fumadocs-openapi/server';
import { openapi } from '@/lib/openapi';
import { docs } from '../.source/server';

export const source = loader(
  multiple({
    // MDX content from content/docs
    docs: docs.toFumadocsSource(),
    // OpenAPI virtual pages
    openapi: await openapiSource(openapi, {
      baseDir: 'api-reference', // Appears in navigation under /docs/api-reference
    }),
  }),
  {
    baseUrl: '/docs',
    plugins: [openapiPlugin()],
  },
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static MDX generation with generateFiles | Virtual pages with openapiSource | fumadocs-openapi v10+ | Cleaner git history, easier automation, no manual file cleanup |
| Manual code samples in schema | generateCodeSamples function | fumadocs-openapi v10+ | Type-safe, programmatic control over examples |
| Global CSS import order flexible | OpenAPI preset must load after base | fumadocs-openapi v10+ | Broken styling if wrong order |
| Node.js fetch | Bun native fetch | Project decision | Faster, built-in, consistent with project runtime |

**Deprecated/outdated:**
- **generateFiles for automated workflows:** Still supported but openapiSource preferred for frequent updates
- **Referencing schema in node_modules:** Never worked reliably, always download separately
- **x-code-samples extension:** Still works but generateCodeSamples function preferred for type safety

## Open Questions

Things that couldn't be fully resolved:

1. **Does data.gv.at OpenAPI schema include all endpoints needed?**
   - What we know: Schema URL is https://qs.data.gv.at/api/hub/repo/openapi.yaml
   - What's unclear: Whether schema is complete, what version (3.0 vs 3.1), quality of descriptions
   - Recommendation: Download and inspect schema in first task, validate completeness

2. **Should OpenAPI schema be gitignored or committed?**
   - What we know: Committing enables review of changes, gitignoring keeps git history clean
   - What's unclear: User preference, repo policy
   - Recommendation: Commit it - enables PR review of schema changes, ensures builds work offline

3. **Should API docs be in separate section or integrated with guides?**
   - What we know: baseDir controls navigation placement
   - What's unclear: User preference for navigation structure
   - Recommendation: Use baseDir: 'api-reference' for clear separation, can adjust based on feedback

4. **Is API playground/proxy needed?**
   - What we know: Requires server-side proxy route to avoid CORS
   - What's unclear: Whether users need to test API calls from docs
   - Recommendation: Skip initially (proxyUrl optional), add if requested

## Sources

### Primary (HIGH confidence)
- https://www.fumadocs.dev/docs/integrations/openapi - OpenAPI integration guide
- https://www.fumadocs.dev/docs/integrations/openapi/generate-files - File generation patterns
- https://www.fumadocs.dev/docs/integrations/openapi/api-page - APIPage component configuration
- https://www.fumadocs.dev/docs/integrations/openapi/server - OpenAPI server instance setup
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows - GitHub Actions triggers
- https://bun.sh/docs/api/http - Bun fetch and HTTP API

### Secondary (MEDIUM confidence)
- Existing project code (lib/openapi.ts, lib/source.tsx, components/api-page.tsx) - Shows current patterns
- package.json - Confirms fumadocs-openapi v10.2.5 installed

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation, package already installed, version confirmed
- Architecture: HIGH - Official examples, existing code matches patterns
- Pitfalls: MEDIUM-HIGH - Based on official docs warnings and common OpenAPI integration issues
- Download/automation: HIGH - GitHub Actions official docs, Bun fetch API documented

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - Fumadocs stable, OpenAPI spec stable)
